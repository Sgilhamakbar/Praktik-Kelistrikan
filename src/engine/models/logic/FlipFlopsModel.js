// File: src/engine/models/logic/FlipFlopsModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

// -----------------------------------------------------
// KOMPONEN EKSKLUSIF: D FLIP-FLOP
// -----------------------------------------------------

export class DFlipFlop extends BaseComponent {
    onTimeUpdate(dt, _now) {
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0; 
        if (this.targetState !== undefined && this.targetState !== this.outputState) {
            if (this.delayTimer === undefined) this.delayTimer = 0;
            this.delayTimer += dt; 
            if (isNaN(delaySec) || this.delayTimer >= delaySec) {
                this.outputState = this.targetState;
                this.delayTimer = 0; 
            }
        } else {
            this.delayTimer = 0; 
        }
    }

    solveDigital(_engine, iter) {
        // Pin 0: D, Pin 1: CLK, Pin 2: SET, Pin 3: RST
        const D   = this.inputStates[0] === 1 ? 1 : 0;
        const CLK = this.inputStates[1] === 1 ? 1 : 0;
        const SET = this.inputStates[2] === 1 ? 1 : 0;
        const RST = this.inputStates[3] === 1 ? 1 : 0;

        if (this.outputState === undefined) {
            this.outputState = this.initialState != null ? parseInt(this.initialState) : 0;
            if (isNaN(this.outputState)) this.outputState = 0;
            this.targetState = this.outputState;
        }

        let isRisingEdge = false;
        if (this.prevClock === undefined) { 
            if (iter === 4) this.prevClock = CLK; 
        } else {
            if (this.prevClock === 0 && CLK === 1) isRisingEdge = true; 
            if (iter === 4) this.prevClock = CLK; 
        }

        let nextState = this.targetState;

        if (SET === 1 && RST === 0) {
            nextState = 1;
        } else if (RST === 1 && SET === 0) {
            nextState = 0;
        } else if (SET === 1 && RST === 1) {
        } else if (isRisingEdge) {
            nextState = D; // D Flip-Flop: Output Q menyalin nilai D
        }
        
        this.targetState = nextState;
        
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0;
        if (isNaN(delaySec) || delaySec <= 0) {
            this.outputState = this.targetState;
        }
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nOutQ = engine.getNodeIndex(this.id, 'output', 0);
        const nOutQBar = engine.getNodeIndex(this.id, 'output', 1);
        if (nOutQ !== -1) { engine.nodeVoltage[nOutQ] = this.outputState === 1 ? 5.0 : 0.0; fixedNodes[nOutQ] = true; }
        if (nOutQBar !== -1) { engine.nodeVoltage[nOutQBar] = this.outputState === 1 ? 0.0 : 5.0; fixedNodes[nOutQBar] = true; }
    }

    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000; 
        for (let i = 0; i < 4; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
};

// -----------------------------------------------------
// KOMPONEN EKSKLUSIF: T FLIP-FLOP
// -----------------------------------------------------
export class TFlipFlop extends BaseComponent {
    onTimeUpdate(dt, _now) {
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0; 
        if (this.targetState !== undefined && this.targetState !== this.outputState) {
            if (this.delayTimer === undefined) this.delayTimer = 0;
            this.delayTimer += dt; 
            if (isNaN(delaySec) || this.delayTimer >= delaySec) {
                this.outputState = this.targetState;
                this.delayTimer = 0; 
            }
        } else {
            this.delayTimer = 0; 
        }
    }

    solveDigital(_engine, iter) {
        // Pin 0: T, Pin 1: CLK
        const T   = this.inputStates[0] === 1 ? 1 : 0;
        const CLK = this.inputStates[1] === 1 ? 1 : 0;

        if (this.outputState === undefined) {
            this.outputState = this.initialState != null ? parseInt(this.initialState) : 0;
            if (isNaN(this.outputState)) this.outputState = 0;
            this.targetState = this.outputState;
        }

        let isRisingEdge = false;
        if (this.prevClock === undefined) { 
            if (iter === 4) this.prevClock = CLK; 
        } else {
            if (this.prevClock === 0 && CLK === 1) isRisingEdge = true; 
            if (iter === 4) this.prevClock = CLK; 
        }

        let nextState = this.targetState;

        if (isRisingEdge) {
            if (T === 1) {
                nextState = this.outputState === 1 ? 0 : 1; // T = 1: Toggle
            }
            // T = 0: Hold (Tidak berubah)
        }
        
        this.targetState = nextState;
        
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0;
        if (isNaN(delaySec) || delaySec <= 0) {
            this.outputState = this.targetState;
        }
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nOutQ = engine.getNodeIndex(this.id, 'output', 0);
        const nOutQBar = engine.getNodeIndex(this.id, 'output', 1);
        if (nOutQ !== -1) { engine.nodeVoltage[nOutQ] = this.outputState === 1 ? 5.0 : 0.0; fixedNodes[nOutQ] = true; }
        if (nOutQBar !== -1) { engine.nodeVoltage[nOutQBar] = this.outputState === 1 ? 0.0 : 5.0; fixedNodes[nOutQBar] = true; }
    }

    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000; 
        for (let i = 0; i < 2; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
};

// -----------------------------------------------------
// KOMPONEN EKSKLUSIF: SR FLIP-FLOP (DENGAN PROPAGATION DELAY)
// -----------------------------------------------------
export class SRFlipFlop extends BaseComponent {
    
