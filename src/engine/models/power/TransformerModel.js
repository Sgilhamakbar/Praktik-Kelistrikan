// File: src/engine/models/power/TransformerModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

// =========================================================
// 1. TRANSFORMER CENTER TAP (3D MUTUAL INDUCTOR - BDF2)
// =========================================================
export class Transformer extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const DT = engine.FIXED_DT || 0.001;
        const DT_prime = (2 * DT) / 3.0;

        const priV_rated = this.priV !== undefined ? parseFloat(this.priV) : 220.0;
        const secV_rated = this.secV !== undefined ? parseFloat(this.secV) : 24.0;
        const k_raw = this.coupling !== undefined ? parseFloat(this.coupling) : 1.0;
        const k = Math.max(0.1, Math.min(k_raw, 0.999)); // Maksimal 0.999 untuk mencegah Singular Matrix

        // 1. CACHING MATRIKS 3x3 (Agar browser tidak lag menghitung setiap frame)
        const cacheKey = `${priV_rated}-${secV_rated}-${k}-${DT}`;
        if (this._cacheKey !== cacheKey) {
            const Lp = 100.0;
            // Pada Trafo CT, rasio lilitan dibagi rata ke lilitan atas dan lilitan bawah
            const ratioHalf = (secV_rated / 2.0) / priV_rated;
            const Ls = Lp * (ratioHalf * ratioHalf);

            // Induktansi Mutual (Kemagnetan Silang antar 3 Kumparan)
            const M_ps = k * Math.sqrt(Lp * Ls); // Primer ke Sekunder (Atas/Bawah)
            const M_ss = k * Ls;                 // Sekunder Atas ke Sekunder Bawah

            // Rumus Cramer: Determinan Matriks 3x3
            const det = Lp * (Ls * Ls - M_ss * M_ss) - 2 * M_ps * M_ps * (Ls - M_ss);

            // Inversi Matriks 3D menjadi Konduktansi (G)
            this.G11 = DT_prime * ((Ls * Ls - M_ss * M_ss) / det);
            this.G12 = DT_prime * (-(M_ps * Ls - M_ps * M_ss) / det);
            this.G13 = DT_prime * ((M_ps * M_ss - M_ps * Ls) / det);
            
            this.G22 = DT_prime * ((Lp * Ls - M_ps * M_ps) / det);
            this.G23 = DT_prime * (-(Lp * M_ss - M_ps * M_ps) / det);
            
            this.G33 = DT_prime * ((Lp * Ls - M_ps * M_ps) / det);

            // Matriks bersifat Simetris
            this.G21 = this.G12;
            this.G31 = this.G13;
            this.G32 = this.G23;

            this._cacheKey = cacheKey;
        }

        // 2. Siapkan 3 Set Memori Sejarah Arus (Gear's 2nd Order)
        if (!this.iPriHistory) this.iPriHistory = new Float64Array([0, 0]);
        if (!this.iSec1History) this.iSec1History = new Float64Array([0, 0]);
        if (!this.iSec2History) this.iSec2History = new Float64Array([0, 0]);

        const ip_eq = (4/3) * this.iPriHistory[0] - (1/3) * this.iPriHistory[1];
        const is1_eq = (4/3) * this.iSec1History[0] - (1/3) * this.iSec1History[1];
        const is2_eq = (4/3) * this.iSec2History[0] - (1/3) * this.iSec2History[1];

        // 3. Ekstraksi 5 Pin Trafo CT
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        const nOutTop = engine.getNodeIndex(this.id, 'output', 0);
        const nOutCT  = engine.getNodeIndex(this.id, 'output', 1);
        const nOutBot = engine.getNodeIndex(this.id, 'output', 2);

        const vIn0 = nIn0 !== -1 ? (engine.nodeVoltage[nIn0] || 0) : 0;
        const vIn1 = nIn1 !== -1 ? (engine.nodeVoltage[nIn1] || 0) : 0;
        const vTop = nOutTop !== -1 ? (engine.nodeVoltage[nOutTop] || 0) : 0;
        const vCT  = nOutCT !== -1 ? (engine.nodeVoltage[nOutCT] || 0) : 0;
        const vBot = nOutBot !== -1 ? (engine.nodeVoltage[nOutBot] || 0) : 0;

        const gCore = 1 / 100000; // Parasit Anti-Crash untuk pin mengambang
        const { G11, G12, G13, G21, G22, G23, G31, G32, G33 } = this;

        // ==========================================
        // 4. INJEKSI MNA 3 DIMENSI KE MATRIKS UTAMA
        // ==========================================
        if (nIn0 !== -1) {
            sum1R[nIn0] += G11 + gCore;
            sumVR[nIn0] += vIn1 * (G11 + gCore) - vTop * G12 - vCT * (G13 - G12) + vBot * G13 - ip_eq;
        }
        if (nIn1 !== -1) {
            sum1R[nIn1] += G11 + gCore;
            sumVR[nIn1] += vIn0 * (G11 + gCore) + vTop * G12 + vCT * (G13 - G12) - vBot * G13 + ip_eq;
        }
        if (nOutTop !== -1) {
            sum1R[nOutTop] += G22 + gCore;
            sumVR[nOutTop] += -vIn0 * G21 + vIn1 * G21 - vCT * (G23 - G22 - gCore) + vBot * G23 - is1_eq;
        }
        if (nOutBot !== -1) {
            sum1R[nOutBot] += G33 + gCore;
            sumVR[nOutBot] += vIn0 * G31 - vIn1 * G31 + vTop * G32 - vCT * (G32 - G33 - gCore) + is2_eq;
        }
        if (nOutCT !== -1) {
            // Pin CT menerima tabrakan arus induksi dari Lilitan Atas dan Lilitan Bawah sekaligus!
            sum1R[nOutCT] += G22 + G33 - G23 - G32 + 2 * gCore;
            sumVR[nOutCT] += vIn0 * (G21 - G31) - vIn1 * (G21 - G31) + vTop * (G22 + gCore - G32) - vBot * (G23 - G33 - gCore) + is1_eq - is2_eq;
        }
    }

    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        const nOutTop = engine.getNodeIndex(this.id, 'output', 0);
        const nOutCT  = engine.getNodeIndex(this.id, 'output', 1);
        const nOutBot = engine.getNodeIndex(this.id, 'output', 2);
        
        const vIn0 = nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0;
        const vIn1 = nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0;
        const vTop = nOutTop !== -1 ? engine.nodeVoltage[nOutTop] : 0;
        const vCT  = nOutCT !== -1 ? engine.nodeVoltage[nOutCT] : 0;
        const vBot = nOutBot !== -1 ? engine.nodeVoltage[nOutBot] : 0;
        
        const vp = vIn0 - vIn1;
        const vs1 = vTop - vCT;
        const vs2 = vCT - vBot;

        if (!this.iPriHistory) return; // Mencegah crash jika dipanggil sebelum injectMatrix

        const ip_eq = (4/3) * this.iPriHistory[0] - (1/3) * this.iPriHistory[1];
        const is1_eq = (4/3) * this.iSec1History[0] - (1/3) * this.iSec1History[1];
        const is2_eq = (4/3) * this.iSec2History[0] - (1/3) * this.iSec2History[1];

        const { G11, G12, G13, G21, G22, G23, G31, G32, G33 } = this;

        // 5. Kalkulasi Ulang 3 Arus Transien Lilitan
        const ip = G11 * vp + G12 * vs1 + G13 * vs2 + ip_eq;
        const is1 = G21 * vp + G22 * vs1 + G23 * vs2 + is1_eq;
        const is2 = G31 * vp + G32 * vs1 + G33 * vs2 + is2_eq;

        // 6. Simpan Memori untuk Frame Berikutnya
        this.iPriHistory[1] = this.iPriHistory[0];
        this.iPriHistory[0] = ip;

        this.iSec1History[1] = this.iSec1History[0];
        this.iSec1History[0] = is1;

        this.iSec2History[1] = this.iSec2History[0];
        this.iSec2History[0] = is2;

        this.simV = Math.abs(vp); // Nyalakan efek kawat bersinar di kanvas
    }
};

