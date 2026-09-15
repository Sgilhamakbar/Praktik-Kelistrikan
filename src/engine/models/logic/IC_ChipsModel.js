// File: src/engine/models/logic/IC_ChipsModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';
import { CircuitStore } from '../../../state/CircuitStore.js';

// =====================================================
// 1. IC 555 TIMER
// =====================================================
export class IC555 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R, iter) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0); // GND (Pin 1)
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1); // TRIG (Pin 2)
        const nIn2 = engine.getNodeIndex(this.id, 'input', 2); // RESET (Pin 4)
        const nIn3 = engine.getNodeIndex(this.id, 'input', 3); // CTRL (Pin 5)
        const nIn4 = engine.getNodeIndex(this.id, 'input', 4); // THR (Pin 6)
        const nIn5 = engine.getNodeIndex(this.id, 'input', 5); // VCC (Pin 8)
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0); // OUT (Pin 3)
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1); // DISCH (Pin 7)

        const vGnd = nIn0 !== -1 ? (engine.nodeVoltage[nIn0] || 0) : 0;
        const vVcc = nIn5 !== -1 ? (engine.nodeVoltage[nIn5] || 0) : 0;
        
        // 1. PENCEGAH FLOATING PINS
        const condFloat = 1 / 10000000; 
        if (nIn1 !== -1 && nIn0 !== -1) { sumVR[nIn1] += vGnd * condFloat; sum1R[nIn1] += condFloat; }
        if (nIn2 !== -1 && nIn5 !== -1) { sumVR[nIn2] += vVcc * condFloat; sum1R[nIn2] += condFloat; }
        if (nIn4 !== -1 && nIn0 !== -1) { sumVR[nIn4] += vGnd * condFloat; sum1R[nIn4] += condFloat; }

        // 2. VOLTAGE DIVIDER INTERNAL (3x 5k Ohm)
        if (nIn5 !== -1 && nIn3 !== -1) {
            const cond5k = 1 / 5000; 
            sumVR[nIn5] += engine.nodeVoltage[nIn3] * cond5k; sum1R[nIn5] += cond5k;
            sumVR[nIn3] += engine.nodeVoltage[nIn5] * cond5k; sum1R[nIn3] += cond5k;
        }
        if (nIn3 !== -1 && nIn0 !== -1) {
            const cond10k = 1 / 10000; 
            sumVR[nIn3] += engine.nodeVoltage[nIn0] * cond10k; sum1R[nIn3] += cond10k;
            sumVR[nIn0] += engine.nodeVoltage[nIn3] * cond10k; sum1R[nIn0] += cond10k;
        }

        // 3. LOGIKA MEMORI (SR LATCH) - Dieksekusi di iterasi pertama saja
        if (typeof this.internalState === 'undefined') this.internalState = 0;
        
        if (iter === 0) {
            const vTrig = nIn1 !== -1 ? (engine.nodeVoltage[nIn1] || 0) : vVcc;
            const vThr = nIn4 !== -1 ? (engine.nodeVoltage[nIn4] || 0) : 0;
            const vRst = nIn2 !== -1 ? (engine.nodeVoltage[nIn2] || 0) : vVcc; 
            
            const vCtrl = nIn3 !== -1 ? (engine.nodeVoltage[nIn3] || 0) : (vGnd + (vVcc - vGnd) * 0.666);
            const vUpper = vCtrl;
            const vLower = vGnd + (vCtrl - vGnd) / 2;

            if (vRst - vGnd < 0.7) {
                this.internalState = 0;
            } else if (vTrig - vGnd <= vLower - vGnd) {
                this.internalState = 1;
            } else if (vThr - vGnd >= vUpper - vGnd) {
                this.internalState = 0;
            }
        }
        this.outputState = this.internalState;

        // 4. OUTPUT CURRENT LIMIT & DISCHARGE PIN
        if (nOut0 !== -1) {
            const rOut = 15; 
            const condOut = 1 / rOut;
            
            // MATRIKS: Gunakan nodeVoltage langsung agar Gauss-Seidel terikat sempurna (Real-time KCL)
            if (this.internalState === 1 && nIn5 !== -1) {
                // Output = HIGH (Tersambung ke VCC lewat rOut)
                sumVR[nOut0] += engine.nodeVoltage[nIn5] * condOut; 
                sum1R[nOut0] += condOut;
                
                sumVR[nIn5] += engine.nodeVoltage[nOut0] * condOut; 
                sum1R[nIn5] += condOut;
            } else if (this.internalState === 0 && nIn0 !== -1) {
                // Output = LOW (Tersambung ke GND lewat rOut)
                sumVR[nOut0] += engine.nodeVoltage[nIn0] * condOut; 
                sum1R[nOut0] += condOut;
                
                sumVR[nIn0] += engine.nodeVoltage[nOut0] * condOut; 
                sum1R[nIn0] += condOut;
            }
        }

        if (nOut1 !== -1 && nIn0 !== -1) {
            const rDisch = this.internalState === 0 ? 15 : 1000000000; 
            const condDisch = 1 / rDisch;
            sumVR[nOut1] += engine.nodeVoltage[nIn0] * condDisch; sum1R[nOut1] += condDisch;
            sumVR[nIn0] += engine.nodeVoltage[nOut1] * condDisch; sum1R[nIn0] += condDisch;
        }

        // FISIKA: Arus Diam (Quiescent Current)
        // IC NE555 asli menyedot sekitar 3mA dari VCC ke GND hanya untuk menyalakan otaknya
        if (nIn5 !== -1 && nIn0 !== -1) {
            sumVR[nIn5] -= 0.003;  // Ditarik dari VCC
            sumVR[nIn0] += 0.003;  // Dibuang ke GND
        }
    }

    applyResults(engine) {
        if (!this.inputStates) this.inputStates = [0,0,0,0,0,0];
        for (let i = 0; i <= 5; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            this.inputStates[i] = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        }
        const vGnd = this.inputStates[0];
        const vVcc = this.inputStates[5];
        this.simV_vcc = Math.abs(vVcc - vGnd);
    }
}

