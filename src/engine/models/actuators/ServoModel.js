// File: src/engine/models/actuators/ServoModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Servo extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nSig = engine.getNodeIndex(this.id, 'input', 0);
        const nVcc = engine.getNodeIndex(this.id, 'input', 1);
        const nGnd = engine.getNodeIndex(this.id, 'input', 2);
        if (nSig !== -1 && nGnd !== -1) {
            const condSig = 1 / 1000000;
            sumVR[nSig] += engine.nodeVoltage[nGnd] * condSig; sum1R[nSig] += condSig;
            sumVR[nGnd] += engine.nodeVoltage[nSig] * condSig; sum1R[nGnd] += condSig;
        }
        if (nVcc !== -1 && nGnd !== -1) {
            const condVcc = 1 / 250;
            sumVR[nVcc] += engine.nodeVoltage[nGnd] * condVcc; sum1R[nVcc] += condVcc;
            sumVR[nGnd] += engine.nodeVoltage[nVcc] * condVcc; sum1R[nGnd] += condVcc;
        }
    }
    applyResults(engine) {
        const nSig = engine.getNodeIndex(this.id, 'input', 0);
        const nVcc = engine.getNodeIndex(this.id, 'input', 1);
        const nGnd = engine.getNodeIndex(this.id, 'input', 2);
        
        const vDD = nVcc !== -1 ? engine.nodeVoltage[nVcc] : 0;
        const vSS = nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0;
        const vSig = nSig !== -1 ? engine.nodeVoltage[nSig] : 0;
        
        const voltPower = Math.abs(vDD - vSS);
        this.simV = voltPower; 
        
        let maxAng = this.maxAngle !== undefined ? this.maxAngle : 180;
        
        // Servo butuh minimal 3.0 Volt untuk bisa menyala dan bergerak
        if (voltPower > 3.0) {
            this.isPowered = true;
            
            // 🌟 PERBAIKAN: Hitung rasio berdasarkan skala mutlak 5.0 Volt, BUKAN voltPower!
            // Ini meniru sifat asli PWM yang kebal terhadap tegangan jatuh (Voltage Drop) pada VCC.
            let sigVoltage = Math.max(0, vSig - vSS); 
            let rawTarget = (sigVoltage / 5.0) * 180;
            
            // Terapkan batas pembatas mekanis fisik
            let targetAngle = Math.max(0, Math.min(maxAng, rawTarget));
            
            if (typeof this.servoAngle === 'undefined') this.servoAngle = 0;
            let diff = targetAngle - this.servoAngle;
            
            // Gerakan putar perlahan menuju target
            this.servoAngle = Math.abs(diff) < 0.1 
                ? targetAngle 
                : this.servoAngle + Math.max(-4, Math.min(4, diff * 0.1));
                
        } else {
            this.isPowered = false;
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['servo'] = Servo;