// File: src/canvas/WireManager.js
//
// RINGKASAN MODUL:
// Mengelola semua hal terkait KABEL (koneksi) antar komponen di kanvas rangkaian:
// - Membuat/menghapus data koneksi di CircuitStore (createConnection, deleteConnection)
// - Membuat & memposisikan titik sambung/pin pada tiap komponen (createConnectionPoint)
// - Mesin status klik-untuk-menyambung antar pin (handleConnectionClick)
// - Menggambar jalur kabel SVG dengan smart routing + event klik/hapus/percabangan (drawConnections)
// - Memperbarui warna & animasi arus pada kabel sesuai hasil simulasi (updateWireStates)

import { CircuitStore } from '../state/CircuitStore.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { HistoryManager } from '../HistoryManager.js';
import { UIManager } from '../UI/UIManager.js';
import { ComponentDefs } from '../components/index.js';
import { buildComponentElement } from './ComponentBuilder.js';

// =========================================================
// 1. MANAJEMEN KONEKSI & TITIK SAMBUNG (PIN)
// =========================================================

/**
 * Menyimpan satu koneksi kabel baru ke CircuitStore lalu me-render ulang.
 * @param {number} srcId - ID komponen sumber (asal kabel)
 * @param {number} srcPin - Index pin pada komponen sumber
 * @param {number} tgtId - ID komponen tujuan
 * @param {number} tgtPin - Index pin pada komponen tujuan
 * @param {Array} waypoints - Titik-titik belokan manual kabel (opsional)
 * @param {string} srcType - Tipe pin sumber ('input' atau 'output')
 * @param {string} tgtType - Tipe pin tujuan ('input' atau 'output')
 */
export function createConnection(srcId, srcPin, tgtId, tgtPin, waypoints = [], srcType = 'output', tgtType = 'input') {
    CircuitStore.wireIdCounter = CircuitStore.wireIdCounter || Date.now();
    const connId = `wire_${++CircuitStore.wireIdCounter}`;

    CircuitStore.addConnection({ 
        id: connId,
        source: { compId: Number(srcId), pinIndex: Number(srcPin), type: srcType }, 
        target: { compId: Number(tgtId), pinIndex: Number(tgtPin), type: tgtType },
        waypoints: waypoints
    });
    
    drawConnections(); 
    updateConnectionPointVisuals();
    if (CircuitStore.isSimulationActive) SimulationEngine.run();
}

/**
 * Membuat elemen DOM titik sambung (pin) untuk komponen dan memposisikannya secara akurat.
 * @param {number} compId - ID komponen pemilik pin
 * @param {string} pinType - 'input' atau 'output'
 * @param {number} index - Urutan pin
 * @param {number} total - Total jumlah pin sejenis 
 * @param {string} compType - Jenis/tipe komponen untuk menentukan koordinat (x, y)
 * @returns {HTMLElement} Elemen titik sambung (pin)
 */
