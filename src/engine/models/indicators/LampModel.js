// File: src/engine/models/indicators/LampModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class LampComponent extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // 1. Ambil nilai tegangan rating dan daya (Default 12V dan 5W jika belum disetel)
        const ratedV = this.ratedV !== undefined ? parseFloat(this.ratedV) : 12.0;
        const powerW = this.powerW !== undefined ? parseFloat(this.powerW) : 5.0;
        
        // 2. Rumus Fisika: Hambatan Filamen (R) = V^2 / P
        const baseR = (ratedV * ratedV) / powerW; 
        
        // 3. Jika lampu putus (blown), hambatannya mendekati tak terhingga (arus putus)
        const isBlown = this.state === 'blown';
        const r = isBlown ? 1000000000 : baseR;

        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        // 4. Injeksi nilai hambatan ke dalam Matriks Kelistrikan
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; 
            sum1R[nIn] += cond;
            
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; 
            sum1R[nOut] += cond;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        
        // 1. Hitung selisih tegangan (Voltage Drop) di kedua ujung kaki lampu
        this.simV = Math.abs(vIn - vOut);
        
        const ratedV = this.ratedV !== undefined ? parseFloat(this.ratedV) : 12.0;
        const powerW = this.powerW !== undefined ? parseFloat(this.powerW) : 5.0;
        const baseR = (ratedV * ratedV) / powerW;
        const isBlown = this.state === 'blown';
        
        // 2. Hitung arus yang mengalir (Hukum Ohm: I = V / R)
        this.simI = isBlown ? 0 : (vIn - vOut) / baseR;
        
        // 3. Detektor Overvoltage (Tegangan Berlebih)
        // Lampu putus jika tegangan masuk melebihi 150% dari tegangan ratingnya
        const maxV = ratedV * 1.5;
        if (!isBlown && this.simV > maxV) {
            this.state = 'blown'; // Putuskan filamen!
            
            // Munculkan notifikasi Toast di layar (hanya sekali)
            if (!this.hasWarned && typeof UIManager !== 'undefined') {
                UIManager.showToast(`💥 Peringatan: Tegangan berlebih! Filamen Lampu Pijar putus.`, 4000);
                this.hasWarned = true;
            }
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['lamp'] = LampComponent;