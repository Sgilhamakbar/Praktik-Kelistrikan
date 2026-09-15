// File: src/components/actuators/SolenoidUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class SolenoidUI extends BaseUIComponent {
    static getDimensions() { return [80, 60]; }
    getSVG() {
        return `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="65" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="15" y="15" width="40" height="30" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <path d="M 20 15 v 30 M 25 15 v 30 M 30 15 v 30 M 35 15 v 30 M 40 15 v 30" stroke="#1e293b" stroke-width="1"/>
          <rect class="anim-plunger" x="55" y="25" width="20" height="10" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
          <text x="35" y="55" class="comp-label" text-anchor="middle">VALVE</text>
        </svg>`;
    }
    updateState(isSimActive) {
        const vState = (this.compData.simV || 0) > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        
        const plunger = this.contentDiv.querySelector('.anim-plunger');
        if (plunger) {
            let currentPos = this.compData.plungerPos || 0; 
            plunger.style.transform = `translateX(-${currentPos}px)`;
            const isFullyRetracted = (this.compData.strokePercent || 0) > 95;
            plunger.setAttribute('fill', isFullyRetracted ? '#ef4444' : '#64748b');
        }
    }
}
UIRegistry['solenoid'] = SolenoidUI;