    // 1. MESIN WAKTU (DELAY)
    onTimeUpdate(dt, _now) {
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0; 
        
        if (this.targetState !== undefined && this.targetState !== this.outputState) {
            if (this.delayTimer === undefined) this.delayTimer = 0;
            this.delayTimer += dt; 
            
            if (isNaN(delaySec) || this.delayTimer >= delaySec) {
                this.outputState = this.targetState;
                this.delayTimer = 0; 
            }
        } else {
            this.delayTimer = 0; 
        }
    }

    solveDigital(_engine, iter) {
        // SR Flip-flop standar kita punya 3 Input (S, R, CLK)
        const S   = this.inputStates[0] === 1 ? 1 : 0;
        const R   = this.inputStates[1] === 1 ? 1 : 0;
        const CLK = this.inputStates[2] === 1 ? 1 : 0;

        // Status Awal
        if (this.outputState === undefined) {
            this.outputState = this.initialState != null ? parseInt(this.initialState) : 0;
            if (isNaN(this.outputState)) this.outputState = 0;
            this.targetState = this.outputState;
        }

        // Deteksi Tepi Naik (Rising Edge)
        let isRisingEdge = false;
        if (this.prevClock === undefined) { 
            if (iter === 4) this.prevClock = CLK; 
        } else {
            if (this.prevClock === 0 && CLK === 1) isRisingEdge = true; 
            if (iter === 4) this.prevClock = CLK; 
        }

        let nextState = this.targetState;

        // Logika Sinkron (Hanya jalan saat ada detak Clock)
        if (isRisingEdge) {
            if (S === 1 && R === 0) {
                nextState = 1; // Set: Q menjadi 1
            } else if (S === 0 && R === 1) {
                nextState = 0; // Reset: Q ditarik ke 0
            } else if (S === 1 && R === 1) {
                nextState = 0; // Invalid/Terlarang: Kita amankan paksa ke 0
            }
            // Jika S=0 & R=0 -> Hold (Kondisi tetap, tidak ada perubahan)
        }
        
        this.targetState = nextState;
        
        // Bypass Instan (Jika delay disetel 0)
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0;
        if (isNaN(delaySec) || delaySec <= 0) {
            this.outputState = this.targetState;
        }
    }

    // 2. KELUARAN KELISTRIKAN
    applyFixedVoltage(engine, fixedNodes) {
        const nOutQ = engine.getNodeIndex(this.id, 'output', 0);
        const nOutQBar = engine.getNodeIndex(this.id, 'output', 1);
        
        if (nOutQ !== -1) { 
            engine.nodeVoltage[nOutQ] = this.outputState === 1 ? 5.0 : 0.0; 
            fixedNodes[nOutQ] = true; 
        }
        if (nOutQBar !== -1) { 
            engine.nodeVoltage[nOutQBar] = this.outputState === 1 ? 0.0 : 5.0; 
            fixedNodes[nOutQBar] = true; 
        }
    }

    // 3. PENGAMAN KABEL MENGAMBANG
    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000; 
        // SR Flip-flop kita memiliki 3 buah pin input (S, R, CLK)
        for (let i = 0; i < 3; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { 
                sumVR[nIn] += 0 * condFloat; 
                sum1R[nIn] += condFloat; 
            }
        }
    }
};

// -----------------------------------------------------
// KOMPONEN EKSKLUSIF: JK FLIP-FLOP (DENGAN PROPAGATION DELAY)
// -----------------------------------------------------
export class JKFlipFlop extends BaseComponent {
    
