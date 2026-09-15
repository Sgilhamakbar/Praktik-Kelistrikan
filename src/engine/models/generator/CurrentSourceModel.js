// File: src/engine/models/analog/CurrentSourceModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class CurrentSource extends BaseComponent {
    constructor(data) {
        super(data);
        
        // 1. PARAMETER DATASHEET
        // I_set: Arus target, default 20mA (0.02 A) untuk menyalakan LED
        this.i_set = data.customValue !== undefined ? data.customValue : 0.02; 
        
        // V_comp: Compliance Voltage, batas maksimal tegangan yang bisa dihasilkan
        // Default 24V (seolah-olah sumber arus ini ditenagai adaptor 24V)
        this.v_comp = data.v_comp !== undefined ? data.v_comp : 24.0;

        // 2. SABUK PENGAMAN FISIKA (Anti-Crash GS)
        // R_shunt: Hambatan parasit internal 1 GigaOhm
        this.r_shunt = 1e9; 
        
        // 3. VARIABEL PEMBACAAN
        this.simV = 0; // Tegangan yang melintasi komponen
        this.simI = 0; // Arus nyata yang berhasil mengalir
        this.isSaturated = false; // Bendera peringatan jika nabrak V_comp
    }

    injectMatrix(engine, sumVR, sum1R) {
        // Anggap pin output (0) sebagai Kutub Positif, pin input (0) sebagai Kutub Negatif
        const nPos = engine.getNodeIndex(this.id, 'output', 0);
        const nNeg = engine.getNodeIndex(this.id, 'input', 0);

        // Ambil tebakan tegangan sementara dari iterasi sebelumnya
        const vPos = nPos !== -1 ? (engine.nodeVoltage[nPos] || 0) : 0;
        const vNeg = nNeg !== -1 ? (engine.nodeVoltage[nNeg] || 0) : 0;
        
        // Hitung selisih tegangan saat ini (Delta V)
        const vDiff = vPos - vNeg;

        // Konduktansi pengaman dari Resistor Shunt (1 / 1 GigaOhm = 1 nanoSiemens)
        const gShunt = 1.0 / this.r_shunt;

        // ===============================================================
        // CEK KONDISI: Apakah beban terlalu berat dan menabrak V_comp?
        // ===============================================================
        if (vDiff > this.v_comp) {
            // MODE SATURASI (CEKIK ARUS)
            // Komponen berubah wujud menjadi Sumber Tegangan Konstan sebesar V_comp.
            // Kita gunakan Norton dengan hambatan sangat kecil (1 milliOhm).
            this.isSaturated = true;
            const rSat = 1e-3; 
            const gSat = 1.0 / rSat;
            
            if (nPos !== -1) {
                // Node Positif dipaksa menuju (V_Negatif + V_comp)
                sumVR[nPos] += (vNeg + this.v_comp) * gSat;
                sum1R[nPos] += gSat;
            }
            if (nNeg !== -1) {
                // Node Negatif dipaksa menuju (V_Positif - V_comp)
                sumVR[nNeg] += (vPos - this.v_comp) * gSat;
                sum1R[nNeg] += gSat;
            }
        } else {
            // MODE NORMAL (ARUS KONSTAN)
            this.isSaturated = false;
            
            // 1. Suntikkan I_set Murni
            if (nPos !== -1) sumVR[nPos] += this.i_set;
            if (nNeg !== -1) sumVR[nNeg] -= this.i_set;
            
            // 2. Suntikkan Resistor Shunt agar Matriks tidak membagi dengan 0
            if (nPos !== -1) sum1R[nPos] += gShunt;
            if (nNeg !== -1) sum1R[nNeg] += gShunt;
            
            // 3. Persilangan Resistor Shunt (Hukum Kirchhoff Nodal)
            if (nPos !== -1 && nNeg !== -1) {
                sumVR[nPos] += vNeg * gShunt;
                sumVR[nNeg] += vPos * gShunt;
            }
        }
    }

applyResults(engine) {
        const nPos = engine.getNodeIndex(this.id, 'output', 0);
        const nNeg = engine.getNodeIndex(this.id, 'input', 0);
        
        const vPos = nPos !== -1 ? (engine.nodeVoltage[nPos] || 0) : 0;
        const vNeg = nNeg !== -1 ? (engine.nodeVoltage[nNeg] || 0) : 0;
        
        this.simV = vPos - vNeg;
        
        // Tentukan arus nyata berdasarkan status saturasi
        if (this.isSaturated) {
            // Arus drop karena tegangan mentok
            // (Hukum Ohm: I = V/R, dengan R_beban yang terlalu besar)
            // Kita bisa menampilkannya di UI sebagai "Saturasi"
            this.simI = "Saturasi (V_Limit)";
        } else {
            this.simI = this.i_set;
        }
    }
}

ComponentRegistry['current_source'] = CurrentSource;