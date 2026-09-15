// File: src/engine/models/semiconductors/OpAmpModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class OpAmp extends BaseComponent {
    
    injectMatrix(engine, sumVR, sum1R) {
        const nInverting = engine.getNodeIndex(this.id, 'input', 0);
        const nNonInverting = engine.getNodeIndex(this.id, 'input', 1);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nOut !== -1) {
            const vMinus = nInverting !== -1 ? (engine.nodeVoltage[nInverting] || 0) : 0;
            const vPlus = nNonInverting !== -1 ? (engine.nodeVoltage[nNonInverting] || 0) : 0;

            const posRail = this.posRail !== undefined ? this.posRail : 15.0;
            const negRail = this.negRail !== undefined ? this.negRail : -15.0;
            
            // Output internal resistance (50 Ohm)
            const rOut = 50.0; 
            const gOut = 1 / rOut;

            // 1. Hitung Selisih (Error) Tegangan Input
            let error = vPlus - vMinus;

            // ==============================================================
            // 2. PERBAIKAN UTAMA: MODEL INTEGRATOR (ANTI-OSILASI)
            // ==============================================================
            if (this._lastTarget === undefined) this._lastTarget = 0;
            
            // Jangan dikali 10.000! Sebaliknya, "dorong" (nudge) nilai output 
            // secara halus menuju arah yang benar. 
            // Angka 0.2 berfungsi sebagai peredam (Slew Rate Numerik).
            this._lastTarget += error * 0.2; 

            // 3. Saturasi (Clipping) ke Power Supply
            if (this._lastTarget > posRail) this._lastTarget = posRail;
            if (this._lastTarget < negRail) this._lastTarget = negRail;

            // 4. Injeksi Hasil ke Matriks
            sumVR[nOut] += this._lastTarget * gOut;
            sum1R[nOut] += gOut;
        }
    }

    applyResults(engine) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = nOut !== -1 ? (engine.nodeVoltage[nOut] ?? 0) : 0;
    }
}

ComponentRegistry['opamp'] = OpAmp;

export class OpAmp5Pin extends BaseComponent {
    
    injectMatrix(engine, sumVR, sum1R) {
        // ==========================================
        // LANGKAH 1: PEMETAAN KAKI (PIN MAPPING)
        // ==========================================
        // Sesuai HTML: data-inputs="4", data-outputs="1"
        const nInverting = engine.getNodeIndex(this.id, 'input', 0);    // V-
        const nNonInverting = engine.getNodeIndex(this.id, 'input', 1); // V+
        const nVdd = engine.getNodeIndex(this.id, 'input', 2);          // VDD (Power Positif)
        const nVss = engine.getNodeIndex(this.id, 'input', 3);          // VSS (Power Negatif)
        const nOut = engine.getNodeIndex(this.id, 'output', 0);         // Vout

        // Algoritma hanya berjalan jika pin Output dicolok kabel
        if (nOut !== -1) {
            // ==========================================
            // LANGKAH 2: BACA KONDISI LINGKUNGAN
            // ==========================================
            const vMinus = nInverting !== -1 ? (engine.nodeVoltage[nInverting] ?? 0) : 0;
            const vPlus = nNonInverting !== -1 ? (engine.nodeVoltage[nNonInverting] ?? 0) : 0;
            const vDD = nVdd !== -1 ? (engine.nodeVoltage[nVdd] ?? 0) : 0;
            const vSS = nVss !== -1 ? (engine.nodeVoltage[nVss] ?? 0) : 0;

            // ==========================================
            // LANGKAH 3: SYARAT HIDUP (POWER-ON RESET)
            // ==========================================
            const vSupply = vDD - vSS;
            // Jika selisih suplai kurang dari 3.0V, Op-Amp Mati (High-Z)
            if (vSupply < 3.0) {
                // Hapus memori target jika mati
                this._lastTarget = 0; 
                return; // Keluar dari fungsi (Tidak ada injeksi arus)
            }

            // ==========================================
            // LANGKAH 4: KALKULASI TARGET & INTEGRATOR
            // ==========================================
            const error = vPlus - vMinus;
            
            if (this._lastTarget === undefined) this._lastTarget = 0;
            
            // Dorong target lama menuju selisih tegangan (Faktor Peredam/Slew Rate = 0.2)
            // Meskipun nilai targetnya seolah 1 (gain kecil), loop Gauss-Seidel akan 
            // terus menggesernya secara konstan sampai Error mendekati 0.
            this._lastTarget += error * 0.2;

            // ==========================================
            // LANGKAH 5: SATURASI DINAMIS (CLIPPING)
            // ==========================================
            // Meniru batasan transistor internal (Non-Rail-to-Rail)
            const vMax = vDD - 1.5;
            const vMin = vSS + 1.5;

            if (this._lastTarget > vMax) this._lastTarget = vMax;
            if (this._lastTarget < vMin) this._lastTarget = vMin;

            // ==========================================
            // LANGKAH 6: INJEKSI MATRIKS OUTPUT (NORTON)
            // ==========================================
            const rOut = 50.0; // 50 Ohm Hambatan internal output
            const gOut = 1 / rOut;
            
            // Suntikkan ekuivalen Norton ke pin Output
            sumVR[nOut] += this._lastTarget * gOut;
            sum1R[nOut] += gOut;

            // ==========================================
            // LANGKAH 7: TARIKAN BEBAN (SOURCING & SINKING)
            // ==========================================
            // Hitung arus aktual yang sedang keluar/masuk dari kaki Output
            const vActual = engine.nodeVoltage[nOut] ?? 0;
            const iOut = (this._lastTarget - vActual) * gOut;

            // Jika arus positif (keluar dari Op-Amp), tarik arus tersebut dari VDD
            if (iOut > 0 && nVdd !== -1) {
                sumVR[nVdd] -= iOut; 
            }
            // Jika arus negatif (masuk ke Op-Amp), buang arus tersebut ke VSS
            else if (iOut < 0 && nVss !== -1) {
                sumVR[nVss] -= iOut; // Pengurangan nilai minus = Menambah arus ke VSS
            }
        }
    }

