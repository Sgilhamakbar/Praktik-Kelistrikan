// File: src/engine/models/sensors/SoilMoistureModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class SoilMoisture extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // 1. Ambil Node Kabel Daya (VCC & GND)
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        
        // 2. Ambil Node Kabel Internal (Antara PCB dan Garpu)
        const nPcbPlus  = engine.getNodeIndex(this.id, 'output', 2);
        const nPcbMinus = engine.getNodeIndex(this.id, 'output', 3);
        const nForkPlus = engine.getNodeIndex(this.id, 'input', 3);
        const nForkMinus = engine.getNodeIndex(this.id, 'input', 2);

        // 3. Ambil Node Kabel Sensor ke Arduino
        const nA0 = engine.getNodeIndex(this.id, 'output', 0);
        const nD0 = engine.getNodeIndex(this.id, 'output', 1);

        const vVcc = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const vGnd = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        const vPower = vVcc - vGnd;
        
        this.isPowered = vPower >= 3.0; 

        // 🌟 LOGIKA CERDAS: Cek apakah pengguna sudah menghubungkan kabel!
        this.isWired = false;
        if (nPcbPlus !== -1 && nPcbMinus !== -1 && nForkPlus !== -1 && nForkMinus !== -1) {
            // Mengecek apakah nomor seri node kabelnya sama (artinya tersambung)
            // Mendukung pemasangan kabel lurus maupun menyilang (karena garpu tidak punya polaritas mutlak)
            if ((nPcbPlus === nForkPlus && nPcbMinus === nForkMinus) || 
                (nPcbPlus === nForkMinus && nPcbMinus === nForkPlus)) {
                this.isWired = true;
            }
        }

        if (this.isPowered) {
            // Jika kabel TIDAK disambung, anggap kelembapan = 0 (kering kerontang/open circuit)
            const moisture = this.isWired ? (parseFloat(this.state) || 0) : 0; 
            
            // Analog: Tanah kering (0%) = 5V. Basah (100%) = 0V.
            const analogVolt = ((100.0 - moisture) / 100.0) * vPower;
            // Digital: Batas komparator 50%
            // LOGIKA Ambil nilai Trimpot dari UI (Default 50%)
            const threshold = this.threshold !== undefined ? this.threshold : 50;
            // Digital: Jika kelembapan di bawah nilai Trimpot, DO menjadi HIGH
            const digitalVolt = moisture < threshold ? vPower : 0.0;

            const gOut = 1 / 100.0; 
            if (nA0 !== -1) { sumVR[nA0] += (vGnd + analogVolt) * gOut; sum1R[nA0] += gOut; }
            if (nD0 !== -1) { sumVR[nD0] += (vGnd + digitalVolt) * gOut; sum1R[nD0] += gOut; }

            // Menambahkan sedikit tegangan "palsu" ke pin PCB+ dan PCB- agar terlihat realistis jika diukur Multimeter
            const gProbe = 1 / 1000.0;
            if (nPcbPlus !== -1) { sumVR[nPcbPlus] += (vGnd + 3.3) * gProbe; sum1R[nPcbPlus] += gProbe; }
            if (nPcbMinus !== -1) { sumVR[nPcbMinus] += vGnd * gProbe; sum1R[nPcbMinus] += gProbe; }
            
        } else {
            const gOff = 1 / 100000.0;
            if (nA0 !== -1) { sumVR[nA0] += vGnd * gOff; sum1R[nA0] += gOff; }
            if (nD0 !== -1) { sumVR[nD0] += vGnd * gOff; sum1R[nD0] += gOff; }
        }
    }
}
ComponentRegistry['soil_moisture'] = SoilMoisture;