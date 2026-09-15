// File: src/components/meters/LogicProbeUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class LogicProbeUI extends BaseUIComponent {
    static getDimensions() { return [60, 40]; }
    getSVG() {
        return `<svg width="60" height="40" viewBox="0 0 60 40">
          <line class="pin-in-0" x1="0" y1="20" x2="15" y2="20" stroke="#006600" stroke-width="3"/>
          <polygon points="15,15 25,20 15,25" fill="#1e293b"/>
          <rect class="anim-body" x="25" y="5" width="30" height="30" rx="4" fill="#1e293b" stroke="#1e293b" stroke-width="2"/>
          <text class="anim-text" x="40" y="26" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="20" fill="#94a3b8">Z</text>
        </svg>`;
    }
    updateState(isSimActive) {
        this.setPinActive('pin-in-0', this.compData.simV > 0);
        const body = this.contentDiv.querySelector('.anim-body');
        const text = this.contentDiv.querySelector('.anim-text');
        const state = this.compData.logicState || 'Z'; 
        
        if (text) {
            text.textContent = state;
            if (state === '1') text.setAttribute('fill', '#4ade80');
            else if (state === '0') text.setAttribute('fill', '#f87171');
            else if (state === 'E') text.setAttribute('fill', '#fbbf24');
            else text.setAttribute('fill', '#94a3b8');
        }
        if (body) {
            if (state === '1') body.setAttribute('stroke', '#4ade80');
            else if (state === '0') body.setAttribute('stroke', '#f87171');
            else body.setAttribute('stroke', '#475569');
        }
    }
}
UIRegistry['logic_probe'] = LogicProbeUI;