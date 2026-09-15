// File: src/engine/SimulationEngine.js

// 1. IMPOR ComponentDefs
import { CircuitStore } from '../state/CircuitStore.js';
import { ComponentRegistry, BaseComponent } from './models/index.js';
import { ComponentDefs } from '../components/index.js';
import { AudioManager } from './AudioManager.js';
import { updateWireStates } from '../canvas/WireManager.js';

// Helper di level modul (hanya dialokasikan 1x di RAM)
function toHash(val) {
    if (typeof val === 'number') return val | 0;
    const str = String(val);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h;
}

export const SimulationEngine = {
    isRunning: false,
    nodes: [],         // Menyimpan titik simpul (persimpangan kabel) kelistrikan
    nodeVoltage: [],   // Menyimpan nilai tegangan untuk masing-masing node
    nodeMap: {},       // [BARU] Peta jalan memori (Cache) untuk pencarian pin super cepat
    simTime: 0,        // Waktu simulasi virtual (dalam detik)
    accumulator: 0,    // Penampung sisa waktu
    FIXED_DT: 0.001,   // Kecepatan mesin fisika: 1 milidetik (1000 Hz)
    
    getNodeIndex(compId, type, pinIndex) {
        const pinId = `${compId}-${type}-${pinIndex}`;
        return this.nodeMap && this.nodeMap[pinId] !== undefined ? this.nodeMap[pinId] : -1;
    },
    
    // ─── LANGKAH 1: HELPER FISIKA SEMIKONDUKTOR (NEWTON-RAPHSON) ───
    DiodePhysics: {
        VT: 0.02585, // Tegangan termal (Thermal Voltage) pada suhu ruang 300K (~26mV)
        
        // FUNGSI 1: Damping (PNJLIMIT)
        // Mencegah tebakan tegangan melompat terlalu jauh dan menghasilkan Infinity
        limitVoltageStep(vNew, vOld) {
            const Vcrit = 0.6; // Titik kritis transisi kurva mulai menanjak
            const VT = this.VT;
            
            // Jika tegangan baru naik drastis melampaui Vcrit, paksa naiknya pelan-pelan (logaritmik)
            if (vNew > Vcrit && vNew > vOld) {
                if (vOld > 0) {
                    return vOld + VT * Math.log(1 + (vNew - vOld) / VT);
                } else {
                    return VT * Math.log(vNew / VT);
                }
            }
            // Jika tegangan turun atau masih aman, biarkan saja
            return vNew;
        },

        // FUNGSI 2: Linearisasi Newton-Raphson
        // Mengubah kurva eksponensial LED menjadi Resistor & Sumber Arus sementara
        linearize(vD, Is, n) {
            const nVt = n * this.VT;
            
            // PENGAMAN MATH: Cegah eksponensial meledak (Maksimal e^40)
            let vLimit = vD;
            if (vLimit > 40 * nVt) vLimit = 40 * nVt; 

            // Persamaan Dioda Shockley
            const expTerm = Math.exp(vLimit / nVt);
            const Id = Is * (expTerm - 1); 
            
            // Konduktansi Dinamis (Geq = Turunan dI/dV)
            let Geq = (Is / nVt) * expTerm;
            
            // Batas minimum konduktansi (Cegah pembagian dengan nol / Resistansi tak terhingga)
            if (Geq < 1e-12) Geq = 1e-12; 

            // Arus Ekuivalen Bayangan (Ieq) untuk menipu matriks Gauss-Seidel
            const Ieq = Id - (Geq * vLimit);

            return { Geq, Ieq, Id };
        }
    },

    toggle() {
        this.isRunning = !this.isRunning;
        CircuitStore.isSimulationActive = this.isRunning;

        if (this.isRunning) {
            AudioManager.init();
            AudioManager.resume();
            // Sinkronisasi Timer internal saat play ditekan
            CircuitStore.components.forEach(c => {
                if (c.type === 'clock_pulse' || c.type === 'flasher') {
                    c._lastToggle = Date.now();
                }
            });
            
            this.buildElectricalNodes(); 
            this.run();
        } else {
            this.stop();
        }    
    },

    stop() {
        this.isRunning = false;
        CircuitStore.isSimulationActive = false;
        AudioManager.suspend();
            
        // Reset waktu simulasi virtual
        this.simTime = 0;
        this.accumulator = 0;
        
        // Reset semua nilai simulasi ke 0 saat mesin dimatikan
        CircuitStore.components.forEach(c => {
            c.simV = 0;
            c.simI = 0;
            c.rpm = 0;
            c.simV_vcc = 0; // 🟢 FIX BUG: Paksa matikan voltase VCC semua IC ke 0V!
            
            if (c.inputStates) c.inputStates.fill(0);
            c.outputState = 0;
                
            if (c.type === 'capacitor') {
                c.chargeV = 0;
                if (c.vHistory) {
                    c.vHistory[0] = 0; 
                    c.vHistory[1] = 0; 
                }
            }
            if (c.type === 'clock_pulse') {
                c.state = c.initialState !== undefined ? c.initialState : '0';
                c._lastToggle = Date.now(); // Reset sinkronisasi timer
            }
            if (['ic_4017', 'ic_4518', 'ic_4518_dual', 'ic_4511', 'ic_4026', 'ic_7448', 'ic_74LS90', 'ic_4051'].includes(c.type)) {
                c.counter = undefined;     
                c.count = undefined;       
                c.countA = 0; 
                c.countB = 0;                 
            if (c.type === 'ic_4051') {
                    c.activeChannel = -1; // Putuskan semua saluran
                    c.isActive = false;
                    c.isPowered = false;
            }
            if (c.type === 'ic_7805' || c.type === 'ic_7808') {
                c.state = 'off';
                c.simV_out = 0;
            }
            if (c.type === 'sensor_lm35') {
                c.simState = 'off';
                c.simV_out = 0;
            }
                c.latchedVal = undefined;  
                c.prevClock = undefined;
                c.lastClk = undefined;   
                c.lastClkA = undefined; 
                c.lastClkB = undefined; 
                
                if (c.outputStates) c.outputStates.fill(0);
                if (c.outStates) {
                    for(let i=0; i<c.outStates.length; i++) {
                        c.outStates[i] = (typeof c.outStates[i] === 'boolean') ? false : 0;
                    }
                }
            }
            if (c.type === 'motor_dc') {
                c.currentRpm = 0; // rpm tampilan sudah 0 di atas, currentRpm internal juga harus 0
            }
            if (c.type === 'arduino_uno') {
                if (c.pinStates) c.pinStates.fill(0); // Matikan semua output pin internal
                c.hasCompiled = false; // Paksa mesin mengkompilasi ulang kode JS saat tombol Play ditekan
            }
            if (c.type === 'servo') {
                c.servoAngle = 0;
                c.isPowered = false;
            }
            if (c.type === 'solenoid') {
                c.plungerPos = 0;
                c.plungerVel = 0;
                c.strokePercent = 0;
            }
            if (c.type === 'logic_probe') {
                c.logicState = 'Z';
            }    
            if (['ff_d', 'ff_t', 'ff_jk', 'ff_sr'].includes(c.type)) {
                c.prevClock = undefined; // Sama seperti ic_4017: paksa baca ulang edge saat Play ditekan
            }    
            
            // Perbarui visual (matikan LED, kembalikan warna IC, dll)
            const contentDiv = document.getElementById(`content-${c.id}`);
            if (contentDiv && typeof ComponentDefs !== 'undefined') {
                ComponentDefs.updateDOMState(c.type, c, contentDiv, c.id);
            }
        });
    },

    run() {
        if (!CircuitStore.isSimulationActive && !this.isRunning) return;

        // Validasi instansiasi OOP
        for (let i = 0; i < CircuitStore.components.length; i++) {
            const comp = CircuitStore.components[i];
            if (!(comp instanceof BaseComponent)) {
                const ComponentClass = ComponentRegistry[comp.type] || BaseComponent;
                CircuitStore.components[i] = new ComponentClass(comp);
            }
        }

        const compLen = CircuitStore.components.length;
        const connLen = CircuitStore.connections.length;

// Di dalam fungsi run() SimulationEngine:
let connChecksum = 0;
for (let i = 0; i < connLen; i++) {
    const c = CircuitStore.connections[i];
    
    const srcId = toHash(c.source.compId);
    const tgtId = toHash(c.target.compId);
    const srcPin = c.source.pinIndex | 0;
    const tgtPin = c.target.pinIndex | 0;

    // Bitwise OR (| 0) memastikan tidak ada angka desimal atau overflow melebihi 32-bit
    connChecksum = (connChecksum + ((srcId * 7) ^ (tgtId * 13) ^ (srcPin * 17) ^ (tgtPin * 31))) | 0;
}

        // Cek rekonstruksi graf kelistrikan
        if (CircuitStore.topologyChanged || 
            this._lastCompCount !== compLen || 
            this._lastConnCount !== connLen || 
            this._lastConnChecksum !== connChecksum) { // <-- Pengecekan baru
            
            this.buildElectricalNodes();
            this._lastCompCount = compLen;
            this._lastConnCount = connLen;
            this._lastConnChecksum = connChecksum; // <-- Simpan checksum terbaru
            CircuitStore.topologyChanged = false;
        }
        
        if (!CircuitStore.isSimulationActive && !this.isRunning) return;

        // 🟢 PEROMBAKAN UTAMA: PENGATUR WAKTU (TIME ENGINE)
        const now = Date.now();
        if (!this.lastTime) this.lastTime = now;
        
        // Waktu dunia nyata yang berlalu sejak frame terakhir (dalam detik)
        let frameTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Cegah "Death Spiral" (Jika tab browser disembunyikan/pindah tab, batasi lonjakan waktu)
        if (frameTime > 0.1) frameTime = 0.1; 

        // Masukkan waktu dunia nyata ke penampung (accumulator)
        this.accumulator += frameTime;

        // 🟢 LOOPING FISIKA: Mesin mengejar ketertinggalan waktu (Oversampling)
        // Jika FIXED_DT = 0.001 (1ms), dan frame layar (16ms), loop ini akan jalan ~16x per frame layar.
        while (this.accumulator >= this.FIXED_DT) {
            this.stepPhysics(this.FIXED_DT);
            this.accumulator -= this.FIXED_DT;
            this.simTime += this.FIXED_DT; // Majukan jam virtual
        }
        
        // 🟢 RENDER LAYAR: Hanya dilakukan 1x setiap frame (60 FPS) agar UI tidak nge-lag
        this.updateVisuals();
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.run());
        }
    },

    // 🟢 FUNGSI BARU: MENANGANI 1 LANGKAH FISIKA (Dieksekusi berkali-kali per frame)
    stepPhysics(dt) {
        // Berikan waktu virtual simulasi dalam format milidetik agar komponen lawas tidak kaget
        const nowMs = this.simTime * 1000; 

        CircuitStore.components.forEach(comp => {
            if (comp.onTimeUpdate) comp.onTimeUpdate(dt, nowMs);
        });

        // 1 Kali perhitungan Digital & Analog per langkah
        this.solveDigitalLogic();
        this.solveAnalogPhysics();
    },

    solveDigitalLogic() {
        CircuitStore.components.forEach(comp => {
            this.updateInputStates(comp);
            // Flip-Flop (D, T, JK, SR) dan IC 4017 membutuhkan nilai (iter === 4) 
            // agar mereka mau merekam status Clock sebelumnya (prevClock).
            if (comp.solveDigital) comp.solveDigital(this, 4); 
        });
    },

    solveAnalogPhysics() {
        if (!this.nodes || this.nodes.length === 0) return;
        const MAX_ITER = Math.min(300, Math.max(60, this.nodes.length * 3));
        const EPSILON = 0.001; 
        let lastError = Infinity;
        let stagnationCount = 0;

        for (let i = 0; i < MAX_ITER; i++) {
            let maxError = 0;
            const fixedNodes = new Array(this.nodes.length).fill(false);
            const sumVR = new Array(this.nodes.length).fill(0);
            const sum1R = new Array(this.nodes.length).fill(0);

            // A. DELEGASI TEGANGAN SUMBER
            CircuitStore.components.forEach(comp => {
                if (comp.applyFixedVoltage) comp.applyFixedVoltage(this, fixedNodes, i);
            });

            // B. DELEGASI RUMUS MATRIKS KIRCHHOFF
            CircuitStore.components.forEach(comp => {
                if (comp.injectMatrix) comp.injectMatrix(this, sumVR, sum1R, i);
            });

            // C. RELAKSASI GAUSS-SEIDEL (ENGINE INTI)
            for (let n = 0; n < this.nodes.length; n++) {
                if (sum1R[n] > 0 && !fixedNodes[n]) { 
                    const newVal = sumVR[n] / sum1R[n];
                    const blendedVal = (this.nodeVoltage[n] * 0.5) + (newVal * 0.5);
                    const diff = Math.abs(blendedVal - this.nodeVoltage[n]);
                    if (diff > maxError) maxError = diff;
                    this.nodeVoltage[n] = blendedVal;
                }
            }

            // D. DETEKSI STAGNASI (Pencegah Lag / Osilasi)
            if (maxError < EPSILON) break; 
            if (Math.abs(maxError - lastError) < EPSILON * 0.1) {
                stagnationCount++;
                if (stagnationCount >= 8) break;
            } else {
                stagnationCount = 0;
            }
            lastError = maxError;
        }

        // E. DELEGASI BACA HASIL
        CircuitStore.components.forEach(comp => {
            if (comp.applyResults) comp.applyResults(this);
        });
    },

    // -----------------------------------------------------------------
    // FASE 1: PEMBANGUNAN NODE KELISTRIKAN
    // -----------------------------------------------------------------
    buildElectricalNodes() {
        this.nodes = [];
        this.nodeVoltage = [];
        this.nodeMap = {}; // Reset peta memori
        
        const adjList = {};
        const getPinId = (compId, type, pinIndex) => `${compId}-${type}-${pinIndex}`;
        
        const addEdge = (pin1, pin2) => {
            if (!adjList[pin1]) adjList[pin1] = new Set();
            if (!adjList[pin2]) adjList[pin2] = new Set();
            adjList[pin1].add(pin2);
            adjList[pin2].add(pin1);
        };

        // 1. Baca koneksi fisik dari CircuitStore
        if (CircuitStore.connections) {
            CircuitStore.connections.forEach(conn => {
                const sType = conn.source.type || 'output';
                const tType = conn.target.type || 'input';
            
                const srcId = getPinId(conn.source.compId, sType, conn.source.pinIndex);
                const tgtId = getPinId(conn.target.compId, tType, conn.target.pinIndex);
                addEdge(srcId, tgtId);
            });
        }
        
        if (CircuitStore.components) {
            // 2. Gabungkan pin-pin internal komponen wire/junction
            CircuitStore.components.forEach(comp => {
                if (comp.type === 'wire_1to1' || comp.type === 'wire_1to2' || comp.type === 'junction' || comp.type === 'wire_node') {
                    const pins = [];
                    for (let i = 0; i < (comp.inputs || 0); i++) pins.push(getPinId(comp.id, 'input', i));
                    for (let i = 0; i < (comp.outputs || 0); i++) pins.push(getPinId(comp.id, 'output', i));
                    
                    for (let i = 0; i < pins.length - 1; i++) {
                        addEdge(pins[i], pins[i+1]);
                    }
                }
            });

            // 🟢 3. PERBAIKAN: JAHITAN KABEL VIRTUAL (NET TUNNEL)
            // Mengelompokkan semua tunnel berdasarkan nomor Channel-nya
            const tunnels = CircuitStore.components.filter(c => c.type === 'net_tunnel');
            const tunnelChannels = {};
            
            tunnels.forEach(t => {
                const ch = Number(t.customValue !== undefined ? t.customValue : 1);
                if (!tunnelChannels[ch]) tunnelChannels[ch] = [];
                tunnelChannels[ch].push(getPinId(t.id, 'input', 0));
            });
            
            // Sambungkan semua tunnel di channel yang sama dengan "addEdge"
            // Ini membuat mesin menganggap mereka tersambung oleh kabel 0 Ohm!
            for (const ch in tunnelChannels) {
                const pins = tunnelChannels[ch];
                for (let i = 0; i < pins.length - 1; i++) {
                    addEdge(pins[i], pins[i+1]); 
                }
            }
        }
        
        // 4. Graph Traversal untuk mengelompokkan node
        const visited = new Set();
        
        for (const pin in adjList) {
            if (!visited.has(pin)) {
                const nodeGroup = [];
                const queue = [pin];
                visited.add(pin);
                
                while (queue.length > 0) {
                    const currentPin = queue.shift();
                    nodeGroup.push(currentPin);
                    
                    adjList[currentPin].forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    });
                }
                
                this.nodes.push(nodeGroup);
                this.nodeVoltage.push(0);
            }
        }

        // 5. Bangun nodeMap secara global untuk pencarian super cepat
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes[i].length; j++) {
                this.nodeMap[this.nodes[i][j]] = i;
            }
        }
    },

    // -----------------------------------------------------------------
    // HELPER & UTILITIES
    // -----------------------------------------------------------------
    updateInputStates(comp) {
        if (!comp.inputStates) comp.inputStates = new Array(comp.inputs).fill(0);
        if (comp.inputs === 0) return;

        for (let i = 0; i < comp.inputs; i++) {
            const conn = CircuitStore.connections.find(c => c.target.compId === comp.id && Number(c.target.pinIndex) === i);
            
            if (conn) {
                const srcComp = CircuitStore.components.find(c => c.id === conn.source.compId);
                if (srcComp) {
                    const logicTypes = ['switch', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'clock_pulse', 'ff_sr', 'ff_d', 'ff_jk', 'ff_t'];
                    const isLogicSource = logicTypes.includes(srcComp.type) || srcComp.type.startsWith('ic_') || srcComp.type.startsWith('ff_');

                    if (isLogicSource) {
                        const pinIdx = Number(conn.source.pinIndex);
                        let isHigh = false;

                        // Dukungan membaca array multi-output dari IC (misal IC 4017 / 4518 / 7448)
                        if (srcComp.outputStates && srcComp.outputStates[pinIdx] !== undefined) {
                            isHigh = srcComp.outputStates[pinIdx] === 1;
                        } else if (srcComp.outStates && srcComp.outStates[pinIdx] !== undefined) {
                            isHigh = Boolean(srcComp.outStates[pinIdx]);
                        } else {
                            isHigh = (srcComp.state === '1' || srcComp.outputState === 1);
                            if (pinIdx === 1) isHigh = !isHigh; // Pin inversi (Q-Bar)
                        }

                        comp.inputStates[i] = isHigh ? 1 : 0;
                    } else {
                        const myPinId = `${comp.id}-input-${i}`;
                        const nIdx = this.nodeMap && this.nodeMap[myPinId] !== undefined ? this.nodeMap[myPinId] : -1;
                        const voltage = nIdx !== -1 ? this.nodeVoltage[nIdx] : 0;
                        comp.inputStates[i] = voltage > 2.5 ? 1 : 0; 
                    }
                }
            } else {
                comp.inputStates[i] = 0; 
            }
        }
    },

    updateVisuals() {
        CircuitStore.components.forEach(comp => {
            const contentDiv = document.getElementById(`content-${comp.id}`);
            if (contentDiv && typeof ComponentDefs !== 'undefined') {
                ComponentDefs.updateDOMState(comp.type, comp, contentDiv, comp.id);
            }
        });
        if (typeof updateWireStates === 'function') updateWireStates();
    }
};