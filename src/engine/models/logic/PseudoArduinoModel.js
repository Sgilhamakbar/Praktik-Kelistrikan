// File: src/engine/models/logic/PseudoArduinoModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';
import { CircuitStore } from '../../../state/CircuitStore.js';

export class PseudoArduino extends BaseComponent {
    
    constructor(data) {
        super(data);
        this.pinModes = new Array(29).fill('INPUT'); 
        this.pinTargets = new Array(29).fill(0);     
        this.hasCompiled = false;
        
        // Memori khusus untuk fitur TONE (Audio)
        this.toneFreqs = new Array(29).fill(0);      
        this.lastToneTimes = new Array(29).fill(0); 
        this.startTime = 0;
    }

    solveDigital(engine, iter) {
        // Harus iterasi ke-4 agar sinkron dengan siklus digital Gauss-Seidel
        if (iter !== 4) return;

        // 🌟 BACA TEGANGAN PIN RESET (Indeks 21)
        const nReset = engine.getNodeIndex(this.id, 'input', 21);
        const vReset = nReset !== -1 ? (engine.nodeVoltage[nReset] || 5.0) : 5.0;

        // 🌟 PERBAIKAN 1: Deteksi Time-Travel & HARD RESET Hardware
        if (engine.simTime === 0 || engine.simTime < this.lastSimTime || vReset < 1.0) {
            this.hasCompiled = false; 
            this.toneFreqs.fill(0);
            this.lastToneTimes.fill(0);
            this.pinTargets.fill(0);
            
            // 🌟 KUNCI RESET MILLIS: Terus perbarui titik awal stopwatch selama tombol ditahan
            this.startTime = engine.simTime;
            
            // Jika kabel masih nempel di GND, Arduino mati suri
            if (vReset < 1.0) {
                this.lastSimTime = engine.simTime;
                return; 
            }
        }
        this.lastSimTime = engine.simTime;

        // ==============================================
        // 1. GENERATOR GELOMBANG AUDIO (TONE) BACKGROUND
        // ==============================================
        const now = engine.simTime;
        for (let i = 0; i < 29; i++) {
            if (this.toneFreqs[i] > 0 && this.pinModes[i] === 'OUTPUT') {
                // Batasi frekuensi maksimal di 400Hz agar mesin 1ms (1000Hz) tidak terlewat (Nyquist Theorem)
                const f = Math.min(this.toneFreqs[i], 400); 
                const halfPeriod = 1.0 / (2 * f);
                
                // Toggle / Flip-Flop tegangan untuk menciptakan suara
                if (now - this.lastToneTimes[i] >= halfPeriod) {
                    this.lastToneTimes[i] = now;
                    this.pinTargets[i] = this.pinTargets[i] > 2.5 ? 0.0 : 5.0; 
                }
            }
        }

        // ==============================================
        // 2. EKSEKUSI KODE PENGGUNA (SANDBOX)
        // ==============================================
        const userCode = this.customCode || `function setup() {} function loop() {}`;

        if (!this.hasCompiled) {
            try {
                const sandbox = new Function('api', `
                    const { 
                        pinMode, digitalWrite, digitalRead, analogRead, analogWrite, 
                        millis, HIGH, LOW, INPUT, OUTPUT, Serial, 
                        map, constrain, tone, noTone, Servo, LiquidCrystal_I2C,
                        pulseIn, delayMicroseconds 
                    } = api;
                    ${userCode}
                    return { setup, loop };
                `);

                this.program = sandbox(this.createAPI(engine));
                if (this.program.setup) this.program.setup(); 
                this.hasCompiled = true;
            } catch (err) {
                console.error("Error pada kode Arduino:", err);
                return; 
            }
        }

        try {
            if (this.program && this.program.loop) {
                this.program.loop();
            }
        } catch (err) {
            console.error("Error saat loop Arduino:", err);
        }
    }