export function createConnectionPoint(compId, pinType, index, total, compType) {
    const pt = document.createElement('div');
    pt.className = `connection-point ${pinType}`;
    pt.dataset.compId = compId; 
    pt.dataset.pointType = pinType; 
    pt.dataset.pointIndex = index;

    let x = 0, y = 0;

    // Tabel koordinat pin yang dirapihkan (Dikelompokkan & menggunakan logika ringkas)
    switch (compType) {
    // --- [SUMBER DAYA & TERMINAL] ---
    case 'battery':
        x = 80; y = index === 0 ? 20 : 40;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'battery_1cell':
    case 'battery_multi':
        x = index === 0 ? 0 : 80; y = 20;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'vsine':
        x = index === 0 ? 0 : 130; y = 35; break;
        
    case 'ground':
        x = 20; y = 0; pt.dataset.polarity = 'neg'; break;
        
    case 'power_terminal':
        x = 30; y = 40; break;
        
    case 'output_terminal':
        x = 0; y = 20; break;
        
    case 'current_source':
        x = 20; y = pinType === 'input' ? 65 : 5; break;

    // --- [SAKLAR & RELAY] ---
    case 'switch':
        x = 60; y = 20; break;
        
    case 'switch_spst':
        x = pinType === 'input' ? 0 : 80; y = 20; break;
        
    case 'switch_spdt':
        x = pinType === 'input' ? 0 : 80;
        y = pinType === 'input' ? 30 : (index === 0 ? 15 : 45);
        break;
        
    case 'switch_dpst':
        x = pinType === 'input' ? 0 : 90;
        y = index === 0 ? 30 : 60;
        break;
        
    case 'push_button':
    case 'push_button_nc':
        x = pinType === 'input' ? 0 : 70; y = 30; break;
        
    case 'relay':
        x = pinType === 'input' ? 0 : 80; y = index === 0 ? 20 : 60;
        if (pinType !== 'input' && index === 0) pt.dataset.polarity = 'neg';
        break;
        
    case 'relay_5pin':
        x = pinType === 'input' ? 0 : 80;
        y = pinType === 'input' ? (index === 0 ? 20 : 70) : (index === 0 ? 20 : (index === 1 ? 50 : 90));
        if (pinType !== 'input' && index === 0) pt.dataset.polarity = 'neg';
        break;

    // --- [KOMPONEN PASIF & DISKRIT] ---
    case 'fuse':
    case 'resistor':
    case 'capacitor':
        x = pinType === 'input' ? 0 : 80; y = 20; break;
        
    case 'diode':
    case 'zener_diode':
        x = pinType === 'input' ? 0 : 60; y = 20; break;
        
    case 'led':
    case 'lamp':
        x = pinType === 'input' ? 0 : 60; y = 30; break;
        
    case 'potentiometer':
        x = pinType === 'input' ? (index === 0 ? 0 : 100) : 50;
        y = pinType === 'input' ? 20 : 60; break;
        
    case 'voltage_divider':
        x = pinType === 'input' ? 0 : 80; y = 30; break;
        
    case 'diode_bridge':
        x = pinType === 'input' ? 70 : (index === 0 ? 140 : 0);
        y = pinType === 'input' ? (index === 0 ? 0 : 140) : 70;
        if (pinType !== 'input' && index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'transformer':
        x = pinType === 'input' ? 0 : 100;
        y = pinType === 'input' ? (index === 0 ? 30 : 70) : (index === 0 ? 20 : (index === 1 ? 50 : 80));
        break;
        
    case 'transformer_2p2s':
        x = pinType === 'input' ? 0 : 100;
        y = index === 0 ? 30 : 70; break;

    // --- [TRANSISTOR & OP-AMP] ---
    case 'bjt_npn':
    case 'bjt_pnp':
        x = pinType === 'input' ? (index === 0 ? 0 : 40) : 40;
        y = pinType === 'input' ? (index === 0 ? 40 : 0) : 80;
        break;
        
    case 'mosfet_n':
    case 'mosfet_p':
        x = pinType === 'input' ? (index === 0 ? 0 : 50) : 50;
        y = pinType === 'input' ? (index === 0 ? 50 : 0) : 100;
        break;
        
    case 'opamp':
        x = pinType === 'input' ? 0 : 120;
        y = pinType === 'input' ? (index === 0 ? 35 : 65) : 50;
        break;
        
    case 'opamp_5pin':
    case 'opamp_lm741':
        x = pinType === 'input' ? (index < 2 ? 0 : 55) : 120;
        y = pinType === 'input' ? (index === 0 ? 45 : (index === 1 ? 75 : (index === 2 ? 0 : 120))) : 60;
        break;

    // --- [LOGIC & FLIP-FLOP] ---
    case 'ff_jk':
        x = pinType === 'input' ? (index < 3 ? 0 : 40) : 80;
        y = pinType === 'input' ? [20, 70, 40, 0, 90][index] : (index === 0 ? 30 : 70);
        break;
        
    case 'ff_d':
        x = pinType === 'input' ? (index < 2 ? 0 : 40) : 80;
        y = pinType === 'input' ? [30, 60, 0, 90][index] : (index === 0 ? 30 : 60);
        break;
        
    case 'ff_sr':
        x = pinType === 'input' ? 0 : 80;
        y = pinType === 'input' ? (index === 0 ? 20 : (index === 1 ? 70 : 40)) : (index === 0 ? 20 : 70);
        break;
        
    case 'ff_t':
        x = pinType === 'input' ? 0 : 80;
        y = index === 0 ? 20 : 60; break;

    // --- [SENSOR, MOTOR & AKTUATOR] ---
    case 'ldr':
    case 'thermistor_ntc':
    case 'thermistor_ptc':
        x = pinType === 'input' ? 0 : 100; y = 40; break;
        
    case 'motor_dc':
        x = pinType === 'input' ? 0 : 80; y = 40; break;
        
    case 'speaker':
        x = 0; y = index === 0 ? 20 : 40;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'servo':
        x = 0; y = index === 0 ? 20 : (index === 1 ? 40 : 60); break;
        
    case 'solenoid':
        x = pinType === 'input' ? 0 : 80; y = 30; break;
        
    case 'flasher':
        x = pinType === 'input' ? 0 : 80; y = 20; break;
        
    case 'sensor_lm35':
        if (pinType === 'input') {
            x = index === 0 ? 160 : 0; y = 60;
            pt.dataset.polarity = index === 0 ? 'pos' : 'neg'; }
        else {
            x = 80; y = 120; pt.dataset.polarity = 'pos'; }
        break;

    // --- [ALAT UKUR & GENERATOR] ---
    case 'voltmeter':
    case 'voltmeter_ac':
        x = index === 0 ? 0 : 80; y = 40;
        if (index === 1 && compType === 'voltmeter') pt.dataset.polarity = 'neg';
        break;
        
    case 'ammeter':
        x = pinType === 'input' ? 0 : 80; y = 40; break;
        
    case 'ohmmeter':
        x = index === 0 ? 0 : 80; y = 40;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'oscilloscope':
        x = 0; y = index === 0 ? 100 : 140; break;
        
    case 'logic_probe':
        x = 0; y = 20; break;
        
    case 'clock_pulse':
        x = 60; y = 20; break;
        
    case 'pulse_generator':
        x = 70; y = 30; break;

    // --- [KABEL & PERCABANGAN] ---
    case 'junction':
        x = pinType === 'input' ? 0 : 60;
        y = pinType === 'input' ? 30 : (index === 0 ? 10 : (index === 1 ? 30 : 50));
        break;
        
    case 'wire_node':
        x = 10; y = 10; break;
        
    case 'wire_1to1':
        x = pinType === 'input' ? 0 : 60; y = 20; break;
        
    case 'wire_1to2':
        x = pinType === 'input' ? 0 : 60;
        y = pinType === 'input' ? 30 : (index === 0 ? 15 : 45);
        break;
        
    case 'net_tunnel':
        if (pinType === 'input' && index === 0) { x = 0; y = 20; }
        break;

    // --- [MODUL SENSOR & KOMPLEKS] ---
    case 'hc_sr04':
        x = pinType === 'input' ? (index === 0 ? 60 : (index === 1 ? 90 : 140)) : 110;
        y = 130; break;
        
    case 'ir_sensor':
        x = pinType === 'input' ? (index === 0 ? 90 : 60) : 30;
        y = 200; break;
        
    case 'lcd_16x2':
        y = 130;
        if (pinType === 'input') x = 70 + (index * 20);
        break;
        
    case 'soil_moisture':
        x = pinType === 'output' ? [20, 33, 31, 51][index] : [62, 49, 150, 130][index];
        y = index < 2 ? 160 : 10; break;
        
    case 'l298n':
        if (pinType === 'output') {
            x = index < 2 ? 5 : 250; y = index % 2 === 0 ? 130 : 150; }
        else {
            y = 210; x = 50 + (index * 20); }
        break;
        
    // --- [ARDUINO UNO] ---
    case 'arduino_uno':
        if (pinType === 'input') {
            if (index <= 13)      { x = 370 - (index * 20); y = 0; }   // D0 - D13
            else if (index <= 19) { x = 270 + ((index - 14) * 20); y = 280; } // A0 - A5
            else if (index === 20){ x = 130; y = 280; } // IOREF
            else if (index === 21){ x = 150; y = 280; } // RESET
            else if (index === 22){ x = 170; y = 280; } // 3V3
            else if (index === 23){ x = 190; y = 280; } // 5V
            else if (index === 24){ x = 210; y = 280; } // GND
            else if (index === 25){ x = 230; y = 280; } // GND
            else if (index === 26){ x = 250; y = 280; } // VIN
            else if (index === 27){ x = 90;  y = 0; }   // GND Atas
            else if (index === 28){ x = 70;  y = 0; } } // AREF
        break;

    // --- [IC & DIGITAL LOGIC] ---
    case 'ic_4017':
        if (pinType === 'input') {
            x = index < 3 ? 0 : 60;
            y = [60, 100, 140, 0, 240][index];
            if (index === 4) pt.dataset.polarity = 'neg'; }
        else {
            x = 120; y = 20 + (index * 20); }
        break;
        
    case 'ic_74164':
        x = pinType === 'input' ? 0 : 140;
        y = pinType === 'input' ? [40, 80, 160, 200][index] : 30 + (index * 30);
        break;
        
    case 'ic_4518':
        x = pinType === 'input' ? 0 : 100;
        y = 20 + (index * 20); break;
        
    case 'ic_4518_dual':
        if (pinType === 'input') {
            x = index < 3 ? 0 : (index < 7 ? 140 : 0);
            y = [20, 40, 60, 40, 60, 80, 20, 160][index];
            if (index === 6) pt.dataset.polarity = 'pos';
            if (index === 7) pt.dataset.polarity = 'neg'; }
        else {
            x = index < 4 ? 0 : 140;
            y = [80, 100, 120, 140, 100, 120, 140, 160][index]; }
        break;
        
    case 'ic_7448':
        if (pinType === 'input') {
            x = index === 7 ? 140 : 0;
            y = [140, 20, 40, 120, 60, 80, 100, 20, 160][index];
            if (index === 7) pt.dataset.polarity = 'pos';
            if (index === 8) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = [80, 100, 120, 140, 160, 40, 60][index]; }
        break;
        
    case 'ic_74LS90':
        if (pinType === 'input') {
            x = [140, 0, 0, 0, 0, 0, 0, 140][index];
            y = [20, 20, 40, 60, 120, 140, 100, 100][index];
            if (index === 6) pt.dataset.polarity = 'pos';
            if (index === 7) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = [60, 120, 140, 80][index]; }
        break;
        
    case 'ic_4511':
        x = pinType === 'input' ? 0 : 120;
        y = 20 + (index * 20); break;
        
    case 'ic_4026':
        x = pinType === 'input' ? 0 : 120;
        y = pinType === 'input' ? [30, 80, 130, 180][index] : 20 + (index * 20);
        break;
        
    case 'ic_lm3914':
        if (pinType === 'input') {
            x = index < 6 ? 0 : 70;
            y = [40, 70, 100, 130, 160, 190, 0, 240][index];
            if (index === 6) pt.dataset.polarity = 'pos';
            if (index === 7) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = 30 + (index * 20); }
        break;
        
    case 'ic_78L12':
    case 'ic_7812':
        if (pinType === 'input') {
            x = index === 0 ? 0 : 70; y = index === 0 ? 60 : 120;
            if (index === 1) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = 60; }
        break;
        
    case 'ic_7805':
    case 'ic_7808':
        if (pinType === 'input') {
            x = index === 0 ? 20 : 40; y = 120;
            pt.dataset.polarity = index === 0 ? 'pos' : 'neg'; }
        else {
            x = 60; y = 120; pt.dataset.polarity = 'pos'; }
        break;
        
    case 'ic_555':
        if (pinType === 'input') {
            x = [60, 0, 0, 0, 120, 60][index];
            y = [160, 100, 40, 70, 100, 0][index];
            if (index === 0) pt.dataset.polarity = 'neg'; }
        else {
            x = 120; y = index === 0 ? 40 : 70; }
        break;
        
    case 'ic_4051':
        if (pinType === 'input') {
            x = [140, 140, 140, 0, 0, 0, 140, 0][index];
            y = [120, 140, 160, 120, 60, 140, 20, 160][index];
            if (index === 5 || index === 7) pt.dataset.polarity = 'neg';
            if (index === 6) pt.dataset.polarity = 'pos'; }
        else {
            x = [140, 140, 140, 140, 0, 0, 0, 0][index];
            y = [80, 60, 40, 100, 20, 100, 40, 80][index]; }
        break;

    // --- [DISPLAY & OUTPUT] ---
    case 'seven_segment':
        if (pinType === 'input') {
            x = 0; y = 20 + (index * 20); }
        else {
            x = 150; y = 140; pt.dataset.polarity = 'neg'; }
        break;
        
    case 'led_bargraph':
        if (pinType === 'input') {
            x = index < 10 ? 0 : 60; y = index < 10 ? 30 + (index * 20) : 0;
            if (index === 10) pt.dataset.polarity = 'pos'; }
        break;
        
    case 'led_bargraph_cc':
        if (pinType === 'input') {
            x = index < 10 ? 0 : 60; y = index < 10 ? 30 + (index * 20) : 240;
            if (index === 10) pt.dataset.polarity = 'neg'; }
        break;

    // --- [DEFAULT FALLBACK] ---
    default:
        x = pinType === 'input' ? 0 : 80;
        y = total === 1 ? 30 : (index === 0 ? 20 : 40);
        break;
}

    pt.style.left = `${x}px`; 
    pt.style.top = `${y}px`;

    // Event Listener Interaksi
    const handleInteract = (e) => { 
        e.stopPropagation(); e.preventDefault(); 
        handleConnectionClick(compId, pinType, index); 
    };
    
    pt.addEventListener('click', handleInteract); 
    pt.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); });
    pt.addEventListener('touchstart', handleInteract, { passive: false });

    // --- TOOLTIP LOGIC ---
    pt.dataset.pinLabel = getPinLabel(compType, pinType, index);

    pt.addEventListener('mouseenter', () => {
        const tooltip = document.getElementById('globalTooltip');
        if (tooltip && !CircuitStore.connectionStart) {
            tooltip.textContent = pt.dataset.pinLabel;
            const rect = pt.getBoundingClientRect();
            tooltip.style.left = (rect.right + 15) + 'px';
            tooltip.style.top = (rect.top + (rect.height / 2)) + 'px';
            tooltip.classList.add('show');
        }
    });

    pt.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('globalTooltip');
        if (tooltip) tooltip.classList.remove('show');
    });

    return pt;
}

