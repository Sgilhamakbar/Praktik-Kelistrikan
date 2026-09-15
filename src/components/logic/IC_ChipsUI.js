// File: src/components/logic/IC_ChipsUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class DigitalIC4017UI extends BaseUIComponent {
    static getDimensions() { return [120, 240]; }
    getSVG() {
        return `<svg width="120" height="240" viewBox="0 0 120 240">
          <rect class="anim-body" x="30" y="10" width="60" height="220" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <circle cx="60" cy="22" r="4" fill="#1e293b"/>
          <line class="pin-in-0" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/><line class="pin-in-1" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/><line class="pin-in-2" x1="0" y1="140" x2="30" y2="140" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-3" x1="60" y1="0" x2="60" y2="10" stroke="#006600" stroke-width="3"/><line class="pin-in-4" x1="60" y1="240" x2="60" y2="230" stroke="#006600" stroke-width="3"/>
          <polyline points="30,55 38,60 30,65" fill="none" stroke="#1e293b" stroke-width="1.5"/>
          <text x="40" y="64" class="comp-label" font-size="10">CLK</text><text x="35" y="104" class="comp-label" font-size="10">ENA</text><text x="35" y="144" class="comp-label" font-size="10">RST</text>
          <text x="60" y="38" class="comp-label" text-anchor="middle" font-size="8">VCC</text><text x="60" y="222" class="comp-label" text-anchor="middle" font-size="8">GND</text>
          <text x="55" y="160" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 50 160)">CD4017</text>
          ${Array.from({length: 11}).map((_, i) => `<line class="pin-out-${i}" x1="90" y1="${20 + i*20}" x2="120" y2="${20 + i*20}" stroke="#006600" stroke-width="3"/><text x="86" y="${24 + i*20}" class="comp-label" text-anchor="end" font-weight="bold" font-size="10" fill="${i === 10 ? '#0284c7' : '#000'}">${i < 10 ? 'Q'+i : 'CO'}</text>`).join('')}
        </svg>`;
    }
    updateState() {
        const vccPowered = (this.compData.simV_vcc || 0) > 2.5; 
        if (this.compData.inputStates) {
            this.setPinActive('pin-in-0', this.compData.inputStates[0] > 2.5); 
            this.setPinActive('pin-in-1', this.compData.inputStates[1] > 2.5); 
            this.setPinActive('pin-in-2', this.compData.inputStates[2] > 2.5); 
            this.setPinActive('pin-in-4', this.compData.inputStates[4] > 0);   
        }
        this.setPinActive('pin-in-3', vccPowered); 
        for (let i = 0; i < 11; i++) {
            const isActive = (this.compData.outputStates && this.compData.outputStates[i] === 1);
            this.setPinActive(`pin-out-${i}`, isActive && vccPowered);
        }
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', vccPowered ? '#fef08a' : '#e8e6d3');
    }
}
UIRegistry['ic_4017'] = DigitalIC4017UI;

export class DigitalIC4518UI extends BaseUIComponent {
    static getDimensions() { return [100, 90]; }
    getSVG() {
        return `<svg width="100" height="90" viewBox="0 0 100 90">
          <rect class="anim-body" x="20" y="5" width="60" height="80" rx="2" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <circle cx="50" cy="12" r="3" fill="#1e293b"/>
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="80" y1="20" x2="100" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="80" y1="40" x2="100" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-2" x1="80" y1="60" x2="100" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-3" x1="80" y1="80" x2="100" y2="80" stroke="#006600" stroke-width="3"/>
          <polyline points="20,20 25,25 20,30" fill="none" stroke="#1e293b" stroke-width="1.5"/> 
          <text x="26" y="29" class="comp-label" font-size="8">CLK</text><text x="24" y="49" class="comp-label" font-size="8">EN</text><text x="24" y="69" class="comp-label" font-size="8">RST</text>
          <text x="76" y="24" class="comp-label" text-anchor="end" font-size="8">Q0</text><text x="76" y="44" class="comp-label" text-anchor="end" font-size="8">Q1</text>
          <text x="76" y="64" class="comp-label" text-anchor="end" font-size="8">Q2</text><text x="76" y="81" class="comp-label" text-anchor="end" font-size="8">Q3</text>
          <text x="50" y="75" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">4518</text>
          <rect x="40" y="35" width="20" height="24" rx="2" fill="#0f172a"/>
          <text class="anim-text val-trigger" x="50" y="53" fill="#facc15" font-size="16" font-weight="bold" text-anchor="middle" style="cursor:pointer; pointer-events:auto;">-</text>
        </svg>`;
    }
    updateState() {
        const outStates = this.compData.outStates || [false, false, false, false];
        for(let i=0; i<4; i++) this.setPinActive(`pin-out-${i}`, outStates[i]);
        const countTxt = this.contentDiv.querySelector('.anim-text');
        if (countTxt) countTxt.textContent = this.compData.count !== undefined ? this.compData.count : '-';
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', this.compData.count !== undefined ? '#fef08a' : '#e8e6d3');
    }
}

