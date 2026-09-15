// File: src/components/passive/FuseUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class FuseUI extends BaseUIComponent {
    static getDimensions() { return [80, 40]; }
    getSVG() {
        return `<svg width="80" height="40" viewBox="0 0 80 40">
            <line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
            <rect class="anim-body" x="25" y="10" width="30" height="20" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
            <path class="anim-line" d="M 25 20 Q 40 5 55 20" fill="none" stroke="#1e293b" stroke-width="3"/>
            <text class="anim-text comp-label fuse-val val-trigger" x="40" y="8" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text>
            <text class="anim-blown comp-label" x="40" y="24" fill="red" font-weight="bold" text-anchor="middle" style="display:none;">BLOWN</text>
        </svg>`;
    }
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        const isBlown = this.compData.state === 'blown'; 
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', !isBlown && vState);
        
        const body = this.contentDiv.querySelector('.anim-body'); 
        const line = this.contentDiv.querySelector('.anim-line');
        const txtBlown = this.contentDiv.querySelector('.anim-blown'); 
        const txtVal = this.contentDiv.querySelector('.anim-text');
        
        if (body) body.setAttribute('fill', isBlown ? '#fee2e2' : '#e8e6d3');
        if (line) line.style.display = isBlown ? 'none' : 'block';
        if (txtBlown) txtBlown.style.display = isBlown ? 'block' : 'none';
        if (txtVal) txtVal.textContent = (this.compData.customValue ?? 10) + 'A';
    }
}
UIRegistry['fuse'] = FuseUI;