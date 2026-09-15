// File: src/engine/AudioManager.js
import { CircuitStore } from '../state/CircuitStore.js';

export const AudioManager = {
    context: null,
    isInitialized: false,
    voices: new Map(), // Laci penyimpan suara berdasarkan ID Komponen

    init() {
        if (this.isInitialized) return;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.isInitialized = true;

            // 🟢 TUKANG SAPU OTOMATIS (Garbage Collector)
            // Memeriksa tiap 1 detik: Jika komponen sudah dihapus/di-undo, matikan suaranya!
            setInterval(() => {
                if (typeof CircuitStore !== 'undefined') {
                    const activeIds = CircuitStore.components.map(c => c.id);
                    for (let compId of this.voices.keys()) {
                        if (!activeIds.includes(compId)) {
                            this.killVoice(compId);
                        }
                    }
                }
            }, 1000);

        } catch (e) {
            console.warn('Web Audio API tidak didukung di browser ini.');
        }
    },

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },

    suspend() {
        if (this.context && this.context.state === 'running') {
            this.context.suspend();
        }
    },

    // 🟢 MENGAMBIL SUARA (Atau membuat baru jika belum ada)
    getVoice(compId) {
        if (!this.context) return null;
        
        if (this.voices.has(compId)) {
            return this.voices.get(compId);
        }

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = 'square'; 
        oscillator.frequency.value = 0; 
        gainNode.gain.value = 0; 
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        oscillator.start();
        
        const voice = { oscillator, gainNode };
        this.voices.set(compId, voice);
        return voice;
    },

    // 🟢 PEMBUNUH SUARA
    killVoice(compId) {
        if (this.voices.has(compId)) {
            const voice = this.voices.get(compId);
            try {
                // Turunkan volume ke 0 dengan mulus agar tidak bunyi "pop"
                voice.gainNode.gain.setTargetAtTime(0, this.context.currentTime, 0.01);
                setTimeout(() => {
                    voice.oscillator.stop();
                    voice.oscillator.disconnect();
                    voice.gainNode.disconnect();
                }, 100);
            } catch(e) {}
            this.voices.delete(compId);
        }
    },

    killAllVoices() {
        for (let compId of this.voices.keys()) {
            this.killVoice(compId);
        }
    }
};