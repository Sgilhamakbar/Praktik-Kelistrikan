// File: src/canvas/CanvasInteractions.js

// 1. IMPOR KETERGANTUNGAN
import { CircuitStore } from '../state/CircuitStore.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { HistoryManager } from '../HistoryManager.js';
import { UIManager } from '../UI/UIManager.js';
import { ComponentDefs } from '../components/index.js';

import { getPinPosition, optimizedDrawConnections, drawConnections, updateConnectionPointVisuals } from './WireManager.js';
import { createComponent } from './ComponentBuilder.js';

export const togglePushButtonLock = function(id, locked) {
    const comp = CircuitStore.components.find(c => c.id === id);
    if (!comp || (comp.type !== 'push_button' && comp.type !== 'push_button_nc')) return;
    
    const oldData = JSON.parse(JSON.stringify({ ...comp, element: undefined }));

    comp.locked = locked;
    if (locked) comp.state = '1'; 

    if (typeof ComponentDefs !== 'undefined') {
        const contentDiv = document.getElementById(`content-${id}`);
        if (contentDiv) ComponentDefs.updateDOMState(comp.type, comp, contentDiv, id);
    }

    const newData = JSON.parse(JSON.stringify({ ...comp, element: undefined }));
    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        HistoryManager.pushCommand('CHANGE_PARAM', { compId: id, oldData, newData }, `Kunci Push Button`);
    }
};

// 🟢 FIX: Deklarasi eksplisit di luar fungsi (Module Scope) agar tidak mencemari global 'window'
// 🟢 Variabel global untuk menahan memori awal sebelum sensor bergeser
let activeSensorOldData = null; 
let sensorSaveTimeout = null; 

export const adjustSensorValue = function(id, delta) {
    const comp = CircuitStore.components.find(c => c.id === id);
    if (!comp) return;

    // Amankan data lama SAAT KLIK PERTAMA KALI
    if (!activeSensorOldData) activeSensorOldData = JSON.parse(JSON.stringify({ ...comp, element: undefined }));

    let val = parseFloat(comp.state) || 0;
    
    // BACA SETTINGAN 'STEP' DARI MEMORI KOMPONEN
    let stepSize = comp.stepValue !== undefined ? comp.stepValue : Math.abs(delta);
    
    // Sesuaikan nilai berdasarkan arah tombol yang diklik (+ atau -)
    if (delta > 0) {
        val += stepSize;
    } else if (delta < 0) {
        val -= stepSize;
    }

    // PERBAIKAN: Tentukan batas Maksimal dan Minimal berdasarkan Jenis Komponen!
    let maxLimit = 100;
    let minLimit = 0;

    if (comp.type === 'hc_sr04') {
        maxLimit = 400; // Batas Ultrasonik 400 cm
        minLimit = 0;   // Minimal 0 cm
    } else if (comp.type === 'ir_sensor') {
        maxLimit = 50;  // Batas Sensor IR 50 cm
        minLimit = 1;
    } else if (comp.type === 'ldr') {
        maxLimit = 100000; // Batas Lux Cahaya
        minLimit = 0;
    } else if (comp.type.startsWith('thermistor') || comp.type === 'sensor_lm35') {
        maxLimit = 150; 
        minLimit = comp.type === 'sensor_lm35' ? -55 : -40;
    }

    // Kunci nilai agar tidak menembus batas atas maupun batas bawah
    val = Math.max(minLimit, Math.min(maxLimit, val));

    // Simpan ke memori komponen
    comp.state = val.toString();
    
    const contentDiv = document.getElementById(`content-${id}`);
    if (contentDiv && typeof ComponentDefs !== 'undefined') {
        ComponentDefs.updateDOMState(comp.type, comp, contentDiv, id);
    }
    
    // Jalankan mesin simulasi
    if (CircuitStore.isSimulationActive) SimulationEngine.run();

    clearTimeout(sensorSaveTimeout);
    sensorSaveTimeout = setTimeout(() => {
        const newData = JSON.parse(JSON.stringify({ ...comp, element: undefined }));
        if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
            HistoryManager.pushCommand('CHANGE_PARAM', { compId: id, oldData: activeSensorOldData, newData }, `Atur sensor`);
        }
        activeSensorOldData = null; // Reset untuk geseran berikutnya
    }, 500);
};

export const adjustFlasherSpeed = function(id, delta) {
    const comp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
    if (comp) {
        if (!activeSensorOldData) activeSensorOldData = JSON.parse(JSON.stringify({ ...comp, element: undefined }));

        if (comp.customValue === undefined) comp.customValue = 500;
        let step = delta;
        if (comp.customValue <= 100 && delta < 0) step = -10; 
        if (comp.customValue < 100 && delta > 0) step = 10;   
        
        comp.customValue += step;
        if (comp.customValue < 10) comp.customValue = 10;
        if (comp.customValue > 5000) comp.customValue = 5000;

        const contentDiv = document.getElementById(`content-${id}`);
        if (contentDiv && typeof ComponentDefs !== 'undefined') {
            ComponentDefs.updateDOMState('flasher', comp, contentDiv, id);
        }

        clearTimeout(sensorSaveTimeout);
        sensorSaveTimeout = setTimeout(() => {
            const newData = JSON.parse(JSON.stringify({ ...comp, element: undefined }));
            if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
                HistoryManager.pushCommand('CHANGE_PARAM', { compId: id, oldData: activeSensorOldData, newData }, `Atur kecepatan Flasher`);
            }
            activeSensorOldData = null; 
        }, 500);
    }
};

