// File: src/canvas/ComponentBuilder.js

// 1. IMPOR SEMUA KETERGANTUNGAN
import { CircuitStore } from '../state/CircuitStore.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { HistoryManager } from '../HistoryManager.js';
import { UIManager } from '../UI/UIManager.js';
import { ComponentDefs } from '../components/index.js';

// Impor fungsi create
import { createConnectionPoint } from './WireManager.js';
// Impor fungsi seleksi dan drag
import { startDragComponent, startTouchDragComponent, toggleComponentSelection, selectComponent } from './CanvasInteractions.js';

// Impor fungsi interaksi lainnya (tombol rotasi, hapus, dan saklar)
import {toggleSwitch, adjustSensorValue } from './CanvasInteractions.js';

// 2. EKSPOR FUNGSI
export function setComponentDimensions(div, type) {
  const [w, h] = ComponentDefs.getDimensions(type);
  div.style.width = `${w}px`; div.style.height = `${h}px`;
  div.style.minWidth = `${w}px`; div.style.minHeight = `${h}px`;
}

export function createComponent(type, x, y, inputs, outputs) {
  const GRID_SIZE = 10;
  const id = ++CircuitStore.componentIdCounter;
  
  let startX = Math.max(0, x - 45);
  let startY = Math.max(0, y - 35);
  
  startX = Math.round(startX / GRID_SIZE) * GRID_SIZE;
  startY = Math.round(startY / GRID_SIZE) * GRID_SIZE;

  let defaultState = ['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(type) ? '50' : '0';

  const compData = {
    id, type, inputs, outputs,
    x: startX, y: startY,
    state: defaultState,
    customValue: (type === 'resistor') ? 330 : (type === 'fuse' ? 10 : (type === 'flasher' ? 500 : (type === 'vsine' ? 12 : (type === 'battery' || type === 'battery_multi' || type === 'power_terminal' ? 12 : (type === 'battery_1cell' ? 1.5 : (type === 'capacitor' ? 10 : null)))))),
    freqValue: (type === 'vsine') ? 1 : null,
    priV: (type === 'transformer' || type === 'transformer_2p2s') ? 220 : null,
    secV: (type === 'transformer' || type === 'transformer_2p2s') ? 24 : null,
    dcOffset: (type === 'vsine') ? 0 : null,
    timeDelay: (type === 'vsine') ? 0 : null,
    inputStates: new Array(inputs).fill(0), outputState: 0,
    simV: 0, simI: 0
  };
  
  const div = buildComponentElement(compData);
  document.getElementById('canvas').appendChild(div);
  CircuitStore.addComponent({ ...compData, element: div });
  // REKAM AKSI ADD_COMPONENT KE MEMORI UNDO/REDO
  if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
    // Buang elemen DOM dari data agar aman diubah ke JSON
    const memData = JSON.parse(JSON.stringify({ ...compData, element: undefined }));
    HistoryManager.pushCommand('ADD_COMPONENT', { compId: id, compData: memData }, `Menambah ${type}`);
  }
  selectComponent(id);
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
}

