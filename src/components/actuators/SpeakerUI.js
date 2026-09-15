// File: src/components/actuators/SpeakerUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class SpeakerUI extends BaseUIComponent {
    static getDimensions() { return [70, 60]; }
    
    getSVG() {
        return `<svg width="70" height="60" viewBox="0 0 70 60" style="overflow: visible;">
          <!-- Pin Input & Output (2 Pin) -->
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
          
          <!-- Bodi Magnet (Kotak) & Kerucut Speaker (Segitiga) -->
          <rect x="20" y="15" width="10" height="30" fill="#334155" rx="2" stroke="#1e293b" stroke-width="1.5"/>
          <polygon points="30,20 50,5 50,55 30,40" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linejoin="round"/>
          <line x1="33" y1="22" x2="33" y2="38" stroke="#475569" stroke-width="1.5"/>
          
          <!-- Animasi Gelombang Suara (Sembunyi secara default) -->
          <path class="anim-wave wave-1" d="M 56 22 Q 62 30 56 38" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 4" opacity="0" style="transition: opacity 0.1s ease;"/>
          <path class="anim-wave wave-2" d="M 62 14 Q 72 30 62 46" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 4" opacity="0" style="transition: opacity 0.1s ease;"/>
          
          <!-- Label Pin -->
          <text x="3" y="15" class="comp-label" font-size="8" font-weight="bold" fill="#ef4444">IN+</text>
          <text x="3" y="52" class="comp-label" font-size="8" font-weight="bold" fill="#1e293b">IN-</text>
        </svg>`;
    }

    updateState(isSimActive) {
        // Logika nyala/mati kabel saat dialiri arus
        const vState0 = this.compData.simV > 0;
        const vState1 = this.compData.simV < 0;
        this.setPinActive('pin-in-0', vState0);
        this.setPinActive('pin-in-1', vState1);
        
        // Menarik elemen gelombang suara
        const wave1 = this.contentDiv.querySelector('.wave-1');
        const wave2 = this.contentDiv.querySelector('.wave-2');
        
        // Membaca frekuensi & amplitudo dari SpeakerModel.js
        const freq = this.compData.freq || 0;
        const amp = this.compData.amplitude || 0;

        if (isSimActive && freq > 10 && amp > 0.5) {
            // Jika ada suara valid, tampilkan gelombang dan buat efek getar/goyang (shake)
            if (wave1) {
                wave1.setAttribute('opacity', '0.7');
                wave1.style.transform = `translateX(${Math.random() * 2 - 1}px)`;
            }
            if (wave2) {
                wave2.setAttribute('opacity', '1');
                wave2.style.transform = `translateX(${Math.random() * 3 - 1.5}px)`;
            }
        } else {
            // Mute / Diam (Sembunyikan gelombang)
            if (wave1) {
                wave1.setAttribute('opacity', '0');
                wave1.style.transform = 'none';
            }
            if (wave2) {
                wave2.setAttribute('opacity', '0');
                wave2.style.transform = 'none';
            }
        }
    }
}

// Daftarkan komponen UI ini ke sistem
UIRegistry['speaker'] = SpeakerUI;