// File: src/engine/models/power/TerminalModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Ground extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nIdx = engine.getNodeIndex(this.id, 'input', 0);
        if (nIdx !== -1) { 
            engine.nodeVoltage[nIdx] = 0; 
            fixedNodes[nIdx] = true; 
        }
    }
};

export class PowerTerminal extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nIdx = engine.getNodeIndex(this.id, 'output', 0);
        if (nIdx !== -1) { 
            engine.nodeVoltage[nIdx] = this.customValue ?? 12; 
            fixedNodes[nIdx] = true; 
        }
    }
}

export class OutputTerminal extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        if (nIn !== -1) {
            const cond = 1 / 10000000; 
            sumVR[nIn] += 0 * cond; sum1R[nIn] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        this.simV = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['power_terminal'] = PowerTerminal;
ComponentRegistry['output_terminal'] = OutputTerminal;
ComponentRegistry['ground'] = Ground;