// ─── Fitur Mode Pilih (Tablet/HP) ──────────────────────────────────────────────
export const toggleSelectMode = () => {
    if (typeof CircuitStore === 'undefined') return;
    CircuitStore.isSelectMode = !CircuitStore.isSelectMode;
    
    const btn = document.getElementById('btnSelectMode');
    if (btn) {
        if (CircuitStore.isSelectMode) {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary'); // Tombol jadi biru menyala
            UIManager.showToast('👆 Mode Pilih: Aktif (Ketuk komponen)');
        } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            UIManager.showToast('👆 Mode Pilih: Nonaktif');
        }
    }
};

export const selectAllComponents = () => {
    if (typeof CircuitStore === 'undefined' || CircuitStore.components.length === 0) return;
    clearSelection();
    const allIds = CircuitStore.components.map(c => c.id);
    CircuitStore.setSelection(allIds);
    CircuitStore.components.forEach(c => {
        const el = document.getElementById(`comp-${c.id}`);
        if (el) el.classList.add('selected');
    });
    UIManager.showToast(`✅ ${allIds.length} Komponen Dipilih`);
};

export const rotateComponent = (id, angle = 90) => {
  const compData = CircuitStore.components.find(c => c.id === id);
  const compEl = document.getElementById(`comp-${id}`);
  if (!compData || !compEl) return;

  const oldData = JSON.parse(JSON.stringify({ ...compData, element: undefined }));

  compData.rotation = ((compData.rotation || 0) + angle) % 360;
  
  // 🟢 BACA STATUS CERMIN SAAT DIPUTAR
  const sx = compData.mirrorX ? -1 : 1;
  const sy = compData.mirrorY ? -1 : 1;
  
  compEl.style.transform = `rotate(${compData.rotation}deg) scaleX(${sx}) scaleY(${sy})`;

  // 🟢 MANTRA ANTI-CERMIN TEKS (Scale dulu, baru Rotate)
  const texts = compEl.querySelectorAll('svg text');
  texts.forEach(txt => { 
      txt.style.transform = `scaleX(${sx}) scaleY(${sy}) rotate(-${compData.rotation}deg)`; 
  });

  drawConnections();

  const newData = JSON.parse(JSON.stringify({ ...compData, element: undefined }));
  if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
      HistoryManager.pushCommand('CHANGE_PARAM', { compId: id, oldData, newData }, `Memutar komponen`);
  }
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
};

