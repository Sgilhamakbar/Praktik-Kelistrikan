// File: src/components/actuators/RelayUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class Relay4PinUI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; }
    getSVG() {
        return `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="25" y="10" width="30" height="20" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <line class="pin-in-1" x1="0" y1="60" x2="25" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="55" y1="60" x2="80" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="anim-line" x1="25" y1="60" x2="50" y2="50" stroke="black" stroke-width="3"/>
          <text x="12" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">85</text>
          <text x="68" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">86</text>
          <text x="12" y="56" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">30</text>
          <text x="68" y="56" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">87</text>
        </svg>`;
    }
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        const isActive = this.compData.state === '1';
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState); 
        this.setPinActive('pin-in-1', vState); 
        this.setPinActive('pin-out-1', isActive && vState);
        
        const body = this.contentDiv.querySelector('.anim-body'); 
        const path = this.contentDiv.querySelector('.anim-path'); 
        const line = this.contentDiv.querySelector('.anim-line');
        if (body) { 
            body.setAttribute('fill', isActive ? '#fef08a' : '#e8e6d3'); 
            body.setAttribute('stroke', isActive ? '#eab308' : '#1e293b'); 
        }
        if (path) path.setAttribute('stroke', isActive ? '#eab308' : '#1e293b');
        if (line) { 
            line.setAttribute('x2', isActive ? '55' : '50'); 
            line.setAttribute('y2', isActive ? '60' : '50'); 
        }
    }
}
UIRegistry['relay'] = Relay4PinUI;

export class Relay5PinUI extends BaseUIComponent {
    static getDimensions() { return [80, 100]; }
    getSVG() {
        return `<svg width="80" height="100" viewBox="0 0 80 100">
          <line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="25" y="10" width="30" height="20" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <text x="12" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">85</text>
          <text x="68" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">86</text>
          <line class="pin-in-1" x1="0" y1="70" x2="25" y2="70" stroke="#006600" stroke-width="3"/> 
          <line class="pin-out-1" x1="55" y1="50" x2="80" y2="50" stroke="#006600" stroke-width="3"/> 
          <line class="pin-out-2" x1="55" y1="90" x2="80" y2="90" stroke="#006600" stroke-width="3"/> 
          <circle cx="25" cy="70" r="3" fill="#1e293b"/>
          <circle cx="55" cy="50" r="3" fill="#1e293b"/>
          <circle cx="55" cy="90" r="3" fill="#1e293b"/>
          <line class="anim-line" x1="25" y1="70" x2="55" y2="50" stroke="black" stroke-width="3" style="transition: transform 0.1s, y2 0.1s;"/>
          <text x="12" y="66" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">30</text>
          <text x="68" y="46" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">87a</text>
          <text x="68" y="86" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">87</text>
        </svg>`;
    }
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        const isActive = this.compData.state === '1';
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState); 
        this.setPinActive('pin-in-1', vState); 
        this.setPinActive('pin-out-1', !isActive && vState); // NC (87a)
        this.setPinActive('pin-out-2', isActive && vState);  // NO (87)
        
        const body = this.contentDiv.querySelector('.anim-body'); 
        const line = this.contentDiv.querySelector('.anim-line');
        if (body) { 
          body.setAttribute('fill', isActive ? '#fef08a' : '#e8e6d3'); 
          body.setAttribute('stroke', isActive ? '#eab308' : '#1e293b'); 
        }
        if (line) { 
          line.setAttribute('y2', isActive ? '90' : '50'); 
        }
    }
}
UIRegistry['relay_5pin'] = Relay5PinUI;