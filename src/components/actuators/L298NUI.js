// File: src/components/actuators/L298NUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class L298NUI extends BaseUIComponent {
    static getDimensions() { return [250, 210]; }
    getSVG() {
        return `<svg width="250" height="210" viewBox="0 0 250 210">
            <!-- Papan PCB Merah -->
            <rect x="20" y="40" width="215" height="150" rx="5" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
            <!-- Teks Silkscreen "L298N" Putih (Sesuai Posisi Asli di Gambar) -->
            <text x="47" y="30" font-size="16" font-family="'Courier New', Courier, monospace" font-weight="900" fill="#ffffff" letter-spacing="1">IC L298N</text>

            <!-- 4 Lubang Baut -->
            <circle cx="30" cy="50" r="3.5" fill="#0f172a"/>
            <circle cx="225" cy="50" r="3.5" fill="#0f172a"/>
            <circle cx="30" cy="180" r="3.5" fill="#0f172a"/>
            <circle cx="225" cy="180" r="3.5" fill="#0f172a"/>

            <!-- ============================================== -->
            <!-- 1. DIODA SMD (KIRI & KANAN) Sesuai Gambar      -->
            <!-- ============================================== -->
            <g id="smd-diodes-left">
                <!-- Dioda 1 -->
                <rect x="25" y="57" width="3" height="6" fill="#cbd5e1"/><rect x="47" y="57" width="3" height="6" fill="#cbd5e1"/>
                <rect x="27" y="55" width="20" height="10" fill="#0f172a" rx="1"/><rect x="30" y="55" width="3" height="10" fill="#94a3b8"/>
                <!-- Dioda 2 -->
                <rect x="25" y="70" width="3" height="6" fill="#cbd5e1"/><rect x="47" y="70" width="3" height="6" fill="#cbd5e1"/>
                <rect x="27" y="68" width="20" height="10" fill="#0f172a" rx="1"/><rect x="30" y="68" width="3" height="10" fill="#94a3b8"/>
                <!-- Dioda 3 -->
                <rect x="25" y="83" width="3" height="6" fill="#cbd5e1"/><rect x="47" y="83" width="3" height="6" fill="#cbd5e1"/>
                <rect x="27" y="81" width="20" height="10" fill="#0f172a" rx="1"/><rect x="30" y="81" width="3" height="10" fill="#94a3b8"/>
                <!-- Dioda 4 -->
                <rect x="25" y="96" width="3" height="6" fill="#cbd5e1"/><rect x="47" y="96" width="3" height="6" fill="#cbd5e1"/>
                <rect x="27" y="94" width="20" height="10" fill="#0f172a" rx="1"/><rect x="30" y="94" width="3" height="10" fill="#94a3b8"/>
            </g>

            <g id="smd-diodes-right">
                <!-- Dioda 5 -->
                <rect x="203" y="57" width="3" height="6" fill="#cbd5e1"/><rect x="224" y="57" width="3" height="6" fill="#cbd5e1"/>
                <rect x="205" y="55" width="20" height="10" fill="#0f172a" rx="1"/><rect x="208" y="55" width="3" height="10" fill="#94a3b8"/>
                <!-- Dioda 6 -->
                <rect x="203" y="70" width="3" height="6" fill="#cbd5e1"/><rect x="224" y="70" width="3" height="6" fill="#cbd5e1"/>
                <rect x="205" y="68" width="20" height="10" fill="#0f172a" rx="1"/><rect x="208" y="68" width="3" height="10" fill="#94a3b8"/>
                <!-- Dioda 7 -->
                <rect x="203" y="83" width="3" height="6" fill="#cbd5e1"/><rect x="224" y="83" width="3" height="6" fill="#cbd5e1"/>
                <rect x="205" y="81" width="20" height="10" fill="#0f172a" rx="1"/><rect x="208" y="81" width="3" height="10" fill="#94a3b8"/>
                <!-- Dioda 8 -->
                <rect x="203" y="96" width="3" height="6" fill="#cbd5e1"/><rect x="224" y="96" width="3" height="6" fill="#cbd5e1"/>
                <rect x="205" y="94" width="20" height="10" fill="#0f172a" rx="1"/><rect x="208" y="94" width="3" height="10" fill="#94a3b8"/>
            </g>

            <!-- ============================================== -->
            <!-- 2. KAPASITOR ELEKTROLIT SMD                    -->
            <!-- ============================================== -->
            <!-- Kapasitor 1 (Kiri Tengah) -->
            <g id="smd-cap-1">
                <!-- Kotak Dudukan Hitam Chamfer (Terkalibrasi y: 102 - 138) -->
                <polygon points="67,102 93,102 98,107 98,133 93,138 67,138 62,133 62,107" fill="#1e293b"/>
                <!-- Tabung Silinder Aluminium Perak -->
                <circle cx="80" cy="120" r="15" fill="#C0C0C0"/>
                <!-- Tembereng Polaritas Hitam 1/4 Lebar (Terkalibrasi cy: 120) -->
                <path d="M 88 107.3 A 15 15 0 0 1 88 132.7 Z" fill="#0f172a"/>
            </g>

            <!-- Kapasitor 2 (Kanan Bawah) -->
            <g id="smd-cap-2">
                <!-- Kotak Dudukan Hitam Chamfer (Terkalibrasi y: 132 - 168) -->
                <polygon points="159,132 185,132 190,137 190,163 185,168 159,168 154,163 154,137" fill="#1e293b"/>
                <!-- Tabung Silinder Aluminium Perak -->
                <circle cx="172" cy="150" r="15" fill="#C0C0C0"/>
                <!-- Tembereng Polaritas Hitam 1/4 Lebar (Terkalibrasi cy: 150) -->
                <path d="M 180 137.3 A 15 15 0 0 1 180 162.7 Z" fill="#0f172a"/>
            </g>

            <!-- ============================================== -->
            <!-- 3. IC REGULATOR DPAK HORIZONTAL (78M05)        -->
            <!-- ============================================== -->
            <g id="ic-78m05" transform="translate(125, 90)">
                <rect x="42" y="12" width="9" height="20" fill="#cbd5e1" rx="1"/> <!-- Pelat Tab Kanan -->
                <rect x="12" y="12" width="8" height="4" fill="#cbd5e1"/> <!-- Pin Atas -->
                <rect x="15" y="20" width="6" height="4" fill="#cbd5e1"/> <!-- Pin Tengah -->
                <rect x="12" y="28" width="8" height="4" fill="#cbd5e1"/> <!-- Pin Bawah -->
                <rect x="20" y="10" width="23" height="25" fill="#0f172a" rx="1.5"/> <!-- Bodi Hitam -->
                <circle cx="25" cy="15" r="1.5" fill="#9ca4b1"/> <!-- Titik Indikator Pin 1 -->
            </g>

            <!-- ============================================== -->
            <!-- 1. HEATSINK HITAM & ic l298n BRACKET BAUT               -->
            <!-- ============================================== -->
            <g id="heatsink-unit">
                <!-- Sirip-Sirip Vertikal Heatsink Hitam (Celah menampilkan PCB Merah) -->
                <rect x="55" y="40" width="3" height="40" fill="#18181b" rx="1"/>
                <rect x="80" y="40" width="3" height="15" fill="#18181b" rx="1"/>
                <rect x="110" y="40" width="3" height="15" fill="#18181b" rx="1"/>
                <rect x="140" y="40" width="3" height="15" fill="#18181b" rx="1"/>
                <rect x="168" y="40" width="3" height="15" fill="#18181b" rx="1"/>
                <rect x="192" y="40" width="3" height="40" fill="#18181b" rx="1"/>

                <!-- Balok Dudukan Bawah Heatsink -->
                <rect x="55" y="53" width="140" height="8" fill="#18181b" rx="2"/>
                
                <!-- Baut Logam Kiri & Kanan Pengunci Heatsink -->
                <circle cx="68" cy="53" r="4.5" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <circle cx="68" cy="53" r="2" fill="#ffffff"/>
                <circle cx="182" cy="53" r="4.5" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <circle cx="182" cy="53" r="2" fill="#ffffff"/>

                <!-- Dudukan ICL928N  -->
                <rect x="60" y="60" width="130" height="4" fill="#C0C0C0" rx="2"/>
                <!-- Bodi IC L298N (Hitam) -->
                <rect x="60" y="64" width="130" height="15" fill="#0f172a" rx="2"/>
                <!-- Pin-Pin IC L298N (Hitam) -->
                <circle cx="71.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="70" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <circle cx="86.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="85" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <circle cx="101.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="100" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <circle cx="116.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="115" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <circle cx="131.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="130" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <circle cx="146.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="145" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <circle cx="161.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="160" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <circle cx="176.5" cy="92" r="3" fill="#94a3b8" stroke="#d4d4d4" stroke-width="1"/>
                <rect x="175" y="78" width="3" height="15" fill="#d1d1d1" rx="1"/>
                <!-- Teks Label IC L298N -->
                <text x="80" y="75" font-size="10" fill="#afb1b3" font-weight="bold" text-anchor="middle">L298N</text>
            </g>

            <!-- ============================================== -->
            <!-- 4. BLOK JUMPER 5VEN                            -->
            <!-- ============================================== -->
            <g id="jumper-5ven">
                <rect x="64" y="143" width="20" height="10" fill="#1e293b" rx="1"/>
                <rect x="66" y="145" width="7" height="6" fill="#979797" rx="1"/>
                <rect x="75" y="145" width="7" height="6" fill="#979797" rx="1"/>
                <rect x="66.5" y="146.5" width="15" height="3" fill="#ffffff" rx="1"/>
            </g>

            <!-- Terminal Output Kiri (Biru) - Motor A -->
            <rect x="20" y="120" width="30" height="40" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
            <circle cx="33" cy="130" r="5" fill="#dad9d9"/>
            <circle cx="33" cy="150" r="5" fill="#dad9d9"/>

            <!-- Terminal Output Kanan (Biru) - Motor B -->
            <rect x="205" y="120" width="30" height="40" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
            <circle cx="223" cy="130" r="5" fill="#dad9d9"/>
            <circle cx="223" cy="150" r="5" fill="#dad9d9"/>

            <!-- Terminal Power Bawah (Biru) DIPERLEBAR -->
            <rect x="40" y="170" width="60" height="20" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
            <circle cx="50" cy="180" r="5" fill="#dad9d9"/> <!-- 12V -->
            <circle cx="70" cy="180" r="5" fill="#dad9d9"/> <!-- GND -->
            <circle cx="90" cy="180" r="5" fill="#dad9d9"/> <!-- 5V -->

            <!-- Header Pin Input Logic (Hitam) -->
            <rect x="115" y="175" width="90" height="12" fill="#1e293b" rx="2"/>
            <rect x="105" y="170" width="10" height="20" fill="#1e293b" rx="1"/> // ENA
            <rect x="205" y="170" width="10" height="20" fill="#1e293b" rx="1"/> // ENB
            <rect x="108.5" y="175" width="3" height="10" fill="#d8dbdb" rx="1"/> <!-- ENA -->
            <rect x="208.5" y="175" width="3" height="10" fill="#d8dbdb" rx="1"/> <!-- ENB -->
            <circle cx="130" cy="181" r="2.5" fill="#d8dbdb"/> <!-- IN1 -->
            <circle cx="150" cy="181" r="2.5" fill="#d8dbdb"/> <!-- IN2 -->
            <circle cx="170" cy="181" r="2.5" fill="#d8dbdb"/> <!-- IN3 -->
            <circle cx="190" cy="181" r="2.5" fill="#d8dbdb"/> <!-- IN4 -->
 
            <text x="50" y="167" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">12V</text>
            <text x="70" y="167" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">GND</text>
            <text x="90" y="167" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">5V</text>
            
            <text x="110" y="167" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">ENA</text>
            <text x="130" y="174" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">IN1</text>
            <text x="150" y="174" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">IN2</text>
            <text x="170" y="174" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">IN3</text>
            <text x="190" y="174" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">IN4</text>
            <text x="207" y="168" font-size="7" fill="#ffffff" font-weight="bold" text-anchor="middle">ENB</text>

            <text x="30" y="117" font-size="6" fill="#ffffff" font-weight="bold" text-anchor="middle">OUT1</text>
            <text x="30" y="167" font-size="6" fill="#ffffff" font-weight="bold" text-anchor="middle">OUT2</text>
            <text x="224" y="117" font-size="6" fill="#ffffff" font-weight="bold" text-anchor="middle">OUT3</text>
            <text x="224" y="167" font-size="6" fill="#ffffff" font-weight="bold" text-anchor="middle">OUT4</text>
                        
            <!-- LED Power Indikator -->
            <circle class="anim-led" cx="130" cy="155" r="5" fill="#475569" stroke="#334155" stroke-width="2"/>
            <!-- SMD (Pin Header) -->
            <rect x="95" y="145" width="12" height="8" fill="#0f172a"/>
            <rect x="90" y="145" width="5" height="8" fill="#cbd5e1"/>
            <rect x="107" y="145" width="5" height="8" fill="#cbd5e1"/>

            <!-- ============================================== -->
            <!-- PIN KONEKTOR KABEL -->
            <!-- ============================================== -->
            <!-- Output Kiri -->
            <line class="pin-out-0" x1="10" y1="130" x2="20" y2="130" stroke="#eab308" stroke-width="4"/> 
            <line class="pin-out-1" x1="10" y1="150" x2="20" y2="150" stroke="#eab308" stroke-width="4"/> 
            
            <!-- Output Kanan -->
            <line class="pin-out-2" x1="235" y1="130" x2="245" y2="130" stroke="#eab308" stroke-width="4"/> 
            <line class="pin-out-3" x1="235" y1="150" x2="245" y2="150" stroke="#eab308" stroke-width="4"/> 

            <!-- Input Bawah (9 Pin Total) -->
            <line class="pin-in-0" x1="50" y1="210" x2="50" y2="190" stroke="#ef4444" stroke-width="4"/> <!-- 12V -->
            <line class="pin-in-1" x1="70" y1="210" x2="70" y2="190" stroke="#22c55e" stroke-width="4"/> <!-- GND -->
            <line class="pin-in-2" x1="90" y1="210" x2="90" y2="190" stroke="#ef4444" stroke-width="4"/> <!-- 5V -->
            
            <line class="pin-in-3" x1="110" y1="210" x2="110" y2="190" stroke="#f97316" stroke-width="4"/> <!-- ENA -->
            <line class="pin-in-4" x1="130" y1="210" x2="130" y2="190" stroke="#38bdf8" stroke-width="4"/> <!-- IN1 -->
            <line class="pin-in-5" x1="150" y1="210" x2="150" y2="190" stroke="#38bdf8" stroke-width="4"/> <!-- IN2 -->
            <line class="pin-in-6" x1="170" y1="210" x2="170" y2="190" stroke="#38bdf8" stroke-width="4"/> <!-- IN3 -->
            <line class="pin-in-7" x1="190" y1="210" x2="190" y2="190" stroke="#38bdf8" stroke-width="4"/> <!-- IN4 -->
            <line class="pin-in-8" x1="210" y1="210" x2="210" y2="190" stroke="#f97316" stroke-width="4"/> <!-- ENB -->
        </svg>`;
    }

    updateState(isSimActive) {
        const led = this.contentDiv.querySelector('.anim-led');
        // Nyalakan LED menjadi Merah Terang jika modul mendapat tegangan power (12V & GND)
        if (this.compData.isPowered && isSimActive) {
            if (led) led.setAttribute('fill', '#ef4444'); 
        } else {
            if (led) led.setAttribute('fill', '#475569'); 
        }
    }
}
UIRegistry['l298n'] = L298NUI;