// =========================================================
// 2. TRANSFORMER 2P2S (LINEAR MUTUAL INDUCTOR - BDF2)
// =========================================================
export class Transformer2P2S extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const DT = engine.FIXED_DT || 0.001;
        const DT_prime = (2 * DT) / 3.0; // Konstanta Waktu BDF2

        // 1. Ambil Parameter Pengaturan
        const priV_rated = this.priV !== undefined ? parseFloat(this.priV) : 220.0;
        const secV_rated = this.secV !== undefined ? parseFloat(this.secV) : 24.0;
        
        // Batasi faktor kopling (k) maks 0.999 untuk mencegah Singular Matrix (Crash dibagi nol)
        const k_raw = this.coupling !== undefined ? parseFloat(this.coupling) : 1.0;
        const k = Math.max(0.1, Math.min(k_raw, 0.999)); 

        // 2. Kalkulasi Induktansi Fisik (L)
        const Lp = 100.0; // Induktansi Primer Default (100 Henry)
        const ratio = secV_rated / priV_rated;
        const Ls = Lp * (ratio * ratio); // Induktansi Sekunder menyesuaikan rasio
        
        const M = k * Math.sqrt(Lp * Ls); // Induktansi Mutual (Kemagnetan Bersama)

        // 3. Inversi Matriks Induktansi (Krammer's Rule 2x2)
        const det = (Lp * Ls) - (M * M);
        const G11 = (DT_prime * Ls) / det; // Konduktansi Mandiri Primer
        const G22 = (DT_prime * Lp) / det; // Konduktansi Mandiri Sekunder
        const G12 = (DT_prime * M) / det;  // Konduktansi Silang (Efek Induksi)

        // 4. Siapkan Memori BDF2
        if (!this.iPriHistory) this.iPriHistory = new Float64Array([0, 0]);
        if (!this.iSecHistory) this.iSecHistory = new Float64Array([0, 0]);

        const ip_eq = (4/3) * this.iPriHistory[0] - (1/3) * this.iPriHistory[1];
        const is_eq = (4/3) * this.iSecHistory[0] - (1/3) * this.iSecHistory[1];

        // 5. Ekstraksi Pin
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1);

        // Ambil voltase dari iterasi MNA saat ini secara real-time
        const vIn0 = nIn0 !== -1 ? (engine.nodeVoltage[nIn0] || 0) : 0;
        const vIn1 = nIn1 !== -1 ? (engine.nodeVoltage[nIn1] || 0) : 0;
        const vOut0 = nOut0 !== -1 ? (engine.nodeVoltage[nOut0] || 0) : 0;
        const vOut1 = nOut1 !== -1 ? (engine.nodeVoltage[nOut1] || 0) : 0;

        const vp = vIn0 - vIn1;
        const vs = vOut0 - vOut1;

        // ==========================================
        // 6. INJEKSI KE MESIN MNA (GAUSS-SEIDEL)
        // ==========================================
        
        // Konduktansi Parasit (Rugi-rugi Inti Besi) agar tidak error saat mengambang
        const gCore = 1 / 100000; 

        // SISI PRIMER
        if (nIn0 !== -1) {
            sum1R[nIn0] += G11 + gCore;
            sumVR[nIn0] += vIn1 * G11 - (vs * G12) - ip_eq + (vIn1 * gCore);
        }
        if (nIn1 !== -1) {
            sum1R[nIn1] += G11 + gCore;
            sumVR[nIn1] += vIn0 * G11 + (vs * G12) + ip_eq + (vIn0 * gCore);
        }

        // SISI SEKUNDER
        if (nOut0 !== -1) {
            sum1R[nOut0] += G22 + gCore;
            sumVR[nOut0] += vOut1 * G22 - (vp * G12) - is_eq + (vOut1 * gCore);
        }
        if (nOut1 !== -1) {
            sum1R[nOut1] += G22 + gCore;
            sumVR[nOut1] += vOut0 * G22 + (vp * G12) + is_eq + (vOut0 * gCore);
        }
    }

    applyResults(engine) {
        const DT = engine.FIXED_DT || 0.001;
        const DT_prime = (2 * DT) / 3.0;

        const priV_rated = this.priV !== undefined ? parseFloat(this.priV) : 220.0;
        const secV_rated = this.secV !== undefined ? parseFloat(this.secV) : 24.0;
        const k_raw = this.coupling !== undefined ? parseFloat(this.coupling) : 1.0;
        const k = Math.max(0.1, Math.min(k_raw, 0.999)); 

        const Lp = 100.0; 
        const ratio = secV_rated / priV_rated;
        const Ls = Lp * (ratio * ratio);
        const M = k * Math.sqrt(Lp * Ls);

        const det = (Lp * Ls) - (M * M);
        const G11 = (DT_prime * Ls) / det;
        const G22 = (DT_prime * Lp) / det;
        const G12 = (DT_prime * M) / det; 

        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1);
        
        const vp = (nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0) - (nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0);
        const vs = (nOut0 !== -1 ? engine.nodeVoltage[nOut0] : 0) - (nOut1 !== -1 ? engine.nodeVoltage[nOut1] : 0);
        
        if (!this.iPriHistory) this.iPriHistory = new Float64Array([0, 0]);
        if (!this.iSecHistory) this.iSecHistory = new Float64Array([0, 0]);

        const ip_eq = (4/3) * this.iPriHistory[0] - (1/3) * this.iPriHistory[1];
        const is_eq = (4/3) * this.iSecHistory[0] - (1/3) * this.iSecHistory[1];

        // Hitung Aktual Arus Lilitan
        const ip = G11 * vp - G12 * vs + ip_eq;
        const is = -G12 * vp + G22 * vs + is_eq;

        // Simpan ke Memori untuk Frame Berikutnya
        this.iPriHistory[1] = this.iPriHistory[0];
        this.iPriHistory[0] = ip;

        this.iSecHistory[1] = this.iSecHistory[0];
        this.iSecHistory[0] = is;

        this.simV = Math.abs(vp); 
    }
};

ComponentRegistry['transformer'] = Transformer;
ComponentRegistry['transformer_2p2s'] = Transformer2P2S;