export function mirrorSelected(axis) {
    let hasChanges = false;
    const selected = document.querySelectorAll('.circuit-component.selected');
    const affectedIds = [];
    
    selected.forEach(el => {
        const compId = parseInt(el.id.split('-')[1]);
        const compData = CircuitStore.components.find(c => c.id === compId);
        
        if (compData) {
            const rot = compData.rotation || 0;
            // Normalisasi rotasi ke nilai positif 0, 90, 180, 270
            const normRot = ((rot % 360) + 360) % 360;
            const isPerpendicular = (normRot === 90 || normRot === 270);

            // Jika posisi miring 90°/270°, tukar sumbu agar sesuai pandangan layar
            const targetAxis = isPerpendicular ? (axis === 'X' ? 'Y' : 'X') : axis;

            if (targetAxis === 'X') compData.mirrorX = !compData.mirrorX;
            else if (targetAxis === 'Y') compData.mirrorY = !compData.mirrorY;
            
            const sx = compData.mirrorX ? -1 : 1;
            const sy = compData.mirrorY ? -1 : 1;
            
            el.style.transform = `rotate(${rot}deg) scaleX(${sx}) scaleY(${sy})`;
            
            // Anti-cermin teks
            const texts = el.querySelectorAll('svg text');
            texts.forEach(txt => {
                txt.style.transform = `scaleX(${sx}) scaleY(${sy}) rotate(-${rot}deg)`;
            });
            
            affectedIds.push(compId);
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        if (typeof drawConnections !== 'undefined') drawConnections();
        if (typeof updateConnectionPointVisuals !== 'undefined') updateConnectionPointVisuals();
        
        if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
            HistoryManager.pushCommand('MIRROR_COMPONENTS', { ids: affectedIds, axis: axis }, 'Cermin Komponen');
        }
    }
}

// 2. KEMBALIKAN FUNGSI SELEKSI YANG HILANG & EKSPOR
export function clearSelection() {
  document.querySelectorAll('.circuit-component').forEach(c => c.classList.remove('selected'));
  CircuitStore.clearSelection();
}

export function selectComponent(id) {
  clearSelection();
  CircuitStore.setSelection([id]);
  const comp = document.getElementById(`comp-${id}`);
  if (comp) comp.classList.add('selected');
}

export function toggleComponentSelection(id) {
    const el = document.getElementById(`comp-${id}`);
    if (CircuitStore.selectedComponents.includes(id)) {
        CircuitStore.setSelection(CircuitStore.selectedComponents.filter(cId => cId !== id));
        if (el) el.classList.remove('selected');
    } else {
        CircuitStore.selectedComponents.push(id);
        if (el) el.classList.add('selected');
    }
}

// ─── Drag component & Group Drag ───────────────────────────────────────────────
export function startDragComponent(e, compId) {
  if (!CircuitStore.selectedComponents.includes(compId)) selectComponent(compId);

  const startX = e.clientX;
  const startY = e.clientY;
  let moved = false;
  let hasSavedState = false; // 🟢 1. TAMBAHAN BENDERA PENANDA
  const GRID_SIZE = 10;

  const dragGroup = CircuitStore.selectedComponents.map(id => {
    const comp = document.getElementById(`comp-${id}`);
    return { id: id, el: comp, origL: parseFloat(comp.style.left) || 0, origT: parseFloat(comp.style.top) || 0 };
  });

  const affectedConnections = CircuitStore.connections.filter(conn => 
    CircuitStore.selectedComponents.includes(conn.source.compId) || CircuitStore.selectedComponents.includes(conn.target.compId)
  ).map(conn => {
    // 🌟 PERBAIKAN: Ambil tipe pin secara pasti dari memori, jangan ditebak
    const sType = conn.source.type || 'output';
    const tType = conn.target.type || 'input';

    // Dapatkan posisi pin menggunakan tipe yang akurat
    const spOrig = getPinPosition(conn.source.compId, sType, conn.source.pinIndex);
    const tpOrig = getPinPosition(conn.target.compId, tType, conn.target.pinIndex);
    
    return { 
        conn, 
        origWaypoints: JSON.parse(JSON.stringify(conn.waypoints || [])), 
        sourceMoved: CircuitStore.selectedComponents.includes(conn.source.compId), 
        targetMoved: CircuitStore.selectedComponents.includes(conn.target.compId), 
        spOrig, 
        tpOrig 
    };
  });

  // HAPUS BARIS INI (Jika ada): let localSaveTimeout = null;

  function onMove(e) {
    const dx = (e.clientX - startX) / UIManager.currentZoom;
    const dy = (e.clientY - startY) / UIManager.currentZoom;
    
    // 🟢 2. SIMPAN RIWAYAT TEPAT SEBELUM KOORDINAT DIUBAH
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        if (!hasSavedState) {
            hasSavedState = true;
        }
        moved = true;
    }

    let snapDx = 0, snapDy = 0;

    dragGroup.forEach(item => {
        let newX = Math.max(0, item.origL + dx);
        let newY = Math.max(0, item.origT + dy);
        
        const cd = CircuitStore.components.find(c => c.id === item.id);
        const rot = (cd && cd.rotation) ? cd.rotation : 0;
        
        let shiftX = 0, shiftY = 0;
        if (rot === 90 || rot === 270) {
             const w = item.el.offsetWidth;
             const h = item.el.offsetHeight;
             shiftX = (w - h) / 2;
             shiftY = (h - w) / 2;
        }

        newX = Math.round((newX + shiftX) / GRID_SIZE) * GRID_SIZE - shiftX;
        newY = Math.round((newY + shiftY) / GRID_SIZE) * GRID_SIZE - shiftY;
        
        if (item.id === compId) {
           snapDx = newX - item.origL;
           snapDy = newY - item.origT;
        }

        item.el.style.left = `${newX}px`;
        item.el.style.top = `${newY}px`;
        if (cd) { cd.x = newX; cd.y = newY; }
    });

    // 🌟 PERBAIKAN FINAL: Rigid-Link Orthogonal (Tarik & Dorong Sempurna)
      affectedConnections.forEach(({ conn, origWaypoints, sourceMoved, targetMoved, spOrig, tpOrig }) => {
        if (sourceMoved && targetMoved) {
          conn.waypoints = origWaypoints.map(wp => ({ x: wp.x + snapDx, y: wp.y + snapDy }));
        } 
        else if (origWaypoints.length > 0) {
          let newWps = origWaypoints.map(wp => ({ x: wp.x, y: wp.y }));
          let dropWaypoints = false;

          // -- 1. Tarikan pada Komponen SUMBER (Awal) --
          if (sourceMoved && spOrig) {
            let firstWp = newWps[0];
            // Jika kabel keluar horizontal
            if (Math.abs(origWaypoints[0].y - spOrig.y) <= 2) {
                firstWp.y += snapDy; // Geser vertikal mengikuti pin
                // Tarik & Dorong zig-zag secara kaku (Rigid)
                if (newWps.length > 1 && Math.abs(origWaypoints[1].x - origWaypoints[0].x) <= 2) {
                    firstWp.x += snapDx;
                    newWps[1].x += snapDx;
                } else {
                    // Cek tabrakan jika hanya ada 1 belokan
                    let compS = CircuitStore.components.find(c => c.id === conn.source.compId);
                    let wS = (typeof ComponentDefs !== 'undefined' && compS) ? (ComponentDefs.getDimensions(compS.type)[0] || 60) : 60;
                    let newSpX = spOrig.x + snapDx;
                    if ((spOrig.x > (compS.x - snapDx) + wS/2 && firstWp.x < newSpX + 10) || 
                        (spOrig.x < (compS.x - snapDx) + wS/2 && firstWp.x > newSpX - 10)) dropWaypoints = true;
                }
            } 
            // Jika kabel keluar vertikal
            else if (Math.abs(origWaypoints[0].x - spOrig.x) <= 2) {
                firstWp.x += snapDx;
                if (newWps.length > 1 && Math.abs(origWaypoints[1].y - origWaypoints[0].y) <= 2) {
                    firstWp.y += snapDy;
                    newWps[1].y += snapDy;
                } else {
                    let compS = CircuitStore.components.find(c => c.id === conn.source.compId);
                    let hS = (typeof ComponentDefs !== 'undefined' && compS) ? (ComponentDefs.getDimensions(compS.type)[1] || 60) : 60;
                    let newSpY = spOrig.y + snapDy;
                    if ((spOrig.y > (compS.y - snapDy) + hS/2 && firstWp.y < newSpY + 10) || 
                        (spOrig.y < (compS.y - snapDy) + hS/2 && firstWp.y > newSpY - 10)) dropWaypoints = true;
                }
            }
          }

          // -- 2. Tarikan pada Komponen TUJUAN (Akhir) --
          if (targetMoved && tpOrig && !dropWaypoints) {
            let lastIdx = newWps.length - 1;
            let lastWp = newWps[lastIdx];
            
            // Jika kabel masuk horizontal
            if (Math.abs(origWaypoints[lastIdx].y - tpOrig.y) <= 2) {
                lastWp.y += snapDy;
                if (lastIdx > 0 && Math.abs(origWaypoints[lastIdx - 1].x - origWaypoints[lastIdx].x) <= 2) {
                    lastWp.x += snapDx;
                    newWps[lastIdx - 1].x += snapDx;
                } else {
                    let compT = CircuitStore.components.find(c => c.id === conn.target.compId);
                    let wT = (typeof ComponentDefs !== 'undefined' && compT) ? (ComponentDefs.getDimensions(compT.type)[0] || 60) : 60;
                    let newTpX = tpOrig.x + snapDx;
                    if ((tpOrig.x > (compT.x - snapDx) + wT/2 && lastWp.x < newTpX + 10) || 
                        (tpOrig.x < (compT.x - snapDx) + wT/2 && lastWp.x > newTpX - 10)) dropWaypoints = true;
                }
            } 
            // Jika kabel masuk vertikal
            else if (Math.abs(origWaypoints[lastIdx].x - tpOrig.x) <= 2) {
                lastWp.x += snapDx;
                if (lastIdx > 0 && Math.abs(origWaypoints[lastIdx - 1].y - origWaypoints[lastIdx].y) <= 2) {
                    lastWp.y += snapDy;
                    newWps[lastIdx - 1].y += snapDy;
                } else {
                    let compT = CircuitStore.components.find(c => c.id === conn.target.compId);
                    let hT = (typeof ComponentDefs !== 'undefined' && compT) ? (ComponentDefs.getDimensions(compT.type)[1] || 60) : 60;
                    let newTpY = tpOrig.y + snapDy;
                    if ((tpOrig.y > (compT.y - snapDy) + hT/2 && lastWp.y < newTpY + 10) || 
                        (tpOrig.y < (compT.y - snapDy) + hT/2 && lastWp.y > newTpY - 10)) dropWaypoints = true;
                }
            }
          }

          conn.waypoints = dropWaypoints ? [] : newWps;
        }
        else {
          conn.waypoints = [];
        }
      });
    optimizedDrawConnections();
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);

    if (moved) {
      let moveData = { components: [], connections: [] };

      // Catat pergeseran komponen
      dragGroup.forEach(item => {
        const cd = CircuitStore.components.find(c => c.id === item.id);
        if (cd) { 
            cd.x = parseFloat(item.el.style.left) || 0; 
            cd.y = parseFloat(item.el.style.top) || 0; 
            moveData.components.push({
                id: item.id, origX: item.origL, origY: item.origT, newX: cd.x, newY: cd.y
            });
        }
      });

      // Catat pergeseran kabel yang ikut tertarik
      affectedConnections.forEach(ac => {
          moveData.connections.push({
              id: ac.conn.id,
              origWaypoints: JSON.parse(JSON.stringify(ac.origWaypoints || [])),
              newWaypoints: JSON.parse(JSON.stringify(ac.conn.waypoints || []))
          });
      });

      // 🟢 REKAM AKSI MOVE_COMPONENT KE MEMORI
      if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
          HistoryManager.pushCommand('MOVE_COMPONENT', moveData, `Geser ${dragGroup.length} komponen`);
      }
    }
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

