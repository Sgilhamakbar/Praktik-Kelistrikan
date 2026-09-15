// File: src/canvas/CanvasNavigation.js

// 1. IMPOR KETERGANTUNGAN
import { UIManager } from '../UI/UIManager.js';

// Variabel state lokal (Aman ditaruh di sini karena terisolasi di dalam modul)
let initialPinchDistance = null;
let initialZoomState = 1;
let initialPinchMidX = 0, initialPinchMidY = 0;
let initialCanvasX = 0, initialCanvasY = 0;
let lastTapTime = 0;
let wasMultiTouch = false;

let isPanning = false;
let startPanX = 0, startPanY = 0;
let wrapperStartX = 0, wrapperStartY = 0;

// 2. EKSPOR FUNGSI UTAMA
export function initSmartCanvasNavigation() {
  const canvasWrapper = document.getElementById('canvas-wrapper');
  if (!canvasWrapper) return;

  // ==========================================
  // A. KENDALI LAYAR SENTUH (HP / Tablet)
  // ==========================================
  canvasWrapper.addEventListener('touchstart', (e) => {
    // 1. Logika Geser Kanvas (Pan) dengan 1 Jari di area kosong
    if (e.touches.length === 1) {
      const targetId = e.target.id;
      // Hanya aktif jika jari menyentuh kanvas kosong (bukan komponen)
      if (targetId === 'canvas' || targetId === 'wire-overlay' || targetId === 'wire-svg') {
        isPanning = true;
        startPanX = e.touches[0].clientX;
        startPanY = e.touches[0].clientY;
        wrapperStartX = canvasWrapper.scrollLeft;
        wrapperStartY = canvasWrapper.scrollTop;
      }
    }
    // 2. Logika Cubit untuk Zoom (Pinch-to-Zoom) dengan 2 Jari
    else if (e.touches.length > 1) {
      isPanning = false; 
      wasMultiTouch = true;
      if (e.touches.length === 2) {
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoomState = UIManager.currentZoom;
        
        // 🟢 FIX JITTER: Kunci titik koordinat awal di milidetik pertama Anda menyentuh
        initialPinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        initialPinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const rect = canvasWrapper.getBoundingClientRect();
        initialCanvasX = (canvasWrapper.scrollLeft + initialPinchMidX - rect.left) / initialZoomState;
        initialCanvasY = (canvasWrapper.scrollTop + initialPinchMidY - rect.top) / initialZoomState;
      }
    }
  }, { passive: true }); // LIGTHOUSE: Diubah menjadi 'true' karena tidak ada preventDefault di sini!

canvasWrapper.addEventListener('touchmove', (e) => {
    // 1. Eksekusi Geser Kanvas (Pan) dengan 1 jari
    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - startPanX;
      const dy = e.touches[0].clientY - startPanY;
      canvasWrapper.scrollLeft = wrapperStartX - dx;
      canvasWrapper.scrollTop = wrapperStartY - dy;
    }
    // 2. Eksekusi Zoom dengan 2 jari
    else if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault(); 
      
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const scale = currentDistance / initialPinchDistance;
      const zoomSpeed = 0.5; 
      let newZoom = initialZoomState + ((scale - 1) * initialZoomState * zoomSpeed);
      
      // Batasi zoom maksimal dan minimal
      newZoom = Math.max(0.5, Math.min(newZoom, 2.0));

      const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      // 🟢 FIX JITTER: Jangan gunakan UIManager.setZoom berulang-ulang agar tidak tabrakan
      UIManager.currentZoom = newZoom;
      const canvas = document.getElementById('canvas');
      const rect = canvasWrapper.getBoundingClientRect();

      canvas.style.transform = `scale(${newZoom})`;
      canvas.style.transformOrigin = '0 0';

      // Pastikan ruang scroll ikut membesar di HP
      let spacer = document.getElementById('canvas-spacer');
      if (!spacer) {
          spacer = document.createElement('div');
          spacer.id = 'canvas-spacer';
          spacer.style.position = 'absolute';
          spacer.style.top = '0'; spacer.style.left = '0';
          spacer.style.pointerEvents = 'none'; spacer.style.visibility = 'hidden';
          canvasWrapper.appendChild(spacer);
      }
      spacer.style.width = (3000 * newZoom) + 'px';
      spacer.style.height = (3000 * newZoom) + 'px';

      // Sinkronkan UI
      const zoomLabel = document.getElementById('zoomLabel');
      if (zoomLabel) zoomLabel.innerText = Math.round(newZoom * 100) + '%';
      const zoomSlider = document.getElementById('zoomSlider');
      if (zoomSlider) zoomSlider.value = newZoom;

      // Geser layar dengan stabil berdasarkan kunci koordinat yang ditangkap di touchstart
      canvasWrapper.scrollLeft = (initialCanvasX * newZoom) - (currentMidX - rect.left);
      canvasWrapper.scrollTop  = (initialCanvasY * newZoom) - (currentMidY - rect.top);
    }
  }, { passive: false });

canvasWrapper.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialPinchDistance = null;
    }

    if (e.touches.length === 0) {
      // 🟢 FIX UTAMA: Matikan status menggeser saat jari diangkat dari layar
      isPanning = false; 

      if (wasMultiTouch) {
        wasMultiTouch = false;
        return;
      }
    }
  });

  // TAMBAHAN: Jaga-jaga jika sistem HP membatalkan sentuhan secara paksa
  canvasWrapper.addEventListener('touchcancel', (e) => {
    isPanning = false;
    initialPinchDistance = null;
    wasMultiTouch = false;
  });

  // ==========================================
  // B. KENDALI MOUSE (Laptop / Desktop)
  // ==========================================
  
// MOUSE WHEEL ZOOM (Laptop/Desktop)
  canvasWrapper.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      // --- PERBAIKAN: Ubah 0.05 menjadi 0.02 agar scroll mouse lebih lambat & halus ---
      const delta = e.deltaY < 0 ? 0.02 : -0.02; 
      let newZoom = UIManager.currentZoom + delta;
      
      UIManager.setZoom(newZoom, e.clientX, e.clientY);
    }
  }, { passive: false });

  // 2. Klik Kanan atau Klik Tengah ditahan untuk Geser Kanvas (Pan)
  canvasWrapper.addEventListener('mousedown', (e) => {
    // e.button === 1 (Klik Tengah Wheel), e.button === 2 (Klik Kanan)
    if ((e.button === 1 || e.button === 2) && 
        (e.target.id === 'canvas' || e.target.id === 'wire-overlay' || e.target.id === 'wire-svg')) {
      e.preventDefault();
      isPanning = true;
      startPanX = e.clientX;
      startPanY = e.clientY;
      wrapperStartX = canvasWrapper.scrollLeft;
      wrapperStartY = canvasWrapper.scrollTop;
      
      // 🌟 PERBAIKAN: Tambahkan class is-panning ke canvas
      document.getElementById('canvas').classList.add('is-panning');
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      e.preventDefault();
      const dx = e.clientX - startPanX;
      const dy = e.clientY - startPanY;
      canvasWrapper.scrollLeft = wrapperStartX - dx;
      canvasWrapper.scrollTop = wrapperStartY - dy;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      // 🌟 PERBAIKAN: Hapus class is-panning agar kembali ke kursor grab
      const canvasEl = document.getElementById('canvas');
      if (canvasEl) canvasEl.classList.remove('is-panning');
    }
  });
}