// =====================================================
// 4B. UI IC 4518 DUAL (VERSI FISIK NYATA / DIP-16)
// =====================================================
export class DigitalIC4518DualUI extends BaseUIComponent {
    static getDimensions() { return [140, 180]; }
    getSVG() {
        return `<svg width="140" height="180" viewBox="0 0 140 180">
          <rect class="anim-body" x="30" y="5" width="80" height="170" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <path d="M 60 5 A 10 10 0 0 0 80 5" fill="none" stroke="#1e293b" stroke-width="2"/>

          <!-- KIRI (Pin 1 - 8) -->
          <line class="pin-in-0" x1="0" y1="20" x2="30" y2="20" stroke="#006600" stroke-width="3"/><text x="35" y="24" class="comp-label" font-weight="bold">CKA</text>
          <line class="pin-in-1" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/><text x="35" y="44" class="comp-label" font-size="10">ENA</text>
          <line class="pin-in-2" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/><text x="35" y="64" class="comp-label" font-size="10" fill="#ef4444">RSA</text>
          <line class="pin-out-0" x1="0" y1="80" x2="30" y2="80" stroke="#006600" stroke-width="3"/><text x="35" y="84" class="comp-label" font-weight="bold" fill="#0284c7">Q0A</text>
          <line class="pin-out-1" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/><text x="35" y="104" class="comp-label" font-weight="bold" fill="#0284c7">Q1A</text>
          <line class="pin-out-2" x1="0" y1="120" x2="30" y2="120" stroke="#006600" stroke-width="3"/><text x="35" y="124" class="comp-label" font-weight="bold" fill="#0284c7">Q2A</text>
          <line class="pin-out-3" x1="0" y1="140" x2="30" y2="140" stroke="#006600" stroke-width="3"/><text x="35" y="144" class="comp-label" font-weight="bold" fill="#0284c7">Q3A</text>
          <line class="pin-in-7" x1="0" y1="160" x2="30" y2="160" stroke="#006600" stroke-width="3"/><text x="35" y="164" class="comp-label" font-weight="bold" font-size="10">GND</text>

          <!-- KANAN (Pin 16 - 9) -->
          <line class="pin-in-6" x1="110" y1="20" x2="140" y2="20" stroke="#006600" stroke-width="3"/><text x="105" y="24" class="comp-label" text-anchor="end" font-weight="bold" font-size="10" fill="#ef4444">VCC</text>
          <line class="pin-in-3" x1="110" y1="40" x2="140" y2="40" stroke="#006600" stroke-width="3"/><text x="105" y="44" class="comp-label" text-anchor="end" font-weight="bold">CKB</text>
          <line class="pin-in-4" x1="110" y1="60" x2="140" y2="60" stroke="#006600" stroke-width="3"/><text x="105" y="64" class="comp-label" text-anchor="end" font-size="10">ENB</text>
          <line class="pin-in-5" x1="110" y1="80" x2="140" y2="80" stroke="#006600" stroke-width="3"/><text x="105" y="84" class="comp-label" text-anchor="end" font-size="10" fill="#ef4444">RSB</text>
          <line class="pin-out-4" x1="110" y1="100" x2="140" y2="100" stroke="#006600" stroke-width="3"/><text x="105" y="104" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Q0B</text>
          <line class="pin-out-5" x1="110" y1="120" x2="140" y2="120" stroke="#006600" stroke-width="3"/><text x="105" y="124" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Q1B</text>
          <line class="pin-out-6" x1="110" y1="140" x2="140" y2="140" stroke="#006600" stroke-width="3"/><text x="105" y="144" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Q2B</text>
          <line class="pin-out-7" x1="110" y1="160" x2="140" y2="160" stroke="#006600" stroke-width="3"/><text x="105" y="164" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Q3B</text>

          <text x="70" y="95" class="comp-label" text-anchor="middle" font-weight="bold" font-size="16" transform="rotate(-90 70 95)">CD4518</text>
        </svg>`;
    }
    updateState() {
        const vccPowered = (this.compData.simV_vcc || 0) > 2.5;
        if (this.compData.inputStates) {
            for(let i=0; i<8; i++) this.setPinActive(`pin-in-${i}`, this.compData.inputStates[i] > 2.5);
        }
        const outStates = this.compData.outStates || [false, false, false, false, false, false, false, false];
        for(let i=0; i<8; i++) this.setPinActive(`pin-out-${i}`, outStates[i] && vccPowered);
        
        const isWorking = outStates.includes(true);
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isWorking && vccPowered ? '#fef08a' : '#e8e6d3');
    }
}

UIRegistry['ic_4518_dual'] = DigitalIC4518DualUI;
UIRegistry['ic_4518'] = DigitalIC4518UI;

export class DigitalIC4511UI extends BaseUIComponent {
    static getDimensions() { return [120, 160]; }
    getSVG() {
        return `<svg width="120" height="160" viewBox="0 0 120 160">
          <rect class="anim-body" x="30" y="5" width="60" height="150" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <circle cx="60" cy="12" r="3" fill="#1e293b"/>
          ${Array.from({length: 7}).map((_, i) => `<line class="pin-in-${i}" x1="0" y1="${20+i*20}" x2="30" y2="${20+i*20}" stroke="#006600" stroke-width="3"/> <line class="pin-out-${i}" x1="90" y1="${20+i*20}" x2="120" y2="${20+i*20}" stroke="#006600" stroke-width="3"/>`).join('')}
          <text x="34" y="24" class="comp-label" font-weight="bold">A</text><text x="34" y="44" class="comp-label" font-weight="bold">B</text><text x="34" y="64" class="comp-label" font-weight="bold">C</text><text x="34" y="84" class="comp-label" font-weight="bold">D</text>
          <text x="34" y="104" class="comp-label" font-size="8" fill="#0284c7">LT</text><text x="34" y="124" class="comp-label" font-size="8" fill="#0284c7">BI</text><text x="34" y="144" class="comp-label" font-size="8" fill="#0284c7">LE</text>
          <text x="86" y="24" class="comp-label" text-anchor="end" font-weight="bold">a</text><text x="86" y="44" class="comp-label" text-anchor="end" font-weight="bold">b</text><text x="86" y="64" class="comp-label" text-anchor="end" font-weight="bold">c</text><text x="86" y="84" class="comp-label" text-anchor="end" font-weight="bold">d</text><text x="86" y="104" class="comp-label" text-anchor="end" font-weight="bold">e</text><text x="86" y="124" class="comp-label" text-anchor="end" font-weight="bold">f</text><text x="86" y="144" class="comp-label" text-anchor="end" font-weight="bold">g</text>
          <text x="60" y="85" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 60 85)">CD4511</text>
        </svg>`;
    }
    updateState() {
        if (this.compData.inputStates) {
            for(let i=0; i<7; i++) this.setPinActive(`pin-in-${i}`, this.compData.inputStates[i] > 2.5);
        }
        const outStates = this.compData.outStates || [0,0,0,0,0,0,0];
        for (let i = 0; i < 7; i++) this.setPinActive(`pin-out-${i}`, outStates[i] === 1);
        
        const isWorking = outStates.includes(1);
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isWorking ? '#fef08a' : '#e8e6d3');
    }
}
UIRegistry['ic_4511'] = DigitalIC4511UI;