// ─── Build component DOM element ───────────────────────────────────────────────
export function buildComponentElement(compData) {
  const { id, type, inputs, outputs } = compData;
  const div = document.createElement('div');
  div.className = 'circuit-component';
  div.id = `comp-${id}`;
  div.style.left = `${compData.x}px`;
  div.style.top  = `${compData.y}px`;
  div.dataset.type = type;
  div.dataset.inputs = inputs;
  div.dataset.outputs = outputs;
  div.dataset.state = compData.state;
  div.dataset.compId = id;
  setComponentDimensions(div, type);

  if (type === 'resistor' && !compData.customValue) compData.customValue = 330;
  if (type === 'voltage_divider') {
      compData.r1Value = compData.r1Value || 10000; // Default R1: 10k Ohm
      compData.r2Value = compData.r2Value || 10000; // Default R2: 10k Ohm
  }
  if (type === 'fuse' && !compData.customValue) compData.customValue = 10;
  if ((type === 'battery' || type === 'battery_multi') && !compData.customValue) compData.customValue = 12;
  if (type === 'battery_1cell' && !compData.customValue) compData.customValue = 1.5;
  if (type === 'capacitor' && !compData.customValue) compData.customValue = 10;
  if (type === 'power_terminal' && !compData.customValue) compData.customValue = 12;
  if (type === 'zener_diode' && !compData.customValue) compData.customValue = 5.1; // TAMBAHAN UNTUK ZENER

 // Tempatkan di dalam fungsi buildComponentElement (main.js)
  if (type === 'push_button' || type === 'push_button_nc') {
    const handlePress = (e) => {
      if (e.type === 'touchstart') e.preventDefault();
      
      const realComp = CircuitStore.components.find(c => c.id === id);
      if (!realComp) return;

      // Logika untuk tombol pengunci (merah/putih di bawah)
      if (e.target.closest('.lock-down-btn')) {
        e.stopPropagation(); e.preventDefault();
        realComp.locked = true; 
        realComp.state = '1';
        ComponentDefs.updateDOMState(type, realComp, div, id);
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
        return;
      }
      
      if (e.target.closest('.lock-up-btn')) {
        e.stopPropagation(); e.preventDefault();
        realComp.locked = false; 
        realComp.state = '0';
        ComponentDefs.updateDOMState(type, realComp, div, id);
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
        return;
      }
      
      if (e.target.closest('.delete-btn') || e.target.closest('.rotate-btn')) return;
      if (realComp.locked) return; 

      realComp.state = '1';
      ComponentDefs.updateDOMState(type, realComp, div, id);
      if (CircuitStore.isSimulationActive) SimulationEngine.run();
    };

    const handleRelease = (e) => {
      if (e.type === 'touchend') e.preventDefault();
      
      const realComp = CircuitStore.components.find(c => c.id === id);
      if (!realComp) return;
      
      if (realComp.locked) return; 
      if (realComp.state === '1') {
        realComp.state = '0';
        ComponentDefs.updateDOMState(type, realComp, div, id);
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
      }
    };

    div.addEventListener('mousedown', handlePress);
    div.addEventListener('mouseup', handleRelease);
    div.addEventListener('mouseleave', handleRelease); 
    div.addEventListener('touchstart', handlePress, { passive: false });
    div.addEventListener('touchend', handleRelease, { passive: false });
  }
  
// 1. Terapkan Rotasi dan Mirror saat komponen dirender dari memori/save
  compData.rotation = compData.rotation || 0;
  const sx = compData.mirrorX ? -1 : 1;
  const sy = compData.mirrorY ? -1 : 1;
  div.style.transform = `rotate(${compData.rotation}deg) scaleX(${sx}) scaleY(${sy})`;

  const contentDiv = document.createElement('div');
  contentDiv.style.width = '100%'; contentDiv.style.height = '100%';
  contentDiv.id = `content-${id}`;
  ComponentDefs.updateContent(type, id, compData, contentDiv, div);
  div.appendChild(contentDiv);

  // ANTI-CERMIN TEKS (Scale dulu, baru Rotate)
  const texts = div.querySelectorAll('svg text');
  texts.forEach(txt => {
      txt.style.transform = `scaleX(${sx}) scaleY(${sy}) rotate(-${compData.rotation}deg)`;
  });

  for (let i = 0; i < inputs; i++)  div.appendChild(createConnectionPoint(id, 'input',  i, inputs,  type));
  for (let i = 0; i < outputs; i++) div.appendChild(createConnectionPoint(id, 'output', i, outputs, type));

  div.addEventListener('mousedown', e => {
    if (e.button === 2) return;
    if (e.target.closest('.delete-btn') || 
        e.target.closest('.connection-point') || 
        e.target.closest('.control-btn') || 
        e.target.closest('button') ||
        e.target.closest('.btn-plus') ||
        e.target.closest('.btn-minus') ||
        e.target.closest('.val-trigger')) return;
    e.stopPropagation(); 
    
    // CEK MODE: Jika sedang Mode Pilih, ketuk untuk seleksi, BUKAN untuk drag
    if (CircuitStore.isSelectMode) {
        toggleComponentSelection(id);
    } else {
        startDragComponent(e, id);
    }
  });
  
  div.addEventListener('touchstart', e => {
    if (e.target.closest('.delete-btn') || 
        e.target.closest('.connection-point') || 
        e.target.closest('.control-btn') || 
        e.target.closest('button') ||
        e.target.closest('.btn-plus') ||
        e.target.closest('.btn-minus') ||
        e.target.closest('.val-trigger')) return;
        
    if (e.touches.length === 1) { 
      e.stopPropagation(); 
      // CEK MODE UNTUK HP: 
      if (CircuitStore.isSelectMode) {
          e.preventDefault(); 
          toggleComponentSelection(id);
      } else {
          // 1. MULAI TIMER TEKAN LAMA DI SINI
          // Ubah angka 500 (milidetik) di bawah jika ingin mengatur lama tekan
          window.longPressTimer = setTimeout(() => {
              const ignoredTypes = ['switch', 'push_button', 'push_button_nc', 'switch_spst', 'switch_spdt', 'voltmeter', 'voltmeter_ac', 'ammeter', 'ohmmeter', 'logic_probe', 'oscilloscope'];
              if (!ignoredTypes.includes(type)) {
                  UIManager.openValueModal(id, type, div.dataset.subType || '');
                  if (navigator.vibrate) navigator.vibrate(50);
              }
          }, 500); // <--- ATUR LAMA TEKAN DI SINI (Contoh: 800 untuk 0.8 detik)

          // Jika mode pilih mati, langsung siapkan fungsi geser komponen
          startTouchDragComponent(e, id); 
      }
    }
  }, { passive: false }); 

  // 🟢 FIX UTAMA: TAMBAHKAN 3 BARIS INI TEPAT DI BAWAH BLOK touchstart DI ATAS!
  // Ini memastikan jika jari diangkat (ketuk singkat) atau digeser, Timer LANGSUNG DIBATALKAN.
  div.addEventListener('touchend', () => clearTimeout(window.longPressTimer));
  div.addEventListener('touchmove', () => clearTimeout(window.longPressTimer));
  div.addEventListener('touchcancel', () => clearTimeout(window.longPressTimer));

  div.addEventListener('click', e => {
    // 🌟 1. Tangkap klik pada tombol (+)
    if (e.target.closest('.btn-plus')) {
        e.stopPropagation();
        adjustSensorValue(id, 1);
        return;
    }
    // 🌟 2. Tangkap klik pada tombol (-)
    if (e.target.closest('.btn-minus')) {
        e.stopPropagation();
        adjustSensorValue(id, -1);
        return;
    }
    // 🌟 3. Jika pengguna mengeklik angka "50cm", buka layar pengaturan (Modal)
    if (e.target.closest('.val-trigger')) {
        e.stopPropagation();
        UIManager.openValueModal(id, type, div.dataset.subType || '');
        return;
    }

    // Fungsi saklar bawaan
    if (type.startsWith('switch') && !e.target.closest('.delete-btn') && !e.target.closest('.connection-point') && !e.target.closest('button')) {
      e.stopPropagation(); 
      toggleSwitch(id);
    }
  });
  return div;
}

