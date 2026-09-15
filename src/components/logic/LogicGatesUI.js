// File: src/components/logic/LogicGatesUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class LogicGateUI extends BaseUIComponent {
    static getDimensions() { return [80, 60]; }
    getSVG() {
        const t = this.compData.type;
        let path = "", extra = "";
        if (t==='and'||t==='nand') { path = `<path d="M 15 10 L 40 10 A 20 20 0 0 1 40 50 L 15 50 Z" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>`; if(t==='nand') extra = `<circle cx="65" cy="30" r="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>`; } 
        else if (t==='or'||t==='nor') { path = `<path d="M 15 10 Q 30 10 65 30 Q 30 50 15 50 Q 25 30 15 10 Z" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>`; if(t==='nor') extra = `<circle cx="68" cy="30" r="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>`; } 
        else if (t==='xor'||t==='xnor') { path = `<path d="M 8 10 Q 18 30 8 50" fill="none" stroke="#1e293b" stroke-width="2"/><path d="M 14 10 Q 29 10 65 30 Q 29 50 14 50 Q 24 30 14 10 Z" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>`; if(t==='xnor') extra = `<circle cx="68" cy="30" r="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>`; } 
        else if (t==='not') { path = `<polygon points="20,15 50,30 20,45" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/><circle cx="54" cy="30" r="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>`; }
        return `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="${t==='not'?30:20}" x2="${t==='not'?20:15}" y2="${t==='not'?30:20}" stroke="#006600" stroke-width="3"/>
          ${t!=='not' ? `<line class="pin-in-1" x1="0" y1="40" x2="15" y2="40" stroke="#006600" stroke-width="3"/>` : ''}
          <line class="pin-out-0" x1="${t==='not'?58:60}" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          ${path}${extra}
          <text x="67" y="51" class="comp-label" font-weight="bold" text-anchor="middle">${t.toUpperCase()}</text>
        </svg>`;
    }
    updateState() {
        super.updateState();
        this.setPinActive('pin-out-0', this.compData.outputState === 1);
    }
}
['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].forEach(t => UIRegistry[t] = LogicGateUI);