// =====================================================
// 2. IC LM3914 (LED DOT/BAR DRIVER)
// =====================================================
export class ICLM3914 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nSig = engine.getNodeIndex(this.id, 'input', 0);
        const nRhi = engine.getNodeIndex(this.id, 'input', 1);
        const nRlo = engine.getNodeIndex(this.id, 'input', 2);
        const nRefO = engine.getNodeIndex(this.id, 'input', 3); 
        const nRefA = engine.getNodeIndex(this.id, 'input', 4); 
        const nMod = engine.getNodeIndex(this.id, 'input', 5);
        const nVcc = engine.getNodeIndex(this.id, 'input', 6);
        const nGnd = engine.getNodeIndex(this.id, 'input', 7); 

        const vSig = nSig !== -1 ? (engine.nodeVoltage[nSig] || 0) : 0;
        const vRhi = nRhi !== -1 ? (engine.nodeVoltage[nRhi] || 0) : 0;
        const vRlo = nRlo !== -1 ? (engine.nodeVoltage[nRlo] || 0) : 0;
        const vMod = nMod !== -1 ? (engine.nodeVoltage[nMod] || 0) : 0;
        const vVcc = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0; 
        const vGnd = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;

        const isPowered = (vVcc - vGnd) >= 2.5;

        // 1. REGULATOR INTERNAL (1.25V)
        if (isPowered && nRefO !== -1) {
            const vRefA = nRefA !== -1 ? (engine.nodeVoltage[nRefA] || 0) : 0;
            const condRef = 1 / 10; 
            sumVR[nRefO] += (vRefA + 1.25) * condRef; sum1R[nRefO] += condRef;
        }

        // 2. INTERNAL BIAS UNTUK PIN MODE (Float di ~1.5V)
        // Mencegah tegangan hantu merusak mode Bar/Dot
        if (nMod !== -1 && nGnd !== -1 && nVcc !== -1) {
            const condPullUp = 1 / 70000;
            const condPullDown = 1 / 30000;
            sumVR[nMod] += engine.nodeVoltage[nVcc] * condPullUp; sum1R[nMod] += condPullUp;
            sumVR[nVcc] += engine.nodeVoltage[nMod] * condPullUp; sum1R[nVcc] += condPullUp;
            sumVR[nMod] += engine.nodeVoltage[nGnd] * condPullDown; sum1R[nMod] += condPullDown;
            sumVR[nGnd] += engine.nodeVoltage[nMod] * condPullDown; sum1R[nGnd] += condPullDown;
        }

        // 3. RESISTOR PEMBAGI INTERNAL (10k)
        if (nRhi !== -1 && nRlo !== -1) {
            const condDivider = 1 / 10000;
            sumVR[nRhi] += engine.nodeVoltage[nRlo] * condDivider; sum1R[nRhi] += condDivider;
            sumVR[nRlo] += engine.nodeVoltage[nRhi] * condDivider; sum1R[nRlo] += condDivider;
        }

        // 4. KOMPARATOR LOGIKA
        const refRange = vRhi - vRlo;
        const stepV = refRange / 10;
        let activeLevels = 0;

        if (isPowered && stepV > 0.001) { 
            for (let lvl = 1; lvl <= 10; lvl++) {
                let threshold = vRlo + (lvl * stepV);
                if (vSig >= threshold - 0.01) activeLevels = lvl;
            }
        }

        // 5. MODE DOT/BAR SANGAT KETAT
        const modeVoltage = vMod - vGnd;
        // Wajib sangat mendekati VCC untuk jadi Bar Mode (Mengabaikan rembesan dari LED)
        const isBarMode = modeVoltage >= (vVcc - vGnd - 1.0);
        
        // 6. LOGIKA CASCADE CERDAS
        if (isPowered && !isBarMode) {
            // Jika sinyal melampaui batas atas IC ini hingga masuk ke IC berikutnya,
            // OTOMATIS MATIKAN SEMUA LED! (Titik melompat ke IC atas).
            if (vSig >= vRhi + stepV - 0.01) {
                activeLevels = 0; 
            }
            // Atau jika ditarik manual ke Ground (< 0.5V)
            else if (modeVoltage < 0.5) {
                activeLevels = 0;
            }
        }

        if (!this.outStates) this.outStates = new Array(10).fill(false);

        // 7. OUTPUT SINKING CURRENT (Active LOW)
        for (let j = 0; j < 10; j++) {
            let nOut = engine.getNodeIndex(this.id, 'output', j); 
            let lvl = j + 1;
            
            let isLedOn = false;
            if (isPowered) {
                isLedOn = isBarMode ? (lvl <= activeLevels) : (lvl === activeLevels && activeLevels > 0);
            }
            
            this.outStates[j] = isLedOn;

            if (nOut !== -1) {
                const rOut = isLedOn ? 20 : 1000000000;
                const condOut = 1 / rOut;
                sumVR[nOut] += vGnd * condOut; sum1R[nOut] += condOut;
                if (nGnd !== -1) {
                    sumVR[nGnd] += engine.nodeVoltage[nOut] * condOut;
                    sum1R[nGnd] += condOut;
                }
            }
        }
    }
}

// =====================================================
// 3. IC 4017 (DECADE COUNTER) -> GABUNGAN BERSIH
// =====================================================
export class IC4017 extends BaseComponent {
    
    // 🟢 Fungsi ini dulu berada di bawah sebagai tambalan, sekarang masuk secara rapi
    solveDigital(_engine, iter) {
        const in0 = this.inputStates[0] === 1 ? 1 : 0; // CLK
        const in1 = this.inputStates[1] === 1 ? 1 : 0; // ENA
        const in2 = this.inputStates[2] === 1 ? 1 : 0; // RST

        if (typeof this.counter === 'undefined') this.counter = 0;
        if (!this.outputStates) this.outputStates = new Array(11).fill(0);
        
        let isClockRising = false;
        if (this.prevClock === undefined) { 
            if (iter === 4) this.prevClock = in0; 
        } else {
            if (this.prevClock === 0 && in0 === 1) { 
                isClockRising = true; 
                this.prevClock = 1; 
            } else if (in0 === 0) { 
                this.prevClock = 0; 
            }
        }

        if (in2 === 1) {
            this.counter = 0;
        } else if (isClockRising && in1 === 0) { 
            this.counter++; 
            if (this.counter > 9) this.counter = 0; 
        }

        // Tulis ke pin Q0-Q9
        for (let j = 0; j < 10; j++) {
            this.outputStates[j] = (this.counter === j) ? 1 : 0;
        }
        // Tulis ke pin CO (Carry Out)
        this.outputStates[10] = (this.counter < 5) ? 1 : 0;
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 3);
        const nGnd = engine.getNodeIndex(this.id, 'input', 4);
        const vcc = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const gnd = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        
        const isPowered = (vcc - gnd) > 2.5;

