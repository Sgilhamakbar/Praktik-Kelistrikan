// File: src/engine/models/actuators/MotorDCModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class MotorDC extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const r = parseFloat(this.coilR) || 15;                    
        const ratedV = parseFloat(this.ratedV) || 12;
        const maxRpm = parseFloat(this.maxRpm) || 3000;

        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;

            // 1. Ambil nilai putaran motor saat ini (RPM)
            // Jika mesin baru nyala, nilainya 0
            const currentRpm = this.currentRpm || 0;

            // 2. FISIKA BACK-EMF (Gaya Gerak Listrik Balik)
            // Kv = Konstanta Motor (RPM per Volt)
            const Kv = maxRpm / ratedV;
            
            // Tegangan balik dihitung dari kecepatan saat ini. 
            // Arah polaritasnya akan selalu mengikuti arah putaran.
            const backEmf = currentRpm / Kv;

            // 3. SUNTIKAN NORTON EQUIVALENT
            // Kita memasukkan efek baterai penahan arus (backEmf) ke dalam matriks node
            sumVR[nIn] += (engine.nodeVoltage[nOut] + backEmf) * cond; 
            sum1R[nIn] += cond;
            
            sumVR[nOut] += (engine.nodeVoltage[nIn] - backEmf) * cond; 
            sum1R[nOut] += cond;
        } else {
            // Fallback aman jika salah satu kabel putus/melayang
            if (nIn !== -1) sum1R[nIn] += 1 / r;
            if (nOut !== -1) sum1R[nOut] += 1 / r;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        // Membaca tegangan murni dari kanvas
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const vDiff = vIn - vOut; 
        
        const r = parseFloat(this.coilR) || 15;
        const ratedV = parseFloat(this.ratedV) || 12;
        const maxRpm = parseFloat(this.maxRpm) || 3000;
        
        if (typeof this.currentRpm === 'undefined') this.currentRpm = 0;

        // 1. MENGHITUNG KEMBALI BACK-EMF
        const Kv = maxRpm / ratedV;
        const backEmf = this.currentRpm / Kv; 
        
        // 2. CEK KABEL PUTUS (Open Circuit vs Short Circuit)
        let actualI = 0;
        // 🟢 PERBAIKAN: Motor HANYA memiliki arus jika KEDUA kakinya tersambung ke sirkuit
        if (nIn !== -1 && nOut !== -1) {
            actualI = (vDiff - backEmf) / r; 
        }
        
        // Menyimpan nilai untuk dibaca oleh Voltmeter dan Amperemeter di layar
        this.simV = Math.abs(vDiff);
        this.simI = Math.abs(actualI);
        
        // 3. HUKUM NEWTON II (Percepatan = Torsi Listrik - Gesekan Mekanis)
        const torqueFactor = 50; 
        const frictionFactor = 0.002; 
        
        const acceleration = (actualI * torqueFactor) - (this.currentRpm * frictionFactor);
        
        // 4. TAMBAHKAN WAKTU DELTA (dt)
        // 🟢 PERBAIKAN: Faktor 0.05 membuat inersia (berat besi motor) terasa nyata
        const dt = 0.05; 
        this.currentRpm += acceleration * dt;

        // 5. BATASAN KEAMANAN MATRIKS
        const absoluteMax = maxRpm * 2;
        if (this.currentRpm > absoluteMax) this.currentRpm = absoluteMax;
        if (this.currentRpm < -absoluteMax) this.currentRpm = -absoluteMax;
        
        this.rpm = Math.round(this.currentRpm);
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['motor_dc'] = MotorDC;