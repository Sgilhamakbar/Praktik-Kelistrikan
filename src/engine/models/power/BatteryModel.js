// File: src/engine/models/power/BatteryModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Battery extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        const nIn = engine.getNodeIndex(this.id, 'output', 1);  
        
        // Ambil tegangan ideal baterai dari memori
        this.vIdeal = this.customValue !== undefined ? this.customValue : (this.type === 'battery_1cell' ? 1.5 : 12);
        
        // FISIKA REALISTIS: Hambatan Dalam (Internal Resistance)
        // Aki 12V biasanya memiliki hambatan dalam sekitar 0.05 Ohm
        // Baterai AA 1.5V biasanya sekitar 0.2 Ohm
        this.rInternal = this.type === 'battery_1cell' ? 0.2 : 0.05;
        const gInternal = 1 / this.rInternal;

        if (nOut !== -1 && nIn !== -1) {
            // Suntikkan baterai menggunakan metode Norton Equivalent
            sumVR[nOut] += (engine.nodeVoltage[nIn] + this.vIdeal) * gInternal; 
            sum1R[nOut] += gInternal;
            
            sumVR[nIn] += (engine.nodeVoltage[nOut] - this.vIdeal) * gInternal; 
            sum1R[nIn] += gInternal;
        } else if (nOut !== -1) {
            sumVR[nOut] += this.vIdeal * gInternal; 
            sum1R[nOut] += gInternal;
        } else if (nIn !== -1) {
            sumVR[nIn] += (-this.vIdeal) * gInternal; 
            sum1R[nIn] += gInternal;
        }
    }

    applyResults(engine) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const nIn = engine.getNodeIndex(this.id, 'output', 1);

        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;

        // 1. Tegangan Nyata (Bisa drop jika sirkuit butuh arus terlalu besar)
        this.simV = Math.abs(vOut - vIn);

        // 2. Arus Listrik Aktual (Sangat akurat berkat Hukum Ohm)
        if (this.vIdeal !== undefined && this.rInternal !== undefined) {
            this.simI = Math.abs((this.vIdeal - this.simV) / this.rInternal);
        } else {
            this.simI = 0;
        }
    }
}

// Daftarkan semua jenis baterai ke kelas Battery
ComponentRegistry['battery'] = Battery;
ComponentRegistry['battery_multi'] = Battery;
ComponentRegistry['battery_1cell'] = Battery;