export function startTouchDragComponent(e, compId) {
  // 🌟 TAMBAHAN KUNCI: Matikan sifat asli browser (native scroll layar) sejak awal komponen disentuh
  if (e.cancelable) e.preventDefault();
  e.stopPropagation();

  if (!CircuitStore.selectedComponents.includes(compId)) selectComponent(compId);
  const t0 = e.touches[0];
  const startX = t0.clientX, startY = t0.clientY;
  let moved = false;
  let hasSavedState = false;
  const GRID_SIZE = 10;

  const dragGroup = CircuitStore.selectedComponents.map(id => {
    const comp = document.getElementById(`comp-${id}`);
    return { id: id, el: comp, origL: parseFloat(comp.style.left)||0, origT: parseFloat(comp.style.top)||0 };
  });

  // 🌟 PERBAIKAN 1: Deteksi akurat posisi pin khusus untuk layar sentuh HP
  const affectedConnections = CircuitStore.connections.filter(conn => 
    CircuitStore.selectedComponents.includes(conn.source.compId) || CircuitStore.selectedComponents.includes(conn.target.compId)
  ).map(conn => {
    const sType = conn.source.type || 'output';
    const tType = conn.target.type || 'input';
    const spOrig = getPinPosition(conn.source.compId, sType, conn.source.pinIndex);
    const tpOrig = getPinPosition(conn.target.compId, tType, conn.target.pinIndex);
    
    return { 
        conn, 
        origWaypoints: JSON.parse(JSON.stringify(conn.waypoints || [])), 
        sourceMoved: CircuitStore.selectedComponents.includes(conn.source.compId), 
        targetMoved: CircuitStore.selectedComponents.includes(conn.target.compId), 
        spOrig, 
        tpOrig 
    };
  });

  function onMove(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = (e.touches[0].clientX - startX) / UIManager.currentZoom;
    const dy = (e.touches[0].clientY - startY) / UIManager.currentZoom;
    
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        if (!hasSavedState) hasSavedState = true;
        moved = true;
    }
    
    if (moved) {
      let snapDx = 0, snapDy = 0;

      dragGroup.forEach(item => {
        let newX = Math.max(0, item.origL + dx);
        let newY = Math.max(0, item.origT + dy);
        
        const cd = CircuitStore.components.find(c => c.id === item.id);
        const rot = (cd && cd.rotation) ? cd.rotation : 0;
          
        let shiftX = 0, shiftY = 0;

        if (rot === 90 || rot === 270) {
             const w = item.el.offsetWidth;
             const h = item.el.offsetHeight;
             shiftX = (w - h) / 2;
             shiftY = (h - w) / 2;
        }

        newX = Math.round((newX + shiftX) / GRID_SIZE) * GRID_SIZE - shiftX;
        newY = Math.round((newY + shiftY) / GRID_SIZE) * GRID_SIZE - shiftY;
        
        if (item.id === compId) {
           snapDx = newX - item.origL;
           snapDy = newY - item.origT;
        }

        item.el.style.left = `${newX}px`;
        item.el.style.top = `${newY}px`;

        if (cd) { cd.x = newX; cd.y = newY; }
      });
      
      // 🌟 PERBAIKAN FINAL: Rigid-Link Orthogonal (Tarik & Dorong Sempurna)
      affectedConnections.forEach(({ conn, origWaypoints, sourceMoved, targetMoved, spOrig, tpOrig }) => {
        if (sourceMoved && targetMoved) {
          conn.waypoints = origWaypoints.map(wp => ({ x: wp.x + snapDx, y: wp.y + snapDy }));
        } 
        else if (origWaypoints.length > 0) {
          let newWps = origWaypoints.map(wp => ({ x: wp.x, y: wp.y }));
          let dropWaypoints = false;

          // -- 1. Tarikan pada Komponen SUMBER (Awal) --
          if (sourceMoved && spOrig) {
            let firstWp = newWps[0];
            // Jika kabel keluar horizontal
            if (Math.abs(origWaypoints[0].y - spOrig.y) <= 2) {
                firstWp.y += snapDy; // Geser vertikal mengikuti pin
                // Tarik & Dorong zig-zag secara kaku (Rigid)
                if (newWps.length > 1 && Math.abs(origWaypoints[1].x - origWaypoints[0].x) <= 2) {
                    firstWp.x += snapDx;
                    newWps[1].x += snapDx;
                } else {
                    // Cek tabrakan jika hanya ada 1 belokan
                    let compS = CircuitStore.components.find(c => c.id === conn.source.compId);
                    let wS = (typeof ComponentDefs !== 'undefined' && compS) ? (ComponentDefs.getDimensions(compS.type)[0] || 60) : 60;
                    let newSpX = spOrig.x + snapDx;
                    if ((spOrig.x > (compS.x - snapDx) + wS/2 && firstWp.x < newSpX + 10) || 
                        (spOrig.x < (compS.x - snapDx) + wS/2 && firstWp.x > newSpX - 10)) dropWaypoints = true;
                }
            } 
            // Jika kabel keluar vertikal
            else if (Math.abs(origWaypoints[0].x - spOrig.x) <= 2) {
                firstWp.x += snapDx;
                if (newWps.length > 1 && Math.abs(origWaypoints[1].y - origWaypoints[0].y) <= 2) {
                    firstWp.y += snapDy;
                    newWps[1].y += snapDy;
                } else {
                    let compS = CircuitStore.components.find(c => c.id === conn.source.compId);
                    let hS = (typeof ComponentDefs !== 'undefined' && compS) ? (ComponentDefs.getDimensions(compS.type)[1] || 60) : 60;
                    let newSpY = spOrig.y + snapDy;
                    if ((spOrig.y > (compS.y - snapDy) + hS/2 && firstWp.y < newSpY + 10) || 
                        (spOrig.y < (compS.y - snapDy) + hS/2 && firstWp.y > newSpY - 10)) dropWaypoints = true;
                }
            }
          }

          // -- 2. Tarikan pada Komponen TUJUAN (Akhir) --
          if (targetMoved && tpOrig && !dropWaypoints) {
            let lastIdx = newWps.length - 1;
            let lastWp = newWps[lastIdx];
            
            // Jika kabel masuk horizontal
            if (Math.abs(origWaypoints[lastIdx].y - tpOrig.y) <= 2) {
                lastWp.y += snapDy;
                if (lastIdx > 0 && Math.abs(origWaypoints[lastIdx - 1].x - origWaypoints[lastIdx].x) <= 2) {
                    lastWp.x += snapDx;
                    newWps[lastIdx - 1].x += snapDx;
                } else {
                    let compT = CircuitStore.components.find(c => c.id === conn.target.compId);
                    let wT = (typeof ComponentDefs !== 'undefined' && compT) ? (ComponentDefs.getDimensions(compT.type)[0] || 60) : 60;
                    let newTpX = tpOrig.x + snapDx;
                    if ((tpOrig.x > (compT.x - snapDx) + wT/2 && lastWp.x < newTpX + 10) || 
                        (tpOrig.x < (compT.x - snapDx) + wT/2 && lastWp.x > newTpX - 10)) dropWaypoints = true;
                }
            } 
            // Jika kabel masuk vertikal
            else if (Math.abs(origWaypoints[lastIdx].x - tpOrig.x) <= 2) {
                lastWp.x += snapDx;
                if (lastIdx > 0 && Math.abs(origWaypoints[lastIdx - 1].y - origWaypoints[lastIdx].y) <= 2) {
                    lastWp.y += snapDy;
                    newWps[lastIdx - 1].y += snapDy;
                } else {
                    let compT = CircuitStore.components.find(c => c.id === conn.target.compId);
                    let hT = (typeof ComponentDefs !== 'undefined' && compT) ? (ComponentDefs.getDimensions(compT.type)[1] || 60) : 60;
                    let newTpY = tpOrig.y + snapDy;
                    if ((tpOrig.y > (compT.y - snapDy) + hT/2 && lastWp.y < newTpY + 10) || 
                        (tpOrig.y < (compT.y - snapDy) + hT/2 && lastWp.y > newTpY - 10)) dropWaypoints = true;
                }
            }
          }

          conn.waypoints = dropWaypoints ? [] : newWps;
        }
        else {
          conn.waypoints = [];
        }
      });
      optimizedDrawConnections();
    }
  }
  
  function onEnd() {
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    
    if (moved) {
      let moveData = { components: [], connections: [] };

      dragGroup.forEach(item => {
        const cd = CircuitStore.components.find(c => c.id === item.id);
        if (cd) { 
            cd.x = parseFloat(item.el.style.left) || 0; 
            cd.y = parseFloat(item.el.style.top) || 0; 
            moveData.components.push({
                id: item.id, origX: item.origL, origY: item.origT, newX: cd.x, newY: cd.y
            });
        }
      });

      affectedConnections.forEach(ac => {
          moveData.connections.push({
              id: ac.conn.id,
              origWaypoints: JSON.parse(JSON.stringify(ac.origWaypoints || [])),
              newWaypoints: JSON.parse(JSON.stringify(ac.conn.waypoints || []))
          });
      });

      if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
          HistoryManager.pushCommand('MOVE_COMPONENT', moveData, `Geser ${dragGroup.length} komponen`);
      }
    }
  }
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
}

