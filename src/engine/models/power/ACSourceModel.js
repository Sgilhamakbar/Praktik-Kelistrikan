// File: src/engine/models/power/ACSourceModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class VSine extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        const nIn = engine.getNodeIndex(this.id, 'output', 1);  
        
        // 🟢 PERUBAHAN: Gunakan waktu virtual dari mesin fisika, BUKAN jam dunia nyata
        const time = engine.simTime !== undefined ? engine.simTime : (Date.now() / 1000); 
        
        const amp = this.customValue !== undefined ? this.customValue : 12;
        const freq = this.freqValue !== undefined ? this.freqValue : 1;
        const offset = this.dcOffset !== undefined ? this.dcOffset : 0;
        const delay = this.timeDelay !== undefined ? this.timeDelay : 0;
        
        // Rumus Fisika Generator AC
        const v = offset + amp * Math.sin(2 * Math.PI * freq * (time - delay));
        
        if (nOut !== -1 && nIn !== -1) {
            if (fixedNodes[nIn]) {
                engine.nodeVoltage[nOut] = engine.nodeVoltage[nIn] + v;
                fixedNodes[nOut] = true;
            } else if (fixedNodes[nOut]) {
                engine.nodeVoltage[nIn] = engine.nodeVoltage[nOut] - v;
                fixedNodes[nIn] = true;
            } else {
                const center = (engine.nodeVoltage[nOut] + engine.nodeVoltage[nIn]) / 2;
                engine.nodeVoltage[nOut] = center + (v / 2);
                engine.nodeVoltage[nIn] = center - (v / 2);
                fixedNodes[nOut] = true; fixedNodes[nIn] = true;
            }
        } else if (nOut !== -1) {
            engine.nodeVoltage[nOut] = v; fixedNodes[nOut] = true;
        } else if (nIn !== -1) {
            engine.nodeVoltage[nIn] = 0; fixedNodes[nIn] = true;
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['vsine'] = VSine;