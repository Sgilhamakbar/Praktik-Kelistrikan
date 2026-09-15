// File: src/components/meters/OscilloscopeUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

import { CircuitStore } from '../../state/CircuitStore.js';
import { HistoryManager } from '../../HistoryManager.js';
import { UIManager } from '../../UI/UIManager.js';

const vDivScale = [5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01]; 
const tDivScale = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005, 0.0002, 0.0001, 0.00005, 0.00002, 0.00001];

export class OscilloscopeUI extends BaseUIComponent {
    static getDimensions() { return [410, 280]; }
    
    getSVG() {
        const id = this.id; 
        return `<svg width="410" height="280" viewBox="0 0 410 280">
          <rect x="5" y="5" width="400" height="270" rx="8" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
          <text x="205" y="24" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">DUAL CHANNEL DSO</text>

          <rect x="30" y="40" width="200" height="160" fill="#020617" stroke="#334155" stroke-width="2"/>
          <defs>
            <pattern id="grid_${id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f766e" stroke-width="0.5" stroke-dasharray="2,2"/></pattern>
            <clipPath id="clip_osc_${id}"><rect x="30" y="40" width="200" height="160" /></clipPath>
          </defs>
          <rect x="30" y="40" width="200" height="160" fill="url(#grid_${id})" />
          
          <line x1="30" y1="120" x2="230" y2="120" stroke="#0d9488" stroke-width="1.5"/>
          <line x1="130" y1="40" x2="130" y2="200" stroke="#0d9488" stroke-width="1.5"/>
          
          <!-- 🟢 PERUBAHAN UTAMA: 3 tag <polyline> dihapus dan diganti dengan 1 Canvas -->
          <foreignObject x="30" y="40" width="200" height="160">
            <canvas class="osc-canvas-screen" width="200" height="160" xmlns="http://www.w3.org/1999/xhtml" style="pointer-events:none;"></canvas>
          </foreignObject>
          
          <!-- Kursor Pengukuran (Smart OSD) -->
          <g class="cursors-group" style="display:none;">
            <line class="cur-v1" x1="30" y1="80" x2="230" y2="80" stroke="#eab308" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            <line class="cur-v2" x1="30" y1="160" x2="230" y2="160" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            <line class="cur-t1" x1="80" y1="40" x2="80" y2="200" stroke="#eab308" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            <line class="cur-t2" x1="180" y1="40" x2="180" y2="200" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            
            <line class="cur-v1-hit" x1="30" y1="80" x2="230" y2="80" stroke="transparent" stroke-width="12" style="cursor:ns-resize; pointer-events:auto;" />
            <line class="cur-v2-hit" x1="30" y1="160" x2="230" y2="160" stroke="transparent" stroke-width="12" style="cursor:ns-resize; pointer-events:auto;" />
            <line class="cur-t1-hit" x1="80" y1="40" x2="80" y2="200" stroke="transparent" stroke-width="12" style="cursor:ew-resize; pointer-events:auto;" />
            <line class="cur-t2-hit" x1="180" y1="40" x2="180" y2="200" stroke="transparent" stroke-width="12" style="cursor:ew-resize; pointer-events:auto;" />
          </g>

          <g class="cur-osd" style="display:none;">
            <rect x="35" y="45" width="100" height="50" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" stroke-width="1"/>
            <text class="cur-title" x="85" y="56" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">CURSOR</text>
            <text class="cur-txt-1" x="40" y="68" font-size="8" fill="#eab308">1: ---</text>
            <text class="cur-txt-2" x="40" y="80" font-size="8" fill="#06b6d4">2: ---</text>
            <text class="cur-txt-d" x="40" y="92" font-size="8" font-weight="bold" fill="#22c55e">Δ: ---</text>
          </g>

          <g class="meas-overlay" style="display:none;">
            <rect x="40" y="45" width="180" height="95" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" stroke-width="1"/>
            <text class="meas-title" x="130" y="56" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">MEASURE CH1</text>
            <line x1="45" y1="61" x2="215" y2="61" stroke="#334155" stroke-width="1"/>
            
            <text x="45" y="72" font-size="8" font-weight="bold" fill="#94a3b8">Vpp : <tspan class="m-vpp" fill="#fff">0.00V</tspan></text>
            <text x="45" y="84" font-size="8" font-weight="bold" fill="#94a3b8">Vmax: <tspan class="m-vmax" fill="#fff">0.00V</tspan></text>
            <text x="45" y="96" font-size="8" font-weight="bold" fill="#94a3b8">Vmin: <tspan class="m-vmin" fill="#fff">0.00V</tspan></text>
            <text x="45" y="108" font-size="8" font-weight="bold" fill="#94a3b8">Vamp: <tspan class="m-vamp" fill="#fff">0.00V</tspan></text>
            <text x="45" y="120" font-size="8" font-weight="bold" fill="#94a3b8">Vrms: <tspan class="m-vrms" fill="#fff">0.00V</tspan></text>
            <text x="45" y="132" font-size="8" font-weight="bold" fill="#94a3b8">Vavg: <tspan class="m-vavg" fill="#fff">0.00V</tspan></text>

            <text x="135" y="72" font-size="8" font-weight="bold" fill="#94a3b8">Freq: <tspan class="m-freq" fill="#fff">---</tspan></text>
            <text x="135" y="84" font-size="8" font-weight="bold" fill="#94a3b8">Per : <tspan class="m-per" fill="#fff">---</tspan></text>
            <text x="135" y="96" font-size="8" font-weight="bold" fill="#94a3b8">Duty: <tspan class="m-duty" fill="#fff">---</tspan></text>
            <text x="135" y="108" font-size="8" font-weight="bold" fill="#94a3b8">P.W : <tspan class="m-pw" fill="#fff">---</tspan></text>
            <text x="135" y="120" font-size="8" font-weight="bold" fill="#94a3b8">Rise: <tspan class="m-rise" fill="#fff">---</tspan></text>
            <text x="135" y="132" font-size="8" font-weight="bold" fill="#94a3b8">Fall: <tspan class="m-fall" fill="#fff">---</tspan></text>
          </g>

          <!-- Teks Panel Info Dasar -->
          <text x="35" y="222" class="tdiv-text" font-size="9" font-family="monospace" fill="#38bdf8">T/Div: 1.0s</text>
          <text x="135" y="222" class="tlvl-text" font-size="9" font-family="monospace" fill="#a855f7">Trig: 0.0V</text>
          <text x="35" y="240" class="vdiv1-text" font-size="9" font-family="monospace" fill="#eab308">CH1: 5V/div</text>
          <text x="135" y="240" class="val1-text" font-size="9" font-family="monospace" fill="#eab308" font-weight="bold">V1: 0.00V</text>
          <text x="35" y="258" class="vdiv2-text" font-size="9" font-family="monospace" fill="#06b6d4">CH2: 5V/div</text>
          <text x="135" y="258" class="val2-text" font-size="9" font-family="monospace" fill="#06b6d4" font-weight="bold">V2: 0.00V</text>
          
          <circle class="pin-in-0" cx="15" cy="100" r="4" fill="#eab308" stroke="#0f172a" stroke-width="1"/>
          <line class="pin-in-0" x1="15" y1="100" x2="30" y2="100" stroke="#eab308" stroke-width="2"/>
          <circle class="pin-in-1" cx="15" cy="140" r="4" fill="#06b6d4" stroke="#0f172a" stroke-width="1"/>
          <line class="pin-in-1" x1="15" y1="140" x2="30" y2="140" stroke="#06b6d4" stroke-width="2"/>

          <!-- Panel Kontrol (Tombol-tombol) -->
          <rect class="osc-panel" x="240" y="35" width="155" height="230" rx="4" fill="#334155" stroke="#475569" stroke-width="1"/>
          
          <text x="265" y="48" font-size="7" font-weight="bold" fill="#cbd5e1" text-anchor="middle">CH SEL</text>
          <rect class="btn-ch-sel control-btn" x="245" y="52" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="ch-sel-txt" x="265" y="62" font-size="8" font-weight="bold" fill="#eab308" text-anchor="middle" pointer-events="none">CH1</text>
          
          <text x="265" y="74" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">V/DIV</text>
          <rect class="btn-vdiv-up control-btn" x="245" y="78" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="88" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▲</text>
          <rect class="btn-vdiv-dn control-btn" x="245" y="94" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="104" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▼</text>
          
          <text x="265" y="116" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">Y-POS</text>
          <rect class="btn-ypos-up control-btn" x="245" y="120" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="130" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▲</text>
          <rect class="btn-ypos-dn control-btn" x="245" y="136" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="146" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▼</text>
          
          <text x="265" y="158" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">IN CPL</text>
          <rect class="btn-ch-coupl control-btn" x="245" y="162" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="ch-coupl-txt" x="265" y="172" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">DC</text>
          
          <rect class="btn-invert control-btn" x="245" y="184" width="40" height="16" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="inv-text" x="265" y="195" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">INV</text>

          <rect class="btn-ch-en control-btn" x="245" y="206" width="40" height="16" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="ch-en-text" x="265" y="217" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">ON</text>
          <rect class="btn-run-stop control-btn" x="345" y="206" width="40" height="16" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="run-stop-text" x="365" y="217" font-size="8" font-weight="bold" fill="#10b981" text-anchor="middle" pointer-events="none">RUN</text>

          <text x="315" y="48" font-size="8" font-weight="bold" fill="#cbd5e1" text-anchor="middle">HORIZ</text>
          <text x="315" y="204" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">CURS</text>
          <rect class="btn-cursor control-btn" x="295" y="206" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="cursor-txt" x="315" y="216" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">OFF</text>
          
          <rect class="btn-autoset control-btn" x="245" y="228" width="40" height="14" rx="2" fill="#3b82f6" style="cursor:pointer;"/>
          <text class="autoset-txt" x="265" y="238" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">AUTO</text>

          <rect class="btn-print control-btn" x="295" y="228" width="40" height="14" rx="2" fill="#8b5cf6" style="cursor:pointer;"/>
          <text class="print-txt" x="315" y="238" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">IMG</text>

          <text x="315" y="60" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">T/DIV</text>
          <rect class="btn-tdiv-dn control-btn" x="295" y="64" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="74" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">◀</text>
          <rect class="btn-tdiv-up control-btn" x="295" y="80" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="90" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▶</text>

          <text x="315" y="102" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">X-POS</text>
          <rect class="btn-xpos-dn control-btn" x="295" y="106" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="116" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">◀</text>
          <rect class="btn-xpos-up control-btn" x="295" y="122" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="132" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▶</text>
          
          <text x="315" y="150" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">DISP</text>
          <rect class="btn-disp-mode control-btn" x="295" y="154" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="180" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">MEAS</text>
          <rect class="btn-meas control-btn" x="295" y="184" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="meas-txt" x="315" y="194" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">OFF</text>
          <text class="disp-mode-txt" x="315" y="164" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">Y-T</text>

          <text x="365" y="48" font-size="8" font-weight="bold" fill="#cbd5e1" text-anchor="middle">TRIGGER</text>
          <text x="365" y="60" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">MODE</text>
          <rect class="btn-trig-mode control-btn" x="345" y="64" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-mode-txt" x="365" y="74" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">AUTO</text>

          <text x="365" y="86" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">SLOPE</text>
          <rect class="btn-trig-slope control-btn" x="345" y="90" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-slope-txt" x="365" y="100" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">RISE ↑</text>

          <text x="365" y="112" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">LEVEL</text>
          <rect class="btn-trig-lvl-up control-btn" x="345" y="116" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="365" y="126" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▲</text>
          <rect class="btn-trig-lvl-dn control-btn" x="345" y="132" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="365" y="142" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▼</text>

          <text x="365" y="154" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">TR CPL</text>
          <rect class="btn-trig-coupl control-btn" x="345" y="158" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-coupl-txt" x="365" y="168" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">DC</text>

          <text x="365" y="180" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">SRC</text>
          <rect class="btn-trig-src control-btn" x="345" y="184" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-src-txt" x="365" y="194" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">CH1</text>

          <polygon class="ypos-ind-1" points="230,120 235,116 235,124" fill="#eab308"/>
          <polygon class="ypos-ind-2" points="230,120 235,116 235,124" fill="#06b6d4"/>
          <polygon class="xpos-indicator" points="130,40 126,35 134,35" fill="#eab308"/>
          <polygon class="lvl-indicator" points="230,120 225,116 225,124" fill="#a855f7"/>
        </svg>`;
    }

