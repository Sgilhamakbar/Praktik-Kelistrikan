// File: src/components/semiconductors/RegulatorUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class Regulator7812UI extends BaseUIComponent {
    static getDimensions() { return [140, 120]; }
    getSVG() {
        return `<svg width="140" height="120" viewBox="0 0 140 120">
            <!-- Pin Kaki (Kiri, Bawah, Kanan) -->
            <line class="pin-in-0" x1="0" y1="60" x2="30" y2="60" stroke="#a5b6d1" stroke-width="4"/>
            <line class="pin-in-1" x1="70" y1="90" x2="70" y2="120" stroke="#a5b6d1" stroke-width="4"/>
            <line class="pin-out-0" x1="110" y1="60" x2="140" y2="60" stroke="#a5b6d1" stroke-width="4"/>
            
            <!-- Kemasan Bodi -->
            <rect x="30" y="20" width="80" height="70" rx="5" fill="#0f172a" stroke="#475569" stroke-width="3"/>
            
            <!-- Teks Nama Komponen -->
            <text x="70" y="48" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="bold" font-family="monospace">78L12</text>
            
            <!-- Indikator LED Status Internal -->
            <circle class="status-dot" cx="70" cy="65" r="6" fill="#334155"/>
            
            <!-- Label Kaki -->
            <text x="36" y="64" font-size="8" font-weight="bold" fill="#94a3b8">IN</text>
            <text x="70" y="85" font-size="8" font-weight="bold" text-anchor="middle" fill="#94a3b8">GND</text>
            <text x="104" y="64" font-size="8" font-weight="bold" text-anchor="end" fill="#94a3b8">OUT</text>
        </svg>`;
    }

    updateState(isSimActive) {
        // Warnai pin jika ada tegangan
        this.setPinActive('pin-out-0', this.compData.simV > 0 || isSimActive);
        
        // Ubah warna titik LED berdasarkan status dari Mesin Fisika (Model)
        const dot = this.contentDiv.querySelector('.status-dot');
        if (dot && isSimActive) {
            const state = this.compData.regState;
            if (state === 'REGULATING') {
                dot.setAttribute('fill', '#22c55e'); // Hijau = Normal (12V)
                dot.innerHTML = `<title>Normal: Output Stabil 12V</title>`;
            } else if (state === 'DROPOUT') {
                dot.setAttribute('fill', '#eab308'); // Kuning = Input kurang dari 14V
                dot.innerHTML = `<title>Dropout: Tegangan Input terlalu rendah</title>`;
            } else if (state === 'CURRENT_LIMIT') {
                dot.setAttribute('fill', '#f97316'); // Oranye = Beban arus berlebih (>100mA)
                dot.innerHTML = `<title>Limit Arus: Beban terlalu berat!</title>`;
            } else if (state === 'OVERHEAT') {
                dot.setAttribute('fill', '#ef4444'); // Merah = Kepanasan & Mati
                dot.innerHTML = `<title>OVERHEAT: Thermal Shutdown Aktif!</title>`;
            }
        } else if (dot) {
            dot.setAttribute('fill', '#334155'); // Abu-abu (Mati)
        }
    }
}
UIRegistry['ic_78L12'] = Regulator7812UI;

// =======================================================
// CLASS: IC LM7812 (Regulator Standar 1.5A / TO-220)
// =======================================================
export class RegulatorLM7812UI extends BaseUIComponent {
    static getDimensions() { return [140, 120]; }
    getSVG() {
        return `<svg width="140" height="120" viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg">
            <!-- Heatsink (Tab Logam Pendingin di Atas) -->
            <rect x="36" y="5" width="70" height="25" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
            <!-- Lubang Baut Heatsink -->
            <circle cx="71" cy="17" r="5" fill="#0f172a"/>
            
            <!-- Bodi Epoksi Hitam Utama -->
            <rect x="20" y="25" width="100" height="70" rx="3" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <!-- Garis estetika cetakan pabrik -->
            <path d="M 20 40 L 120 40" stroke="#334155" stroke-width="1.5"/>
            
            <!-- Pin Kaki Timah (IN, GND, OUT) -->
            <line class="pin-in-0" x1="0" y1="60" x2="20" y2="60" stroke="#94a3b8" stroke-width="4"/>
            <line class="pin-in-1" x1="70" y1="95" x2="70" y2="120" stroke="#94a3b8" stroke-width="4"/>
            <line class="pin-out-0" x1="120" y1="60" x2="140" y2="60" stroke="#94a3b8" stroke-width="4"/>
            
            <!-- Teks Nama Komponen -->
            <text x="70" y="60" text-anchor="middle" fill="#f8fafc" font-size="14" font-weight="bold" font-family="sans-serif">7812</text>
            
            <!-- Indikator Status & Panas -->
            <circle class="status-dot" cx="70" cy="80" r="6" fill="#334155"/>
            
            <!-- Label Fungsi Pin Kecil -->
            <text x="25" y="65" font-size="8" font-weight="bold" fill="#94a3b8">IN</text>
            <text x="45" y="90" font-size="8" font-weight="bold" fill="#94a3b8">GND</text>
            <text x="115" y="65" font-size="8" font-weight="bold" fill="#94a3b8" text-anchor="end">OUT</text>
        </svg>`;
    }
    updateState(isSimActive) {
        // Warnai pin kaki Kanan (OUT) jika ada arus mengalir
        this.setPinActive('pin-out-0', this.compData.simV > 0 || isSimActive);
        
        const dot = this.contentDiv.querySelector('.status-dot');
        if (dot && isSimActive) {
            const state = this.compData.regState;
            
            // UI Dinamis merespons keadaan fisika 
            if (state === 'REGULATING') {
                dot.setAttribute('fill', '#22c55e'); // Hijau (Aman & Stabil)
                dot.innerHTML = `<title>Normal: 12V Stabil (Heat: ${Math.round(this.compData.heat || 0)}/50)</title>`;
            } else if (state === 'DROPOUT') {
                dot.setAttribute('fill', '#eab308'); // Kuning (Kurang Tegangan)
                dot.innerHTML = `<title>Dropout: Tegangan Input Kurang dari 14V</title>`;
            } else if (state === 'CURRENT_LIMIT') {
                dot.setAttribute('fill', '#f97316'); // Oranye (Beban Lebih)
                dot.innerHTML = `<title>Limit Arus: Beban melebihi batas 1.5A!</title>`;
            } else if (state === 'OVERHEAT') {
                dot.setAttribute('fill', '#ef4444'); // Merah (Kepanasan)
                dot.innerHTML = `<title>OVERHEAT: Thermal Shutdown! Mendinginkan...</title>`;
            }
        } else if (dot) {
            dot.setAttribute('fill', '#334155'); // Padam jika mati
        }
    }
}

// Daftarkan ke UIRegistry agar terhubung dengan HTML!
UIRegistry['ic_7812'] = RegulatorLM7812UI;