export class DigitalIC4026UI extends BaseUIComponent {
    static getDimensions() { return [120, 220]; }
    getSVG() {
        return `<svg width="120" height="220" viewBox="0 0 120 220">
          <rect class="anim-body" x="30" y="5" width="60" height="210" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <circle cx="60" cy="12" r="3" fill="#1e293b"/>
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="3"/><line class="pin-in-1" x1="0" y1="80" x2="30" y2="80" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="130" x2="30" y2="130" stroke="#006600" stroke-width="3"/><line class="pin-in-3" x1="0" y1="180" x2="30" y2="180" stroke="#006600" stroke-width="3"/>
          ${Array.from({length: 10}).map((_, i) => `<line class="pin-out-${i}" x1="90" y1="${20 + i*20}" x2="120" y2="${20 + i*20}" stroke="#006600" stroke-width="3"/>`).join('')}
          <polyline points="30,25 36,30 30,35" fill="none" stroke="#1e293b" stroke-width="1.5"/>
          <text x="38" y="34" class="comp-label" font-size="8" font-weight="bold">CLK</text><text x="34" y="84" class="comp-label" font-size="8" font-weight="bold">INH</text>
          <text x="34" y="134" class="comp-label" font-size="8" font-weight="bold">RST</text><text x="34" y="184" class="comp-label" font-size="8" font-weight="bold" fill="#0284c7">DEI</text>
          <text x="86" y="24" class="comp-label" text-anchor="end" font-weight="bold">a</text><text x="86" y="44" class="comp-label" text-anchor="end" font-weight="bold">b</text><text x="86" y="64" class="comp-label" text-anchor="end" font-weight="bold">c</text><text x="86" y="84" class="comp-label" text-anchor="end" font-weight="bold">d</text><text x="86" y="104" class="comp-label" text-anchor="end" font-weight="bold">e</text><text x="86" y="124" class="comp-label" text-anchor="end" font-weight="bold">f</text><text x="86" y="144" class="comp-label" text-anchor="end" font-weight="bold">g</text>
          <text x="86" y="164" class="comp-label" text-anchor="end" font-size="10" font-weight="bold" fill="#ef4444">CO</text><text x="86" y="184" class="comp-label" text-anchor="end" font-size="8" font-weight="bold" fill="#0284c7">DEO</text><text x="86" y="204" class="comp-label" text-anchor="end" font-size="8" font-weight="bold" fill="#8b5cf6">UCS</text>
          <text x="60" y="110" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 60 110)">CD4026</text>
        </svg>`;
    }
    updateState() {
        if (this.compData.inputStates) {
            for(let i=0; i<4; i++) this.setPinActive(`pin-in-${i}`, this.compData.inputStates[i] > 2.5);
        }
        const outStates = this.compData.outStates || [0,0,0,0,0,0,0,0,0,0];
        for (let i = 0; i < 10; i++) this.setPinActive(`pin-out-${i}`, outStates[i] === 1);
        
        const isWorking = outStates.slice(0, 7).includes(1);
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isWorking ? '#fef08a' : '#e8e6d3');
    }
}
UIRegistry['ic_4026'] = DigitalIC4026UI;

export class IC555UI extends BaseUIComponent {
    static getDimensions() { return [120, 160]; }
    getSVG() {
        return `<svg width="120" height="160" viewBox="0 0 120 160">
          <rect class="anim-body" x="30" y="20" width="60" height="120" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <circle cx="38" cy="28" r="4" fill="#1e293b"/>
          <line class="pin-in-1" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/><line class="pin-in-2" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/><line class="pin-in-3" x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="120" y1="40" x2="90" y2="40" stroke="#006600" stroke-width="3"/><line class="pin-in-4" x1="120" y1="100" x2="90" y2="100" stroke="#006600" stroke-width="3"/><line class="pin-out-1" x1="120" y1="70" x2="90" y2="70" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-5" x1="60" y1="0" x2="60" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-in-0" x1="60" y1="160" x2="60" y2="140" stroke="#006600" stroke-width="3"/>
          <text x="35" y="104" class="comp-label" font-size="10">TR</text><text x="37" y="44" class="comp-label" font-size="10">R</text><circle cx="34" cy="41" r="2" fill="none" stroke="black"/><text x="35" y="74" class="comp-label" font-size="10">CTRL</text>
          <text x="85" y="44" class="comp-label" text-anchor="end" font-size="10">out</text><text x="85" y="104" class="comp-label" text-anchor="end" font-size="10">TH</text><text x="85" y="74" class="comp-label" text-anchor="end" font-size="10">DC</text>
          <text x="60" y="32" class="comp-label" text-anchor="middle" font-size="10">VCC</text><text x="60" y="135" class="comp-label" text-anchor="middle" font-size="10">GND</text><text x="60" y="85" class="comp-label" font-weight="bold" font-size="16" text-anchor="middle">555</text>
        </svg>`;
    }
    updateState() {
        const isActive = this.compData.outputState === 1;
        const vccPowered = (this.compData.simV_vcc || 0) > 0;
        this.setPinActive('pin-in-5', vccPowered); 
        this.setPinActive('pin-out-0', isActive);  
        
        if (this.compData.inputStates) {
            this.setPinActive('pin-in-0', this.compData.inputStates[0] > 0);   
            this.setPinActive('pin-in-1', this.compData.inputStates[1] > 2.5); 
            this.setPinActive('pin-in-2', this.compData.inputStates[2] > 2.5); 
            this.setPinActive('pin-in-3', this.compData.inputStates[3] > 2.5); 
            this.setPinActive('pin-in-4', this.compData.inputStates[4] > 2.5); 
        }
        
        this.setPinActive('pin-out-1', !isActive && vccPowered);
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isActive ? '#fef08a' : '#e8e6d3');
    }
}
UIRegistry['ic_555'] = IC555UI;

