// File: src/components/semiconductors/OpAmpUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class OpAmpUI extends BaseUIComponent {
    static getDimensions() { return [120, 100]; }
    getSVG() {
        return `<svg width="120" height="100" viewBox="0 0 120 100">
            
            <!-- ===================== KABEL PIN ===================== -->
            <!-- Pin Input 0: Inverting (-) di atas -->
            <line class="pin-in-0" x1="0" y1="35" x2="35" y2="35" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Pin Input 1: Non-Inverting (+) di bawah -->
            <line class="pin-in-1" x1="0" y1="65" x2="35" y2="65" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Pin Output 0: Output Vout di ujung kanan -->
            <line class="pin-out-0" x1="120" y1="50" x2="85" y2="50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>

            <!-- =================== BODI OP-AMP =================== -->
            <!-- Bentuk Segitiga Standar Op-Amp -->
            <polygon points="35,20 35,80 85,50" fill="var(--bg-main, #e8e6d3)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>

            <!-- Simbol Minus (-) untuk pin Inverting -->
            <line x1="42" y1="35" x2="48" y2="35" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
            
            <!-- Simbol Plus (+) untuk pin Non-Inverting -->
            <line x1="42" y1="65" x2="48" y2="65" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
            <line x1="45" y1="62" x2="45" y2="68" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>

            <!-- Label Nama Komponen (Membesar mengikuti ID) -->
            <text x="58" y="54" class="comp-label" font-size="12" text-anchor="middle" font-weight="bold" fill="#1e293b">
                OP${this.id}
            </text>

            <!-- ================= TEKS DINAMIS UI ================= -->
            <!-- Teks ini bisa diklik pengguna untuk membuka Modal Setting Tegangan Rail -->
            <text class="anim-text comp-label val-trigger" x="60" y="95" text-anchor="middle" font-size="11" fill="#4f46e5" font-weight="bold" style="cursor:pointer; pointer-events:auto;">
                0.00 V
            </text>
        </svg>`;
    }

    // Fungsi ini dipanggil otomatis 60x per detik oleh SimulationEngine
    updateState(isSimActive) {
        // Ambil data voltase keluaran (simV) yang dihitung oleh OpAmpModel.js
        const vOut = this.compData.simV || 0;

        // 1. Indikator Warna Kabel (Pin)
        // Kabel Output menyala (menjadi warna hijau/merah di CSS simulator) jika output bertegangan tinggi
        const isOutputActive = Math.abs(vOut) > 0.5;
        this.setPinActive('pin-out-0', isOutputActive); 
        
        // (Opsional) Nyalakan pin input jika menerima tegangan dari sirkuit luar
        const vPlus = this.compData.vPlus || 0;
        const vMinus = this.compData.vMinus || 0;
        this.setPinActive('pin-in-1', Math.abs(vPlus) > 0.5);
        this.setPinActive('pin-in-0', Math.abs(vMinus) > 0.5);

        // 2. Animasi Teks Tegangan di Bawah Op-Amp
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            if (isSimActive) {
                // Tampilkan tegangan real-time saat Play ditekan
                txtVal.textContent = `${vOut.toFixed(2)} V`;
                
                // Ubah warna teks menjadi oranye/merah peringatan jika mencapai batas Saturasi
                const posRail = this.compData.posRail !== undefined ? this.compData.posRail : 15.0;
                const negRail = this.compData.negRail !== undefined ? this.compData.negRail : -15.0;
                
                if (vOut >= posRail - 0.1 || vOut <= negRail + 0.1) {
                    txtVal.setAttribute('fill', '#ef4444'); // Merah (Kondisi Clipping/Saturasi)
                } else {
                    txtVal.setAttribute('fill', '#22c55e'); // Hijau (Normal/Aktif)
                }
            } else {
                // Tampilkan pengaturan V+ dan V- (Rail Voltage) saat Stop
                const pr = this.compData.posRail !== undefined ? this.compData.posRail : 15;
                const nr = this.compData.negRail !== undefined ? this.compData.negRail : -15;
                txtVal.textContent = `±${pr}V`;
                txtVal.setAttribute('fill', '#4f46e5'); // Biru
            }
        }
    }
}
UIRegistry['opamp'] = OpAmpUI;

export class OpAmp5PinUI extends BaseUIComponent {
    static getDimensions() { return [120, 120]; }
    getSVG() {
        return `<svg width="120" height="120" viewBox="0 0 120 120">
            
            <!-- ===================== KABEL PIN ===================== -->
            <!-- Input 0: Inverting (-) di Kiri Atas -->
            <line class="pin-in-0" x1="0" y1="45" x2="35" y2="45" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Input 1: Non-Inverting (+) di Kiri Bawah -->
            <line class="pin-in-1" x1="0" y1="75" x2="35" y2="75" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Input 2: VDD (Power Positif) dari Atas ke Bawah -->
            <line class="pin-in-2" x1="55" y1="0" x2="55" y2="41" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Input 3: VSS (Power Negatif) dari Bawah ke Atas -->
            <line class="pin-in-3" x1="55" y1="120" x2="55" y2="79" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Output 0: Vout di Kanan -->
            <line class="pin-out-0" x1="120" y1="60" x2="90" y2="60" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>

            <!-- =================== BODI OP-AMP =================== -->
            <!-- Segitiga (Proporsi presisi agar pin menempel pas di garis miring) -->
            <polygon points="35,30 35,90 90,60" fill="var(--bg-main, #e8e6d3)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>

            <!-- Simbol (-) dan (+) untuk Inverting/Non-Inverting -->
            <line x1="40" y1="45" x2="48" y2="45" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
            <line x1="40" y1="75" x2="48" y2="75" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
            <line x1="44" y1="71" x2="44" y2="79" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>

            <!-- Label V+ dan V- untuk Kaki Power -->
            <text x="62" y="35" font-size="9" fill="#64748b" font-weight="bold">V+</text>
            <text x="62" y="92" font-size="9" fill="#64748b" font-weight="bold">V-</text>

            <!-- Nama Komponen -->
            <text x="50" y="64" class="comp-label" font-size="10" text-anchor="middle" font-weight="bold" fill="#1e293b">
                IC${this.id}
            </text>

            <!-- Indikator Tegangan / Status -->
            <text class="anim-text comp-label" x="90" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#94a3b8">
                OFF
            </text>
        </svg>`;
    }

