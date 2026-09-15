// File: src/engine/models/index.js

// 1. Ekspor Core agar bisa dipakai oleh SimulationEngine
export { ComponentRegistry } from './core/ComponentRegistry.js';
export { BaseComponent } from './core/BaseComponent.js';

// --- 2. SUMBER DAYA (POWER) ---
import './power/BatteryModel.js';
import './power/TerminalModel.js';
import './power/ACSourceModel.js';
import './power/TransformerModel.js';

// --- 3. KOMPONEN PASIF ---
import './passive/ResistorModel.js';
import './passive/CapacitorModel.js';
import './passive/FuseModel.js';
import './passive/VoltageDividerModel.js';

// --- 4. SAKLAR & KONTROL MANUAL (SWITCHES) ---
import './switches/SwitchesModel.js';
import './switches/PotentiometerModel.js';

// --- 5. SENSOR FISIKA ---
import './sensors/AnalogSensorModel.js';
import './sensors/IRSensorModel.js';
import './sensors/SoilMoistureModel.js';

// --- 6. INDIKATOR VISUAL ---
import './indicators/LampModel.js';
import './indicators/SevenSegmentModel.js';
import './indicators/LedBargraphModel.js';
import './indicators/LedBargraphCCModel.js';
import './indicators/LCD16x2Model.js';

// --- 7. AKTUATOR & BEBAN MEKANIK ---
import './actuators/MotorDCModel.js';
import './actuators/ServoModel.js';
import './actuators/SolenoidModel.js';
import './actuators/RelayModel.js';
import './actuators/FlasherModel.js';
import './actuators/SpeakerModel.js';
import './actuators/L298NModel.js';

// --- 8. SEMIKONDUKTOR ANALOG ---
import './semiconductors/DiodeModel.js';
import './semiconductors/TransistorModel.js';
import './semiconductors/OpAmpModel.js';
import './semiconductors/DiodeBridgeModel.js';
import './semiconductors/RegulatorModel.js';

// --- 9. GERBANG LOGIKA & IC DIGITAL ---
import './logic/LogicGatesModel.js';
import './logic/FlipFlopsModel.js';
import './logic/ClockPulseModel.js';
import './logic/IC_ChipsModel.js';
import './logic/PseudoArduinoModel.js';
import './logic/HCSR04Model.js';

// --- 10. ALAT UKUR (METERS) & PROBE ---
import './meters/MultimetersModel.js';
import './meters/LogicProbeModel.js';
import './meters/OscilloscopeModel.js';

// --- 11. GENERATOR PULSA ---
import './generator/PulseGeneratorModel.js';
import './generator/CurrentSourceModel.js';

// --- 12. Label Teks ---
import './label/TextLabelModel.js'