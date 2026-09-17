// File: src/main.js

// =========================================================
// 1. IMPOR SEMUA MODUL DAN KETERGANTUNGAN
// =========================================================
import { createComponent } from './canvas/ComponentBuilder.js';
import { createConnection, drawConnections, updateConnectionPointVisuals, optimizedDrawConnections, updateWireStates } from './canvas/WireManager.js';
import { CircuitStore } from './state/CircuitStore.js';
import { SimulationEngine } from './engine/SimulationEngine.js';
import { HistoryManager } from './HistoryManager.js';
import { UIManager } from './UI/UIManager.js';
import { AudioManager } from './engine/AudioManager.js';

import { startSim, pauseSim, stopSim, updateSimControlsUI } from './UI/SimulationController.js';
import { copySelection, pasteClipboard, clearAllWires, clearCanvas, initGlobalMouseTracker, setupKeyboardShortcuts } from './managers/ClipboardManager.js';
import { initContextMenu } from './UI/ContextMenu.js';
import { initSmartCanvasNavigation } from './canvas/CanvasNavigation.js';
import { initComponentSensors } from './canvas/ComponentBuilder.js';
import { splitWireToNode } from './canvas/WireManager.js';
import { 
    initSidebarDragAndDrop, 
    initMarqueeSelection, 
    initCanvasEvents,
    toggleSelectMode, 
    toggleWireMode,
    selectAllComponents, 
    adjustSensorValue, 
    adjustFlasherSpeed, 
    togglePushButtonLock, 
    rotateComponent, 
    mirrorSelected
} from './canvas/CanvasInteractions.js';

// =========================================================
// 2. JEMBATAN KE HTML (Mempertahankan atribut onclick="")
// =========================================================
window.startSim = () => {
    AudioManager.init();
    AudioManager.resume();
    startSim(); 
};

window.pauseSim = () => {
    AudioManager.suspend();
    AudioManager.killAllVoices(); // 🟢 Tembak mati suara
    pauseSim();
};

window.stopSim = () => {
    AudioManager.suspend();
    AudioManager.killAllVoices(); // 🟢 Tembak mati suara
    stopSim();
};
window.clearCanvas = clearCanvas;
window.clearAllWires = clearAllWires;
window.copySelection = copySelection;
window.pasteClipboard = pasteClipboard;
window.setWireColor = (colorHex) => {
    if (window.activeWireForColor) {
        const conn = CircuitStore.connections.find(c => c.id === window.activeWireForColor);
        if (conn) {
            conn.color = colorHex; // 💾 Simpan warna ke memori kabel
            updateWireStates();    // 🎨 Terapkan langsung ke layar
        }
    }
    document.getElementById('wireColorPalette').style.display = 'none';
};

// Auto-tutup palet jika pengguna mengklik area kosong di kanvas
document.addEventListener('click', () => {
    const palette = document.getElementById('wireColorPalette');
    if (palette && palette.style.display === 'flex') {
        palette.style.display = 'none';
    }
});
window.toggleSelectMode = toggleSelectMode;
window.toggleWireMode = toggleWireMode;
window.selectAllComponents = selectAllComponents;
window.adjustSensorValue = adjustSensorValue;
window.adjustFlasherSpeed = adjustFlasherSpeed;
window.togglePushButtonLock = togglePushButtonLock;
window.rotateComponent = rotateComponent;
window.mirrorSelected = mirrorSelected;
window.splitWireToNode = splitWireToNode;
window.optimizedDrawConnections = optimizedDrawConnections;
window.updateWireStates = updateWireStates;

