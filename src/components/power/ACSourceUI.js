// File: src/components/power/ACSourceUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class VSineUI extends BaseUIComponent {
    static getDimensions() { return [130, 90]; }
    getSVG() {
        return `<svg width="130" height="90" viewBox="0 0 130 90">
          <line class="pin-out-0" x1="0"   y1="35" x2="41"  y2="35" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="89"  y1="35" x2="130" y2="35" stroke="#006600" stroke-width="3"/>
          <circle class="anim-body" cx="65" cy="35" r="24" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <path class="sine-icon" d="M 53 35 Q 59 23 65 35 T 77 35" fill="none" stroke="#1e293b" stroke-width="2"/>
          <text class="anim-text amp-val val-trigger" x="35" y="75" text-anchor="middle" font-size="11" fill="#4f46e5" font-weight="bold" style="cursor:pointer; pointer-events:auto;" title="Klik untuk atur V-Sine"></text>          
          <text class="anim-text freq-val val-trigger" x="95" y="75" text-anchor="middle" font-size="11" fill="#4f46e5" font-weight="bold" style="cursor:pointer; pointer-events:auto;" title="Klik untuk atur V-Sine"></text>
        </svg>`;
    }
    updateState(isSimActive) {
        const isActive = !!isSimActive && (this.compData.simV > 0.1 || Math.abs(this.compData.customValue || 12) > 0);
        
        // 🟢 PERBAIKAN BUG 1: Aktifkan kedua pin AC secara simetris
        this.setPinActive('pin-out-0', isActive);
        this.setPinActive('pin-out-1', isActive);

        const bodyCircle = this.contentDiv.querySelector('.anim-body');
        const sineIcon = this.contentDiv.querySelector('.sine-icon');

        if (bodyCircle) {
            bodyCircle.setAttribute('stroke', isActive ? '#2563eb' : '#1e293b');
            bodyCircle.setAttribute('fill', isActive ? '#f0f9ff' : '#e8e6d3');
        }

        // 🟢 PERBAIKAN BUG 5: Animasi dinamis gelombang sinus pada badan generator
        if (sineIcon) {
            if (isActive) {
                sineIcon.setAttribute('stroke', '#2563eb');
                sineIcon.setAttribute('stroke-width', '2.5');

                const amp = (this.compData.customValue != null && !isNaN(this.compData.customValue)) ? parseFloat(this.compData.customValue) : 12;
                
                // Hitung defleksi gelombang berdasarkan tegangan instan real-time
                let normV = (this.compData.instantV !== undefined && amp > 0) ? (this.compData.instantV / amp) : 1;
                normV = Math.max(-1.2, Math.min(1.2, normV));
                
                // Titik kontrol kurva Bézier berosilasi dinamis mengikuti ayunan tegangan AC
                const cpY = 35 - (12 * normV);
                sineIcon.setAttribute('d', `M 53 35 Q 59 ${cpY.toFixed(1)} 65 35 T 77 35`);
            } else {
                sineIcon.setAttribute('stroke', '#1e293b');
                sineIcon.setAttribute('stroke-width', '2');
                sineIcon.setAttribute('d', 'M 53 35 Q 59 23 65 35 T 77 35');
            }
        }

        const ampTxt = this.contentDiv.querySelector('.amp-val');        
        if (ampTxt) {
            const amp = (this.compData.customValue != null && !isNaN(this.compData.customValue)) ? this.compData.customValue : 12;
            ampTxt.textContent = `${amp}Vp`;
        }

        const freqTxt = this.contentDiv.querySelector('.freq-val');
        if (freqTxt) {
            const freq = (this.compData.freqValue != null && !isNaN(this.compData.freqValue)) ? this.compData.freqValue : 1;
            freqTxt.textContent = `${freq}Hz`;
        }
    }
}
UIRegistry['vsine'] = VSineUI;