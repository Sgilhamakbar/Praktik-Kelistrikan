// File: src/engine/models/semiconductors/DiodeModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

// =======================================================
// 1. DIODA PENYEARAH & LED (Eksponensial + SPICE Damping)
// =======================================================
export class DiodeComponent extends BaseComponent {
    _initPhysics() {
        if (this.vd === undefined || isNaN(this.vd)) this.vd = 0;
        
        // Parameter Fisika Semikonduktor Dasar
        this.VT = 0.02585; // Tegangan termal 300K (~26mV)
        this.Is = 1e-14;   // Arus saturasi balik
        this.Rs = 1.5;     // Hambatan internal bahan (Ohm)
        
        const targetVf = this.type === 'led' ? (parseFloat(this.forwardV) || 2.2) : 0.7;
        const targetI = this.type === 'led' ? ((parseFloat(this.fullDriveI) || 10) / 1000) : 0.02;
        
        // Hitung faktor idealitas (n) otomatis berdasarkan material
        this.n = targetVf / (this.VT * Math.log(targetI / this.Is));
        if (this.n < 1.0) this.n = 1.0;
        
        this.bV = this.type === 'led' ? (parseFloat(this.breakdownV) || 4.0) : 50.0;
        
        // Zero-bias Junction Capacitance (Kapasitansi bawaan saat 0V)
        // Dioda biasa ~4pF. Untuk LED bisa lebih besar (~50pF), kita set default 4 pF.
        this.Cj0 = this.type === 'led' ? 50e-12 : 4e-12; 
        
        // Junction Potential (Barier tegangan internal persimpangan)
        this.Vj = 0.7; 
        
        // Grading Coefficient (Kelengkungan profil P-N junction)
        this.M = 0.33; 
        
        // Transit Time (Waktu tempuh pembawa muatan - penentu utama Reverse Recovery Time)
        // 1N4148 sangat cepat (sekitar 20 nanodetik).
        this.TT = 20e-9; 
        
        // Memori tegangan untuk menghitung turunan waktu (dV/dt) pada langkah iterasi berikutnya
        if (this.lastSimV === undefined) this.lastSimV = 0;        
    }

