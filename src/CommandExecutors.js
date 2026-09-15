// File: src/CommandExecutors.js

// 1. WAJIB IMPOR SEMUA KETERGANTUNGAN
import { CircuitStore } from './state/CircuitStore.js';
import { SimulationEngine } from './engine/SimulationEngine.js';
import { ComponentDefs } from './components/index.js';
import { ComponentRegistry, BaseComponent } from './engine/models/index.js';
import { drawConnections, updateConnectionPointVisuals } from './canvas/WireManager.js';
import { buildComponentElement } from './canvas/ComponentBuilder.js';
import { clearSelection } from './canvas/CanvasInteractions.js';

// =========================================================
// HELPER UNDO/REDO (COMMAND PATTERN EXECUTORS)
// =========================================================
export function undoRedoParam(compId, targetData) {
    const comp = CircuitStore.components.find(c => c.id === compId);
    const el = document.getElementById(`comp-${compId}`);
    if (!comp || !el) return;

    Object.assign(comp, targetData);

    if (comp.rotation !== undefined || comp.mirrorX !== undefined || comp.mirrorY !== undefined) {
        const rot = comp.rotation || 0;
        const sx = comp.mirrorX ? -1 : 1;
        const sy = comp.mirrorY ? -1 : 1;
        el.style.transform = `rotate(${rot}deg) scaleX(${sx}) scaleY(${sy})`;        
        const texts = el.querySelectorAll('svg text');
        texts.forEach(txt => {
            txt.style.transform = `scaleX(${sx}) scaleY(${sy}) rotate(-${rot}deg)`;
        });
    }
    if (comp.state !== undefined) {
        el.dataset.state = comp.state;
    }

    const contentDiv = document.getElementById(`content-${compId}`);
    if (contentDiv && typeof ComponentDefs !== 'undefined') {
        ComponentDefs.updateContent(comp.type, compId, comp, contentDiv, el);
        ComponentDefs.updateDOMState(comp.type, comp, contentDiv, compId);
    }
    if (comp.type === 'net_tunnel') {
        // Jika yang di-undo/redo adalah Tunnel, PAKSA mesin merakit ulang rute nirkabelnya!
        forceRebuild();
    } else {
        // Jika komponen biasa (Resistor, dll), cukup gambar ulang kabel dan jalankan mesin
        if (typeof drawConnections === 'function') drawConnections();
        if (CircuitStore.isSimulationActive && typeof SimulationEngine !== 'undefined') {
            SimulationEngine.run();
        }
    }
}

export function undoAddComponent(data) {
    const el = document.getElementById(`comp-${data.compId}`);
    if (el) el.remove();
    CircuitStore.removeComponent(data.compId);
    if (CircuitStore.selectedComponents.includes(data.compId)) clearSelection();
    forceRebuild();
}

export function redoAddComponent(data) {
    const compData = data.compData;
    const div = buildComponentElement(compData); 
    document.getElementById('canvas').appendChild(div);
    
    let finalComp = compData;
    if (typeof ComponentRegistry !== 'undefined') {
        const ComponentClass = ComponentRegistry[compData.type] || BaseComponent;
        finalComp = new ComponentClass(compData);
    }
    finalComp.element = div;
    CircuitStore.addComponent(finalComp);
    forceRebuild();
}

export function undoRedoMove(data, isUndo) {
    data.components.forEach(c => {
        const comp = CircuitStore.components.find(x => x.id === c.id);
        const el = document.getElementById(`comp-${c.id}`);
        if (comp && el) {
            const targetX = isUndo ? c.origX : c.newX;
            const targetY = isUndo ? c.origY : c.newY;
            comp.x = targetX;
            comp.y = targetY;
            el.style.left = `${targetX}px`;
            el.style.top = `${targetY}px`;
        }
    });
    
    data.connections.forEach(c => {
        const conn = CircuitStore.connections.find(x => x.id === c.id);
        if (conn) {
            conn.waypoints = isUndo ? JSON.parse(JSON.stringify(c.origWaypoints)) : JSON.parse(JSON.stringify(c.newWaypoints));
        }
    });
}

// -----------------------------------------------------
// EKSEKUTOR HAPUS KOMPONEN & KABEL (DAN CLEAR CANVAS)
// -----------------------------------------------------
export function restoreDeletedData(data) {
    // 1. Munculkan kembali komponen-komponen ke layar
    data.components.forEach(compData => {
        const div = buildComponentElement(compData); 
        document.getElementById('canvas').appendChild(div);
        
        let finalComp = compData;
        if (typeof ComponentRegistry !== 'undefined') {
            const ComponentClass = ComponentRegistry[compData.type] || BaseComponent;
            finalComp = new ComponentClass(compData);
        }
        finalComp.element = div;
        CircuitStore.addComponent(finalComp);
    });
    
    // 2. Jahit kembali kabel-kabel yang terputus
    data.connections.forEach(conn => {
        CircuitStore.addConnection(conn);
    });
    forceRebuild();
}

export function removeDeletedData(data) {
    // 1. Lenyapkan komponen dari layar
    data.components.forEach(c => {
        const el = document.getElementById(`comp-${c.id}`);
        if (el) el.remove();
        CircuitStore.removeComponent(c.id);
    });
    
    // 2. Lenyapkan sisa-sisa kabel (jika aksi ini adalah Clear Wires)
    data.connections.forEach(c => {
        CircuitStore.connections = CircuitStore.connections.filter(conn => conn.id !== c.id);
    });
    forceRebuild();
}

