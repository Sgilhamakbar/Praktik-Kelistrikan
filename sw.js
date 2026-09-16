const CACHE_NAME = 'lab-listrik-v4.5';

// Daftar semua file yang menyusun aplikasi Anda
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './src/CommandExecutors.js',
  './src/HistoryManager.js',
  './src/main.js',
  './src/canvas/CanvasInteractions.js',
  './src/canvas/CanvasNavigation.js',
  './src/canvas/ComponentBuilder.js',
  './src/canvas/WireManager.js',
  './src/components/index.js',
  './src/components/actuators/FlasherUI.js',
  './src/components/actuators/L298NUI.js',
  './src/components/actuators/MotorDCUI.js',
  './src/components/actuators/RelayUI.js',
  './src/components/actuators/ServoUI.js',
  './src/components/actuators/SolenoidUI.js',
  './src/components/actuators/SpeakerUI.js',
  './src/components/core/BaseUIComponent.js',
  './src/components/core/ComponentDefs.js',
  './src/components/core/UIRegistry.js',
  './src/components/generator/CurrentSourceUI.js',
  './src/components/generator/PulseGeneratorUI.js',
  './src/components/indicators/LampUI.js',
  './src/components/indicators/LCD16x2UI.js',
  './src/components/indicators/LedBargraphCCUI.js',
  './src/components/indicators/LedBargraphUI.js',
  './src/components/indicators/LedUI.js',
  './src/components/indicators/SevenSegmentUI.js',
  './src/components/logic/ArduinoUnoUI.js',
  './src/components/logic/ClockPulseUI.js',
  './src/components/logic/FlipFlopsUI.js',
  './src/components/logic/IC_ChipsUI.js',
  './src/components/logic/LogicGatesUI.js',
  './src/components/meters/LogicProbeUI.js',
  './src/components/meters/MultimetersUI.js',
  './src/components/meters/OscilloscopeUI.js',
  './src/components/passive/CapacitorUI.js',
  './src/components/passive/FuseUI.js',
  './src/components/passive/ResistorUI.js',
  './src/components/passive/VoltageDividerUI.js',
  './src/components/power/ACSourceUI.js',
  './src/components/power/BatteryUI.js',
  './src/components/power/TerminalUI.js',
  './src/components/power/TransformerUI.js',
  './src/components/semiconductors/DiodeUI.js',
  './src/components/semiconductors/OpAmpUI.js',
  './src/components/semiconductors/RegulatorUI.js',
  './src/components/semiconductors/TransistorUI.js',
  './src/components/sensors/LdrUI.js',
  './src/components/sensors/ThermistorUI.js',
  './src/components/switches/PotentiometerUI.js',
  './src/components/switches/PushButtonUI.js',
  './src/components/switches/SwitchesUI.js',
  './src/components/wires/WireUI.js',
  './src/engine/AudioManager.js',
  './src/engine/SimulationEngine.js',
  './src/engine/models/index.js',
  './src/engine/models/actuators/FlasherModel.js',
  './src/engine/models/actuators/MotorDCModel.js',
  './src/engine/models/actuators/RelayModel.js',
  './src/engine/models/actuators/ServoModel.js',
  './src/engine/models/actuators/SolenoidModel.js',
  './src/engine/models/actuators/SpeakerModel.js',
  './src/engine/models/core/BaseComponent.js',
  './src/engine/models/core/ComponentRegistry.js',
  './src/engine/models/indicators/LampModel.js',
  './src/engine/models/indicators/LedBargraphCCModel.js',
  './src/engine/models/indicators/LedBargraphModel.js',
  './src/engine/models/indicators/SevenSegmentModel.js',
  './src/engine/models/logic/ClockPulseModel.js',
  './src/engine/models/logic/FlipFlopsModel.js',
  './src/engine/models/logic/IC_ChipsModel.js',
  './src/engine/models/logic/LogicGatesModel.js',
  './src/engine/models/logic/PseudoArduinoModel.js',
  './src/engine/models/meters/LogicProbeModel.js',
  './src/engine/models/meters/MultimetersModel.js',
  './src/engine/models/meters/OscilloscopeModel.js',
  './src/engine/models/passive/CapacitorModel.js',
  './src/engine/models/passive/FuseModel.js',
  './src/engine/models/passive/ResistorModel.js',
  './src/engine/models/passive/VoltageDividerModel.js',
  './src/engine/models/power/ACSourceModel.js',
  './src/engine/models/power/BatteryModel.js',
  './src/engine/models/power/TerminalModel.js',
  './src/engine/models/power/TransformerModel.js',
  './src/engine/models/semiconductors/DiodeBridgeModel.js',
  './src/engine/models/semiconductors/DiodeModel.js',
  './src/engine/models/semiconductors/OpAmpModel.js',
  './src/engine/models/semiconductors/RegulatorModel.js',
  './src/engine/models/semiconductors/TransistorModel.js',
  './src/engine/models/sensors/AnalogSensorModel.js',
  './src/engine/models/switches/PotentiometerModel.js',
  './src/engine/models/switches/SwitchesModel.js',
  './src/managers/ClipboardManager.js',
  './src/state/CircuitStore.js',
  './src/UI/ContextMenu.js',
  './src/UI/SimulationController.js',
  './src/UI/UIManager.js'
];

// 1. INSTALASI: Menyimpan file ke memori (Cache)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Membuka cache dan menyimpan file...');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Paksa service worker baru untuk langsung aktif
});

// 2. AKTIVASI: Menghapus memori (Cache) versi lama jika ada pembaruan
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache versi lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ambil alih kontrol halaman seketika
});

// 3. FETCH: Mencegat permintaan internet, berikan file dari Cache jika sedang offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika file ada di cache, berikan. Jika tidak, ambil dari internet.
        return response || fetch(event.request);
      })
  );
});
