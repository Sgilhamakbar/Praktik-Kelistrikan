// File: src/components/meters/MultimetersUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class VoltmeterUI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; }
    getSVG() {
        return `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="40" r="24" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <text class="anim-text meter-val" x="40" y="41" text-anchor="middle" font-size="15">0.0V</text>
          <rect class="control-btn range-btn" x="30" y="47" width="20" height="11" rx="2" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
          <text class="range-txt" x="40" y="55" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">V</text>
          <text x="0" y="30" class="comp-label" fill="red" font-size="14" font-weight="bold">+</text>
          <text x="70" y="30" class="comp-label" fill="black" font-size="14" font-weight="bold">-</text>
        </svg>`;
    }
    updateState(isSimActive) {
        this.setPinActive('pin-in-0', false); this.setPinActive('pin-in-1', false);
        let displayVolt = this.compData.displayVolt !== undefined ? this.compData.displayVolt : (this.compData.simV || 0);
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');
        
        if (this.compData.isMilli) {
            if (text) text.textContent = (displayVolt * 1000).toFixed(0)
            if (rangeTxt) { rangeTxt.textContent = 'mV'; rangeTxt.setAttribute('fill', '#eab308'); }
        } else {
            if (text) text.textContent = displayVolt.toFixed(2)
            if (rangeTxt) { rangeTxt.textContent = 'V'; rangeTxt.setAttribute('fill', '#ffffff'); }
        }
    }
}
UIRegistry['voltmeter'] = VoltmeterUI;

export class VoltmeterACUI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; }
    
    getSVG() {
        return `<svg width="80" height="80" viewBox="0 0 80 80">
          <!-- Pin Konektor -->
          <line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          
          <!-- Bodi Lingkaran Meteran -->
          <circle cx="40" cy="40" r="24" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          
          <!-- Teks Nilai Tegangan -->
          <text class="anim-text meter-val" x="40" y="39" text-anchor="middle" font-size="14">0.0V</text>
          
          <!-- Tombol Switch Skala (Volt / milivolt) -->
          <rect class="control-btn range-btn" x="30" y="47" width="20" height="11" rx="2" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
          <text class="range-txt" x="40" y="55" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">VAC</text>
          
          <!-- Simbol Fasa AC (Tilde) sebagai ganti Plus/Minus -->
          <text x="6" y="30" class="comp-label" fill="#1e293b" font-size="14" font-weight="bold">~</text>
          <text x="74" y="30" class="comp-label" fill="#1e293b" font-size="14" font-weight="bold">~</text>
        </svg>`;
    }
    
    updateState(isSimActive) {
        // Pin Voltmeter tidak menyala hijau karena fungsinya hanya membaca, bukan menyalurkan arus
        this.setPinActive('pin-in-0', false); 
        this.setPinActive('pin-in-1', false);
        
        // Kita akan menggunakan variabel simV_rms dari mesin fisika nanti
        let displayVolt = this.compData.simV_rms || 0;
        
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');
        
        // Fitur klik untuk mengubah skala ke miliVolt (mV) juga dipertahankan!
        if (this.compData.isMilli) {
            if (text) text.textContent = (displayVolt * 1000).toFixed(0)
            if (rangeTxt) { 
                rangeTxt.textContent = 'mV~'; 
                rangeTxt.setAttribute('fill', '#eab308'); // Warna kuning saat mode mV
            }
        } else {
            if (text) text.textContent = displayVolt.toFixed(1)
            if (rangeTxt) { 
                rangeTxt.textContent = 'VAC'; 
                rangeTxt.setAttribute('fill', '#ffffff'); // Warna putih saat mode V biasa
            }
        }
    }
}
// Mendaftarkan komponen ke UI Registry
UIRegistry['voltmeter_ac'] = VoltmeterACUI;

export class AmmeterUI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; }
    getSVG() {
        return `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="40" r="24" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <text class="anim-text meter-val" x="40" y="41" text-anchor="middle" font-size="15">0.00A</text>
          <rect class="control-btn range-btn" x="30" y="47" width="20" height="11" rx="2" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
          <text class="range-txt" x="40" y="55" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">A</text>
        </svg>`;
    }
    
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        let iVal = Math.abs(this.compData.simI || 0);
        
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');
        
        // --- LOGIKA TOMBOL MANUAL 3 PUTARAN (A -> mA -> µA) ---
        
        // 1. Inisialisasi status awal saat komponen pertama kali dirender
        if (this.compData.scaleMode === undefined) {
            this.compData.scaleMode = 0; // 0 = A, 1 = mA, 2 = µA
            this.compData.lastIsMilli = this.compData.isMilli;
        }
        
        // 2. Deteksi jika pengguna MENGKLIK tombol (variabel isMilli berubah dari luar)
        if (this.compData.isMilli !== this.compData.lastIsMilli) {
            this.compData.lastIsMilli = this.compData.isMilli; // Simpan memori klik
            // Putar mode ke tahap berikutnya
            this.compData.scaleMode = (this.compData.scaleMode + 1) % 3; 
        }

        // --- RENDER TAMPILAN BERDASARKAN MODE MANUAL ---
        
        if (this.compData.scaleMode === 2) {
            // Mode Manual: mikroAmpere (µA)
            if (text) text.textContent = (iVal * 1000000).toFixed(2)
            if (rangeTxt) { 
                rangeTxt.textContent = 'µA'; 
                rangeTxt.setAttribute('fill', '#38bdf8'); 
            }
        } else if (this.compData.scaleMode === 1) {
            // Mode Manual: miliAmpere (mA)
            if (text) text.textContent = (iVal * 1000).toFixed(2)
            if (rangeTxt) { 
                rangeTxt.textContent = 'mA'; 
                rangeTxt.setAttribute('fill', '#eab308'); // Kuning
            }
        } else {
            // Mode Manual: Ampere (A) standar
            if (text) text.textContent = iVal.toFixed(2)
            if (rangeTxt) { 
                rangeTxt.textContent = 'A'; 
                rangeTxt.setAttribute('fill', '#ffffff'); // Putih
            }
        }
    }
}
UIRegistry['ammeter'] = AmmeterUI;

