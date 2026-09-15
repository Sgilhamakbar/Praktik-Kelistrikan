// File: src/ui/SimulationController.js

// 1. IMPOR KETERGANTUNGAN
import { CircuitStore } from '../state/CircuitStore.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { UIManager } from '../UI/UIManager.js';
import { ComponentDefs } from '../components/index.js';
import { updateWireStates } from '../canvas/WireManager.js';

// =========================================================
// SISTEM WAKE LOCK (MENCEGAH LAYAR MATI)
// =========================================================
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
    } catch (err) {
        console.log(`Wake Lock gagal: ${err.message}`);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release().then(() => {
            wakeLock = null;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        });
    }
}

function handleVisibilityChange() {
    // Kunci layar lagi jika tab dibuka kembali dan simulasi masih status PLAY
    if (CircuitStore.isSimulationActive && document.visibilityState === 'visible') {
        requestWakeLock();
    }
}

// 1. Fungsi Pengendali Tampilan Tombol (Auto-Lock)
export function updateSimControlsUI(state) {
    const btnPlay = document.getElementById('btnPlay');
    const btnPause = document.getElementById('btnPause');
    const btnStop = document.getElementById('btnStop');
    const simStatusText = document.getElementById('simStatusText');
    const simInd = document.getElementById('simIndicator');

    if (!btnPlay || !btnPause || !btnStop || !simStatusText || !simInd) return;

    const setBtn = (btn, colorClass, isEnabled) => {
        btn.className = `btn btn-${colorClass}`;
        btn.style.opacity = isEnabled ? '1' : '0.3';
        btn.style.cursor = isEnabled ? 'pointer' : 'not-allowed';
        btn.disabled = !isEnabled;
    };

    if (state === 'PLAY') {
        setBtn(btnPlay, 'primary', false); 
        setBtn(btnPause, 'warning', true);
        setBtn(btnStop, 'danger', true);
        simInd.className = 'status-indicator status-active';
        simInd.style.background = ''; 
        simStatusText.textContent = 'RUN';
        simStatusText.style.color = 'var(--success)';
    } 
    else if (state === 'PAUSE') {
        setBtn(btnPlay, 'primary', true);  
        setBtn(btnPause, 'warning', false);
        setBtn(btnStop, 'danger', true);
        simInd.className = 'status-indicator status-ready';
        simInd.style.background = '#fbbf24'; 
        simStatusText.textContent = 'PAUSE';
        simStatusText.style.color = '#fbbf24';
    } 
    else { 
        setBtn(btnPlay, 'primary', true);  
        setBtn(btnPause, 'secondary', false); 
        setBtn(btnStop, 'secondary', false);  
        simInd.className = 'status-indicator status-ready';
        simInd.style.background = ''; 
        simStatusText.textContent = 'OFF';
        simStatusText.style.color = 'var(--text-muted)';
    }
}

export function startSim() {
    if (CircuitStore.isSimulationActive) return; 
    CircuitStore.isSimulationActive = true; 
    CircuitStore.isPaused = false;
    
    requestWakeLock();

    if (typeof SimulationEngine !== 'undefined') {
        SimulationEngine.isRunning = true; 
        SimulationEngine.run(); 
    }
    
    updateSimControlsUI('PLAY');
    UIManager.showToast('▶️ Simulasi Berjalan');
    setTimeout(() => {
        if (typeof updateWireStates === 'function') updateWireStates();
    }, 50);
}

export function pauseSim() {
    if (!CircuitStore.isSimulationActive) return; 
    CircuitStore.isSimulationActive = false; 
    CircuitStore.isPaused = true;
    
    releaseWakeLock();

    if (typeof SimulationEngine !== 'undefined') {
        SimulationEngine.isRunning = false; 
    }
    
    updateSimControlsUI('PAUSE');
    UIManager.showToast('⏸️ Simulasi Dijeda');
}

export function stopSim() {
    CircuitStore.isSimulationActive = false; 
    CircuitStore.isPaused = true;
    
    releaseWakeLock();

    if (typeof SimulationEngine !== 'undefined') {
        SimulationEngine.isRunning = false;
        try { SimulationEngine.stop(); } catch(e) {}
    }

    CircuitStore.components.forEach(c => {
        try {
            c.simV = 0; c.simI = 0; c.outputState = 0;
            if (c.type === 'voltmeter_ac') {
                c.simV_rms = 0;
                c._meanSq = 0;
                c.instV = 0;
            }
            if (Array.isArray(c.inputStates)) c.inputStates.fill(0);
            if (Array.isArray(c.outStates)) c.outStates.fill(0);
            if (Array.isArray(c.simI_segs)) c.simI_segs.fill(0);
            if (Array.isArray(c.vd)) c.vd.fill(0);

            if (c.type && ['switch', 'switch_spst', 'push_button', 'push_button_nc'].includes(c.type)) {
                c.state = '0';
                c.locked = false; 
                const compEl = document.getElementById(`comp-${c.id}`);
                if (compEl) compEl.dataset.state = '0';
            }

            c._lastToggle = 0; 
            if (c.type && (c.type.startsWith('ff_') || c.type.startsWith('ic_'))) c.logicState = 0;
            if (c.type === 'logic_probe') c.logicState = 'Z';

            if (c.type === 'oscilloscope') {
                if (Array.isArray(c.history1)) c.history1.fill(0);
                if (Array.isArray(c.history2)) c.history2.fill(0);
                if (Array.isArray(c.dispBuf1)) c.dispBuf1.fill(0);
                if (Array.isArray(c.dispBuf2)) c.dispBuf2.fill(0);                
                c.trigState = 'WAIT';
            }
            const cd = document.getElementById(`content-${c.id}`);
            if (cd && typeof ComponentDefs !== 'undefined') {
                ComponentDefs.updateDOMState(c.type, c, cd, c.id);
            }
        } catch(err) {}
    });

    // try {
        //     document.querySelectorAll('#wire-svg path').forEach(p => {
        //         p.classList.remove('wire-active', 'wire-12v', 'wire-5v');
        //     });
        // } catch(e) {}

        updateSimControlsUI('STOP');
        UIManager.showToast('⏹️ Simulasi Dimatikan');
        if (typeof updateWireStates === 'function') updateWireStates();
}

export function setupSimulationButtons() {
    document.getElementById('btnPlay').addEventListener('click', startSim);
    document.getElementById('btnPause').addEventListener('click', pauseSim);
    document.getElementById('btnStop').addEventListener('click', stopSim);
}