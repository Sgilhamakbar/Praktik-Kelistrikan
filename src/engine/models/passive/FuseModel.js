// File: src/engine/models/passive/FuseModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Fuse extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const isBlown = this.state === 'blown';
        const r = isBlown ? 1000000000 : 1; 
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const isBlown = this.state === 'blown';
        
        this.simV = Math.abs(vIn - vOut);
        this.simI = (vIn - vOut) / (isBlown ? 1000000000 : 1);
        
        const maxAmpere = this.customValue || 10;
        if (!isBlown && Math.abs(this.simI) > maxAmpere) {
            this.state = 'blown'; 
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['fuse'] = Fuse;