// -----------------------------------------------------
// EKSEKUTOR KHUSUS MENAMBAH/MENGHAPUS KABEL TUNGGAL
// -----------------------------------------------------
export function undoAddWire(data) {
    CircuitStore.connections = CircuitStore.connections.filter(c => c.id !== data.added.id);
    if (data.removed) CircuitStore.addConnection(data.removed); // Pulihkan kabel lama jika sempat tertimpa
    forceRebuild();
}

export function redoAddWire(data) {
    if (data.removed) CircuitStore.connections = CircuitStore.connections.filter(c => c.id !== data.removed.id);
    CircuitStore.addConnection(data.added);
    forceRebuild();
}

export function undoRemoveWire(data) {
    CircuitStore.addConnection(data);
    forceRebuild();
}

export function redoRemoveWire(data) {
    CircuitStore.connections = CircuitStore.connections.filter(c => c.id !== data.id);
    forceRebuild();
}

// -----------------------------------------------------
// EKSEKUTOR PERCABANGAN KABEL (SPLICE / WIRE NODE)
// -----------------------------------------------------
export function undoSplice(data) {
    // 1. Lenyapkan kabel pecahan dan kabel baru
    data.addedConnections.forEach(c => {
        CircuitStore.connections = CircuitStore.connections.filter(conn => conn.id !== c.id);
    });
    
    // 2. Lenyapkan titik solder (Junction/Wire Node)
    data.addedComponents.forEach(comp => {
        const el = document.getElementById(`comp-${comp.id}`);
        if (el) el.remove();
        CircuitStore.removeComponent(comp.id);
    });
    
    // 3. Jahit kembali kabel lawas yang tadinya dipotong
    data.removedConnections.forEach(c => CircuitStore.addConnection(c));
    forceRebuild();
}

export function redoSplice(data) {
    // 1. Potong kembali kabel lawas
    data.removedConnections.forEach(c => {
        CircuitStore.connections = CircuitStore.connections.filter(conn => conn.id !== c.id);
    });
    
    // 2. Munculkan kembali titik solder menggunakan arsitektur OOP baru
    data.addedComponents.forEach(compData => {
        const div = buildComponentElement(compData); 
        document.getElementById('canvas').appendChild(div);
        
        let finalComp = compData;
        if (typeof ComponentRegistry !== 'undefined') {
            const ComponentClass = ComponentRegistry[compData.type] || BaseComponent;
            finalComp = new ComponentClass(compData);
        }
        finalComp.element = div;
        CircuitStore.addComponent(finalComp);
    });
    
    // 3. Pasang kembali kabel-kabel cabang
    data.addedConnections.forEach(c => CircuitStore.addConnection(c));
    forceRebuild();
}

// 🟢 FUNGSI PELATUK: Memaksa mesin menjahit ulang kabel secara instan
export function forceRebuild() {
    CircuitStore.topologyChanged = true;
    
    // Pastikan UI kabel digambar ulang
    if (typeof updateConnectionPointVisuals !== 'undefined') updateConnectionPointVisuals();
    if (typeof drawConnections !== 'undefined') drawConnections();

    // Langsung tembak buildElectricalNodes meskipun simulasi sedang di-pause (Stop)
    // agar Probe Logika / Truth Table membaca nilai kelistrikan yang baru!
    if (typeof SimulationEngine !== 'undefined') {
        SimulationEngine.buildElectricalNodes();
        if (CircuitStore.isSimulationActive) {
            SimulationEngine.run(); // Bangunkan mesin jika sedang berjalan
        }
    }
}

// -----------------------------------------------------
// EKSEKUTOR MIRROR KOMPONEN
// -----------------------------------------------------
export function undoRedoMirror(data) {
    data.ids.forEach(id => {
        const compData = CircuitStore.components.find(c => c.id === id);
        const el = document.getElementById(`comp-${id}`);
        if (compData && el) {
            const rot = compData.rotation || 0;
            const normRot = ((rot % 360) + 360) % 360;
            const isPerpendicular = (normRot === 90 || normRot === 270);

            // Sesuaikan sumbu saat rotasi 90° atau 270°
            const targetAxis = isPerpendicular ? (data.axis === 'X' ? 'Y' : 'X') : data.axis;

            if (targetAxis === 'X') compData.mirrorX = !compData.mirrorX;
            if (targetAxis === 'Y') compData.mirrorY = !compData.mirrorY;

            const sx = compData.mirrorX ? -1 : 1;
            const sy = compData.mirrorY ? -1 : 1;

            el.style.transform = `rotate(${rot}deg) scaleX(${sx}) scaleY(${sy})`;
            const texts = el.querySelectorAll('svg text');
            texts.forEach(txt => {
                txt.style.transform = `scaleX(${sx}) scaleY(${sy}) rotate(-${rot}deg)`;
            });
        }
    });
    if (typeof drawConnections !== 'undefined') drawConnections();
    if (typeof updateConnectionPointVisuals !== 'undefined') updateConnectionPointVisuals();
}