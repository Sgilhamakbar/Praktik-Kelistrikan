// File: src/components/logic/HCSR04UI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class HCSR04UI extends BaseUIComponent {
    static getDimensions() { return [200, 130]; }

    getSVG() {
        return `<svg width="200" height="130" viewBox="0 0 200 130">
            <!-- Papan Biru (Diperlebar) -->
            <rect x="10" y="10" width="180" height="90" rx="5" fill="#0a70a3" stroke="#0a70a3" stroke-width="3"/>
            
            <!-- Silinder Kiri (T) -->
            <circle cx="45" cy="55" r="25" fill="#212224" stroke="#fbfcff" stroke-width="3"/>
            <circle cx="45" cy="55" r="15" fill="none" stroke="#9ca6b4" stroke-dasharray="3 3" stroke-width="2"/>
            <text x="45" y="61" font-size="16" font-weight="bold" fill="#f0f0f0" text-anchor="middle">T</text>
            
            <!-- Silinder Kanan (R) -->
            <circle cx="155" cy="55" r="25" fill="#212224" stroke="#fbfcff" stroke-width="3"/>
            <circle cx="155" cy="55" r="15" fill="none" stroke="#e6e8eb" stroke-dasharray="3 3" stroke-width="2"/>
            <text x="155" y="61" font-size="16" font-weight="bold" fill="#f0f0f0" text-anchor="middle">R</text>

            <!-- 🌟 TOMBOL MINUS (-) LANGSUNG DI KANVAS -->
            <g class="btn-minus" style="cursor:pointer; pointer-events:auto;">
                <rect class="btn-minus" x="53" y="15" width="18" height="12" rx="2" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
                <text class="btn-minus" x="62" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff" style="pointer-events:none;">-</text>
            </g>

            <!-- Teks Jarak Tengah (Klik teks untuk buka pengaturan Modal) -->
            <rect class="val-trigger" x="79" y="15" width="42" height="16" rx="2" fill="#0f172a" style="cursor:pointer; pointer-events:auto;"/>
            <text class="anim-text val-trigger" x="100" y="27" text-anchor="middle" font-size="12" font-weight="bold" fill="#22c55e" style="cursor:pointer; pointer-events:none;">50cm</text>
            
            <!-- 🌟 TOMBOL PLUS (+) LANGSUNG DI KANVAS -->
            <g class="btn-plus" style="cursor:pointer; pointer-events:auto;">
                <rect class="btn-plus" x="127" y="15" width="18" height="12" rx="2" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
                <text class="btn-plus" x="136" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff" style="pointer-events:none;">+</text>
            </g>

            <!-- Logo -->
            <text x="100" y="70" font-size="11" font-weight="bold" fill="#dde4e4" text-anchor="middle" opacity="0.8">
                HC-SR04
            </text>

            <!-- ================= KABEL PIN BAWAH ================= -->
            <!-- VCC (Input 0) di X==60 -->
            <line class="pin-in-0" x1="60" y1="130" x2="60" y2="100" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
            <text x="60" y="93" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 60 125)">VCC</text>
            
            <!-- TRIG (Input 1) di X=90 -->
            <line class="pin-in-1" x1="90" y1="130" x2="90" y2="100" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <text x="90" y="93" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 90 125)">TRIG</text>
            
            <!-- ECHO (Output 0) di X=120 -->
            <line class="pin-out-0" x1="110" y1="130" x2="110" y2="100" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <text x="110" y="93" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 120 125)">ECHO</text>
            
            <!-- GND (Input 2) di X=150 -->
            <line class="pin-in-2" x1="140" y1="130" x2="140" y2="100" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>
            <text x="140" y="93" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 150 125)">GND</text>
        </svg>`;
    }

    updateState(isSimActive) {
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            const dist = this.compData.state || 50;
            txtVal.textContent = `${dist}cm`;
            txtVal.setAttribute('fill', (this.compData.isPowered && isSimActive) ? '#22c55e' : '#64748b');
        }
    }
}
    
UIRegistry['hc_sr04'] = HCSR04UI;