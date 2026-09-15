// File: src/components/actuators/FlasherUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class FlasherUI extends BaseUIComponent {
    static getDimensions() { return [80, 60]; }
    getSVG() {
        return `<svg width="80" height="60" viewBox="0 0 80 60">
            <!-- Pin Input & Output -->
            <line class="pin-in-0" x1="0" y1="18" x2="25" y2="18" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-0" x1="55" y1="18" x2="80" y2="18" stroke="#006600" stroke-width="3"/>

            <!-- Bodi Komponen & Indikator -->
            <rect class="anim-body" x="25" y="6" width="30" height="24" rx="4" fill="#e2e8f0" stroke="#1e293b" stroke-width="2"/>
            <circle class="anim-indicator" cx="40" cy="18" r="4" fill="#475569"/>

            <!-- Teks Nilai Kecepatan / Frekuensi -->
            <text class="anim-text speed-val" x="40" y="38" text-anchor="middle" font-size="8" font-weight="bold" fill="#4f46e5"></text>

            <!-- Tombol Down (Kiri - Merah) -->
            <rect class="control-btn speed-btn-down btn-down" x="10" y="45" width="20" height="14" rx="3" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
            <polygon points="23,49 17,52 23,55" fill="#fff" pointer-events="none"/>

            <!-- Tombol Up (Kanan - Hijau) -->
            <rect class="control-btn speed-btn-up btn-up" x="50" y="45" width="20" height="14" rx="3" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
            <polygon points="57,49 63,52 57,55" fill="#fff" pointer-events="none"/>
        </svg>`;
    }
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        const isOn = this.compData.state === '1';
        
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', isOn && vState);
        
        const ind = this.contentDiv.querySelector('.anim-indicator');
        if (ind) ind.setAttribute('fill', (isOn && vState) ? '#facc15' : '#475569');
        
        const speedTxt = this.contentDiv.querySelector('.speed-val');
        if (speedTxt) {
            const periodMs = this.compData.customValue || 500;
            speedTxt.textContent = (1000 / periodMs / 2).toFixed(1) + 'Hz'; 
        }
    }
}
UIRegistry['flasher'] = FlasherUI;