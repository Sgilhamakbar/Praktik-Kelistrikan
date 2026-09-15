// File: src/engine/models/actuators/FlasherModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Flasher extends BaseComponent {
    onTimeUpdate(dt, now) {
        const period = this.customValue || 500;
        if (now - (this._lastToggle || 0) >= period) {
            this.state = this.state === '1' ? '0' : '1';
            this._lastToggle = now;
        }
    }
    injectMatrix(engine, sumVR, sum1R) {
        const r = this.state === '1' ? 0.1 : 1000000000;                    
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['flasher'] = Flasher;