    createAPI(engine) {
        const pseudo = this; // Simpan referensi ke komponen ini untuk digunakan dalam class Servo
        
        return {
            HIGH: 1, LOW: 0, INPUT: 'INPUT', OUTPUT: 'OUTPUT',
            millis: () => {
                const start = pseudo.startTime || 0;
                return Math.floor((engine.simTime - start) * 1000);
            },
            
            // 🌟 1. API PIN DASAR
            pinMode: (pin, mode) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0) pseudo.pinModes[p] = mode;
            },
            digitalWrite: (pin, val) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0 && pseudo.pinModes[p] === 'OUTPUT') pseudo.pinTargets[p] = val === 1 ? 5.0 : 0.0;
            },
            analogWrite: (pin, val) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0 && pseudo.pinModes[p] === 'OUTPUT') {
                    const safeVal = Math.max(0, Math.min(255, val));
                    pseudo.pinTargets[p] = (safeVal / 255) * 5.0;
                }
            },
            digitalRead: (pin) => {
                const p = pseudo.mapPin(pin);
                if (p < 0) return 0;
                const nodeIdx = engine.getNodeIndex(pseudo.id, 'input', p);
                const voltage = nodeIdx !== -1 ? (engine.nodeVoltage[nodeIdx] || 0) : 0;
                return voltage >= 2.5 ? 1 : 0;
            },
            analogRead: (pin) => {
                const p = pseudo.mapPin(pin);
                if (p < 0) return 0;
                const nodeIdx = engine.getNodeIndex(pseudo.id, 'input', p);
                const voltage = nodeIdx !== -1 ? (engine.nodeVoltage[nodeIdx] || 0) : 0;
                let adc = Math.round((voltage / 5.0) * 1023);
                return Math.max(0, Math.min(1023, adc)); 
            },

            // 🌟 2. API SERIAL MONITOR
            Serial: {
                begin: (baud) => { if (window.UIManager) window.UIManager.printToSerialMonitor(`<span style="color: #38bdf8;">> Serial dimulai (${baud} baud)</span>`, true); },
                print: (val) => { if (window.UIManager) window.UIManager.printToSerialMonitor(String(val), false); },
                println: (val) => { if (window.UIManager) window.UIManager.printToSerialMonitor(String(val), true); }
            },

            // 🌟 3. API MATEMATIKA (MAP & CONSTRAIN)
            map: (x, in_min, in_max, out_min, out_max) => {
                return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
            },
            constrain: (x, a, b) => Math.max(Math.min(x, Math.max(a, b)), Math.min(a, b)),

            // 🌟 4. API AUDIO TONE
            tone: (pin, frequency) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0) {
                    pseudo.pinModes[p] = 'OUTPUT';
                    pseudo.toneFreqs[p] = Math.max(1, frequency); // Aktifkan generator gelombang
                }
            },
            noTone: (pin) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0) {
                    pseudo.toneFreqs[p] = 0;        // Matikan generator gelombang
                    pseudo.pinTargets[p] = 0.0;     // Tarik ke Ground
                }
            },

            // 🌟 5. API SERVO MOTOR (Object Oriented)
            Servo: class {
                constructor() { 
                    this.pinIdx = -1; 
                    this.angle = 0; 
                }
                attach(pinStr) {
                    this.pinIdx = pseudo.mapPin(pinStr);
                    if (this.pinIdx >= 0) pseudo.pinModes[this.pinIdx] = 'OUTPUT';
                }
                write(angle) {
                    if (this.pinIdx < 0) return;
                    this.angle = Math.max(0, Math.min(180, angle));
                    // Di simulator ini, motor Servo dikendalikan oleh tegangan DC (0V = 0°, 5V = 180°)
                    pseudo.pinTargets[this.pinIdx] = (this.angle / 180.0) * 5.0;
                }
                read() { return this.angle; }
            },
            // 🌟 6. API LCD 16x2 I2C (Magic Bypass)
            LiquidCrystal_I2C: class {
                constructor(address, cols, rows) {
                    this.address = address;
                    this.cols = cols || 16;
                    this.rows = rows || 2;
                    this.cursorCol = 0;
                    this.cursorRow = 0;
                    this.lcdComp = null; // Menyimpan referensi komponen LCD di kanvas
                }

                init() { this.begin(); }
                
                begin() {
                    // MAGIC CHEAT: Cari komponen LCD di atas kanvas secara otomatis
                    const components = CircuitStore.components;
                    for (let i = 0; i < components.length; i++) {
                        if (components[i].type === 'lcd_16x2') {
                            this.lcdComp = components[i];
                            break;
                        }
                    }
                    this.clear(); // Bersihkan layar saat pertama kali jalan
                }

                clear() {
                    if (this.lcdComp) {
                        this.lcdComp.lcdText = ["                ", "                "];
                        // Render ulang UI
                        if (typeof window !== 'undefined') {
                            const contentDiv = document.getElementById(`content-${this.lcdComp.id}`);
                            if (contentDiv && window.ComponentDefs) {
                                window.ComponentDefs.updateDOMState('lcd_16x2', this.lcdComp, contentDiv, this.lcdComp.id);
                            }
                        }
                    }
                    this.cursorCol = 0;
                    this.cursorRow = 0;
                }

                setCursor(col, row) {
                    this.cursorCol = Math.max(0, Math.min(15, col));
                    this.cursorRow = Math.max(0, Math.min(1, row));
                }

                print(text) {
                    if (!this.lcdComp) return;
                    
                    let str = String(text);
                    let currentRowStr = this.lcdComp.lcdText[this.cursorRow];
                    
                    // Teknik memotong string untuk menimpa huruf di posisi kursor
                    let before = currentRowStr.substring(0, this.cursorCol);
                    let after = currentRowStr.substring(this.cursorCol + str.length);
                    
                    let newRowStr = before + str + after;
                    
                    // Potong paksa agar tidak melebihi 16 karakter, lalu isi sisa kanannya dengan spasi
                    this.lcdComp.lcdText[this.cursorRow] = newRowStr.substring(0, 16).padEnd(16, ' ');
                    
                    // Majukan kursor otomatis setelah print
                    this.cursorCol += str.length;

                    // 🌟 PERBAIKAN: Beri tahu UI bahwa teks telah berubah agar segera dirender ke kanvas!
                    if (typeof window !== 'undefined' && window.updateWireStates) {
                         const contentDiv = document.getElementById(`content-${this.lcdComp.id}`);
                         if (contentDiv && window.ComponentDefs) {
                             window.ComponentDefs.updateDOMState('lcd_16x2', this.lcdComp, contentDiv, this.lcdComp.id);
                         }
                    }
                }
            },

            delayMicroseconds: (_us) => { /* Stub aman untuk mencegah error */ },
            pulseIn: (pin, _state) => {
                const p = pseudo.mapPin(pin);
                if (p < 0) return 0;
                
                // Cari node kelistrikan dari pin Arduino ini
                const nIdx = engine.getNodeIndex(pseudo.id, 'input', p);
                if (nIdx === -1) return 0;

                // MAGIC CHEAT: Cari sensor HC-SR04 yang tersambung ke kabel ini
                const components = CircuitStore.components;
                for (let i = 0; i < components.length; i++) {
                    const c = components[i];
                    if (c.type === 'hc_sr04') {
                        const echoIdx = engine.getNodeIndex(c.id, 'output', 0);
                        if (echoIdx === nIdx) {
                            // Hitung balik mikrodetik sesuai rumus Datasheet (Jarak * 58)
                            let dist = parseFloat(c.state) || 50;
                            return Math.round(dist * 58.0);
                        }
                    }
                }
                return 1000000;
            },
        };
    }

    mapPin(pin) {
        if (typeof pin === 'string' && pin.startsWith('A')) return 14 + parseInt(pin.substring(1));
        return parseInt(pin);
    }

    injectMatrix(engine, sumVR, sum1R) {
        const rOut = 40.0; 
        const gOut = 1 / rOut;

        // 1. Eksekusi Tegangan Pin Digital & Analog (Indeks 0 hingga 19)
        for (let i = 0; i <= 19; i++) {
            if (this.pinModes[i] === 'OUTPUT') {
                const nodeIdx = engine.getNodeIndex(this.id, 'input', i); 
                if (nodeIdx !== -1) {
                    sumVR[nodeIdx] += this.pinTargets[i] * gOut;
                    sum1R[nodeIdx] += gOut;
                }
            }
        }

        // ==============================================
        // 2. Eksekusi Pin Power Sesuai Desain UI Baru
        // ==============================================
        const gPower = 1 / 0.1; // Resistansi arus kuat (nyaris 0 Ohm)
        
        // Pin 5V (23) dan IOREF (20) - Keduanya tersambung langsung ke jalur 5V
        [20, 23].forEach(pinIdx => {
            const n = engine.getNodeIndex(this.id, 'input', pinIdx);
            if (n !== -1) { sumVR[n] += 5.0 * gPower; sum1R[n] += gPower; }
        });

        // Pin 3.3V (22) - Dari regulator LM1117-3.3
        const n3v3 = engine.getNodeIndex(this.id, 'input', 22);
        if (n3v3 !== -1) { sumVR[n3v3] += 3.3 * gPower; sum1R[n3v3] += gPower; }

        // Semua Pin GND (24, 25, dan 27)
        [24, 25, 27].forEach(pinIdx => {
            const n = engine.getNodeIndex(this.id, 'input', pinIdx);
            if (n !== -1) { sumVR[n] += 0.0 * gPower; sum1R[n] += gPower; } 
        });

        // 🌟 FITUR BARU: Pin RESET (21)
        // Memiliki Pull-Up Resistor 10k Ohm ke 5V
        const nReset = engine.getNodeIndex(this.id, 'input', 21);
        if (nReset !== -1) {
            const gPullUp = 1 / 10000.0; // Hambatan 10k Ohm
            sumVR[nReset] += 5.0 * gPullUp; 
            sum1R[nReset] += gPullUp;
        }

        // 🌟 FITUR BARU: Pin AREF (28)
        // Terhubung ke 5V dengan hambatan internal sekitar 32k Ohm
        const nAref = engine.getNodeIndex(this.id, 'input', 28);
        if (nAref !== -1) {
            const gAref = 1 / 32000.0; // Hambatan 32k Ohm
            sumVR[nAref] += 5.0 * gAref; 
            sum1R[nAref] += gAref;
        }
    }
}

ComponentRegistry['arduino_uno'] = PseudoArduino;