    // Algoritma SPICE PNJLIM: Mencegah lonjakan tegangan liar
    _limitStep(vNew, vOld, nVt) {
        const vCrit = nVt * Math.log(nVt / (Math.SQRT2 * this.Is));
        
        if (vNew > vCrit && Math.abs(vNew - vOld) > (2 * nVt)) {
            if (vOld > 0) {
                const arg = 1 + (vNew - vOld) / nVt;
                return arg > 0 ? (vOld + nVt * Math.log(arg)) : vCrit;
            } else {
                return nVt * Math.log(Math.max(1, vNew / nVt));
            }
        }
        
        // Hard clamping untuk perubahan mundur ekstrem
        const maxDelta = 0.1; // Maksimal lompatan 100mV per iterasi
        if (vNew - vOld > maxDelta) return vOld + maxDelta;
        if (vOld - vNew > maxDelta) return vOld - maxDelta;
        
        return vNew;
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        if (iter === 0) this._initPhysics();

        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nOut !== -1) {
            const vIn = engine.nodeVoltage[nIn] || 0;
            const vOut = engine.nodeVoltage[nOut] || 0;
            const vDiff = vIn - vOut;
            const nVt = this.n * this.VT;

            // 1. Terapkan Damping pada tegangan sambungan p-n
            this.vd = this._limitStep(vDiff, this.vd, nVt);

            let Geff = 0;
            let Ieff = 0;
            let Geq_pure = 0; // Variabel baru untuk merekam konduktansi murni

            // 2. Kondisi Breakdown Mundur (Zener / Avalance)
            if (this.vd < -this.bV) {
                const R_brk = 5.0;
                Geff = 1 / R_brk;
                Ieff = this.bV / R_brk;
                Geq_pure = Geff;
            } 
            // 3. Kondisi Eksponensial Shockley (Forward & Normal Reverse)
            else {
                // Guard Math Overflow (Maksimal e^40 agar tidak NaN/Infinity)
                const vSafe = Math.min(this.vd, 40 * nVt);
                const expVal = Math.exp(vSafe / nVt);
                
                const Id = this.Is * (expVal - 1);
                let Geq = (this.Is / nVt) * expVal;
                if (Geq < 1e-12) Geq = 1e-12; // Gmin guard

                const Ieq = Id - (Geq * vSafe);

                // Gabungkan dengan hambatan seri internal (Rs)
                const denom = 1 + (Geq * this.Rs);
                Geff = Geq / denom;
                Ieff = Ieq / denom;
                
                Geq_pure = Geq; // Simpan untuk perhitungan kapasitansi difusi
            }

            // Ambil waktu iterasi dari mesin simulasi (dt)
            const dt = engine.FIXED_DT || 0.001; 

            // a. Junction Capacitance (Cj) - Efek saat bias mundur
            // Gunakan pembatas (maks 0.5 * Vj) agar persamaan tidak meledak (dibagi nol) saat bias maju
            const vj_safe = Math.min(this.vd, this.Vj * 0.5);
            const Cj = this.Cj0 / Math.pow((1 - (vj_safe / this.Vj)), this.M);

            // b. Diffusion Capacitance (Cd) - Efek saat bias maju (penyebab utama t_rr)
            const Cd = this.TT * Geq_pure;

            // c. Total Kapasitansi Dinamis
            const Ct = Cj + Cd;

            // d. Konversi Kapasitor ke Model Matriks (Backward Euler)
            const Gc = Ct / dt; // Konduktansi ekuivalen
            const Ic = Gc * (this.lastSimV || 0); // Arus memori dari masa lalu

            // e. Tambahkan beban kapasitif ke konduktansi dan arus total dioda
            Geff += Gc;
            Ieff -= Ic; 
            
            // 4. Suntikkan ke Matriks Kirchhoff (Gauss-Seidel)
            sumVR[nIn] += (vOut * Geff) - Ieff; sum1R[nIn] += Geff;
            sumVR[nOut] += (vIn * Geff) + Ieff; sum1R[nOut] += Geff;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = (nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0);

        const nVt = this.n * this.VT;
        if (this.simV < -this.bV) {
            this.simI = (this.simV + this.bV) / 5.0;
        } else {
            const vSafe = Math.min(this.simV, 40 * nVt);
            const expVal = Math.exp(vSafe / nVt);
            const Id = this.Is * (expVal - 1);
            // Koreksi tegangan jatuh pada Rs
            this.simI = Id / (1 + (Id * this.Rs / Math.max(0.1, this.simV)));
        }
        this.lastSimV = this.simV;

        // Proteksi Ambang Batas LED
        if (this.type === 'led') {
            const fullDriveI_Ampere = (parseFloat(this.fullDriveI) || 10) / 1000;
            const maxPeakI = fullDriveI_Ampere * 5;

            if (this.simI > maxPeakI) {
                this.isOvercurrent = true;
                this.simI = 0;
                if (!this.hasWarned && typeof UIManager !== 'undefined') {
                    UIManager.showToast(`⚠️ Peringatan: Arus melebihi batas maksimum untuk LED L${this.id}`, 4000);
                    this.hasWarned = true;
                }
            } else if (this.simI > 1e-6 && this.simI <= maxPeakI) {
                this.isOvercurrent = false;
                this.hasWarned = false;
            }
        }
    }
}
ComponentRegistry['diode'] = DiodeComponent;
ComponentRegistry['led'] = DiodeComponent;

