// File: src/engine/models/semiconductors/DiodeBridgeModel.js'

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class DiodeBridge extends BaseComponent {
    
    // 1. Inisialisasi Parameter Fisika Semikonduktor
    _initPhysics(engine) {
        // Kita butuh array 4 slot untuk merekam tegangan jatuh di ke-4 dioda internal
        if (!this.vd || this.vd.length !== 4) this.vd = [0, 0, 0, 0];
        
        const targetVf = 0.7; // Tegangan jatuh standar dioda silikon (0.7V)
        const targetI = 0.02; // Arus referensi 20mA
        
        // Membaca batas tegangan mundur (PIV). Default ke 100V jika kosong.
        this.bV = parseFloat(this.breakdownV) || 100.0;
        
        if (this._lastVf !== targetVf) {
            this.Is = 1e-14; // Arus saturasi balik (Saturation Current)
            // Hitung konstanta emisi ideality (n)
            this.n = targetVf / (engine.DiodePhysics.VT * Math.log(targetI / this.Is));
            this.Rs = 0.5; // Hambatan internal penyearah daya (0.5 Ohm)
            
            // --- Parameter Fisika Transien (Lambat) ---
            this.Cj0 = 50e-12; // 50 pF (Kapasitansi silikon yang tebal)
            this.Vj = 0.7;     // Tegangan barier
            this.M = 0.33;     // Kelengkungan junction
            this.TT = 5e-6;    // Transit Time (5 Mikrodetik! 250x lebih lambat dari 1N4148)
            // ---------------------------------------------------------
            
            this._lastVf = targetVf;
        }

        // --- Array Memori 4 Dioda ---
        if (!this.lastSimV || this.lastSimV.length !== 4) {
            this.lastSimV = [0, 0, 0, 0];
        }
    }

    // 2. Injeksi Matriks Kelistrikan (Hukum Kirchhoff)
    injectMatrix(engine, sumVR, sum1R, iter) {
        if (iter === 0) this._initPhysics(engine);

        // Petakan ke-4 Kaki (Pin) Dioda Bridge
        const nAcTop = engine.getNodeIndex(this.id, 'input', 0);  
        const nAcBot = engine.getNodeIndex(this.id, 'input', 1);  
        const nDcPos = engine.getNodeIndex(this.id, 'output', 0); 
        const nDcNeg = engine.getNodeIndex(this.id, 'output', 1); 

        // Ambil waktu per langkah iterasi dari mesin (Delta Time)
        const dt = engine.FIXED_DT || 0.001; 

        // Fungsi Helper: Memproses 1 dioda berdasarkan indeksnya (0 sampai 3)
        const processDiode = (nodeA, nodeB, idx) => {
            if (nodeA !== -1 && nodeB !== -1) {
                const vA = engine.nodeVoltage[nodeA] || 0;
                const vB = engine.nodeVoltage[nodeB] || 0;
                const vDiff = vA - vB;

                // Cegah lonjakan perhitungan eksponensial (Damping)
                this.vd[idx] = engine.DiodePhysics.limitVoltageStep(vDiff, this.vd[idx]);

                let Geff = 0, Ieff = 0;
                let Geq_pure = 0; // Untuk mencatat muatan difusi murni
                
                if (this.vd[idx] < -this.bV) { 
                    // Breakdown Voltage (PIV): Dioda bocor akibat tegangan terbalik
                    Geff = 1 / 10; 
                    Ieff = Geff * this.bV; 
                    Geq_pure = Geff;
                } else {
                    // Linearisasi Kurva Dioda (Newton-Raphson)
                    const lin = engine.DiodePhysics.linearize(this.vd[idx], this.Is, this.n);
                    const denom = 1 + (lin.Geq * this.Rs);
                    Geff = lin.Geq / denom;
                    Ieff = lin.Ieq / denom;
                    Geq_pure = lin.Geq; 
                }

                // --- Rumus Kapasitansi Euler ---
                // a. Junction Capacitance (Cj)
                const vj_safe = Math.min(this.vd[idx], this.Vj * 0.5);
                const Cj = this.Cj0 / Math.pow((1 - (vj_safe / this.Vj)), this.M);

                // b. Diffusion Capacitance (Cd) - Efek Lambat saat muatan terjebak
                const Cd = this.TT * Geq_pure;

                // c. Total Kapasitansi Dinamis
                const Ct = Cj + Cd;

                // d. Konversi ke Matriks Resistor-Arus Bayangan
                const Gc = Ct / dt; 
                const Ic = Gc * (this.lastSimV[idx] || 0); 

                // e. Terapkan pembebanan parasitik ke dioda
                Geff += Gc;
                Ieff -= Ic;
                // ----------------------------------------------

                // Injeksi konduktansi dan arus ke dalam matriks Gauss-Seidel
                sumVR[nodeA] += (vB * Geff) - Ieff; sum1R[nodeA] += Geff;
                sumVR[nodeB] += (vA * Geff) + Ieff; sum1R[nodeB] += Geff;
            }
        };

        // SUSUNAN JEMBATAN 4 DIODA:
        // Saat Siklus AC Positif: Arus lewat D1 lalu balik lewat D2
        // Saat Siklus AC Negatif: Arus lewat D3 lalu balik lewat D4
        processDiode(nAcTop, nDcPos, 0); // D1: Anoda di AC Atas, Katoda di DC +
        processDiode(nDcNeg, nAcBot, 1); // D2: Anoda di DC -, Katoda di AC Bawah
        processDiode(nAcBot, nDcPos, 2); // D3: Anoda di AC Bawah, Katoda di DC +
        processDiode(nDcNeg, nAcTop, 3); // D4: Anoda di DC -, Katoda di AC Atas
    }

    // 3. Rekap Hasil Akhir untuk UI dan Memori Transien
    applyResults(engine) {
        // Peta node
        const nAcTop = engine.getNodeIndex(this.id, 'input', 0);
        const nAcBot = engine.getNodeIndex(this.id, 'input', 1);
        const nDcPos = engine.getNodeIndex(this.id, 'output', 0);
        const nDcNeg = engine.getNodeIndex(this.id, 'output', 1);
        
        // Tarik tegangan real-time dari matriks
        const vAcTop = nAcTop !== -1 ? engine.nodeVoltage[nAcTop] : 0;
        const vAcBot = nAcBot !== -1 ? engine.nodeVoltage[nAcBot] : 0;
        const vDcPos = nDcPos !== -1 ? engine.nodeVoltage[nDcPos] : 0;
        const vDcNeg = nDcNeg !== -1 ? engine.nodeVoltage[nDcNeg] : 0;
        
        // Simpan output DC untuk animasi UI (Kabel Hijau)
        this.simV = Math.abs(vDcPos - vDcNeg);

        // --- Rekam jejak memori 4 dioda ---
        if (!this.lastSimV) this.lastSimV = [0, 0, 0, 0];
        
        // Dioda 1 (Anoda nAcTop, Katoda nDcPos)
        this.lastSimV[0] = vAcTop - vDcPos;
        // Dioda 2 (Anoda nDcNeg, Katoda nAcBot)
        this.lastSimV[1] = vDcNeg - vAcBot;
        // Dioda 3 (Anoda nAcBot, Katoda nDcPos)
        this.lastSimV[2] = vAcBot - vDcPos;
        // Dioda 4 (Anoda nDcNeg, Katoda nAcTop)
        this.lastSimV[3] = vDcNeg - vAcTop;
        // -------------------------------------------------
    }
};
ComponentRegistry['diode_bridge'] = DiodeBridge;