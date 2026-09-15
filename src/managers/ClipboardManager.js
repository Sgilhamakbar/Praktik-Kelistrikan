// File: src/managers/ClipboardManager.js

// 1. IMPOR KETERGANTUNGAN
import { CircuitStore } from '../state/CircuitStore.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { HistoryManager } from '../HistoryManager.js';
import { UIManager } from '../UI/UIManager.js';
import { clearSelection, deleteSelectedComponents } from '../canvas/CanvasInteractions.js';
import { buildComponentElement } from '../canvas/ComponentBuilder.js';
import { drawConnections, updateConnectionPointVisuals, getPinPosition } from '../canvas/WireManager.js';

let circuitClipboard = null;
const CLIPBOARD_STORAGE_KEY = 'labCircuitClipboard';

// 2. KEMBALIKAN PELACAK KURSOR GLOBAL DAN KABEL BAYANGAN (YANG HILANG)
let globalMouseX = 1500;
let globalMouseY = 1500;

export function initGlobalMouseTracker() {
  window.addEventListener('mousemove', e => {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      globalMouseX = (e.clientX - cr.left) / UIManager.currentZoom;
      globalMouseY = (e.clientY - cr.top) / UIManager.currentZoom;
      
      // Logika menggambar kabel bayangan biru (Temp Wire)
      if (CircuitStore.connectionStart) {
          let sp = getPinPosition(CircuitStore.connectionStart.compId, CircuitStore.connectionStart.type, CircuitStore.connectionStart.index);
          if (sp) {
              let pathStr = `M ${sp.x} ${sp.y} `;
              let lastX = sp.x;
              let lastY = sp.y;
              
              if (CircuitStore.tempWaypoints && CircuitStore.tempWaypoints.length > 0) {
                  CircuitStore.tempWaypoints.forEach(wp => {
                      if (lastX !== wp.x && lastY !== wp.y) {
                          pathStr += `L ${wp.x} ${lastY} `;
                      }
                      pathStr += `L ${wp.x} ${wp.y} `; 
                      lastX = wp.x;
                      lastY = wp.y;
                  });
              }
              
              let mx = Math.round(globalMouseX / 10) * 10;
              let my = Math.round(globalMouseY / 10) * 10;

              if (Math.abs(mx - lastX) > Math.abs(my - lastY)) my = lastY; 
              else mx = lastX; 

              pathStr += `L ${mx} ${my}`;

              let svg = document.getElementById('wire-svg');
              let tempPath = document.getElementById('temp-wire-path');
              if (!tempPath && svg) {
                  tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  tempPath.id = 'temp-wire-path';
                  tempPath.setAttribute('fill', 'none');
                  tempPath.setAttribute('stroke', '#3b82f6'); 
                  tempPath.setAttribute('stroke-width', '2.5');
                  tempPath.setAttribute('stroke-dasharray', '6,4'); 
                  tempPath.style.pointerEvents = 'none';
                  svg.appendChild(tempPath);
              }
              if (tempPath) tempPath.setAttribute('d', pathStr);
          }
      }
    }
  });
}

// 3. UBAH WINDOW. MENJADI EXPORT FUNCTION
export function copySelection() {
  if (!CircuitStore.selectedComponents || CircuitStore.selectedComponents.length === 0) return;
  
  const compsToCopy = CircuitStore.components
    .filter(c => CircuitStore.selectedComponents.includes(c.id))
    .map(({ element, ...rest }) => rest);
  
  const connsToCopy = CircuitStore.connections.filter(conn => 
    CircuitStore.selectedComponents.includes(conn.source.compId) && 
    CircuitStore.selectedComponents.includes(conn.target.compId)
  );
  
  circuitClipboard = {
    components: JSON.parse(JSON.stringify(compsToCopy)),
    connections: JSON.parse(JSON.stringify(connsToCopy))
  };

  try { localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(circuitClipboard)); } catch(e) {}
  UIManager.showToast(`📋 ${compsToCopy.length} Komponen Disalin`);
}

