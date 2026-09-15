// File: src/ui/UIManager.js

// 1. TAMBAHKAN IMPOR INI DI BARIS PALING ATAS
import { CircuitStore } from '../state/CircuitStore.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { ComponentDefs } from '../components/index.js'; 
import { HistoryManager } from '../HistoryManager.js';
import { SensorLM35 } from '../engine/models/sensors/AnalogSensorModel.js';

// 2. UBAH MENJADI EXPORT CONST
export const UIManager = {
  currentZoom: 1,

setZoom(val, clientX = null, clientY = null) {
    const canvas = document.getElementById('canvas');
    const wrapper = document.getElementById('canvas-wrapper');
    if (!canvas || !wrapper) return;

    const oldZoom = this.currentZoom;
    const newZoom = Math.max(0.5, Math.min(parseFloat(val), 2.0));
    this.currentZoom = newZoom;

    const rect = wrapper.getBoundingClientRect();
    
    // Jika posisi jari tidak diberikan, zoom ke tengah layar
    if (clientX === null || clientY === null) {
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    // 1. Catat koordinat absolut komponen yang sedang Anda tatap
    const canvasX = (wrapper.scrollLeft + clientX - rect.left) / oldZoom;
    const canvasY = (wrapper.scrollTop + clientY - rect.top) / oldZoom;

    // 2. Perbesar ukuran visual kanvas
    canvas.style.transform = `scale(${newZoom})`;
    canvas.style.transformOrigin = '0 0';

    // 🟢 FIX UTAMA: Buat elemen pendorong agar ruang scroll browser ikut membesar
    let spacer = document.getElementById('canvas-spacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.id = 'canvas-spacer';
        spacer.style.position = 'absolute';
        spacer.style.top = '0';
        spacer.style.left = '0';
        spacer.style.pointerEvents = 'none'; // Agar tidak mengganggu klik komponen
        spacer.style.visibility = 'hidden';
        wrapper.appendChild(spacer);
    }
    // Setel ukuran pendorong agar sama persis dengan skala kanvas
    spacer.style.width = (3000 * newZoom) + 'px';
    spacer.style.height = (3000 * newZoom) + 'px';

    // 3. Karena ruang scroll sudah luas, layar tidak akan terlempar lagi!
    wrapper.scrollLeft = canvasX * newZoom - (clientX - rect.left);
    wrapper.scrollTop = canvasY * newZoom - (clientY - rect.top);

    // Update teks persen di Toolbar
    const zoomLabel = document.getElementById('zoomLabel');
    if (zoomLabel) zoomLabel.innerText = Math.round(newZoom * 100) + '%';
    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) zoomSlider.value = newZoom;
  },

  changeZoom(delta) {
    let newZoom = this.currentZoom + delta;
    if (newZoom >= 0.5 && newZoom <= 2.0) this.setZoom(newZoom);
  },

  initTheme() {
    const saved = localStorage.getItem('labCircuitTheme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeButton(saved === 'dark');
  },

  updateThemeButton(isDark) {
    const btn = document.getElementById('btnTheme');
    if (btn) {
      btn.innerHTML = isDark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      btn.title = isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap';
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('labCircuitTheme', next);
    this.updateThemeButton(!isDark);
  },

  showToast(message, duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    // UBAH BAGIAN INI: Kosongkan isi container agar animasi tidak bertumpuk
    container.innerHTML = ''; 
    
    const toast = document.createElement('div');
    toast.className = 'toast'; 
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
  },

  showConfirmToast(message, onConfirm) {
    const existing = document.querySelector('.confirm-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'confirm-toast';
    toast.innerHTML = `<span>${message}</span><button id="confirmYes">Ya</button><button id="confirmNo">Batal</button>`;
    document.body.appendChild(toast);
    document.getElementById('confirmYes').onclick = () => { toast.remove(); if (onConfirm) onConfirm(); };
    document.getElementById('confirmNo').onclick = () => { toast.remove(); };
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
  },

openValueModal(compId, compType, subType) {
    CircuitStore.currentEditingComponent = { id: Number(compId), type: compType, subType: subType };
    const comp = document.getElementById(`comp-${compId}`);
    const compData = CircuitStore.components.find(c => c.id === Number(compId));
    if (!comp || !compData) return;

    let titleSuffix = subType ? ` (${subType.toUpperCase()})` : '';
    const displayType = compType.replace(/_/g, ' ').toUpperCase(); 
    document.getElementById('valCompName').textContent = `${displayType}${titleSuffix} - ID:${compId}`;
    const unitSelect = document.getElementById('compUnit');
    if (unitSelect) unitSelect.innerHTML = '';
    
    const fusePresets = document.getElementById('fusePresets');
    const resistorPresets = document.getElementById('resistorPresets');
    const capacitorPresets = document.getElementById('capacitorPresets');
    const batteryPresets = document.getElementById('batteryPresets');
    const zenerPresets = document.getElementById('zenerPresets');
    
    if (fusePresets) fusePresets.style.display = 'none';
    if (resistorPresets) resistorPresets.style.display = 'none';
    if (capacitorPresets) capacitorPresets.style.display = 'none';
    if (batteryPresets) batteryPresets.style.display = 'none'; 
    if (zenerPresets) zenerPresets.style.display = 'none';

    const isSlider = ['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc', 'hc_sr04', 'ir_sensor', 'sensor_lm35', 'soil_moisture'].includes(compType);

    const textInputGroup = document.getElementById('textInputGroup');
    const sliderInputGroup = document.getElementById('sliderInputGroup');
    const valCurrentWrapper = document.getElementById('valCurrentWrapper');
    const ledInputGroup = document.getElementById('ledInputGroup'); 
    const motorInputGroup = document.getElementById('motorInputGroup');
    const relayInputGroup = document.getElementById('relayInputGroup');
    const ntcInputGroup = document.getElementById('ntcInputGroup');
    const ptcInputGroup = document.getElementById('ptcInputGroup');
    const clockInputGroup = document.getElementById('clockInputGroup');
    const vsineInputGroup = document.getElementById('vsineInputGroup');
    const pulseGenInputGroup = document.getElementById('pulseGenInputGroup');
    const ffInputGroup = document.getElementById('ffInputGroup');
    const lampInputGroup = document.getElementById('lampInputGroup');
    const transformerInputGroup = document.getElementById('transformerInputGroup'); 
    const zenerInputGroup = document.getElementById('zenerInputGroup');
    const bridgeInputGroup = document.getElementById('diodeBridgeInputGroup');
    const bridgePresets = document.getElementById('bridgePresets');
    const potSettingGroup = document.getElementById('potentiometerSettingGroup');
    const opampInputGroup = document.getElementById('opampInputGroup');
    const arduinoInputGroup = document.getElementById('arduinoInputGroup');
    const hcSr04InputGroup = document.getElementById('hcSr04InputGroup');
    const servoInputGroup = document.getElementById('servoInputGroup');
    const irSensorInputGroup = document.getElementById('irSensorInputGroup');
    const csInputGroup = document.getElementById('currentSourceInputGroup');
    const soilMoistureInputGroup = document.getElementById('soilMoistureInputGroup');
    const textLabelGroup = document.getElementById('textLabelGroup');
    
    const hideText = ['text_label', 'speaker', 'ldr', 'thermistor_ntc', 'thermistor_ptc', 'led', 'lamp', 'motor_dc', 'opamp', 'clock_pulse', 'vsine', 'ff_jk', 'ff_sr', 'ff_d', 'ff_t', 'transformer', 'transformer_2p2s', 'zener_diode', 'diode_bridge', 'arduino_uno', 'hc_sr04', 'servo', 'ir_sensor', 'pulse_generator', 'current_source', 'sensor_lm35', 'soil_moisture'].includes(compType);

    if (textInputGroup) textInputGroup.style.display = hideText ? 'none' : 'flex';
    if (sliderInputGroup) sliderInputGroup.style.display = isSlider ? 'block' : 'none';
    if (valCurrentWrapper) valCurrentWrapper.style.display = hideText ? 'none' : 'block';
    if (ledInputGroup) ledInputGroup.style.display = compType === 'led' ? 'flex' : 'none';
    if (motorInputGroup) motorInputGroup.style.display = compType === 'motor_dc' ? 'flex' : 'none';
    if (relayInputGroup) relayInputGroup.style.display = compType.startsWith('relay') ? 'flex' : 'none';
    if (opampInputGroup) opampInputGroup.style.display = compType === 'opamp' ? 'flex' : 'none';
    if (ntcInputGroup) ntcInputGroup.style.display = compType === 'thermistor_ntc' ? 'flex' : 'none';
    if (ptcInputGroup) ptcInputGroup.style.display = compType === 'thermistor_ptc' ? 'flex' : 'none';
    if (clockInputGroup) clockInputGroup.style.display = compType === 'clock_pulse' ? 'flex' : 'none';
    if (vsineInputGroup) vsineInputGroup.style.display = compType === 'vsine' ? 'flex' : 'none';
    if (pulseGenInputGroup) pulseGenInputGroup.style.display = compType === 'pulse_generator' ? 'flex' : 'none';
    if (ffInputGroup) ffInputGroup.style.display = compType.startsWith('ff_') ? 'flex' : 'none';
    if (lampInputGroup) lampInputGroup.style.display = compType === 'lamp' ? 'flex' : 'none';
    if (transformerInputGroup) transformerInputGroup.style.display = (compType === 'transformer' || compType === 'transformer_2p2s') ? 'flex' : 'none';
    if (zenerInputGroup) zenerInputGroup.style.display = compType === 'zener_diode' ? 'flex' : 'none';
    if (zenerPresets) zenerPresets.style.display = compType === 'zener_diode' ? 'block' : 'none';
    if (bridgeInputGroup) bridgeInputGroup.style.display = compType === 'diode_bridge' ? 'flex' : 'none';
    if (bridgePresets) bridgePresets.style.display = compType === 'diode_bridge' ? 'block' : 'none';
    if (potSettingGroup) potSettingGroup.style.display = isSlider ? 'flex' : 'none';
    if (arduinoInputGroup) arduinoInputGroup.style.display = compType === 'arduino_uno' ? 'flex' : 'none';
    if (hcSr04InputGroup) hcSr04InputGroup.style.display = compType === 'hc_sr04' ? 'flex' : 'none';
    if (servoInputGroup) servoInputGroup.style.display = compType === 'servo' ? 'flex' : 'none';
    if (irSensorInputGroup) irSensorInputGroup.style.display = compType === 'ir_sensor' ? 'flex' : 'none';
    if (csInputGroup) csInputGroup.style.display = compType === 'current_source' ? 'flex' : 'none';
    if (soilMoistureInputGroup) soilMoistureInputGroup.style.display = compType === 'soil_moisture' ? 'flex' : 'none';
    if (textLabelGroup) textLabelGroup.style.display = compType === 'text_label' ? 'flex' : 'none';

    if (compType === 'led') {
        document.getElementById('ledForwardV').value = compData.forwardV !== undefined ? compData.forwardV : 2.2;
        document.getElementById('ledFullDriveI').value = compData.fullDriveI !== undefined ? compData.fullDriveI : 10;
        document.getElementById('ledBreakdownV').value = compData.breakdownV !== undefined ? compData.breakdownV : 4.0;
        const ledColorSelect = document.getElementById('ledColor');
        
        if (ledColorSelect) {
            ledColorSelect.value = compData.color || 'red';
            
            // LOGIKA OTOMATISASI V_F BERDASARKAN WARNA
            ledColorSelect.onchange = (e) => {
                const color = e.target.value;
                const vfInput = document.getElementById('ledForwardV');
                
                // Setel tegangan V_F berdasarkan material semikonduktor dunia nyata
                if (color === 'red') vfInput.value = 2.2;
                else if (color === 'yellow') vfInput.value = 2.1;
                else if (color === 'green') vfInput.value = 3.0; // InGaN Green
                else if (color === 'blue') vfInput.value = 3.3;  // InGaN Blue
           };
        }
    } else if (compType === 'text_label') {
        document.getElementById('textLabelContent').value = compData.customText || 'Teks Baru';
        document.getElementById('textLabelSize').value = compData.fontSize || 16;    
        document.getElementById('textLabelColor').value = compData.textColor || '#ffffff';
        document.getElementById('textLabelFont').value = compData.fontFamily || 'sans-serif';
        document.getElementById('textLabelBox').checked = compData.showBox || false;
    } else if (compType === 'arduino_uno') {
        const codeEditor = document.getElementById('arduinoCodeEditor');
        if (codeEditor) {
            // 🌟 Cek apakah ada backup kode terakhir di memori LocalStorage
            let backupCode = '';
            try { backupCode = localStorage.getItem(`backup_arduino_code_${compId}`); } catch(e) {}
            
            const defaultCode = `function setup() {\n  // Tulis kodemu di sini\n  pinMode(13, OUTPUT);\n}\n\nfunction loop() {\n  // Kode ini diulang terus-menerus\n  let time = millis();\n  // Contoh: digitalWrite(13, HIGH);\n}`;
            
            // Prioritas: 1. Kode yang sudah ada, 2. Backup LocalStorage (jika Arduino baru ditarik), 3. Kode Default
            if (compData.customCode !== undefined) {
                codeEditor.value = compData.customCode;
            } else if (backupCode) {
                codeEditor.value = backupCode; 
                this.showToast('Kode berhasil dipulihkan dari Auto-Save!');
            } else {
                codeEditor.value = defaultCode;
            }
        }
    } else if (compType === 'current_source') {
        const rawCurrent = compData.customValue !== undefined ? compData.customValue : 0.02;
        const inputEl = document.getElementById('csCurrent');
        const unitEl = document.getElementById('csCurrentUnit');
        // Logika Tampilan Otomatis:
        // Jika arus lebih besar dari 0 tapi kurang dari 1A, ubah tampilan ke format mA
        if (rawCurrent > 0 && rawCurrent < 1) {
            unitEl.value = "0.001"; 
            inputEl.value = rawCurrent * 1000; // 0.02 A dikali 1000 jadi 20 mA
        } else {
            unitEl.value = "1";
            inputEl.value = rawCurrent;
        }
        document.getElementById('csVComp').value = compData.v_comp !== undefined ? compData.v_comp : 24.0;  
    } else if (compType === 'diode_bridge') {
        // Ambil nilai dari memori. Jika kosong, default ke 100V.
        document.getElementById('bridgePIV').value = compData.breakdownV !== undefined ? compData.breakdownV : 100.0;    
    } else if (compType === 'lamp') {
        document.getElementById('lampRatedV').value = compData.ratedV !== undefined ? compData.ratedV : 12;
        document.getElementById('lampPowerW').value = compData.powerW !== undefined ? compData.powerW : 5;   
    } else if (compType === 'transformer' || compType === 'transformer_2p2s') {
        document.getElementById('trafoPriV').value = compData.priV !== undefined ? compData.priV : 220;
        document.getElementById('trafoSecV').value = compData.secV !== undefined ? compData.secV : 24;
        document.getElementById('trafoCoupling').value = compData.coupling !== undefined ? compData.coupling : 1.0;
    } else if (compType === 'motor_dc') {
        document.getElementById('motorRatedV').value = compData.ratedV !== undefined ? compData.ratedV : 12;
        document.getElementById('motorMaxRPM').value = compData.maxRpm !== undefined ? compData.maxRpm : 3000;
        document.getElementById('motorCoilR').value = compData.coilR !== undefined ? compData.coilR : 15;
    } else if (compType.startsWith('relay')) {
        document.getElementById('relayCoilV').value = compData.coilV !== undefined ? compData.coilV : 5.0;
        document.getElementById('relayCoilR').value = compData.coilR !== undefined ? compData.coilR : 100;
        document.getElementById('relayContactR').value = compData.contactR !== undefined ? compData.contactR : 0.1;    
    } else if (compType === 'zener_diode') {
      document.getElementById('zenerVz').value = compData.customValue !== undefined ? compData.customValue : 5.1;
      document.getElementById('zenerIzt').value = compData.izt !== undefined ? compData.izt : 5.0; // Default Izt 5mA  
      // Tampilkan nilai Rz jika sebelumnya sudah pernah disetel pengguna, jika belum biarkan kosong.
      document.getElementById('zenerRz').value = compData.rz !== undefined ? compData.rz : '';  
    } else if (compType === 'opamp') {
        document.getElementById('opampPosRail').value = compData.posRail !== undefined ? compData.posRail : 15;
        document.getElementById('opampNegRail').value = compData.negRail !== undefined ? compData.negRail : -15;
    } else if (compType === 'vsine') {
        document.getElementById('vsineAmp').value = compData.customValue !== undefined ? compData.customValue : 12;
        document.getElementById('vsineFreq').value = compData.freqValue !== undefined ? compData.freqValue : 1;
        document.getElementById('vsineOffset').value = compData.dcOffset !== undefined ? compData.dcOffset : 0;
        document.getElementById('vsineDelay').value = compData.timeDelay !== undefined ? compData.timeDelay : 0;
    } else if (compType === 'pulse_generator') {
        document.getElementById('pulseVInit').value = compData.v_initial !== undefined ? compData.v_initial : 0;
        document.getElementById('pulseVPeak').value = compData.v_peak !== undefined ? compData.v_peak : 5;
        document.getElementById('pulseDelay').value = compData.t_delay !== undefined ? compData.t_delay : 0;
        document.getElementById('pulseRise').value = compData.t_rise !== undefined ? compData.t_rise : 0.01;
        document.getElementById('pulseOn').value = compData.t_on !== undefined ? compData.t_on : 0.48;
        document.getElementById('pulseFall').value = compData.t_fall !== undefined ? compData.t_fall : 0.01;
        document.getElementById('pulsePeriod').value = compData.t_period !== undefined ? compData.t_period : 1.0;
    }
    if (compType === 'soil_moisture') {
        document.getElementById('soilThreshold').value = compData.threshold !== undefined ? compData.threshold : 50;
    }
    if (compType === 'thermistor_ntc') {
        document.getElementById('ntcR25').value = compData.r25 !== undefined ? compData.r25 : 10000;
        document.getElementById('ntcBeta').value = compData.beta !== undefined ? compData.beta : 3950;
    } else if (compType === 'thermistor_ptc') {
        document.getElementById('ptcR25').value = compData.r25 !== undefined ? compData.r25 : 100;
        document.getElementById('ptcAlpha').value = compData.alpha !== undefined ? compData.alpha : 0.05;
    }
    if (compType === 'servo') {
        document.getElementById('servoMaxAngle').value = compData.maxAngle !== undefined ? compData.maxAngle : 180;
    }
    if (compType === 'clock_pulse') {
        const freqInput = document.getElementById('clockFreq');
        const periodInput = document.getElementById('clockPeriod');
        const initialInput = document.getElementById('clockInitial');

        // 1. Ambil nilai frekuensi dari memori komponen (default 2 Hz)
        const freqVal = compData.freqValue !== undefined ? compData.freqValue : 2;
        
        // 2. Setel nilai pada input Frekuensi dan Periode (Gunakan parseFloat agar nol tidak berguna terhapus)
        freqInput.value = freqVal;
        if (periodInput) periodInput.value = parseFloat((1 / freqVal).toFixed(4)); 
        initialInput.value = compData.initialState !== undefined ? compData.initialState : '0';

        // 3. SINKRONISASI OTOMATIS: Jika mengetik Frekuensi
        freqInput.oninput = () => {
            const f = parseFloat(freqInput.value);
            if (f > 0 && periodInput) {
                // Beri presisi hingga 4 digit di belakang koma
                periodInput.value = parseFloat((1 / f).toFixed(4));
            }
        };

        // 4. SINKRONISASI OTOMATIS: Jika mengetik Periode
        if (periodInput) {
            periodInput.oninput = () => {
                const p = parseFloat(periodInput.value);
                if (p > 0) {
                    // Beri presisi hingga 4 digit di belakang koma (Tidak lagi toFixed(2)!)
                    freqInput.value = parseFloat((1 / p).toFixed(4));
                }
            };
        }
    }
    if (compType.startsWith('ff_')) {
        document.getElementById('ffInitial').value = compData.initialState !== undefined ? compData.initialState : '0';
        document.getElementById('ffDelay').value = compData.propDelay !== undefined ? compData.propDelay : 0;
    }
    if (isSlider) {
      const stepInput = document.getElementById('potStepValue');
      if (stepInput) {
          let defaultStep = compType === 'ldr' ? 100 : (compType === 'potentiometer' ? 5 : 1);
          stepInput.value = compData.stepValue !== undefined ? compData.stepValue : defaultStep;
      }
      const compSlider = document.getElementById('compSlider');
      // Setel batas Minimum dan Maksimum secara dinamis!
      if (compType.startsWith('thermistor') || compType === 'sensor_lm35') {
          compSlider.min = compType === 'sensor_lm35' ? -55 : -40;
          compSlider.max = 150;
      } else if (compType === 'ldr') {
          compSlider.min = 0;
          compSlider.max = 100000;
      } else if (compType === 'hc_sr04') {
          compSlider.min = 0;
          compSlider.max = 400;
      } else if (compType === 'ir_sensor') {
          compSlider.min = 0;   
          compSlider.max = 50;  
      } else if (compType === 'soil_moisture') {
          compSlider.min = 0;   
          compSlider.max = 100;  
      } else {
          compSlider.min = 0;
          compSlider.max = 100;
      }
      let val = parseInt(compData.state || (compType === 'ldr' ? '500' : '50'));
      compSlider.value = val;
      document.getElementById('sliderValueDisplay').innerText = val;
      
      if (compType.startsWith('thermistor') || compType === 'sensor_lm35') document.getElementById('sliderUnit').innerText = ' °C (Suhu)';
      else if (compType === 'ldr') document.getElementById('sliderUnit').innerText = ' Lux (Cahaya)';
      else if (compType === 'hc_sr04') document.getElementById('sliderUnit').innerText = ' cm (Jarak)';
      else document.getElementById('sliderUnit').innerText = ' % (Putaran)';
    }
    if (!hideText) {
      // --- LOGIKA MEMBACA NILAI KOMPONEN (DIPERBAIKI) ---
      // BUGFIX: sebelumnya defaulting nilai null hanya menangani 'fuse' dan
      // ditaruh di cabang yang sama dengan penentuan tampilan baterai (if/else if),
      // sehingga baterai/power_terminal dengan customValue null tidak pernah
      // menampilkan preset & nilainya. Sekarang defaulting dipisah dari tampilan.
      let val = compData.customValue;
      if (compType === 'voltage_divider') {
          val = subType === 'r1' ? (compData.r1Value || 10000) : (compData.r2Value || 10000);
      } else if (val == null) {
        if (compType === 'fuse') val = 10;
        else if (compType === 'resistor') val = 330;
        else if (compType === 'potentiometer') val = 10000; 
        else if (compType === 'capacitor') val = 10;
        else if (compType === 'battery_1cell') val = 1.5;
        else if (compType === 'zener_diode') val = 5.1; // Default Vz Zener = 5.1 Volt
        else if (compType === 'net_tunnel') val = 1; // Default ke Channel 1
        else if (compType.startsWith('battery') || compType === 'power_terminal') val = 12;
      }
      if (compType.startsWith('battery') || compType === 'power_terminal') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">V (Volt)</option>';
        document.getElementById('valCurrent').textContent = `${val} V`;
        if (compType !== 'zener_diode' && batteryPresets) batteryPresets.style.display = 'block';
      }
      if (compType === 'fuse') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">A (Ampere)</option>';
        document.getElementById('valCurrent').textContent = `${val} A`;
        if (fusePresets) fusePresets.style.display = 'block';
      } else if (compType === 'resistor' || compType === 'voltage_divider' || compType === 'potentiometer') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">Ω</option><option value="1000">kΩ</option><option value="1000000">MΩ</option>';
        if (val >= 1000000) { if (unitSelect) unitSelect.value = "1000000"; document.getElementById('compValue').value = val/1000000; }
        else if (val >= 1000) { if (unitSelect) unitSelect.value = "1000"; document.getElementById('compValue').value = val/1000; }
        else { if (unitSelect) unitSelect.value = "1"; document.getElementById('compValue').value = val; }
        document.getElementById('valCurrent').textContent = `${val >= 1000000 ? (val/1000000)+' MΩ' : (val >= 1000 ? (val/1000)+' kΩ' : val+' Ω')}`;
        if (resistorPresets) resistorPresets.style.display = 'block';
      } else if (compType === 'capacitor') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">µF</option><option value="1000">mF</option><option value="1000000">F</option>';
        if (val >= 1000000) { if (unitSelect) unitSelect.value = "1000000"; document.getElementById('compValue').value = val/1000000; }
        else if (val >= 1000) { if (unitSelect) unitSelect.value = "1000"; document.getElementById('compValue').value = val/1000; }
        else { if (unitSelect) unitSelect.value = "1"; document.getElementById('compValue').value = val; }
        document.getElementById('valCurrent').textContent = `${val >= 1000 ? (val/1000)+' mF' : val+' µF'}`;
        if (capacitorPresets) capacitorPresets.style.display = 'block';
      }
      if (compType === 'net_tunnel') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">Channel</option>';
        document.getElementById('valCurrent').textContent = `CH ${val}`;
      }
      if (compType === 'fuse' || compType.startsWith('battery') || compType === 'power_terminal' || compType === 'zener_diode' || compType === 'net_tunnel') {
        document.getElementById('compValue').value = val; 
      }
    }

    document.getElementById('valueModal').classList.add('show');
    if (!isSlider) document.getElementById('compValue').focus();

   // EVENT LISTENER KALKULATOR TRANSFORMATOR
    if (compType === 'transformer' || compType === 'transformer_2p2s') {
        const inpPriV = document.getElementById('trafoPriV');
        const inpSecV = document.getElementById('trafoSecV');
        const inpPriH = document.getElementById('trafoPriH');
        const inpSecH = document.getElementById('trafoSecH');
        
        // Elemen UI Baru
        const labelSecH = document.getElementById('labelTrafoSecH');
        const ctInductancePanel = document.getElementById('trafoCTInductance');
        const inpHalfH = document.getElementById('trafoHalfH');

        const isCT = (compType === 'transformer');

        // 1. Sesuaikan Tampilan berdasarkan Jenis Trafo
        if (ctInductancePanel) {
            ctInductancePanel.style.display = isCT ? 'block' : 'none';
        }
        if (labelSecH) {
            labelSecH.innerText = isCT ? 'Total Induktansi Sekunder (Ls)' : 'Induktansi Sekunder (Ls)';
        }

        // 2. Fungsi: Ubah Volt -> Otomatis hitung Henry
        const updateHenry = () => {
            const vp = parseFloat(inpPriV.value) || 220;
            const vs = parseFloat(inpSecV.value) || 24;
            const lp = parseFloat(inpPriH.value) || 100;
            
            // Rumus Total Induktansi
            const ls = lp * Math.pow(vs / vp, 2);
            inpSecH.value = ls.toFixed(4);
            
            // 🟢 OTOMATISASI 2P3S: Hitung nilai per sisi untuk SPICE
            if (isCT && inpHalfH) {
                inpHalfH.value = (ls / 4).toFixed(4);
            }
        };

        // 3. Fungsi: Ubah Henry -> Otomatis hitung Volt
        const updateVolt = () => {
            const vp = parseFloat(inpPriV.value) || 220;
            const lp = parseFloat(inpPriH.value) || 100;
            const ls = parseFloat(inpSecH.value) || 1.19;
            
            // Rumus Tegangan
            const vs = vp * Math.sqrt(ls / lp);
            inpSecV.value = vs.toFixed(2);
            
            // 🟢 OTOMATISASI 2P3S: Hitung nilai per sisi untuk SPICE
            if (isCT && inpHalfH) {
                inpHalfH.value = (ls / 4).toFixed(4);
            }
        };

        // Pasang pendeteksi ketikan
        inpPriV.oninput = updateHenry; 
        inpSecV.oninput = updateHenry; 
        inpPriH.oninput = updateVolt;  
        inpSecH.oninput = updateVolt;  
        
        // Inisialisasi perhitungan pertama kali modal dibuka
        updateHenry(); 
    }
  },

  // Tambahkan param3 di sini
  setPresetValue(val, param2, param3) {
    if (!CircuitStore.currentEditingComponent) return;
    const compType = CircuitStore.currentEditingComponent.type;

    // JIKA YANG DIKLIK ADALAH PRESET ZENER
    if (compType === 'zener_diode') {
      document.getElementById('zenerVz').value = val;
      document.getElementById('zenerIzt').value = param2; 
    // Jika param3 ada nilainya, masukkan ke kotak Impedance. Jika tidak, kosongkan agar otomatis.
      document.getElementById('zenerRz').value = param3 !== undefined ? param3 : '';
    } 
    // JIKA YANG DIKLIK ADALAH PRESET DIODA BRIDGE
    else if (compType === 'diode_bridge') {
      document.getElementById('bridgePIV').value = val;
    }
    // JIKA YANG DIKLIK ADALAH PRESET LAIN (Resistor, dll)
    else {
      document.getElementById('compValue').value = val;
      const unitSelect = document.getElementById('compUnit');
      if (unitSelect && unitSelect.options.length > 1) { 
        unitSelect.value = param2; 
      }
    }
  },

  saveComponentValue() {
    if (!CircuitStore.currentEditingComponent) return;
    const compType = CircuitStore.currentEditingComponent.type;
    const compId = CircuitStore.currentEditingComponent.id;
    const compData = CircuitStore.components.find(c => c.id === compId);
    const comp = document.getElementById(`comp-${compId}`);

    // 1. REKAM DATA LAMA SEBELUM DIUBAH (Deep Copy)
    const oldData = JSON.parse(JSON.stringify({ ...compData, element: undefined }));

    let raw, unit;
    if (!['speaker', 'ldr', 'thermistor_ntc', 'thermistor_ptc', 'led', 'lamp', 'motor_dc', 'opamp', 'clock_pulse', 'vsine', 'ff_jk', 'ff_sr', 'ff_d', 'ff_t', 'transformer', 'transformer_2p2s', 'zener_diode', 'diode_bridge', 'net_tunnel', 'relay', 'relay_5pin', 'arduino_uno', 'hc_sr04', 'servo', 'ir_sensor', 'pulse_generator', 'current_source', 'sensor_lm35', 'soil_moisture', 'text_label'].includes(compType)) {
        raw = parseFloat(document.getElementById('compValue').value);
      const unitSelect = document.getElementById('compUnit');
      unit = unitSelect ? (parseFloat(unitSelect.value) || 1) : 1;
      if (isNaN(raw)) return this.showToast('Masukkan angka yang valid!');
      if (raw <= 0 && !['power_terminal', 'battery', 'battery_1cell', 'battery_multi', 'vsine'].includes(compType)) 
        return this.showToast('Nilai komponen pasif tidak boleh minus atau nol!');
    }
    if (compType === 'led') {
        const fv = parseFloat(document.getElementById('ledForwardV').value);
        if (isNaN(fv) || fv < 0) return this.showToast('Masukkan nilai LED yang valid!');
    } else if (compType === 'text_label') {
        const content = document.getElementById('textLabelContent').value;
        const size = parseFloat(document.getElementById('textLabelSize').value);
        if (isNaN(size) || size < 8) return this.showToast('Ukuran font minimal 8px!');
        
        compData.customText = content || 'Teks Baru';
        compData.fontSize = size;

        compData.textColor = document.getElementById('textLabelColor').value;
        compData.fontFamily = document.getElementById('textLabelFont').value;
        compData.showBox = document.getElementById('textLabelBox').checked;

        // Update SVG secara langsung di kanvas
        if (comp) {
            const svgText = comp.querySelector('text.label-content');
            if (svgText) {
                svgText.textContent = compData.customText;
                svgText.style.fontSize = compData.fontSize + 'px';
            }
        }    
    } else if (compType === 'arduino_uno') {
        const codeEditor = document.getElementById('arduinoCodeEditor');
        if (codeEditor) {
            compData.customCode = codeEditor.value;
            // PENTING: Reset bendera kompilasi agar mesin tahu ada kode baru!
            compData.hasCompiled = false; 
            
            // 🌟 TAMBAHAN BARU: Auto-Save ke Browser Memory
            try { localStorage.setItem(`backup_arduino_code_${compId}`, codeEditor.value); } catch(e) {}
        }
    } else if (compType === 'soil_moisture') {
        const threshold = parseFloat(document.getElementById('soilThreshold').value);
        if (isNaN(threshold) || threshold < 1 || threshold > 99) {
             return this.showToast('Error: Batas Trimpot harus antara 1% hingga 99%!');
        }
        compData.threshold = threshold; // Simpan ke memori komponen    
    } else if (compType === 'current_source') {
        // Ambil nilai mentah yang diketik (misal: 20)
        const inputValue = parseFloat(document.getElementById('csCurrent').value);
        // Ambil nilai pengali satuan (0.001 untuk mA, 1 untuk A)
        const unitMult = parseFloat(document.getElementById('csCurrentUnit').value);
        // KALIKAN KEDUANYA agar selalu menjadi satuan standar (Ampere)
        const iSet = inputValue * unitMult;         
        const vComp = parseFloat(document.getElementById('csVComp').value);
        // 1. Validasi Angka Kosong
        if (isNaN(inputValue) || isNaN(vComp)) {
            return this.showToast('Error: Masukkan angka yang valid!');
        }
        // 2. Validasi Angka Minus/Nol 
        if (iSet <= 0 || vComp <= 0) {
            return this.showToast('Error: Arus dan Batas Tegangan harus lebih dari 0!');
        }
        // 3. Simpan ke Memori Komponen (Semua tersimpan sebagai Ampere murni)
        compData.customValue = iSet; 
        compData.i_set = iSet;       
        compData.v_comp = vComp;          
    } else if (compType.startsWith('relay')) {
        const cV = parseFloat(document.getElementById('relayCoilV').value);
        const cR = parseFloat(document.getElementById('relayCoilR').value);
        const ctR = parseFloat(document.getElementById('relayContactR').value);
        
        if (isNaN(cV) || isNaN(cR) || isNaN(ctR) || cV <= 0 || cR <= 0 || ctR <= 0) return this.showToast('Error: Parameter relai harus lebih dari 0!');
        
        compData.coilV = cV;
        compData.coilR = cR;
        compData.contactR = ctR;
    } else if (compType === 'servo') {
    const maxAng = parseFloat(document.getElementById('servoMaxAngle').value);
    if (isNaN(maxAng) || maxAng < 10 || maxAng > 360) {
        return this.showToast('Error: Masukkan batas sudut antara 10° hingga 360°!'); }
    compData.maxAngle = maxAng; 
    } else if (compType === 'vsine') {
        const amp = parseFloat(document.getElementById('vsineAmp').value);
        const freq = parseFloat(document.getElementById('vsineFreq').value);
        const offset = parseFloat(document.getElementById('vsineOffset').value);
        const delay = parseFloat(document.getElementById('vsineDelay').value);
        if (isNaN(amp) || isNaN(freq) || isNaN(offset) || isNaN(delay)) return this.showToast('Masukkan angka yang valid untuk V-Sine!');
        if (freq <= 0) return this.showToast('Error: Frekuensi harus lebih dari 0 Hz!');
        if (amp < 0) return this.showToast('Error: Amplitudo tidak boleh minus!');
        compData.customValue = amp; compData.freqValue = freq; compData.dcOffset = offset; compData.timeDelay = delay;
    }
    else if (compType === 'thermistor_ntc') {
        const r25 = parseFloat(document.getElementById('ntcR25').value);
        const beta = parseFloat(document.getElementById('ntcBeta').value);
        if (isNaN(r25) || isNaN(beta) || r25 <= 0) return this.showToast('Error: Nilai R25 harus lebih dari 0 Ohm!');
        compData.r25 = r25; compData.beta = beta;
    } 
    else if (compType === 'thermistor_ptc') {
        const r25 = parseFloat(document.getElementById('ptcR25').value);
        const alpha = parseFloat(document.getElementById('ptcAlpha').value);
        if (isNaN(r25) || isNaN(alpha) || r25 <= 0) return this.showToast('Error: Nilai R25 harus lebih dari 0 Ohm!');
        compData.r25 = r25; compData.alpha = alpha;
    }
    else if (compType === 'clock_pulse') {
        const freq = parseFloat(document.getElementById('clockFreq').value);
        if (isNaN(freq) || freq <= 0) return this.showToast('Error: Frekuensi harus lebih dari 0 Hz!');
        compData.freqValue = freq;
        compData.initialState = document.getElementById('clockInitial').value;
        if (!CircuitStore.isSimulationActive) compData.state = compData.initialState;
    }
    else if (compType.startsWith('ff_')) {
        const delay = parseFloat(document.getElementById('ffDelay').value);
        if (isNaN(delay) || delay < 0) return this.showToast('Error: Waktu rambat tidak boleh minus!');
        compData.propDelay = delay;
        compData.initialState = document.getElementById('ffInitial').value;
        // Terapkan langsung secara visual jika simulasi sedang dalam keadaan mati
        if (!CircuitStore.isSimulationActive) {
            compData.outputState = parseInt(compData.initialState);
            compData.targetState = compData.outputState;
        }
    }
    
    // 2. TERAPKAN PERUBAHAN KE COMPDATA
    if (['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc', 'hc_sr04', 'ir_sensor', 'sensor_lm35', 'soil_moisture'].includes(compType)) {
      compData.state = document.getElementById('compSlider').value;
      
      // SIMPAN SETTINGAN STEP (Berlaku Universal untuk semua Slider)
      const stepInput = document.getElementById('potStepValue');
      if (stepInput) {
          const stepVal = parseFloat(stepInput.value);
          // Mengizinkan step berapapun asalkan di atas 0 (misal 1, 10, 100, atau 1000)
          if (!isNaN(stepVal) && stepVal > 0) {
              compData.stepValue = stepVal;
          }
      }

      if (compType === 'potentiometer') {
          compData.customValue = raw * unit;
      }
    } else if (compType === 'led') {
      const ledColorSelect = document.getElementById('ledColor');
      if (ledColorSelect) compData.color = ledColorSelect.value;
      compData.forwardV = parseFloat(document.getElementById('ledForwardV').value);
      compData.fullDriveI = parseFloat(document.getElementById('ledFullDriveI').value);
      compData.breakdownV = parseFloat(document.getElementById('ledBreakdownV').value);
      if (compData.state === 'blown') { 
          compData.state = '0'; 
          compData.isOvercurrent = false; 
          compData.hasWarned = false; 
          if (comp) comp.dataset.state = '0'; 
      }
    } else if (compType === 'lamp') {
      const rV = parseFloat(document.getElementById('lampRatedV').value);
      const pW = parseFloat(document.getElementById('lampPowerW').value);
      if (isNaN(rV) || isNaN(pW) || rV <= 0 || pW <= 0) return this.showToast('Error: Tegangan dan Daya Lampu harus lebih dari 0!');
      compData.ratedV = rV;
      compData.powerW = pW;
      // Jika sebelumnya lampu putus (meledak), pengguna bisa me-reset-nya dengan membuka modal dan menekan Simpan
      if (compData.state === 'blown') { 
          compData.state = '0'; 
          compData.hasWarned = false; // Reset peringatan agar bisa muncul lagi
          if (comp) comp.dataset.state = '0'; }  
    } else if (compType === 'transformer' || compType === 'transformer_2p2s') {
      // TAMBAHAN BARU: Simpan pengaturan Trafo ke memori
      const pV = parseFloat(document.getElementById('trafoPriV').value);
      const sV = parseFloat(document.getElementById('trafoSecV').value);
      const k = parseFloat(document.getElementById('trafoCoupling').value); 
      
      if (isNaN(pV) || isNaN(sV) || pV <= 0 || sV <= 0) return this.showToast('Error: Tegangan Trafo tidak boleh minus atau nol!');
      if (isNaN(k) || k <= 0 || k > 1) return this.showToast('Error: Nilai kopling harus antara 0.1 hingga 1.0!');
      
      compData.priV = pV;
      compData.secV = sV;    
      compData.coupling = k;
    } else if (compType === 'motor_dc') {
      compData.ratedV = parseFloat(document.getElementById('motorRatedV').value);
      compData.maxRpm = parseFloat(document.getElementById('motorMaxRPM').value);
      compData.coilR = parseFloat(document.getElementById('motorCoilR').value);
    } else if (compType === 'opamp') {
        const pr = parseFloat(document.getElementById('opampPosRail').value);
        const nr = parseFloat(document.getElementById('opampNegRail').value);
        if (isNaN(pr) || isNaN(nr) || pr <= nr) return this.showToast('Error: V+ (Positif) harus lebih besar dari V- (Negatif)!');
        compData.posRail = pr; compData.negRail = nr;
    } else if (compType === 'pulse_generator') {
    const vIni = parseFloat(document.getElementById('pulseVInit').value);
    const vPeak = parseFloat(document.getElementById('pulseVPeak').value);
    const tDelay = parseFloat(document.getElementById('pulseDelay').value);
    const tRise = parseFloat(document.getElementById('pulseRise').value);
    const tOn = parseFloat(document.getElementById('pulseOn').value);
    const tFall = parseFloat(document.getElementById('pulseFall').value);
    const tPer = parseFloat(document.getElementById('pulsePeriod').value);
    // 1. Validasi Angka Kosong
    if (isNaN(vIni) || isNaN(vPeak) || isNaN(tDelay) || isNaN(tRise) || isNaN(tOn) || isNaN(tFall) || isNaN(tPer)) {
        return this.showToast('Error: Masukkan angka yang valid untuk Pulse Generator!');
    }
    // 2. Cegah Error Divide by Zero
    if (tRise <= 0 || tOn <= 0 || tFall <= 0 || tPer <= 0) {
        return this.showToast('Error: Parameter waktu (Rise, On, Fall, Period) harus > 0!');
    }
    // 3. Validasi Logika Fisika Bentuk Gelombang
    if ((tRise + tOn + tFall) > tPer) {
        return this.showToast('Error: Total waktu (Naik + Nyala + Turun) melebihi batas 1 Periode!');
    }

    // Simpan ke Memori Komponen
    compData.v_initial = vIni;
    compData.v_peak = vPeak;
    compData.t_delay = tDelay;
    compData.t_rise = tRise;
    compData.t_on = tOn;
    compData.t_fall = tFall;
    compData.t_period = tPer;
    } else if (compType === 'vsine' || compType === 'clock_pulse' || compType === 'current_source') {    
    } else if (compType === 'zener_diode') {
        const vz = parseFloat(document.getElementById('zenerVz').value);
        const izt = parseFloat(document.getElementById('zenerIzt').value);
        const rzInput = document.getElementById('zenerRz').value;
        if (isNaN(vz) || isNaN(izt) || vz <= 0 || izt <= 0) return this.showToast('Masukkan nilai Zener yang valid (>0)!');
        compData.customValue = vz; 
        compData.izt = izt;

        if (rzInput.trim() === '') {
            delete compData.rz; // Jika dikosongkan, hapus dari memori agar mesin fisika menggunakan estimasi otomatis
        } else {
            const rzVal = parseFloat(rzInput);
            if (isNaN(rzVal) || rzVal < 0) return this.showToast('Zener Impedance harus berupa angka positif!');
            compData.rz = rzVal; // Simpan nilai Rz manual ke dalam data komponen
        }
    } else if (compType === 'diode_bridge') {
        const piv = parseFloat(document.getElementById('bridgePIV').value);
        if (isNaN(piv) || piv < 1) return this.showToast('Error: Batas tegangan mundur PIV tidak valid!');
        compData.breakdownV = piv; // Simpan nilai PIV ke data simulasi    
    } else {
      let finalVal = raw * unit; 
      if (!['fuse', 'battery', 'battery_1cell', 'battery_multi', 'power_terminal', 'capacitor', 'zener_diode'].includes(compType)) finalVal = Math.round(finalVal);
      if (compType === 'voltage_divider') {
          if (CircuitStore.currentEditingComponent.subType === 'r1') compData.r1Value = finalVal;
          else compData.r2Value = finalVal;
      } else { compData.customValue = finalVal; }
      if ((compData.type === 'fuse' || compData.type === 'led') && compData.state === 'blown') {
        compData.state = '0'; if (comp) comp.dataset.state = '0'; 
      }
    }

    if (comp && compData) {
      const cd = document.getElementById(`content-${compId}`);
      if (cd) ComponentDefs.updateContent(compData.type, compId, compData, cd, comp);
    }
    
    // 3. REKAM DATA BARU & MASUKKAN KE MESIN COMMAND PATTERN
    if (!CircuitStore.isUndoRedoOp) {
        const newData = JSON.parse(JSON.stringify({ ...compData, element: undefined }));
        HistoryManager.pushCommand('CHANGE_PARAM', { compId, oldData, newData }, `Ubah ${compType}`);
    }
    
    if (compType === 'net_tunnel') {
        // Paksa mesin fisika menjahit ulang seluruh rute nirkabel di kanvas!
        CircuitStore.topologyChanged = true; 
    }

    this.closeValueModal();
    this.showToast('Parameter berhasil disimpan');
    if (CircuitStore.isSimulationActive) SimulationEngine.run();
  },
  closeValueModal() { 
    const modal = document.getElementById('valueModal');
    if (modal) modal.classList.remove('show'); 
    CircuitStore.currentEditingComponent = null; 
  },

  showTruthTable() {
    const allSwitches = CircuitStore.components.filter(c => c.type === 'switch' || c.type === 'switch_spst');
    const allOutputs  = CircuitStore.components.filter(c => c.type === 'speaker' || c.type === 'led' || c.type === 'motor_dc' || c.type === 'solenoid' || c.type === 'logic_probe');
    
    if (!allSwitches.length) return this.showToast('Tambahkan minimal satu Switch Digital!');
    if (!allOutputs.length)  return this.showToast('Tambahkan minimal satu Komponen Output!');

    // 1. BANGUN PEMETAAN KONEKSI (Graph Adjacency List)
    let adj = {};
    CircuitStore.components.forEach(c => adj[c.id] = []);
    
    CircuitStore.connections.forEach(conn => {
        const srcComp = CircuitStore.components.find(c => c.id === conn.source.compId);
        const tgtComp = CircuitStore.components.find(c => c.id === conn.target.compId);
        
        // PENTING: Jangan jadikan Ground atau Sumber Daya sebagai jembatan penghubung antar sirkuit
        const ignoreTypes = ['ground', 'power_terminal', 'battery', 'battery_1cell', 'battery_multi', 'vsine'];
        if (srcComp && tgtComp && !ignoreTypes.includes(srcComp.type) && !ignoreTypes.includes(tgtComp.type)) {
            adj[conn.source.compId].push(conn.target.compId);
            adj[conn.target.compId].push(conn.source.compId);
        }
    });

    // 2. KELOMPOKKAN RANGKAIAN YANG TERPISAH (Clustering)
    let visited = new Set();
    let clusters = [];

    CircuitStore.components.forEach(c => {
        if (!visited.has(c.id)) {
            let cluster = new Set();
            let q = [c.id];
            visited.add(c.id);
            
            while(q.length > 0) {
                let curr = q.shift();
                cluster.add(curr);
                adj[curr].forEach(neighbor => {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        q.push(neighbor);
                    }
                });
            }
            clusters.push(cluster);
        }
    });

    // 3. PERSIAPKAN TAMPILAN UI
    const wasActive = CircuitStore.isSimulationActive;
    if (!wasActive) CircuitStore.isSimulationActive = true;

    const tableContainer = document.querySelector('#truthModal .modal-content > div[style*="overflow-x: auto"]');
    if (!tableContainer) return;
    tableContainer.innerHTML = ''; // Kosongkan tabel lama

    // Wrapper Flexbox untuk menjajarkan tabel secara responsif
    const flexWrapper = document.createElement('div');
    flexWrapper.style.display = 'flex';
    flexWrapper.style.flexWrap = 'wrap';
    flexWrapper.style.gap = '20px';
    flexWrapper.style.justifyContent = 'space-around';
    flexWrapper.style.alignItems = 'flex-start';
    tableContainer.appendChild(flexWrapper);

    const origStates = allSwitches.map(s => ({ id: s.id, state: s.state, val: s.element.dataset.state }));
    let validClusterCount = 0;

    // 4. BUAT TABEL UNTUK MASING-MASING RANGKAIAN (CLUSTER)
    clusters.forEach((cluster) => {
        const clusterSwitches = allSwitches.filter(s => cluster.has(s.id));
        const clusterOutputs = allOutputs.filter(o => cluster.has(o.id));

        // Hanya buat tabel jika di kelompok ini ada Input (Switch) DAN ada Output (LED)
        if (clusterSwitches.length > 0 && clusterOutputs.length > 0) {
            validClusterCount++;

            // Cari nama gerbang logika di kelompok ini untuk dijadikan Judul Tabel
            const logicGates = ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'];
            const gatesInCluster = CircuitStore.components.filter(c => cluster.has(c.id) && logicGates.includes(c.type));
            
            let tableName = `Rangkaian ${validClusterCount}`;
            if (gatesInCluster.length === 1) {
                tableName = `Gerbang ${gatesInCluster[0].type.toUpperCase()}`; // Munculkan "Gerbang AND", dll.
            } else if (gatesInCluster.length > 1) {
                tableName = `Kombinasi Logika`;
            }

            const tableWrapper = document.createElement('div');
            tableWrapper.style.flex = '1 1 min-content';
            tableWrapper.style.minWidth = '150px';

            const title = document.createElement('h3');
            title.style.fontSize = '14px';
            title.style.marginBottom = '8px';
            title.style.color = 'var(--primary)';
            title.style.textAlign = 'center';
            title.innerText = tableName;
            tableWrapper.appendChild(title);

            const table = document.createElement('table');
            table.className = 'truth-table';
            table.style.marginTop = '0';
            
            // Header Tabel (Gunakan penamaan input A, B, C... untuk kesan edukatif)
            const inputLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
            let thead = '<thead><tr>';
            clusterSwitches.forEach((_s, i) => thead += `<th>${inputLabels[i] || 'In'+(i+1)}</th>`);
            clusterOutputs.forEach((o, _i) => thead += `<th>${o.type === 'led' ? 'LED' : (o.type === 'logic_probe' ? 'PROBE' : 'OUT')}</th>`);
            thead += '</tr></thead>';
            table.innerHTML = thead;

            const tbody = document.createElement('tbody');
            let rows = '';

            const numSwitches = clusterSwitches.length;
            if (numSwitches > 8) {
                rows = '<tr><td colspan="100%">Maks 8 Input!</td></tr>';
            } else {
                // Iterasi hanya untuk switch di sirkuit (cluster) ini saja
                for (let i = 0; i < Math.pow(2, numSwitches); i++) {
                    const bin = i.toString(2).padStart(numSwitches, '0');
                    
                    clusterSwitches.forEach((s, j) => { 
                        s.element.dataset.state = bin[j]; 
                        s.state = bin[j]; 
                    });
                    
                    // 1. Pastikan jalur kelistrikan (nodeMap) sudah terbangun
                    if (!SimulationEngine.nodes || SimulationEngine.nodes.length === 0 || typeof SimulationEngine.getNodeIndex !== 'function') {
                        SimulationEngine.buildElectricalNodes();
                    }

                    // 2. Evaluasi HANYA Logika dan Fisika Statis (Tanpa memajukan waktu!)
                    // Iterasi 5x tetap dipertahankan agar sinyal merambat sempurna melewati gerbang logika yang berderet
                    for (let step = 0; step < 5; step++) {
                        SimulationEngine.solveDigitalLogic();
                        SimulationEngine.solveAnalogPhysics();
                    }

                    rows += '<tr>';
                    for (const b of bin) rows += `<td><strong>${b}</strong></td>`;
                    
                    clusterOutputs.forEach(o => {
                        const s = (o.simV > 1.5 || o.outputState === 1 || o.logicState === '1') ? '1' : '0';
                        rows += `<td style="background:${s==='1'?'var(--danger)':'var(--control-bg)'}; color:${s==='1'?'#fff':'var(--text-main)'}; font-weight:bold;">${s}</td>`;
                    });
                    rows += '</tr>';
                }
            }
            
            tbody.innerHTML = rows;
            table.appendChild(tbody);
            tableWrapper.appendChild(table);
            flexWrapper.appendChild(tableWrapper);
        }
    });

    // 5. KEMBALIKAN STATE AWAL SEMUA SWITCH
    allSwitches.forEach(s => {
        const orig = origStates.find(os => os.id === s.id);
        if (orig) { s.state = orig.state; s.element.dataset.state = orig.val; }
    });

    if (!wasActive) SimulationEngine.stop();
    else SimulationEngine.run();

    if (validClusterCount === 0) {
        flexWrapper.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted);">Tabel gagal dibuat. Pastikan kabel Input dan Output sudah terhubung ke gerbang logika.</p>';
    }

    const truthModal = document.getElementById('truthModal');
    if (truthModal) truthModal.classList.add('show');
  },

  closeTruthTable() { 
    const truthModal = document.getElementById('truthModal');
    if (truthModal) truthModal.classList.remove('show'); 
  },

  // ==========================================
  // FITUR SERIAL MONITOR
  // ==========================================
  openSerialMonitor() {
    const modal = document.getElementById('serialMonitorModal');
    if (modal) modal.classList.add('show');
  },

  closeSerialMonitor() {
    const modal = document.getElementById('serialMonitorModal');
    if (modal) modal.classList.remove('show');
  },

  clearSerialMonitor() {
    const output = document.getElementById('serialMonitorOutput');
    if (output) output.innerHTML = '<span style="color: #64748b;">> Layar dibersihkan...</span><br>';
  },

  printToSerialMonitor(text, isNewLine = false) {
    const output = document.getElementById('serialMonitorOutput');
    if (!output) return;

    // 🌟 PERBAIKAN 2: Pemotongan string yang aman agar tag HTML tidak rusak
    if (output.innerHTML.length > 5000) {
        // Cari tag <br> terdekat setelah indeks 2000 agar tidak memotong <span> di tengah jalan
        const safeIndex = output.innerHTML.indexOf('<br>', 2000);
        if (safeIndex !== -1) {
            output.innerHTML = output.innerHTML.substring(safeIndex + 4);
        } else {
            output.innerHTML = ""; // Kosongkan layar jika gagal menemukan batas aman
        }
    }

    // Tambahkan teks baru
    if (isNewLine) {
        output.innerHTML += text + '<br>';
    } else {
        output.innerHTML += text;
    }

    // Auto-scroll ke bawah agar teks terbaru selalu terlihat
    output.scrollTop = output.scrollHeight;
  },

  // ==========================================
  // FITUR UPLOAD / DOWNLOAD KODE ARDUINO
  // ==========================================
  handleArduinoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const codeEditor = document.getElementById('arduinoCodeEditor');
        if (codeEditor) {
            codeEditor.value = e.target.result;
            this.showToast(`File "${file.name}" berhasil dimuat!`);
        }
    };
    reader.onerror = () => {
        this.showToast("Gagal membaca isi file!");
    };
    reader.readAsText(file);
    
    // Reset input agar bisa memuat ulang file yang sama nantinya
    event.target.value = ''; 
  },

  downloadArduinoCode() {
    const codeEditor = document.getElementById('arduinoCodeEditor');
    if (!codeEditor || codeEditor.value.trim() === '') {
        return this.showToast("Kode kosong, tidak ada yang bisa diunduh.");
    }

    // Bungkus teks kode ke dalam Blob
    const blob = new Blob([codeEditor.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robot_kode.js'; // Nama file default
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast("File kode berhasil diunduh!");
  }
};