// File: src/components/generator/PulseGeneratorUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class PulseGeneratorUI extends BaseUIComponent {
   static getDimensions() { return [70, 60]; }
    
    getSVG() {
        return `<svg width="70" height="60" viewBox="0 0 70 60">
          <!-- Bodi Instrumen (Tinggi ditambah menjadi 50px agar proporsional) -->
          <rect x="5" y="5" width="50" height="50" rx="4" fill="#1e293b" stroke="#eab308" stroke-width="2"/>
          
          <!-- Layar Instrumen (Digeser sedikit ke bawah) -->
          <rect x="10" y="10" width="40" height="16" rx="2" fill="#0f172a" stroke="#475569" stroke-width="1"/>
          <text class="freq-text val-trigger" x="30" y="22" font-size="9" fill="#22c55e" font-family="monospace" text-anchor="middle" style="cursor:pointer; pointer-events:auto;">1.0Hz</text>
          
          <!-- Ikon Gelombang Pulsa (Digeser ke bawah dan diperlebar amplitudonya) -->
          <path d="M 10 40 L 15 40 L 15 32 L 25 32 L 25 48 L 35 48 L 35 40 L 45 40" fill="none" stroke="#eab308" stroke-width="1.5"/>
          
          <!-- Pin BNC Output (Diletakkan TEPAT di titik tengah vertikal: y=30) -->
          <line class="pin-out-0" x1="55" y1="30" x2="70" y2="30" stroke="#475569" stroke-width="3"/>
          <circle cx="55" cy="30" r="3" fill="#94a3b8"/>
          
          <!-- Indikator Nyala (Sejajar dengan garis tengah gelombang) -->
          <circle class="anim-indicator" cx="45" cy="40" r="2" fill="#ef4444"/>
        </svg>`;
    }

    updateState(isSimActive) {
        // Ambil tegangan analog dari hasil Gauss-Seidel
        const vOut = this.compData.simV || 0;
        const vPeak = this.compData.v_peak || 5.0;
        
        // Visual kabel menyala jika tegangan mendekati V_peak (misal > 50%)
        const isHigh = vOut > (vPeak * 0.5);
        this.setPinActive('pin-out-0', isHigh && isSimActive);
        
        // Indikator LED menyala kedap-kedip sesuai tegangan nyata
        const ind = this.contentDiv.querySelector('.anim-indicator');
        if (ind) ind.setAttribute('fill', isSimActive ? (isHigh ? '#22c55e' : '#ef4444') : '#475569');
        
        // Tampilkan Frekuensi atau Periode
        const txt = this.contentDiv.querySelector('.freq-text');
        if (txt) {
            const freq = this.compData.t_period ? (1.0 / this.compData.t_period) : (this.compData.freqValue || 1.0);
            // Pembulatan agar layar rapi
            txt.textContent = Number.isInteger(freq) ? `${freq}Hz` : `${freq.toFixed(1)}Hz`;
        }
    }
}

UIRegistry['pulse_generator'] = PulseGeneratorUI;