export class ICLM3914UI extends BaseUIComponent {
    static getDimensions() { return [140, 240]; }
    getSVG() {
        return `<svg width="140" height="240" viewBox="0 0 140 240">
          <rect class="anim-body" x="30" y="20" width="80" height="200" rx="4" ry="4" fill="#1e293b" stroke="#1e293b" stroke-width="2"/>
          <path d="M 60 20 A 10 10 0 0 0 80 20" fill="none" stroke="#1e293b" stroke-width="2"/>
          <line class="pin-in-6" x1="70" y1="0" x2="70" y2="20" stroke="#006600" stroke-width="3"/><text x="80" y="15" font-size="10" fill="#ef4444" font-weight="bold" font-family="monospace">V+</text>
          <line class="pin-in-7" x1="70" y1="220" x2="70" y2="240" stroke="#006600" stroke-width="3"/><text x="80" y="235" font-size="10" fill="#3b82f6" font-weight="bold" font-family="monospace">V-</text>
          <line class="pin-in-0" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/><text x="35" y="44" font-size="10" fill="#94a3b8" font-family="monospace">SIG</text>
          <line class="pin-in-1" x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="3"/><text x="35" y="74" font-size="10" fill="#94a3b8" font-family="monospace">RHI</text>
          <line class="pin-in-2" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/><text x="35" y="104" font-size="10" fill="#94a3b8" font-family="monospace">RLO</text>
          <line class="pin-in-3" x1="0" y1="130" x2="30" y2="130" stroke="#006600" stroke-width="3"/><text x="35" y="134" font-size="10" fill="#94a3b8" font-family="monospace">VRO</text>
          <line class="pin-in-4" x1="0" y1="160" x2="30" y2="160" stroke="#006600" stroke-width="3"/><text x="35" y="164" font-size="10" fill="#94a3b8" font-family="monospace">ADJ</text>
          <line class="pin-in-5" x1="0" y1="190" x2="30" y2="190" stroke="#006600" stroke-width="3"/><text x="35" y="194" font-size="10" fill="#94a3b8" font-family="monospace">MODE</text>
          ${Array.from({length: 10}).map((_, i) => `<line class="pin-out-${i}" x1="110" y1="${30+i*20}" x2="140" y2="${30+i*20}" stroke="#006600" stroke-width="3"/><text x="105" y="${34+i*20}" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L${i+1}</text>`).join('')}
          <text x="65" y="90" font-size="10" font-weight="bold" fill="#cbd5e1" transform="rotate(-90 70 120)" text-anchor="middle">LM3914</text>
        </svg>`;
    }
    updateState() {
        if (this.compData.inputStates) {
            for(let i=0; i<=7; i++) this.setPinActive(`pin-in-${i}`, this.compData.inputStates[i]);
        }
        if (this.compData.outStates) {
            for (let i = 0; i < 10; i++) {
                const pinOutEl = this.contentDiv.querySelector(`.pin-out-${i}`);
                if (pinOutEl) {
                    if (this.compData.outStates[i]) {
                        pinOutEl.setAttribute('stroke', '#ef4444'); 
                        pinOutEl.style.filter = 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))';
                    } else {
                        pinOutEl.setAttribute('stroke', '#64748b');
                        pinOutEl.style.filter = 'none';
                    }
                }
            }
        }
    }
}
UIRegistry['ic_lm3914'] = ICLM3914UI;

// =====================================================
// 7. UI IC 7448 (DIP-16 FISIK OTENTIK)
// =====================================================
export class DigitalIC7448UI extends BaseUIComponent {
    static getDimensions() { return [140, 180]; }
    getSVG() {
        return `<svg width="140" height="180" viewBox="0 0 140 180">
          <!-- Bodi IC & Cekungan (Notch) Penanda Pin 1 -->
          <rect class="anim-body" x="30" y="5" width="80" height="170" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <path d="M 60 5 A 10 10 0 0 0 80 5" fill="none" stroke="#1e293b" stroke-width="2"/>

          <!-- ================= KIRI: PIN 1 s/d 8 ================= -->
          <!-- Pin 1: B (Logic In 1) --> 
          <line class="pin-in-1" x1="0" y1="20" x2="30" y2="20" stroke="#006600" stroke-width="3"/><text x="35" y="24" class="comp-label" font-weight="bold">B</text>
          <!-- Pin 2: C (Logic In 2) --> 
          <line class="pin-in-2" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/><text x="35" y="44" class="comp-label" font-weight="bold">C</text>
          <!-- Pin 3: LT (Logic In 4) --> 
          <line class="pin-in-4" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/><text x="35" y="64" class="comp-label" font-size="8" fill="#0284c7">LT</text>
          <!-- Pin 4: BI/RBO (Logic In 5) --> 
          <line class="pin-in-5" x1="0" y1="80" x2="30" y2="80" stroke="#006600" stroke-width="3"/><text x="35" y="84" class="comp-label" font-size="8" fill="#0284c7">BI</text>
          <!-- Pin 5: RBI (Logic In 6) --> 
          <line class="pin-in-6" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/><text x="35" y="104" class="comp-label" font-size="8" fill="#0284c7">RBI</text>
          <!-- Pin 6: D (Logic In 3) --> 
          <line class="pin-in-3" x1="0" y1="120" x2="30" y2="120" stroke="#006600" stroke-width="3"/><text x="35" y="124" class="comp-label" font-weight="bold">D</text>
          <!-- Pin 7: A (Logic In 0) --> 
          <line class="pin-in-0" x1="0" y1="140" x2="30" y2="140" stroke="#006600" stroke-width="3"/><text x="35" y="144" class="comp-label" font-weight="bold">A</text>
          <!-- Pin 8: GND (Logic In 8) --> 
          <line class="pin-in-8" x1="0" y1="160" x2="30" y2="160" stroke="#006600" stroke-width="3"/><text x="35" y="164" class="comp-label" font-weight="bold" font-size="8">GND</text>

          <!-- ================= KANAN: PIN 16 s/d 9 ================= -->
          <!-- Pin 16: VCC (Logic In 7) --> 
          <line class="pin-in-7" x1="110" y1="20" x2="140" y2="20" stroke="#006600" stroke-width="3"/><text x="105" y="24" class="comp-label" text-anchor="end" font-weight="bold" font-size="8" fill="#ef4444">VCC</text>
          <!-- Pin 15: f (Logic Out 5) --> 
          <line class="pin-out-5" x1="110" y1="40" x2="140" y2="40" stroke="#006600" stroke-width="3"/><text x="105" y="44" class="comp-label" text-anchor="end" font-weight="bold">f</text>
          <!-- Pin 14: g (Logic Out 6) --> 
          <line class="pin-out-6" x1="110" y1="60" x2="140" y2="60" stroke="#006600" stroke-width="3"/><text x="105" y="64" class="comp-label" text-anchor="end" font-weight="bold">g</text>
          <!-- Pin 13: a (Logic Out 0) --> 
          <line class="pin-out-0" x1="110" y1="80" x2="140" y2="80" stroke="#006600" stroke-width="3"/><text x="105" y="84" class="comp-label" text-anchor="end" font-weight="bold">a</text>
          <!-- Pin 12: b (Logic Out 1) --> 
          <line class="pin-out-1" x1="110" y1="100" x2="140" y2="100" stroke="#006600" stroke-width="3"/><text x="105" y="104" class="comp-label" text-anchor="end" font-weight="bold">b</text>
          <!-- Pin 11: c (Logic Out 2) --> 
          <line class="pin-out-2" x1="110" y1="120" x2="140" y2="120" stroke="#006600" stroke-width="3"/><text x="105" y="124" class="comp-label" text-anchor="end" font-weight="bold">c</text>
          <!-- Pin 10: d (Logic Out 3) --> 
          <line class="pin-out-3" x1="110" y1="140" x2="140" y2="140" stroke="#006600" stroke-width="3"/><text x="105" y="144" class="comp-label" text-anchor="end" font-weight="bold">d</text>
          <!-- Pin 9: e (Logic Out 4) -->  
          <line class="pin-out-4" x1="110" y1="160" x2="140" y2="160" stroke="#006600" stroke-width="3"/><text x="105" y="164" class="comp-label" text-anchor="end" font-weight="bold">e</text>

          <text x="70" y="95" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 70 95)">SN7448</text>
        </svg>`;
    }
    