        for (let j = 0; j < 11; j++) {
            const nOut = engine.getNodeIndex(this.id, 'output', j);
            if (nOut !== -1) {
                const state = (this.outputStates && this.outputStates[j] === 1) ? 1 : 0;
                engine.nodeVoltage[nOut] = (isPowered && state === 1) ? vcc : gnd;
                fixedNodes[nOut] = true; 
            }
        }
    }

    injectMatrix(engine, sumVR, sum1R) {
        const nGnd = engine.getNodeIndex(this.id, 'input', 4);
        const condFloat = 1 / 10000000; 
        
        for (let j = 0; j < 3; j++) { // Berlaku untuk CLK, ENA, RST
            const nIn = engine.getNodeIndex(this.id, 'input', j);
            if (nIn !== -1 && nGnd !== -1) {
                sumVR[nIn] += engine.nodeVoltage[nGnd] * condFloat; sum1R[nIn] += condFloat;
                sumVR[nGnd] += engine.nodeVoltage[nIn] * condFloat; sum1R[nGnd] += condFloat;
            }
        }
    }

    applyResults(engine) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 3);
        const nGnd = engine.getNodeIndex(this.id, 'input', 4);
        const vcc = nVcc !== -1 ? engine.nodeVoltage[nVcc] : 0;
        const gnd = nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0;
        this.simV_vcc = Math.abs(vcc - gnd);

        if (!this.inputStates) this.inputStates = [0,0,0,0,0];
        for (let j = 0; j < 5; j++) {
            const nIn = engine.getNodeIndex(this.id, 'input', j);
            this.inputStates[j] = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        }
    }
}

// =====================================================
// 4A. IC 4518 (VERSI EDUKASI / SINGLE COUNTER) - ID: ic_4518
// =====================================================
export class IC4518 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        const nInClk = engine.getNodeIndex(this.id, 'input', 0);
        const nInEn  = engine.getNodeIndex(this.id, 'input', 1);
        const nInRst = engine.getNodeIndex(this.id, 'input', 2);

        const vClk = nInClk !== -1 ? (engine.nodeVoltage[nInClk] || 0) : 0;
        const vEn  = nInEn !== -1 ? (engine.nodeVoltage[nInEn] || 0) : 0; 
        const vRst = nInRst !== -1 ? (engine.nodeVoltage[nInRst] || 0) : 0;

        const clkState = vClk > 2.5;
        const rstState = vRst > 2.5;
        const enState  = nInEn !== -1 ? vEn > 2.5 : true; 

        if (this.count === undefined) this.count = 0;
        if (this.lastClk === undefined) this.lastClk = false;
        if (this.lastEn === undefined) this.lastEn = true;

        if (iter === 0) {
            const clkRisingEdge = clkState && !this.lastClk;
            const enFallingEdge = !enState && this.lastEn;

            if (rstState) {
                this.count = 0; 
            } else if ((clkRisingEdge && enState) || (enFallingEdge && !clkState)) {
                //Sisi turun EN hanya sah jika CLK sedang LOW (!clkState)
                this.count++;
                if (this.count > 9) this.count = 0; 
            }
            
            this.lastClk = clkState; 
            this.lastEn = enState;

            this.outStates = [
                (this.count & 1) !== 0, (this.count & 2) !== 0,
                (this.count & 4) !== 0, (this.count & 8) !== 0
            ];
        }

        for (let i = 0; i < 4; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = this.outStates[i] ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
}

// =====================================================
// 4B. IC 4518 DUAL (VERSI FISIK NYATA / DIP-16) - ID: ic_4518_dual
// =====================================================
export class IC4518Dual extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        // --- BACA 8 PIN INPUT ---
        const nInClkA = engine.getNodeIndex(this.id, 'input', 0); // Pin 1
        const nInEnA  = engine.getNodeIndex(this.id, 'input', 1); // Pin 2
        const nInRstA = engine.getNodeIndex(this.id, 'input', 2); // Pin 3
        const nInClkB = engine.getNodeIndex(this.id, 'input', 3); // Pin 15
        const nInEnB  = engine.getNodeIndex(this.id, 'input', 4); // Pin 14
        const nInRstB = engine.getNodeIndex(this.id, 'input', 5); // Pin 13
        const nVcc    = engine.getNodeIndex(this.id, 'input', 6); // Pin 16
        const nGnd    = engine.getNodeIndex(this.id, 'input', 7); // Pin 8

        const vClkA = nInClkA !== -1 ? (engine.nodeVoltage[nInClkA] || 0) : 0;
        const vEnA  = nInEnA  !== -1 ? (engine.nodeVoltage[nInEnA]  || 0) : 0; 
        const vRstA = nInRstA !== -1 ? (engine.nodeVoltage[nInRstA] || 0) : 0;
        const vClkB = nInClkB !== -1 ? (engine.nodeVoltage[nInClkB] || 0) : 0;
        const vEnB  = nInEnB  !== -1 ? (engine.nodeVoltage[nInEnB]  || 0) : 0; 
        const vRstB = nInRstB !== -1 ? (engine.nodeVoltage[nInRstB] || 0) : 0;
        const vcc   = nVcc    !== -1 ? (engine.nodeVoltage[nVcc]    || 0) : 0;
        const gnd   = nGnd    !== -1 ? (engine.nodeVoltage[nGnd]    || 0) : 0;

        const isPowered = (vcc - gnd) > 2.5;

        // --- KONVERSI KE DIGITAL ---
        const stClkA = vClkA > 2.5;
        const stRstA = vRstA > 2.5;
        const stEnA  = nInEnA !== -1 ? vEnA > 2.5 : true; 

        const stClkB = vClkB > 2.5;
        const stRstB = vRstB > 2.5;
        const stEnB  = nInEnB !== -1 ? vEnB > 2.5 : true; 

        if (this.countA === undefined) this.countA = 0;
        if (this.countB === undefined) this.countB = 0;
        if (this.lastClkA === undefined) this.lastClkA = false;
        if (this.lastEnA === undefined) this.lastEnA = true;
        if (this.lastClkB === undefined) this.lastClkB = false;
        if (this.lastEnB === undefined) this.lastEnB = true;

        if (iter === 0) {
            const clkA_Rise = stClkA && !this.lastClkA;
            const enA_Fall  = !stEnA && this.lastEnA;
            const clkB_Rise = stClkB && !this.lastClkB;
            const enB_Fall  = !stEnB && this.lastEnB;

            // PERBAIKAN 2: Cegah "Ghost Counting". Otak IC HANYA jalan jika ada aliran listrik!
            if (isPowered) {
                // MESIN COUNTER A
                if (stRstA) {
                    this.countA = 0; // Reset asinkron selalu menang
                } else if ((clkA_Rise && stEnA) || (enA_Fall && !stClkA)) { 
                    // PERBAIKAN 1: enA_Fall HANYA bisa jika CLK sedang LOW (!stClkA)
                    this.countA = (this.countA + 1) % 10;
                }

                // MESIN COUNTER B
                if (stRstB) {
                    this.countB = 0;
                } else if ((clkB_Rise && stEnB) || (enB_Fall && !stClkB)) {
                    // PERBAIKAN 1: enB_Fall HANYA bisa jika CLK sedang LOW (!stClkB)
                    this.countB = (this.countB + 1) % 10;
                }
            }

            // Simpan status lama (harus tetap disimpan meskipun mati, agar sensor Tepi tidak meleset saat dihidupkan)
            this.lastClkA = stClkA; this.lastEnA = stEnA;
            this.lastClkB = stClkB; this.lastEnB = stEnB;

            // Gabungkan 8 bit output (Q0A-Q3A, Q0B-Q3B)
            this.outStates = [
                (this.countA & 1) !== 0, (this.countA & 2) !== 0, (this.countA & 4) !== 0, (this.countA & 8) !== 0,
                (this.countB & 1) !== 0, (this.countB & 2) !== 0, (this.countB & 4) !== 0, (this.countB & 8) !== 0
            ];
        }

        // Tembakkan Tegangan ke 8 Pin Output
        for (let i = 0; i < 8; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = (isPowered && this.outStates[i]) ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }

    applyResults(engine) {
        // Laporkan tegangan VCC untuk animasi warna bodi kuning
        const nVcc = engine.getNodeIndex(this.id, 'input', 6);
        const nGnd = engine.getNodeIndex(this.id, 'input', 7);
        const vcc = nVcc !== -1 ? engine.nodeVoltage[nVcc] : 0;
        const gnd = nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0;
        this.simV_vcc = Math.abs(vcc - gnd);
    }
}

