// File: src/components/sensor/ThermistorUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class ThermistorUI extends BaseUIComponent {
    static getDimensions() { return [100, 80]; }
getSVG() {
    const label = this.compData.type === 'thermistor_ntc' ? '-t°' : '+t°';
    return `<svg width="100" height="80" viewBox="0 0 100 80" style="overflow: visible;">
      <!-- Pin Kiri & Kanan (Membentang simetris 0-100 di Y=35) -->
      <line class="pin-in-0" x1="0" y1="40" x2="28" y2="40" stroke="#006600" stroke-width="3"/>
      <line class="pin-out-0" x1="72" y1="40" x2="100" y2="40" stroke="#006600" stroke-width="3"/>
      
      <!-- Badan Resistor  -->
      <rect x="28" y="30" width="44" height="18" rx="2" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Garis Karakteristik Suhu / Termistor (L-shape miring simetris) -->
      <path d="M 32 55 L 45 55 L 68 20" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"/>

      <!-- Simbol Suhu (-t° atau +t°) -->
      <text x="72" y="17" class="comp-label" font-size="10" font-weight="bold" fill="#1e293b">${label}</text>
      
      <!-- Tombol Kontrol Down & Up (Simetris terhadap X=50, Panah tepat di tengah) -->
      <rect class="control-btn btn-down" x="10" y="60" width="24" height="16" rx="3" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
      <polygon points="25,64 19,68 25,72" fill="#fff" pointer-events="none"/>

      <rect class="control-btn btn-up" x="66" y="60" width="24" height="16" rx="3" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
      <polygon points="75,64 81,68 75,72" fill="#fff" pointer-events="none"/>
      
      <!-- Label Nilai Hambatan -->
      <text class="anim-text comp-label resistor-val val-trigger" x="50" y="14" text-anchor="middle" font-size="10" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
    </svg>`;
}
    updateState(_isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        const text = this.contentDiv.querySelector('.anim-text');
        if (text) text.textContent = (this.compData.state || '50') + '°C';
    }
}

// =====================================================
// 2. UI SENSOR SUHU LM35 (Skema "T" - 150x120)
// =====================================================
export class SensorLM35UI extends BaseUIComponent {
    static getDimensions() { 
        return [160, 120]; }
    getSVG() {
        return `<svg width="160" height="120" viewBox="0 0 160 120">
          <!-- 1. Tiga Kaki Besi (Skema "T" Simetris) -->
          <!-- Kiri: GND (Memori Input 1) -->
          <line class="pin-in-1" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="4"/>
          <!-- Kanan: +Vs / VCC (Memori Input 0) -->
          <line class="pin-in-0" x1="135" y1="60" x2="160" y2="60" stroke="#006600" stroke-width="4"/>
          <!-- Tengah Bawah: VOUT (Memori Output 0) -->
          <line class="pin-out-0" x1="80" y1="100" x2="80" y2="120" stroke="#006600" stroke-width="4"/>

          <!-- 2. Bodi Plastik (Tengah, Center X = 75, Lebar = 90) -->
          <rect x="18" y="15" width="125" height="85" rx="6" fill="#334155" stroke="#1e293b" stroke-width="2"/>
          
          <!-- Sablon Merek IC -->
          <text x="80" y="38" text-anchor="middle" font-size="14" font-weight="bold" fill="#94a3b8">LM35</text>

          <!-- 3. Layar Digital Mini ( Tengah) -->
          <rect x="55" y="48" width="50" height="22" rx="3" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
          <!-- Teks Suhu Virtual -->
          <text class="temp-display" x="80" y="64" text-anchor="middle" font-size="14" font-weight="bold" fill="#22c55e">25°C</text>

          <!-- 4. Label Kaki Pin (Dirapikan ke dekat tepi bodi) -->
          <text x="22" y="64" text-anchor="start" font-size="9" font-weight="bold" fill="#cbd5e1">GND</text>
          <text x="135" y="64" text-anchor="end" font-size="9" font-weight="bold" fill="#cbd5e1">+Vs</text>
          <text x="80" y="95" text-anchor="middle" font-size="9" font-weight="bold" fill="#cbd5e1">OUT</text>
        </svg>`;
    }
    
    updateState() {
        let temp = parseFloat(this.compData.state);
        if (isNaN(temp)) temp = 25.0;

        // ========================================================
        // 🔥 HACK: INJEKSI TOMBOL INTERAKTIF (+ DAN -) KE KANVAS
        // ========================================================
        if (!this.btnsAdded && this.contentDiv) {
            this.contentDiv.style.position = 'relative'; // Agar tombol bisa overlay

            // 🌟 AMBIL NILAI STEP DARI MEMORI (Default 1 jika belum diatur)
            let step = this.compData.stepValue !== undefined ? this.compData.stepValue : 1;

            // 1. Buat Tombol Turun Suhu (-)
            const btnDec = document.createElement('button');
            btnDec.textContent = '-';
            btnDec.style.cssText = 'position:absolute; left:40px; top:75px; width:20px; height:20px; font-size:14px; font-weight:bold; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer; padding:0; z-index:10; display:flex; align-items:center; justify-content:center; line-height:1; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
            btnDec.onclick = (e) => {
                e.stopPropagation(); 
                let t = parseFloat(this.compData.state);
                if (isNaN(t)) t = 25.0;
                
                t -= step; // Kurangi sesuai nilai Step
                t = Math.max(-55, Math.min(150, t)); // Kunci di batas -55 hingga 150
                
                this.compData.state = t.toString(); 
            };

            // 2. Buat Tombol Naik Suhu (+)
            const btnInc = document.createElement('button');
            btnInc.textContent = '+';
            btnInc.style.cssText = 'position:absolute; right:40px; top:75px; width:20px; height:20px; font-size:14px; font-weight:bold; background:#3b82f6; color:white; border:none; border-radius:4px; cursor:pointer; padding:0; z-index:10; display:flex; align-items:center; justify-content:center; line-height:1; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
            btnInc.onclick = (e) => {
                e.stopPropagation();
                let t = parseFloat(this.compData.state);
                if (isNaN(t)) t = 25.0;
                
                t += step; // Tambah sesuai nilai Step
                t = Math.max(-55, Math.min(150, t)); // Kunci di batas -55 hingga 150
                
                this.compData.state = t.toString(); 
            };

            // Tempelkan tombol ke bodi komponen
            this.contentDiv.appendChild(btnDec);
            this.contentDiv.appendChild(btnInc);
            this.btnsAdded = true; // Kunci agar tidak digambar berulang kali
        }
        // ========================================================

        // Update warna LCD dan Nyala Kabel seperti biasa
        const isPowered = this.compData.simState === 'on';

        const tempDisplay = this.contentDiv.querySelector('.temp-display');
        if (tempDisplay) {
            tempDisplay.textContent = `${temp}°C`;
            tempDisplay.setAttribute('fill', isPowered ? '#22c55e' : '#475569'); 
        }

        this.setPinActive('pin-in-0', isPowered); 
        this.setPinActive('pin-in-1', isPowered); 
        this.setPinActive('pin-out-0', isPowered && temp > 0); 
    }
}

UIRegistry['sensor_lm35'] = SensorLM35UI;
UIRegistry['thermistor_ntc'] = ThermistorUI;
UIRegistry['thermistor_ptc'] = ThermistorUI;