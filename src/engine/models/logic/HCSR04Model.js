// File: src/engine/models/logic/HCSR04Model.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class HCSR04 extends BaseComponent {
    solveDigital(engine, iter) {
        if (iter !== 4) return;
        
        // Baca status pin TRIG (Input 1)
        const trigState = this.inputStates[1] || 0;
        
        // Deteksi tepi naik (Rising Edge) pada TRIG
        if (trigState === 1 && this.prevTrig === 0) {
            this.isTriggered = true;
            // Hitung durasi pantulan (Jarak * 58 mikrodetik) diubah ke detik
            const distanceCm = parseFloat(this.state) || 50; 
            this.echoEndTime = engine.simTime + ((distanceCm * 58) / 1000000);
        }
        this.prevTrig = trigState;
    }

    injectMatrix(engine, sumVR, sum1R) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 2);
        const nEcho = engine.getNodeIndex(this.id, 'output', 0);
        
        const vDD = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const vSS = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        this.isPowered = (vDD - vSS) >= 4.0;

        if (nEcho !== -1 && this.isPowered) {
            const rOut = 100.0; 
            const gOut = 1 / rOut;
            
            // Keluarkan 5V pada ECHO jika sedang dalam waktu pantulan
            let targetV = 0.0;
            if (this.isTriggered && engine.simTime < this.echoEndTime) {
                targetV = 5.0;
            } else {
                this.isTriggered = false;
            }
            
            sumVR[nEcho] += targetV * gOut;
            sum1R[nEcho] += gOut;
        }
    }
}
ComponentRegistry['hc_sr04'] = HCSR04;