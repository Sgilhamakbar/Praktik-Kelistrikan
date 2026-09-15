// File: src/components/power/TransformerUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

// 1. Kelas untuk Trafo CT (3 Output Sekunder)
export class TransformerUI extends BaseUIComponent {
    static getDimensions() { return [100, 100]; }
    getSVG() {
        return `<svg width="100" height="100" viewBox="0 0 100 100">
            <!-- Inti Besi -->
            <line x1="46" y1="15" x2="46" y2="85" stroke="#1e293b" stroke-width="3"/>
            <line x1="54" y1="15" x2="54" y2="85" stroke="#1e293b" stroke-width="3"/>
            
            <!-- Pin Primer -->
            <line x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="2" class="pin-in-0"/>
            <line x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="2" class="pin-in-1"/>
            <path class="anim-coil-p" d="M 30 30 C 45 30 45 40 30 40 C 45 40 45 50 30 50 C 45 50 45 60 30 60 C 45 60 45 70 30 70" fill="none" stroke="#1e293b" stroke-width="3"/>
            
            <!-- Pin Sekunder -->
            <line x1="70" y1="20" x2="100" y2="20" stroke="#006600" stroke-width="2" class="pin-out-0"/>
            <line x1="70" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="2" class="pin-out-1"/>
            <line x1="70" y1="80" x2="100" y2="80" stroke="#006600" stroke-width="2" class="pin-out-2"/>
            <path class="anim-coil-s" d="M 70 20 C 55 20 55 35 70 35 C 55 35 55 50 70 50 C 55 50 55 65 70 65 C 55 65 55 80 70 80" fill="none" stroke="#1e293b" stroke-width="3"/>
            
            <!-- 🟢 LABEL TEKS DINAMIS -->
            <text class="label-pri" x="15" y="20" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">220V</text>
            <text class="label-sec" x="85" y="10" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">24V</text>
            <text x="85" y="45" font-size="8" font-weight="bold" fill="#ef4444" text-anchor="middle">CT</text>
        </svg>`;
    }
    updateState() {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); this.setPinActive('pin-in-1', vState); 
        this.setPinActive('pin-out-0', vState); this.setPinActive('pin-out-1', vState); this.setPinActive('pin-out-2', vState);
        
        const coilP = this.contentDiv.querySelector('.anim-coil-p');
        if (coilP) coilP.setAttribute('stroke', vState ? '#eab308' : '#1e293b');

        // 🟢 BACA MEMORI UNTUK MENGUBAH TEKS DI KANVAS
        const lblPri = this.contentDiv.querySelector('.label-pri');
        const lblSec = this.contentDiv.querySelector('.label-sec');
        if (lblPri) lblPri.textContent = (this.compData.priV !== undefined ? this.compData.priV : 220) + 'V';
        if (lblSec) lblSec.textContent = (this.compData.secV !== undefined ? this.compData.secV : 24) + 'V';
    }
}
UIRegistry['transformer'] = TransformerUI;

// 2. Kelas untuk Trafo Engkel / Non-CT (2 Output Sekunder)
export class Transformer2P2SUI extends BaseUIComponent {
    static getDimensions() { return [100, 100]; }
    getSVG() {
        return `<svg width="100" height="100" viewBox="0 0 100 100">
          <line x1="46" y1="15" x2="46" y2="85" stroke="#1e293b" stroke-width="3"/>
          <line x1="54" y1="15" x2="54" y2="85" stroke="#1e293b" stroke-width="3"/>
          
          <line x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="2" class="pin-in-0"/>
          <line x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="2" class="pin-in-1"/>
          <path class="anim-coil-p" d="M 30 30 C 45 30 45 40 30 40 C 45 40 45 50 30 50 C 45 50 45 60 30 60 C 45 60 45 70 30 70" fill="none" stroke="#1e293b" stroke-width="3"/>
          
          <line x1="70" y1="30" x2="100" y2="30" stroke="#006600" stroke-width="2" class="pin-out-0"/>
          <line x1="70" y1="70" x2="100" y2="70" stroke="#006600" stroke-width="2" class="pin-out-1"/>
          <path class="anim-coil-s" d="M 70 30 C 55 30 55 40 70 40 C 55 40 55 50 70 50 C 55 50 55 60 70 60 C 55 60 55 70 70 70" fill="none" stroke="#1e293b" stroke-width="3"/>
          
          <!-- 🟢 LABEL TEKS DINAMIS -->
          <text class="label-pri" x="15" y="20" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">220V</text>
          <text class="label-sec" x="85" y="20" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">24V</text>
        </svg>`;
    }
    updateState() {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); this.setPinActive('pin-in-1', vState); 
        this.setPinActive('pin-out-0', vState); this.setPinActive('pin-out-1', vState);
        
        const coilP = this.contentDiv.querySelector('.anim-coil-p');
        if (coilP) coilP.setAttribute('stroke', vState ? '#eab308' : '#1e293b');

        // 🟢 BACA MEMORI UNTUK MENGUBAH TEKS DI KANVAS
        const lblPri = this.contentDiv.querySelector('.label-pri');
        const lblSec = this.contentDiv.querySelector('.label-sec');
        if (lblPri) lblPri.textContent = (this.compData.priV !== undefined ? this.compData.priV : 220) + 'V';
        if (lblSec) lblSec.textContent = (this.compData.secV !== undefined ? this.compData.secV : 24) + 'V';
    }
}
UIRegistry['transformer_2p2s'] = Transformer2P2SUI;