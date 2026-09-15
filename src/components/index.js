// File: src/components/index.js

// =========================================================
// 1. EKSPOR SISTEM INTI (CORE)
// =========================================================
// Mengekspor sistem inti agar dapat dipanggil oleh main.js
export { UIRegistry } from './core/UIRegistry.js';
export { ComponentDefs } from './core/ComponentDefs.js';

// =========================================================
// 2. IMPOR & REGISTRASI SEMUA KOMPONEN
// =========================================================
// Cukup dengan mengimpor fail di bawah ini, masing-masing komponen 
// akan tereksekusi dan mendaftarkan dirinya ke UIRegistry.

// --- 1. KABEL & KONEKTOR ---
import './wires/WireUI.js';

// --- 2. SUMBER DAYA (POWER) ---
import './power/BatteryUI.js';
import './power/TerminalUI.js';
import './power/ACSourceUI.js';
import './power/TransformerUI.js';

// --- 3. KOMPONEN PASIF ---
import './passive/ResistorUI.js';
import './passive/CapacitorUI.js';
import './passive/FuseUI.js';
import './passive/VoltageDividerUI.js';

// --- 4. SAKLAR & KONTROL MANUAL (SWITCHES) ---
import './switches/SwitchesUI.js';
import './switches/PushButtonUI.js';
import './switches/PotentiometerUI.js';

// --- 5. SENSOR FISIKA ---
import './sensors/LdrUI.js';
import './sensors/ThermistorUI.js';
import './sensors/IRSensorUI.js';
import './sensors/SoilMoistureUI.js';

// --- 6. INDIKATOR VISUAL ---
import './indicators/LampUI.js';
import './indicators/LedUI.js';
import './indicators/SevenSegmentUI.js';
import './indicators/LedBargraphUI.js';
import './indicators/LedBargraphCCUI.js';
import './indicators/LCD16x2UI.js';

// --- 7. AKTUATOR & BEBAN MEKANIK ---
import './actuators/MotorDCUI.js';
import './actuators/ServoUI.js';
import './actuators/SolenoidUI.js';
import './actuators/RelayUI.js';
import './actuators/FlasherUI.js';
import './actuators/SpeakerUI.js'
import './actuators/L298NUI.js';

// --- 8. SEMIKONDUKTOR ANALOG ---
import './semiconductors/DiodeUI.js';
import './semiconductors/TransistorUI.js';
import './semiconductors/OpAmpUI.js';
import './semiconductors/RegulatorUI.js';

// --- 9. GERBANG LOGIKA & IC DIGITAL ---
import './logic/LogicGatesUI.js';
import './logic/FlipFlopsUI.js';
import './logic/ClockPulseUI.js';
import './logic/IC_ChipsUI.js';
import './logic/ArduinoUnoUI.js';
import './logic/HCSR04UI.js';

// --- 10. ALAT UKUR (METERS) & PROBE ---
import './meters/MultimetersUI.js';
import './meters/LogicProbeUI.js';
import './meters/OscilloscopeUI.js';

// --- 11. GENERATOR PULSA ---
import './generator/PulseGeneratorUI.js';
import './generator/CurrentSourceUI.js';

// --- 12. Label Teks ---
import './label/TextLabelUI.js'