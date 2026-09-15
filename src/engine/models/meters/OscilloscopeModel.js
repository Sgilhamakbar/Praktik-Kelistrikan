// File: src/engine/models/meters/OscilloscopeModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Oscilloscope extends BaseComponent {
    
    injectMatrix(engine, sumVR, sum1R) {
        // Pin 0 adalah Channel 1 (CH1), Pin 1 adalah Channel 2 (CH2)
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        // Impedansi internal Probe Osiloskop (10 MegaOhm, mode 10X)
        const condProbe = 1 / 10000000; 
        
        // Suntikkan beban hambatan ke Ground.
        // sumVR tidak perlu ditambah (karena dikali 0V Ground = 0)
        if (nIn0 !== -1) { 
            sum1R[nIn0] += condProbe; 
        }
        if (nIn1 !== -1) { 
            sum1R[nIn1] += condProbe; 
        }
    }
    
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        // Membaca tegangan mutlak (Single-Ended) pada titik referensi Ground simulator
        this.simV = nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0;  // Hasil CH1
        this.simV2 = nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0; // Hasil CH2
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['oscilloscope'] = Oscilloscope;