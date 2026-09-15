// File: src/HistoryManager.js

// 1. IMPOR DEPENDENSI UTAMA
import { CircuitStore } from './state/CircuitStore.js';
import { UIManager } from './UI/UIManager.js';
import { SimulationEngine } from './engine/SimulationEngine.js';

// 2. IMPOR SEMUA FUNGSI EKSEKUTOR
import { 
    undoRedoParam, removeDeletedData, restoreDeletedData,
    undoSplice, redoSplice, undoAddComponent, redoAddComponent,
    undoRedoMove, undoAddWire, redoAddWire, undoRemoveWire, redoRemoveWire, 
    undoRedoMirror
} from './CommandExecutors.js';

// 3. IMPOR KEBUTUHAN KANVAS & MODEL (Inilah yang membuat komponen Anda tidak muncul!)
import { drawConnections, updateConnectionPointVisuals } from './canvas/WireManager.js'; 
import { buildComponentElement } from './canvas/ComponentBuilder.js';
import { clearSelection } from './canvas/CanvasInteractions.js';
import { ComponentRegistry, BaseComponent } from './engine/models/index.js';

export const HistoryManager = {
  // Hanya menyimpan objek aksi ringan, bukan seluruh sirkuit!
  undoStack: [],
  redoStack: [],
  maxUndo: 100,

  // =========================================================
  // 1. MESIN COMMAND PATTERN (PENDEKATAN DELTA)
  // =========================================================
  pushCommand(actionType, data, description = '') {
    if (CircuitStore.isUndoRedoOp) return;
    
    // Merekam perintah/aksi yang terjadi
    this.undoStack.push({ action: actionType, data: data, desc: description });
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
    
    this.redoStack = []; // Hapus memori Redo masa depan jika ada aksi baru
    this.updateUndoRedoButtons();
    
    // Auto-save ke localStorage agar tidak hilang jika di-refresh
    this.autoSaveToLocalStorage();
    CircuitStore.hasUnsavedChanges = true;
  },

  undo() {
    if (!this.undoStack.length) return UIManager.showToast('Tidak ada aksi yang bisa di-undo');
    const cmd = this.undoStack.pop();
    
    CircuitStore.isUndoRedoOp = true;
    this.executeInverse(cmd); // Jalankan kebalikan aksi
    CircuitStore.isUndoRedoOp = false;
    
    this.redoStack.push(cmd);
    this.updateUndoRedoButtons();
    this.autoSaveToLocalStorage();
    
    // Render ulang layar
    if (typeof drawConnections !== 'undefined') drawConnections();
    if (typeof updateConnectionPointVisuals !== 'undefined') updateConnectionPointVisuals();
    if (CircuitStore.isSimulationActive && typeof SimulationEngine !== 'undefined') SimulationEngine.run();
  },

  redo() {
    if (!this.redoStack.length) return UIManager.showToast('Tidak ada aksi yang bisa di-redo');
    const cmd = this.redoStack.pop();
    
    CircuitStore.isUndoRedoOp = true;
    this.executeForward(cmd); // Jalankan ulang aksi
    CircuitStore.isUndoRedoOp = false;
    
    this.undoStack.push(cmd);
    this.updateUndoRedoButtons();
    this.autoSaveToLocalStorage();
    
    // Render ulang layar
    if (typeof drawConnections !== 'undefined') drawConnections();
    if (typeof updateConnectionPointVisuals !== 'undefined') updateConnectionPointVisuals();
    if (CircuitStore.isSimulationActive && typeof SimulationEngine !== 'undefined') SimulationEngine.run();
  },

  // ---------------------------------------------------------
  // DISTRIBUTOR LOGIKA AKSI (AKAN KITA ISI DI LANGKAH 2 & 3)
  // ---------------------------------------------------------
  executeInverse(cmd) {
    switch(cmd.action) {
        case 'CHANGE_PARAM':
            if (typeof undoRedoParam === 'function') undoRedoParam(cmd.data.compId, cmd.data.oldData);
            break;
        case 'PASTE_COMPONENT':
            // Kebalikan dari Paste adalah Menghapusnya dari kanvas!
            if (typeof removeDeletedData === 'function') removeDeletedData(cmd.data);
            break;    
        case 'SPLICE_WIRE':
            if (typeof undoSplice === 'function') undoSplice(cmd.data);
            break;    
        case 'ADD_COMPONENT':
            if (typeof undoAddComponent === 'function') undoAddComponent(cmd.data);
            break;
        case 'MOVE_COMPONENT':
            if (typeof undoRedoMove === 'function') undoRedoMove(cmd.data, true);
            break;
        case 'REMOVE_COMPONENT':
            // Kebalikan dari Menghapus adalah Memulihkan
            if (typeof restoreDeletedData === 'function') restoreDeletedData(cmd.data);
            break;
        case 'ADD_WIRE':
            // Kebalikan dari Menambah kabel adalah Menghapus kabel itu
            if (typeof undoAddWire === 'function') undoAddWire(cmd.data);
            break;
        case 'REMOVE_WIRE':
            // Kebalikan dari Menghapus kabel adalah Memasangnya lagi
            if (typeof undoRemoveWire === 'function') undoRemoveWire(cmd.data);
            break;
        case 'MIRROR_COMPONENTS':
            if (typeof undoRedoMirror === 'function') undoRedoMirror(cmd.data);
            break;    
    }
  },

  executeForward(cmd) {
    switch(cmd.action) {
        case 'CHANGE_PARAM':
            if (typeof undoRedoParam === 'function') undoRedoParam(cmd.data.compId, cmd.data.newData);
            break;
        case 'PASTE_COMPONENT':
            // Maju: Munculkan kembali (Restore) komponen paste tersebut
            if (typeof restoreDeletedData === 'function') restoreDeletedData(cmd.data);
            break;
        case 'SPLICE_WIRE':
            // Maju: Potong kabel dan buat simpul kembali
            if (typeof redoSplice === 'function') redoSplice(cmd.data);
            break;        
        case 'ADD_COMPONENT':
            if (typeof redoAddComponent === 'function') redoAddComponent(cmd.data);
            break;
        case 'MOVE_COMPONENT':
            if (typeof undoRedoMove === 'function') undoRedoMove(cmd.data, false);
            break;
        case 'REMOVE_COMPONENT':
            // Maju: Eksekusi hapus lagi
            if (typeof removeDeletedData === 'function') removeDeletedData(cmd.data);
            break;
        case 'ADD_WIRE':
            // Maju: Pasang kabel lagi
            if (typeof redoAddWire === 'function') redoAddWire(cmd.data);
            break;
        case 'REMOVE_WIRE':
            // Maju: Hapus kabel lagi
            if (typeof redoRemoveWire === 'function') redoRemoveWire(cmd.data);
            break;
        case 'MIRROR_COMPONENTS':
            if (typeof undoRedoMirror === 'function') undoRedoMirror(cmd.data);
            break;    
    }
  },

  // =========================================================
  // 2. FUNGSI LAWAS UNTUK EKSPOR/IMPORT & AUTOSAVE
  // =========================================================
  snapshotState(desc = '') {
    const clonedComponents = CircuitStore.components.map(c => ({
      id: c.id, type: c.type, inputs: c.inputs, outputs: c.outputs,
      x: c.x, y: c.y, state: c.state, customValue: c.customValue,
      rotation: c.rotation || 0, locked: c.locked || false,
      freqValue: c.freqValue != null ? c.freqValue : null,
      r1Value: c.r1Value != null ? c.r1Value : null,
      r2Value: c.r2Value != null ? c.r2Value : null,
      forwardV: c.forwardV != null ? c.forwardV : null,
      fullDriveI: c.fullDriveI != null ? c.fullDriveI : null,
      breakdownV: c.breakdownV != null ? c.breakdownV : null,
      ratedV: c.ratedV != null ? c.ratedV : null,
      maxRpm: c.maxRpm != null ? c.maxRpm : null,
      coilR: c.coilR != null ? c.coilR : null,
      color: c.color != null ? c.color : null,
      r25: c.r25 != null ? c.r25 : null,
      beta: c.beta != null ? c.beta : null,
      alpha: c.alpha != null ? c.alpha : null,
      posRail: c.posRail != null ? c.posRail : null,
      negRail: c.negRail != null ? c.negRail : null,
      initialState: c.initialState != null ? c.initialState : null,
      dcOffset: c.dcOffset != null ? c.dcOffset : null,
      timeDelay: c.timeDelay != null ? c.timeDelay : null,
      priV: c.priV != null ? c.priV : null,
      secV: c.secV != null ? c.secV : null,
      propDelay: c.propDelay != null ? c.propDelay : null,
      customCode: c.customCode != null ? c.customCode : null,
      stepValue: c.stepValue != null ? c.stepValue : null,
      maxAngle: c.maxAngle != null ? c.maxAngle : null,
      izt: c.izt != null ? c.izt : null,
      rz: c.rz != null ? c.rz : null,
      v_initial: c.v_initial != null ? c.v_initial : null,
      v_peak: c.v_peak != null ? c.v_peak : null,
      t_delay: c.t_delay != null ? c.t_delay : null,
      t_rise: c.t_rise != null ? c.t_rise : null,
      t_on: c.t_on != null ? c.t_on : null,
      t_fall: c.t_fall != null ? c.t_fall : null,
      t_period: c.t_period != null ? c.t_period : null,
      i_set: c.i_set != null ? c.i_set : null,
      v_comp: c.v_comp != null ? c.v_comp : null,
      isMilli: c.isMilli || false, measActive: c.measActive, activeCh: c.activeCh, xPosition: c.xPosition,
      tDivIndex: c.tDivIndex, dispMode: c.dispMode, trigMode: c.trigMode, trigSource: c.trigSource, 
      trigLevel: c.trigLevel, trigSlope: c.trigSlope, trigCoupl: c.trigCoupl, cursorActive: c.cursorActive,
      curV1Y: c.curV1Y, curV2Y: c.curV2Y, curT1X: c.curT1X, curT2X: c.curT2X,
      ch1Config: c.ch1 ? { vDivIndex: c.ch1.vDivIndex, yPosition: c.ch1.yPosition, invert: c.ch1.invert, coupl: c.ch1.coupl, enabled: c.ch1.enabled } : null,
      ch2Config: c.ch2 ? { vDivIndex: c.ch2.vDivIndex, yPosition: c.ch2.yPosition, invert: c.ch2.invert, coupl: c.ch2.coupl, enabled: c.ch2.enabled } : null
    }));

    const clonedConnections = CircuitStore.connections.map(conn => ({
      id: conn.id,
      source: { compId: conn.source.compId, pinIndex: conn.source.pinIndex, type: conn.source.type || 'output' },
      target: { compId: conn.target.compId, pinIndex: conn.target.pinIndex, type: conn.target.type || 'input' },
      waypoints: conn.waypoints ? conn.waypoints.map(wp => ({ x: wp.x, y: wp.y })) : []
    }));

    return { components: clonedComponents, connections: clonedConnections, componentIdCounter: CircuitStore.componentIdCounter, description: desc };
  },

  autoSaveToLocalStorage() {
    try { localStorage.setItem('labCircuitAutoSave', JSON.stringify(this.snapshotState('Auto-save'))); } catch(e) {}
  },

  loadAutoSave() {
    try {
      const saved = localStorage.getItem('labCircuitAutoSave');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.components && state.components.length > 0) {
          CircuitStore.isUndoRedoOp = true;
          this.restoreState({ ...state, description: 'Auto-saved circuit' });
          CircuitStore.isUndoRedoOp = false;
          this.undoStack = []; this.redoStack = []; this.updateUndoRedoButtons();
          return true;
        }
      }
    } catch(e) {}
    return false;
  },

  exportCircuit() {
    if (!CircuitStore.components.length) return UIManager.showToast('Tidak ada rangkaian untuk disimpan.');
    const data = this.snapshotState('Export');
    data.version = '18.2'; data.timestamp = new Date().toISOString();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `digital-circuit-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    CircuitStore.hasUnsavedChanges = false;
    UIManager.showToast('💾 Rangkaian berhasil tersimpan');
  },

  importCircuit() { document.getElementById('importFileInput').click(); },

  handleFileImport(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.endsWith('.json')) return UIManager.showToast('File harus berformat .json');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.components || !data.connections) throw new Error('Format tidak valid');
        if (CircuitStore.components.length) UIManager.showConfirmToast('Rangkaian saat ini akan diganti. Lanjutkan?', () => this.loadCircuitData(data));
        else this.loadCircuitData(data);
      } catch(err) { UIManager.showToast('Gagal membaca file: ' + err.message); }
    };
    reader.readAsText(file); e.target.value = '';
  },

  loadCircuitData(data) {
    if (CircuitStore.isSimulationActive && typeof SimulationEngine !== 'undefined') SimulationEngine.stop();
    CircuitStore.isUndoRedoOp = true;
    const safeCounter = data.componentIdCounter != null ? data.componentIdCounter : (data.components.length > 0 ? Math.max(...data.components.map(c => c.id)) : 0);
    this.restoreState({ components: data.components, connections: data.connections, componentIdCounter: safeCounter, description: 'Load' });
    CircuitStore.isUndoRedoOp = false;
    this.undoStack = []; this.redoStack = []; this.updateUndoRedoButtons();
    UIManager.showToast('📂 File berhasil terupload & dimuat');
  },

  updateUndoRedoButtons() {
    const u = document.getElementById('btnUndo'); const r = document.getElementById('btnRedo');
    if (u) u.disabled = !this.undoStack.length;
    if (r) r.disabled = !this.redoStack.length;
  },

  restoreState(state) {
    const canvas = document.getElementById('canvas');
    Array.from(canvas.children).forEach(child => {
      if (child.id !== 'wire-overlay' && child.id !== 'selection-box') child.remove();
    });
    
    const wireSvg = document.getElementById('wire-svg');
    if (wireSvg) wireSvg.querySelectorAll('path').forEach(p => p.remove());

    CircuitStore.components = []; CircuitStore.connections = []; 
    if (typeof clearSelection !== 'undefined') clearSelection(); 
    CircuitStore.connectionStart = null;
    CircuitStore.componentIdCounter = state.componentIdCounter;

    state.components.forEach(cd => {
      const compData = { ...cd, simV: 0, simI: 0 };
      if (typeof buildComponentElement !== 'undefined') {
          const div = buildComponentElement(compData); 
          canvas.appendChild(div);
          
          // Instansiasi OOP (Karena kita sudah pakai Registry)
          let finalComp = compData;
          if (typeof ComponentRegistry !== 'undefined') {
              const ComponentClass = ComponentRegistry[compData.type] || BaseComponent;
              finalComp = new ComponentClass(compData);
          }
          finalComp.element = div;
          CircuitStore.addComponent(finalComp);
      }
    });
    
    state.connections.forEach(conn => {
      CircuitStore.addConnection({
        id: conn.id, 
        source: { compId: parseInt(conn.source.compId), pinIndex: parseInt(conn.source.pinIndex || 0), type: conn.source.type || 'output' },
        target: { compId: parseInt(conn.target.compId), pinIndex: parseInt(conn.target.pinIndex || 0), type: conn.target.type || 'input' },
        waypoints: conn.waypoints ? conn.waypoints.map(wp => ({ x: wp.x, y: wp.y })) : []
      });
    });

    requestAnimationFrame(() => {
      if (typeof drawConnections !== 'undefined') drawConnections(); 
      if (typeof updateConnectionPointVisuals !== 'undefined') updateConnectionPointVisuals();
      if (CircuitStore.isSimulationActive && typeof SimulationEngine !== 'undefined') SimulationEngine.run();
    });
  },
  // Jembatan (Bridge) agar sisa kode lawas di main.js tidak membuat aplikasi Crash
  saveStateToUndoStack(desc = '') {
      console.log('Perintah lawas diabaikan (Aman): ' + desc);
  }
};