    updateState(isSimActive) {
        const vOut = this.compData.simV || 0;
        const isPowered = this.compData.isPowered || false;

        // Visual indikator menyala pada kaki Output jika ada tegangan
        const isOutputActive = Math.abs(vOut) > 0.5;
        this.setPinActive('pin-out-0', isOutputActive); 

        // Update Teks Layar
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            if (isSimActive) {
                if (isPowered) {
                    txtVal.textContent = `${vOut.toFixed(2)} V`;
                    txtVal.setAttribute('fill', '#22c55e'); // Hijau (Hidup & Bekerja)
                } else {
                    txtVal.textContent = 'NO PWR'; // Peringatan jika tidak ada listrik
                    txtVal.setAttribute('fill', '#ef4444'); // Merah
                }
            } else {
                txtVal.textContent = 'OP-AMP';
                txtVal.setAttribute('fill', '#94a3b8'); // Abu-abu saat stop
            }
        }
    }
}

UIRegistry['opamp_5pin'] = OpAmp5PinUI;

export class OpAmpLM741UI extends BaseUIComponent {
    static getDimensions() { 
        return [120, 120]; } 
        
    getSVG() {
        return `<svg width="120" height="120" viewBox="0 0 120 120">
            
            <!-- ===================== KABEL PIN ===================== -->
            <!-- Input 0: Inverting (-) di Kiri Atas -->
            <line class="pin-in-0" x1="0" y1="45" x2="35" y2="45" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Input 1: Non-Inverting (+) di Kiri Bawah -->
            <line class="pin-in-1" x1="0" y1="75" x2="35" y2="75" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Input 2: VCC+ (Power Positif) dari Atas ke Bawah -->
            <line class="pin-in-2" x1="55" y1="0" x2="55" y2="39" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Input 3: VEE- (Power Negatif) dari Bawah ke Atas -->
            <line class="pin-in-3" x1="55" y1="120" x2="55" y2="81" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Output 0: Vout di Kanan -->
            <line class="pin-out-0" x1="120" y1="60" x2="90" y2="60" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>

            <!-- =================== BODI OP-AMP =================== -->
            <!-- Bentuk Segitiga Standar Datasheet -->
            <polygon points="35,25 35,95 90,60" fill="var(--bg-main, #e8e6d3)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>

            <!-- Simbol (-) dan (+) untuk Kaki Input -->
            <line x1="40" y1="45" x2="48" y2="45" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
            <line x1="40" y1="75" x2="48" y2="75" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
            <line x1="44" y1="71" x2="44" y2="79" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>

            <!-- Label VCC+ dan VEE- (Sesuai Datasheet LM741) -->
            <text x="62" y="32" font-size="9" fill="#64748b" font-weight="bold">VCC+</text>
            <text x="62" y="94" font-size="9" fill="#64748b" font-weight="bold">VEE-</text>

            <!-- Nama IC -->
            <text x="50" y="64" class="comp-label" font-size="11" text-anchor="middle" font-weight="bold" fill="#1e293b">
                LM741
            </text>

            <!-- Indikator Tegangan Dinamis (Bisa diklik pengguna) -->
            <text class="anim-text comp-label val-trigger" x="90" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;">
                OFF
            </text>
        </svg>`;
    }

    updateState(isSimActive) {
        const vOut = this.compData.simV || 0;
        const isPowered = this.compData.isPowered || false;

        // Visual indikator menyala pada kaki Output jika ada tegangan signifikan
        const isOutputActive = Math.abs(vOut) > 0.5;
        this.setPinActive('pin-out-0', isOutputActive); 

        // Update Teks Layar Interaktif
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            if (isSimActive) {
                if (isPowered) {
                    txtVal.textContent = `${vOut.toFixed(2)} V`;
                    // Jika saturasi, warnanya berubah
                    const vMax = (this.compData.vDD || 15) - 1.5;
                    const vMin = (this.compData.vSS || -15) + 1.5;
                    if (vOut >= vMax - 0.1 || vOut <= vMin + 0.1) {
                        txtVal.setAttribute('fill', '#ef4444'); // Merah (Clipping/Saturasi)
                    } else {
                        txtVal.setAttribute('fill', '#22c55e'); // Hijau (Normal/Aktif)
                    }
                } else {
                    txtVal.textContent = 'NO PWR'; // Peringatan jika IC mati
                    txtVal.setAttribute('fill', '#ef4444'); // Merah
                }
            } else {
                txtVal.textContent = 'LM741';
                txtVal.setAttribute('fill', '#94a3b8'); // Abu-abu saat simulasi Stop
            }
        }
    }
}
UIRegistry['opamp_lm741'] = OpAmpLM741UI;