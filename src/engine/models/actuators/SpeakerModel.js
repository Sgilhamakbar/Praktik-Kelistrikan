// File: src/engine/models/actuators/SpeakerModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';
import { AudioManager } from '../../AudioManager.js';

export class Speaker extends BaseComponent {
    
    // 1. FISIKA KELISTRIKAN (MNA)
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);

        // Simulasi Hambatan Voice Coil Speaker (Standar 8 Ohm)
        const resistance = 8.0; 
        const conductance = 1 / resistance;

        if (nIn0 !== -1 && nIn1 !== -1) {
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * conductance; sum1R[nIn0] += conductance;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * conductance; sum1R[nIn1] += conductance;
        } else {
            // Fallback jika salah satu pin ngambang
            if (nIn0 !== -1) sum1R[nIn0] += conductance;
            if (nIn1 !== -1) sum1R[nIn1] += conductance;
        }
    }

    // 2. LOGIKA PEMBACAAN GELOMBANG & SUARA
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        const v0 = nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0;
        const v1 = nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0;
        
        // Selisih tegangan aktual yang masuk ke speaker
        const vDiff = v0 - v1;
        this.simV = vDiff;

        // Jika Simulasi berjalan, kelola suara
        if (engine.isRunning) {
            this.processAudio(vDiff, engine.simTime);
        } else {
            // Mute jika simulasi berhenti
            if (this.voice && this.voice.gainNode) {
                this.voice.gainNode.gain.value = 0;
            }
        }
    }

    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        const v0 = nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0;
        const v1 = nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0;
        
        const vDiff = v0 - v1;
        this.simV = vDiff;

        if (engine.isRunning) {
            this.processAudio(vDiff, engine.simTime);
        } else {
            // Mute instan saat simulasi stop (tanpa mematikan fisika)
            const voice = AudioManager.isInitialized ? AudioManager.getVoice(this.id) : null;
            if (voice && voice.gainNode) {
                voice.gainNode.gain.setTargetAtTime(0, AudioManager.context.currentTime, 0.05);
            }
        }
    }

    processAudio(vInput, simTime) {
        if (!this.filter) {
            this.filter = { prevX: 0, prevY: 0 };
            this.lastCrossingTime = 0;
            this.prevAC = 0;
            this.freq = 0;
            this.amplitude = 0;
        }

        // 🟢 MINTA PITA SUARA KE MANAJER AUDIO (Bukan bikin sendiri)
        const voice = AudioManager.isInitialized ? AudioManager.getVoice(this.id) : null;

        const alpha = 0.95;
        const vAC = alpha * this.filter.prevY + alpha * (vInput - this.filter.prevX);
        this.filter.prevX = vInput;
        this.filter.prevY = vAC;

        if (this.prevAC <= 0 && vAC > 0) {
            const deltaT = simTime - this.lastCrossingTime;
            if (deltaT > 0 && deltaT < 0.5) { 
                this.freq = 1 / deltaT; 
                this.amplitude = Math.abs(vAC);
            }
            this.lastCrossingTime = simTime;
        }
        this.prevAC = vAC;

        if (simTime - this.lastCrossingTime > 0.1) {
            this.freq = 0;
            this.amplitude = 0;
        }

        if (voice) {
            if (this.amplitude > 0.1 && this.freq > 10) {
                const safeFreq = Math.min(2000, this.freq); 
                const safeVol = Math.min(0.5, this.amplitude * 0.05);

                voice.oscillator.frequency.setTargetAtTime(safeFreq, AudioManager.context.currentTime, 0.01);
                voice.gainNode.gain.setTargetAtTime(safeVol, AudioManager.context.currentTime, 0.01);
            } else {
                voice.gainNode.gain.setTargetAtTime(0, AudioManager.context.currentTime, 0.05);
            }
        }
    }
}

// Daftarkan ke mesin simulator
ComponentRegistry['speaker'] = Speaker;