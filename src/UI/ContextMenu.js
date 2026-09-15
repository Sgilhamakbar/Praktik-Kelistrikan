// File: src/ui/ContextMenu.js

// 1. IMPOR KETERGANTUNGAN
import { CircuitStore } from '../state/CircuitStore.js';
import { UIManager } from '../UI/UIManager.js';
import { copySelection, pasteClipboard } from '../managers/ClipboardManager.js';
import { deleteSelectedComponents } from '../canvas/CanvasInteractions.js';

// 2. EKSPOR FUNGSI
export function initContextMenu() {
  const menu = document.createElement('div');
  menu.id = 'custom-context-menu';
  Object.assign(menu.style, {
    position: 'fixed', display: 'none', backgroundColor: '#1e293b', color: '#f8fafc',
    border: '1px solid #475569', borderRadius: '6px', padding: '5px 0',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', zIndex: '10000',
    minWidth: '160px', fontFamily: 'sans-serif', fontSize: '14px',
    userSelect: 'none'
  });

  const createMenuItem = (text, icon, onClick) => {
    const item = document.createElement('div');
    item.innerHTML = `<span style="margin-right:8px;">${icon}</span> ${text}`;
    Object.assign(item.style, { padding: '10px 15px', cursor: 'pointer', transition: 'background 0.2s' });
    item.onmouseover = () => item.style.backgroundColor = '#334155';
    item.onmouseout = () => item.style.backgroundColor = 'transparent';
    item.onclick = (e) => { 
        e.stopPropagation(); 
        onClick(); 
        menu.style.display = 'none'; 
    };
    return item;
  };

  menu.appendChild(createMenuItem('Salin (Copy)', '📋', () => copySelection()));
  menu.appendChild(createMenuItem('Tempel (Paste)', '📌', () => pasteClipboard()));
  
  const delBtn = createMenuItem('Hapus (Delete)', '🗑️', () => {
    if (CircuitStore.selectedComponents.length > 0) deleteSelectedComponents();
  });
  delBtn.style.color = '#f87171'; 
  menu.appendChild(delBtn);
  document.body.appendChild(menu);

  const canvasWrapper = document.getElementById('canvas-wrapper');
  if (!canvasWrapper) return;
  let rightClickStartX = 0, rightClickStartY = 0;

  canvasWrapper.addEventListener('mousedown', (e) => {
    if (e.button === 2) { 
      rightClickStartX = e.clientX;
      rightClickStartY = e.clientY;
    }
  });

  canvasWrapper.addEventListener('contextmenu', (e) => {
    e.preventDefault(); 
    if (CircuitStore.connectionStart) {
      if (CircuitStore.tempWaypoints && CircuitStore.tempWaypoints.length > 0) {
          CircuitStore.tempWaypoints.pop(); 
          window.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY }));
          return; 
      }
      CircuitStore.connectionStart = null;
      CircuitStore.tempWaypoints = []; 
      let tw = document.getElementById('temp-wire-path'); 
      if (tw) tw.remove(); 
      document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
      UIManager.showToast('Koneksi dibatalkan');
      menu.style.display = 'none'; 
      return; 
    }

    const dist = Math.hypot(e.clientX - rightClickStartX, e.clientY - rightClickStartY);
    if (dist > 5) {
      menu.style.display = 'none'; 
      return;
    }

    const comp = e.target.closest('[id^="comp-"]');
    if (comp) {
        const compId = comp.id.split('-')[1];
        const compType = comp.dataset.type;
        const subType = comp.dataset.subType || '';
        const ignoredTypes = ['switch', 'push_button', 'push_button_nc', 'switch_spst', 'switch_spdt', 'voltmeter', 'voltmeter_ac', 'ammeter', 'ohmmeter', 'logic_probe', 'oscilloscope'];

        if (!ignoredTypes.includes(compType)) {
            UIManager.openValueModal(compId, compType, subType);
            menu.style.display = 'none'; 
            return; 
        }
    }

    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height) + 'px';
  });

  window.addEventListener('click', (e) => {
    if (e.button !== 2) menu.style.display = 'none';
  });
}