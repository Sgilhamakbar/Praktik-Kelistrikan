// File: src/components/logic/ArduinoUnoUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class ArduinoUnoUI extends BaseUIComponent {
    static getDimensions() { return [410, 280]; }

    getSVG() {
        let svg = `<svg width="410" height="280" viewBox="0 0 410 280">

            <!-- Papan Dasar PCB Arduino -->
            <rect x="10" y="15" width="390" height="250" rx="8" fill="#0063a5" stroke="#0378a7" stroke-width="2.5"/>

            <!-- Port USB Logam (Kiri Atas) -->
            <rect x="2" y="60" width="46" height="42" rx="3" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
            <rect x="2" y="70" width="30" height="22" rx="2" fill="#64748b"/>
            <rect x="10" y="53" width="8" height="6" fill="#64748b"/>
            <rect x="10" y="103" width="8" height="6" fill="#64748b"/>

            <!-- DC Barrel Jack (Kiri Bawah) -->
            <rect x="2" y="185" width="55" height="46" rx="3" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
            <rect x="18" y="195" width="35" height="26" fill="#0f172a"/>
            <rect x="58" y="201" width="5" height="15" rx="1.5" fill="#3f5272"/>
            <rect x="56" y="195.5" width="5" height="25" rx="1.5" fill="#253247"/>
            
            <!-- Mounting Holes -->
            <circle cx="55" cy="25" r="7" fill="#ffffff" opacity="0.9"/>
            <circle cx="55" cy="25" r="4" fill="#005d60"/>
            <circle cx="55" cy="252" r="7" fill="#ffffff" opacity="0.9"/>
            <circle cx="55" cy="252" r="4" fill="#005d60"/>
            <circle cx="375" cy="85" r="7" fill="#ffffff" opacity="0.9"/>
            <circle cx="375" cy="85" r="4" fill="#005d60"/>
            <circle cx="375" cy="215" r="7" fill="#ffffff" opacity="0.9"/>
            <circle cx="375" cy="215" r="4" fill="#005d60"/>

            <!-- Tombol RESET -->
            <rect x="18" y="20" width="22" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
            <circle cx="29" cy="30" r="7.5" fill="#dc2626"/>
            <rect x="39" y="22" width="5" height="3" fill="#94a3b8"/>
            <rect x="39" y="37" width="5" height="3" fill="#94a3b8"/>
            <rect x="13" y="37" width="5" height="3" fill="#94a3b8"/>
            <rect x="13" y="29" width="5" height="4" fill="#94a3b8"/>
            <rect x="13" y="22" width="5" height="3" fill="#94a3b8"/>
            <text x="29" y="52" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">RESET</text>

            <!-- ICSP2 (USB Controller) -->
            <rect x="63.5" y="43" width="30" height="10" fill="#1e293b" rx="1"/>
            <rect x="66" y="45" width="7" height="6" fill="#979797" rx="1"/>
            <rect x="75" y="45" width="7" height="6" fill="#979797" rx="1"/>
            <rect x="84" y="45" width="7" height="6" fill="#979797" rx="1"/>
            <rect x="66.5" y="46.5" width="24" height="3" fill="#ffffff" rx="1"/>
            <rect x="63.5" y="53" width="30" height="10" fill="#1e293b" rx="1"/>
            <rect x="66" y="55" width="7" height="6" fill="#979797" rx="1"/>
            <rect x="75" y="55" width="7" height="6" fill="#979797" rx="1"/>
            <rect x="84" y="55" width="7" height="6" fill="#979797" rx="1"/>
            <rect x="66.5" y="56.5" width="24" height="3" fill="#ffffff" rx="1"/>
            <text x="80" y="70" font-size="5.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">ICSP2</text>

            <!-- Chip USB ATmega16U2 -->
            <rect x="90" y="80" width="22" height="22" rx="2" fill="#1e293b" stroke="#0f172a"/>

            <!-- Regulator Tegangan -->
            <rect x="38" y="135" width="20" height="30" rx="2" fill="#1e293b"/>
            <rect x="58" y="140" width="7" height="4" fill="#94a3b8"/>
            <rect x="58" y="147" width="7" height="4" fill="#94a3b8"/>
            <rect x="58" y="154" width="7" height="4" fill="#94a3b8"/>
            <rect x="29" y="142" width="10" height="15" fill="#94a3b8"/>

            <!-- SMD (Pin Header) -->
            <rect x="90" y="250" width="15" height="10" fill="#0f172a"/>
            <rect x="82" y="250" width="8" height="10" fill="#cbd5e1"/>
            <rect x="105" y="250" width="8" height="10" fill="#cbd5e1"/>

            <!-- 2 Kapasitor SMD Elektrolit (Digeser ke Kanan, r=13.5) -->
<!-- Kapasitor 1 (Kiri: cx=86, cy=205) -->
<g id="smd-cap-1">
    <polygon points="75,189 97,189 102,194 102,216 97,221 75,221 70,216 70,194" fill="#1e293b"/>
    <circle cx="86" cy="205" r="13.5" fill="#C0C0C0"/>
    <path d="M 74.5 212 A 13.5 13.5 0 0 0 97.5 212 Z" fill="#0f172a"/>
</g>

<!-- Kapasitor 2 (Kanan: cx=120, cy=205) -->
<g id="smd-cap-2">
    <polygon points="109,189 131,189 136,194 136,216 131,221 109,221 104,216 104,194" fill="#1e293b"/>
    <circle cx="120" cy="205" r="13.5" fill="#C0C0C0"/>
    <path d="M 108.5 212 A 13.5 13.5 0 0 0 131.5 212 Z" fill="#0f172a"/>
</g>

            <!-- Chip ATmega328P DIP-28 -->
            <g stroke="#94a3b8" stroke-width="2.2" stroke-linecap="butt">
                ${Array.from({length: 14}, (_, k) => `
                    <line x1="${190 + k*12}" y1="156" x2="${190 + k*12}" y2="160"/>
                    <line x1="${190 + k*12}" y1="198" x2="${190 + k*12}" y2="202"/>
                `).join('')}
            </g>
            <rect x="182" y="160" width="172" height="38" rx="3" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
            <path d="M 182 174 A 5 5 0 0 1 182 184 Z" fill="#0f172a"/>
            <text x="268" y="183" font-size="8.5" fill="#94a3b8" font-family="monospace" letter-spacing="2" font-weight="bold" text-anchor="middle">ATMEGA328P-PU</text>

            <!-- ICSP Utama (Kanan) -->
            <rect x="354.5" y="110" width="10" height="30" fill="#1e293b" rx="1"/>
            <rect x="358" y="123" width="4" height="4" fill="#979797" rx="1"/>
            <rect x="358" y="113" width="4" height="4" fill="#979797" rx="1"/>
            <rect x="358" y="133" width="4" height="4" fill="#979797" rx="1"/>
            <rect x="365" y="110" width="10" height="30" fill="#1e293b" rx="1"/>
            <rect x="368" y="123" width="4" height="4" fill="#979797" rx="1"/>
            <rect x="368" y="113" width="4" height="4" fill="#979797" rx="1"/>
            <rect x="368" y="133" width="4" height="4" fill="#979797" rx="1"/>
            <text x="343" y="125" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 343 125)">ICSP</text>    

            <!-- LED Indikator (L, TX, RX, ON) -->
            <text x="126" y="66" font-size="6.5" font-weight="bold" fill="#ffffff">L</text>
            <rect x="133" y="60" width="9" height="6" rx="1" fill="#facc15" stroke="#ca8a04"/>

            <text x="120" y="84" font-size="6.5" font-weight="bold" fill="#ffffff">TX</text>
            <rect x="133" y="78" width="9" height="6" rx="1" fill="#facc15" stroke="#ca8a04"/>
            <text x="120" y="97" font-size="6.5" font-weight="bold" fill="#ffffff">RX</text>
            <rect x="133" y="91" width="9" height="6" rx="1" fill="#facc15" stroke="#ca8a04"/>

            <rect x="328" y="88" width="9" height="6" rx="1" fill="#22c55e" stroke="#16a34a"/>
            <text x="342" y="93" font-size="6.5" font-weight="bold" fill="#ffffff">ON</text>

            <!-- Silkscreen Teks & Logo Arduino UNO -->
            <line x1="200" y1="60" x2="368" y2="60" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
            <text x="285" y="55" font-size="8" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">DIGITAL (PWM)</text>

            <g transform="translate(195, 62)">
                <circle cx="12" cy="19" r="14" fill="none" stroke="#ffffff" stroke-width="2.5"/>
                <line x1="7" y1="19" x2="17" y2="19" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="40" cy="19" r="14" fill="none" stroke="#ffffff" stroke-width="2.5"/>
                <line x1="35" y1="19" x2="45" y2="19" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="40" y1="14" x2="40" y2="24" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <rect x="63" y="5" width="55" height="25" rx="11" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2 1"/>
                <text x="90" y="25" font-size="20" font-family="sans-serif" font-weight="500" fill="#ffffff" text-anchor="middle">UNO</text>
                <text x="20" y="48" font-size="12" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">Arduino</text>
            </g>

            <!-- Tombol Trigger Kode -->
            <text class="anim-text comp-label val-trigger" x="140" y="125" text-anchor="middle" font-size="10" font-weight="bold" fill="#fde047" style="cursor:pointer; pointer-events:auto;">
                &lt; Klik untuk Edit Kode &gt;
            </text>

            <!-- Label Bawah -->
            <line x1="145" y1="230" x2="252" y2="230" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
            <text x="198" y="226" font-size="7.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">POWER</text>

            <line x1="270" y1="230" x2="360" y2="230" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
            <text x="315" y="226" font-size="7.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">ANALOG IN</text>

            <!-- Header Soket Pin -->
            <!-- Header Atas (Digital + GND + AREF) -->
            <rect x="68" y="15" width="310" height="12" fill="#1e293b" stroke="#0f172a" stroke-width="1"/>
            
            <!-- Header Bawah (Power & Analog) -->
            <rect x="122" y="253" width="135" height="12" fill="#1e293b" stroke="#0f172a" stroke-width="1"/> 
            <rect x="263" y="253" width="115" height="12" fill="#1e293b" stroke="#0f172a" stroke-width="1"/>
        `;

        // ==========================================
// 1. GENERATOR PIN DIGITAL (SATU PER SATU)
// ==========================================

// Fungsi bantuan perender pin digital atas
const renderDigitalPin = (id, name, color, xPos) => `
    <rect x="${xPos - 3}" y="17" width="6" height="7" rx="1" fill="#0f172a"/>
    <line class="pin-in-${id}" x1="${xPos}" y1="0" x2="${xPos}" y2="15" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <text x="${xPos}" y="38" font-size="7.5" fill="#ffffff" font-weight="bold" text-anchor="middle" transform="rotate(-90 ${xPos} 38)">${name}</text>
`;

// Atur posisi X masing-masing pin Digital di sini:
let x_d0  = 370;
let x_d1  = 350;
let x_d2  = 330;
let x_d3  = 310;
let x_d4  = 290;
let x_d5  = 270;
let x_d6  = 250;
let x_d7  = 230;
// Gap header antara D7 dan D8 (16px)
let x_d8  = 210;
let x_d9  = 190;
let x_d10 = 170;
let x_d11 = 150;
let x_d12 = 130;
let x_d13 = 110;
let x_d14 = 90;
let x_d15 = 70;

svg += renderDigitalPin(0,  'D0', 'currentColor', x_d0);
svg += renderDigitalPin(1,  'D1', 'currentColor', x_d1);
svg += renderDigitalPin(2,  'D2',    'currentColor', x_d2);
svg += renderDigitalPin(3,  'D3',   'currentColor', x_d3);
svg += renderDigitalPin(4,  'D4',    'currentColor', x_d4);
svg += renderDigitalPin(5,  'D5',   'currentColor', x_d5);
svg += renderDigitalPin(6,  'D6',   'currentColor', x_d6);
svg += renderDigitalPin(7,  'D7',    'currentColor', x_d7);
svg += renderDigitalPin(8,  'D8',    'currentColor', x_d8);
svg += renderDigitalPin(9,  'D9',   'currentColor', x_d9);
svg += renderDigitalPin(10, 'D10',  'currentColor', x_d10);
svg += renderDigitalPin(11, 'D11',  'currentColor', x_d11);
svg += renderDigitalPin(12, 'D12',   'currentColor', x_d12);
svg += renderDigitalPin(13, 'D13',   'currentColor', x_d13);
svg += renderDigitalPin(27, 'GND',   '#22c55e', x_d14);
svg += renderDigitalPin(28, 'AREF',  '#94a3b8', x_d15);

        // ==========================================
// 2. GENERATOR PIN ANALOG
// ==========================================

// Fungsi bantuan perender pin (jika belum didefinisikan sebelumnya)
const renderAnalogPin = (id, name, color, xPos) => `
    <rect x="${xPos - 3}" y="255" width="6" height="7" rx="1" fill="#0f172a"/>
    <line class="pin-in-${id}" x1="${xPos}" y1="280" x2="${xPos}" y2="265" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <text x="${xPos}" y="245" font-size="7.5" fill="#ffffff" font-weight="bold" text-anchor="middle" transform="rotate(-90 ${xPos} 245)">${name}</text>
`;

// Atur posisi X masing-masing pin Analog di sini:
let x_a0 = 270;
let x_a1 = 290;
let x_a2 = 310;
let x_a3 = 330;
let x_a4 = 350;
let x_a5 = 370;

svg += renderAnalogPin(14, 'A0', 'currentColor', x_a0);
svg += renderAnalogPin(15, 'A1', 'currentColor', x_a1);
svg += renderAnalogPin(16, 'A2', 'currentColor', x_a2);
svg += renderAnalogPin(17, 'A3', 'currentColor', x_a3);
svg += renderAnalogPin(18, 'A4', 'currentColor', x_a4);
svg += renderAnalogPin(19, 'A5', 'currentColor', x_a5);

        // ==========================================
// 3. GENERATOR PIN POWER
// ==========================================

// Fungsi bantuan agar kode tetap rapi (hanya merender elemen SVG per pin)
const renderPin = (id, name, color, xPos) => `
    <rect x="${xPos - 3}" y="255" width="6" height="7" rx="1" fill="#0f172a"/>
    <line class="pin-in-${id}" x1="${xPos}" y1="280" x2="${xPos}" y2="265" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <text x="${xPos}" y="245" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle" transform="rotate(-90 ${xPos} 245)">${name}</text>
`;

// Atur koordinat X masing-masing pin di sini:
let x_ioref = 130;
let x_reset = 150;
let x_3v3   = 170;
let x_5v    = 190;
let x_gnd1  = 210;
let x_gnd2  = 230;
let x_vin   = 250;

svg += renderPin(20, 'IOREF', '#94a3b8', x_ioref);
svg += renderPin(21, 'RESET', '#facc15', x_reset);
svg += renderPin(22, '3V3',   '#f97316', x_3v3);
svg += renderPin(23, '5V',    '#ef4444', x_5v);
svg += renderPin(24, 'GND',   '#22c55e', x_gnd1);
svg += renderPin(25, 'GND',   '#22c55e', x_gnd2);
svg += renderPin(26, 'VIN',   '#38bdf8', x_vin);

        svg += `</svg>`;
        return svg;
    }

    updateState(isSimActive) {
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            if (isSimActive) {
                txtVal.textContent = "⚙️ RUNNING...";
                txtVal.setAttribute('fill', '#22c55e');
            } else {
                txtVal.textContent = "< Klik untuk Edit Kode >";
                txtVal.setAttribute('fill', '#fde047');
            }
        }

        if (this.compData && this.compData.pinTargets) {
            for (let i = 0; i <= 28; i++) { 
        const isActive = this.compData.pinTargets[i] > 2.5;
        this.setPinActive(`pin-in-${i}`, isActive);
    }
}
    }
}

UIRegistry['arduino_uno'] = ArduinoUnoUI;