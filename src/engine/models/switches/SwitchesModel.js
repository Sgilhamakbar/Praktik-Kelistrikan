// File: src/engine/models/switches/SwitchesModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class SwitchSPST extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        let isActive = false;
        if (this.type === 'push_button_nc') {
            isActive = this.state === '0'; // Menyambung jika TIDAK ditekan
        } else {
            isActive = this.state === '1'; // Menyambung jika ditekan
        }
        
        const r = isActive ? 0.1 : 1000000000;                    
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
}

export class SwitchSPDT extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const isDown = this.state === '1';
        const r0 = isDown ? 1000000000 : 0.1; // Pin Atas
        const r1 = isDown ? 0.1 : 1000000000; // Pin Bawah
        
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1);
        
        if (nIn !== -1) {
            if (nOut0 !== -1) {
                const cond0 = 1 / r0;
                sumVR[nIn] += engine.nodeVoltage[nOut0] * cond0; sum1R[nIn] += cond0;
                sumVR[nOut0] += engine.nodeVoltage[nIn] * cond0; sum1R[nOut0] += cond0;
            }
            if (nOut1 !== -1) {
                const cond1 = 1 / r1;
                sumVR[nIn] += engine.nodeVoltage[nOut1] * cond1; sum1R[nIn] += cond1;
                sumVR[nOut1] += engine.nodeVoltage[nIn] * cond1; sum1R[nOut1] += cond1;
            }
        }
    }
};

export class DigitalSwitch extends BaseComponent {
    solveDigital(_engine) {
        this.outputState = this.state === '1' ? 1 : 0;
    }
    
    applyFixedVoltage(engine, fixedNodes) {
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        if (nOut0 !== -1) {
            engine.nodeVoltage[nOut0] = this.outputState === 1 ? 5 : 0;
            fixedNodes[nOut0] = true;
        }
    }
};

export class SwitchDPST extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const isActive = this.state === '1';
        const r = isActive ? 0.1 : 1000000000; // 0.1 Ohm jika nyala, 1 Milyar Ohm jika mati                  
        const cond = 1 / r;

        // Eksekusi Sirkuit Kutub 1 (Atas)
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn0 !== -1 && nOut0 !== -1) {
            sumVR[nIn0] += engine.nodeVoltage[nOut0] * cond; sum1R[nIn0] += cond;
            sumVR[nOut0] += engine.nodeVoltage[nIn0] * cond; sum1R[nOut0] += cond;
        }

        // Eksekusi Sirkuit Kutub 2 (Bawah) - Berjalan berbarengan!
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1);
        if (nIn1 !== -1 && nOut1 !== -1) {
            sumVR[nIn1] += engine.nodeVoltage[nOut1] * cond; sum1R[nIn1] += cond;
            sumVR[nOut1] += engine.nodeVoltage[nIn1] * cond; sum1R[nOut1] += cond;
        }
    }
}

ComponentRegistry['switch_spst'] = SwitchSPST;
ComponentRegistry['switch_spdt'] = SwitchSPDT;
ComponentRegistry['switch_dpst'] = SwitchDPST;
ComponentRegistry['switch'] = DigitalSwitch;
ComponentRegistry['push_button'] = SwitchSPST;
ComponentRegistry['push_button_nc'] = SwitchSPST;