// =====================================================
// 5. IC 4511 (BCD TO 7-SEGMENT LATCH DECODER)
// =====================================================
export class IC4511 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        const nInA = engine.getNodeIndex(this.id, 'input', 0); 
        const nInB = engine.getNodeIndex(this.id, 'input', 1); 
        const nInC = engine.getNodeIndex(this.id, 'input', 2); 
        const nInD = engine.getNodeIndex(this.id, 'input', 3); 
        const nInLT = engine.getNodeIndex(this.id, 'input', 4); 
        const nInBI = engine.getNodeIndex(this.id, 'input', 5); 
        const nInLE = engine.getNodeIndex(this.id, 'input', 6); 

        const vA = nInA !== -1 ? (engine.nodeVoltage[nInA] || 0) : 0;
        const vB = nInB !== -1 ? (engine.nodeVoltage[nInB] || 0) : 0;
        const vC = nInC !== -1 ? (engine.nodeVoltage[nInC] || 0) : 0;
        const vD = nInD !== -1 ? (engine.nodeVoltage[nInD] || 0) : 0;
        const vLT = nInLT !== -1 ? (engine.nodeVoltage[nInLT] || 0) : 5.0; 
        const vBI = nInBI !== -1 ? (engine.nodeVoltage[nInBI] || 0) : 5.0; 
        const vLE = nInLE !== -1 ? (engine.nodeVoltage[nInLE] || 0) : 0; 

        const bitA = vA > 2.5 ? 1 : 0;
        const bitB = vB > 2.5 ? 2 : 0;
        const bitC = vC > 2.5 ? 4 : 0;
        const bitD = vD > 2.5 ? 8 : 0;
        
        const isLT = vLT < 2.5; 
        const isBI = vBI < 2.5; 
        const isLE = vLE > 2.5; 

        if (this.latchedVal === undefined) this.latchedVal = 0;

        if (iter === 0) {
            if (!isLE) this.latchedVal = bitA + bitB + bitC + bitD;

            const segmentMap = [
                [1,1,1,1,1,1,0], [0,1,1,0,0,0,0], [1,1,0,1,1,0,1], [1,1,1,1,0,0,1],
                [0,1,1,0,0,1,1], [1,0,1,1,0,1,1], [1,0,1,1,1,1,1], [1,1,1,0,0,0,0],
                [1,1,1,1,1,1,1], [1,1,1,1,0,1,1] 
            ];

            let outSegments = [0,0,0,0,0,0,0];
            if (isLT) {
                outSegments = [1,1,1,1,1,1,1]; 
            } else if (isBI) {
                outSegments = [0,0,0,0,0,0,0]; 
            } else {
                if (this.latchedVal <= 9) outSegments = segmentMap[this.latchedVal];
            }
            this.outStates = outSegments;
        }

        for (let i = 0; i < 7; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = this.outStates[i] === 1 ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
}

// =====================================================
// 6. IC 4026 (DECADE COUNTER & 7-SEGMENT DECODER)
// =====================================================
export class IC4026 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        const nInClk = engine.getNodeIndex(this.id, 'input', 0);
        const nInInh = engine.getNodeIndex(this.id, 'input', 1);
        const nInRst = engine.getNodeIndex(this.id, 'input', 2);
        const nInDei = engine.getNodeIndex(this.id, 'input', 3);

        const vClk = nInClk !== -1 ? (engine.nodeVoltage[nInClk] || 0) : 0;
        const vInh = nInInh !== -1 ? (engine.nodeVoltage[nInInh] || 0) : 0;
        const vRst = nInRst !== -1 ? (engine.nodeVoltage[nInRst] || 0) : 0;
        const vDei = nInDei !== -1 ? (engine.nodeVoltage[nInDei] || 0) : 5.0;

        const clkState = vClk > 2.5;
        const inhState = vInh > 2.5;
        const rstState = vRst > 2.5;
        const deiState = vDei > 2.5;

        if (this.count === undefined) this.count = 0;
        if (this.lastClk === undefined) this.lastClk = false;

        if (iter === 0) {
            if (rstState) {
                this.count = 0; 
            } else if (clkState && !this.lastClk && !inhState) {
                this.count++;
                if (this.count > 9) this.count = 0; 
            }
            this.lastClk = clkState;

            const segmentMap = [
                [1,1,1,1,1,1,0], [0,1,1,0,0,0,0], [1,1,0,1,1,0,1], [1,1,1,1,0,0,1],
                [0,1,1,0,0,1,1], [1,0,1,1,0,1,1], [1,0,1,1,1,1,1], [1,1,1,0,0,0,0],
                [1,1,1,1,1,1,1], [1,1,1,1,0,1,1] 
            ];

            let outSegments = [0,0,0,0,0,0,0];
            if (deiState) outSegments = segmentMap[this.count];

            const coState = this.count < 5 ? 1 : 0;
            const deoState = deiState ? 1 : 0;
            const ucsState = segmentMap[this.count][2]; 
            
            this.outStates = [...outSegments, coState, deoState, ucsState];
        }

        for (let i = 0; i < 10; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = this.outStates[i] ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
}

