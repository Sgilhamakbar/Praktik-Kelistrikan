// File: src/engine/models/passive/VoltageDividerModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class VoltageDivider extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const r1 = this.r1Value !== undefined ? this.r1Value : 10000; 
        const r2 = this.r2Value !== undefined ? this.r2Value : 10000;
        
        if (nIn !== -1 && nOut !== -1) {
            const cond1 = 1 / r1; 
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond1; sum1R[nIn] += cond1;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond1; sum1R[nOut] += cond1;
            const cond2 = 1 / r2; 
            sumVR[nOut] += 0 * cond2; sum1R[nOut] += cond2;
        } else if (nIn !== -1 && nOut === -1) {
            const condTotal = 1 / (r1 + r2);
            sumVR[nIn] += 0 * condTotal; sum1R[nIn] += condTotal;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        let vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        let vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const r1 = this.r1Value !== undefined ? this.r1Value : 10000;
        const r2 = this.r2Value !== undefined ? this.r2Value : 10000;

        if (nOut === -1 && nIn !== -1) vOut = vIn * (r2 / (r1 + r2));
        this.simV = vOut; 
        this.v1 = Math.abs(vIn - vOut);
        this.v2 = Math.abs(vOut);
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['voltage_divider'] = VoltageDivider;