    updateState() {
        const vccPowered = (this.compData.simV_vcc || 0) > 2.5;
        
        if (this.compData.inputStates) {
            for(let i=0; i<9; i++) {
                this.setPinActive(`pin-in-${i}`, this.compData.inputStates[i] > 2.5);
            }
        }

        const outStates = this.compData.outStates || [0,0,0,0,0,0,0];
        for (let i = 0; i < 7; i++) {
            this.setPinActive(`pin-out-${i}`, outStates[i] === 1 && vccPowered);
        }
        
        const isWorking = outStates.includes(1);
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isWorking && vccPowered ? '#fef08a' : '#e8e6d3');
    }
}

// Daftarkan ke Registry
UIRegistry['ic_7448'] = DigitalIC7448UI;

// =====================================================
// 8. UI IC 74LS90 (DIP-14 FISIK OTENTIK)
// =====================================================
export class DigitalIC74LS90UI extends BaseUIComponent {
    static getDimensions() { return [140, 160]; }
    getSVG() {
        return `<svg width="140" height="160" viewBox="0 0 140 160">
          <!-- Bodi IC & Cekungan (Notch) Pin 1 -->
          <rect class="anim-body" x="30" y="5" width="80" height="150" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <path d="M 60 5 A 10 10 0 0 0 80 5" fill="none" stroke="#1e293b" stroke-width="2"/>

          <!-- ================= KIRI: PIN 1 s/d 7 ================= -->
          <!-- Pin 1: CLK B (Logic In 1) -->
          <line class="pin-in-1" x1="0" y1="20" x2="30" y2="20" stroke="#006600" stroke-width="3"/><text x="35" y="24" class="comp-label" font-weight="bold">CKB</text>
          <!-- Pin 2: R0_1 (Logic In 2) -->
          <line class="pin-in-2" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/><text x="35" y="44" class="comp-label" font-size="8" fill="#ef4444">R0(1)</text>
          <!-- Pin 3: R0_2 (Logic In 3) -->
          <line class="pin-in-3" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/><text x="35" y="64" class="comp-label" font-size="8" fill="#ef4444">R0(2)</text>
          <!-- Pin 4: No Connection (Dummy Visual) -->
          <line x1="10" y1="80" x2="30" y2="80" stroke="#94a3b8" stroke-width="3"/><text x="35" y="84" class="comp-label" font-size="8" fill="#94a3b8">NC</text>
          <!-- Pin 5: VCC (Logic In 6) -->
          <line class="pin-in-6" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/><text x="35" y="104" class="comp-label" font-weight="bold" font-size="8" fill="#ef4444">VCC</text>
          <!-- Pin 6: R9_1 (Logic In 4) -->
          <line class="pin-in-4" x1="0" y1="120" x2="30" y2="120" stroke="#006600" stroke-width="3"/><text x="35" y="124" class="comp-label" font-size="8" fill="#0284c7">R9(1)</text>
          <!-- Pin 7: R9_2 (Logic In 5) -->
          <line class="pin-in-5" x1="0" y1="140" x2="30" y2="140" stroke="#006600" stroke-width="3"/><text x="35" y="144" class="comp-label" font-size="8" fill="#0284c7">R9(2)</text>

          <!-- ================= KANAN: PIN 14 s/d 8 ================= -->
          <!-- Pin 14: CLK A (Logic In 0) -->
          <line class="pin-in-0" x1="110" y1="20" x2="140" y2="20" stroke="#006600" stroke-width="3"/><text x="105" y="24" class="comp-label" text-anchor="end" font-weight="bold">CKA</text>
          <!-- Pin 13: No Connection (Dummy Visual) -->
          <line x1="110" y1="40" x2="130" y2="40" stroke="#94a3b8" stroke-width="3"/><text x="105" y="44" class="comp-label" text-anchor="end" font-size="8" fill="#94a3b8">NC</text>
          <!-- Pin 12: QA (Logic Out 0) -->
          <line class="pin-out-0" x1="110" y1="60" x2="140" y2="60" stroke="#006600" stroke-width="3"/><text x="105" y="64" class="comp-label" text-anchor="end" font-weight="bold">QA</text>
          <!-- Pin 11: QD (Logic Out 3) -->
          <line class="pin-out-3" x1="110" y1="80" x2="140" y2="80" stroke="#006600" stroke-width="3"/><text x="105" y="84" class="comp-label" text-anchor="end" font-weight="bold">QD</text>
          <!-- Pin 10: GND (Logic In 7) -->
          <line class="pin-in-7" x1="110" y1="100" x2="140" y2="100" stroke="#006600" stroke-width="3"/><text x="105" y="104" class="comp-label" text-anchor="end" font-weight="bold" font-size="8">GND</text>
          <!-- Pin 9: QB (Logic Out 1) -->
          <line class="pin-out-1" x1="110" y1="120" x2="140" y2="120" stroke="#006600" stroke-width="3"/><text x="105" y="124" class="comp-label" text-anchor="end" font-weight="bold">QB</text>
          <!-- Pin 8: QC (Logic Out 2) -->
          <line class="pin-out-2" x1="110" y1="140" x2="140" y2="140" stroke="#006600" stroke-width="3"/><text x="105" y="144" class="comp-label" text-anchor="end" font-weight="bold">QC</text>

          <text x="70" y="85" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 70 85)">74LS90</text>
        </svg>`;
    }
    
