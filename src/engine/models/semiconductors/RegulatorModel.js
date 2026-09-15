// File: src/engine/models/semiconductors/RegulatorModel.js
import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class VoltageRegulator7812 extends BaseComponent {
    constructor(data) {
        super(data);
        this.Gp = 0.001; // Konduktansi awal (Transistor Pass)
        this.regState = 'REGULATING';
        this.heat = 0;   // Akumulator suhu
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        // Kita asumsikan: Pin Input = input 0, Pin GND = input 1, Pin Output = output 0
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn === -1 || nGnd === -1 || nOut === -1) return;

        const Vin = engine.nodeVoltage[nIn];
        const Vgnd = engine.nodeVoltage[nGnd];
        const Vout = engine.nodeVoltage[nOut];

        // 1. Arus Siaga / Quiescent Current (~5mA mengalir dari IN ke GND)
        const Iq = 0.005;
        let Rq = 10000; // Default off
        if (Vin - Vgnd > 0.1) Rq = (Vin - Vgnd) / Iq; 
        const Gq = 1 / Math.max(0.1, Rq);
        
        sumVR[nIn] += Vgnd * Gq; sum1R[nIn] += Gq;
        sumVR[nGnd] += Vin * Gq; sum1R[nGnd] += Gq;

        // 2. Cek Overheat (Jika terlalu panas, putus sirkuit)
        if (this.regState === 'OVERHEAT') {
            this.Gp = 1e-6; // Konduktansi mendekati nol (Sakelar Terbuka)
        } else {
            // 3. Sistem Umpan Balik (Feedback Controller)
            const targetV = Vgnd + 12.0; 
            const error = targetV - Vout;

            // Transistor Pass menyesuaikan diri (Integral Controller)
            // Jika Vout kurang dari 12V, konduktansi (Gp) dinaikkan agar arus masuk lebih banyak
            this.Gp += error * 0.05;

            // 4. Batasan Fisika
            const MAX_G = 10.0; // Hambatan minimum 0.1 Ohm (Mode Dropout)
            const MIN_G = 1e-6; // Hambatan maksimum 1 MegaOhm (Off)
            
            if (this.Gp > MAX_G) this.Gp = MAX_G;
            if (this.Gp < MIN_G) this.Gp = MIN_G;

            const V_drop = Vin - Vout;
            if (V_drop > 0) {
                const current = V_drop * this.Gp;
                
                // Pembatasan Arus Maksimal (100 mA)
                if (current > 0.1) { 
                    this.Gp = 0.1 / V_drop; // Rem konduktansi secara paksa
                    this.regState = 'CURRENT_LIMIT';
                } else if (this.Gp === MAX_G && V_drop < 2.0) {
                    this.regState = 'DROPOUT'; // Input kurang dari 14V
                } else {
                    this.regState = 'REGULATING'; // Normal
                }
            }
        }

        // 5. Suntikkan Transistor Pass ke Matriks (antara IN dan OUT)
        sumVR[nIn] += Vout * this.Gp; sum1R[nIn] += this.Gp;
        sumVR[nOut] += Vin * this.Gp; sum1R[nOut] += this.Gp;
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nOut !== -1) {
            const Vin = engine.nodeVoltage[nIn];
            const Vout = engine.nodeVoltage[nOut];
            
            this.simV = Vout; 
            this.simI = Math.max(0, (Vin - Vout) * this.Gp);
            
            // Simulasi Termal Sederhana (Maks 0.6 Watt)
            const power = (Vin - Vout) * this.simI;
            if (power > 0.6) {
                this.heat += 0.05; // Memanas
            } else {
                this.heat -= 0.05; // Mendingin
            }
            
            if (this.heat < 0) this.heat = 0;
            if (this.heat > 10) {
                this.regState = 'OVERHEAT';
            } else if (this.heat === 0 && this.regState === 'OVERHEAT') {
                this.regState = 'REGULATING'; // Pulih dari overheat
            }
        }
    }
}
ComponentRegistry['ic_78L12'] = VoltageRegulator7812;