// =========================================================
// 2. LOGIKA KONEKSI & INTERAKSI
// =========================================================

/**
 * Menyegarkan tampilan visual semua titik sambung.
 * Memberi status/kelas 'connected' (warna hijau) pada pin yang sudah terhubung.
 */
export function updateConnectionPointVisuals() {
    document.querySelectorAll('.connection-point').forEach(p => { 
        p.classList.remove('connected'); 
        p.removeAttribute('title'); 
    });
    
    CircuitStore.connections.forEach(conn => {
        let sType = conn.source.type || 'output';
        const sourceEl = document.querySelector(`#comp-${conn.source.compId} .connection-point[data-point-type="${sType}"][data-point-index="${conn.source.pinIndex}"]`);
        if (sourceEl) sourceEl.classList.add('connected'); 
        
        let tType = conn.target.type || 'input';
        const targetEl = document.querySelector(`#comp-${conn.target.compId} .connection-point[data-point-type="${tType}"][data-point-index="${conn.target.pinIndex}"]`);
        if (targetEl) targetEl.classList.add('connected'); 
    });
}

/**
 * Menghapus satu koneksi kabel, merekamnya ke history untuk fitur Undo, 
 * lalu me-render ulang kanvas dan menjalankan simulasi jika aktif.
 */
export function deleteConnection(srcId, srcPin, tgtId, tgtPin) {
    const removedConn = CircuitStore.connections.find(c => c.source.compId === srcId && c.source.pinIndex === srcPin && c.target.compId === tgtId && c.target.pinIndex === tgtPin);
    const before = CircuitStore.connections.length;
    
    CircuitStore.removeConnection(srcId, srcPin, tgtId, tgtPin);
    
    if (CircuitStore.connections.length < before) {
        if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp && removedConn) {
            HistoryManager.pushCommand('REMOVE_WIRE', JSON.parse(JSON.stringify(removedConn)), 'Menghapus kabel');
        }
        drawConnections(); 
        updateConnectionPointVisuals();
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
    }
}