// SENSOR PENGATURAN KOMPONEN (LONG PRESS MOBILE)
export function initComponentSensors() {
    const canvasArea = document.getElementById('canvas'); 
    if (canvasArea) {
        const ignoredTypes = ['switch', 'push_button', 'push_button_nc', 'switch_spst', 'switch_spdt', 'voltmeter', 'voltmeter_ac', 'ammeter', 'ohmmeter', 'logic_probe', 'oscilloscope'];
        let pressTimer;

        canvasArea.addEventListener('touchstart', function(e) {
            if (e.target.closest('.btn-up, .btn-down, [class*="btn-"]')) return;
            const comp = e.target.closest('[id^="comp-"]');
            if (comp) {
                pressTimer = setTimeout(() => {
                    const compId = comp.id.split('-')[1]; 
                    const compType = comp.dataset.type;
                    const subType = comp.dataset.subType || ''; 
                    if (!ignoredTypes.includes(compType)) {
                        UIManager.openValueModal(compId, compType, subType);
                        if (navigator.vibrate) navigator.vibrate(50);
                    }
                }, 500); 
            }
        }, { passive: true });

        canvasArea.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });
        canvasArea.addEventListener('touchend', () => clearTimeout(pressTimer));
        canvasArea.addEventListener('touchcancel', () => clearTimeout(pressTimer));
    }

// SENSOR KEYBOARD (PINTASAN MODAL SETTING)
    document.addEventListener('keydown', function(e) {
        const valueModal = document.getElementById('valueModal');
        if (valueModal && valueModal.classList.contains('show')) {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                UIManager.saveComponentValue();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                UIManager.closeValueModal();
            }
        }
    });
}