// File: src/components/power/BatteryUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class BatteryUI extends BaseUIComponent {
    static getDimensions() { return [80, 60]; }
    getSVG() {
        if (this.compData.type === 'battery_1cell') {
            return `<svg width="80" height="60" viewBox="0 0 80 70">
            <line class="pin-out-0" x1="0" y1="23" x2="35" y2="23" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-1" x1="80" y1="23" x2="45" y2="23" stroke="#006600" stroke-width="3"/>
            <line x1="35" y1="2" x2="35" y2="45" stroke="#1e293b" stroke-width="3"/>
            <line x1="45" y1="10" x2="45" y2="35" stroke="#1e293b" stroke-width="5"/>
            <text x="20" y="15" class="comp-label" fill="red" font-weight="bold" font-size="14">+</text>
            <text x="60" y="15" class="comp-label" fill="black" font-weight="bold" font-size="14">-</text>
            <text x="45" y="60" class="anim-text comp-label resistor-val val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">1.5V</text>
            </svg>`;
        } else if (this.compData.type === 'battery_multi') {
            return `<svg width="80" height="60" viewBox="0 0 80 70">
            <line class="pin-out-0" x1="0" y1="23" x2="25" y2="23" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-1" x1="80" y1="23" x2="55" y2="23" stroke="#006600" stroke-width="3"/>
            <line x1="25" y1="3" x2="25" y2="43" stroke="#1e293b" stroke-width="3"/>
            <line x1="33" y1="15" x2="33" y2="35" stroke="#1e293b" stroke-width="4"/>
            <line x1="36" y1="30" x2="44" y2="30" stroke="#1e293b" stroke-width="2" stroke-dasharray="2 2"/>
            <line x1="47" y1="3" x2="47" y2="43" stroke="#1e293b" stroke-width="3"/>
            <line x1="55" y1="15" x2="55" y2="35" stroke="#1e293b" stroke-width="4"/>
            <text x="10" y="15" class="comp-label" fill="red" font-weight="bold" font-size="14">+</text>
            <text x="60" y="15" class="comp-label" fill="black" font-weight="bold" font-size="14">-</text>
            <text x="40" y="60" class="anim-text comp-label resistor-val val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">12V</text>
            </svg>`;
        }
        return `<svg width="80" height="60" viewBox="0 0 80 70"><rect x="25" y="15" width="30" height="30" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/><line class="pin-out-0" x1="80" y1="20" x2="55" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-1" x1="80" y1="40" x2="55" y2="40" stroke="#006600" stroke-width="3"/><line x1="40" y1="20" x2="40" y2="40" stroke="#1e293b" stroke-width="3"/><line x1="35" y1="25" x2="35" y2="35" stroke="#1e293b" stroke-width="4"/><text x="40" y="12" class="anim-text comp-label resistor-val val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">12V</text><text x="65" y="18" class="comp-label" fill="red">+</text><text x="65" y="38" class="comp-label" fill="black">-</text></svg>`;
    }
    updateState(isSimActive) {
        this.setPinActive('pin-out-0', this.compData.simV > 0 || isSimActive); 
        this.setPinActive('pin-out-1', false); 
        const txtValB = this.contentDiv.querySelector('.anim-text');
        if (txtValB) {
           let v = this.compData.customValue;
           if (v == null) v = this.compData.type === 'battery_1cell' ? 1.5 : 12;
           txtValB.textContent = v + 'V';
        }
    }
}
UIRegistry['battery'] = BatteryUI;
UIRegistry['battery_1cell'] = BatteryUI;
UIRegistry['battery_multi'] = BatteryUI;