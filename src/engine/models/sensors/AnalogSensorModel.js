// File: src/engine/models/sensor/AnalogSensorModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class AnalogSensor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // 1. Baca nilai slider Suhu/Cahaya
        let val = parseFloat(this.state);
        if (isNaN(val)) val = 50;
        
        // 2. SINKRONISASI MODAL: Baca dari customValue agar tidak hilang saat refresh
        // Tetap pasang fallback ke r25/beta/alpha untuk kompatibilitas ke belakang
        let v1 = this.customValue !== undefined ? this.customValue : this.r25;
        let v2 = this.customValue2 !== undefined ? this.customValue2 : (this.beta || this.alpha);
        
        let param1 = parseFloat(v1);
        let param2 = parseFloat(v2);

        let r = 1000;
        
        if (this.type === 'ldr') {
            // FISIKA : Hukum Power-Law LDR (GL5528)
            // val di sini sekarang merepresentasikan Lux (0 s/d 100.000)
            
            if (val <= 0.1) {
                // Gelap total (0 Lux)
                r = 1000000; 
            } else {
                // R10 = Hambatan di 10 Lux (10.000 Ohm)
                // Gamma = Kelengkungan kurva (0.8)
                r = 10000 * Math.pow((val / 10), -0.8);
                
                // Kliping batas toleransi semikonduktor fisik
                if (r < 50) r = 50; 
                if (r > 1000000) r = 1000000; 
            }
        } else if (this.type === 'thermistor_ntc') {
            // Persamaan Steinhart-Hart NTC
            const r25 = isNaN(param1) ? 10000 : param1; // Default 10k
            const beta = isNaN(param2) ? 3950 : param2; // Default 3950
            const T_kelvin = val + 273.15;
            r = r25 * Math.exp(beta * ((1 / T_kelvin) - (1 / 298.15)));
        } else if (this.type === 'thermistor_ptc') {
            // Persamaan Alpha PTC
            const r25 = isNaN(param1) ? 100 : param1;   // Default 100 ohm
            const alpha = isNaN(param2) ? 0.05 : param2;
            r = r25 * Math.exp(alpha * (val - 25)); 
        }

        // 3. PENGAMAN FATAL (ANTI-CRASH MATRIX)
        // Cegah resistansi menjadi NaN, 0, atau tak terhingga yang merusak KCL Op-Amp
        if (isNaN(r) || r < 0.001) r = 0.001; 
        if (r > 1000000000) r = 1000000000;

        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const cond = 1 / r;

        // 4. KCL INJECTION YANG TAHAN BANTING
        // Kode sebelumnya gagal jika hanya disambung 1 kaki. Ini perbaikannya:
        if (nIn !== -1) {
            sumVR[nIn] += (nOut !== -1 ? (engine.nodeVoltage[nOut] || 0) : 0) * cond;
            sum1R[nIn] += cond;
        }
        if (nOut !== -1) {
            sumVR[nOut] += (nIn !== -1 ? (engine.nodeVoltage[nIn] || 0) : 0) * cond;
            sum1R[nOut] += cond;
        }
    }

    // 5. FITUR BARU: Pembacaan Hasil untuk Voltmeter & UI
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        const vIn = nIn !== -1 ? (engine.nodeVoltage[nIn] || 0) : 0;
        const vOut = nOut !== -1 ? (engine.nodeVoltage[nOut] || 0) : 0;
        
        this.simV = Math.abs(vIn - vOut);
    }
}

// =====================================================
// 3. SENSOR SUHU PRESISI LM35 (IC TO-92)
// =====================================================
export class SensorLM35 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R, iter) {
        // Konfigurasi Kaki: Pin 1 = VCC (Input 0), Pin 3 = GND (Input 1), Pin 2 = VOUT (Output 0)
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nVcc !== -1 && nGnd !== -1) {
            const vVcc = engine.nodeVoltage[nVcc] || 0;
            const vGnd = engine.nodeVoltage[nGnd] || 0;
            const deltaV = vVcc - vGnd;

            // 1. Baca nilai suhu dari UI (Slider)
            let temp = parseFloat(this.state);
            if (isNaN(temp)) temp = 25.0; // Default Suhu Ruang 25°C

            // 2. CEK TEGANGAN KERJA (Harus >= 4.0V)
            if (deltaV >= 4.0) {
                // A. Sedot Arus Quiescent (60 µA ditarik dari VCC ke GND)
                sumVR[nVcc] -= 0.00006; 
                sumVR[nGnd] += 0.00006;

                if (nOut !== -1) {
                    // B. Hukum Skala LM35: 10mV per 1 Derajat Celcius
                    const targetV = temp * 0.01; 
                    const absoluteTargetV = vGnd + targetV;

                    // C. Impedansi Output Sangat Rendah (0.1 Ohm -> Konduktansi 10)
                    const Gout = 10.0;
                    const currentVout = engine.nodeVoltage[nOut] || 0;

                    // Paksa tegangan keluar sesuai target suhu
                    sumVR[nOut] += absoluteTargetV * Gout;
                    sum1R[nOut] += Gout;

                    // D. FISIKA KCL SEMPURNA: Dari mana listrik VOUT berasal?
                    const iOutActual = (absoluteTargetV - currentVout) * Gout;
                    
                    if (iOutActual > 0) {
                        // Jika VOUT mensuplai beban (arus keluar), tarik dayanya dari VCC
                        sumVR[nVcc] -= iOutActual; 
                    } else if (iOutActual < 0) {
                        // Jika VOUT kemasukan arus, buang arusnya ke GND
                        sumVR[nGnd] -= iOutActual; 
                    }
                    
                    this.simState = 'on';
                    this.simV_out = targetV;
                }
            } else {
                // 3. WILAYAH MATI (VCC < 4.0V)
                this.simState = 'off';
                this.simV_out = 0;
                
                // Beri hambatan raksasa (1 GigaOhm) agar kabel OUT tidak "Floating" dan error
                if (nOut !== -1) {
                    const gFloat = 1 / 1000000000; 
                    sumVR[nOut] += vGnd * gFloat;
                    sum1R[nOut] += gFloat;
                }
            }
        }
    }

    applyResults(engine) {
        // Hanya untuk menyimpan status jika diperlukan oleh UI
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const vOut = nOut !== -1 ? (engine.nodeVoltage[nOut] || 0) : 0;
        const vGnd = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        
        this.simV = Math.abs(vOut - vGnd);
    }
}

ComponentRegistry['ldr'] = AnalogSensor;
ComponentRegistry['thermistor_ntc'] = AnalogSensor;
ComponentRegistry['thermistor_ptc'] = AnalogSensor;
ComponentRegistry['sensor_lm35'] = SensorLM35;