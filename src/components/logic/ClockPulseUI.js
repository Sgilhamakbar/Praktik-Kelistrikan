// File: src/components/logic/ClockPulseUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class ClockPulseUI extends BaseUIComponent {
    static getDimensions() { return [60, 40]; }
    getSVG() {
        return `<svg width="60" height="40" viewBox="0 0 60 40">
          <rect class="anim-body" x="5" y="5" width="40" height="30" rx="4" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
          <path d="M 10 15 L 15 15 L 15 8 L 25 8 L 25 22 L 35 22 L 35 15 L 40 15" fill="none" stroke="#22c55e" stroke-width="2"/>
          <line class="pin-out-0" x1="45" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
          <circle class="anim-indicator" cx="10" cy="10" r="3" fill="#ef4444"/>
          <text class="anim-text val-trigger" x="25" y="32" font-size="9" fill="#38bdf8" font-weight="bold" text-anchor="middle" style="cursor:pointer; pointer-events:auto;">2Hz</text>
        </svg>`;
    }
    updateState(isSimActive) {
        const isHigh = this.compData.state === '1';
        this.setPinActive('pin-out-0', isHigh && isSimActive);
        const ind = this.contentDiv.querySelector('.anim-indicator');
        if (ind) ind.setAttribute('fill', isSimActive ? (isHigh ? '#22c55e' : '#ef4444') : '#475569');
        const txt = this.contentDiv.querySelector('.anim-text');
        if (txt) txt.textContent = (this.compData.freqValue || 2) + 'Hz';
    }
}

UIRegistry['clock_pulse'] = ClockPulseUI;