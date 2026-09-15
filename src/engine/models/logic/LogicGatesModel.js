// File: src/engine/models/logic/LogicGatesModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class LogicGate extends BaseComponent {
    solveDigital(engine) {
        // Membaca status pin input (1 atau 0)
        const in0 = this.inputStates[0] === 1 ? 1 : 0;
        const in1 = this.inputStates[1] === 1 ? 1 : 0;
        
        // Menghitung output berdasarkan jenis gerbang logika
        switch (this.type) {
            case 'and':  this.outputState = (in0 === 1 && in1 === 1) ? 1 : 0; break;
            case 'or':   this.outputState = (in0 === 1 || in1 === 1) ? 1 : 0; break;
            case 'not':  this.outputState = (in0 === 0) ? 1 : 0; break;
            case 'nand': this.outputState = (in0 === 1 && in1 === 1) ? 0 : 1; break;
            case 'nor':  this.outputState = (in0 === 1 || in1 === 1) ? 0 : 1; break;
            case 'xor':  this.outputState = (in0 !== in1) ? 1 : 0; break;
            case 'xnor': this.outputState = (in0 === in1) ? 1 : 0; break;
        }
    }

    applyFixedVoltage(engine, fixedNodes) {
        // Mencari indeks node (titik kelistrikan) untuk pin output
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nOut !== -1) {
            // Jika output logika 1, tembakkan tegangan 5 Volt. Jika 0, beri 0 Volt.
            engine.nodeVoltage[nOut] = this.outputState === 1 ? 5.0 : 0.0;
            fixedNodes[nOut] = true; // Kunci node ini sebagai sumber tegangan (konstan)
        }
    }

    injectMatrix(engine, sumVR, sum1R) {
        // Proteksi Pin Mengambang (Floating Pin Protection)
        // Kita memberikan resistor parasitik pull-down 10 MegaOhm ke Ground
        // agar matriks Gauss-Seidel tidak error/NaN jika pin input tidak disambung kabel.
        const condFloat = 1 / 10000000; 
        
        for (let i = 0; i < (this.inputs || 0); i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { 
                sumVR[nIn] += 0 * condFloat; // Tarikan ke tegangan 0V (Ground)
                sum1R[nIn] += condFloat; 
            }
        }
    }
}

// -----------------------------------------------------
// REGISTRASI KOMPONEN KE DALAM MESIN
// -----------------------------------------------------
// Karena semua gerbang dasar menggunakan kelas fisika yang sama (hanya beda di switch-case),
// kita bisa mendaftarkan mereka sekaligus menggunakan metode iterasi (looping).

const gateTypes = ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'];

gateTypes.forEach(type => {
    ComponentRegistry[type] = LogicGate;
});