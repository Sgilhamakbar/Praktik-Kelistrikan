// File: src/components/indicators/SevenSegmentUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class SevenSegmentUI extends BaseUIComponent {
    static getDimensions() { return [160, 160]; }

    getSVG() {
        return `<svg width="160" height="160" viewBox="0 0 160 160">
          <rect class="anim-body" x="20" y="5" width="110" height="150" rx="4" fill="#18181b" stroke="#1e293b" stroke-width="2"/>
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-3" x1="0" y1="80" x2="20" y2="80" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-4" x1="0" y1="100" x2="20" y2="100" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-5" x1="0" y1="120" x2="20" y2="120" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-6" x1="0" y1="140" x2="20" y2="140" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="130" y1="140" x2="150" y2="140" stroke="#006600" stroke-width="3"/>
          
          <!-- Label Pin Input -->
          <text x="28" y="24" font-size="10" font-weight="bold" fill="#94a3b8">a</text><text x="28" y="44" font-size="10" font-weight="bold" fill="#94a3b8">b</text>
          <text x="28" y="64" font-size="10" font-weight="bold" fill="#94a3b8">c</text><text x="28" y="84" font-size="10" font-weight="bold" fill="#94a3b8">d</text>
          <text x="28" y="104" font-size="10" font-weight="bold" fill="#94a3b8">e</text><text x="28" y="124" font-size="10" font-weight="bold" fill="#94a3b8">f</text>
          <text x="28" y="144" font-size="10" font-weight="bold" fill="#94a3b8">g</text><text x="125" y="144" font-size="9" font-weight="bold" fill="#ef4444" text-anchor="end">COM</text>
          
          <g transform="translate(45, 26) scale(1.2)">
            <!-- Segmen Poligon -->
            <polygon class="seg-a" points="12,0 38,0 43,5 38,10 12,10 7,5" fill="#334155"/>
            <polygon class="seg-b" points="45,7 50,12 50,38 45,43 40,38 40,12" fill="#334155"/>
            <polygon class="seg-c" points="45,47 50,52 50,78 45,83 40,78 40,52" fill="#334155"/>
            <polygon class="seg-d" points="12,80 38,80 43,85 38,90 12,90 7,85" fill="#334155"/>
            <polygon class="seg-e" points="5,47 10,52 10,78 5,83 0,78 0,52" fill="#334155"/>
            <polygon class="seg-f" points="5,7 10,12 10,38 5,43 0,38 0,12" fill="#334155"/>
            <polygon class="seg-g" points="12,40 38,40 43,45 38,50 12,50 7,45" fill="#334155"/>
            <circle class="seg-dp" cx="58" cy="85" r="4.5" fill="#334155"/>

            <!-- Label Huruf di atas Setiap Segmen -->
            <g font-size="7" font-weight="bold" font-family="sans-serif" fill="#0f172a" text-anchor="middle" dominant-baseline="central" style="pointer-events: none; user-select: none;">
              <text x="25" y="5">a</text>
              <text x="45" y="25">b</text>
              <text x="45" y="65">c</text>
              <text x="25" y="85">d</text>
              <text x="5" y="65">e</text>
              <text x="5" y="25">f</text>
              <text x="25" y="45">g</text>
            </g>
          </g>
        </svg>`;
    }

    updateState() {
        const currents = this.compData.simI_segs || [0,0,0,0,0,0,0];
        const segClasses = ['.seg-a', '.seg-b', '.seg-c', '.seg-d', '.seg-e', '.seg-f', '.seg-g'];
        for (let i = 0; i < 7; i++) {
            this.setPinActive(`pin-in-${i}`, (this.compData.vd && this.compData.vd[i] > 1.5));
            let current = Math.abs(currents[i]);
            let intensity = Math.min(1, current / 0.02);
            const isOn = intensity > 0.005;
            let r = Math.round(51 + (intensity * 188)), g = Math.round(65 + (intensity * 3)), b = Math.round(85 - (intensity * 17));
            let isBlown = current > 0.06;
            if (isBlown) { r = 255; g = 255; b = 255; }
            
            const segEl = this.contentDiv.querySelector(segClasses[i]);
            if (segEl) {
                segEl.setAttribute('fill', isOn ? `rgb(${r}, ${g}, ${b})` : '#334155');
                if (isOn && !isBlown) segEl.style.filter = `drop-shadow(0 0 ${1 + intensity * 4}px rgba(239, 68, 68, ${0.2 + intensity * 0.6}))`;
                else if (isBlown) segEl.style.filter = `drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))`;
                else segEl.style.filter = 'none';
            }
        }
        this.setPinActive('pin-out-0', currents.some(c => Math.abs(c) > 1e-6));
    }
}
UIRegistry['seven_segment'] = SevenSegmentUI;