    // 1. MESIN WAKTU: Dieksekusi secara otomatis oleh SimulationEngine setiap frame
    onTimeUpdate(dt, _now) {
        // PERBAIKAN: Gunakan != null agar aman dari perubahan format JSON (localStorage)
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0; 
        
        // Jika ada perintah target perubahan status...
        if (this.targetState !== undefined && this.targetState !== this.outputState) {
            if (this.delayTimer === undefined) this.delayTimer = 0;
            
            // Tambahkan waktu yang berlalu (dt = delta time) ke dalam timer
            this.delayTimer += dt; 
            
            // Jika waktu rambat (delay) sudah terpenuhi (atau jika delaySec ternyata error/NaN), eksekusi perubahannya!
            if (isNaN(delaySec) || this.delayTimer >= delaySec) {
                this.outputState = this.targetState;
                this.delayTimer = 0; // Reset timer
            }
        } else {
            this.delayTimer = 0; // Reset timer jika anteng (tidak ada perubahan)
        }
    }

    solveDigital(_engine, iter) {
        const J   = this.inputStates[0] === 1 ? 1 : 0;
        const K   = this.inputStates[1] === 1 ? 1 : 0;
        const CLK = this.inputStates[2] === 1 ? 1 : 0;
        const SET = this.inputStates[3] === 1 ? 1 : 0;
        const RST = this.inputStates[4] === 1 ? 1 : 0;

        // 2. POWER-ON STATE: Saat mesin pertama kali dinyalakan (Play)
        if (this.outputState === undefined) {
            // PERBAIKAN: Gunakan != null dan proteksi isNaN
            this.outputState = this.initialState != null ? parseInt(this.initialState) : 0;
            if (isNaN(this.outputState)) this.outputState = 0; // Ekstra pelindung
            this.targetState = this.outputState;
        }

        let isRisingEdge = false;
        if (this.prevClock === undefined) { 
            if (iter === 4) this.prevClock = CLK; 
        } else {
            if (this.prevClock === 0 && CLK === 1) isRisingEdge = true; 
            if (iter === 4) this.prevClock = CLK; 
        }

        // 3. EVALUASI LOGIKA (Disimpan ke targetState, bukan ke outputState langsung)
        let nextState = this.targetState;

        if (SET === 1 && RST === 0) {
            nextState = 1; // Asynchronous Set
        } 
        else if (RST === 1 && SET === 0) {
            nextState = 0; // Asynchronous Reset
        } 
        else if (SET === 1 && RST === 1) {
        } 
        else if (isRisingEdge) {
            // Acuan Toggle (Pembalik) harus berpatokan pada status fisik (outputState) saat ini
            let currentState = this.outputState; 
            
            if (J === 1 && K === 0) {
                nextState = 1;
            } else if (J === 0 && K === 1) {
                nextState = 0;
            } else if (J === 1 && K === 1) {
                nextState = currentState === 1 ? 0 : 1; // Logika Toggle
            }
        }
        
        // Simpan keputusan ke target. Biarkan onTimeUpdate yang mengeksekusinya ke output fisik
        this.targetState = nextState;
        
        // Bypass Khusus: Jika delay disetel 0 (Mode Ideal), langsung terapkan saat ini juga
        // PERBAIKAN: Amankan logika bypass ini dari bahaya nilai NaN
        const delaySec = this.propDelay != null ? parseFloat(this.propDelay) : 0.0;
        if (isNaN(delaySec) || delaySec <= 0) {
            this.outputState = this.targetState;
        }
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nOutQ = engine.getNodeIndex(this.id, 'output', 0);
        const nOutQBar = engine.getNodeIndex(this.id, 'output', 1);
        
        // Output matriks kelistrikan selalu membaca dari 'outputState' yang sudah lolos filter Waktu Rambat
        if (nOutQ !== -1) { 
            engine.nodeVoltage[nOutQ] = this.outputState === 1 ? 5.0 : 0.0; 
            fixedNodes[nOutQ] = true; 
        }
        if (nOutQBar !== -1) { 
            engine.nodeVoltage[nOutQBar] = this.outputState === 1 ? 0.0 : 5.0; 
            fixedNodes[nOutQBar] = true; 
        }
    }

    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000; 
        for (let i = 0; i < 5; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { 
                sumVR[nIn] += 0 * condFloat; 
                sum1R[nIn] += condFloat; 
            }
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['ff_d'] = DFlipFlop;
ComponentRegistry['ff_t'] = TFlipFlop;
ComponentRegistry['ff_sr'] = SRFlipFlop;
ComponentRegistry['ff_jk'] = JKFlipFlop;