// File: src/components/switches/PushButtonUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class PushButtonUI extends BaseUIComponent {
    static getDimensions() { return [70, 60]; }
    
    getSVG() {
        const isNC = this.compData.type === 'push_button_nc';
        
        if (isNC) {
            return `<svg width="70" height="60" viewBox="0 0 70 60">
              <line class="pin-in-0" x1="0" y1="30" x2="21" y2="30" stroke="#006600" stroke-width="3"/>
              <line class="pin-out-0" x1="70" y1="30" x2="49" y2="30" stroke="#006600" stroke-width="3"/>
              <circle cx="23" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
              <circle cx="47" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
              <g class="anim-plunger" style="transition: transform 0.05s;">
                 <rect x="21" y="35" width="28" height="4" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
                 <line x1="35" y1="25" x2="35" y2="35" stroke="#000000" stroke-width="3"/>
                 <rect x="29" y="24" width="12" height="3" fill="#000000"/>
              </g>
              <rect x="15" y="0" width="40" height="30" fill="transparent" style="cursor:pointer; pointer-events:auto;" />
              <g class="lock-btn control-btn lock-down-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(20, 14)">
                 <rect x="-10" y="-10" width="20" height="20" fill="transparent"/><circle cx="0" cy="0" r="5" fill="#000000" stroke="#000000" stroke-width="1"/><polygon points="-1,-2 -4,0 -1,2" fill="#000"/><polygon points="1,-2 4,0 1,2" fill="#000"/>
              </g>
              <g class="unlock-btn control-btn lock-up-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(50, 14)">
                 <rect x="-10" y="-10" width="20" height="20" fill="transparent"/><circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#000000" stroke-width="1"/><polygon points="-1,2 -4,0 -1,-2" fill="#000"/><polygon points="1,2 4,0 1,-2" fill="#000"/>
              </g>
            </svg>`;
        } else {
            return `<svg width="70" height="60" viewBox="0 0 70 60">
              <line class="pin-in-0" x1="0" y1="30" x2="21" y2="30" stroke="#006600" stroke-width="3"/>
              <line class="pin-out-0" x1="70" y1="30" x2="49" y2="30" stroke="#006600" stroke-width="3"/>
              <circle cx="23" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
              <circle cx="47" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
              <g class="anim-plunger" style="transition: transform 0.05s;">
                 <rect x="23" y="18" width="24" height="4" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
                 <line x1="35" y1="19" x2="35" y2="9" stroke="#000000" stroke-width="3"/>
                 <rect x="27" y="6" width="16" height="3" fill="#000000"/>
              </g>
              <rect x="10" y="0" width="40" height="22" fill="transparent" style="cursor:pointer; pointer-events:auto;" />
              <g class="lock-btn control-btn lock-down-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(20, 45)">
                 <rect x="-10" y="-10" width="20" height="20" fill="transparent"/><circle cx="0" cy="0" r="5" fill="#000000" stroke="#000000" stroke-width="1"/><polygon points="-1,-2 -4,0 -1,2" fill="#000"/><polygon points="1,-2 4,0 1,2" fill="#000"/>
              </g>
              <g class="unlock-btn control-btn lock-up-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(50, 45)">
                 <rect x="-10" y="-10" width="20" height="20" fill="transparent"/><circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#000000" stroke-width="1"/><polygon points="-1,2 -4,0 -1,-2" fill="#000"/><polygon points="1,2 4,0 1,-2" fill="#000"/>
              </g>
            </svg>`;
        }
    }

    // Keistimewaan Class ini: Mewarisi bindSpecificEvents agar tombol bekerja persis seperti aslinya
    bindSpecificEvents() {
        const startPress = (e) => {
            if (!e.target.closest('.control-btn')) {
                const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === this.id) : null;
                if (currentComp && !currentComp.locked) {
                    currentComp.state = '1';
                    // Paksa render instan saat mouse ditekan
                    if (this.contentDiv.uiInstance) this.contentDiv.uiInstance.updateState(typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false);
                }
            }
        };

        const stopPress = (e) => {
            const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === this.id) : null;
            if (currentComp && !currentComp.locked) {
                currentComp.state = '0';
                if (this.contentDiv.uiInstance) this.contentDiv.uiInstance.updateState(typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false);
            }
        };
        
        this.contentDiv.addEventListener('mousedown', startPress);
        this.contentDiv.addEventListener('touchstart', startPress, {passive: true});
        this.contentDiv.addEventListener('mouseup', stopPress);
        this.contentDiv.addEventListener('mouseleave', stopPress);
        this.contentDiv.addEventListener('touchend', stopPress);
    }

    updateState(isSimActive) {
        const isPressed = this.compData.state === '1'; 
        const isConducting = this.compData.type === 'push_button' ? isPressed : !isPressed;
        
        this.setPinActive('pin-in-0', isSimActive);
        this.setPinActive('pin-out-0', isConducting && isSimActive);
        
        const plunger = this.contentDiv.querySelector('.anim-plunger');
        const lockBtnCircle = this.contentDiv.querySelector('.lock-btn circle');
        
        if (plunger) {
            plunger.style.transform = isPressed ? 'translateY(4px)' : 'translateY(0)';
        }
        if (lockBtnCircle) {
           lockBtnCircle.setAttribute('fill', this.compData.locked ? '#7f1d1d' : '#ef4444');
        }
    }
}

// Daftarkan ke sistem!
UIRegistry['push_button'] = PushButtonUI;
UIRegistry['push_button_nc'] = PushButtonUI;