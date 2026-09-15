// File: src/components/sensors/IRSensorUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class IRSensorUI extends BaseUIComponent {
    static getDimensions() { return [120, 200]; }

    getSVG() {
        return `<svg width="120" height="200" viewBox="0 0 120 200">
            <!-- Papan PCB (Biru) -->
            <rect x="10" y="30" width="100" height="150" rx="4" fill="#2468d6" stroke="#0f172a" stroke-width="2"/>
            
            <!-- 1. IR Emitter (Bening - Kiri) -->
            <circle cx="35" cy="20" r="14" fill="#bae6fd" stroke="#0ea5e9" stroke-width="3"/>
            
            <!-- 2. IR Receiver (Hitam - Kanan) -->
            <circle cx="85" cy="20" r="14" fill="#020617" stroke="#334155" stroke-width="3"/>

            <!-- ========================================== -->
            <!-- 3. BARISAN 5 RESISTOR SMD -->
            <!-- (Berada persis di antara LED IR dan IC/Trimpot) -->
            <!-- ========================================== -->
            <!-- SMD 1 -->
            <rect x="24" y="55" width="8" height="12" fill="#0f172a"/> <!-- Bodi -->
            <rect x="24" y="50" width="8" height="5" fill="#cbd5e1"/>  <!-- Pad Atas -->
            <rect x="24" y="67" width="8" height="5" fill="#cbd5e1"/>  <!-- Pad Bawah -->
            
            <!-- SMD 2 -->
            <rect x="40" y="55" width="8" height="12" fill="#0f172a"/>
            <rect x="40" y="50" width="8" height="5" fill="#cbd5e1"/>
            <rect x="40" y="67" width="8" height="5" fill="#cbd5e1"/>
            
            <!-- SMD 3 (Tengah) -->
            <rect x="55" y="55" width="8" height="12" fill="#0f172a"/>
            <rect x="55" y="50" width="8" height="5" fill="#cbd5e1"/>
            <rect x="55" y="67" width="8" height="5" fill="#cbd5e1"/>
            
            <!-- SMD 4 -->
            <rect x="70" y="55" width="8" height="12" fill="#0f172a"/>
            <rect x="70" y="50" width="8" height="5" fill="#cbd5e1"/>
            <rect x="70" y="67" width="8" height="5" fill="#cbd5e1"/>
            
            <!-- SMD 5 -->
            <rect x="85" y="55" width="8" height="12" fill="#0f172a"/>
            <rect x="85" y="50" width="8" height="5" fill="#cbd5e1"/>
            <rect x="85" y="67" width="8" height="5" fill="#cbd5e1"/>

            <!-- 3. Dua Komponen SMD (Resistor) di antara LED dan Trimpot -->
            <!-- SMD 1 (Kiri) -->
            <rect x="31" y="120" width="12" height="8" fill="#0f172a"/>
            <rect x="26" y="120" width="5" height="8" fill="#cbd5e1"/>
            <rect x="43" y="120" width="5" height="8" fill="#cbd5e1"/>
            
            <!-- SMD 2 (Kanan) -->
            <rect x="75" y="120" width="12" height="8" fill="#0f172a"/>
            <rect x="70" y="120" width="5" height="8" fill="#cbd5e1"/>
            <rect x="87" y="120" width="5" height="8" fill="#cbd5e1"/>

            <!-- 4. IC LM393 Komparator (Kiri Tengah, Diputar Horizontal 90 Derajat) -->
            <!-- Bodi IC (Lebar memanjang, tinggi memendek) -->
            <rect x="15" y="85" width="40" height="24" rx="1" fill="#0f172a"/>
            <circle cx="19" cy="89" r="1.5" fill="#334155"/> <!-- Titik Pin 1 (Kiri Atas) -->
            <!-- Teks tidak perlu di-rotate karena IC-nya sudah horizontal -->
            <text x="30" y="99" font-size="5" fill="#475569" font-weight="bold" text-anchor="middle">LM393</text>
            
            <!-- 8 Kaki Pin SMD IC (Kini berada di Atas dan Bawah) -->
            <!-- Kaki Atas (Pin 1 sampai 4) -->
            <rect x="20" y="82" width="3" height="4" fill="#cbd5e1"/>
            <rect x="28" y="82" width="3" height="4" fill="#cbd5e1"/>
            <rect x="36" y="82" width="3" height="4" fill="#cbd5e1"/>
            <rect x="44" y="82" width="3" height="4" fill="#cbd5e1"/>
            <!-- Kaki Bawah (Pin 5 sampai 8) -->
            <rect x="20" y="108" width="3" height="4" fill="#cbd5e1"/>
            <rect x="28" y="108" width="3" height="4" fill="#cbd5e1"/>
            <rect x="36" y="108" width="3" height="4" fill="#cbd5e1"/>
            <rect x="44" y="108" width="3" height="4" fill="#cbd5e1"/>

            <!-- 5. Potensiometer Kalibrasi (Kanan Tengah) -->
            <rect x="60" y="80" width="43" height="34" rx="2" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
            <circle cx="82" cy="97" r="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
            <line x1="75" y1="97" x2="89" y2="97" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
            <line x1="82" y1="90" x2="82" y2="104" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>

            <!-- 6. Lubang Baut / Mounting Hole (Di Tengah Bawah) -->
            <circle cx="60" cy="145" r="10" fill="#dbe1f0"/>
            <circle cx="60" cy="145" r="10" fill="none" stroke="#131212" stroke-width="1.5"/> <!-- Cincin Tembaga -->

            <!-- 7. POWER LED (Kiri Lubang) -->
            <rect x="23" y="138" width="14" height="14" rx="1" fill="#0f172a"/>
            <circle class="power-led" cx="30" cy="145" r="5" fill="#475569"/>
            <text x="30" y="160" font-size="8" font-weight="bold" fill="#93c5fd" text-anchor="middle">PWR</text>

            <!-- 8. OBSTACLE LED (Kanan Lubang) -->
            <rect x="83" y="138" width="14" height="14" rx="1" fill="#0f172a"/>
            <circle class="obs-led" cx="90" cy="145" r="5" fill="#475569"/>
            <text x="90" y="160" font-size="8" font-weight="bold" fill="#93c5fd" text-anchor="middle">OBS</text>

            <!-- 9. 3 PIN KONEKTOR BAWAH -->
            <!-- OUT (Output 0) -->
            <line class="pin-out-0" x1="30" y1="200" x2="30" y2="180" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
            <text x="30" y="175" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 30 170)">OUT</text>
            
            <!-- GND (Input 1) -->
            <line class="pin-in-1" x1="60" y1="200" x2="60" y2="180" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>
            <text x="60" y="175" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 60 170)">GND</text>
            
            <!-- VCC (Input 0) -->
            <line class="pin-in-0" x1="90" y1="200" x2="90" y2="180" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
            <text x="90" y="175" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 90 190)">VCC</text>
        </svg>`;
    }

    updateState(isSimActive) {
        const pwrLed = this.contentDiv.querySelector('.power-led');
        const obsLed = this.contentDiv.querySelector('.obs-led');
        
        const jarakCm = parseFloat(this.compData.state) || 50;
        const isPowered = this.compData.isPowered || false;
        
        // Logika 1: Power LED hanya menyala (Hijau) jika VCC dan GND tersambung 5V
        if (pwrLed) {
            pwrLed.setAttribute('fill', (isPowered && isSimActive) ? '#22c55e' : '#475569');
        }

        // Logika 2: Obstacle LED hanya menyala (Merah) jika sensor hidup DAN ada objek dekat (<= 20cm)
        if (obsLed) {
            if (isPowered && isSimActive && jarakCm <= 20) {
                obsLed.setAttribute('fill', '#ef4444'); 
            } else {
                obsLed.setAttribute('fill', '#475569'); 
            }
        }
    }
}
UIRegistry['ir_sensor'] = IRSensorUI;