    applyResults(engine) {
        // Simpan hasil komputasi untuk dirender oleh UI dan Tooltip
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = nOut !== -1 ? (engine.nodeVoltage[nOut] ?? 0) : 0;
        
        // Simpan status Power untuk indikator warna/animasi di UI nanti
        const nVdd = engine.getNodeIndex(this.id, 'input', 2);
        const nVss = engine.getNodeIndex(this.id, 'input', 3);
        const vDD = nVdd !== -1 ? (engine.nodeVoltage[nVdd] ?? 0) : 0;
        const vSS = nVss !== -1 ? (engine.nodeVoltage[nVss] ?? 0) : 0;
        
        this.isPowered = (vDD - vSS) >= 3.0;
    }
}
ComponentRegistry['opamp_5pin'] = OpAmp5Pin;

export class OpAmpLM741 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
    const nInverting = engine.getNodeIndex(this.id, 'input', 0);
    const nNonInverting = engine.getNodeIndex(this.id, 'input', 1);
    const nVdd = engine.getNodeIndex(this.id, 'input', 2);
    const nVss = engine.getNodeIndex(this.id, 'input', 3);
    const nOut = engine.getNodeIndex(this.id, 'output', 0);

    if (nOut !== -1) {
        // 1. ROBUST POWER DETECTION
        if (nVdd === -1 || nVss === -1) {
            this._lastTarget = 0;
            return; 
        }

        const vDD = engine.nodeVoltage[nVdd] ?? 0;
        const vSS = engine.nodeVoltage[nVss] ?? 0;
        const vSupply = vDD - vSS;

        if (vSupply < 4.0) {
            if (this._lastTarget === undefined || isNaN(this._lastTarget)) this._lastTarget = 0;
            this._lastTarget *= 0.9; 
            return; 
        }

        // 2. QUIESCENT CURRENT (Arus Siaga)
        const Iq = 0.002; 
        sumVR[nVdd] -= Iq; 
        sumVR[nVss] += Iq; 

        // 3. BACA INPUT
        const vMinus = nInverting !== -1 ? (engine.nodeVoltage[nInverting] ?? 0) : 0;
        const vPlus = nNonInverting !== -1 ? (engine.nodeVoltage[nNonInverting] ?? 0) : 0;
        
        // =======================================================
        // 4. ADAPTIVE STEP BERDASARKAN ERROR (Sangat Stabil)
        // =======================================================
        if (this._lastTarget === undefined || isNaN(this._lastTarget)) {
            this._lastTarget = 0;
        }

        const error = vPlus - vMinus;
        
        // Konstanta pengereman (Under-relaxation factor)
        // Angka 0.5 memastikan konvergensi mulus tanpa overshoot/ping-pong
        let step = error * 0.5; 

        // HARD LIMIT (Sabuk Pengaman / Slew Rate Numerik)
        // Jika error sangat besar (misal 5V), jangan lompat 2.5V, batasi di 0.5V saja
        if (step > 0.5) step = 0.5;
        if (step < -0.5) step = -0.5;

        // Eksekusi langkah
        this._lastTarget += step; 

        // =======================================================
        // 5. CLIPPING (Saturasi Baterai LM741)
        // =======================================================
        const vMax = vDD - 1.5;
        const vMin = vSS + 1.5;

        if (this._lastTarget > vMax) this._lastTarget = vMax;
        if (this._lastTarget < vMin) this._lastTarget = vMin;

        // 6. INJEKSI OUTPUT MATRIKS
        const rOut = 75.0; 
        const gOut = 1 / rOut;
        
        sumVR[nOut] += this._lastTarget * gOut;
        sum1R[nOut] += gOut;

        // 7. PEMBEBANAN BATERAI (Sourcing/Sinking)
        const vActual = engine.nodeVoltage[nOut] ?? 0;
        const iOut = (this._lastTarget - vActual) * gOut;

        if (iOut > 0) sumVR[nVdd] -= iOut; 
        else if (iOut < 0) sumVR[nVss] -= iOut; 
    }
}

    applyResults(engine) {
    const nOut = engine.getNodeIndex(this.id, 'output', 0);
    const nVdd = engine.getNodeIndex(this.id, 'input', 2);
    const nVss = engine.getNodeIndex(this.id, 'input', 3);
    
    const vDD = nVdd !== -1 ? (engine.nodeVoltage[nVdd] ?? 0) : 0;
    const vSS = nVss !== -1 ? (engine.nodeVoltage[nVss] ?? 0) : 0;
    
    this.isPowered = (vDD - vSS) >= 4.0;
    this.simV = nOut !== -1 ? (engine.nodeVoltage[nOut] ?? 0) : 0;
}
}

// Daftarkan model ini menggunakan string yang ada di HTML Anda
ComponentRegistry['opamp_lm741'] = OpAmpLM741;