// File: src/components/indicators/LedBargraphUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class LedBargraphUI extends BaseUIComponent {
    static getDimensions() { return [120, 240]; }
    getSVG() {
        return `<svg width="120" height="240" viewBox="0 0 120 240">
          <!-- Casing Hitam (Lebar 80, Tinggi 220, persis di tengah) -->
          <rect x="20" y="10" width="80" height="220" rx="4" ry="4" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
          
          <!-- Pin 10: Common Anode (V+) persis di tengah ATAS (X=60) -->
          <line class="pin-in-10" x1="60" y1="0" x2="60" y2="10" stroke="#ef4444" stroke-width="3"/>
          <text x="60" y="20" font-size="10" fill="#ef4444" font-weight="bold" text-anchor="middle" font-family="monospace">V+</text>
          
          <!-- Pin 0-9: Katoda Individu & 10 LED Segmen yang presisi -->
          ${Array.from({length: 10}).map((_, i) => `
            <!-- Jarak antar pin 20px, dimulai dari Y=30 -->
            <line class="pin-in-${i}" x1="0" y1="${30+i*20}" x2="20" y2="${30+i*20}" stroke="#006600" stroke-width="3"/> 
            <!-- LED setinggi 16px, posisinya senter (pas di tengah) ujung kabel -->
            <rect class="led-seg-${i}" x="30" y="${22+i*20}" width="60" height="16" rx="2" fill="#334155"/>
          `).join('')}
        </svg>`;
    }
    updateState() {
        if (this.compData.simI_segs) {
            for (let i = 0; i < 10; i++) {
                const segEl = this.contentDiv.querySelector(`.led-seg-${i}`);
                if (segEl) {
                    if (this.compData.simI_segs[i] > 0.001) {
                        let color = i >= 8 ? '#ef4444' : (i >= 6 ? '#eab308' : '#22c55e');
                        segEl.setAttribute('fill', color);
                        segEl.style.filter = `drop-shadow(0 0 6px ${color})`;
                    } else {
                        segEl.setAttribute('fill', '#334155');
                        segEl.style.filter = 'none';
                    }
                }
            }
        }
    }
}
UIRegistry['led_bargraph'] = LedBargraphUI;