// =======================================================
// 2. DIODA ZENER (Model Eksponensial 2 Arah)
// =======================================================
export class ZenerDiodeComponent extends BaseComponent {
    _initPhysics() {
        if (this.vd === undefined || isNaN(this.vd)) this.vd = 0;
        
        this.VT = 0.02585;
        this.Is = 1e-14;
        this.Rs = 1.5;
        this.n = 1.2;
        
        this.Vz = parseFloat(this.customValue) || 5.1;
        this.Izt = (parseFloat(this.izt) || 5.0) / 1000;
                
        // Cek apakah ada input nilai Zener Impedance (Rz) dari pengguna
        if (this.rz !== undefined && this.rz !== null) {
            this.Rz = parseFloat(this.rz);
        } else {
            // Jika kosong, gunakan rumus estimasi pintar meniru datasheet:
            // Zener <= 5.1V menggunakan ~7 Ohm. Di atas itu, nilai hambatannya naik proporsional.
            this.Rz = this.Vz <= 5.1 ? 7.0 : this.Vz * 1.2;
        }
        
        // Pengaman mesin fisika: Cegah hambatan bernilai 0 atau minus agar simulasi tidak crash
        if (isNaN(this.Rz) || this.Rz < 1) this.Rz = 1.0; 
        
        // Knee Voltage (Tegangan Lutut)
        this.Vk = Math.max(0.1, this.Vz - (this.Izt * this.Rz));
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        if (iter === 0) this._initPhysics();

        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nOut !== -1) {
            const vIn = engine.nodeVoltage[nIn] || 0;
            const vOut = engine.nodeVoltage[nOut] || 0;
            const vDiff = vIn - vOut;
            const nVt = this.n * this.VT;

            // 🟢 PERBAIKAN BUG: Damping (Penahan Laju) yang Lebih Cerdas!
            if (vDiff > 0.5 && vDiff > this.vd) {
                // 1. Bias Maju (Eksponensial): Gunakan Logaritmik Damping agar tidak meledak
                this.vd = this.vd > 0 ? this.vd + nVt * Math.log(1 + (vDiff - this.vd) / nVt) : nVt * Math.log(vDiff / nVt);
            } else if (vDiff <= -this.Vk) {
                // 2. Bias Mundur (Area Zener Linier): LEPAS PENJEPITNYA! Biarkan tegangan melesat bebas
                this.vd = vDiff; 
            } else {
                // 3. Area Peralihan/Kebocoran Kecil: Penjepit longgar (0.5V)
                const maxDelta = 0.5; 
                if (vDiff - this.vd > maxDelta) this.vd += maxDelta;
                else if (this.vd - vDiff > maxDelta) this.vd -= maxDelta;
                else this.vd = vDiff;
            }

            let Geff = 0;
            let Ieff = 0;

            // Wilayah Breakdown Zener
            if (this.vd <= -this.Vk) {
                Geff = 1 / this.Rz;
                Ieff = this.Vk / this.Rz;
            }
            // Wilayah Eksponensial Bias Maju
            else if (this.vd > 0) {
                const vSafe = Math.min(this.vd, 40 * nVt);
                const expVal = Math.exp(vSafe / nVt);
                const Id = this.Is * (expVal - 1);
                const Geq = Math.max(1e-12, (this.Is / nVt) * expVal);
                const Ieq = Id - (Geq * vSafe);

                const denom = 1 + (Geq * this.Rs);
                Geff = Geq / denom;
                Ieff = Ieq / denom;
            } 
            // Wilayah Sub-threshold / Reverse Leakage
            else {
                Geff = 1e-10;
                Ieff = 0;
            }

            sumVR[nIn] += (vOut * Geff) - Ieff; sum1R[nIn] += Geff;
            sumVR[nOut] += (vIn * Geff) + Ieff; sum1R[nOut] += Geff;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = (nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0);

        if (this.simV <= -this.Vk) {
            this.simI = (this.simV + this.Vk) / this.Rz;
        } else if (this.simV > 0) {
            const nVt = this.n * this.VT;
            const vSafe = Math.min(this.simV, 40 * nVt);
            this.simI = this.Is * (Math.exp(vSafe / nVt) - 1);
        } else {
            this.simI = this.simV * 1e-10;
        }
    }
}
ComponentRegistry['zener_diode'] = ZenerDiodeComponent;