// ─── Drag from sidebar & Klik untuk Menambah ──────────────────────────────────
// 4. BUNGKUS SIDEBAR DRAG & DROP KE FUNGSI INIT
export function initSidebarDragAndDrop() {
  let draggedCard = null;

  document.querySelectorAll('.component-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (card.classList.contains('dragging')) return;
      const wrapper = document.getElementById('canvas-wrapper');
      
      const x = (wrapper.scrollLeft + wrapper.clientWidth / 2) / UIManager.currentZoom;
      const y = (wrapper.scrollTop + wrapper.clientHeight / 2) / UIManager.currentZoom;
      
      createComponent(card.dataset.type, x, y, +card.dataset.inputs, +card.dataset.outputs);
      UIManager.showToast('✅ Komponen ditambahkan');
    });

    card.addEventListener('dragstart', e => {
      draggedCard = card;
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: card.dataset.type, inputs: +card.dataset.inputs, outputs: +card.dataset.outputs }));
      card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', () => { 
      card.classList.remove('dragging'); 
      draggedCard = null; 
    });
  });
}

export function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
export function handleDrop(e) {
  e.preventDefault();
  const canvas = document.getElementById('canvas');
  const cr = canvas.getBoundingClientRect();
  const x = (e.clientX - cr.left) / UIManager.currentZoom;
  const y = (e.clientY - cr.top) / UIManager.currentZoom;
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    createComponent(data.type, x, y, data.inputs, data.outputs);
    UIManager.showToast('✅ Komponen ditambahkan');
  } catch(err) {}
}