/**
 * Mesin status (state machine) klik pin untuk menyambung kabel:
 * Mengelola klik pertama (titik awal) dan klik kedua (penyelesaian),
 * serta mengganti koneksi lama bila pin tidak mendukung multiple koneksi.
 */
export function handleConnectionClick(compId, type, index) {
    compId = Number(compId); index = Number(index);

    if (!CircuitStore.connectionStart) {
        CircuitStore.connectionStart = { compId, type, index };
        CircuitStore.tempWaypoints = [];
        UIManager.showToast('Klik area kosong untuk membelokkan kabel, klik pin tujuan untuk menyambung');
        document.querySelectorAll('.connection-point').forEach(p => p.style.boxShadow = 'none');
        
        const sp = document.querySelector(`[data-comp-id="${compId}"][data-point-type="${type}"][data-point-index="${index}"]`);
        if (sp) sp.classList.add('pending');
        return;
    }

    if (CircuitStore.connectionStart.compId === compId && CircuitStore.connectionStart.type === type && CircuitStore.connectionStart.index === index) {
        CircuitStore.connectionStart = null;
        CircuitStore.tempWaypoints = [];
        let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
        document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
        UIManager.showToast('Koneksi dibatalkan');
        return;
    }

    const startType = CircuitStore.connectionStart.type;
    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));

    let srcId, srcPin, tgtId, tgtPin, tgtIsInput, srcType, tgtType;
    if (startType === 'output' && type === 'input') { 
        srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index; srcType = 'output'; 
        tgtId = compId; tgtPin = index; tgtType = 'input'; tgtIsInput = true; 
    } else if (startType === 'input' && type === 'output') { 
        srcId = compId; srcPin = index; srcType = 'output'; 
        tgtId = CircuitStore.connectionStart.compId; tgtPin = CircuitStore.connectionStart.index; tgtType = 'input'; 
        tgtIsInput = true; 
        if (CircuitStore.tempWaypoints) CircuitStore.tempWaypoints.reverse();
    } else { 
        srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index; srcType = startType; 
        tgtId = compId; tgtPin = index; tgtType = type; tgtIsInput = false; 
    }
    
    CircuitStore.connectionStart = null;

    const exists = CircuitStore.connections.find(c =>
        (c.source.compId === srcId && c.source.pinIndex === srcPin && c.target.compId === tgtId && c.target.pinIndex === tgtPin) ||
        (c.source.compId === tgtId && c.source.pinIndex === tgtPin && c.target.compId === srcId && c.target.pinIndex === srcPin)
    );
    
    if (exists) {
        CircuitStore.tempWaypoints = [];
        let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
        return UIManager.showToast('Koneksi ini sudah ada');
    }

    let replacedConn = null;
    if (tgtIsInput) {
        let allowMultipleInputs = false;
        const targetComp = CircuitStore.components.find(c => c.id === tgtId);
        const allowedTypes = ['ground', 'power_terminal', 'junction', 'wire_node', 'resistor', 'capacitor', 'led', 'diode', 'diode_bridge', 'ammeter', 'voltmeter', 'oscilloscope', 'motor_dc', 'solenoid', 'relay', 'relay_5pin', 'ohmmeter'];
        
        if (targetComp && allowedTypes.includes(targetComp.type)) allowMultipleInputs = true;

        if (!allowMultipleInputs) {
            replacedConn = CircuitStore.connections.find(c => c.target.compId === tgtId && c.target.pinIndex === tgtPin);
            const replaced = CircuitStore.removeConnectionsTargeting(tgtId, tgtPin);
            if (replaced) UIManager.showToast('Kabel lama pada pin ini diganti');
        }
    }

    let finalWaypoints = CircuitStore.tempWaypoints ? [...CircuitStore.tempWaypoints] : [];
    
    if (finalWaypoints.length > 0) {
        let lastWp = finalWaypoints[finalWaypoints.length - 1];
        let tp = getPinPosition(tgtId, tgtType, tgtPin);
        
        if (tp && lastWp.x !== tp.x && lastWp.y !== tp.y) {
            if (Math.abs(tp.x - lastWp.x) > Math.abs(tp.y - lastWp.y)) finalWaypoints.push({ x: tp.x, y: lastWp.y });
            else finalWaypoints.push({ x: lastWp.x, y: tp.y });
        }
    }

    createConnection(srcId, srcPin, tgtId, tgtPin, finalWaypoints, srcType, tgtType);
    const newConn = CircuitStore.connections[CircuitStore.connections.length - 1];
    
    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        HistoryManager.pushCommand('ADD_WIRE', { 
            added: JSON.parse(JSON.stringify(newConn)), 
            removed: replacedConn ? JSON.parse(JSON.stringify(replacedConn)) : null 
        }, 'Menyambung kabel');
    }
    
    CircuitStore.tempWaypoints = []; 
    let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
    UIManager.showToast('Kabel terhubung!');
}

