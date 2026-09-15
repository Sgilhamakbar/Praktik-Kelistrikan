// File: src/components/switches/SwitchesUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

// 3. Saklar SPDT (Single Pole Double Throw)
export class SwitchSPDTUI extends BaseUIComponent {
    static getDimensions() { return [80, 60]; }
    getSVG() {
        return `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="20" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="15" x2="80" y2="15" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="60" y1="45" x2="80" y2="45" stroke="#006600" stroke-width="3"/>
          <circle cx="20" cy="30" r="4" fill="#1e293b" stroke="#1e293b" stroke-width="2"/>
          <circle cx="60" cy="15" r="4" fill="#1e293b" stroke="#1e293b" stroke-width="2"/>
          <circle cx="60" cy="45" r="4" fill="#1e293b" stroke="#1e293b" stroke-width="2"/>
          <line class="blade" x1="20" y1="30" x2="56" y2="15" stroke="#ef4444" stroke-width="4" stroke-linecap="round" style="transition: all 0.15s ease-in-out;"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        const blade = this.contentDiv.querySelector('.blade');
        if (blade) {
            const isDown = this.compData.state === '1';
            blade.setAttribute('y2', isDown ? '45' : '15');
        }
    }
}
UIRegistry['switch_spdt'] = SwitchSPDTUI;

// 2. Saklar SPST (Single Pole Single Throw)
export class SwitchSPSTUI extends BaseUIComponent {
    static getDimensions() { return [80, 40]; }
    getSVG() {
        return `<svg width="80" height="40" viewBox="0 0 80 40">
          <line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <circle cx="25" cy="20" r="3" fill="#1e293b"/>
          <circle cx="55" cy="20" r="3" fill="#1e293b"/>
          <line class="anim-line" x1="25" y1="20" x2="50" y2="10" stroke="black" stroke-width="3"/>
          <rect class="anim-body" x="30" y="30" width="20" height="8" rx="2" fill="#e2e8f0" stroke="black" stroke-width="1"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        const isClosed = this.compData.state === '1'; 
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', isClosed && vState);
        
        const line = this.contentDiv.querySelector('.anim-line'); 
        const body = this.contentDiv.querySelector('.anim-body');
        if (line) { 
            line.setAttribute('x2', isClosed ? '55' : '50'); 
            line.setAttribute('y2', isClosed ? '20' : '10'); 
        }
        if (body) body.setAttribute('fill', isClosed ? '#22c55e' : '#e2e8f0');
    }
}
UIRegistry['switch_spst'] = SwitchSPSTUI;

// 3. Switch Digital (Logika 1/0)
export class DigitalSwitchUI extends BaseUIComponent {
    static getDimensions() { return [60, 40]; }
    getSVG() {
        return `<svg width="60" height="40" viewBox="0 0 60 40">
          <polygon class="anim-body" points="5,5 35,5 45,20 35,35 5,35" fill="#2563eb" stroke="black" stroke-width="1"/>
          <text class="anim-text" x="20" y="27" fill="white" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">0</text>
          <line class="pin-out-0" x1="45" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        const isClosed = this.compData.state === '1'; 
        this.setPinActive('pin-out-0', isClosed);
        
        const body = this.contentDiv.querySelector('.anim-body'); 
        const text = this.contentDiv.querySelector('.anim-text');
        if (body) body.setAttribute('fill', isClosed ? '#dc2626' : '#2563eb');
        if (text) text.textContent = this.compData.state || '0';
    }
}
UIRegistry['switch'] = DigitalSwitchUI;

// 4. Saklar DPST (Double Pole Single Throw)
export class SwitchDPSTUI extends BaseUIComponent {
    static getDimensions() { return [90, 90]; } // Dimensi baru yang lebih lega
    
    getSVG() {
        return `<svg width="90" height="90" viewBox="0 0 90 90">
          <!-- Kutub 1 (Atas) - Digeser ke Y=30 -->
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="30" x2="90" y2="30" stroke="#006600" stroke-width="3"/>
          
          <!-- Kutub 2 (Bawah) - Digeser ke Y=60 agar jaraknya 30px dari kutub atas -->
          <line class="pin-in-1" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="60" y1="60" x2="90" y2="60" stroke="#006600" stroke-width="3"/>

          <!-- Titik Kontak Terminal -->
          <circle cx="30" cy="30" r="3" fill="#1e293b"/>
          <circle cx="60" cy="30" r="3" fill="#1e293b"/>
          <circle cx="30" cy="60" r="3" fill="#1e293b"/>
          <circle cx="60" cy="60" r="3" fill="#1e293b"/>

          <!-- Tuas Besi (Blade) dengan efek transisi agar gerakannya mulus -->
          <line class="anim-line-0" x1="30" y1="30" x2="55" y2="15" stroke="black" stroke-width="3" stroke-linecap="round" style="transition: all 0.2s ease;"/>
          <line class="anim-line-1" x1="30" y1="60" x2="55" y2="45" stroke="black" stroke-width="3" stroke-linecap="round" style="transition: all 0.2s ease;"/>
          
          <!-- Penghubung Mekanis (Garis Putus-putus) -->
          <line class="anim-link" x1="42.5" y1="22.5" x2="42.5" y2="52.5" stroke="#64748b" stroke-width="2" stroke-dasharray="3 3" style="transition: all 0.2s ease;"/>
        </svg>`;
    }
    
    updateState(_isSimActive) {
        const isClosed = this.compData.state === '1';
        
        const line0 = this.contentDiv.querySelector('.anim-line-0');
        const line1 = this.contentDiv.querySelector('.anim-line-1');
        const link = this.contentDiv.querySelector('.anim-link');

        if (line0 && line1 && link) {
            // Posisi X saat menutup adalah 60 (menyentuh terminal kanan)
            line0.setAttribute('x2', isClosed ? '60' : '55');
            line0.setAttribute('y2', isClosed ? '30' : '15');
            
            line1.setAttribute('x2', isClosed ? '60' : '55');
            line1.setAttribute('y2', isClosed ? '60' : '45');

            // Garis penghubung ikut bergeser turun dan lurus saat saklar ditutup
            link.setAttribute('x1', isClosed ? '45' : '42.5');
            link.setAttribute('y1', isClosed ? '30' : '22.5');
            link.setAttribute('x2', isClosed ? '45' : '42.5');
            link.setAttribute('y2', isClosed ? '60' : '52.5');
        }
    }
}
UIRegistry['switch_dpst'] = SwitchDPSTUI;