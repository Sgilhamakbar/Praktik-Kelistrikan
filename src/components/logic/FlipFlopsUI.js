// File: src/components/logic/FlipFlopsUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class FlipFlopUI extends BaseUIComponent {
    static getDimensions() { return [80, 90]; } // Gunakan max untuk aman (SR/JK)
    getSVG() {
        const t = this.compData.type;
        if (t === 'ff_sr') return `<svg width="80" height="90" viewBox="0 0 80 90">
        <rect class="anim-body" x="20" y="5" width="40" height="80" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-1" x1="0" y1="70" x2="20" y2="70" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-2" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-1" x1="60" y1="70" x2="80" y2="70" stroke="#006600" stroke-width="3"/>
        <polyline points="20,35 25,40 20,45" fill="none" stroke="#1e293b" stroke-width="1.5"/>
        <text x="24" y="24" class="comp-label" font-size="10">S</text><text x="24" y="74" class="comp-label" font-size="10">R</text>
        <text x="56" y="24" class="comp-label" text-anchor="end" font-size="10">Q</text>
        <text x="56" y="74" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
        <text x="40" y="50" class="comp-label" text-anchor="middle" font-size="8" fill="gray">SR FF</text></svg>`;
        
        if (t === 'ff_d') return `<svg width="80" height="90" viewBox="0 0 80 90">
        <rect class="anim-body" x="20" y="10" width="40" height="70" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        <line class="pin-in-0" x1="0" y1="30" x2="20" y2="30" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-1" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="3"/>
        <polyline points="20,55 25,60 20,65" fill="none" stroke="#1e293b" stroke-width="1.5"/>
        <line class="pin-in-2" x1="40" y1="0" x2="40" y2="10" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-3" x1="40" y1="90" x2="40" y2="80" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-1" x1="60" y1="60" x2="80" y2="60" stroke="#006600" stroke-width="3"/>
        <text x="24" y="32" class="comp-label" font-size="10">D</text>
        <text x="56" y="34" class="comp-label" text-anchor="end" font-size="10">Q</text>
        <text x="56" y="64" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
        <text x="40" y="22" class="comp-label" text-anchor="middle" font-size="9">S</text>
        <text x="40" y="75" class="comp-label" text-anchor="middle" font-size="9">R</text>
        <text x="40" y="44" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">7474</text></svg>`;

        if (t === 'ff_jk') return `<svg width="80" height="90" viewBox="0 0 80 90">
        <rect class="anim-body" x="20" y="10" width="40" height="70" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-1" x1="0" y1="70" x2="20" y2="70" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-2" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
        <polyline points="20,35 25,40 20,45" fill="none" stroke="#1e293b" stroke-width="1.5"/>
        <line class="pin-in-3" x1="40" y1="0" x2="40" y2="10" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-4" x1="40" y1="90" x2="40" y2="80" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-1" x1="60" y1="70" x2="80" y2="70" stroke="#006600" stroke-width="3"/>
        <text x="24" y="25" class="comp-label" font-size="10">J</text>
        <text x="24" y="70" class="comp-label" font-size="10">K</text>
        <text x="56" y="30" class="comp-label" text-anchor="end" font-size="10">Q</text>
        <text x="56" y="70" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
        <text x="40" y="22" class="comp-label" text-anchor="middle" font-size="9">S</text>
        <text x="40" y="76" class="comp-label" text-anchor="middle" font-size="9">R</text>
        <text x="40" y="49" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">7476</text></svg>`;
        
        if (t === 'ff_t') return `<svg width="80" height="80" viewBox="0 0 80 80">
        <rect class="anim-body" x="20" y="5" width="40" height="70" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-1" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-1" x1="60" y1="60" x2="80" y2="60" stroke="#006600" stroke-width="3"/>
        <polyline points="20,55 25,60 20,65" fill="none" stroke="#1e293b" stroke-width="1.5"/>
        <text x="24" y="24" class="comp-label" font-size="10">T</text>
        <text x="56" y="24" class="comp-label" text-anchor="end" font-size="10">Q</text>
        <text x="56" y="64" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
        <text x="40" y="44" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">T FF</text></svg>`;
    }
    updateState() {
        const qActive = this.compData.outputState === 1;
        this.setPinActive('pin-out-0', qActive); this.setPinActive('pin-out-1', !qActive); 
        if (this.compData.inputStates) {
            for(let i=0; i<this.compData.inputs; i++) this.setPinActive(`pin-in-${i}`, this.compData.inputStates[i] === 1);
        }
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', qActive ? '#dcfce7' : '#e8e6d3');
    }
}

['ff_sr', 'ff_d', 'ff_jk', 'ff_t'].forEach(t => UIRegistry[t] = FlipFlopUI);