/**
 * Memotong sebuah kabel di titik (x, y) dan menyisipkan Node percabangan.
 */
export function splitWireToNode(wireId, x, y) {
    const conn = CircuitStore.connections.find(c => c.id === wireId);
    if (!conn) return;

    const oldConnCopy = JSON.parse(JSON.stringify(conn));
    const GRID_SIZE = 10;
    const snapX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(y / GRID_SIZE) * GRID_SIZE;
    const jId = ++CircuitStore.componentIdCounter;

    const compData = {
        id: jId, type: 'junction', inputs: 1, outputs: 3,
        x: snapX, y: snapY, state: '0',
        inputStates: [0], outputState: 0, simV: 0, simI: 0
    };

    const div = buildComponentElement(compData);
    document.getElementById('canvas').appendChild(div);
    CircuitStore.addComponent({ ...compData, element: div });

    const addedCompCopy = JSON.parse(JSON.stringify({ ...compData, element: undefined }));
    const src = { ...conn.source };
    const tgt = { ...conn.target };

    CircuitStore.removeConnection(src.compId, src.pinIndex, tgt.compId, tgt.pinIndex);
    
    createConnection(src.compId, src.pinIndex, jId, 0, [], src.type, 'input');
    const newConn1 = JSON.parse(JSON.stringify(CircuitStore.connections[CircuitStore.connections.length - 1]));
    
    createConnection(jId, 0, tgt.compId, tgt.pinIndex, [], 'output', tgt.type);
    const newConn2 = JSON.parse(JSON.stringify(CircuitStore.connections[CircuitStore.connections.length - 1]));

    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        HistoryManager.pushCommand('SPLICE_WIRE', {
            removedConnections: [oldConnCopy],
            addedComponents: [addedCompCopy],
            addedConnections: [newConn1, newConn2]
        }, 'Buat Node Cabang');
    }

    drawConnections();
    updateConnectionPointVisuals();
    if (CircuitStore.isSimulationActive) SimulationEngine.run();
    if (typeof UIManager !== 'undefined') UIManager.showToast('🔗 Titik percabangan (Node) berhasil dibuat!');
}

// =========================================================
// 3. GAMBAR & RENDERING KABEL (SVG)
// =========================================================

/**
 * Menghitung koordinat piksel (X, Y) dari sebuah pin secara real-time di atas kanvas.
 */
export function getPinPosition(compId, pinType, pinIndex) {
    let pt = document.querySelector(`[data-comp-id="${compId}"][data-point-type="${pinType}"][data-point-index="${pinIndex}"]`);
    if (!pt) pt = document.querySelector(`[data-comp-id="${compId}"][data-point-index="${pinIndex}"]`);
    if (!pt) return null;
    
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    const pr = pt.getBoundingClientRect();
    
    return {
        x: (pr.left - cr.left) / UIManager.currentZoom + (pr.width / UIManager.currentZoom) / 2,
        y: (pr.top - cr.top) / UIManager.currentZoom + (pr.height / UIManager.currentZoom) / 2,
        isNeg: pt.dataset.polarity === 'neg'
    };
}

/**
 * Menggambar jalur seluruh kabel, membentuk tikungan (Routing Ortokal),
 * dan memasangkan event interaksi kabel (Double Click untuk potong, dll).
 */