// =====================================================
// 7. IC 7448 (BCD TO 7-SEGMENT DECODER - COMMON CATHODE)
// =====================================================
export class IC7448 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        // Membaca 9 Pin Input sesuai urutan logika kita
        const nInA   = engine.getNodeIndex(this.id, 'input', 0); 
        const nInB   = engine.getNodeIndex(this.id, 'input', 1); 
        const nInC   = engine.getNodeIndex(this.id, 'input', 2); 
        const nInD   = engine.getNodeIndex(this.id, 'input', 3); 
        const nInLT  = engine.getNodeIndex(this.id, 'input', 4); 
        const nInBI  = engine.getNodeIndex(this.id, 'input', 5); 
        const nInRBI = engine.getNodeIndex(this.id, 'input', 6);
        const nVcc   = engine.getNodeIndex(this.id, 'input', 7);
        const nGnd   = engine.getNodeIndex(this.id, 'input', 8);

        // Baca tegangan. Jika pin kontrol mengambang (tercabut), TTL akan menganggapnya HIGH (5.0V)
        const vA   = nInA !== -1 ? (engine.nodeVoltage[nInA] || 0) : 0;
        const vB   = nInB !== -1 ? (engine.nodeVoltage[nInB] || 0) : 0;
        const vC   = nInC !== -1 ? (engine.nodeVoltage[nInC] || 0) : 0;
        const vD   = nInD !== -1 ? (engine.nodeVoltage[nInD] || 0) : 0;
        const vLT  = nInLT !== -1 ? (engine.nodeVoltage[nInLT] || 0) : 5.0; 
        const vBI  = nInBI !== -1 ? (engine.nodeVoltage[nInBI] || 0) : 5.0; 
        const vRBI = nInRBI !== -1 ? (engine.nodeVoltage[nInRBI] || 0) : 5.0; 
        const vcc  = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const gnd  = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;

        // Cek Power (Minimal 2.5V selisih VCC dan GND)
        const isPowered = (vcc - gnd) > 2.5;

        // Terjemahkan ke Logika Digital (1 atau 0)
        const bitA = vA > 2.5 ? 1 : 0;
        const bitB = vB > 2.5 ? 2 : 0;
        const bitC = vC > 2.5 ? 4 : 0;
        const bitD = vD > 2.5 ? 8 : 0;
        
        // Active LOW Control Pins
        const isLT  = vLT < 2.5; // Jika LOW, Lamp Test Aktif
        const isBI  = vBI < 2.5; // Jika LOW, Layar Mati (Blank)
        const isRBI = vRBI < 2.5; // Jika LOW, Nol Dihilangkan

        if (iter === 0) {
            const bcdVal = bitA + bitB + bitC + bitD;

            // Peta Karakter Otentik IC 7448 (0-15)
            // Urutan Output: [a, b, c, d, e, f, g]
            const segmentMap = [
                [1,1,1,1,1,1,0], // 0
                [0,1,1,0,0,0,0], // 1
                [1,1,0,1,1,0,1], // 2
                [1,1,1,1,0,0,1], // 3
                [0,1,1,0,0,1,1], // 4
                [1,0,1,1,0,1,1], // 5
                [0,0,1,1,1,1,1], // 6 (Otentik 7448: Tanpa garis atas 'a')
                [1,1,1,0,0,0,0], // 7
                [1,1,1,1,1,1,1], // 8
                [1,1,1,0,0,1,1], // 9 (Otentik 7448: Tanpa garis bawah 'd')
                [0,0,0,1,1,0,1], // 10 (A - Simbol aneh)
                [0,0,1,1,0,0,1], // 11 (B - Simbol aneh)
                [0,1,0,0,0,1,1], // 12 (C - Simbol aneh)
                [1,0,0,1,0,1,1], // 13 (D - Simbol aneh)
                [0,0,0,1,1,1,1], // 14 (E - Simbol aneh)
                [0,0,0,0,0,0,0]  // 15 (F - Blank)
            ];

            let outSegments = [0,0,0,0,0,0,0];

            if (isPowered) {
                // Hierarki Datasheet 7448: BI menang atas segalanya
                if (isBI) {
                    outSegments = [0,0,0,0,0,0,0]; // Layar Hitam
                } else if (isLT) {
                    outSegments = [1,1,1,1,1,1,1]; // Lamp Test (Semua Nyala)
                } else if (isRBI && bcdVal === 0) {
                    outSegments = [0,0,0,0,0,0,0]; // Ripple Blanking (Hapus angka 0)
                } else {
                    outSegments = segmentMap[bcdVal]; // Terjemahkan Normal
                }
            }
            this.outStates = outSegments;
        }

        // Tembakkan Tegangan ke Pin Output 0-6 (Segmen a-g)
        for (let i = 0; i < 7; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                // IC 7448 adalah Active-High (Internal Pull-up)
                engine.nodeVoltage[nOut] = this.outStates[i] === 1 ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        // Hambatan palsu ke Ground agar matriks tidak error jika kabel dicabut
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
    applyResults(engine) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 7);
        const nGnd = engine.getNodeIndex(this.id, 'input', 8);
        const vcc = nVcc !== -1 ? engine.nodeVoltage[nVcc] : 0;
        const gnd = nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0;
        this.simV_vcc = Math.abs(vcc - gnd);
    }
}

