// File: src/components/indicators/LCD16x2UI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class LCD16x2UI extends BaseUIComponent {    
    static getDimensions() { return [200, 130]; }
    getSVG() {
        return `<svg width="200" height="130" viewBox="0 0 200 130">
            <!-- Papan PCB (Teal/Hijau Tua) -->
            <rect x="0" y="0" width="200" height="110" rx="4" fill="#0f766e" stroke="#0f172a" stroke-width="2"/>
            
            <!-- 4 Lubang Baut Sudut (Disesuaikan dengan lebar 200 dan tinggi 110) -->
            <circle cx="10" cy="10" r="3" fill="#0f172a"/>
            <circle cx="190" cy="10" r="3" fill="#0f172a"/>
            <circle cx="10" cy="100" r="3" fill="#0f172a"/>
            <circle cx="190" cy="100" r="3" fill="#0f172a"/>
            
            <!-- Bezel Besi (Dilebarkan menjadi 170x60) -->
            <rect x="15" y="15" width="170" height="60" rx="2" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            
            <!-- Kaca Layar (Dilebarkan menjadi 160x50) -->
            <rect class="lcd-screen" x="20" y="20" width="160" height="50" fill="#475569" stroke="#0f172a" stroke-width="1"/>
            
            <!-- Teks LCD Baris 1 & 2 (Diperbesar font-nya jadi 16 dan digeser ke tengah) -->
            <text class="lcd-text-0" x="25" y="40" font-family="monospace" font-size="16" font-weight="bold" fill="none" xml:space="preserve">                </text>
            <text class="lcd-text-1" x="25" y="62" font-family="monospace" font-size="16" font-weight="bold" fill="none" xml:space="preserve">                </text>

            <!-- Teks Merek Modul -->
            <text x="185" y="90" font-size="10" fill="#ffffff" font-weight="bold" text-anchor="end">LCD 1602 I2C</text>

            <!-- 4 PIN I2C-->
            <!-- Pin 0: GND -->
            <line class="pin-in-0" x1="70" y1="130" x2="70" y2="110" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
            <text x="70" y="105" font-size="8" fill="#ffffff" font-weight="bold" text-anchor="middle" transform="rotate(-90 70 123)">GND</text>
            
            <!-- Pin 1: VCC -->
            <line class="pin-in-1" x1="90" y1="130" x2="90" y2="110" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
            <text x="90" y="105" font-size="8" fill="#ffffff" font-weight="bold" text-anchor="middle" transform="rotate(-90 90 123)">VCC</text>
            
            <!-- Pin 2: SDA (Kuning) -->
            <line class="pin-in-2" x1="110" y1="130" x2="110" y2="110" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
            <text x="110" y="105" font-size="8" fill="#ffffff" font-weight="bold" text-anchor="middle" transform="rotate(-90 110 123)">SDA</text>
            
            <!-- Pin 3: SCL (Biru Muda) -->
            <line class="pin-in-3" x1="130" y1="130" x2="130" y2="110" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
            <text x="130" y="105" font-size="8" fill="#ffffff" font-weight="bold" text-anchor="middle" transform="rotate(-90 130 123)">SCL</text>
        </svg>`;
    }

    // Fungsi Animasi Layar Nyala/Mati & Render Teks
    updateState(isSimActive) {
        const screen = this.contentDiv.querySelector('.lcd-screen');
        const text0 = this.contentDiv.querySelector('.lcd-text-0');
        const text1 = this.contentDiv.querySelector('.lcd-text-1');

        // Cek apakah mendapat suplai 5V dari mesin fisika
        const isPowered = this.compData.isPowered || false;

        if (isPowered && isSimActive) {
            // LCD ON: Layar menjadi hijau stabilo, teks menjadi hitam
            if (screen) screen.setAttribute('fill', '#84cc28');
            if (text0) {
                text0.setAttribute('fill', '#1a2e05');
                // Render baris 1 (index 0)
                text0.textContent = (this.compData.lcdText && this.compData.lcdText[0]) ? this.compData.lcdText[0] : "                ";
            }
            if (text1) {
                text1.setAttribute('fill', '#1a2e05');
                // Render baris 2 (index 1)
                text1.textContent = (this.compData.lcdText && this.compData.lcdText[1]) ? this.compData.lcdText[1] : "                ";
            }
        } else {
            // LCD OFF: Layar mati (abu-abu), teks tak terlihat (transparan)
            if (screen) screen.setAttribute('fill', '#475569');
            if (text0) {
                text0.setAttribute('fill', 'none');
                text0.textContent = "                ";
            }
            if (text1) {
                text1.setAttribute('fill', 'none');
                text1.textContent = "                ";
            }
        }
    }
}

UIRegistry['lcd_16x2'] = LCD16x2UI;