export function drawConnections() {
    const svg = document.getElementById('wire-svg');
    if (!svg) return;
  
    const activePathIds = new Set();

    CircuitStore.connections.forEach((conn, _idx) => {
        if (!conn.id) {
            CircuitStore.wireIdCounter = CircuitStore.wireIdCounter || Date.now();
            conn.id = `wire_${++CircuitStore.wireIdCounter}`;
        }
        
        activePathIds.add(conn.id);

        const compS = CircuitStore.components.find(c => c.id === conn.source.compId);
        const compT = CircuitStore.components.find(c => c.id === conn.target.compId);
        if (!compS || !compT) return;

        let sType = conn.source.type || 'output';
        let tType = conn.target.type || 'input';
        let sp = getPinPosition(conn.source.compId, sType, conn.source.pinIndex) || getPinPosition(conn.source.compId, sType==='output'?'input':'output', conn.source.pinIndex);
        let tp = getPinPosition(conn.target.compId, tType, conn.target.pinIndex) || getPinPosition(conn.target.compId, tType==='input'?'output':'input', conn.target.pinIndex);
        if (!sp || !tp) return;

        let pathStr = `M ${sp.x} ${sp.y} `;

        if (conn.waypoints && conn.waypoints.length > 0) {
            let currentX = sp.x;
            let currentY = sp.y;
            
            conn.waypoints.forEach(wp => {
                if (currentX !== wp.x && currentY !== wp.y) pathStr += `L ${wp.x} ${currentY} `;
                pathStr += `L ${wp.x} ${wp.y} `;
                currentX = wp.x; currentY = wp.y;
            });
            
            if (currentX !== tp.x && currentY !== tp.y) pathStr += `L ${tp.x} ${currentY} `;
            pathStr += `L ${tp.x} ${tp.y}`;
        } else {
            const wS = ComponentDefs.getDimensions(compS.type)[0] || 60;
            const wT = ComponentDefs.getDimensions(compT.type)[0] || 60;
            
            let spDirX = 0;
            if (sp.x < compS.x + wS/2 - 5) spDirX = -1;
            else if (sp.x > compS.x + wS/2 + 5) spDirX = 1;

            let tpDirX = 0;
            if (tp.x < compT.x + wT/2 - 5) tpDirX = -1;
            else if (tp.x > compT.x + wT/2 + 5) tpDirX = 1;

            if (spDirX === 0) spDirX = (tp.x > sp.x) ? 1 : -1;
            if (tpDirX === 0) tpDirX = (sp.x > tp.x) ? 1 : -1;

            const offsetS = 10; const offsetT = 10; 
            let p1x = sp.x + (spDirX * offsetS);
            let p2x = tp.x + (tpDirX * offsetT);

            if (spDirX === tpDirX) {
                let bracketX = (spDirX === 1) ? Math.max(p1x, p2x) + 10 : Math.min(p1x, p2x) - 10;
                pathStr += `L ${bracketX} ${sp.y} L ${bracketX} ${tp.y} L ${tp.x} ${tp.y}`;
            } else {
                const isFacing = (spDirX === 1 && tpDirX === -1 && sp.x <= tp.x) || (spDirX === -1 && tpDirX === 1 && sp.x >= tp.x);
                if (isFacing) {
                    let midX = (p1x + p2x) / 2;
                    pathStr += `L ${midX} ${sp.y} L ${midX} ${tp.y} L ${tp.x} ${tp.y}`;
                } else {
                    let wrapY;
                    if (Math.abs(sp.y - tp.y) < 60) {
                        const hS = ComponentDefs.getDimensions(compS.type)[1] || 60;
                        const hT = ComponentDefs.getDimensions(compT.type)[1] || 60;
                        wrapY = Math.max(compS.y + hS, compT.y + hT) + 20; 
                    } else {
                        wrapY = (sp.y + tp.y) / 2;
                    }
                    pathStr += `L ${p1x} ${sp.y} L ${p1x} ${wrapY} L ${p2x} ${wrapY} L ${p2x} ${tp.y} L ${tp.x} ${tp.y}`;
                }
            }
        }

        let group = svg.querySelector(`g[data-wire-id="${conn.id}"]`);
        let basePath, flowPath, hitboxPath;
        
        if (!group) {
            group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('data-wire-id', conn.id);

            // 1. GARIS VISUAL (Hanya untuk dilihat, tipis)
            basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            basePath.setAttribute('fill', 'none');
            basePath.classList.add('wire-base');
            basePath.style.pointerEvents = 'none'; // Matikan interaksi sentuh di sini!

            // 2. GARIS ANIMASI ARUS
            flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            flowPath.setAttribute('fill', 'none');
            flowPath.classList.add('wire-flow');
            flowPath.style.pointerEvents = 'none'; // Matikan interaksi

            // 3. GARIS HITBOX GAIB (Area Sentuh Super Lebar: 30px)
            hitboxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hitboxPath.classList.add('wire-hitbox');
            // cssText menimpa aturan CSS agar 100% gaib tapi tetap bisa diklik
            hitboxPath.style.cssText = 'fill: none !important; stroke: transparent !important; stroke-width: 30px !important; pointer-events: stroke !important; cursor: pointer !important;';

            group.appendChild(basePath);
            group.appendChild(flowPath);
            group.appendChild(hitboxPath); // Hitbox harus di-append paling akhir agar berada di atas
            svg.appendChild(group);

            // --- EFEK HOVER MANUAL (Karena hitbox menutupi garis asli) ---
            hitboxPath.addEventListener('mouseenter', () => {
                basePath.style.stroke = 'var(--danger)';
                basePath.style.strokeWidth = '4.5px';
                basePath.style.filter = 'drop-shadow(0 0 4px rgba(225,29,72,0.5))';
            });
            hitboxPath.addEventListener('mouseleave', () => {
                basePath.style.stroke = '';
                basePath.style.strokeWidth = '';
                basePath.style.filter = '';
                updateWireStates(); // Kembalikan ke warna asli/tegangan
            });

            // --- SEMUA INTERAKSI KINI DIAMBIL ALIH OLEH HITBOX ---
            const handleWireInteract = (e) => { 
                e.stopPropagation(); e.preventDefault(); 
                
                // Ambil data dari dataset HITBOX
                const sId = +hitboxPath.dataset.sId; const sIdx = +hitboxPath.dataset.sIdx; const sType = hitboxPath.dataset.sType;
                const tId = +hitboxPath.dataset.tId; const tIdx = +hitboxPath.dataset.tIdx; const tType = hitboxPath.dataset.tType;

                if (CircuitStore.connectionStart) {
                    const canvas = document.getElementById('canvas');
                    const cr = canvas.getBoundingClientRect();
                    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    let mx = Math.round(((clientX - cr.left) / UIManager.currentZoom) / 10) * 10;
                    let my = Math.round(((clientY - cr.top) / UIManager.currentZoom) / 10) * 10;

                    const oldConnObj = CircuitStore.connections.find(c => c.id === group.getAttribute('data-wire-id'));
                    const oldConnCopy = oldConnObj ? JSON.parse(JSON.stringify(oldConnObj)) : null;

                    let wpA = [], wpB = [];
                    if (oldConnObj && oldConnObj.waypoints && oldConnObj.waypoints.length > 0) {
                        let spPin = getPinPosition(sId, sType, sIdx) || {x: mx, y: my};
                        let tpPin = getPinPosition(tId, tType, tIdx) || {x: mx, y: my};
                        let pts = [spPin, ...oldConnObj.waypoints, tpPin];
                        let splitIdx = 0;
                        for (let i = 0; i < pts.length - 1; i++) {
                            let p1 = pts[i], p2 = pts[i+1];
                            let minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
                            let minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
                            if (mx >= minX - 15 && mx <= maxX + 15 && my >= minY - 15 && my <= maxY + 15) {
                                splitIdx = i; break;
                            }
                        }
                        wpA = oldConnObj.waypoints.slice(0, splitIdx);
                        wpB = oldConnObj.waypoints.slice(splitIdx);
                    }

                    CircuitStore.removeConnection(sId, sIdx, tId, tIdx);

                    const jId = ++CircuitStore.componentIdCounter;
                    const compData = {
                        id: jId, type: 'wire_node', inputs: 4, outputs: 0, 
                        x: mx - 10, y: my - 10, 
                        state: '0', inputStates: [0,0,0,0], outputState: 0, simV: 0, simI: 0
                    };
                    const div = buildComponentElement(compData);
                    document.getElementById('canvas').appendChild(div);
                    CircuitStore.addComponent({ ...compData, element: div });
                    
                    const addedCompCopy = JSON.parse(JSON.stringify({ ...compData, element: undefined }));

                    createConnection(sId, sIdx, jId, 0, wpA, sType, 'input');
                    const newConn1 = JSON.parse(JSON.stringify(CircuitStore.connections[CircuitStore.connections.length - 1]));
                    
                    createConnection(jId, 1, tId, tIdx, wpB, 'input', tType);
                    const newConn2 = JSON.parse(JSON.stringify(CircuitStore.connections[CircuitStore.connections.length - 1]));

                    const startNode = CircuitStore.connectionStart;
                    let finalWp = CircuitStore.tempWaypoints ? [...CircuitStore.tempWaypoints] : [];
                    
                    if (finalWp.length > 0) {
                        let lastWp = finalWp[finalWp.length - 1];
                        if (lastWp.x !== mx && lastWp.y !== my) {
                            if (Math.abs(mx - lastWp.x) > Math.abs(my - lastWp.y)) finalWp.push({ x: mx, y: lastWp.y });
                            else finalWp.push({ x: lastWp.x, y: my });
                        }
                    }
                    
                    let cSrcId, cSrcPin, cSrcType, cTgtId, cTgtPin, cTgtType;
                    if (startNode.type === 'output') {
                        cSrcId = startNode.compId; cSrcPin = startNode.index; cSrcType = 'output';
                        cTgtId = jId; cTgtPin = 2; cTgtType = 'input';
                    } else {
                        cSrcId = jId; cSrcPin = 2; cSrcType = 'input';
                        cTgtId = startNode.compId; cTgtPin = startNode.index; cTgtType = 'input';
                        finalWp.reverse();
                    }
                    createConnection(cSrcId, cSrcPin, cTgtId, cTgtPin, finalWp, cSrcType, cTgtType);
                    const newConn3 = JSON.parse(JSON.stringify(CircuitStore.connections[CircuitStore.connections.length - 1]));

                    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp && oldConnCopy) {
                        HistoryManager.pushCommand('SPLICE_WIRE', {
                            removedConnections: [oldConnCopy],
                            addedComponents: [addedCompCopy],
                            addedConnections: [newConn1, newConn2, newConn3]
                        }, 'Sambung kabel ke kabel');
                    }

                    CircuitStore.connectionStart = null; CircuitStore.tempWaypoints = [];
                    let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
                    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
                    
                    UIManager.showToast('🔗 Kabel berhasil ditumpuk (Spliced)!');
                } else {
                    UIManager.showConfirmToast('Hapus kabel ini?', () => { deleteConnection(sId, sIdx, tId, tIdx); }); 
                }
            };
            
            // Pasang fungsi hapus/splice ke HITBOX
            hitboxPath.addEventListener('click', handleWireInteract); 
            
            const handleSplit = (e) => {
                e.stopPropagation(); e.preventDefault();
                const ct = document.querySelector('.confirm-toast'); 
                if (ct) ct.remove();

                const canvas = document.getElementById('canvas');
                const cr = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const x = (clientX - cr.left) / UIManager.currentZoom;
                const y = (clientY - cr.top) / UIManager.currentZoom;
                window.splitWireToNode(conn.id, x - 30, y - 30); 
            };
            hitboxPath.addEventListener('dblclick', handleSplit);

             // 🎨 3. MUNCULKAN PALET WARNA (PC: Klik Kanan, HP: Tahan Jari)
             // Fungsi pembantu agar kode tidak berulang
            const showColorPalette = (clientX, clientY) => {
                window.activeWireForColor = conn.id; 
                const palette = document.getElementById('wireColorPalette');
                if (palette) {
                    palette.style.display = 'flex';
                    const maxX = window.innerWidth - palette.offsetWidth - 20;
                    const maxY = window.innerHeight - palette.offsetHeight - 20;
                    palette.style.left = Math.min(clientX, Math.max(0, maxX)) + 'px';
                    palette.style.top = Math.min(clientY, Math.max(0, maxY)) + 'px';
                }
            };

            // EVENT KLIK KANAN (Mouse PC/Laptop)
            hitboxPath.addEventListener('contextmenu', (e) => {
                e.preventDefault(); e.stopPropagation();
                showColorPalette(e.clientX, e.clientY);
            });

            // EVENT LONG PRESS (Layar Sentuh HP/Tablet)
            let longPressTimer;
            let isLongPress = false;

            hitboxPath.addEventListener('touchstart', (e) => {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    showColorPalette(e.touches[0].clientX, e.touches[0].clientY);
                }, 500); 
            }, {passive: false});

            hitboxPath.addEventListener('touchmove', () => clearTimeout(longPressTimer), {passive: true});

            let lastWireTap = 0;
            hitboxPath.addEventListener('touchend', (e) => {
                clearTimeout(longPressTimer); 
                if (isLongPress) { e.preventDefault(); e.stopPropagation(); return; }

                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastWireTap;
                if (tapLength < 300 && tapLength > 0) {
                    handleSplit(e); 
                } else {
                    handleWireInteract(e);
                }
                lastWireTap = currentTime;
            }, {passive: false});

        } else {
            basePath = group.querySelector('.wire-base');
            flowPath = group.querySelector('.wire-flow');
            hitboxPath = group.querySelector('.wire-hitbox');
        }

        // UPDATE SHAPE PATH UNTUK KETIGA GARIS
        basePath.setAttribute('d', pathStr);
        flowPath.setAttribute('d', pathStr);
        hitboxPath.setAttribute('d', pathStr);

        // DATASET DISIMPAN DI HITBOX, BUKAN BASEPATH
        hitboxPath.dataset.sId = conn.source.compId; 
        hitboxPath.dataset.sIdx = conn.source.pinIndex;
        hitboxPath.dataset.sType = sType;           
        hitboxPath.dataset.tId = conn.target.compId; 
        hitboxPath.dataset.tIdx = conn.target.pinIndex;
        hitboxPath.dataset.tType = tType;
    });

    // Cleanup kabel hantu
    svg.querySelectorAll('g[data-wire-id]').forEach(g => {
        if (!activePathIds.has(g.getAttribute('data-wire-id'))) g.remove();
    });

    updateConnectionPointVisuals();
    updateWireStates();
}