// Jembatan untuk UIManager dan HistoryManager
window.UIManager = UIManager;
window.showTruthTable = () => UIManager.showTruthTable();
window.closeTruthTable = () => UIManager.closeTruthTable();
window.changeZoom = (delta) => UIManager.changeZoom(delta);
window.setZoom = (val) => UIManager.setZoom(val);
window.toggleTheme = () => UIManager.toggleTheme();
window.openValueModal = (id, type, subType) => UIManager.openValueModal(id, type, subType);
window.closeValueModal = () => UIManager.closeValueModal();
window.saveComponentValue = () => UIManager.saveComponentValue();
window.setPresetValue = (val, multi) => UIManager.setPresetValue(val, multi);
window.toggleAnimations = () => {
    // 1. Inisialisasi jika belum ada
    if (CircuitStore.wireVisualMode === undefined) CircuitStore.wireVisualMode = 2;
    
    // 2. Siklus mundur: 2 (Penuh) -> 1 (Warna) -> 0 (Polos) -> kembali ke 2
    CircuitStore.wireVisualMode--;
    if (CircuitStore.wireVisualMode < 0) CircuitStore.wireVisualMode = 2;
    
    // 3. Ubah warna tombol dan notifikasi sesuai mode
    const btn = document.getElementById('btnToggleAnim');
    if (btn) {
        if (CircuitStore.wireVisualMode === 2) {
            btn.style.color = '#fbbf24'; // Kuning
            btn.title = 'Mode Visual: Penuh (Animasi & Warna)';
            UIManager.showToast('⚡ Visual Kabel: PENUH (Animasi + Warna)');
        } 
        else if (CircuitStore.wireVisualMode === 1) {
            btn.style.color = '#10b981'; // Hijau
            btn.title = 'Mode Visual: Warna Saja';
            UIManager.showToast('🎨 Visual Kabel: WARNA SAJA');
        } 
        else {
            btn.style.color = 'var(--text-muted)'; // Abu-abu
            btn.title = 'Mode Visual: Polos (Hemat Baterai)';
            UIManager.showToast('🔌 Visual Kabel: POLOS (Performa Maksimal)');
        }
    }
    
    // 4. Update layar seketika
    updateWireStates();
};
window.undo = () => HistoryManager.undo();
window.redo = () => HistoryManager.redo();
window.exportCircuit = () => HistoryManager.exportCircuit();
window.importCircuit = () => HistoryManager.importCircuit();
window.handleFileImport = (e) => HistoryManager.handleFileImport(e);

// =========================================================
// 3. FUNGSI INISIALISASI UTAMA
// =========================================================
function init() {
    UIManager.initTheme(); 

    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        wrapper.scrollLeft = 1500 - (wrapper.clientWidth / 2);
        wrapper.scrollTop = 1500 - (wrapper.clientHeight / 2);
    }

    // Aktifkan semua modul yang sudah kita pecah
    initSmartCanvasNavigation();
    initContextMenu(); 
    initGlobalMouseTracker();
    setupKeyboardShortcuts();
    initSidebarDragAndDrop();
    initMarqueeSelection();
    initCanvasEvents();
    initComponentSensors(); 

    const loaded = HistoryManager.loadAutoSave();
    
    if (!loaded) {
        setTimeout(() => {
            if (CircuitStore.components.length > 0) return;

            const cx = 1500 - 200; const cy = 1500 - 100;

            createComponent('switch', cx + 50, cy + 100, 0, 1);
            createComponent('switch', cx + 50, cy + 200, 0, 1);
            createComponent('and', cx + 200, cy + 150, 2, 1);
            createComponent('led', cx + 350, cy + 160, 1, 1);

            requestAnimationFrame(() => {
                createConnection(1, 0, 3, 0);
                createConnection(2, 0, 3, 1);
                createConnection(3, 0, 4, 0);
                drawConnections(); 
                updateConnectionPointVisuals();
                CircuitStore.undoStack = []; 
                CircuitStore.redoStack = []; 
                HistoryManager.updateUndoRedoButtons();
            });
        }, 300);
    }

    CircuitStore.hasUnsavedChanges = false;

    // Kunci Posisi Kanvas saat Layar/Sidebar Berubah Ukuran
    let lastWrapperWidth = wrapper.clientWidth;
    let lastWrapperHeight = wrapper.clientHeight;

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const newWidth = entry.contentRect.width;
            const newHeight = entry.contentRect.height;
            const dx = (lastWrapperWidth - newWidth) / 2;
            const dy = (lastWrapperHeight - newHeight) / 2;
            wrapper.scrollLeft += dx;
            wrapper.scrollTop += dy;
            lastWrapperWidth = newWidth;
            lastWrapperHeight = newHeight;
        }
    });
    if (wrapper) resizeObserver.observe(wrapper);
}

