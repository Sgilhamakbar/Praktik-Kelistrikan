// File: src/components/indicators/LedUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class LedUI extends BaseUIComponent {
    static getDimensions() { return [60, 60]; }
    
    getSVG() {
        // Menggunakan desain orisinal Anda yang sudah sangat bagus (ada icon warning)
        return `<svg width="60" height="60" viewBox="0 0 60 60" class="anim-svg">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="45" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="3"/>
          <circle class="anim-body" cx="30" cy="30" r="15" fill="#4a0000" stroke="#1e293b" stroke-width="2"/>
          <path d="M25 25 L35 30 L25 35 Z" fill="#1e293b"/>
          <line x1="35" y1="23" x2="35" y2="37" stroke="#1e293b" stroke-width="3"/>
          <g class="warning-icon" style="display:none; pointer-events:none;">
              <polygon points="18,45 24,55 12,55" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" stroke-linejoin="round"/>
              <text x="18" y="53" font-size="8" font-weight="900" fill="#000" text-anchor="middle">!</text>
          </g>
          <text x="30" y="55" class="anim-text comp-label val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer; pointer-events:auto; font-weight:bold;">L${this.id}</text>
        </svg>`;
    }

    updateState() {
        // 1. Kunci Status Terbakar (Blown Latch)
        // Jika mesin fisika mendeteksi overcurrent, kunci statusnya permanen sampai direset pengguna
        if (this.compData.isOvercurrent && this.compData.state !== 'blown') {
            this.compData.state = 'blown';
        }
        const isBlown = this.compData.state === 'blown';

        // 2. Kalkulasi Arus & Kecerahan Orisinal Anda
        const current = Math.abs(this.compData.simI || 0); 
        const fullDriveAmpere = (parseFloat(this.compData.fullDriveI) || 10) / 1000; 
        
        this.setPinActive('pin-in-0', this.compData.simV > 0); 
        this.setPinActive('pin-out-0', current > 0.001);
        
        // 3. 🟢 PENCARIAN ELEMEN AMAN (ANTI-CRASH) 🟢
        // Menggunakan document.querySelector berdasarkan ID content agar 100% tahan banting
        const container = document.querySelector(`#content-${this.id}`);
        if (!container) return; // Jika DOM belum siap saat frame pertama, batalkan update dengan aman

        const body = container.querySelector('.anim-body'); 
        const svg = container.querySelector('.anim-svg');
        const txt = container.querySelector('.anim-text');
        const warningIcon = container.querySelector('.warning-icon');
        
        if (isBlown) {
            // TAMPILAN SAAT TERBAKAR/MELEDAK
            if (body) { body.setAttribute('fill', '#262626'); body.setAttribute('stroke', '#ef4444'); }
            if (svg) { svg.style.filter = 'none'; svg.style.opacity = 1; }
            if (warningIcon) warningIcon.style.display = 'block'; 
            if (txt) { txt.setAttribute('fill', '#ef4444'); txt.setAttribute('x', '36'); }
        } else {
            // TAMPILAN NORMAL (Menyala / Mati)
            if (warningIcon) warningIcon.style.display = 'none'; 
            let intensity = Math.min(1, current / fullDriveAmpere);
            const isOn = intensity > 0.005; 
            
            const ledColor = this.compData.color || 'red';
            let r=0, g=0, b=0, glowRGB='255, 0, 0', baseFill='#380000';

            if (ledColor === 'red') { r = Math.round(56 + (intensity * 199)); g = b = Math.round(intensity * 40); } 
            else if (ledColor === 'green') { g = Math.round(56 + (intensity * 199)); r = b = Math.round(intensity * 40); baseFill = '#003800'; glowRGB = '0, 255, 0'; } 
            else if (ledColor === 'blue') { b = Math.round(56 + (intensity * 199)); r = g = Math.round(intensity * 40); baseFill = '#000038'; glowRGB = '0, 100, 255'; } 
            else if (ledColor === 'yellow') { r = g = Math.round(56 + (intensity * 199)); b = Math.round(intensity * 40); baseFill = '#383800'; glowRGB = '255, 255, 0'; }
            
            if (body) { body.setAttribute('fill', isOn ? `rgb(${r}, ${g}, ${b})` : baseFill); body.setAttribute('stroke', '#1e293b'); }
            if (svg) {
              if (isOn) {
                const blur = 2 + (intensity * 18); const glowAlpha = 0.1 + (intensity * 0.9); 
                svg.style.filter = `drop-shadow(0 0 ${blur}px rgba(${glowRGB}, ${glowAlpha}))`;
                svg.style.opacity = 1 + (intensity * 0.5); 
              } else {
                svg.style.filter = 'none'; svg.style.opacity = 1; 
              }
            }
            if (txt) { txt.setAttribute('fill', '#4f46e5'); txt.setAttribute('x', '30'); }
        }
        if (txt) txt.textContent = `L${this.id}`;
    }
}
UIRegistry['led'] = LedUI;