export class OhmmeterUI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; }
    getSVG() {
        return `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="40" r="24" fill="#1e293b" stroke="#1e293b" stroke-width="2"/>
          <text class="anim-text meter-val" x="40" y="41" text-anchor="middle" font-size="14" font-family="monospace" font-weight="bold" fill="#facc15">OL</text>
          
          <!-- TAMBAHAN BARU: Tombol Kotak Rentang (Range Button) -->
          <rect class="control-btn range-btn" x="30" y="47" width="20" height="11" rx="2" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
          <text class="range-txt" x="40" y="55" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">Ω</text>
          
          <text x="1" y="30" class="comp-label" fill="red" font-size="14" font-weight="bold">+</text>
          <text x="70" y="30" class="comp-label" fill="black" font-size="14" font-weight="bold">-</text>
        </svg>`;
    }
    
    updateState(isSimActive) {
        this.setPinActive('pin-in-0', false); 
        this.setPinActive('pin-in-1', false);
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');

        // --- LOGIKA TOMBOL MANUAL 3 PUTARAN (Ω -> kΩ -> MΩ) ---
        if (this.compData.scaleMode === undefined) {
            this.compData.scaleMode = 0; // 0 = Ω, 1 = kΩ, 2 = MΩ
            this.compData.lastIsMilli = this.compData.isMilli;
        }
        // Deteksi jika pengguna mengklik tombol di kanvas
        if (this.compData.isMilli !== this.compData.lastIsMilli) {
            this.compData.lastIsMilli = this.compData.isMilli; 
            this.compData.scaleMode = (this.compData.scaleMode + 1) % 3; 
        }

        if (text) {
            if (this.compData.isError) {
                text.textContent = 'ERR'; text.setAttribute('fill', '#ef4444');
                if (rangeTxt) { rangeTxt.textContent = 'ERR'; rangeTxt.setAttribute('fill', '#ef4444'); }
            } else if (this.compData.isOL) {
                text.textContent = 'OL'; text.setAttribute('fill', '#facc15');
                // Tampilkan satuan yang sedang aktif meskipun sedang Over Load (OL)
                if (rangeTxt) {
                    if (this.compData.scaleMode === 2) { rangeTxt.textContent = 'MΩ'; rangeTxt.setAttribute('fill', '#38bdf8'); }
                    else if (this.compData.scaleMode === 1) { rangeTxt.textContent = 'kΩ'; rangeTxt.setAttribute('fill', '#eab308'); }
                    else { rangeTxt.textContent = 'Ω'; rangeTxt.setAttribute('fill', '#ffffff'); }
                }
            } else {
                let r = this.compData.simR || 0;
                text.setAttribute('fill', '#4ade80'); // Warna angka hijau saat membaca sukses
                
                // --- RENDER TAMPILAN BERDASARKAN MODE MANUAL ---
                if (this.compData.scaleMode === 2) {
                    // Mode Manual: MegaOhm (MΩ)
                    text.textContent = (r / 1000000).toFixed(2);
                    if (rangeTxt) { rangeTxt.textContent = 'MΩ'; rangeTxt.setAttribute('fill', '#38bdf8'); } // Biru muda
                } else if (this.compData.scaleMode === 1) {
                    // Mode Manual: kiloOhm (kΩ)
                    text.textContent = (r / 1000).toFixed(2);
                    if (rangeTxt) { rangeTxt.textContent = 'kΩ'; rangeTxt.setAttribute('fill', '#eab308'); } // Kuning
                } else {
                    // Mode Manual: Ohm (Ω) standar
                    text.textContent = r.toFixed(2);
                    if (rangeTxt) { rangeTxt.textContent = 'Ω'; rangeTxt.setAttribute('fill', '#ffffff'); } // Putih
                }
            }
        }
    }
}
UIRegistry['ohmmeter'] = OhmmeterUI;