// =====================================================
// 8. IC 74LS90 (DECADE COUNTER / MOD-10)
// =====================================================
export class IC74LS90 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        // 1. MEMBACA SEMUA 8 PIN INPUT (Berdasarkan urutan logika kita)
        const nClkA = engine.getNodeIndex(this.id, 'input', 0); // Pin 14
        const nClkB = engine.getNodeIndex(this.id, 'input', 1); // Pin 1
        const nR0_1 = engine.getNodeIndex(this.id, 'input', 2); // Pin 2
        const nR0_2 = engine.getNodeIndex(this.id, 'input', 3); // Pin 3
        const nR9_1 = engine.getNodeIndex(this.id, 'input', 4); // Pin 6
        const nR9_2 = engine.getNodeIndex(this.id, 'input', 5); // Pin 7
        const nVcc  = engine.getNodeIndex(this.id, 'input', 6); // Pin 5
        const nGnd  = engine.getNodeIndex(this.id, 'input', 7); // Pin 10

        // Membaca tegangan fisik (Jika pin tercabut, anggap 0V agar tidak menghitung liar)
        const vClkA = nClkA !== -1 ? (engine.nodeVoltage[nClkA] || 0) : 0;
        const vClkB = nClkB !== -1 ? (engine.nodeVoltage[nClkB] || 0) : 0;
        const vR0_1 = nR0_1 !== -1 ? (engine.nodeVoltage[nR0_1] || 0) : 0;
        const vR0_2 = nR0_2 !== -1 ? (engine.nodeVoltage[nR0_2] || 0) : 0;
        const vR9_1 = nR9_1 !== -1 ? (engine.nodeVoltage[nR9_1] || 0) : 0;
        const vR9_2 = nR9_2 !== -1 ? (engine.nodeVoltage[nR9_2] || 0) : 0;
        const vcc   = nVcc  !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const gnd   = nGnd  !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;

        // Cek Power (Minimal 2.5V untuk menyala)
        const isPowered = (vcc - gnd) > 2.5;

        // Terjemahkan tegangan analog ke logika biner (HIGH / LOW)
        const clkA_val = vClkA > 2.5;
        const clkB_val = vClkB > 2.5;
        const r0_1_val = vR0_1 > 2.5;
        const r0_2_val = vR0_2 > 2.5;
        const r9_1_val = vR9_1 > 2.5;
        const r9_2_val = vR9_2 > 2.5;

        // Siapkan memori internal jika komponen baru diletakkan di kanvas
        if (this.countA === undefined) this.countA = 0; // Memori MOD-2
        if (this.countB === undefined) this.countB = 0; // Memori MOD-5
        if (this.lastClkA === undefined) this.lastClkA = false;
        if (this.lastClkB === undefined) this.lastClkB = false;

        // 2. PROSES LOGIKA (Hanya dieksekusi sekali per siklus mesin fisika)
        if (iter === 0) {
            // A. Gerbang Logika Reset (AND Gate internal)
            const isResetTo0 = r0_1_val && r0_2_val;
            const isSetTo9   = r9_1_val && r9_2_val;

            // B. Sensor Sisi Turun (Falling Edge Detector)
            // Aktif HANYA jika clock sebelumnya HIGH dan clock sekarang LOW
            const fallingEdgeA = this.lastClkA && !clkA_val;
            const fallingEdgeB = this.lastClkB && !clkB_val;

            // C. Eksekusi Hierarki Prioritas
            if (isResetTo0) {
                this.countA = 0;
                this.countB = 0;
            } else if (isSetTo9) {
                this.countA = 1; // 1
                this.countB = 4; // 4 (Karena QD/Nilai 8 ada di countB. 1 + 8 = 9)
            } else {
                // Hitung mandiri jika tidak di-reset
                if (fallingEdgeA) {
                    this.countA = (this.countA + 1) % 2; // Hanya 0 atau 1
                }
                if (fallingEdgeB) {
                    this.countB = (this.countB + 1) % 5; // Menghitung 0, 1, 2, 3, 4
                }
            }

            // D. Simpan status clock untuk perbandingan di iterasi detik berikutnya
            this.lastClkA = clkA_val;
            this.lastClkB = clkB_val;

            // E. Susun Output 4-bit (QA, QB, QC, QD)
            this.outStates = [
                this.countA === 1,           // QA (LSB - Milik Clock A)
                (this.countB & 1) !== 0,     // QB (Milik Clock B)
                (this.countB & 2) !== 0,     // QC (Milik Clock B)
                (this.countB & 4) !== 0      // QD (MSB - Milik Clock B)
            ];
        }

        // 3. KELUARKAN TEGANGAN KE KANVAS (Pin QA, QB, QC, QD)
        for (let i = 0; i < 4; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = (isPowered && this.outStates[i]) ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }

    injectMatrix(engine, sumVR, sum1R) {
        // Hambatan palsu internal untuk mengamankan matriks dari kabel putus
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
    applyResults(engine) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 6);
        const nGnd = engine.getNodeIndex(this.id, 'input', 7);
        const vcc = nVcc !== -1 ? engine.nodeVoltage[nVcc] : 0;
        const gnd = nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0;
        this.simV_vcc = Math.abs(vcc - gnd);
    }
}

// =====================================================
// 9. NET TUNNEL (KABEL NIRKABEL / VIRTUAL NODE)
// =====================================================
export class NetTunnel extends BaseComponent {
    // Matriks kelistrikan sudah ditangani otomatis oleh buildElectricalNodes di Engine!
    injectMatrix(_engine, _sumVR, _sum1R) { }

    applyResults(engine) {
        const myNode = engine.getNodeIndex(this.id, 'input', 0);
        this.simV = myNode !== -1 ? engine.nodeVoltage[myNode] : 0;
    }
}

// =====================================================
// 10. IC 4051 (8-CHANNEL ANALOG MULTIPLEXER/DEMULTIPLEXER - DIP-16)
// =====================================================
export class IC4051 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R, iter) {
        // 1. PEMETAAN 8 PIN KONTROL & TENAGA (Kelompok 'input')
        const nInA   = engine.getNodeIndex(this.id, 'input', 0); // Pin 11 (Selector A)
        const nInB   = engine.getNodeIndex(this.id, 'input', 1); // Pin 10 (Selector B)
        const nInC   = engine.getNodeIndex(this.id, 'input', 2); // Pin 9  (Selector C)
        const nInInh = engine.getNodeIndex(this.id, 'input', 3); // Pin 6  (INH / Enable)
        const nCom   = engine.getNodeIndex(this.id, 'input', 4); // Pin 3  (COM Utama)
        const nVee   = engine.getNodeIndex(this.id, 'input', 5); // Pin 7  (VEE / Negatif Analog)
        const nVdd   = engine.getNodeIndex(this.id, 'input', 6); // Pin 16 (VDD / Power)
        const nVss   = engine.getNodeIndex(this.id, 'input', 7); // Pin 8  (VSS / Ground)

