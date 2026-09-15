// File: src/components/passive/ResistorUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class ResistorUI extends BaseUIComponent {
    static getDimensions() { return [80, 60]; }
    getSVG() {
        return `<svg width="80" height="60" viewBox="0 0 80 60">
            <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
            <path d="M 20 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10" fill="none" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
            <text class="anim-text comp-label resistor-val val-trigger" x="20" y="45" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text>
        </svg>`;
    }
    updateState(_isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            const rv = this.compData.customValue ?? 330; 
            txtVal.textContent = rv >= 1000000 ? `${(rv/1e6).toFixed(1)}M` : rv >= 1000 ? `${(rv/1000).toFixed(1)}k` : `${rv}Ω`;
        }
    }
}
UIRegistry['resistor'] = ResistorUI;