// File: src/engine/models/passive/CapacitorModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Capacitor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        if (this._cond === undefined || this._lastParsedValue !== this.customValue) {
            const DT = engine.FIXED_DT || 0.001;
            let cVal = 10e-6; 
            if (this.customValue !== undefined && this.customValue !== null) {
                const strVal = String(this.customValue).toLowerCase().replace(/\s/g, '');
                const num = parseFloat(strVal);
                if (!isNaN(num)) {
                    const match = strVal.match(/([muµnpf])/);
                    const unit = match ? match[1] : 'u';
                    switch(unit) {
                        case 'm': cVal = num * 1e-3; break;
                        case 'u': case 'µ': cVal = num * 1e-6; break;
                        case 'n': cVal = num * 1e-9; break;
                        case 'p': cVal = num * 1e-12; break;
                        case 'f': cVal = num; break;
                    }
                }
            }
            
            const ESR = this.esr !== undefined ? this.esr : 0.1; 
            const rEq_bdf2 = (2 * DT) / (3 * cVal);
            const rEq_total = rEq_bdf2 + ESR; 
            
            this._rEq = rEq_total; 
            this._cond = 1 / rEq_total; 
            this._lastParsedValue = this.customValue; 
        }

        if (!this.vHistory) {
            const startV = this.chargeV || this.simV || 0;
            this.vHistory = new Float64Array([startV, startV]); 
        }
        
        const vEq = (4/3)*this.vHistory[0] - (1/3)*this.vHistory[1];
        
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        // 🟢 PERBAIKAN 1: Tambahkan ( || 0 ) agar terhindar dari error NaN jika kabel baru dicolok
        if (nIn !== -1 && nOut !== -1) {
            const cond = this._cond; 
            const vOutSafe = engine.nodeVoltage[nOut] || 0;
            const vInSafe = engine.nodeVoltage[nIn] || 0;
            
            sumVR[nIn] += (vOutSafe + vEq) * cond; sum1R[nIn] += cond;
            sumVR[nOut] += (vInSafe - vEq) * cond; sum1R[nOut] += cond;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        
        if (!this.vHistory) {
            const startV = this.chargeV || this.simV || 0;
            this.vHistory = new Float64Array([startV, startV]); 
        }

        // 🟢 PERBAIKAN 2: Cegah "Phantom Charging" saat kabel diputus
        if (nIn !== -1 && nOut !== -1) {
            const rEq = this._rEq || (((2 * (engine.FIXED_DT || 0.001)) / (3 * 10e-6)) + 0.1);
            const vEq = (4/3)*this.vHistory[0] - (1/3)*this.vHistory[1];
            
            this.simI = (vIn - vOut - vEq) / rEq;
            
            const vDropESR = this.simI * (this.esr !== undefined ? this.esr : 0.1);
            const vNew = (vIn - vOut) - vDropESR; 
            
            this.vHistory[1] = this.vHistory[0]; 
            this.vHistory[0] = vNew;             
            
            this.simV = Math.abs(vIn - vOut); 
            this.chargeV = vNew;    
        } else {
            // FITUR FISIKA: Efek Memori (Charge Retention)
            // Jika kabel diputus, arus berhenti (0 Ampere), tetapi sisa tegangan terkunci di plat dalam!
            this.simI = 0;
            this.simV = Math.abs(this.vHistory[0]);
            this.chargeV = this.vHistory[0];
        }
    }
};
ComponentRegistry['capacitor'] = Capacitor;