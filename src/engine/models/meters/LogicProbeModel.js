// File: src/engine/models/meters/LogicProbeModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class LogicProbe extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        if (nIn !== -1) {
            const condFloat = 1 / 10000000; 
            sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        if (nIn !== -1) {
            const v = engine.nodeVoltage[nIn];
            if (v > 2.5) this.logicState = '1';
            else if (v < 0.8) this.logicState = '0';
            else this.logicState = 'Z';
        } else {
            this.logicState = 'Z';
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['logic_probe'] = LogicProbe;