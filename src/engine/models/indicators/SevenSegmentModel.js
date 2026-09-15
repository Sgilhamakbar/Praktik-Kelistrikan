// File: src/engine/models/indicators/SevenSegmentModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class SevenSegment extends BaseComponent {
    _initPhysics(engine) {
        if (!this.vd || this.vd.length !== 7) this.vd = [0,0,0,0,0,0,0];
        const targetVf = 2.2; 
        const targetI = 0.02; 
        if (this._lastVf !== targetVf) {
            this.Is = 1e-14; 
            this.n = targetVf / (engine.DiodePhysics.VT * Math.log(targetI / this.Is));
            this.Rs = 2.0; 
            this._lastVf = targetVf;
        }
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        if (iter === 0) this._initPhysics(engine);
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        
        for (let k = 0; k < 7; k++) { 
            const nIn = engine.getNodeIndex(this.id, 'input', k); 
            if (nIn !== -1 && nOut !== -1) {
                const vDiff = (engine.nodeVoltage[nIn] || 0) - (engine.nodeVoltage[nOut] || 0);
                this.vd[k] = engine.DiodePhysics.limitVoltageStep(vDiff, this.vd[k]);

                let Geff = 0, Ieff = 0;
                if (this.vd[k] < -5.0) { 
                    Geff = 1 / 10; Ieff = Geff * 5.0; 
                } else {
                    const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                    const denom = 1 + (lin.Geq * this.Rs);
                    Geff = lin.Geq / denom; Ieff = lin.Ieq / denom;
                }
                sumVR[nIn] += (engine.nodeVoltage[nOut] * Geff) - Ieff; sum1R[nIn] += Geff;
                sumVR[nOut] += (engine.nodeVoltage[nIn] * Geff) + Ieff; sum1R[nOut] += Geff;
            }
        }
    }

    applyResults(engine) {
        if (!this.simI_segs) this.simI_segs = [0,0,0,0,0,0,0];
        for (let k = 0; k < 7; k++) {
            if (this.vd && this.vd[k] !== undefined && this.n !== undefined) {
                const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                this.simI_segs[k] = lin.Id;
            } else {
                this.simI_segs[k] = 0;
            }
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['seven_segment'] = SevenSegment;