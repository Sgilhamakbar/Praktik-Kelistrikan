// File: src/engine/models/switches/PotentiometerModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Potentiometer extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const val = this.customValue || 10000;
        const percent = Math.max(0, Math.min(100, parseInt(this.state || '50')));
        
        // Membagi nilai hambatan R1 dan R2 berdasarkan posisi Wiper
        const r1 = Math.max(0.1, val * ((100 - percent) / 100)); 
        const r2 = Math.max(0.1, val * (percent / 100));         

        const nIn0 = engine.getNodeIndex(this.id, 'input', 0); 
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1); 
        const nOut = engine.getNodeIndex(this.id, 'output', 0); // Pin Wiper

        if (nIn0 !== -1 && nOut !== -1) {
            const cond1 = 1 / r1;
            sumVR[nIn0] += engine.nodeVoltage[nOut] * cond1; sum1R[nIn0] += cond1;
            sumVR[nOut] += engine.nodeVoltage[nIn0] * cond1; sum1R[nOut] += cond1;
        }
        if (nIn1 !== -1 && nOut !== -1) {
            const cond2 = 1 / r2;
            sumVR[nIn1] += engine.nodeVoltage[nOut] * cond2; sum1R[nIn1] += cond2;
            sumVR[nOut] += engine.nodeVoltage[nIn1] * cond2; sum1R[nOut] += cond2;
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['potentiometer'] = Potentiometer;