// ─── MARQUEE SELECTION & ROUTING MANUAL ─────────────────────────────────────────
export function handleCanvasMouseDown(e) {
  if (e.target.id !== 'canvas' && e.target.id !== 'wire-overlay' && e.target.id !== 'wire-svg') return;
  if (e.button !== 0) return; // Hanya baca klik kiri

  if (!e.shiftKey && !CircuitStore.isSelectMode) clearSelection();

  // JIKA SEDANG PASANG KABEL, KLIK KANVAS = BUAT TITIK BELOK (WAYPOINT)
  if (CircuitStore.connectionStart) {
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    let mx = (e.clientX - cr.left) / UIManager.currentZoom;
    let my = (e.clientY - cr.top) / UIManager.currentZoom;
    
    // Grid Snapping (Magnet 10px)
    mx = Math.round(mx / 10) * 10;
    my = Math.round(my / 10) * 10;

    // Lacak titik terakhir
    let sp = getPinPosition(CircuitStore.connectionStart.compId, CircuitStore.connectionStart.type, CircuitStore.connectionStart.index);
    let lastX = sp ? sp.x : mx;
    let lastY = sp ? sp.y : my;
    
    if (CircuitStore.tempWaypoints && CircuitStore.tempWaypoints.length > 0) {
        let lastWp = CircuitStore.tempWaypoints[CircuitStore.tempWaypoints.length - 1];
        lastX = lastWp.x;
        lastY = lastWp.y;
    }

    // ORTHOGONAL LOCK SAAT DISIMPAN
    if (Math.abs(mx - lastX) > Math.abs(my - lastY)) {
        my = lastY; 
    } else {
        mx = lastX; 
    }

    if (!CircuitStore.tempWaypoints) CircuitStore.tempWaypoints = [];
    
    // Cegah titik ganda tertumpuk jika pengguna mengeklik di tempat yang persis sama
    if (lastX !== mx || lastY !== my) {
        CircuitStore.tempWaypoints.push({x: mx, y: my});
    }
    return; // Hentikan fungsi
  }

  CircuitStore.isMarqueeSelecting = true;
  const canvas = document.getElementById('canvas');
  const cr = canvas.getBoundingClientRect();
  CircuitStore.marqueeStart.x = (e.clientX - cr.left) / UIManager.currentZoom;
  CircuitStore.marqueeStart.y = (e.clientY - cr.top) / UIManager.currentZoom;

  const selBox = document.getElementById('selection-box');
  selBox.style.left = CircuitStore.marqueeStart.x + 'px';
  selBox.style.top = CircuitStore.marqueeStart.y + 'px';
  selBox.style.width = '0px';
  selBox.style.height = '0px';
  selBox.style.display = 'block';
}

