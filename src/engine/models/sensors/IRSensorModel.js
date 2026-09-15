// File: src/engine/models/sensor/IRSensorModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class IRSensor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // Pin konfigurasi: Input 0 = VCC, Input 1 = GND, Output 0 = OUT
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        const vDD = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const vSS = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        this.isPowered = (vDD - vSS) >= 3.0; // Butuh minimal 3 Volt untuk menyala

        if (nOut !== -1 && this.isPowered) {
            const rOut = 100.0; // Resistansi internal pin output
            const gOut = 1 / rOut;

            // Baca jarak dari slider pengguna (default 50 cm)
            const jarakCm = parseFloat(this.state) || 50; 
            
            // Logika Sensor IR FC-51: Aktif LOW.
            // Jika ada objek di bawah jarak sensitivitas (misal 20 cm), output 0V.
            // Jika aman / tidak ada halangan, output 5V.
            let targetV = (jarakCm <= 20) ? 0.0 : 5.0;

            sumVR[nOut] += targetV * gOut;
            sum1R[nOut] += gOut;
        }
    }
}
ComponentRegistry['ir_sensor'] = IRSensor;