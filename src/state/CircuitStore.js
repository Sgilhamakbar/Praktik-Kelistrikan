// File: src/state/CircuitStore.js

export const CircuitStore = {
  components: [],
  connections: [],
  _connectionStart: null,
  get connectionStart() { return this._connectionStart; },
  set connectionStart(val) {
      this._connectionStart = val;
      if (typeof document !== 'undefined') {
          if (val) document.body.classList.add('is-routing-wire');
          else document.body.classList.remove('is-routing-wire');
      }
  },
  wireVisualMode: 0, // 2 = Penuh, 1 = Warna Saja, 0 = Polos
  componentIdCounter: 0,
  isSimulationActive: false,
  currentEditingComponent: null,
  
  // History untuk Undo/Redo
  undoStack: [],
  redoStack: [],
  maxUndo: 100,
  isUndoRedoOp: false,

  // Multi-select state
  selectedComponents: [],
  isMarqueeSelecting: false,
  marqueeStart: { x: 0, y: 0 },
  isSelectMode: false,

  // --- Metode Manipulasi Data ---

  addComponent(compData) {
    this.components.push(compData);
  },

  removeComponent(id) {
    this.components = this.components.filter(c => c.id !== id);
    // Hapus koneksi yang terkait dengan komponen ini
    this.connections = this.connections.filter(c => 
      c.source.compId !== id && c.target.compId !== id
    );
  },

  addConnection(connData) {
    this.connections.push(connData);
  },

  removeConnection(srcId, srcPin, tgtId, tgtPin) {
    this.connections = this.connections.filter(c => 
      !(c.source.compId === srcId && c.source.pinIndex === srcPin && 
        c.target.compId === tgtId && c.target.pinIndex === tgtPin)
    );
  },

  // Menghapus semua koneksi yang menuju ke satu pin input tertentu, berapapun sumbernya.
  // Dipakai saat menyambung kabel baru ke pin input yang sudah terisi (perilaku "ganti").
  removeConnectionsTargeting(tgtId, tgtPin) {
    const before = this.connections.length;
    this.connections = this.connections.filter(c => 
      !(c.target.compId === tgtId && c.target.pinIndex === tgtPin)
    );
    return before !== this.connections.length;
  },

  clearSelection() {
    this.selectedComponents = [];
  },

  setSelection(idArray) {
    this.selectedComponents = idArray;
  },

  generateId() {
    this.componentIdCounter++;
    return this.componentIdCounter;
  }
};
