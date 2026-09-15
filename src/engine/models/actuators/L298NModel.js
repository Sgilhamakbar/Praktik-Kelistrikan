// File: src/engine/models/actuators/L298NModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class L298N extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // Ambil 9 Input
        const n12V = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const n5V  = engine.getNodeIndex(this.id, 'input', 2);
        
        const nEna = engine.getNodeIndex(this.id, 'input', 3);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 4);
        const nIn2 = engine.getNodeIndex(this.id, 'input', 5);
        const nIn3 = engine.getNodeIndex(this.id, 'input', 6);
        const nIn4 = engine.getNodeIndex(this.id, 'input', 7);
        const nEnb = engine.getNodeIndex(this.id, 'input', 8);
        
        // Ambil 4 Output
        const nOut1 = engine.getNodeIndex(this.id, 'output', 0);
        const nOut2 = engine.getNodeIndex(this.id, 'output', 1);
        const nOut3 = engine.getNodeIndex(this.id, 'output', 2);
        const nOut4 = engine.getNodeIndex(this.id, 'output', 3);

        const v12V = n12V !== -1 ? (engine.nodeVoltage[n12V] || 0) : 0;
        const vGnd = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        const vPower = v12V - vGnd;
        
        this.isPowered = vPower >= 4.0; 

        // Beban internal L298N
        if (n12V !== -1 && nGnd !== -1) {
            const condPwr = 1 / 1000; 
            sumVR[n12V] += vGnd * condPwr; sum1R[n12V] += condPwr;
            sumVR[nGnd] += v12V * condPwr; sum1R[nGnd] += condPwr;
        }

        if (this.isPowered) {
            const gOut = 1 / 0.5; // Arus kuat 2 Ampere

            // 🌟 FITUR REALISTIS: Pin 5V menjadi Output Regulator
            // L298N bisa mensuplai 5V kembali ke Arduino jika 12V dicolok!
            if (n5V !== -1) {
                sumVR[n5V] += (vGnd + 5.0) * gOut; sum1R[n5V] += gOut;
            }

            const getPWM = (nIn) => {
                const vIn = nIn !== -1 ? (engine.nodeVoltage[nIn] || 0) : 0;
                return Math.max(0, Math.min(1, (vIn - vGnd) / 5.0));
            };

            // 🌟 LOGIKA ENABLE (Jumper Simulator)
            // Jika tidak ada kabel dicolok (node === -1), anggap jumper terpasang (1.0)
            const ena = nEna !== -1 ? getPWM(nEna) : 1.0;
            const enb = nEnb !== -1 ? getPWM(nEnb) : 1.0;

            // Logika H-Bridge dikalikan dengan kecepatan ENA/ENB
            const pwm1 = getPWM(nIn1) * ena;
            const pwm2 = getPWM(nIn2) * ena;
            const pwm3 = getPWM(nIn3) * enb;
            const pwm4 = getPWM(nIn4) * enb;

            if (nOut1 !== -1) { sumVR[nOut1] += (vGnd + pwm1 * vPower) * gOut; sum1R[nOut1] += gOut; }
            if (nOut2 !== -1) { sumVR[nOut2] += (vGnd + pwm2 * vPower) * gOut; sum1R[nOut2] += gOut; }
            if (nOut3 !== -1) { sumVR[nOut3] += (vGnd + pwm3 * vPower) * gOut; sum1R[nOut3] += gOut; }
            if (nOut4 !== -1) { sumVR[nOut4] += (vGnd + pwm4 * vPower) * gOut; sum1R[nOut4] += gOut; }
            
        } else {
            // Mati total
            const gOff = 1 / 100000; 
            if (nOut1 !== -1) { sumVR[nOut1] += vGnd * gOff; sum1R[nOut1] += gOff; }
            if (nOut2 !== -1) { sumVR[nOut2] += vGnd * gOff; sum1R[nOut2] += gOff; }
            if (nOut3 !== -1) { sumVR[nOut3] += vGnd * gOff; sum1R[nOut3] += gOff; }
            if (nOut4 !== -1) { sumVR[nOut4] += vGnd * gOff; sum1R[nOut4] += gOff; }
            
            // Pin 5V juga tidak mengeluarkan daya
            if (n5V !== -1) { sumVR[n5V] += vGnd * gOff; sum1R[n5V] += gOff; }
        }
    }
}
ComponentRegistry['l298n'] = L298N;