export function initCanvasEvents() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    // Telinga pendengar agar kanvas bisa diklik (untuk marquee/kabel) dan dijatuhi komponen
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
}

export function initMarqueeSelection() {
  window.addEventListener('mousemove', (e) => {
    if (!CircuitStore.isMarqueeSelecting) return;
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    const currentX = (e.clientX - cr.left) / UIManager.currentZoom;
    const currentY = (e.clientY - cr.top) / UIManager.currentZoom;

    const left = Math.min(CircuitStore.marqueeStart.x, currentX);
    const top = Math.min(CircuitStore.marqueeStart.y, currentY);
    const width = Math.abs(currentX - CircuitStore.marqueeStart.x);
    const height = Math.abs(currentY - CircuitStore.marqueeStart.y);

    const selBox = document.getElementById('selection-box');
    selBox.style.left = left + 'px';
    selBox.style.top = top + 'px';
    selBox.style.width = width + 'px';
    selBox.style.height = height + 'px';

    CircuitStore.selectedComponents = [];
    CircuitStore.components.forEach(c => {
      const el = document.getElementById(`comp-${c.id}`);
      if (!el) return;
      const cx = parseFloat(el.style.left);
      const cy = parseFloat(el.style.top);
      const cw = parseFloat(el.style.width) || ComponentDefs.getDimensions(c.type)[0];
      const ch = parseFloat(el.style.height) || ComponentDefs.getDimensions(c.type)[1];

      if (cx < left + width && cx + cw > left && cy < top + height && cy + ch > top) {
        CircuitStore.selectedComponents.push(c.id);
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  });

  window.addEventListener('mouseup', () => {
    if (CircuitStore.isMarqueeSelecting) {
      CircuitStore.isMarqueeSelecting = false;
      document.getElementById('selection-box').style.display = 'none';
    }
  });
}

// ─── Delete component ──────────────────────────────────────────────────────────
export function deleteSelectedComponents() {
  if (CircuitStore.selectedComponents.length === 0) return;
  const deletedComps = CircuitStore.components.filter(c => CircuitStore.selectedComponents.includes(c.id)).map(c => JSON.parse(JSON.stringify({ ...c, element: undefined })));
    const deletedConns = CircuitStore.connections.filter(conn => 
        CircuitStore.selectedComponents.includes(conn.source.compId) || CircuitStore.selectedComponents.includes(conn.target.compId)
    ).map(c => JSON.parse(JSON.stringify(c)));

    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        HistoryManager.pushCommand('REMOVE_COMPONENT', { components: deletedComps, connections: deletedConns }, `Hapus komponen`);
    }

  CircuitStore.selectedComponents.forEach(id => {
    if (CircuitStore.connectionStart && CircuitStore.connectionStart.compId === id) {
      CircuitStore.connectionStart = null;
      CircuitStore.tempWaypoints = [];
      let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
      document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
    }
    const el = document.getElementById(`comp-${id}`);
    if (el) el.remove();
    CircuitStore.removeComponent(id);
    if (CircuitStore.currentEditingComponent && CircuitStore.currentEditingComponent.id === id) UIManager.closeValueModal();
  });

  CircuitStore.connections = CircuitStore.connections.filter(conn => 
      !CircuitStore.selectedComponents.includes(conn.source.compId) && !CircuitStore.selectedComponents.includes(conn.target.compId)
  );

  if (CircuitStore.components.length === 0) CircuitStore.componentIdCounter = 0;
  CircuitStore.selectedComponents = [];
  drawConnections(); updateConnectionPointVisuals();
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
  if (typeof UIManager !== 'undefined') UIManager.showToast('Komponen dihapus');
}

export function deleteSingleComponent(id) {
  if (CircuitStore.selectedComponents.includes(id)) {
    deleteSelectedComponents();
    return;
  }
  const deletedComp = CircuitStore.components.find(c => c.id === id);
    if (!deletedComp) return;
    const compCopy = JSON.parse(JSON.stringify({ ...deletedComp, element: undefined }));
    const deletedConns = CircuitStore.connections.filter(conn => conn.source.compId === id || conn.target.compId === id).map(c => JSON.parse(JSON.stringify(c)));
    
    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        HistoryManager.pushCommand('REMOVE_COMPONENT', { components: [compCopy], connections: deletedConns }, `Hapus komponen`);
    }
  if (CircuitStore.connectionStart && CircuitStore.connectionStart.compId === id) {
    CircuitStore.connectionStart = null;
    CircuitStore.tempWaypoints = [];
    let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
  }
  const el = document.getElementById(`comp-${id}`);
  if (el) el.remove();

  CircuitStore.removeComponent(id);
  CircuitStore.connections = CircuitStore.connections.filter(conn => conn.source.compId !== id && conn.target.compId !== id);

  if (CircuitStore.components.length === 0) CircuitStore.componentIdCounter = 0;
  if (CircuitStore.selectedComponents.includes(id)) clearSelection();
  if (CircuitStore.currentEditingComponent && CircuitStore.currentEditingComponent.id === id) {
      if (typeof UIManager !== 'undefined') UIManager.closeValueModal();
  }

  drawConnections(); updateConnectionPointVisuals();
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
}

// ─── Switch 
export function toggleSwitch(id) {
  id = Number(id);
  const comp = document.getElementById(`comp-${id}`);
  const cd = CircuitStore.components.find(c => c.id === id);
  if (!comp || !cd) return;

  const oldData = JSON.parse(JSON.stringify({ ...cd, element: undefined }));

  const next = comp.dataset.state === '0' ? '1' : '0';
  comp.dataset.state = next; cd.state = next;

  const cdiv = document.getElementById(`content-${id}`);
  if (cdiv) ComponentDefs.updateContent(cd.type, id, cd, cdiv, comp);

  const newData = JSON.parse(JSON.stringify({ ...cd, element: undefined }));
  if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
      HistoryManager.pushCommand('CHANGE_PARAM', { compId: id, oldData, newData }, `Ubah status saklar`);
  }
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
}

// 🟢 PENGHUBUNG TOMBOL TOOLBAR ATAS
window.rotateSelected = function(angle) {
    if (!CircuitStore.selectedComponents || CircuitStore.selectedComponents.length === 0) {
        if (typeof UIManager !== 'undefined') UIManager.showToast('Pilih komponen terlebih dahulu');
        return;
    }
    // Putar semua komponen yang terblok / terpilih
    CircuitStore.selectedComponents.forEach(id => rotateComponent(id, angle));
};

window.deleteSelected = function() {
    if (!CircuitStore.selectedComponents || CircuitStore.selectedComponents.length === 0) {
        if (typeof UIManager !== 'undefined') UIManager.showToast('Pilih komponen terlebih dahulu');
        return;
    }
    // Eksekusi fungsi hapus massal bawaan
    deleteSelectedComponents();
};