    bindSpecificEvents() {
        const contentDiv = this.contentDiv;
        const id = this.id;

        const snapshotSettings = (c) => ({
            ch1: c.ch1 ? { ...c.ch1 } : undefined,
            ch2: c.ch2 ? { ...c.ch2 } : undefined,
            activeCh: c.activeCh,
            isRun: c.isRun,
            xPosition: c.xPosition,
            tDivIndex: c.tDivIndex,
            dispMode: c.dispMode,
            trigMode: c.trigMode,
            trigSource: c.trigSource,
            trigLevel: c.trigLevel,
            trigSlope: c.trigSlope,
            trigCoupl: c.trigCoupl,
            cursorActive: c.cursorActive,
            measActive: c.measActive,
            curV1Y: c.curV1Y, curV2Y: c.curV2Y,
            curT1X: c.curT1X, curT2X: c.curT2X,
            lastCursorMode: c.lastCursorMode
        });

        const bindBtn = (cls, action) => {
            const btn = contentDiv.querySelector(cls);
            if (!btn) return;
            const handleInteract = (e) => {
                e.stopPropagation(); e.preventDefault(); 
                const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                if (!currentComp) return;
                const oldData = snapshotSettings(currentComp);
                action(currentComp); 
                const newData = snapshotSettings(currentComp);
                // Segarkan interface panel segera
                if (contentDiv.uiInstance) contentDiv.uiInstance.updateState(typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false);
                if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
                    HistoryManager.pushCommand('CHANGE_PARAM', { compId: id, oldData, newData }, 'Ubah setting osiloskop');
                }
            };
            btn.addEventListener('mousedown', handleInteract);
            btn.addEventListener('touchstart', handleInteract, {passive: false});
        };

        bindBtn('.btn-meas', (c) => { c.measActive = !c.measActive; });
        
