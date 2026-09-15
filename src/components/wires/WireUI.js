// File: src/components/wires/WireUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class Wire1To1 extends BaseUIComponent {
    static getDimensions() { return [60, 40]; }
    getSVG() {
        return `<svg width="60" height="40" viewBox="0 0 60 40">
          <line class="pin-in-0" x1="0" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="4"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        this.setPinActive('pin-in-0', this.compData.simV > 0);
    }
}
UIRegistry['wire_1to1'] = Wire1To1;

// --- KABEL CABANG (1 TO 2) ---
export class Wire1To2 extends BaseUIComponent {
    static getDimensions() { return [60, 60]; }
    getSVG() {
        return `<svg width="60" height="60" viewBox="0 0 60 60">
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-0" x1="30" y1="15" x2="30" y2="45" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-1" x1="30" y1="15" x2="60" y2="15" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-2" x1="30" y1="45" x2="60" y2="45" stroke="#006600" stroke-width="4"/>
          <circle cx="30" cy="30" r="4" fill="#000000"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState); 
        this.setPinActive('pin-out-1', vState); 
        this.setPinActive('pin-out-2', vState);
    }
}
UIRegistry['wire_1to2'] = Wire1To2;

// --- JUNCTION (NODE CABANG) ---
export class Junction extends BaseUIComponent {
    static getDimensions() { return [60, 60]; }
    getSVG() {
        return `<svg width="60" height="60" viewBox="0 0 60 60">
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-0" x1="30" y1="30" x2="60" y2="10" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-1" x1="30" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-2" x1="30" y1="30" x2="60" y2="50" stroke="#006600" stroke-width="4"/>
          <circle cx="30" cy="30" r="4" fill="#000000"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState); 
        this.setPinActive('pin-out-1', vState); 
        this.setPinActive('pin-out-2', vState);
    }
}
UIRegistry['junction'] = Junction;

// --- TITIK SOLDER (WIRE NODE) ---
export class WireNode extends BaseUIComponent {
    static getDimensions() { return [20, 20]; }
    getSVG() {
        return `<svg width="20" height="20" viewBox="0 0 20 20" style="display:block; position:absolute; top:0; left:0;">
          <circle class="anim-body" cx="10" cy="10" r="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        const dot = this.contentDiv.querySelector('.anim-body');
        if (dot) dot.setAttribute('fill', this.compData.simV > 0 ? '#22c55e' : '#1e293b');
    }
}
UIRegistry['wire_node'] = WireNode;