// =========================================================
// 4. EVENT LISTENER SAAT HALAMAN DIMUAT (UI DOM)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    init();
    updateSimControlsUI('STOP');

    // --- Logika Menghidupkan Laci Mobile (Bottom Sheet) ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapseSidebarBtn');

    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    const toggleMobileMenu = () => {
        if (sidebar) sidebar.classList.toggle('open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('open');
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMobileMenu);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleMobileMenu);

    // --- FUNGSI GLOBAL TOOLTIP ANTI-POTONG ---
    const tooltip = document.getElementById('globalTooltip');
    if (tooltip) {
        document.querySelectorAll('.component-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (sidebar && sidebar.classList.contains('collapsed')) {
                    const compName = card.querySelector('.comp-name').innerText;
                    tooltip.textContent = compName;
                    const rect = card.getBoundingClientRect();
                    tooltip.style.left = (rect.right + 15) + 'px';
                    tooltip.style.top = (rect.top + (rect.height / 2)) + 'px';
                    tooltip.classList.add('show');
                }
            });
            card.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
        });
    }

    // --- JEBAKAN KELUAR APLIKASI (PWA EXIT TRAP) ---
    history.pushState({ page: 'simulator' }, '', window.location.href);
    window.addEventListener('popstate', (e) => {
        history.pushState({ page: 'simulator' }, '', window.location.href);
        window.showExitPrompt();
    });
    
    window.addEventListener('beforeunload', (e) => {
        if (CircuitStore.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = ''; 
        }
    });

    window.resetView = function() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        // Kembalikan ke titik koordinat tengah (1500) dikurangi setengah ukuran layar
        wrapper.scrollLeft = 1500 - (wrapper.clientWidth / 2);
        wrapper.scrollTop = 1500 - (wrapper.clientHeight / 2);
        
        // Kembalikan zoom ke 100%
        if (typeof UIManager !== 'undefined') {
            UIManager.setZoom(1); 
            document.getElementById('zoomSlider').value = 1;
            document.getElementById('zoomLabel').innerText = '100%';
        }
    }
};
    window.toggleFullscreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Gagal mengaktifkan fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

    window.showExitPrompt = () => {
        const modal = document.getElementById('exitModal');
        const saveBtn = document.getElementById('exitSaveBtn');
        const msg = document.getElementById('exitMessage');
        
        if (CircuitStore.hasUnsavedChanges) {
            msg.textContent = "Rangkaian belum tersimpan! Apakah Anda ingin menyimpan sebelum keluar?";
            saveBtn.style.display = 'flex'; 
        } else {
            msg.textContent = "Apakah Anda yakin ingin keluar dari aplikasi?";
            saveBtn.style.display = 'none'; 
        }
        if(modal) modal.classList.add('show');
    };

    window.closeExitModal = () => document.getElementById('exitModal').classList.remove('show');

    window.confirmExit = () => {
        CircuitStore.hasUnsavedChanges = false; 
        window.onbeforeunload = null;           
        if (typeof SimulationEngine !== 'undefined') SimulationEngine.stop();
        window.close();
        
        setTimeout(() => {
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:var(--bg-body); color:var(--text-main); text-align:center; padding:20px;">
                    <h2 style="margin-bottom:12px; font-size:24px;">Aman untuk Keluar</h2>
                    <p style="color:var(--text-muted); font-size:14px; max-width:300px;">
                        Simulator telah dihentikan dan daya telah diputus.<br><br>
                        Silakan tutup aplikasi ini.
                    </p>
                    <button onclick="window.location.reload()" style="margin-top:32px; padding:12px 24px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">
                        Buka Kembali Simulator
                    </button>
                </div>
            `;
        }, 100);
    };

    // --- FITUR PENCARIAN & FILTER KATEGORI KOMPONEN ---
    const searchInput = document.getElementById('componentSearch');
    const clearBtn = document.getElementById('clearSearchBtn');
    const filterBtn = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterActiveDot = document.getElementById('filterActiveDot');
    const radioFilters = document.querySelectorAll('input[name="catFilter"]');
    const sidebarSections = document.querySelectorAll('.sidebar-section');

    if (searchInput && clearBtn && filterBtn) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const isHidden = filterDropdown.style.display === 'none';
            filterDropdown.style.display = isHidden ? 'block' : 'none';
            filterBtn.style.color = isHidden ? 'var(--primary)' : 'var(--text-muted)';
        });

        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && e.target !== filterBtn) {
                filterDropdown.style.display = 'none';
                if(filterActiveDot.style.display === 'none') filterBtn.style.color = 'var(--text-muted)';
            }
        });

        const applyFilters = () => {
            const term = searchInput.value.toLowerCase();
            const activeCategory = document.querySelector('input[name="catFilter"]:checked').value;
            
            clearBtn.style.display = term.length > 0 ? 'block' : 'none';
            filterActiveDot.style.display = activeCategory !== 'all' ? 'block' : 'none';

            sidebarSections.forEach(section => {
                const sectionTitle = section.querySelector('h4').textContent.toLowerCase();
                let sectionMatchesCategory = false;

                if (activeCategory === 'all') sectionMatchesCategory = true;
                else if (activeCategory === 'digital' && (sectionTitle.includes('digital') || sectionTitle.includes('gerbang'))) sectionMatchesCategory = true;
                else if (activeCategory === 'analog' && (sectionTitle.includes('daya') || sectionTitle.includes('sensor') || sectionTitle.includes('aktuator') || sectionTitle.includes('kabel') || sectionTitle.includes('semikonduktor'))) sectionMatchesCategory = true;
                else if (activeCategory === 'alat' && sectionTitle.includes('alat')) sectionMatchesCategory = true;

                let hasVisibleCard = false;
                const cards = section.querySelectorAll('.component-card');
                
                cards.forEach(card => {
                    const name = card.querySelector('.comp-name').textContent.toLowerCase();
                    const desc = card.querySelector('.comp-desc').textContent.toLowerCase();
                    
                    if (sectionMatchesCategory && (name.includes(term) || desc.includes(term))) {
                        card.style.display = 'flex';
                        hasVisibleCard = true;
                    } else {
                        card.style.display = 'none';
                    }
                });
                section.style.display = hasVisibleCard ? 'block' : 'none';
            });
        };

        searchInput.addEventListener('input', applyFilters); 
        clearBtn.addEventListener('click', () => { searchInput.value = ''; applyFilters(); searchInput.focus(); });
        radioFilters.forEach(radio => { radio.addEventListener('change', () => { applyFilters(); filterDropdown.style.display = 'none'; }); });
    }
});

// --- FITUR DRAG SERIAL MONITOR (FLOATING WINDOW) ---
    const floatWin = document.getElementById('serialMonitorModal');
    const header = document.getElementById('serialMonitorHeader');
    
    if (floatWin && header) {
        let isDraggingWin = false;
        let offsetX = 0, offsetY = 0;

        // Saat header diklik (Mouse)
        header.addEventListener('mousedown', (e) => {
            isDraggingWin = true;
            const rect = floatWin.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });

        // Saat digeser
        document.addEventListener('mousemove', (e) => {
            if (!isDraggingWin) return;
            e.preventDefault();
            
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            // Batasi agar jendela tidak ditarik keluar dari layar
            const maxX = window.innerWidth - floatWin.offsetWidth;
            const maxY = window.innerHeight - floatWin.offsetHeight;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            // Terapkan posisi baru
            floatWin.style.left = newX + 'px';
            floatWin.style.top = newY + 'px';
            floatWin.style.bottom = 'auto'; // Reset patokan awal CSS
            floatWin.style.right = 'auto';
        });

        // Saat dilepas
        document.addEventListener('mouseup', () => {
            isDraggingWin = false;
        });

        // --- Dukungan untuk Layar Sentuh (HP/Tablet) ---
        header.addEventListener('touchstart', (e) => {
            isDraggingWin = true;
            const rect = floatWin.getBoundingClientRect();
            offsetX = e.touches[0].clientX - rect.left;
            offsetY = e.touches[0].clientY - rect.top;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDraggingWin) return;
            let newX = e.touches[0].clientX - offsetX;
            let newY = e.touches[0].clientY - offsetY;
            
            floatWin.style.left = newX + 'px';
            floatWin.style.top = newY + 'px';
            floatWin.style.bottom = 'auto';
            floatWin.style.right = 'auto';
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            isDraggingWin = false;
        });
    }

    // ========================================================
        // FITUR RESIZE JENDELA (CUBIT 2 JARI & TARIK POJOK 1 JARI)
        // ========================================================
        const resizeHandle = document.getElementById('smResizeHandle');
        let isResizing = false;
        let initialWinWidth = 0;
        let initialWinHeight = 0;
        
        // --- METODE 1: Tarik Pojok Pakai 1 Jari (Sangat Lancar di HP) ---
        if (resizeHandle) {
            let startTouchX = 0, startTouchY = 0;

            // Untuk Sentuhan Layar HP
            resizeHandle.addEventListener('touchstart', (e) => {
                isResizing = true;
                e.preventDefault();
                e.stopPropagation(); // Cegah event bocor
                const rect = floatWin.getBoundingClientRect();
                initialWinWidth = rect.width;
                initialWinHeight = rect.height;
                startTouchX = e.touches[0].clientX;
                startTouchY = e.touches[0].clientY;
            }, { passive: false });

            document.addEventListener('touchmove', (e) => {
                if (!isResizing) return;
                e.preventDefault();
                
                let newWidth = initialWinWidth + (e.touches[0].clientX - startTouchX);
                let newHeight = initialWinHeight + (e.touches[0].clientY - startTouchY);
                
                // Batasi agar tidak melampaui layar HP
                newWidth = Math.max(250, Math.min(newWidth, window.innerWidth * 0.95));
                newHeight = Math.max(150, Math.min(newHeight, window.innerHeight * 0.9));
                
                floatWin.style.width = newWidth + 'px';
                floatWin.style.height = newHeight + 'px';
            }, { passive: false });

            document.addEventListener('touchend', () => { isResizing = false; });
            
            // Untuk Mouse PC (sebagai pengaman tambahan)
            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                e.preventDefault(); e.stopPropagation();
                const rect = floatWin.getBoundingClientRect();
                initialWinWidth = rect.width;
                initialWinHeight = rect.height;
                startTouchX = e.clientX;
                startTouchY = e.clientY;
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing || e.touches) return;
                let newWidth = initialWinWidth + (e.clientX - startTouchX);
                let newHeight = initialWinHeight + (e.clientY - startTouchY);
                floatWin.style.width = Math.max(250, newWidth) + 'px';
                floatWin.style.height = Math.max(150, newHeight) + 'px';
            });

            document.addEventListener('mouseup', () => { isResizing = false; });
        }

        // --- METODE 2: Cubit 2 Jari (Pinch to Zoom) ---
        let initialPinchDist = null;
        floatWin.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                isDraggingWin = false; 
                e.stopPropagation(); // 🌟 KUNCI: Cegah Canvas mencuri event cubitan!
                
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDist = Math.hypot(dx, dy);
                
                const rect = floatWin.getBoundingClientRect();
                initialWinWidth = rect.width;
                initialWinHeight = rect.height;
            }
        }, { passive: false });

        floatWin.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialPinchDist) {
                e.preventDefault(); 
                e.stopPropagation(); // 🌟 KUNCI: Cegah Canvas men-zoom layar!
                
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDist = Math.hypot(dx, dy);
                const scale = currentDist / initialPinchDist;
                
                let newWidth = Math.max(250, Math.min(initialWinWidth * scale, window.innerWidth * 0.95));
                let newHeight = Math.max(150, Math.min(initialWinHeight * scale, window.innerHeight * 0.9));
                
                floatWin.style.width = newWidth + 'px';
                floatWin.style.height = newHeight + 'px';
            }
        }, { passive: false });

        floatWin.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) initialPinchDist = null;
        });
        
// =========================================================
// FITUR GESER TOOLBAR (MOUSE DRAG & MOUSE WHEEL)
// =========================================================
const toolbar = document.querySelector('.toolbar');
let isDown = false;
let startX;
let scrollLeft;

if (toolbar) {
    // 1. Scroll menggunakan Roll Mouse (Mouse Wheel)
   toolbar.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault(); 
                
                // Tambahkan pengali desimal di sini (contoh: 0.3)
                // Semakin kecil angkanya (misal 0.1), akan semakin lambat.
                // Semakin besar (misal 0.8), akan semakin cepat.
                toolbar.scrollLeft += (e.deltaY * 0.2); 
            }
        }, { passive: false }); // 'passive: false' wajib agar preventDefault() berfungsi

    // 2. Scroll menggunakan Klik Kiri & Geser (Mouse Drag)
    toolbar.addEventListener('mousedown', (e) => {
        // Jangan aktifkan drag jika yang diklik adalah tombol/input
        if (e.target.closest('button, input')) return; 
        
        isDown = true;
        toolbar.classList.add('is-dragging');
        startX = e.pageX - toolbar.offsetLeft;
        scrollLeft = toolbar.scrollLeft;
    });

    toolbar.addEventListener('mouseleave', () => {
        isDown = false;
        toolbar.classList.remove('is-dragging');
    });

    toolbar.addEventListener('mouseup', () => {
        isDown = false;
        toolbar.classList.remove('is-dragging');
    });

    toolbar.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); // Mencegah blok teks terpilih secara tidak sengaja
        const x = e.pageX - toolbar.offsetLeft;
        const walk = (x - startX) * 1.5; // Angka 1.5 adalah kecepatan sensitivitas geser
        toolbar.scrollLeft = scrollLeft - walk;
    });
}

// FITUR TOGGLE GRID KANVAS
window.toggleGrid = function() {
    const canvas = document.getElementById('canvas');
    if (canvas) {
        // Class 'no-grid' akan ditambahkan jika belum ada, atau dihapus jika sudah ada
        canvas.classList.toggle('no-grid');
    }
};

// =========================================================
// 8. BIND UI EVENTS FROM HTML (Refactored from inline onclick)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el && typeof fn === 'function') el.addEventListener('click', fn);
    };

    // Toolbar Simulasi
    bindClick('btnPlay', window.startSim);
    bindClick('btnPause', window.pauseSim);
    bindClick('btnStop', window.stopSim);
    bindClick('btnTruthTable', window.showTruthTable);
    bindClick('btnSerialMonitor', () => window.UIManager && window.UIManager.openSerialMonitor());
    bindClick('btnCloseSerialMonitor', () => window.UIManager && window.UIManager.closeSerialMonitor());
    bindClick('btnClearSerialMonitor', () => window.UIManager && window.UIManager.clearSerialMonitor());
    bindClick('btnCloseValueModal', () => window.closeValueModal && window.closeValueModal());
    bindClick('btnCancelValueModal', () => window.closeValueModal && window.closeValueModal());
    bindClick('btnExitSave', () => { if(window.exportCircuit) window.exportCircuit(); if(window.closeExitModal) window.closeExitModal(); });
    bindClick('btnExitConfirm', () => window.confirmExit && window.confirmExit());
    bindClick('btnExitCancel', () => window.closeExitModal && window.closeExitModal());
    bindClick('btnWireModeTop', window.toggleWireMode);
    bindClick('btnWireModeBottom', window.toggleWireMode);

    // File & History
    bindClick('btnExport', window.exportCircuit);
    bindClick('btnImport', window.importCircuit);
    bindClick('btnUndo', window.undo);
    bindClick('btnRedo', window.redo);

    // Selection, Clipboard & Hapus
    bindClick('btnSelectMode', window.toggleSelectMode);
    bindClick('btnSelectAll', window.selectAllComponents);
    bindClick('btnCopy', window.copySelection);
    bindClick('btnPaste', window.pasteClipboard);
    bindClick('btnDelete', window.deleteSelected);
    bindClick('btnDeleteBottom', window.deleteSelected);

    // Transformasi
    bindClick('btnRotateLeft', () => window.rotateSelected && window.rotateSelected(-90));
    bindClick('btnRotateRight', () => window.rotateSelected && window.rotateSelected(90));
    bindClick('btnRotate180', () => window.rotateSelected && window.rotateSelected(180));
    bindClick('btnMirrorX', () => window.mirrorSelected && window.mirrorSelected('X'));
    bindClick('btnMirrorY', () => window.mirrorSelected && window.mirrorSelected('Y'));

    // Aksi Massal
    bindClick('btnClearWires', window.clearAllWires);
    bindClick('btnClearCanvas', window.clearCanvas);

    // Kontrol Viewport & Tema
    bindClick('btnResetView', window.resetView);
    bindClick('btnZoomOut', () => window.changeZoom && window.changeZoom(-0.1));
    bindClick('btnZoomIn', () => window.changeZoom && window.changeZoom(0.1));
    bindClick('btnToggleGrid', window.toggleGrid);
    bindClick('btnToggleFullscreen', window.toggleFullscreen);
    bindClick('btnToggleAnim', window.toggleAnimations);
    bindClick('btnTheme', window.toggleTheme);

    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            if (window.setZoom) window.setZoom(e.target.value);
        });
    }
});

// =========================================================
  // FITUR RESIZE PANEL KANAN (VALUE MODAL) DENGAN DRAG HANDLE
  // =========================================================
  document.addEventListener('DOMContentLoaded', () => {
    const dragHandle = document.getElementById('modalDragHandle');
    const modalContent = document.getElementById('valueModalContent');
    
    if (dragHandle && modalContent) {
      let isDragging = false;
      let startX = 0;
      let startWidth = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        startWidth = modalContent.getBoundingClientRect().width;
        
        // Matikan blok pemilihan teks saat ditarik
        document.body.style.userSelect = 'none';
        
        // Ubah warna saat ditahan
        dragHandle.style.background = 'rgba(255,255,255,0.1)';
        dragHandle.style.cursor = 'ew-resize';
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        
        // Karena ditarik ke kiri (sumbu X mengecil) berarti lebarnya BERTAMBAH
        const dx = startX - currentX; 
        let newWidth = startWidth + dx;

        // Batas minimal dan maksimal
        if (newWidth < 340) newWidth = 340;
        if (newWidth > window.innerWidth * 0.95) newWidth = window.innerWidth * 0.95;
        
        modalContent.style.width = `${newWidth}px`;
      };

      const onPointerUp = () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.userSelect = '';
          dragHandle.style.background = 'rgba(255,255,255,0.02)';
        }
      };

      dragHandle.addEventListener('mousedown', onPointerDown);
      dragHandle.addEventListener('touchstart', onPointerDown, {passive: true});

      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('touchmove', (e) => {
        if(isDragging) e.preventDefault(); // Cegah scroll saat menarik panel di HP
        onPointerMove(e);
      }, {passive: false});

      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchend', onPointerUp);
    }
  });

// =========================================================================
// FITUR "TEKAN LAMA" (LONG PRESS) UNTUK MELIHAT NAMA TOMBOL DI HP
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Buat elemen kotak nama (tooltip) melayang khusus HP
    const mobileTooltip = document.createElement('div');
    mobileTooltip.style.cssText = `
        position: fixed;
        background: #1e293b;
        color: #38bdf8;
        padding: 6px 12px;
        border: 1px solid #334155;
        border-radius: 6px;
        font-size: 12px;
        font-weight: bold;
        z-index: 999999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        white-space: nowrap;
        top: -999px; /* Sembunyikan di luar layar saat awal */
    `;
    document.body.appendChild(mobileTooltip);

    let pressTimer = null;

    // 2. Cari semua tombol di menu atas dan menu bawah yang punya atribut "title"
    const menuButtons = document.querySelectorAll('.toolbar button[title], .bottom-nav-bar button[title]');
    
    menuButtons.forEach(btn => {
        // Matikan efek menu pop-up bawaan browser HP (seperti menu "Copy/Share")
        btn.style.userSelect = 'none';
        btn.style.webkitTouchCallout = 'none';

        // Fungsi menyembunyikan nama
        const hideTooltip = () => {
            clearTimeout(pressTimer);
            mobileTooltip.style.opacity = '0';
            setTimeout(() => { mobileTooltip.style.top = '-999px'; }, 200); 
        };

        // Saat jari menempel pada layar
        btn.addEventListener('touchstart', (e) => {
            const titleText = btn.getAttribute('title');
            if (!titleText) return;

            // Jika jari ditahan selama setengah detik (500ms)
            pressTimer = setTimeout(() => {
                mobileTooltip.textContent = titleText;
                
                // Kalkulasi letak posisi (tengah-tengah tombol)
                const rect = btn.getBoundingClientRect();
                const isBottomBar = rect.top > (window.innerHeight / 2); // Cek letak tombol
                
                if (isBottomBar) {
                    // Jika tombol bawah, munculkan di atas jari
                    mobileTooltip.style.top = (rect.top - 40) + 'px'; 
                } else {
                    // Jika tombol atas, munculkan di bawah jari
                    mobileTooltip.style.top = (rect.bottom + 10) + 'px'; 
                }
                
                mobileTooltip.style.left = (rect.left + (rect.width / 2)) + 'px';
                mobileTooltip.style.transform = 'translateX(-50%)';
                
                // Tampilkan!
                mobileTooltip.style.opacity = '1';
                
                // (Bonus) Beri efek getar kecil di HP sebagai pertanda berhasil muncul
                if (navigator.vibrate) navigator.vibrate(40);
                
            }, 500); // 500 = Waktu tahan (milidetik)
        }, { passive: true });

        // Saat jari dilepas, tergeser, atau batal sentuh
        btn.addEventListener('touchend', hideTooltip);
        btn.addEventListener('touchmove', hideTooltip);
        btn.addEventListener('touchcancel', hideTooltip);
    });
});