        bindBtn('.btn-run-stop', (c) => { 
            c.isRun = !c.isRun; 
            if (c.isRun) {
                c.lastTrigTime = Date.now(); 
                if (c.trigMode === 2 && c.trigState === 'STOP') {
                    c.trigState = 'WAIT';
                }
            }
        });
        bindBtn('.btn-ch-en', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.enabled = !ch.enabled; });
        bindBtn('.btn-cursor', (c) => { c.cursorActive = !c.cursorActive; });

        bindBtn('.btn-autoset', (c) => {
            let chInfo = c.activeCh === 1 ? c.ch1 : c.ch2;
            let hist = c.activeCh === 1 ? c.history1 : c.history2;             
            let head = c.headIdx !== undefined ? c.headIdx : 2999;
            let vMax = -Infinity, vMin = Infinity;
            
            // Mengambil 1000 titik sampel terakhir secara melingkar (circular)
            for(let i = 0; i < 1000; i++) {
                let actualIdx = (head + 1 + 2000 + i) % 3000;
                let v = hist[actualIdx];
                if (v > vMax) vMax = v;
                if (v < vMin) vMin = v;
            }
            if (vMax === -Infinity || vMax === vMin) { vMax = 1; vMin = -1; } 
            
            let vPp = vMax - vMin;
            let vMid = (vMax + vMin) / 2;

            chInfo.yPosition = 0;
            c.trigLevel = vMid;

            let targetVDiv = vPp / 4;
            let bestVIndex = 0;
            for (let i = 0; i < vDivScale.length; i++) {
                if (vDivScale[i] >= targetVDiv) bestVIndex = i;
            }
            chInfo.vDivIndex = bestVIndex;

            let edges = [];
            let firstIdx = (head + 1 + 2000) % 3000;
            let isH = hist[firstIdx] > vMid;
            
            // Menganalisis periode dan gelombang menggunakan index melingkar
            for(let i = 1; i < 1000; i++) {
                let actualIdx = (head + 1 + 2000 + i) % 3000;
                let currentH = hist[actualIdx] > vMid;
                if (currentH !== isH) { 
                    // Menyimpan 'i' (0-999) sebagai index referensi waktu yang berurutan
                    edges.push({ type: currentH ? 'rise' : 'fall', idx: i }); 
                    isH = currentH; 
                }
            }

            let validPeriods = [];
            for(let i = 0; i < edges.length; i++) {
                if (edges[i].type === 'rise') {
                    let nextRise = edges.find((e, idx) => idx > i && e.type === 'rise');
                    if (nextRise) validPeriods.push(nextRise.idx - edges[i].idx);
                }
            }
            
            if (validPeriods.length > 0) {
                let avgPeriodPoints = validPeriods.reduce((a,b)=>a+b) / validPeriods.length;
                let currentTPerDiv = tDivScale[c.tDivIndex];
                let targetTPerDiv = currentTPerDiv * (avgPeriodPoints / 80); 
                
                let bestTIndex = 0, minDiff = Infinity;
                for (let i = 0; i < tDivScale.length; i++) {
                    let diff = Math.abs(tDivScale[i] - targetTPerDiv);
                    if (diff < minDiff) { minDiff = diff; bestTIndex = i; }
                }
                c.tDivIndex = bestTIndex;
            }

            c.xPosition = 0; c.dispMode = 0; c.trigMode = 0; c.isRun = true; 
        });

        // FUNGSI SCREENSHOT DSO (EXPORT PNG)
        bindBtn('.btn-print', (c) => {
            const canvas = contentDiv.querySelector('.osc-canvas-screen');
            if (!canvas) return;

            // Buat canvas resolusi tinggi (600x480)
            const exportCanvas = document.createElement('canvas');
            const W = 600, H = 480;
            exportCanvas.width = W;
            exportCanvas.height = H;
            const eCtx = exportCanvas.getContext('2d');

            // 1. Background Layar DSO
            eCtx.fillStyle = '#020617';
            eCtx.fillRect(0, 0, W, H);

            // 2. Grid DSO (10 kolom x 8 baris)
            eCtx.strokeStyle = '#0f766e';
            eCtx.lineWidth = 1;
            eCtx.setLineDash([4, 4]);
            for (let x = 60; x < W; x += 60) {
                eCtx.beginPath(); eCtx.moveTo(x, 0); eCtx.lineTo(x, H); eCtx.stroke();
            }
            for (let y = 60; y < H; y += 60) {
                eCtx.beginPath(); eCtx.moveTo(0, y); eCtx.lineTo(W, y); eCtx.stroke();
            }
            eCtx.setLineDash([]);

            // Sumbu silang tengah (Center Crosshair)
            eCtx.strokeStyle = '#0d9488';
            eCtx.lineWidth = 2;
            eCtx.beginPath();
            eCtx.moveTo(0, H / 2); eCtx.lineTo(W, H / 2);
            eCtx.moveTo(W / 2, 0); eCtx.lineTo(W / 2, H);
            eCtx.stroke();

            // 3. Salin Waveform dari Layar Canvas
            eCtx.drawImage(canvas, 0, 0, W, H);

            // 4. Panel Header Informasi Sinyal
            eCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            eCtx.fillRect(0, 0, W, 32);
            eCtx.strokeStyle = '#334155';
            eCtx.lineWidth = 1;
            eCtx.strokeRect(0, 0, W, 32);

            eCtx.font = 'bold 12px monospace';
            // CH1
            eCtx.fillStyle = '#eab308';
            const ch1V = vDivScale[c.ch1 ? c.ch1.vDivIndex : 0];
            const ch1Str = ch1V < 1 ? (ch1V * 1000) + 'mV' : ch1V + 'V';
            eCtx.fillText(`CH1: ${ch1Str}/div (${((c.simV||0) * (c.ch1 && c.ch1.invert ? -1 : 1)).toFixed(2)}V)`, 15, 21);

            // CH2
            eCtx.fillStyle = '#06b6d4';
            const ch2V = vDivScale[c.ch2 ? c.ch2.vDivIndex : 0];
            const ch2Str = ch2V < 1 ? (ch2V * 1000) + 'mV' : ch2V + 'V';
            eCtx.fillText(`CH2: ${ch2Str}/div (${((c.simV2||0) * (c.ch2 && c.ch2.invert ? -1 : 1)).toFixed(2)}V)`, 195, 21);

            // Time/Div & Trigger
            eCtx.fillStyle = '#38bdf8';
            const tDiv = tDivScale[c.tDivIndex !== undefined ? c.tDivIndex : 3];
            const tStr = tDiv >= 1 ? tDiv + 's' : (tDiv >= 0.001 ? (tDiv * 1000) + 'ms' : (tDiv * 1e6) + 'µs');
            eCtx.fillText(`T: ${tStr}/div`, 400, 21);

            eCtx.fillStyle = '#a855f7';
            eCtx.fillText(`Trig: ${(c.trigLevel || 0).toFixed(1)}V`, 500, 21);

            // 5. Jika panel measurement aktif, cetak telemetry
            if (c.measActive) {
                eCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
                eCtx.fillRect(15, 42, 260, 140);
                eCtx.strokeStyle = '#475569';
                eCtx.strokeRect(15, 42, 260, 140);

                eCtx.fillStyle = c.activeCh === 1 ? '#eab308' : '#06b6d4';
                eCtx.font = 'bold 11px sans-serif';
                eCtx.fillText(`MEASURE CH${c.activeCh}`, 95, 58);

                eCtx.font = '10px monospace';
                eCtx.fillStyle = '#cbd5e1';
                const getTxt = (cls) => {
                    const el = contentDiv.querySelector(cls);
                    return el ? el.textContent : '---';
                };
                eCtx.fillText(`Vpp : ${getTxt('.m-vpp')}`, 25, 78);
                eCtx.fillText(`Vmax: ${getTxt('.m-vmax')}`, 25, 96);
                eCtx.fillText(`Vmin: ${getTxt('.m-vmin')}`, 25, 114);
                eCtx.fillText(`Vrms: ${getTxt('.m-vrms')}`, 25, 132);
                eCtx.fillText(`Vavg: ${getTxt('.m-vavg')}`, 25, 150);
                eCtx.fillText(`Vamp: ${getTxt('.m-vamp')}`, 25, 168);

                eCtx.fillText(`Freq: ${getTxt('.m-freq')}`, 145, 78);
                eCtx.fillText(`Per : ${getTxt('.m-per')}`, 145, 96);
                eCtx.fillText(`Duty: ${getTxt('.m-duty')}`, 145, 114);
                eCtx.fillText(`P.W : ${getTxt('.m-pw')}`, 145, 132);
                eCtx.fillText(`Rise: ${getTxt('.m-rise')}`, 145, 150);
                eCtx.fillText(`Fall: ${getTxt('.m-fall')}`, 145, 168);
            }

            // 6. Download file PNG
            const a = document.createElement('a');
            a.download = `oscilloscope-capture-${Date.now()}.png`;
            a.href = exportCanvas.toDataURL('image/png');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            if (typeof UIManager !== 'undefined') {
                UIManager.showToast('📷 Tangkapan layar osiloskop berhasil diunduh!');
            }
        });
        
        // FUNGSI DRAG KURSOR (Smart OSD)
        const setupCursorDrag = (hitCls, visualCls, axis, prop, mode) => {
            const hitLine = contentDiv.querySelector(hitCls);
            if (!hitLine) return;
            
            const startDrag = (e) => {
                const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                if (!currentComp || !currentComp.cursorActive) return;
                e.preventDefault(); e.stopPropagation();
                currentComp.lastCursorMode = mode; 
                
                let startPos = axis === 'y' ? (e.touches ? e.touches[0].clientY : e.clientY) : (e.touches ? e.touches[0].clientX : e.clientX);
                let startVal = currentComp[prop];

                const onMove = (moveEvent) => {
                    let currentPos = axis === 'y' ? (moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY) : (moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX);
                    let zoomLevel = typeof UIManager !== 'undefined' ? UIManager.currentZoom : 1;
                    let delta = (currentPos - startPos) / zoomLevel;
                    
                    let newVal = startVal + delta;
                    if (axis === 'y') newVal = Math.max(40, Math.min(200, newVal));
                    if (axis === 'x') newVal = Math.max(30, Math.min(230, newVal));
                    
                    currentComp[prop] = newVal;
                    
                    let hL = contentDiv.querySelector(hitCls);
                    let vL = contentDiv.querySelector(visualCls);
                    if (hL && vL) {
                        if (axis === 'y') { hL.setAttribute('y1', newVal); hL.setAttribute('y2', newVal); vL.setAttribute('y1', newVal); vL.setAttribute('y2', newVal); }
                        else { hL.setAttribute('x1', newVal); hL.setAttribute('x2', newVal); vL.setAttribute('x1', newVal); vL.setAttribute('x2', newVal); }
                    }
                    if (contentDiv.uiInstance) contentDiv.uiInstance.updateCursorOSD(currentComp);
                };
                
                const onEnd = () => {
                    document.removeEventListener('mousemove', onMove); document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('mouseup', onEnd); document.removeEventListener('touchend', onEnd);
                    if (contentDiv.uiInstance) contentDiv.uiInstance.updateCursorOSD(currentComp);
                };
                
                document.addEventListener('mousemove', onMove); document.addEventListener('touchmove', onMove, {passive: false});
                document.addEventListener('mouseup', onEnd); document.addEventListener('touchend', onEnd);
            };
            hitLine.addEventListener('mousedown', startDrag);
            hitLine.addEventListener('touchstart', startDrag, {passive: false});
        };

        setupCursorDrag('.cur-v1-hit', '.cur-v1', 'y', 'curV1Y', 'V');
        setupCursorDrag('.cur-v2-hit', '.cur-v2', 'y', 'curV2Y', 'V');
        setupCursorDrag('.cur-t1-hit', '.cur-t1', 'x', 'curT1X', 'T');
        setupCursorDrag('.cur-t2-hit', '.cur-t2', 'x', 'curT2X', 'T');

        bindBtn('.btn-ch-sel', (c) => { c.activeCh = c.activeCh === 1 ? 2 : 1; });
        bindBtn('.btn-vdiv-up', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; if (ch.vDivIndex > 0) ch.vDivIndex--; });
        bindBtn('.btn-vdiv-dn', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; if (ch.vDivIndex < vDivScale.length - 1) ch.vDivIndex++; });
        bindBtn('.btn-ypos-up', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.yPosition += 0.5; });
        bindBtn('.btn-ypos-dn', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.yPosition -= 0.5; });
        bindBtn('.btn-invert', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.invert = !ch.invert; });
        bindBtn('.btn-ch-coupl', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.coupl = (ch.coupl + 1) % 3; });
        
        bindBtn('.btn-tdiv-dn', (c) => { if (c.tDivIndex > 0) c.tDivIndex--; });
        bindBtn('.btn-tdiv-up', (c) => { if (c.tDivIndex < tDivScale.length - 1) c.tDivIndex++; });
        bindBtn('.btn-xpos-dn', (c) => { if (c.xPosition > -10) c.xPosition -= 0.5; }); 
        bindBtn('.btn-xpos-up', (c) => { if (c.xPosition < 10) c.xPosition += 0.5; });  
        bindBtn('.btn-disp-mode', (c) => { 
            c.dispMode = (c.dispMode + 1) % 3; 
            if (c.dispMode === 0) {
                c.trigState = 'WAIT';
                c.lastTrigTime = Date.now();
            }
        });

        bindBtn('.btn-trig-mode', (c) => { 
            c.trigMode = (c.trigMode + 1) % 3; 
            c.trigState = 'WAIT'; 
            c.isRun = true;
            c.lastTrigTime = Date.now(); 
        });
        bindBtn('.btn-trig-slope', (c) => { c.trigSlope = c.trigSlope === 0 ? 1 : 0; });
        bindBtn('.btn-trig-coupl', (c) => { c.trigCoupl = (c.trigCoupl + 1) % 4; });
        bindBtn('.btn-trig-src', (c) => { c.trigSource = (c.trigSource + 1) % 2; }); 
        bindBtn('.btn-trig-lvl-up', (c) => { 
            let step = vDivScale[(c.trigSource === 0 ? c.ch1 : c.ch2).vDivIndex] * 0.2;
            c.trigLevel = (c.trigLevel || 0) + step; 
        });
        bindBtn('.btn-trig-lvl-dn', (c) => { 
            let step = vDivScale[(c.trigSource === 0 ? c.ch1 : c.ch2).vDivIndex] * 0.2;
            c.trigLevel = (c.trigLevel || 0) - step; 
        });
    }

    updateState(isSimActive) {
        const realComp = this.compData;
        const contentDiv = this.contentDiv;
        
        if (realComp.measActive === undefined) realComp.measActive = false; 
        
        // 1. INISIALISASI BUFFER GANDA (ACQUISITION & DISPLAY)
        if (!realComp.ch1) {
            realComp.ch1 = { vDivIndex: realComp.vDivIndex||0, yPosition: realComp.yPosition||0, invert: realComp.invert||false, coupl: 0, dcOffset: 0 };
            realComp.ch2 = { vDivIndex: 0, yPosition: 0, invert: false, coupl: 0, dcOffset: 0 };
            realComp.activeCh = 1; 
        }
        if (!realComp.history1) realComp.history1 = new Array(3000).fill(0);
        if (!realComp.history2) realComp.history2 = new Array(3000).fill(0);
        if (!realComp.dispBuf1) realComp.dispBuf1 = new Array(3000).fill(0);
        if (!realComp.dispBuf2) realComp.dispBuf2 = new Array(3000).fill(0);

        // Nilai Default
        if (realComp.ch1.enabled === undefined) realComp.ch1.enabled = true;
        if (realComp.ch2.enabled === undefined) realComp.ch2.enabled = true;
        if (realComp.isRun === undefined) realComp.isRun = true; 
        if (realComp.xPosition === undefined) realComp.xPosition = 0; 
        if (realComp.tDivIndex === undefined) realComp.tDivIndex = 3; 
        if (realComp.dispMode === undefined) realComp.dispMode = 0; 
        if (realComp.trigMode === undefined) realComp.trigMode = 0; 
        if (realComp.trigSource === undefined) realComp.trigSource = 0; 
        if (realComp.trigLevel === undefined) realComp.trigLevel = 0; 
        if (realComp.trigSlope === undefined) realComp.trigSlope = 0; 
        if (realComp.trigCoupl === undefined) realComp.trigCoupl = 0; 
        
        // Variabel Mesin Trigger (DSO Engine)
        if (realComp.trigState === undefined) realComp.trigState = 'WAIT'; 
        if (realComp.lastAcqTrigV === undefined) realComp.lastAcqTrigV = 0;
        if (realComp.postTrigCounter === undefined) realComp.postTrigCounter = 0;
        if (realComp.lastTrigTime === undefined) realComp.lastTrigTime = Date.now();
        if (realComp.trigDcOffset === undefined) realComp.trigDcOffset = 0; 
        if (realComp.trigLowPass === undefined) realComp.trigLowPass = 0; 
        if (realComp.capturedTDiv === undefined) realComp.capturedTDiv = realComp.tDivIndex;

        // Memori Kursor (Tetap dipertahankan)
        if (realComp.cursorActive === undefined) realComp.cursorActive = false; 
        if (realComp.curV1Y === undefined) realComp.curV1Y = 80;  
        if (realComp.curV2Y === undefined) realComp.curV2Y = 160; 
        if (realComp.curT1X === undefined) realComp.curT1X = 80;  
        if (realComp.curT2X === undefined) realComp.curT2X = 180; 
        
        // 2. PEMROSESAN SINYAL (COUPLING & DC BLOCKER)
        let rawV1 = realComp.simV || 0;
        let rawV2 = realComp.simV2 || 0;
        
        // A. Hitung Delta Time (dt) khusus untuk DC Blocker
        const nowMs = Date.now();
        if (!realComp.lastDcUpdate) realComp.lastDcUpdate = nowMs;
        let dt = (nowMs - realComp.lastDcUpdate) / 1000; // Ubah ke detik
        realComp.lastDcUpdate = nowMs;
        
        // Pencegah ledakan nilai jika pengguna pindah tab browser
        if (dt > 0.1) dt = 0.1; 

        // B. Rumus Konstanta Waktu Fisika (RC Filter)
        const RC = 2.0; // 2 detik (Kecepatan kapasitor AC coupling merespons, diturunkan agar frekuensi rendah tidak terpotong)
        const alpha = Math.exp(-dt / RC); 

        // C. Terapkan EMA yang sudah kebal terhadap variasi FPS monitor
        realComp.ch1.dcOffset = (realComp.ch1.dcOffset * alpha) + (rawV1 * (1 - alpha));
        realComp.ch2.dcOffset = (realComp.ch2.dcOffset * alpha) + (rawV2 * (1 - alpha));

        let v1 = rawV1;
        if (realComp.ch1.coupl === 1) v1 -= realComp.ch1.dcOffset; else if (realComp.ch1.coupl === 2) v1 = 0;
        
        let v2 = rawV2;
        if (realComp.ch2.coupl === 1) v2 -= realComp.ch2.dcOffset; else if (realComp.ch2.coupl === 2) v2 = 0;
        
        let rawTrigSrc = (realComp.trigSource === 0) ? rawV1 : rawV2;
        
        // D. Terapkan juga untuk sistem Trigger
        const alphaTrigLP = Math.exp(-dt / 0.005); // Filter Low-Pass Trigger lebih cepat (5ms)
        realComp.trigDcOffset = (realComp.trigDcOffset * alpha) + (rawTrigSrc * (1 - alpha));
        realComp.trigLowPass = (realComp.trigLowPass * alphaTrigLP) + (rawTrigSrc * (1 - alphaTrigLP));
        
        let trigV = rawTrigSrc; 
        if (realComp.trigCoupl === 1) trigV = rawTrigSrc - realComp.trigDcOffset; 
        else if (realComp.trigCoupl === 2) trigV = realComp.trigLowPass; 
        else if (realComp.trigCoupl === 3) trigV = rawTrigSrc - realComp.trigLowPass; 

        // 3. TIMING & ENGINE ACQUISITION (DSO LOGIC)
        let tPerDiv = tDivScale[realComp.tDivIndex];
        let sampleDelay = (tPerDiv * 10 * 1000) / 200; 
        const now = Date.now();
        if (!realComp.lastOscUpdate) realComp.lastOscUpdate = now;

        if (realComp.lastV1 === undefined) realComp.lastV1 = v1;
        if (realComp.lastV2 === undefined) realComp.lastV2 = v2;
        if (realComp.lastTrig === undefined) realComp.lastTrig = trigV;

        let isPaused = typeof CircuitStore !== 'undefined' ? CircuitStore.isPaused : false;

        if ((isSimActive || isPaused) && realComp.isRun) {
            let elapsed = now - realComp.lastOscUpdate;
            
            // Pelindung Jeda: Cegah gelombang melompat lurus jika ditinggal lama
            if (elapsed > 500) {
                realComp.lastOscUpdate = now;
                realComp.lastTrigTime = now; 
                elapsed = 0;
                realComp.lastV1 = v1; realComp.lastV2 = v2; realComp.lastTrig = trigV;
            }

            if (isSimActive && elapsed >= sampleDelay) {
                let steps = Math.floor(elapsed / sampleDelay);
                if (steps > 300) steps = 300; // Batasi jika CPU lag

                // 🟢 METODE LERP (Linear Interpolation)
                let stepV1 = (v1 - realComp.lastV1) / steps;
                let stepV2 = (v2 - realComp.lastV2) / steps;
                let stepTrig = (trigV - realComp.lastTrig) / steps;

                // 1. Inisialisasi Pointer (Head Index)
                if (realComp.headIdx === undefined) realComp.headIdx = 2999;

                for(let i = 1; i <= steps; i++) {
                    let interpV1 = realComp.lastV1 + (stepV1 * i);
                    let interpV2 = realComp.lastV2 + (stepV2 * i);
                    let interpTrig = realComp.lastTrig + (stepTrig * i);

                    // 🟢 SOLUSI PERFORMA: CIRCULAR BUFFER O(1)
                    // Tidak ada lagi .shift()! Kita hanya memutar pointer dari 0 ke 2999
                    realComp.headIdx = (realComp.headIdx + 1) % 3000;
                    realComp.history1[realComp.headIdx] = interpV1;
                    realComp.history2[realComp.headIdx] = interpV2;

                    // B. STATE MACHINE TRIGGER & STEADY SCREEN
                    if (realComp.dispMode === 2 || realComp.dispMode === 1) {
                        // Mode X-Y (1) dan ROLL (2) menggunakan live data
                        realComp.capturedTDiv = realComp.tDivIndex;
                        realComp.trigState = realComp.dispMode === 2 ? 'ROLL' : 'X-Y';
                    } else {
                        // MODE Y-T (STEADY / NORMAL)
                        if (realComp.trigState === 'ROLL' || realComp.trigState === 'X-Y') {
                            realComp.trigState = 'WAIT';
                            realComp.lastTrigTime = Date.now();
                        }

                        let isTrig = false;
                        if (realComp.trigSlope === 0) {
                            if (realComp.lastAcqTrigV < realComp.trigLevel && interpTrig >= realComp.trigLevel) isTrig = true;
                        } else {
                            if (realComp.lastAcqTrigV > realComp.trigLevel && interpTrig <= realComp.trigLevel) isTrig = true;
                        }

                        if (realComp.trigState === 'WAIT' && isTrig) {
                            realComp.trigState = 'POST_TRIG';
                            realComp.postTrigCounter = 100;
                        }

                        if (realComp.trigState === 'POST_TRIG') {
                            realComp.postTrigCounter--;
                            if (realComp.postTrigCounter <= 0) {
                                // JEPRET SNAPSHOT! Salin memori Circular menjadi Linear (Flatten)
                                // Operasi ini sangat ringan karena HANYA dilakukan 1x setiap kali Trigger tercapai
                                realComp.lastTrigTime = Date.now();
                                for(let j = 0; j < 3000; j++) {
                                    let circIdx = (realComp.headIdx + 1 + j) % 3000;
                                    realComp.dispBuf1[j] = realComp.history1[circIdx];
                                    realComp.dispBuf2[j] = realComp.history2[circIdx];
                                }
                                realComp.capturedTDiv = realComp.tDivIndex;

                                if (realComp.trigMode === 2) { 
                                    realComp.trigState = 'STOP'; realComp.isRun = false;
                                } else {
                                    realComp.trigState = 'WAIT';
                                }
                            }
                        }

                        // FALLBACK AUTO MODE
                        if (realComp.trigMode === 0 && realComp.trigState === 'WAIT' && (Date.now() - (realComp.lastTrigTime || 0) > 1000)) {
                            realComp.capturedTDiv = realComp.tDivIndex;
                        }
                    }
                    realComp.lastAcqTrigV = interpTrig;
                }
                realComp.lastOscUpdate = now - (elapsed % sampleDelay);
                realComp.lastV1 = v1; realComp.lastV2 = v2; realComp.lastTrig = trigV;
            }

        }

        // [BAGIAN 3: DELEGASI KE FUNGSI RENDERING CANVAS]
        this.renderCanvas(isSimActive, isPaused);
    }
    
    renderCanvas(isSimActive, isPaused) {
        const realComp = this.compData;
        const contentDiv = this.contentDiv;
        const canvas = contentDiv.querySelector('.osc-canvas-screen');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d', { alpha: true });
        
        // 1. BERSIHKAN PAPAN TULIS (Hapus Frame Sebelumnya)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // PENERJEMAH CIRCULAR BUFFER (Smart Buffer Reader)
        let isLive = (realComp.dispMode === 1 || realComp.dispMode === 2 || (realComp.trigMode === 0 && realComp.trigState === 'WAIT' && (Date.now() - (realComp.lastTrigTime || 0) > 1000)));

        let head = isLive ? realComp.headIdx : 2999;
        let targetBuf1 = isLive ? realComp.history1 : realComp.dispBuf1;
        let targetBuf2 = isLive ? realComp.history2 : realComp.dispBuf2;

        // Helper Fungsi untuk membaca array
        // Jika mode live (Circular), ia menghitung posisi dengan Modulo 3000
        // Jika mode Snapshot (Linear), ia membacanya secara biasa
        const getVal = (buf, logicalIdx) => {
            if (!buf) return 0;
            let val;
            if (isLive) {
                val = buf[(head + 1 + Math.floor(logicalIdx)) % 3000];
            } else {
                let idx = Math.max(0, Math.min(2999, Math.floor(logicalIdx)));
                val = buf[idx];
            }
            return (val !== undefined && !isNaN(val)) ? val : 0;
        };

        let xPixelOffset = realComp.xPosition * 20; 
        let scaleMax1 = vDivScale[realComp.ch1.vDivIndex] * 4;
        let scaleMax2 = vDivScale[realComp.ch2.vDivIndex] * 4;
        let yPx1 = realComp.ch1.yPosition * 20;
        let yPx2 = realComp.ch2.yPosition * 20;
        let inv1 = realComp.ch1.invert ? -1 : 1;
        let inv2 = realComp.ch2.invert ? -1 : 1;

        let tScaleRatio = 1.0;
        if (realComp.capturedTDiv !== undefined) {
            tScaleRatio = tDivScale[realComp.tDivIndex] / tDivScale[realComp.capturedTDiv];
        }

        let anchorIdx = 2999 - xPixelOffset; 
        let isPowerOn = isSimActive || isPaused;

        // ==========================================
        // 2. RENDERING GRAFIK MENGGUNAKAN CANVAS API
        // ==========================================
        if (isPowerOn) {
            if (realComp.dispMode === 0 || realComp.dispMode === 2) {
                // FUNGSI PENGGAMBAR CH1 & CH2 (MODE Y-T & ROLL)
                const drawChannel = (buffer, scaleMax, yPx, inv, color) => {
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.lineJoin = 'round';
                    let firstPoint = true;

                    for(let i = 0; i < 200; i++) {
                        let offsetFromRight = i - 199; 
                        let exactIdx = anchorIdx + (offsetFromRight * tScaleRatio);
                        
                        if (exactIdx >= 0 && exactIdx <= 2999) {
                            let px = i; // Posisi X relatif terhadap lebar Canvas (200px)
                            
                            if (tScaleRatio > 1) {
                                // PEAK-DETECT (Anti-Aliasing untuk Zoom Out)
                                let sIdx = Math.floor(exactIdx);
                                let eIdx = Math.min(2999, Math.floor(exactIdx + tScaleRatio));
                                let minV = Infinity, maxV = -Infinity;
                                
                                let pointsToScan = eIdx - sIdx;
                                let scanStep = pointsToScan > 20 ? Math.ceil(pointsToScan / 20) : 1;
                                
                                for(let k = sIdx; k <= eIdx; k += scanStep) {
                                    let v = getVal(buffer, k);
                                    if (v < minV) minV = v; if (v > maxV) maxV = v;
                                }
                                if (scanStep > 1) {
                                    let v = getVal(buffer, eIdx);
                                    if (v < minV) minV = v; if (v > maxV) maxV = v;
                                }
                                
                                // Mapping ke Canvas Y (Tinggi 160px, Tengah 80px)
                                let py_min = 80 - (((minV * inv) / scaleMax) * 80) - yPx;
                                let py_max = 80 - (((maxV * inv) / scaleMax) * 80) - yPx;
                                
                                if (firstPoint) { ctx.moveTo(px, py_min); firstPoint = false; }
                                else { ctx.lineTo(px, py_min); }
                                ctx.lineTo(px, py_max);
                            } else {
                                // 🟢 PERBAIKAN: POINT-SAMPLING & SUB-PIXEL INTERPOLATION
                                // Menciptakan garis miring yang mulus sempurna, menghilangkan efek tangga saat Zoom-In
                                let idx = Math.floor(exactIdx);
                                let fraction = exactIdx - idx; // Ambil sisa desimalnya
                                
                                // Baca titik saat ini dan titik berikutnya
                                let val1 = getVal(buffer, idx);
                                let val2 = getVal(buffer, Math.min(2999, idx + 1));
                                
                                // Gabungkan kedua titik dengan mulus (Linear Interpolation)
                                let smoothVal = val1 + (val2 - val1) * fraction;
                                
                                let py = 80 - (((smoothVal * inv) / scaleMax) * 80) - yPx;
                                
                                if (firstPoint) { ctx.moveTo(px, py); firstPoint = false; }
                                else { ctx.lineTo(px, py); }
                            }
                        }
                    }
                    ctx.stroke(); // Eksekusi gambar ke GPU
                };

                // Gambar gelombangnya! (Gunakan targetBuf)
                if (realComp.ch1.enabled) drawChannel(targetBuf1, scaleMax1, yPx1, inv1, '#eab308');
                if (realComp.ch2.enabled) drawChannel(targetBuf2, scaleMax2, yPx2, inv2, '#06b6d4');
                
            } else if (realComp.dispMode === 1 && realComp.ch1.enabled && realComp.ch2.enabled) {
                // MODE X-Y (LISSAJOUS)
                ctx.beginPath();
                ctx.strokeStyle = '#10b981'; // Warna Hijau
                ctx.lineWidth = 2;
                let firstPoint = true;

                let startBufferIdx = Math.max(0, Math.floor(anchorIdx - (199 * tScaleRatio)));
                let endBufferIdx = Math.min(2999, Math.floor(anchorIdx));
                let pointsToScan = endBufferIdx - startBufferIdx;
                let scanStep = pointsToScan > 400 ? Math.ceil(pointsToScan / 400) : 1;

                for (let k = startBufferIdx; k <= endBufferIdx; k += scanStep) {
                    let valX = getVal(targetBuf1, k) * inv1;
                    let valY = getVal(targetBuf2, k) * inv2;
                    
                    let px = 100 + ((valX / scaleMax1) * 80) + yPx1; 
                    let py = 80 - ((valY / scaleMax2) * 80) - yPx2;
                    
                    if (px >= 0 && px <= 200 && py >= 0 && py <= 160) { 
                        if (firstPoint) { ctx.moveTo(px, py); firstPoint = false; }
                        else { ctx.lineTo(px, py); }
                    } else {
                        firstPoint = true;
                    }
                }
                ctx.stroke();
            }
        }

        // ==========================================
        // 3. UPDATE DOM UI (Indikator, Teks, Overlay)
        // ==========================================
        let indY1 = Math.max(40, Math.min(200, 120 - yPx1)); 
        let indY2 = Math.max(40, Math.min(200, 120 - yPx2)); 
        let indX = Math.max(30, Math.min(230, 130 + xPixelOffset));
        let trigScaleMax = vDivScale[(realComp.trigSource === 0 ? realComp.ch1 : realComp.ch2).vDivIndex] * 4;
        let trigYPx = (realComp.trigSource === 0 ? realComp.ch1 : realComp.ch2).yPosition * 20;
        let indLvlY = Math.max(40, Math.min(200, 120 - ((realComp.trigLevel / trigScaleMax) * 80) - trigYPx));
        let tPerDiv = tDivScale[realComp.tDivIndex];

        // Pisahkan DOM update ke frame animasi mandiri agar tidak memberatkan physics loop
        requestAnimationFrame(() => {
            let yInd1 = contentDiv.querySelector('.ypos-ind-1'); 
            if (yInd1) { yInd1.setAttribute('points', `230,${indY1} 235,${indY1-4} 235,${indY1+4}`); yInd1.style.display = realComp.ch1.enabled ? 'block' : 'none'; }
            let yInd2 = contentDiv.querySelector('.ypos-ind-2'); 
            if (yInd2) { yInd2.setAttribute('points', `230,${indY2} 235,${indY2-4} 235,${indY2+4}`); yInd2.style.display = realComp.ch2.enabled ? 'block' : 'none'; }
            
            let xInd = contentDiv.querySelector('.xpos-indicator'); 
            if (xInd) xInd.setAttribute('points', `${indX},40 ${indX-4},35 ${indX+4},35`);
            let lvlInd = contentDiv.querySelector('.lvl-indicator'); 
            if (lvlInd) lvlInd.setAttribute('points', `230,${indLvlY} 225,${indLvlY-4} 225,${indLvlY+4}`);
                           
            // KURSOR PENGUKURAN (SMART OSD)
            this.updateCursorOSD(realComp);

            // AUTO MEASUREMENT
            let measOverlay = contentDiv.querySelector('.meas-overlay');
            if (measOverlay) {
                if (realComp.measActive) {
                    measOverlay.style.display = 'block';
                    const screenW = 200; 
                    let activeHist = new Array(screenW);
                    let activeTargetBuf = realComp.activeCh === 1 ? targetBuf1 : targetBuf2;
                    
                    for(let i = 0; i < screenW; i++) {
                        let offsetFromRight = i - (screenW - 1); 
                        let exactIdx = anchorIdx + (offsetFromRight * tScaleRatio);
                        let idx = Math.max(0, Math.min(2999, Math.floor(exactIdx)));
                        activeHist[i] = getVal(activeTargetBuf, idx);
                    }

                    let invMult = (realComp.activeCh === 1 ? realComp.ch1.invert : realComp.ch2.invert) ? -1 : 1;
                    
                    let vMax = -Infinity, vMin = Infinity, sum = 0, sumSq = 0;
                    for(let i=0; i < screenW; i++) {
                        let v = activeHist[i] * invMult;
                        if (v > vMax) vMax = v;
                        if (v < vMin) vMin = v;
                        sum += v; sumSq += (v * v);
                    }
                    if (vMax === -Infinity) { vMax = 0; vMin = 0; }
                    
                    let vAvg = sum / screenW;                    
                    let vRms = Math.sqrt(sumSq / screenW);       
                    let vPp = vMax - vMin;                   
                    let vAmp = vPp / 2;                      
                    
                    let timePerPoint = (tPerDiv * 10) / screenW; 
                    let midV = (vMax + vMin) / 2;
                    let p10 = vMin + (vPp * 0.1); 
                    let p90 = vMin + (vPp * 0.9); 
                    
                    let edges = [];
                    if (vPp > 0.1) {
                        let isH = (activeHist[0] * invMult) > midV;
                        for(let i = 1; i < screenW; i++) {
                            let v = activeHist[i] * invMult;
                            let currentH = v > midV;
                            if (currentH !== isH) {
                                edges.push({ type: currentH ? 'rise' : 'fall', idx: i });
                                isH = currentH;
                            }
                        }
                    }
                    
                    let validPeriods = [], validPWs = [];
                    for(let i=0; i<edges.length; i++) {
                        if (edges[i].type === 'rise') {
                            let nextFall = edges.find((e, idx) => idx > i && e.type === 'fall');
                            if (nextFall) validPWs.push(nextFall.idx - edges[i].idx); 
                            let nextRise = edges.find((e, idx) => idx > i && e.type === 'rise');
                            if (nextRise) validPeriods.push(nextRise.idx - edges[i].idx); 
                        }
                    }
                    
                    let freq = 0, period = 0, pulseWidth = 0, dutyCycle = 0;
                    if (validPeriods.length > 0) {
                        let avgPeriodPoints = validPeriods.reduce((a,b)=>a+b) / validPeriods.length;
                        period = avgPeriodPoints * timePerPoint;
                        freq = 1 / period;
                    }
                    if (validPWs.length > 0 && period > 0) {
                        let avgPWPoints = validPWs.reduce((a,b)=>a+b) / validPWs.length;
                        pulseWidth = avgPWPoints * timePerPoint;
                        dutyCycle = (pulseWidth / period) * 100;
                    }
                    
                    let riseTimePts = 0, fallTimePts = 0;
                    if (vPp > 0.1) {
                        let firstRise = edges.find(e => e.type === 'rise');
                        if (firstRise) {
                            let s10 = firstRise.idx, e90 = firstRise.idx;
                            while(s10 > 0 && (activeHist[s10] * invMult) > p10) s10--;
                            while(e90 < (screenW - 1) && (activeHist[e90] * invMult) < p90) e90++;
                            riseTimePts = Math.max(0, e90 - s10);
                        }
                        let firstFall = edges.find(e => e.type === 'fall');
                        if (firstFall) {
                            let s90 = firstFall.idx, e10 = firstFall.idx;
                            while(s90 > 0 && (activeHist[s90] * invMult) < p90) s90--;
                            while(e10 < (screenW - 1) && (activeHist[e10] * invMult) > p10) e10++;
                            fallTimePts = Math.max(0, e10 - s90);
                        }
                    }

                    const fmtF = (f) => (f > 0 && isFinite(f)) ? (f >= 1e6 ? (f/1e6).toFixed(2)+'MHz' : f >= 1e3 ? (f/1e3).toFixed(2)+'kHz' : f.toFixed(2)+'Hz') : '---';
                    const fmtT = (t) => (t > 0 && isFinite(t)) ? (t >= 1 ? t.toFixed(2)+'s' : t >= 0.001 ? (t*1000).toFixed(2)+'ms' : (t*1e6).toFixed(2)+'μs') : '---';
                    
                    let title = contentDiv.querySelector('.meas-title');
                    if (title) {
                        title.textContent = `MEASURE CH${realComp.activeCh}`;
                        title.setAttribute('fill', realComp.activeCh === 1 ? '#eab308' : '#06b6d4');
                    }
                    contentDiv.querySelector('.m-vpp').textContent = vPp.toFixed(2) + 'V';
                    contentDiv.querySelector('.m-vmax').textContent = vMax.toFixed(2) + 'V';
                    contentDiv.querySelector('.m-vmin').textContent = vMin.toFixed(2) + 'V';
                    contentDiv.querySelector('.m-vamp').textContent = vAmp.toFixed(2) + 'V';
                    contentDiv.querySelector('.m-vrms').textContent = vRms.toFixed(2) + 'V';
                    contentDiv.querySelector('.m-vavg').textContent = vAvg.toFixed(2) + 'V';
                    contentDiv.querySelector('.m-freq').textContent = fmtF(freq);
                    contentDiv.querySelector('.m-per').textContent = fmtT(period);
                    contentDiv.querySelector('.m-duty').textContent = (dutyCycle > 0 && isFinite(dutyCycle)) ? dutyCycle.toFixed(1)+'%' : '---';
                    contentDiv.querySelector('.m-pw').textContent = fmtT(pulseWidth);
                    contentDiv.querySelector('.m-rise').textContent = fmtT(riseTimePts * timePerPoint);
                    contentDiv.querySelector('.m-fall').textContent = fmtT(fallTimePts * timePerPoint);
                } else {
                    measOverlay.style.display = 'none'; 
                }
            }
            
            // --- TAMBAHAN START (Update teks tombol MEAS) ---
            let measTxt = contentDiv.querySelector('.meas-txt');
            if (measTxt) {
                measTxt.textContent = realComp.measActive ? 'ON' : 'OFF';
                measTxt.setAttribute('fill', realComp.measActive ? '#10b981' : '#fff');
            }
            // Perbarui Teks Label Tombol ch sel
            let chSelTxt = contentDiv.querySelector('.ch-sel-txt');
            if (chSelTxt) {
                chSelTxt.textContent = realComp.activeCh === 1 ? 'CH1' : 'CH2';
                chSelTxt.setAttribute('fill', realComp.activeCh === 1 ? '#eab308' : '#06b6d4'); // Kuning untuk CH1, Biru untuk CH2
            }
            let runStopTxt = contentDiv.querySelector('.run-stop-text');
            if (runStopTxt) {
                runStopTxt.textContent = realComp.isRun ? 'RUN' : 'STOP';
                runStopTxt.setAttribute('fill', realComp.isRun ? '#10b981' : '#ef4444'); // Hijau untuk RUN, Merah untuk STOP
            }

            let dispTxt = contentDiv.querySelector('.disp-mode-txt');
            if (dispTxt) {
                dispTxt.textContent = ['Y-T', 'X-Y', 'ROLL'][realComp.dispMode];
                dispTxt.setAttribute('fill', realComp.dispMode === 1 ? '#10b981' : (realComp.dispMode === 2 ? '#f59e0b' : '#fff'));
            }
            
            contentDiv.querySelector('.ch-coupl-txt').textContent = ['DC', 'AC', 'GND'][(realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2).coupl];
            contentDiv.querySelector('.btn-invert').setAttribute('fill', (realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2).invert ? (realComp.activeCh === 1 ? '#eab308' : '#06b6d4') : '#475569');
            contentDiv.querySelector('.inv-text').setAttribute('fill', (realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2).invert ? '#000' : '#fff');
            
            let tmTxt = contentDiv.querySelector('.trig-mode-txt');
            if (tmTxt) {
                if (realComp.dispMode === 2 || realComp.dispMode === 1) {
                    tmTxt.textContent = '---'; tmTxt.setAttribute('fill', '#475569');
                } else {
                    tmTxt.textContent = ['AUTO', 'NORM', 'SING'][realComp.trigMode];
                    if (realComp.trigMode === 2 && realComp.trigState === 'STOP') { tmTxt.textContent = 'STOP'; tmTxt.setAttribute('fill', '#f87171'); } 
                    else if (realComp.trigMode === 2 && realComp.trigState === 'WAIT') { tmTxt.textContent = 'RDY'; tmTxt.setAttribute('fill', '#fbbf24'); } 
                    else if (realComp.trigMode !== 0 && realComp.trigState === 'WAIT') { tmTxt.setAttribute('fill', '#fbbf24'); } 
                    else { tmTxt.setAttribute('fill', '#fff'); }
                }
            }
            
            contentDiv.querySelector('.trig-slope-txt').textContent = realComp.trigSlope === 0 ? 'RISE ↑' : 'FALL ↓';
            contentDiv.querySelector('.trig-coupl-txt').textContent = ['DC', 'AC', 'HF-R', 'LF-R'][realComp.trigCoupl];
            contentDiv.querySelector('.trig-src-txt').textContent = ['CH1', 'CH2'][realComp.trigSource];
            contentDiv.querySelector('.tlvl-text').textContent = `Trig: ${realComp.trigLevel.toFixed(1)}V`;
            
            let vdiv1Txt = contentDiv.querySelector('.vdiv1-text');
            if (vdiv1Txt) { vdiv1Txt.textContent = `${realComp.dispMode === 1 ? 'X (CH1)' : 'CH1'}: ${vDivScale[realComp.ch1.vDivIndex] < 1 ? (vDivScale[realComp.ch1.vDivIndex]*1000)+'mV/div' : vDivScale[realComp.ch1.vDivIndex]+'V/div'}`; vdiv1Txt.setAttribute('fill', realComp.ch1.enabled ? '#eab308' : '#475569'); }
            
            let vdiv2Txt = contentDiv.querySelector('.vdiv2-text');
            if (vdiv2Txt) { vdiv2Txt.textContent = `${realComp.dispMode === 1 ? 'Y (CH2)' : 'CH2'}: ${vDivScale[realComp.ch2.vDivIndex] < 1 ? (vDivScale[realComp.ch2.vDivIndex]*1000)+'mV/div' : vDivScale[realComp.ch2.vDivIndex]+'V/div'}`; vdiv2Txt.setAttribute('fill', realComp.ch2.enabled ? '#06b6d4' : '#475569'); }
            
            let tdivTxt = contentDiv.querySelector('.tdiv-text');
            if (tdivTxt) tdivTxt.textContent = `T/Div: ${tPerDiv >= 1 ? tPerDiv + "s/div" : (tPerDiv >= 0.001 ? (tPerDiv * 1000) + "ms/div" : (tPerDiv * 1000000) + "μs/div")}`;
            
            let val1Txt = contentDiv.querySelector('.val1-text');
            if (val1Txt) { val1Txt.textContent = realComp.ch1.enabled ? `V1: ${((realComp.simV || 0) * (realComp.ch1.invert ? -1 : 1)).toFixed(2)}V` : 'V1: OFF'; val1Txt.setAttribute('fill', realComp.ch1.enabled ? '#eab308' : '#475569'); }
            
            let val2Txt = contentDiv.querySelector('.val2-text');
            if (val2Txt) { val2Txt.textContent = realComp.ch2.enabled ? `V2: ${((realComp.simV2 || 0) * (realComp.ch2.invert ? -1 : 1)).toFixed(2)}V` : 'V2: OFF'; val2Txt.setAttribute('fill', realComp.ch2.enabled ? '#06b6d4' : '#475569'); }
            
            let chEnTxt = contentDiv.querySelector('.ch-en-text');
            if (chEnTxt) { chEnTxt.textContent = (realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2).enabled !== false ? 'ON' : 'OFF'; chEnTxt.setAttribute('fill', (realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2).enabled ? '#10b981' : '#f87171'); }
            
            this.setPinActive('pin-in-0', Math.abs(realComp.simV || 0) > 0.05); 
            this.setPinActive('pin-in-1', Math.abs(realComp.simV2 || 0) > 0.05);
        });
    }

    updateCursorOSD(comp) {
        const realComp = comp || this.compData;
        const contentDiv = this.contentDiv;
        if (!contentDiv || !realComp) return;

        let cursGroup = contentDiv.querySelector('.cursors-group');
        let cursOSD = contentDiv.querySelector('.cur-osd');
        let cursBtnTxt = contentDiv.querySelector('.cursor-txt');
        
        if (realComp.cursorActive) {
            if (cursGroup) cursGroup.style.display = 'block';
            if (cursOSD) cursOSD.style.display = 'block';
            if (cursBtnTxt) { cursBtnTxt.textContent = 'ON'; cursBtnTxt.setAttribute('fill', '#10b981'); }
            
            let curMode = realComp.lastCursorMode || 'V'; 
            let title = contentDiv.querySelector('.cur-title');
            let txt1 = contentDiv.querySelector('.cur-txt-1');
            let txt2 = contentDiv.querySelector('.cur-txt-2');
            let txtD = contentDiv.querySelector('.cur-txt-d');
            
            if (curMode === 'V') {
                let activeChInfo = realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2;
                let scaleMax = vDivScale[activeChInfo ? activeChInfo.vDivIndex : 0] * 4;
                let yPx = (activeChInfo ? activeChInfo.yPosition : 0) * 20;
                
                let val1 = (120 - realComp.curV1Y - yPx) * scaleMax / 80;
                let val2 = (120 - realComp.curV2Y - yPx) * scaleMax / 80;
                let deltaV = val1 - val2;
                
                if (title) { title.textContent = `CURS (CH${realComp.activeCh} VOLT)`; title.setAttribute('fill', realComp.activeCh === 1 ? '#eab308' : '#06b6d4'); }
                if (txt1) { txt1.textContent = `1: ${val1.toFixed(2)}V`; txt1.setAttribute('fill', '#eab308'); }
                if (txt2) { txt2.textContent = `2: ${val2.toFixed(2)}V`; txt2.setAttribute('fill', '#06b6d4'); }
                if (txtD) { txtD.textContent = `Δ: ${Math.abs(deltaV).toFixed(2)}V`; }
            } else {
                let tPerDiv = tDivScale[realComp.tDivIndex !== undefined ? realComp.tDivIndex : 3];
                let t1 = ((realComp.curT1X - 30) / 20) * tPerDiv;
                let t2 = ((realComp.curT2X - 30) / 20) * tPerDiv;
                let deltaT = Math.abs(t2 - t1);
                let freq = deltaT > 0 ? (1 / deltaT) : 0;
                
                const fmtT = (t) => (t >= 1 ? t.toFixed(2)+'s' : t >= 0.001 ? (t*1000).toFixed(2)+'ms' : (t*1e6).toFixed(2)+'μs');
                const fmtF = (f) => (f >= 1e6 ? (f/1e6).toFixed(2)+'MHz' : f >= 1e3 ? (f/1e3).toFixed(2)+'kHz' : f.toFixed(2)+'Hz');

                if (title) { title.textContent = `CURSOR (TIME)`; title.setAttribute('fill', '#fff'); }
                if (txt1) { txt1.textContent = `1: ${fmtT(t1)}`; txt1.setAttribute('fill', '#eab308'); }
                if (txt2) { txt2.textContent = `2: ${fmtT(t2)}`; txt2.setAttribute('fill', '#06b6d4'); }
                if (txtD) { txtD.textContent = `Δ: ${fmtT(deltaT)} (${fmtF(freq)})`; }
            }
        } else {
            if (cursGroup) cursGroup.style.display = 'none';
            if (cursOSD) cursOSD.style.display = 'none';
            if (cursBtnTxt) { cursBtnTxt.textContent = 'OFF'; cursBtnTxt.setAttribute('fill', '#fff'); }
        }
    }
}
UIRegistry['oscilloscope'] = OscilloscopeUI;