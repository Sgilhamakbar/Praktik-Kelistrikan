// File: src/engine/models/logic/ClockPulseModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class ClockPulse extends BaseComponent {
    onTimeUpdate(dt, now) {
        const freq = Math.min(this.freqValue || 2, 1000);
        const halfPeriodMs = 1000 / freq / 2;
        
        if (!this._lastToggle) this._lastToggle = now;
        
        // Loop penangkap waktu (Time catch-up)
        while (now - this._lastToggle >= halfPeriodMs) {
            this.state = this.state === '1' ? '0' : '1';
            this._lastToggle += halfPeriodMs; 
        }
    }

    solveDigital(engine) {
        this.outputState = this.state === '1' ? 1 : 0;
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nOut !== -1) {
            engine.nodeVoltage[nOut] = this.outputState === 1 ? 5 : 0;
            fixedNodes[nOut] = true; // Kunci sebagai sumber tegangan 5V
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['clock_pulse'] = ClockPulse;