export function pasteClipboard() {
  if (!circuitClipboard || !circuitClipboard.components.length) {
    try {
      const saved = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
      if (saved) circuitClipboard = JSON.parse(saved);
    } catch(e) {}
  }
  if (!circuitClipboard || !circuitClipboard.components.length) return;
  
  clearSelection();
  const idMap = {}; 
  const pastedIds = [];
  
  let minX = Infinity, minY = Infinity;
  circuitClipboard.components.forEach(c => {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
  });

  let pasteX = globalMouseX;
  let pasteY = globalMouseY;
  
  if (window.matchMedia("(hover: none)").matches) {
      const wrapper = document.getElementById('canvas-wrapper');
      if (wrapper) {
          pasteX = (wrapper.scrollLeft + wrapper.clientWidth / 2) / UIManager.currentZoom;
          pasteY = (wrapper.scrollTop + wrapper.clientHeight / 2) / UIManager.currentZoom;
      }
  }

  const offsetX = pasteX - minX;
  const offsetY = pasteY - minY;

  circuitClipboard.components.forEach(oldComp => {
    const GRID_SIZE = 10;
    const newId = ++CircuitStore.componentIdCounter;
    idMap[oldComp.id] = newId; 
    pastedIds.push(newId);

    let newX = Math.round((oldComp.x + offsetX) / GRID_SIZE) * GRID_SIZE;
    let newY = Math.round((oldComp.y + offsetY) / GRID_SIZE) * GRID_SIZE;

    const newCompData = { ...oldComp, id: newId, x: newX, y: newY, inputStates: new Array(oldComp.inputs).fill(0), outputState: 0, simV: 0, simI: 0 };
    const div = buildComponentElement(newCompData);
    document.getElementById('canvas').appendChild(div);
    CircuitStore.addComponent({ ...newCompData, element: div });
    
    div.classList.add('selected'); 
  });

  CircuitStore.selectedComponents = pastedIds;

  circuitClipboard.connections.forEach(oldConn => {
    const newSrcId = idMap[oldConn.source.compId];
    const newTgtId = idMap[oldConn.target.compId];
    
    if (newSrcId && newTgtId) {
      let newWaypoints = [];
      if (oldConn.waypoints && oldConn.waypoints.length > 0) {
        newWaypoints = oldConn.waypoints.map(wp => ({ x: wp.x + offsetX, y: wp.y + offsetY }));
      }
      CircuitStore.addConnection({
        source: { compId: newSrcId, pinIndex: oldConn.source.pinIndex, type: oldConn.source.type || 'output' },
        target: { compId: newTgtId, pinIndex: oldConn.target.pinIndex, type: oldConn.target.type || 'input' },
        waypoints: newWaypoints
      });
    }
  });

  drawConnections(); updateConnectionPointVisuals();
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
  if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
      const pastedCompsData = CircuitStore.components.filter(c => pastedIds.includes(c.id)).map(c => JSON.parse(JSON.stringify({ ...c, element: undefined })));
      const pastedConnsData = CircuitStore.connections.filter(c => pastedIds.includes(c.source.compId) || pastedIds.includes(c.target.compId)).map(c => JSON.parse(JSON.stringify(c)));
      
      HistoryManager.pushCommand('PASTE_COMPONENT', { components: pastedCompsData, connections: pastedConnsData }, 'Paste komponen');
  }
  UIManager.showToast(`📌 ${circuitClipboard.components.length} Komponen Ditempel`);
}

export function clearAllWires() {
  if (!CircuitStore.connections || CircuitStore.connections.length === 0) {
    UIManager.showToast('Tidak ada kabel untuk dihapus');
    return;
  }

  UIManager.showConfirmToast('Apakah Anda yakin ingin memotong SEMUA kabel? (Komponen akan tetap aman di posisinya)', () => {
    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        const allConns = JSON.parse(JSON.stringify(CircuitStore.connections));
        HistoryManager.pushCommand('REMOVE_COMPONENT', { components: [], connections: allConns }, 'Gunting semua kabel');
    }
    CircuitStore.connections = [];
    const wireSvg = document.getElementById('wire-svg');
    if (wireSvg) wireSvg.innerHTML = '';
    document.querySelectorAll('.connection-point').forEach(pin => {
      pin.classList.remove('connected');
    });
    UIManager.showToast('✂️ Semua kabel berhasil dipotong');
  });
}

export function clearCanvas() {
  if (!CircuitStore.components.length) return UIManager.showToast('Canvas sudah kosong');
  UIManager.showConfirmToast('Hapus semua komponen dan koneksi?', () => {
    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        const allComps = CircuitStore.components.map(c => JSON.parse(JSON.stringify({ ...c, element: undefined })));
        const allConns = JSON.parse(JSON.stringify(CircuitStore.connections));
        HistoryManager.pushCommand('REMOVE_COMPONENT', { components: allComps, connections: allConns }, 'Bersihkan kanvas');
    }

    const canvas = document.getElementById('canvas');
    Array.from(canvas.children).forEach(child => {
      if (child.id !== 'wire-overlay' && child.id !== 'selection-box') child.remove();
    });

    const wireSvg = document.getElementById('wire-svg');
    if (wireSvg) wireSvg.querySelectorAll('path').forEach(p => p.remove());

    CircuitStore.components = []; CircuitStore.connections = []; clearSelection(); CircuitStore.connectionStart = null;
    CircuitStore.componentIdCounter = 0;

    if (CircuitStore.isSimulationActive || typeof SimulationEngine !== 'undefined' && SimulationEngine.isRunning) {
        // PERHATIAN: Di sistem modul, stopSim() harus diimpor atau ditangani dari event di main
        // Untuk amannya, kita matikan SimulationEngine langsung di sini:
        SimulationEngine.isRunning = false;
        try { SimulationEngine.stop(); } catch(e){}
    }
    HistoryManager.autoSaveToLocalStorage();
  });
}

// 4. BUNGKUS KENDALI KEYBOARD
export function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const activeTag = document.activeElement.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

    if (e.ctrlKey && e.key === 'c') { e.preventDefault(); copySelection(); }
    if (e.ctrlKey && e.key === 'v') { e.preventDefault(); pasteClipboard(); }
    
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); HistoryManager.undo(); }
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) { e.preventDefault(); HistoryManager.redo(); }
    
    if (e.key === 'Delete') {
      if (CircuitStore.selectedComponents.length > 0) deleteSelectedComponents();
    }
    
    if (e.key === 'Backspace' && CircuitStore.connectionStart) {
        e.preventDefault();
        if (CircuitStore.tempWaypoints && CircuitStore.tempWaypoints.length > 0) {
            CircuitStore.tempWaypoints.pop(); 
            const canvas = document.getElementById('canvas');
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                window.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: (globalMouseX * UIManager.currentZoom) + rect.left,
                    clientY: (globalMouseY * UIManager.currentZoom) + rect.top
                }));
            }
        } else {
            CircuitStore.connectionStart = null;
            let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
            document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
            UIManager.showToast('Koneksi dibatalkan');
        }
    }

    if (e.key === 'Escape') {
      CircuitStore.connectionStart = null;
      CircuitStore.tempWaypoints = []; 
      let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove(); 
      document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
      UIManager.closeValueModal();
      const ct = document.querySelector('.confirm-toast'); if (ct) ct.remove();
    }
  });
}