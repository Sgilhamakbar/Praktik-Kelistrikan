// File: src/engine/models/actuators/RelayModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Relay extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // AMBIL PARAMETER DATASHEET DARI PENGGUNA (Gunakan default jika kosong)
        const rCoil = this.coilR !== undefined ? this.coilR : 100.0;
        const rContact = this.contactR !== undefined ? this.contactR : 0.1;
        const rOpen = 1000000000; // 1 GigaOhm untuk saklar terbuka

        // A. FISIKA KOIL ELEKTROMAGNETIK
        const nInC = engine.getNodeIndex(this.id, 'input', 0);
        const nOutC = engine.getNodeIndex(this.id, 'output', 0);
        if (nInC !== -1 && nOutC !== -1) {
            const condC = 1 / rCoil; 
            sumVR[nInC] += engine.nodeVoltage[nOutC] * condC; sum1R[nInC] += condC;
            sumVR[nOutC] += engine.nodeVoltage[nInC] * condC; sum1R[nOutC] += condC;
        }

        // B. FISIKA SAKELAR MEKANIK
        const isActive = this.state === '1';
        
        if (this.type === 'relay') {
            const rSwitch = isActive ? rContact : rOpen; 
            const nInS = engine.getNodeIndex(this.id, 'input', 1);
            const nOutS = engine.getNodeIndex(this.id, 'output', 1);
            
            if (nInS !== -1 && nOutS !== -1) {
                const condS = 1 / rSwitch;
                sumVR[nInS] += engine.nodeVoltage[nOutS] * condS; sum1R[nInS] += condS;
                sumVR[nOutS] += engine.nodeVoltage[nInS] * condS; sum1R[nOutS] += condS;
            }
        } 
        else if (this.type === 'relay_5pin') {
            const nCom = engine.getNodeIndex(this.id, 'input', 1);
            const nNC = engine.getNodeIndex(this.id, 'output', 1);
            const nNO = engine.getNodeIndex(this.id, 'output', 2);
            
            if (nCom !== -1 && nNC !== -1) {
                const rNC = isActive ? rOpen : rContact;
                const condNC = 1 / rNC;
                sumVR[nCom] += engine.nodeVoltage[nNC] * condNC; sum1R[nCom] += condNC;
                sumVR[nNC] += engine.nodeVoltage[nCom] * condNC; sum1R[nNC] += condNC;
            }
            if (nCom !== -1 && nNO !== -1) {
                const rNO = isActive ? rContact : rOpen;
                const condNO = 1 / rNO;
                sumVR[nCom] += engine.nodeVoltage[nNO] * condNO; sum1R[nCom] += condNO;
                sumVR[nNO] += engine.nodeVoltage[nCom] * condNO; sum1R[nNO] += condNO;
            }
        }
    }

    applyResults(engine) {
        const nInC = engine.getNodeIndex(this.id, 'input', 0);
        const nOutC = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nInC !== -1 ? engine.nodeVoltage[nInC] : 0;
        const vOut = nOutC !== -1 ? engine.nodeVoltage[nOutC] : 0;
        const vDiff = Math.abs(vIn - vOut);
        
        // 🟢 FISIKA HISTERESIS OTOMATIS BERDASARKAN NOMINAL VOLTAGE
        const vNominal = this.coilV !== undefined ? this.coilV : 5.0; // Default 5V
        
        // Standar Industri: Tarik di 75% tegangan, Lepas di 10% tegangan
        const pullInVoltage = vNominal * 0.75; 
        const dropOutVoltage = vNominal * 0.10; 

        if (this.state === '0' && vDiff > pullInVoltage) {
            this.state = '1';
        } else if (this.state === '1' && vDiff < dropOutVoltage) {
            this.state = '0';
        }
    }
}
ComponentRegistry['relay'] = Relay;
ComponentRegistry['relay_5pin'] = Relay;