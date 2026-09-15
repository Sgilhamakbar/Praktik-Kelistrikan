// File: src/engine/models/meters/MultimetersModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Ammeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / 1; // Hambatan Amperemeter idealnya kecil (1 Ohm)
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vDiff = (nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0);
        this.simV = Math.abs(vDiff);
        this.simI = vDiff / 1; 
    }
};

export class Voltmeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        if (nIn0 !== -1 && nIn1 !== -1) {
            const cond = 1 / 100000000; // Hambatan internal Voltmeter 1 MegaOhm
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * cond; sum1R[nIn0] += cond;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * cond; sum1R[nIn1] += cond;
        }
    }
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        this.targetV = (nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0) - (nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0);
    }
    onTimeUpdate(dt, _now) {
        if (this.targetV === undefined) this.targetV = 0;
        if (this.simV === undefined) this.simV = 0;

        // Voltmeter DC bereaksi sedikit lebih cepat (speed 6.0) dari AC
        const animSpeed = 6.0; 
        this.simV += (this.targetV - this.simV) * (animSpeed * dt);

        if (Math.abs(this.targetV - this.simV) < 0.01) {
            this.simV = this.targetV;
        }
    }
};

export class VoltmeterAC extends BaseComponent {
    
    // 1. INJEKSI MATRIKS (Hambatan Internal)
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        if (nIn0 !== -1 && nIn1 !== -1) {
            // Hambatan internal Voltmeter AC sama dengan DC, yaitu sangat besar (1 MegaOhm)
            // agar tidak menyedot arus sirkuit yang sedang diukur.
            const cond = 1 / 1000000; 
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * cond; sum1R[nIn0] += cond;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * cond; sum1R[nIn1] += cond;
        }
    }

    // 2. SAMPLING TEGANGAN INSTAN (Setiap iterasi matriks)
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        // Baca tegangan "saat ini juga" (Bisa positif, bisa negatif karena ini AC)
        const v0 = nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0;
        const v1 = nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0;
        
        // Simpan ke memori sementara untuk diolah oleh mesin waktu
        this.instV = v0 - v1;
    }

    // 3. MESIN RMS (Root Mean Square) - Dijalankan setiap frame waktu
    onTimeUpdate(dt, _now) {
        if (this.instV === undefined) this.instV = 0;
        if (this._meanSq === undefined) this._meanSq = 0;

        // Langkah A: KUPADRATKAN (SQUARE) tegangan instan agar nilai negatif menjadi positif
        const vSq = this.instV * this.instV;

        // Langkah B: RATA-RATAKAN (MEAN) menggunakan algoritma Exponential Moving Average (EMA)
        // Time constant 0.4 detik (400ms) menyerupai lag pada Multimeter Digital asli.
        // Ini mampu meratakan riak (ripple) pada AC 50Hz/60Hz menjadi nilai diam yang statis.
        const alpha = Math.exp(-dt / 0.4);
        this._meanSq = (this._meanSq * alpha) + (vSq * (1 - alpha));

        // Langkah C: AKAR KUADRATKAN (ROOT) hasil rata-rata
        this.simV_rms = Math.sqrt(this._meanSq);

        // Filter Anti-Noise: Jika tegangan sangat kecil (hanya sisa komputasi desimal di bawah 0.05V),
        // paksa menjadi 0 agar layar Voltmeter bersih dan rapi.
        if (this.simV_rms < 0.05) {
            this.simV_rms = 0;
            this._meanSq = 0; // Kuras tangki memori rata-rata agar cepat kembali ke 0 murni
        }
    }
};

export class Ohmmeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        if (nIn0 !== -1 && nIn1 !== -1) {
            // 🟢 EKUIVALEN NORTON DARI VOLTAGE DIVIDER
            // Baterai Internal 9V dengan Resistor Rujukan 1 MegaOhm
            const R_ref = 1000000.0; // 1 MΩ
            const V_bat = 9.0;       // 9 Volt
            
            const G_ref = 1.0 / R_ref;
            const I_norton = V_bat * G_ref; // 0.000009 Ampere (9µA)
            
            // 1. Injeksi Sumber Arus Norton ke dalam sirkuit
            sumVR[nIn0] += I_norton; 
            sumVR[nIn1] -= I_norton;
            
            // 2. Injeksi Konduktansi Internal (R_ref diparalel)
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * G_ref; sum1R[nIn0] += G_ref;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * G_ref; sum1R[nIn1] += G_ref;
        }
    }
    
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        this.isError = false; 
        this.isOL = false; 
        this.simR = 0;
        
        // Cek jika kabel terlepas dari sirkuit
        if (nIn0 === -1 || nIn1 === -1) {
            this.isOL = true; 
            return;
        }
        
        // Baca tegangan jatuh yang terbentuk di antara kedua jarum Ohmmeter
        const vDiff = engine.nodeVoltage[nIn0] - engine.nodeVoltage[nIn1];
        
        // 🟢 DETEKSI KESALAHAN PENGGUNA (Fitur Anti-Bakar)
        // Jika ada arus aktif dari sirkuit yang melawan baterai internal Ohmmeter
        if (vDiff < -0.05 || vDiff > 9.05) {
            this.isError = true;
            return;
        }
        
        // 🟢 DETEKSI OVER-LOAD (Sirkuit Terbuka)
        // Jika tegangan kembali mentok 9V, berarti jarum tidak terhubung ke beban apa pun
        if (vDiff >= 8.99) {
            this.isOL = true;
            return;
        }
        
        // 🟢 KALKULASI HAMBATAN EKSTERNAL (Rumus Voltage Divider Dibalik)
        // Rumus Asli: V_diff = V_bat * (Rx / (R_ref + Rx))
        // Dibalik jadi: Rx = R_ref * (V_diff / (V_bat - V_diff))
        const R_ref = 1000000.0;
        const V_bat = 9.0;
        
        let rx = R_ref * (vDiff / (V_bat - vDiff));
        
        if (rx < 0) {
            this.isError = true;
        } else {
            this.simR = rx;
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['voltmeter_ac'] = VoltmeterAC;
ComponentRegistry['voltmeter'] = Voltmeter;
ComponentRegistry['ammeter'] = Ammeter;
ComponentRegistry['ohmmeter'] = Ohmmeter;