/**
 * Memperbarui status visual kabel (warna tegangan, kecepatan aliran elektron)
 * sesuai dengan hasil tegangan dari SimulationEngine.
 */
export function updateWireStates() {
    const svg = document.getElementById('wire-svg');
    if (!svg) return;

    CircuitStore.connections.forEach(conn => {
        const group = svg.querySelector(`g[data-wire-id="${conn.id}"]`);
        if (!group) return;

        const basePath = group.querySelector('.wire-base');
        const flowPath = group.querySelector('.wire-flow');
        if (!basePath || !flowPath) return;

        const sType = basePath.dataset.sType;
        let isGround = false;
        let voltage = 0;

        if (CircuitStore.isSimulationActive && SimulationEngine.nodes && SimulationEngine.nodes.length > 0) {
            const nodeIdx = SimulationEngine.getNodeIndex(conn.source.compId, sType, conn.source.pinIndex);
            if (nodeIdx !== -1) {
                voltage = SimulationEngine.nodeVoltage[nodeIdx];
                if (Math.abs(voltage) <= 0.001) isGround = true;
            }
        } else {
            const sp = getPinPosition(conn.source.compId, sType, conn.source.pinIndex);
            const tp = getPinPosition(conn.target.compId, basePath.dataset.tType, conn.target.pinIndex);
            if ((sp && sp.isNeg) || (tp && tp.isNeg)) isGround = true;
        }

        const visualMode = CircuitStore.wireVisualMode !== undefined ? CircuitStore.wireVisualMode : 2;
        const showColor = visualMode >= 1; 
        const showAnim = visualMode === 2; 

        // 🧹 1. BERSIHKAN STATUS LAMA
        basePath.classList.remove('wire-active', 'wire-12v', 'wire-5v', 'wire-ground-base');
        basePath.removeAttribute('stroke');
        basePath.style.stroke = ''; // 🌟 FIX: Reset gaya inline agar class CSS bisa bekerja

        // 🌟 2. LOGIKA PRIORITAS WARNA
        let customColor = conn.color ? conn.color : '';

        // 🌟 3. PENERAPAN WARNA YANG BENAR
        if (showColor && CircuitStore.isSimulationActive) {
            // Saat Simulasi PLAY: Warna Fisika menimpa sementara
            if (isGround) basePath.classList.add('wire-ground-base'); 
            else if (voltage >= 11) basePath.classList.add('wire-12v');         
            else if (voltage >= 2) basePath.classList.add('wire-5v');          
            else if (customColor) basePath.style.stroke = customColor; // Kabel ngambang kembali ke custom
        } else {
            // Saat Simulasi STOP: Gunakan CSS Inline (.style.stroke) agar menimpa warna hijau default
            if (customColor) {
                basePath.style.stroke = customColor; 
            }
        }

        flowPath.style.display = 'none';
        if (showAnim && CircuitStore.isSimulationActive && Math.abs(voltage) > 0.1 && !isGround) {
            flowPath.style.display = 'block';
            if (sType === 'input') flowPath.classList.add('wire-flow-reverse');
            else flowPath.classList.remove('wire-flow-reverse');
            
            let speed = Math.max(0.2, 6 / Math.abs(voltage)); 
            flowPath.style.animationDuration = `${speed}s`;
        }
    });
}

