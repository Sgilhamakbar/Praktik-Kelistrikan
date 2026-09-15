// File: src/components/indicators/LampUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class LampUI extends BaseUIComponent {
    static getDimensions() { return [60, 60]; } // Ukuran kanvas komponen 60x60 pixel
    
    getSVG() {
        return `<svg width="60" height="60" viewBox="0 0 60 60" class="anim-svg">
          <!-- Pin Konektor Kiri dan Kanan -->
          <line class="pin-in-0" x1="0" y1="30" x2="20" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="40" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="3"/>
          
          <!-- Kaca Bohlam Lampu -->
          <circle cx="30" cy="25" r="14" fill="rgba(255, 255, 255, 0.1)" stroke="#1e293b" stroke-width="2"/>
          <path d="M 23 37 L 23 42 L 37 42 L 37 37" fill="#64748b" stroke="#1e293b" stroke-width="2"/>
          
          <!-- Tiang Penyangga Filamen dalam Bohlam -->
          <line x1="26" y1="37" x2="26" y2="25" stroke="#1e293b" stroke-width="1.5"/>
          <line x1="34" y1="37" x2="34" y2="25" stroke="#1e293b" stroke-width="1.5"/>
          
          <!-- Filamen Tungsten (Melengkung) -->
          <path class="anim-filament" d="M 26 25 Q 30 18 34 25" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
          
          <!-- Efek Kecerahan Cahaya (Glow) - Tersembunyi di awal (opacity=0) -->
          <circle class="anim-glow" cx="30" cy="25" r="22" fill="#facc15" opacity="0" style="mix-blend-mode: screen; filter: blur(5px); pointer-events: none; transition: opacity 0.1s ease;"/>
          
          <!-- Teks Label Rating Tegangan -->
          <text class="anim-text val-trigger" x="30" y="60" text-anchor="middle" font-size="10" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
        </svg>`;
    }
    
    updateState(isSimActive) {
        // Mewarnai pin kabel jadi hijau jika ada tegangan
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);

        const isBlown = this.compData.state === 'blown'; // Cek apakah lampu putus
        const filament = this.contentDiv.querySelector('.anim-filament');
        const glow = this.contentDiv.querySelector('.anim-glow');
        const text = this.contentDiv.querySelector('.anim-text');

        // Tampilkan teks Rated Voltage (Default 12V)
        const ratedV = this.compData.ratedV !== undefined ? parseFloat(this.compData.ratedV) : 12.0;
        if (text) {
            text.textContent = ratedV + 'V';
            text.setAttribute('fill', isBlown ? '#ef4444' : '#4f46e5'); // Merah jika putus
        }

        if (isBlown) {
            // Animasi Jika Lampu Putus/Meledak
            if (glow) glow.style.opacity = '0';
            if (filament) {
                filament.setAttribute('stroke', '#000000'); // Filamen hangus hitam
                filament.setAttribute('stroke-dasharray', '2,2'); // Efek filamen terputus
            }
        } else {
            // Animasi Jika Lampu Normal
            if (filament) filament.removeAttribute('stroke-dasharray');
            
            const simV = Math.abs(this.compData.simV || 0);
            
            // Rumus Fisika Kecerahan: Kecerahan berbanding lurus dengan daya (V^2 / R)
            // Jadi perbandingannya adalah (Tegangan Masuk / Tegangan Rating)^2
            let brightness = Math.pow(simV / ratedV, 2);
            
            // Batasi glow maksimal hingga 1.5 (150%) agar layar tidak terlalu silau
            if (brightness > 1.5) brightness = 1.5;
            // Jika tegangan terlalu kecil, anggap mati
            if (brightness < 0.05) brightness = 0;

            if (glow) glow.style.opacity = brightness.toFixed(2);
            if (filament) {
                // Ubah warna filamen dari abu-abu menjadi kuning pijar jika menyala
                filament.setAttribute('stroke', brightness > 0.05 ? '#fef08a' : '#94a3b8');
            }
        }
    }
}
UIRegistry['lamp'] = LampUI;