// =======================================================
// CLASS: IC LM7812 (Regulator Standar 1.5A / TO-220)
// =======================================================
export class VoltageRegulatorLM7812 extends BaseComponent {
    constructor(data) {
        super(data);
        this.Gp = 0.001; // Konduktansi awal
        this.regState = 'REGULATING';
        this.heat = 0;   // Akumulator suhu
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        // Pin 0: IN, Pin 1: GND, Pin 0 (Output): OUT
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn === -1 || nGnd === -1 || nOut === -1) return;

        const Vin = engine.nodeVoltage[nIn] || 0;
        const Vgnd = engine.nodeVoltage[nGnd] || 0;
        const Vout = engine.nodeVoltage[nOut] || 0;

        // 1. Quiescent Current (~5mA Siaga)
        const Iq = 0.005;
        let Rq = 10000; 
        if (Vin - Vgnd > 0.1) Rq = (Vin - Vgnd) / Iq; 
        const Gq = 1 / Math.max(0.1, Rq);
        
        sumVR[nIn] += Vgnd * Gq; sum1R[nIn] += Gq;
        sumVR[nGnd] += Vin * Gq; sum1R[nGnd] += Gq;

        // 2. Proteksi Overheat (Thermal Shutdown)
        if (this.regState === 'OVERHEAT') {
            this.Gp = 1e-6; // Putus sirkuit
        } else {
            // 3. Feedback Controller
            const targetV = Vgnd + 12.0; 
            const error = targetV - Vout;
            this.Gp += error * 0.1; // Respons lebih cepat dari 78L12

            // 4. Batasan Fisika Komponen Daya Besar
            const MAX_G = 20.0; // Hambatan minimum 0.05 Ohm (Transistor besar)
            const MIN_G = 1e-6; // Off
            
            if (this.Gp > MAX_G) this.Gp = MAX_G;
            if (this.Gp < MIN_G) this.Gp = MIN_G;

            const V_drop = Vin - Vout;
            if (V_drop > 0) {
                const current = V_drop * this.Gp;
                
                // 🟢 BATAS ARUS LM7812: 1.5 Ampere
                if (current > 1.5) { 
                    this.Gp = 1.5 / V_drop; // Rem konduktansi
                    this.regState = 'CURRENT_LIMIT';
                } else if (this.Gp === MAX_G && V_drop < 2.0) {
                    this.regState = 'DROPOUT'; 
                } else {
                    this.regState = 'REGULATING'; 
                }
            }
        }

        // 5. Suntikkan Transistor Pass ke Matriks
        sumVR[nIn] += Vout * this.Gp; sum1R[nIn] += this.Gp;
        sumVR[nOut] += Vin * this.Gp; sum1R[nOut] += this.Gp;
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nOut !== -1) {
            const Vin = engine.nodeVoltage[nIn] || 0;
            const Vout = engine.nodeVoltage[nOut] || 0;
            
            this.simV = Vout; 
            this.simI = Math.max(0, (Vin - Vout) * this.Gp);
            
            // 🟢 BATAS PANAS LM7812: 15 Watt (Diasumsikan pakai Heatsink standar)
            const power = (Vin - Vout) * this.simI;
            if (power > 15.0) {
                this.heat += 0.5; // Memanas
            } else {
                this.heat -= 0.5; // Mendingin
            }
            
            if (this.heat < 0) this.heat = 0;
            if (this.heat > 50) {
                this.regState = 'OVERHEAT';
            } else if (this.heat === 0 && this.regState === 'OVERHEAT') {
                this.regState = 'REGULATING'; // Pulih dari overheat
            }
        }
    }
}

// Mendaftarkan ID komponen baru ke Mesin Simulator
ComponentRegistry['ic_7812'] = VoltageRegulatorLM7812;