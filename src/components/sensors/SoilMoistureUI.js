// File: src/components/sensors/SoilMoistureUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class SoilMoistureUI extends BaseUIComponent {
    static getDimensions() { return [180, 220]; }
getSVG() {
    return `<svg width="180" height="220" viewBox="0 0 180 220" style="overflow: visible; font-family: sans-serif;">
      <!-- ========================================== -->
      <!-- 1. PAPAN LOGIKA PCB (KIRI)                 -->
      <!-- ========================================== -->
      <g id="pcb-module" transform="translate(-2, 7) scale(0.72)">
        <!-- Papan PCB Utama (Dimensi Baru) -->
        <rect x="15" y="24" width="90" height="165" rx="3" fill="#2468d6"/>

        <!-- 4 Komponen SMD Atas -->
        <rect x="32" y="52" width="8" height="16" fill="#ffffff"/>
        <rect x="33" y="54" width="6" height="12" fill="#4b5563"/>
        <rect x="33" y="58" width="6" height="4" fill="#1f2937"/>

        <rect x="45" y="52" width="8" height="16" fill="#ffffff"/>
        <rect x="46" y="54" width="6" height="12" fill="#4b5563"/>
        <rect x="46" y="58" width="6" height="4" fill="#1f2937"/>

        <rect x="58" y="52" width="8" height="16" fill="#ffffff"/>
        <rect x="59" y="54" width="6" height="12" fill="#e5c07b"/>

        <rect x="71" y="52" width="8" height="16" fill="#ffffff"/>
        <rect x="72" y="54" width="6" height="12" fill="#e5c07b"/>

        <!-- IC Komparator LM393 -->
        <path d="M 25 79 v 6 M 33 79 v 6 M 41 79 v 6 M 49 79 v 6
                 M 25 110 v 6 M 33 110 v 6 M 41 110 v 6 M 49 110 v 6" 
              stroke="#d1d5db" stroke-width="2.5" stroke-linecap="square"/>
        <!-- Bodi IC (Lebar memanjang, tinggi memendek) -->
        <rect x="20" y="85" width="35" height="25" rx="1" fill="#0f172a"/>
        <circle cx="25" cy="90" r="1.5" fill="#1f2937"/>

        <!-- Trimmer Potensiometer Biru -->
        <rect x="63" y="78" width="38" height="38" rx="1" fill="#055db6"/>
        <circle cx="82" cy="97" r="9" fill="#ededf0"/>
        <line x1="77" y1="97" x2="87" y2="97" stroke="#a3a3a3" stroke-width="3" stroke-linecap="square"/>
        <line x1="82" y1="92" x2="82" y2="102" stroke="#a3a3a3" stroke-width="3" stroke-linecap="square"/>
        <circle cx="95" cy="110" r="2" fill="#e2e8f0"/>

        <!-- 2 Komponen SMD Tengah -->
        <rect x="35" y="124" width="16" height="8" fill="#ffffff"/>
        <rect x="37" y="125" width="12" height="6" fill="#4b5563"/>
        <rect x="40" y="125" width="6" height="6" fill="#1f2937"/>

        <rect x="68" y="124" width="16" height="8" fill="#ffffff"/>
        <rect x="70" y="125" width="12" height="6" fill="#4b5563"/>
        <rect x="73" y="125" width="6" height="6" fill="#1f2937"/>

        <!-- Lubang Baut PCB (Tepat di sumbu X=65) -->
        <circle cx="60" cy="148" r="10" fill="#080000"/>
        <circle cx="60" cy="148" r="8" fill="#ffffff"/>

        <!-- 2 Indikator LED kiri-->
        <rect x="31" y="140" width="8" height="16" fill="#a8a5a5"/>
        <rect x="32.5" y="143" width="5" height="10" fill="#f0dd33"/>
        <!-- 2 Indikator LED 2 kanan -->
        <rect x="78" y="140" width="8" height="16" fill="#a8a5a5"/>
        <rect x="79.5" y="143" width="5" height="10" fill="#f0dd33"/>

        <!-- Header Terminal Atas (2-Pin) -->
        <rect x="35" y="27" width="20" height="14" fill="#374151"/>
        <rect x="63" y="27" width="20" height="14" fill="#374151"/>
        <rect x="42" y="31" width="6" height="6" fill="#f3f4f6"/>
        <circle cx="45" cy="34" r="1.5" fill="#111827"/>
        <rect x="70" y="31" width="6" height="6" fill="#f3f4f6"/>
        <circle cx="73" cy="34" r="1.5" fill="#111827"/>

        <!-- Pin Output Atas -->
        <line class="pin-out-2" x1="45" y1="0" x2="45" y2="28" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>
        <line class="pin-out-3" x1="73" y1="0" x2="73" y2="28" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>
        <text x="90" y="40" font-size="14" font-weight="bold" fill="#f3f5f7" text-anchor="middle">+</text>
        <text x="29" y="38" font-size="14" font-weight="bold" fill="#f3f5f7" text-anchor="middle">-</text>
        
        <!-- Header Terminal Bawah -->
        <rect x="25" y="174" width="70" height="12" fill="#090a0c"/>
        <g fill="#f3f4f6" stroke="#9ca3af" stroke-width="0.5">
          <rect x="27.5" y="177" width="7" height="7"/>
          <rect x="44.5" y="177" width="7" height="7"/>
          <rect x="67.5" y="177" width="7" height="7"/>
          <rect x="84.5" y="177" width="7" height="7"/>
        </g>
        
        <!-- Pin Output Bawah (AO, DO, GND, VCC) -->
        <line class="pin-out-0" x1="31" y1="180" x2="31" y2="216" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/> <!-- AO -->
        <line class="pin-out-1" x1="48" y1="180" x2="48" y2="216" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/> <!-- DO -->
        <line class="pin-in-1" x1="71" y1="180" x2="71" y2="216" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/> <!-- GND -->
        <line class="pin-in-0" x1="88" y1="180" x2="88" y2="216" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/> <!-- VCC -->
        </g>

        <!-- Label Pin Output Bawah -->
        <text x="20" y="130" font-size="6" font-weight="bold" fill="#f3f5f7" text-anchor="middle">AO</text>
        <text x="33" y="130" font-size="6" font-weight="bold" fill="#f3f5f7" text-anchor="middle">DO</text>
        <text x="48" y="130" font-size="6" font-weight="bold" fill="#f3f5f7" text-anchor="middle">GND</text>
        <text x="62" y="130" font-size="6" font-weight="bold" fill="#f3f5f7" text-anchor="middle">VCC</text>

     <defs>
        <!-- Template 1 Cabang Garpu / Probe (Desain Solid Sesuai Gambar, Tanpa Lubang) -->
        <g id="probe-fork">
          <!-- Badan probe: Fill abu-abu gelap (#4b5563) dengan Border abu-abu terang (#9ca3af) -->
          <path d="M 2 88 V 345 L 18 365 H 24 L 40 345 V 88 Z" 
                fill="#4b5563" 
                stroke="#959596" 
                stroke-width="4" 
                stroke-linejoin="miter"/>
        </g>
      </defs>

      <!-- ========================================== -->
      <!-- 2. GARPU SENSOR TANAH (KANAN)              -->
      <!-- ========================================== -->
      <!-- Nilai translate X diubah dari 100 menjadi 110 agar bergeser sedikit ke kanan -->
      <g id="probe-sensor" transform="translate(110, 8) scale(0.58)">
        <!-- Garpu Probe Kiri (Mulai persis di X=0, ujungnya di X=42) -->
        <use href="#probe-fork" x="0" y="0"/>
        <!-- Garpu Probe Kanan (Digeser ke X=70, ujung luarnya pas di X=112) -->
        <use href="#probe-fork" x="70" y="0"/>

        <!-- PCB Atas (Lebar total 112px, memeluk presisi tepi probe di X=42 dan X=70) -->
        <path d="M 0 88 H 42 C 42 74, 70 74, 70 88 H 112 V 18 H 0 Z" fill="#131313"/>

        <!-- Lubang Baut Atas -->
        <circle cx="12" cy="30" r="5" fill="#e0e0e0"/>
        <circle cx="100" cy="30" r="5" fill="#e0e0e0"/>

        <!-- Header Terminal 2-Pin Atas (Titik tengah di X=56) -->
        <rect x="28" y="25" width="50" height="10" fill="#374151"/>
        <rect x="32.5" y="27" width="5" height="5" fill="#ffffff"/>
        <circle cx="35" cy="29.2" r="2" fill="#111827"/>
        <rect x="67.5" y="27" width="5" height="5" fill="#ffffff"/>
        <circle cx="70" cy="29.2" r="2" fill="#111827"/>

        <!-- Pin Kawat Atas -->
        <line class="pin-in-3" x1="35" y1="28" x2="35" y2="0" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>
        <line class="pin-in-2" x1="70" y1="28" x2="70" y2="0" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>
        <text x="70" y="48" font-size="18" font-weight="bold" fill="#f3f5f7" text-anchor="middle">-</text>
        <text x="35" y="48" font-size="18" font-weight="bold" fill="#f3f5f7" text-anchor="middle">+</text>
      </g>
    </svg>`;
}

    updateState(isSimActive) {
        const ledPwr = this.contentDiv.querySelector('.anim-led-pwr');
        const ledDo = this.contentDiv.querySelector('.anim-led-do');
        
        if (this.compData.isPowered && isSimActive) {
            if (ledPwr) ledPwr.setAttribute('fill', '#ef4444');                         
            const moisture = this.compData.isWired ? (parseFloat(this.compData.state) || 0) : 0;
            const threshold = this.compData.threshold !== undefined ? this.compData.threshold : 50;
            
            if (moisture < threshold) {
                if (ledDo) ledDo.setAttribute('fill', '#22c55e'); 
            } else {
                if (ledDo) ledDo.setAttribute('fill', '#475569'); 
            }
        } else {
            if (ledPwr) ledPwr.setAttribute('fill', '#475569'); 
            if (ledDo) ledDo.setAttribute('fill', '#475569'); 
        }
    }
}
UIRegistry['soil_moisture'] = SoilMoistureUI;