    updateState() {
        const vccPowered = (this.compData.simV_vcc || 0) > 2.5;
        
        if (this.compData.inputStates) {
            for(let i=0; i<8; i++) {
                this.setPinActive(`pin-in-${i}`, this.compData.inputStates[i] > 2.5);
            }
        }

        const outStates = this.compData.outStates || [0,0,0,0];
        for (let i = 0; i < 4; i++) {
            // Karena output kita bernilai boolean (true/false) di model
            this.setPinActive(`pin-out-${i}`, outStates[i] === true && vccPowered);
        }
        
        const isWorking = outStates.includes(true);
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isWorking && vccPowered ? '#fef08a' : '#e8e6d3');
    }
}

// Daftarkan ke Registry UI
UIRegistry['ic_74LS90'] = DigitalIC74LS90UI;

// =====================================================
// 9. UI NET TUNNEL
// =====================================================
export class NetTunnelUI extends BaseUIComponent {
    static getDimensions() { return [70, 40]; }
    
    getSVG() {
        return `<svg width="70" height="40" viewBox="0 0 70 40">
            <!-- Garis Hijau (Mulai tepat di titik pin x=0, y=20) -->
            <line class="pin-in-0" x1="0" y1="20" x2="26" y2="20" stroke="#008000" stroke-width="4"/>
            
            <!-- Kotak Rounded Sudut (Center Vertikal di y=20) -->
            <rect class="anim-body" x="26" y="5" width="40" height="30" rx="6" ry="6" fill="#ffffff" stroke="#000000" stroke-width="2"/>
            
            <!-- Teks Channel (val-trigger dihapus & pointer-events di-set none) -->
            <text class="ch-text" x="46" y="20" fill="#000000" font-size="10" font-weight="500" font-family="sans-serif, Arial" text-anchor="middle" dominant-baseline="middle" style="pointer-events: none; user-select: none;">CH 1</text>
        </svg>`;
    }

    updateState() {
        const chText = this.contentDiv.querySelector('.ch-text');
        if (chText) {
            const ch = this.compData.customValue !== undefined ? this.compData.customValue : 1;
            chText.textContent = 'CH ' + ch;
        }
        
        // Animasi Cerdas: Berubah warna merah jika ada sinyal (Tegangan > 2.5V)
        const voltage = this.compData.simV || 0;
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) {
            body.setAttribute('fill', voltage > 2.5 ? '#ef4444' : '#dee4ee');
        }
    }
}
UIRegistry['net_tunnel'] = NetTunnelUI;

// =====================================================
// 10. UI IC 4051 (8-CHANNEL ANALOG MULTIPLEXER - DIP-16)
// =====================================================
export class DigitalIC4051UI extends BaseUIComponent {
    static getDimensions() { return [140, 180]; }
    
    getSVG() {
        return `<svg width="140" height="180" viewBox="0 0 140 180">
          <!-- Bodi IC & Cekungan (Notch) Penanda Pin 1 -->
          <rect class="anim-body" x="30" y="5" width="80" height="170" rx="4" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <path d="M 60 5 A 10 10 0 0 0 80 5" fill="none" stroke="#1e293b" stroke-width="2"/>

          <!-- ================= KIRI: PIN 1 s/d 8 ================= -->
          <!-- Pin 1: Y4 (Output 4) --> 
          <line class="pin-out-4" x1="0" y1="20" x2="30" y2="20" stroke="#006600" stroke-width="3"/><text x="35" y="24" class="comp-label" font-weight="bold" fill="#0284c7">Y4</text>
          <!-- Pin 2: Y6 (Output 6) --> 
          <line class="pin-out-6" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/><text x="35" y="44" class="comp-label" font-weight="bold" fill="#0284c7">Y6</text>
          <!-- Pin 3: COM / Z (Input 4) --> 
          <line class="pin-in-4" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/><text x="35" y="64" class="comp-label" font-weight="bold" fill="#f59e0b">COM</text>
          <!-- Pin 4: Y7 (Output 7) --> 
          <line class="pin-out-7" x1="0" y1="80" x2="30" y2="80" stroke="#006600" stroke-width="3"/><text x="35" y="84" class="comp-label" font-weight="bold" fill="#0284c7">Y7</text>
          <!-- Pin 5: Y5 (Output 5) --> 
          <line class="pin-out-5" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/><text x="35" y="104" class="comp-label" font-weight="bold" fill="#0284c7">Y5</text>
          <!-- Pin 6: INH / Enable (Input 3) --> 
          <line class="pin-in-3" x1="0" y1="120" x2="30" y2="120" stroke="#006600" stroke-width="3"/><text x="35" y="124" class="comp-label" font-size="10">INH</text>
          <!-- Pin 7: VEE (Input 5) --> 
          <line class="pin-in-5" x1="0" y1="140" x2="30" y2="140" stroke="#006600" stroke-width="3"/><text x="35" y="144" class="comp-label" font-size="10" font-weight="bold" fill="#3b82f6">VEE</text>
          <!-- Pin 8: VSS / GND (Input 7) --> 
          <line class="pin-in-7" x1="0" y1="160" x2="30" y2="160" stroke="#006600" stroke-width="3"/><text x="35" y="164" class="comp-label" font-weight="bold" font-size="10">VSS</text>

          <!-- ================= KANAN: PIN 16 s/d 9 ================= -->
          <!-- Pin 16: VDD (Input 6) --> 
          <line class="pin-in-6" x1="110" y1="20" x2="140" y2="20" stroke="#006600" stroke-width="3"/><text x="105" y="24" class="comp-label" text-anchor="end" font-weight="bold" font-size="10" fill="#ef4444">VDD</text>
          <!-- Pin 15: Y2 (Output 2) --> 
          <line class="pin-out-2" x1="110" y1="40" x2="140" y2="40" stroke="#006600" stroke-width="3"/><text x="105" y="44" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Y2</text>
          <!-- Pin 14: Y1 (Output 1) --> 
          <line class="pin-out-1" x1="110" y1="60" x2="140" y2="60" stroke="#006600" stroke-width="3"/><text x="105" y="64" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Y1</text>
          <!-- Pin 13: Y0 (Output 0) --> 
          <line class="pin-out-0" x1="110" y1="80" x2="140" y2="80" stroke="#006600" stroke-width="3"/><text x="105" y="84" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Y0</text>
          <!-- Pin 12: Y3 (Output 3) --> 
          <line class="pin-out-3" x1="110" y1="100" x2="140" y2="100" stroke="#006600" stroke-width="3"/><text x="105" y="104" class="comp-label" text-anchor="end" font-weight="bold" fill="#0284c7">Y3</text>
          <!-- Pin 11: A (Input 0) --> 
          <line class="pin-in-0" x1="110" y1="120" x2="140" y2="120" stroke="#006600" stroke-width="3"/><text x="105" y="124" class="comp-label" text-anchor="end" font-weight="bold">A</text>
          <!-- Pin 10: B (Input 1) --> 
          <line class="pin-in-1" x1="110" y1="140" x2="140" y2="140" stroke="#006600" stroke-width="3"/><text x="105" y="144" class="comp-label" text-anchor="end" font-weight="bold">B</text>
          <!-- Pin 9: C (Input 2) -->  
          <line class="pin-in-2" x1="110" y1="160" x2="140" y2="160" stroke="#006600" stroke-width="3"/><text x="105" y="164" class="comp-label" text-anchor="end" font-weight="bold">C</text>

          <text x="70" y="95" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 70 95)">CD4051</text>
        </svg>`;
    }
    