        // 2. BACA LOGIKA KONTROL (Hanya dievaluasi di iterasi 0 agar stabil)
        if (iter === 0) {
            const vA   = nInA   !== -1 ? (engine.nodeVoltage[nInA]   || 0) : 0;
            const vB   = nInB   !== -1 ? (engine.nodeVoltage[nInB]   || 0) : 0;
            const vC   = nInC   !== -1 ? (engine.nodeVoltage[nInC]   || 0) : 0;
            const vInh = nInInh !== -1 ? (engine.nodeVoltage[nInInh] || 0) : 5.0; // Default HIGH (Mati) jika tak tersambung
            const vdd  = nVdd   !== -1 ? (engine.nodeVoltage[nVdd]   || 0) : 0;
            const vss  = nVss   !== -1 ? (engine.nodeVoltage[nVss]   || 0) : 0;

            // Cek ketersediaan tenaga (Minimal 2.5V antara VDD dan VSS)
            this.isPowered = (vdd - vss) > 2.5;

            // Konversi tegangan kontrol ke Biner (1 atau 0)
            const bitA = vA > 2.5 ? 1 : 0;
            const bitB = vB > 2.5 ? 2 : 0;
            const bitC = vC > 2.5 ? 4 : 0;
            
            // IC hanya aktif jika menyala DAN pin INH ditarik ke Ground (Active LOW)
            this.isActive = this.isPowered && (vInh < 2.5); 
            
            // Tentukan alamat saluran (0 sampai 7)
            if (this.isActive) {
                this.activeChannel = bitA + bitB + bitC;
            } else {
                this.activeChannel = -1; // -1 berarti seluruh sakelar terputus (Isolasi)
            }
        }

        // 3. EKSEKUSI SAKELAR ANALOG (Menghubungkan COM dengan Y0-Y7)
        if (nCom !== -1) {
            for (let i = 0; i < 8; i++) {
                const nY = engine.getNodeIndex(this.id, 'output', i); // Pin Y0 - Y7
                
                if (nY !== -1) {
                    // Ron = 120 Ohm (Buka Jalur Tol), Roff = 1 GigaOhm (Blokir Jalur Tol)
                    const R = (this.activeChannel === i) ? 120.0 : 1e9;
                    const G = 1 / R;

                    // Hukum Kirchhoff MNA: Tembakkan hambatan dua arah (Bi-directional)
                    sumVR[nCom] += (engine.nodeVoltage[nY] || 0) * G;
                    sum1R[nCom] += G;

                    sumVR[nY] += (engine.nodeVoltage[nCom] || 0) * G;
                    sum1R[nY] += G;
                }
            }
        }

        // 4. PENGAMAN MATRIKS (Dummy Load untuk pin digital)
        const condFloat = 1 / 10000000;
        [nInA, nInB, nInC, nInInh, nVee].forEach(pin => {
            if (pin !== -1) {
                sumVR[pin] += 0 * condFloat; sum1R[pin] += condFloat;
            }
        });
    }

    applyResults(engine) {
        // Membaca VDD dan VSS untuk animasi bodi IC menyala kuning di UI nanti
        const nVdd = engine.getNodeIndex(this.id, 'input', 6);
        const nVss = engine.getNodeIndex(this.id, 'input', 7);
        const vdd = nVdd !== -1 ? engine.nodeVoltage[nVdd] : 0;
        const vss = nVss !== -1 ? engine.nodeVoltage[nVss] : 0;
        this.simV_vcc = Math.abs(vdd - vss);
    }
}

// =====================================================
// 11. IC 7805 (VOLTAGE REGULATOR 5V - TO-220) [REVISI FISIKA KCL]
// =====================================================
export class IC7805 extends BaseComponent {    
    injectMatrix(engine, sumVR, sum1R, _iter) {
        const nIn  = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nGnd !== -1 && nOut !== -1) {
            const vIn = engine.nodeVoltage[nIn] || 0;
            const vGnd = engine.nodeVoltage[nGnd] || 0;
            const deltaV = vIn - vGnd;

            // 1. Sedot Arus Quiescent (Makanan internal IC ~5mA)
            const G_in = 1 / 1000000;
            sumVR[nIn] += (engine.nodeVoltage[nGnd] || 0) * G_in;
            sum1R[nIn] += G_in;
            sumVR[nGnd] += (engine.nodeVoltage[nIn] || 0) * G_in;
            sum1R[nGnd] += G_in;

            //Untuk IC7805 (Ubah dari 5mA ke 4.3mA) jika mau sama dengan proteus // Ubah 0.005 jadi 0.0043
            if (deltaV > 2.0) {
                sumVR[nIn] -= 0.005;  // Ditarik dari IN
                sumVR[nGnd] += 0.005; // Dibuang ke GND
            }

            // 2. REGULASI FISIKA NYATA (Dependent Voltage Source)
            if (deltaV > 2.0) {
                const G_reg = 1000; // Konduktansi raksasa (0.001 Ohm internal)
                let Vs = 0; // Selisih tegangan yang harus "dibakar" (di-drop) oleh IC

                if (deltaV >= 7.0) {
                    Vs = deltaV - 5.0; // Target Drop agar OUT tepat 5V di atas GND
                    this.state = 'regulating';
                    this.simV_out = 5.0;
                } else {
                    Vs = 2.0; // Saturated Dropout (Mentok drop 2V)
                    this.state = 'dropout';
                    this.simV_out = deltaV - 2.0;
                }

                // Hukum Norton: Memaksa Arus ditarik dari IN ke OUT
                const I_N = Vs * G_reg;

                // Sambungkan Pipa Fisika antara IN dan OUT
                sum1R[nIn] += G_reg;
                sum1R[nOut] += G_reg;
                sumVR[nIn] += (engine.nodeVoltage[nOut] || 0) * G_reg;
                sumVR[nOut] += (engine.nodeVoltage[nIn] || 0) * G_reg;

                // Suntikkan keseimbangan beban KCL
                sumVR[nIn] += I_N;   // Beban memberatkan IN
                sumVR[nOut] -= I_N;  // Beban disuplai ke OUT

            } else {
                this.state = 'off';
                this.simV_out = 0;
                const condFloat = 1 / 10000000;
                sumVR[nOut] += (engine.nodeVoltage[nGnd] || 0) * condFloat;
                sum1R[nOut] += condFloat;
                sumVR[nGnd] += (engine.nodeVoltage[nOut] || 0) * condFloat;
                sum1R[nGnd] += condFloat;
            }
        }
    }
}