let drawConnectionsRAF = null;

/**
 * Variasi requestAnimationFrame dari fungsi render drawConnections 
 * guna mencegah render berlebihan (bottleneck).
 */
export function optimizedDrawConnections() {
    if (drawConnectionsRAF) cancelAnimationFrame(drawConnectionsRAF);
    drawConnectionsRAF = requestAnimationFrame(() => {
        drawConnections();
        drawConnectionsRAF = null;
    });
}

// =========================================================
// 4. PENAMAAN PIN & TOOLTIP
// =========================================================

/**
 * Mendapatkan string nama pin (tooltip) untuk ditampilkan ketika user melayang (hover) di atasnya.
 */
function getPinLabel(compType, pinType, index) {
    if (compType === 'arduino_uno' && pinType === 'input') {
        if (index <= 13) return `D${index} (Digital)`;
        if (index >= 14 && index <= 19) return `A${index - 14} (Analog In)`;
        const pwr = ['IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'VIN', 'GND', 'AREF'];
        if (index >= 20 && index <= 28) return pwr[index - 20];
    }
    if (compType === 'l298n') {
        if (pinType === 'output') return ['OUT1 (Motor A)', 'OUT2 (Motor A)', 'OUT3 (Motor B)', 'OUT4 (Motor B)'][index];
        if (pinType === 'input') return ['12V (Power)', 'GND', '5V', 'ENA (PWM A)', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB (PWM B)'][index];
    }
    if (compType === 'hc_sr04') {
        if (pinType === 'input') return ['VCC (5V)', 'TRIG (Trigger)', 'GND'][index];
        if (pinType === 'output') return 'ECHO (Output)';
    }
    if (compType === 'soil_moisture') {
        if (pinType === 'input') return ['VCC (Power)', 'GND', 'Garpu Probe (+)', 'Garpu Probe (-)'][index];
        if (pinType === 'output') return ['AO (Analog Out)', 'DO (Digital Out)', 'PCB Probe (+)', 'PCB Probe (-)'][index];
    }
    if (compType === 'ic_555') {
        if (pinType === 'input') return ['GND (1)', 'TRIG (2)', 'RST (4)', 'CTRL (5)', 'THR (6)', 'VCC (8)'][index];
        if (pinType === 'output') return ['OUT (3)', 'DISCH (7)'][index];
    }
    if (compType === 'relay' || compType === 'relay_5pin') {
        if (pinType === 'input') return ['Coil 1', 'COM (Common)'][index];
        if (pinType === 'output') return compType === 'relay_5pin' ? ['Coil 2', 'NC (Normally Closed)', 'NO (Normally Open)'][index] : ['Coil 2', 'NO (Normally Open)'][index];
    }
    if (compType.startsWith('opamp')) {
        if (pinType === 'input') return ['Inverting (-)', 'Non-Inverting (+)', 'VCC (V+)', 'VEE (V-)'][index];
        if (pinType === 'output') return 'Vout';
    }
    if (compType === 'led' || compType === 'diode' || compType === 'zener_diode') {
        return pinType === 'input' ? 'Anoda (+)' : 'Katoda (-)';
    }
    if (compType === 'battery' || compType === 'battery_1cell' || compType === 'battery_multi') {
        return index === 0 ? 'Positif (+)' : 'Negatif (-) Ground';
    }
    
    return `${pinType === 'input' ? 'Input' : 'Output'} ${index + 1}`;
}