    updateState() {
        const isPowered = (this.compData.simV_vcc || 0) > 2.5;
        const isActive = this.compData.isActive && isPowered;
        const selected = this.compData.activeChannel !== undefined ? this.compData.activeChannel : -1;
        
        // 1. Matikan semua warna pin Y terlebih dahulu
        for (let i = 0; i < 8; i++) {
            this.setPinActive(`pin-out-${i}`, false);
        }
        
        // 2. Nyalakan pin COM dan pin Y yang sedang dipilih saja
        this.setPinActive('pin-in-4', isActive); // Pin COM menyala merah
        if (isActive && selected >= 0 && selected <= 7) {
            this.setPinActive(`pin-out-${selected}`, true);
        }

        // 3. Warna badan IC
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) {
            // Kuning menyala jika IC sedang meneruskan sinyal
            body.setAttribute('fill', isActive ? '#fef08a' : '#e8e6d3');
        }
    }
}
UIRegistry['ic_4051'] = DigitalIC4051UI;

// =====================================================
// 11. UI IC 7805 (VOLTAGE REGULATOR 5V - TO-220)
// =====================================================
export class IC7805UI extends BaseUIComponent {
    static getDimensions() { return [80, 120]; }
    getSVG() {
        return `<svg width="80" height="120" viewBox="0 0 80 120">
          <!-- 1. Lempengan Besi Pendingin (Heatsink Tab) di atas -->
          <rect x="15" y="10" width="50" height="30" rx="3" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>
          <circle cx="40" cy="22" r="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="2"/> <!-- Lubang Baut -->

          <!-- 2. Bodi Plastik Hitam TO-220 -->
          <rect x="10" y="40" width="60" height="50" rx="2" fill="#334155" stroke="#1e293b" stroke-width="2"/>
          
          <!-- Teks Sablon Merek IC -->
          <text x="40" y="58" text-anchor="middle" font-size="13" font-weight="bold" fill="#f8fafc">L7805</text>
          
          <!-- Lampu Indikator Status (Virtual) -->
          <circle class="status-led" cx="40" cy="70" r="3" fill="#1e293b" stroke="#000" stroke-width="1"/>

          <!-- Label Kaki (IN - GND - OUT) -->
          <text x="20" y="85" text-anchor="middle" font-size="8" font-weight="bold" fill="#cbd5e1">IN</text>
          <text x="40" y="85" text-anchor="middle" font-size="8" font-weight="bold" fill="#cbd5e1">GND</text>
          <text x="60" y="85" text-anchor="middle" font-size="8" font-weight="bold" fill="#cbd5e1">OUT</text>

          <!-- 3. Ketiga Kaki Besi (Pins) -->
          <!-- Pin 1: IN (Kelompok input, index 0) -->
          <line class="pin-in-0" x1="20" y1="90" x2="20" y2="120" stroke="#006600" stroke-width="3"/>
          <!-- Pin 2: GND (Kelompok input, index 1) -->
          <line class="pin-in-1" x1="40" y1="90" x2="40" y2="120" stroke="#006600" stroke-width="3"/>
          <!-- Pin 3: OUT (Kelompok output, index 0) -->
          <line class="pin-out-0" x1="60" y1="90" x2="60" y2="120" stroke="#006600" stroke-width="3"/>
        </svg>`;
    }
    
    updateState() {
        // Ambil status dari memori mesin fisika
        const currentState = this.compData.state || 'off'; // 'regulating', 'dropout', atau 'off'
        const vOut = this.compData.simV_out || 0;

        // 1. Ganti warna lampu indikator virtual di bodi IC berdasarkan status kerjanya
        const statusLed = this.contentDiv.querySelector('.status-led');
        if (statusLed) {
            if (currentState === 'regulating') {
                statusLed.setAttribute('fill', '#22c55e'); // Hijau menyala terang (Ideal 5V)
            } else if (currentState === 'dropout') {
                statusLed.setAttribute('fill', '#f59e0b'); // Oranye/Kuning (Kurang daya input)
            } else {
                statusLed.setAttribute('fill', '#1e293b'); // Padam / Mati total
            }
        }

        // 2. Animasikan warna kabel yang terhubung
        // Kabel IN dan GND menyala selama tidak mati total
        const isInputActive = (currentState !== 'off');
        this.setPinActive('pin-in-0', isInputActive);
        this.setPinActive('pin-in-1', isInputActive);
        
        // Kabel OUT menyala proporsional jika ada tegangan keluaran yang lumayan (> 1.5V)
        this.setPinActive('pin-out-0', vOut > 1.5);
    }
}
export class IC7808UI extends BaseUIComponent {
    static getDimensions() { return [80, 120]; }
    getSVG() {
        return `<svg width="80" height="120" viewBox="0 0 80 120">
          <!-- 1. Lempengan Besi Pendingin (Heatsink Tab) -->
          <rect x="15" y="10" width="50" height="30" rx="3" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>
          <circle cx="40" cy="22" r="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="2"/>

          <!-- 2. Bodi Plastik Hitam TO-220 -->
          <rect x="10" y="40" width="60" height="50" rx="2" fill="#334155" stroke="#1e293b" stroke-width="2"/>
          
          <!-- Teks Sablon Merek IC (Diubah menjadi L7808) -->
          <text x="40" y="58" text-anchor="middle" font-size="13" font-weight="bold" fill="#f8fafc">L7808</text>
          
          <!-- Lampu Indikator Status (Virtual) -->
          <circle class="status-led" cx="40" cy="70" r="3" fill="#1e293b" stroke="#000" stroke-width="1"/>

          <!-- Label Kaki (IN - GND - OUT) -->
          <text x="20" y="85" text-anchor="middle" font-size="8" font-weight="bold" fill="#cbd5e1">IN</text>
          <text x="40" y="85" text-anchor="middle" font-size="8" font-weight="bold" fill="#cbd5e1">GND</text>
          <text x="60" y="85" text-anchor="middle" font-size="8" font-weight="bold" fill="#cbd5e1">OUT</text>

          <!-- 3. Ketiga Kaki Besi (Pins) -->
          <line class="pin-in-0" x1="20" y1="90" x2="20" y2="120" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="40" y1="90" x2="40" y2="120" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="90" x2="60" y2="120" stroke="#006600" stroke-width="3"/>
        </svg>`;
    }
    
