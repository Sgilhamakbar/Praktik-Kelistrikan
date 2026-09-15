// File: src/engine/models/generator/PulseGeneratorModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class PulseGenerator extends BaseComponent {
    constructor(data) {
        super(data);
        
        // Membaca pengaturan UI atau menggunakan nilai standar (The Golden 7)
        this.v_initial = data.v_initial !== undefined ? data.v_initial : 0.0;
        this.v_peak = data.v_peak !== undefined ? data.v_peak : 5.0;
        this.t_delay = data.t_delay !== undefined ? data.t_delay : 0.0;
        
        this.t_rise = data.t_rise !== undefined ? data.t_rise : 0.01; // 10ms
        this.t_on = data.t_on !== undefined ? data.t_on : 0.48;       // 480ms
        this.t_fall = data.t_fall !== undefined ? data.t_fall : 0.01; // 10ms
        
        // Jika UI mengirim frekuensi, konversi ke periode
        if (data.freqValue) {
            this.t_period = 1.0 / data.freqValue;
        } else {
            this.t_period = data.t_period !== undefined ? data.t_period : 1.0;
        }

        // Impedansi internal BNC standar (50 Ohm)
        this.r_out = 50.0; 
        this.simV = 0;
    }

    // Fungsi matematika (Fungsi Piecewise Waktu)
    getTargetVoltage(currentTime) {
        if (currentTime < this.t_delay) return this.v_initial;

        const t_cycle = (currentTime - this.t_delay) % this.t_period;

        if (t_cycle < this.t_rise) {
            // Fase 1: Naik
            if (this.t_rise <= 0) return this.v_peak;
            return this.v_initial + ((this.v_peak - this.v_initial) / this.t_rise) * t_cycle;
        } 
        else if (t_cycle < (this.t_rise + this.t_on)) {
            // Fase 2: Puncak
            return this.v_peak;
        } 
        else if (t_cycle < (this.t_rise + this.t_on + this.t_fall)) {
            // Fase 3: Turun
            if (this.t_fall <= 0) return this.v_initial;
            const t_fall_active = t_cycle - (this.t_rise + this.t_on);
            return this.v_peak - ((this.v_peak - this.v_initial) / this.t_fall) * t_fall_active;
        } 
        else {
            // Fase 4: Mati (Istirahat)
            return this.v_initial;
        }
    }

    // FASE ANALOG: Injeksi Ekuivalen Norton
    injectMatrix(engine, sumVR, sum1R) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nOut === -1) return;

        // Ambil Jam Global dari mesin
        const currentTime = engine.simTime;
        const vTarget = this.getTargetVoltage(currentTime);

        // Rumus Norton (Sumber Arus Paralel Resistor)
        const gOut = 1.0 / this.r_out;
        const currentNorton = vTarget * gOut;

        sumVR[nOut] += currentNorton;
        sum1R[nOut] += gOut;
    }

    // Ambil hasil untuk UI layar
    applyResults(engine) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = nOut !== -1 ? (engine.nodeVoltage[nOut] ?? 0) : 0;
    }
}

ComponentRegistry['pulse_generator'] = PulseGenerator;