// File: src/components/passive/VoltageDividerUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class VoltageDividerUI extends BaseUIComponent {
    static getDimensions() { return [80, 70]; }
    getSVG() {
        return `<svg width="80" height="70" viewBox="0 0 80 70">
          <rect x="5" y="5" width="70" height="60" rx="4" fill="var(--bg-container)" stroke="#1e293b" stroke-width="2"/>
          <line class="pin-in-0" x1="0" y1="35" x2="5" y2="35" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="75" y1="35" x2="80" y2="35" stroke="#006600" stroke-width="2"/>
          
          <text x="40" y="18" class="anim-text comp-label resistor-val val-trigger r1-label" data-sub="r1" font-size="9" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">R1: 10kΩ</text>
          <text x="40" y="29" class="v1-label" font-size="9" font-weight="bold" text-anchor="middle" fill="#f87171">V1: 0.00V</text>
          
          <text x="40" y="45" class="anim-text comp-label resistor-val val-trigger r2-label" data-sub="r2" font-size="9" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">R2: 10kΩ</text>
          <text x="40" y="56" class="v2-label" font-size="9" font-weight="bold" text-anchor="middle" fill="#22c55e">V2: 0.00V</text>
        </svg>`;
    }
    updateState(isSimActive) {
        let v1 = this.compData.v1 || 0; 
        let v2 = this.compData.v2 || 0; 
        
        this.setPinActive('pin-in-0', v1 > 0 || v2 > 0);
        this.setPinActive('pin-out-0', v2 > 0);
        
        const r1Txt = this.contentDiv.querySelector('.r1-label');
        const r2Txt = this.contentDiv.querySelector('.r2-label');
        const v1Txt = this.contentDiv.querySelector('.v1-label');
        const v2Txt = this.contentDiv.querySelector('.v2-label');
        
        let formatR = (val) => val >= 1000000 ? (val/1000000) + 'M' : (val >= 1000 ? (val/1000) + 'k' : val);
        
        if (r1Txt) r1Txt.textContent = `R1: ${formatR(this.compData.r1Value || 10000)}Ω`;
        if (r2Txt) r2Txt.textContent = `R2: ${formatR(this.compData.r2Value || 10000)}Ω`;
        if (v1Txt) v1Txt.textContent = `V1: ${v1.toFixed(2)}V`;
        if (v2Txt) v2Txt.textContent = `V2: ${v2.toFixed(2)}V`;
    }
}
UIRegistry['voltage_divider'] = VoltageDividerUI;