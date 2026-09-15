// File: src/components/power/TerminalUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class PowerTerminalUI extends BaseUIComponent {
    static getDimensions() { return [60, 40]; }
    getSVG() {
        return `<svg width="60" height="40" viewBox="0 0 60 40"><line class="pin-out-0" x1="30" y1="40" x2="30" y2="20" stroke="#006600" stroke-width="3"/><path d="M 30 20 L 20 30 M 30 20 L 40 30 M 15 20 L 45 20" fill="none" stroke="#1e293b" stroke-width="3"/><text class="anim-text comp-label resistor-val val-trigger" x="30" y="12" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">12V</text></svg>`;
    }
    updateState(isSimActive) {
        this.setPinActive('pin-out-0', this.compData.simV > 0 || isSimActive); 
        const txtValB = this.contentDiv.querySelector('.anim-text');
        if (txtValB) txtValB.textContent = (this.compData.customValue != null ? this.compData.customValue : 12) + 'V';
    }
}
UIRegistry['power_terminal'] = PowerTerminalUI;

export class OutputTerminalUI extends BaseUIComponent {
    static getDimensions() { return [75, 40]; }
    getSVG() {
        return `<svg width="75" height="40" viewBox="0 0 75 40">
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <rect x="20" y="5" width="50" height="30" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <text class="anim-text meter-val" x="45" y="24" text-anchor="middle" font-size="12">0.0V</text>
          <text x="45" y="48" class="comp-label" text-anchor="middle" font-size="8">OUT</text>
        </svg>`;
    }
    updateState(isSimActive) {
        this.setPinActive('pin-in-0', this.compData.simV > 0);
        const text = this.contentDiv.querySelector('.anim-text');
        if (text) text.textContent = (this.compData.simV || 0).toFixed(1) + 'V';
    }
}
UIRegistry['output_terminal'] = OutputTerminalUI;

export class GroundUI extends BaseUIComponent {
    static getDimensions() { return [40, 40]; }
    getSVG() {
        return `<svg width="40" height="40" viewBox="0 0 40 40">
            <line class="pin-in-0" x1="20" y1="0" x2="20" y2="20" stroke="#000000" stroke-width="3"/>
            <line x1="8" y1="20" x2="32" y2="20" stroke="#000000" stroke-width="3"/>
            <line x1="14" y1="26" x2="26" y2="26" stroke="#000000" stroke-width="3"/>
            <line x1="18" y1="32" x2="22" y2="32" stroke="#000000" stroke-width="3"/>
        </svg>`;
    }
}
UIRegistry['ground'] = GroundUI;