    updateState() {
        // Ambil status dari memori mesin fisika
        const currentState = this.compData.state || 'off'; 
        const vOut = this.compData.simV_out || 0;

        // 1. Animasi warna lampu indikator virtual
        const statusLed = this.contentDiv.querySelector('.status-led');
        if (statusLed) {
            if (currentState === 'regulating') {
                statusLed.setAttribute('fill', '#22c55e'); // Hijau (Regulasi Sempurna 8V)
            } else if (currentState === 'dropout') {
                statusLed.setAttribute('fill', '#f59e0b'); // Oranye (Dropout, input kurang dari 10V)
            } else {
                statusLed.setAttribute('fill', '#1e293b'); // Padam
            }
        }

        // 2. Animasikan warna kabel yang terhubung
        const isInputActive = (currentState !== 'off');
        this.setPinActive('pin-in-0', isInputActive);
        this.setPinActive('pin-in-1', isInputActive);
        this.setPinActive('pin-out-0', vOut > 1.5);
    }
}
UIRegistry['ic_7808'] = IC7808UI;
UIRegistry['ic_7805'] = IC7805UI;

export class IC74164UI extends BaseUIComponent {
    static getDimensions() { return [140, 260]; }
    getSVG() {
        return `<svg width="140" height="260" viewBox="0 0 140 260">
            
            <!-- ===================== BODI IC ===================== -->
            <!-- Persegi panjang dengan warna Cream (#fef3c7) -->
            <rect x="30" y="10" width="80" height="240" rx="4" fill="#e8e6d3" stroke="#1d2024" stroke-width="2"/>
            
            <!-- Lekukan (Notch) penanda pin 1 di bagian atas -->
            <path d="M 60 10 A 10 10 0 0 0 80 10" fill="none" stroke="#475569" stroke-width="2"/>

            <!-- ================= KABEL PIN INPUT (KIRI) ================= -->
            <!-- Warna kabel diubah menjadi Hijau (#16a34a) -->
            
            <!-- Input 0: A -->
            <line class="pin-in-0" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="38" y="44" font-size="10" fill="#475569" font-weight="bold">A</text>

            <!-- Input 1: B -->
            <line class="pin-in-1" x1="0" y1="80" x2="30" y2="80" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="38" y="84" font-size="10" fill="#475569" font-weight="bold">B</text>

            <!-- Input 2: CLR (Clear/Reset) -->
            <line class="pin-in-2" x1="0" y1="160" x2="30" y2="160" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="38" y="164" font-size="10" fill="#475569" font-weight="bold">CLR</text>
            <!-- Lingkaran kecil penanda Aktif-Rendah -->
            <circle cx="26" cy="160" r="2.5" fill="#fef3c7" stroke="#006600" stroke-width="1.5"/>

            <!-- Input 3: CLK (Clock) -->
            <line class="pin-in-3" x1="0" y1="200" x2="30" y2="200" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="45" y="204" font-size="10" fill="#475569" font-weight="bold">CLK</text>
            <!-- Simbol Segitiga untuk Clock Edge -->
            <polyline points="30,195 38,200 30,205" fill="none" stroke="#475569" stroke-width="1.5"/>

            <!-- ================= KABEL PIN OUTPUT (KANAN) ================= -->
            <!-- Warna kabel diubah menjadi Hijau (#16a34a) -->
            
            <!-- QA -->
            <line class="pin-out-0" x1="140" y1="30" x2="110" y2="30" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="34" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QA</text>
            
            <!-- QB -->
            <line class="pin-out-1" x1="140" y1="60" x2="110" y2="60" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="64" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QB</text>

            <!-- QC -->
            <line class="pin-out-2" x1="140" y1="90" x2="110" y2="90" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="94" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QC</text>

            <!-- QD -->
            <line class="pin-out-3" x1="140" y1="120" x2="110" y2="120" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="124" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QD</text>

            <!-- QE -->
            <line class="pin-out-4" x1="140" y1="150" x2="110" y2="150" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="154" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QE</text>

            <!-- QF -->
            <line class="pin-out-5" x1="140" y1="180" x2="110" y2="180" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="184" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QF</text>

            <!-- QG -->
            <line class="pin-out-6" x1="140" y1="210" x2="110" y2="210" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="214" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QG</text>

            <!-- QH -->
            <line class="pin-out-7" x1="140" y1="240" x2="110" y2="240" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <text x="102" y="244" font-size="10" fill="#475569" font-weight="bold" text-anchor="end">QH</text>

            <!-- Nama Komponen di Tengah (Ditulis Vertikal dengan warna Gelap) -->
            <text x="60" y="130" font-size="14" font-weight="bold" fill="#1e293b" text-anchor="middle" transform="rotate(-90 70 130)">
                74164
            </text>
        </svg>`;
    }

    updateState(_isSimActive) {
        // Ambil array tegangan output dari Model
        const outV = this.compData.outVoltages || new Array(8).fill(0);

        // Update indikator warna pada setiap kaki output (QA sampai QH)
        // Kaki akan menyala terang (hijau/merah tergantung tema) jika tegangan > 2.5V
        for (let i = 0; i < 8; i++) {
            const isActive = outV[i] > 2.5;
            this.setPinActive(`pin-out-${i}`, isActive);
        }

        // Opsional: Anda juga bisa memberikan efek visual pada pin CLK saat berdetak
        const inStates = this.compData.inputStates || [0,0,0,0];
        this.setPinActive('pin-in-3', inStates[3] === 1); // Kedipkan kabel Clock
    }
}

UIRegistry['ic_74164'] = IC74164UI;