// =====================================================
// 12. IC 7808 (VOLTAGE REGULATOR 8V - TO-220) [REVISI FISIKA KCL]
// =====================================================
export class IC7808 extends BaseComponent {    
    injectMatrix(engine, sumVR, sum1R, _iter) {
        const nIn  = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nGnd !== -1 && nOut !== -1) {
            const vIn = engine.nodeVoltage[nIn] || 0;
            const vGnd = engine.nodeVoltage[nGnd] || 0;
            const deltaV = vIn - vGnd;

            const G_in = 1 / 1000000;
            sumVR[nIn] += (engine.nodeVoltage[nGnd] || 0) * G_in;
            sum1R[nIn] += G_in;
            sumVR[nGnd] += (engine.nodeVoltage[nIn] || 0) * G_in;
            sum1R[nGnd] += G_in;

            //Untuk IC7808 (Ubah dari 5mA ke 4.5mA) // Ubah 0.005 jadi 0.0045
            if (deltaV > 2.0) {
                sumVR[nIn] -= 0.005;
                sumVR[nGnd] += 0.005;
            }

            if (deltaV > 2.0) {
                const G_reg = 1000; 
                let Vs = 0; 

                if (deltaV >= 10.0) {
                    Vs = deltaV - 8.0; // Target Drop agar OUT tepat 8V di atas GND
                    this.state = 'regulating';
                    this.simV_out = 8.0;
                } else {
                    Vs = 2.0; 
                    this.state = 'dropout';
                    this.simV_out = deltaV - 2.0;
                }

                const I_N = Vs * G_reg;

                sum1R[nIn] += G_reg;
                sum1R[nOut] += G_reg;
                sumVR[nIn] += (engine.nodeVoltage[nOut] || 0) * G_reg;
                sumVR[nOut] += (engine.nodeVoltage[nIn] || 0) * G_reg;

                sumVR[nIn] += I_N;   
                sumVR[nOut] -= I_N;  

            } else {
                this.state = 'off';
                this.simV_out = 0;
                const condFloat = 1 / 10000000;
                sumVR[nOut] += (engine.nodeVoltage[nGnd] || 0) * condFloat;
                sum1R[nOut] += condFloat;
                sumVR[nGnd] += (engine.nodeVoltage[nOut] || 0) * condFloat;
                sum1R[nGnd] += condFloat;
            }
        }
    }
}

export class IC74164 extends BaseComponent {
    // ==========================================
    // FASE 1: LOGIKA DIGITAL (PEMROSESAN MEMORI)
    // ==========================================
    solveDigital(_engine, iter) {
        // Inisialisasi memori internal (Array 8 bit) jika belum ada
        if (!this.shiftRegister) {
            this.shiftRegister = new Array(8).fill(0);
            this.prevClock = 0;
        }

        // 1. Baca nilai logika dari keempat input (0 atau 1)
        // Sesuai desain: Input 0=A, Input 1=B, Input 2=CLR, Input 3=CLK
        const A = this.inputStates[0] || 0;
        const B = this.inputStates[1] || 0;
        const CLR = this.inputStates[2] || 0;
        const CLK = this.inputStates[3] || 0;

        // 2. Tahap Eksekusi Asinkron (Reset)
        if (CLR === 0) {
            // Jika CLR diberi 0 (Ground), paksa semua memori jadi 0
            this.shiftRegister.fill(0);
        } 
        else {
            // 3. Tahap Deteksi Tepi Naik (Rising Edge)
            if (CLK === 1 && this.prevClock === 0) {
                
                // 4. Tahap Operasi Geser (Shifting)
                // Geser data dari kanan ke kiri (QG ke QH, QF ke QG, dst)
                for (let i = 7; i > 0; i--) {
                    this.shiftRegister[i] = this.shiftRegister[i - 1];
                }
                
                // Isi posisi terdepan (QA / index 0) dengan hasil logika A AND B
                this.shiftRegister[0] = (A === 1 && B === 1) ? 1 : 0;
            }
        }

        // PENTING: Update rekam jejak Clock khusus pada iterasi ke-4.
        // Ini memastikan deteksi transisi (edge detection) tidak "terbaca ganda" 
        // oleh iterasi Gauss-Seidel yang berulang-ulang di mesin Anda.
        if (iter === 4) {
            this.prevClock = CLK;
        }
    }

    // ==========================================
    // FASE 2: FISIKA ANALOG (SUNTIKAN TEGANGAN)
    // ==========================================
    injectMatrix(engine, sumVR, sum1R, _iter) {
        if (!this.shiftRegister) return;

        // Karakteristik output IC TTL standar
        const rOut = 100.0; // Resistansi internal 100 Ohm
        const gOut = 1 / rOut; // Konduktansi

        // Lakukan perulangan untuk menyuntikkan ke 8 pin Output (QA sampai QH)
        for (let i = 0; i < 8; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            
            // Jika pin output ini dicolok kabel
            if (nOut !== -1) {
                // 5. Konversi Digital ke Analog
                // Jika memori bernilai 1, targetkan 5V. Jika 0, targetkan 0V.
                const targetV = this.shiftRegister[i] === 1 ? 5.0 : 0.0;
                
                // 6. Suntikkan tegangan ke sirkuit (Norton Equivalent)
                sumVR[nOut] += targetV * gOut;
                sum1R[nOut] += gOut;
            }
        }
    }

    // ==========================================
    // FASE 3: PENYIMPANAN DATA (UNTUK VISUALISASI)
    // ==========================================
    applyResults(engine) {
        // Kita simpan tegangan fisik tiap pin output agar UI bisa membedakan 
        // mana lampu yang menyala redup karena drop tegangan.
        if (!this.outVoltages) this.outVoltages = new Array(8).fill(0);
        
        for (let i = 0; i < 8; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            this.outVoltages[i] = nOut !== -1 ? (engine.nodeVoltage[nOut] || 0) : 0;
        }
    }
}

ComponentRegistry['ic_74164'] = IC74164;

// =====================================================
// PENDAFTARAN KOMPONEN
// =====================================================
ComponentRegistry['ic_555'] = IC555;
ComponentRegistry['ic_lm3914'] = ICLM3914;
ComponentRegistry['ic_4017'] = IC4017;
ComponentRegistry['ic_4518'] = IC4518;
ComponentRegistry['ic_4518_dual'] = IC4518Dual;
ComponentRegistry['ic_4511'] = IC4511;
ComponentRegistry['ic_4026'] = IC4026;
ComponentRegistry['ic_7448'] = IC7448;
ComponentRegistry['ic_74LS90'] = IC74LS90;
ComponentRegistry['ic_4051'] = IC4051;
ComponentRegistry['ic_7805'] = IC7805;
ComponentRegistry['ic_7808'] = IC7808;
ComponentRegistry['ic_74164'] = IC74164;
