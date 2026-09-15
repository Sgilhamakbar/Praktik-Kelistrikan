// File: src/components/core/BaseUIComponent.js

export class BaseUIComponent {
    constructor(id, compData, contentDiv, mainDiv) {
        this.id = id;
        this.compData = compData;
        this.contentDiv = contentDiv;
        this.mainDiv = mainDiv;
        
        // 🟢 OPTIMASI PERFORMA: Menyediakan tempat untuk menyimpan referensi DOM
        // agar tidak perlu memanggil querySelector() berulang kali saat animasi berjalan
        this.domCache = {}; 
    }

    // DEPENDENCY INJECTION: Kelas induk mengambil alih tugas pembacaan global
    get isSimActive() {
        return typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false;
    }
    
    get isSimPaused() {
        return typeof CircuitStore !== 'undefined' ? CircuitStore.isPaused : false;
    }

    get actualCompData() {
        if (typeof CircuitStore !== 'undefined') {
            return CircuitStore.components.find(c => c.id === this.id) || this.compData;
        }
        return this.compData;
    }

    static getDimensions() { return [80, 60]; }
    getSVG() { return `<div style="padding:10px;border:1px solid #000;color:red;background:#fee2e2;">?</div>`; }
    bindSpecificEvents() {}
    
    setPinActive(pinClass, isActive) {
        if (!this.contentDiv) return;
        const el = this.contentDiv.querySelector('.' + pinClass);
        if (el) el.classList.toggle('leg-active', isActive);
    }

    updateState(isSimActive) {
        if (this.compData.inputStates) {
            const isHigh = val => val > 2.5;
            if (this.compData.inputs > 0) this.setPinActive('pin-in-0', isHigh(this.compData.inputStates[0]));
            if (this.compData.inputs > 1) this.setPinActive('pin-in-1', isHigh(this.compData.inputStates[1]));
        }
    }
}