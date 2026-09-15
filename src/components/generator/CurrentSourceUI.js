// File: src/components/analog/CurrentSourceUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class CurrentSourceUI extends BaseUIComponent {
    static getDimensions() { return [65, 70]; }
    
    getSVG() {
        return `<svg width="65" height="70" viewBox="0 0 65 70">
          <!-- Kabel Atas & Bawah -->
          <line class="pin-out-0" x1="20" y1="5" x2="20" y2="20" stroke="#475569" stroke-width="3"/>
          <circle cx="20" cy="5" r="3" fill="#94a3b8"/> <!-- Terminal + (Output) -->
          
          <line class="pin-in-0" x1="20" y1="50" x2="20" y2="65" stroke="#475569" stroke-width="3"/>
          <circle cx="20" cy="65" r="3" fill="#94a3b8"/> <!-- Terminal - (Input) -->
          
          <!-- Simbol Sumber Arus (Lingkaran) -->
          <circle cx="20" cy="35" r="15" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          
          <!-- Panah Arah Arus (Ke atas, dari - ke +) -->
          <line x1="20" y1="43" x2="20" y2="27" stroke="#38bdf8" stroke-width="2"/>
          <polygon points="20,23 15,30 25,30" fill="#38bdf8"/>
          
          <!-- Teks Nilai Arus -->
          <text class="val-trigger amp-text" x="35" y="55" font-size="10" fill="#22c55e" font-weight="bold" text-anchor="start" style="cursor:pointer; pointer-events:auto;">20mA</text>
        </svg>`;
    }

    updateState(isSimActive) {
        // Animasi kabel hanya menyala jika arus benar-benar mengalir (simulasi jalan)
        this.setPinActive('pin-out-0', isSimActive && !this.compData.isSaturated);
        this.setPinActive('pin-in-0', isSimActive && !this.compData.isSaturated);

        const txt = this.contentDiv.querySelector('.amp-text');
        if (txt) {
            // Jika saturasi, ubah teks menjadi merah
            if (isSimActive && this.compData.isSaturated) {
                txt.textContent = 'LIMIT!';
                txt.setAttribute('fill', '#ef4444'); 
            } else {
                let arus = this.compData.customValue !== undefined ? this.compData.customValue : 0.02;
                txt.setAttribute('fill', '#22c55e');
                // Tampilkan sebagai mA atau Ampere
                if (arus < 1) {
                    txt.textContent = Math.round(arus * 1000) + 'mA';
                } else {
                    txt.textContent = arus + 'A';
                }
            }
        }
    }
}

UIRegistry['current_source'] = CurrentSourceUI;