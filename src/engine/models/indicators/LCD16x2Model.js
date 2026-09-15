// File: src/engine/models/indicators/LCD16x2Model.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class LCD16x2 extends BaseComponent {
    constructor(data) {
        super(data);
        // Memori internal untuk menyimpan 2 baris teks (masing-masing 16 spasi kosong)
        this.lcdText = this.lcdText || ["                ", "                "];
    }

    injectMatrix(engine, sumVR, sum1R) {
        // Pin 0 adalah GND, Pin 1 adalah VCC
        const nGnd = engine.getNodeIndex(this.id, 'input', 0);
        const nVcc = engine.getNodeIndex(this.id, 'input', 1);

        // Berikan sedikit beban resistansi (meniru konsumsi daya LCD nyata sekitar 10mA)
        if (nVcc !== -1 && nGnd !== -1) {
            const cond = 1 / 500; // Konduktansi dari 500 Ohm
            sumVR[nVcc] += engine.nodeVoltage[nGnd] * cond; sum1R[nVcc] += cond;
            sumVR[nGnd] += engine.nodeVoltage[nVcc] * cond; sum1R[nGnd] += cond;
        }
    }

    applyResults(engine) {
        const nGnd = engine.getNodeIndex(this.id, 'input', 0);
        const nVcc = engine.getNodeIndex(this.id, 'input', 1);
        
        const vDD = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const vSS = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        
        // LCD hanya menyala jika mendapat beda potensial minimal 4.0 Volt
        this.isPowered = (vDD - vSS) >= 4.0;
    }
}

ComponentRegistry['lcd_16x2'] = LCD16x2;