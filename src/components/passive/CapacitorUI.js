// File: src/components/passive/CapacitorUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class CapacitorUI extends BaseUIComponent {
    static getDimensions() { return [80, 50]; }
    getSVG() {
        return `<svg width="80" height="50" viewBox="0 0 80 50">
            <line class="pin-in-0" x1="0" y1="20" x2="35" y2="20" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-0" x1="80" y1="20" x2="45" y2="20" stroke="#006600" stroke-width="3"/>
            <line x1="35" y1="10" x2="35" y2="35" stroke="#1e293b" stroke-width="3"/>
            <line x1="45" y1="10" x2="45" y2="35" stroke="#1e293b" stroke-width="3"/>
            <text x="40" y="8" class="comp-label" text-anchor="middle">C${this.id}</text>
            <text class="anim-text comp-label resistor-val val-trigger" x="40" y="48" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text>
        </svg>`;
    }
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            const cv = this.compData.customValue ?? 10; 
            txtVal.textContent = cv >= 1000 ? `${(cv/1000).toFixed(1)}mF` : `${cv}µF`;
        }
    }
}
UIRegistry['capacitor'] = CapacitorUI;