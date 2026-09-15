// File: src/engine/models/semiconductors/TransistorModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Transistor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nB = engine.getNodeIndex(this.id, 'input', 0);
        const nC = engine.getNodeIndex(this.id, 'input', 1);
        const nE = engine.getNodeIndex(this.id, 'output', 0);
        
        const vB = nB !== -1 ? (engine.nodeVoltage[nB] || 0) : 0;
        const vC = nC !== -1 ? (engine.nodeVoltage[nC] || 0) : 0;
        const vE = nE !== -1 ? (engine.nodeVoltage[nE] || 0) : 0;

        let rCE = 1000000000;
        let rBE = 1000000000;

        //  1. LOGIKA BJT NPN (ANALOG MODE dengan hFE/Beta)
        if (this.type === 'bjt_npn') {
            const vBE = vB - vE;
            const vCE = vC - vE;
            
            if (vBE > 0.6) {
                // A. Hambatan Dioda Basis (Non-linear)
                rBE = Math.max(10, 500 / (vBE - 0.6 + 0.001)); 
                
                // B. Hitung Arus Basis aktual (Hukum Ohm)
                const iB = vBE / rBE;
                
                // C. Target Arus Kolektor (Misal Transistor 2N2222 memiliki Beta ~100)
                const beta = 100;
                const iC_target = beta * iB;
                
                // D. Hitung Hambatan Dinamis VCE untuk menghasilkan arus iC_target
                // Gunakan Math.abs(vCE) agar resistor tidak bernilai minus
                const rCE_req = Math.abs(vCE) / (iC_target + 1e-9);
                
                // E. Batas Saturasi (Transistor mentok jadi sakelar di 0.5 Ohm)
                rCE = Math.max(0.5, rCE_req);  
            }
        
        // 2. LOGIKA BJT PNP (ANALOG MODE dengan hFE/Beta)
        } else if (this.type === 'bjt_pnp') {
            const vEB = vE - vB;
            const vEC = vE - vC;
            
            if (vEB > 0.6) {
                rBE = Math.max(10, 500 / (vEB - 0.6 + 0.001));
                const iB = vEB / rBE;
                const beta = 100;
                const iC_target = beta * iB;
                const rCE_req = Math.abs(vEC) / (iC_target + 1e-9);
                rCE = Math.max(0.5, rCE_req);
            }
        
        // 3. LOGIKA MOSFET (TETAP SAMA - Sempurna sbg Sakelar Daya)
        } else if (this.type === 'mosfet_n') {
            const vGS = vB - vE;
            if (vGS > 2.5) {
                rCE = Math.max(0.01, 10 / Math.pow(vGS - 2.5 + 0.1, 2)); 
            }
        } else if (this.type === 'mosfet_p') {
            const vSG = vE - vB;
            if (vSG > 2.5) {
                rCE = Math.max(0.01, 10 / Math.pow(vSG - 2.5 + 0.1, 2));
            }
        }
        
        // --- SUNTIKKAN KE MATRIKS GAUSS-SEIDEL ---
        if (nC !== -1 && nE !== -1) {
            const condCE = 1 / rCE;
            sumVR[nC] += engine.nodeVoltage[nE] * condCE; sum1R[nC] += condCE;
            sumVR[nE] += engine.nodeVoltage[nC] * condCE; sum1R[nE] += condCE;
        }                    
        if (nB !== -1 && nE !== -1) {
            const condBE = 1 / rBE;
            sumVR[nB] += engine.nodeVoltage[nE] * condBE; sum1R[nB] += condBE;
            sumVR[nE] += engine.nodeVoltage[nB] * condBE; sum1R[nE] += condBE;
        }
    }

    applyResults(engine) {
        const nB = engine.getNodeIndex(this.id, 'input', 0);
        const nC = engine.getNodeIndex(this.id, 'input', 1);
        const nE = engine.getNodeIndex(this.id, 'output', 0);

        const vB = nB !== -1 ? engine.nodeVoltage[nB] : 0;
        const vC = nC !== -1 ? engine.nodeVoltage[nC] : 0;
        const vE = nE !== -1 ? engine.nodeVoltage[nE] : 0;

        this.simV = Math.abs(vC - vE);

        let isOn = false;
        if (this.type === 'bjt_npn') isOn = (vB - vE) > 0.6;
        else if (this.type === 'bjt_pnp') isOn = (vE - vB) > 0.6;
        else if (this.type === 'mosfet_n') isOn = (vB - vE) > 2.5;
        else if (this.type === 'mosfet_p') isOn = (vE - vB) > 2.5;

        this.state = isOn ? '1' : '0';
    }
}
ComponentRegistry['bjt_npn'] = Transistor;
ComponentRegistry['bjt_pnp'] = Transistor;
ComponentRegistry['mosfet_n'] = Transistor;
ComponentRegistry['mosfet_p'] = Transistor;