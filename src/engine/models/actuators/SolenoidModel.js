// File: src/engine/models/actuators/SolenoidModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Solenoid extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / 100; // Hambatan internal koil solenoid 100 Ohm
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = Math.abs((nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0));
    }

    // Menggunakan _now untuk menandakan parameter ini tidak dipakai
    onTimeUpdate(dt, _now) {
        if (typeof this.simI === 'undefined' || isNaN(this.simI)) this.simI = 0;
        
        // Efek Induktor: Arus (I) tidak naik secara instan, melainkan bertahap (Eksponensial)
        const targetI = this.simV / 100; 
        this.simI = targetI + (this.simI - targetI) * Math.exp(-dt / (2.0 / 100));
        
        if (this.simI < 0.0001 && this.simV < 0.1) this.simI = 0;

        if (typeof this.plungerPos === 'undefined') this.plungerPos = 0;
        if (typeof this.plungerVel === 'undefined') this.plungerVel = 0;
        
        // -----------------------------------------------------
        // FISIKA MEKANIK SOLENOID
        // Rumus: F_net = Gaya Elektromagnetik - Gaya Pegas - Gaya Gesek (Damping)
        // -----------------------------------------------------
        let F_net = (2000 * (this.simI * this.simI)) - (2.0 * this.plungerPos) - (0.5 * this.plungerVel);
        
        // Integrasi Euler untuk mendapatkan Kecepatan (Velocity) dan Posisi
        this.plungerVel += (F_net / 0.02) * dt; // Massa plunger fiktif = 0.02 kg
        this.plungerPos += this.plungerVel * dt;
        
        // Batasan Fisik Ruang Gerak Plunger (0 mm hingga 12 mm)
        if (this.plungerPos >= 12) { 
            this.plungerPos = 12; 
            this.plungerVel = 0; // Berhenti mendadak saat membentur ujung
        } 
        else if (this.plungerPos <= 0) { 
            this.plungerPos = 0; 
            this.plungerVel = 0; 
        }
        
        // Persentase tarikan untuk dikirim ke UI
        this.strokePercent = (this.plungerPos / 12) * 100;
    }
}

// Daftarkan model fisika ini ke Registry
ComponentRegistry['solenoid'] = Solenoid;