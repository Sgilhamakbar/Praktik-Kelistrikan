// File: src/components/actuators/ServoUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class ServoUI extends BaseUIComponent {
    static getDimensions() { return [100, 80]; }
    getSVG() {
        return `<svg width="100" height="80" viewBox="0 0 100 80">
          <line class="pin-in-0" x1="0" y1="20" x2="15" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="15" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="60" x2="15" y2="60" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="15" y="10" width="45" height="60" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <text x="18" y="24" class="comp-label" font-size="9">SIG</text>
          <text x="18" y="44" class="comp-label" font-size="9" fill="red">VCC</text>
          <text x="18" y="64" class="comp-label" font-size="9">GND</text>
          <circle cx="60" cy="40" r="12" fill="#fff" stroke="#1e293b" stroke-width="3"/>
          <g class="anim-horn" style="transform-origin: 60px 40px;">
              <line x1="60" y1="40" x2="60" y2="15" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
          </g>
          <text class="anim-text comp-label" x="38" y="78" text-anchor="middle" font-weight="bold" fill="#d97706">0°</text>
        </svg>`;
    }
    updateState(isSimActive) {
        let isPowered = this.compData.isPowered || false;
        let angle = this.compData.servoAngle || 0;

        this.setPinActive('pin-in-0', angle > 0); 
        this.setPinActive('pin-in-1', isPowered); 
        this.setPinActive('pin-in-2', isPowered);
        
        const horn = this.contentDiv.querySelector('.anim-horn');
        if (horn) horn.style.transform = `rotate(${angle}deg)`;
        
        const text = this.contentDiv.querySelector('.anim-text');
        if (text) text.textContent = Math.round(angle) + '°' + (isPowered ? '' : ' (OFF)');
    }
}
UIRegistry['servo'] = ServoUI;