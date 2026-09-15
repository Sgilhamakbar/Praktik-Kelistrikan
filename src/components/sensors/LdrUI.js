// File: src/components/sensor/LdrUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class LdrUI extends BaseUIComponent {
static getDimensions() { return [100, 80]; }
getSVG() {
    return `<svg width="100" height="80" viewBox="0 0 100 80" style="overflow: visible;">
      <!-- Pin Kiri & Kanan (Membentang dari tepi luar ke tepi lingkaran) -->
      <line class="pin-in-0" x1="0" y1="40" x2="32" y2="40" stroke="#006600" stroke-width="3"/>
      <line class="pin-out-0" x1="68" y1="40" x2="100" y2="40" stroke="#006600" stroke-width="3"/>
      
      <!-- Lingkaran Komponen (Pusat di X=50, Y=40, Radius 18) -->
      <circle cx="50" cy="40" r="18" fill="#e8e6d3" stroke="#1e293b" stroke-width="2.5"/>
      
      <!-- Simbol Zigzag Resistor (Sesuai gambar referensi) -->
      <path d="M 33 40 L 36 40 L 38.5 31 L 43.5 49 L 48.5 31 L 53.5 49 L 58.5 31 L 61.5 49 L 64 40 L 67 40" 
            fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="miter"/>
      
      <!-- Panah Indikator Cahaya (Ukuran & gaya lama, posisi presisi di kiri-atas lingkaran) -->
      <path d="M 18 8 L 30 20 M 26 20 L 30 20 L 30 16 M 28 2 L 40 14 M 36 14 L 40 14 L 40 10" 
            fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- Tombol Kontrol Down & Up -->
      <rect class="control-btn btn-down" x="10" y="60" width="24" height="16" rx="3" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
      <polygon points="25,64 19,68 25,72" fill="#fff" pointer-events="none"/>

      <rect class="control-btn btn-up" x="66" y="60" width="24" height="16" rx="3" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
      <polygon points="75,64 81,68 75,72" fill="#fff" pointer-events="none"/>
      
      <!-- Label Nilai -->
      <text class="anim-text comp-label resistor-val val-trigger" x="80" y="10" text-anchor="middle" font-size="10" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
    </svg>`;
}
    updateState(_isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        const text = this.contentDiv.querySelector('.anim-text');
        
        if (text) {
            let luxVal = parseInt(this.compData.state || '500');
            let displayStr = luxVal >= 1000 ? (luxVal/1000).toFixed(1) + 'k Lux' : luxVal + ' Lux';
            text.textContent = displayStr;
        }

        // LOGIKA TOMBOL KANVAS LDR (+ / -) MENGGUNAKAN NILAI STEP
        if (!this.btnsAdded && this.contentDiv) {
            const btnUp = this.contentDiv.querySelector('.btn-up');
            const btnDown = this.contentDiv.querySelector('.btn-down');
            
            if (btnUp && btnDown) {
                // Tombol Plus (Hijau)
                btnUp.onclick = (e) => {
                    e.stopPropagation();
                    let current = parseFloat(this.compData.state) || 0;
                    let step = this.compData.stepValue !== undefined ? this.compData.stepValue : 100; 
                    
                    let next = current + step;
                    if (next > 100000) next = 100000; // Mentok di batas atas Lux
                    this.compData.state = next.toString();
                };
                
                // Tombol Minus (Merah)
                btnDown.onclick = (e) => {
                    e.stopPropagation();
                    let current = parseFloat(this.compData.state) || 0;
                    let step = this.compData.stepValue !== undefined ? this.compData.stepValue : 100;
                    
                    let next = current - step;
                    if (next < 0) next = 0; // Mentok di 0 Lux
                    this.compData.state = next.toString();
                };
            }
            this.btnsAdded = true;
        }
    }
}
UIRegistry['ldr'] = LdrUI;