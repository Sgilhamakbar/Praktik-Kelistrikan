// File: src/engine/models/indicators/LedBargraphCCModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class LedBargraphCC extends BaseComponent {
    _initPhysics(engine) {
        if (!this.vd || this.vd.length !== 10) this.vd = new Array(10).fill(0);
        if (!this.simI_segs) this.simI_segs = new Array(10).fill(0);
        
        // Konstanta Fisika LED (Sama seperti Common Anode)
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
        
        // PERBEDAAN UTAMA 1: Pin 10 sekarang adalah Katoda (Ground)
        const nCathode = engine.getNodeIndex(this.id, 'input', 10); 
        
        if (nCathode !== -1) {
            for (let k = 0; k < 10; k++) { 
                // PERBEDAAN UTAMA 2: Pin 0-9 sekarang adalah Anoda (Positif)
                const nAnode = engine.getNodeIndex(this.id, 'input', k); 
                
                if (nAnode !== -1) {
                    // Perhitungan V_diff dibalik: V_anode - V_cathode
                    const vDiff = (engine.nodeVoltage[nAnode] || 0) - (engine.nodeVoltage[nCathode] || 0);
                    this.vd[k] = engine.DiodePhysics.limitVoltageStep(vDiff, this.vd[k]);

                    let Geff = 0, Ieff = 0;
                    if (this.vd[k] < -5.0) { 
                        // Breakdown Voltage (Bocor saat tegangan terbalik melewati -5V)
                        Geff = 1 / 10; Ieff = Geff * 5.0; 
                    } else {
                        // Linearisasi Newton-Raphson
                        const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                        const denom = 1 + (lin.Geq * this.Rs);
                        Geff = lin.Geq / denom; Ieff = lin.Ieq / denom;
                    }
                    
                    // Injeksi ke Matriks Node SPICE (Arah Arus dari K ke 10)
                    sumVR[nAnode] += (engine.nodeVoltage[nCathode] * Geff) - Ieff; sum1R[nAnode] += Geff;
                    sumVR[nCathode] += (engine.nodeVoltage[nAnode] * Geff) + Ieff; sum1R[nCathode] += Geff;
                }
            }
        }
    }

    applyResults(engine) {
        if (!this.simI_segs) this.simI_segs = new Array(10).fill(0);
        for (let k = 0; k < 10; k++) {
            if (this.vd && this.vd[k] !== undefined && this.n !== undefined) {
                const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                this.simI_segs[k] = lin.Id; 
            } else {
                this.simI_segs[k] = 0;
            }
        }
    }
};

// Daftarkan model fisika ini ke Registry dengan ID dari HTML
ComponentRegistry['led_bargraph_cc'] = LedBargraphCC;