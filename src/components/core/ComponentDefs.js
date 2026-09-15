// File: src/components/core/ComponentDefs.js

import { CircuitStore } from '../../state/CircuitStore.js';
import { UIRegistry } from './UIRegistry.js';
import { BaseUIComponent } from './BaseUIComponent.js';

export const ComponentDefs = {
    getDimensions(type) {
        // Ambil kelas spesifik (jika sudah didaftarkan), atau gunakan BaseUIComponent
        const UIClass = UIRegistry[type] || BaseUIComponent;
        return UIClass.getDimensions();
    },

    updateContent(type, id, compData, contentDiv, div) {
        if (!contentDiv.uiInstance) {
            const UIClass = UIRegistry[type] || BaseUIComponent;
            contentDiv.uiInstance = new UIClass(id, compData, contentDiv, div);
            
            // Render SVG
            contentDiv.innerHTML = contentDiv.uiInstance.getSVG();
            
            // Pasang Event Delegation Global
            this.bindGlobalEvents(type, id, contentDiv, div);
            
            // Pasang Event Spesifik (jika komponennya butuh)
            contentDiv.uiInstance.bindSpecificEvents();
        }
        
        // Render state visual
        contentDiv.uiInstance.compData = compData;
        
        // 2. PERBAIKAN: Langsung baca dari CircuitStore karena sudah diimpor
        const isSimActive = CircuitStore.isSimulationActive;
        contentDiv.uiInstance.updateState(isSimActive);
    },

    updateDOMState(type, compData, contentDiv, id) {
        if (contentDiv.uiInstance) {
            contentDiv.uiInstance.compData = compData;
            
            // 2. PERBAIKAN: Langsung baca dari CircuitStore karena sudah diimpor
            const isSimActive = CircuitStore.isSimulationActive;
            contentDiv.uiInstance.updateState(isSimActive);
        }
    },

    bindGlobalEvents(type, id, contentDiv, div) {
        contentDiv.addEventListener('click', (e) => {
            // Karena fungsi window.* ada di main.js (Global), kita masih bisa memanggilnya
            if (e.target.closest('.val-trigger')) {
                e.stopPropagation(); window.openValueModal(id, type, e.target.closest('.val-trigger').dataset.sub);
            }
            if (e.target.closest('.btn-up')) { e.stopPropagation(); window.adjustSensorValue(id, 5); }
            if (e.target.closest('.btn-down')) { e.stopPropagation(); window.adjustSensorValue(id, -5); }
            if (e.target.closest('.speed-btn-up')) { e.stopPropagation(); window.adjustFlasherSpeed(id, -100); }
            if (e.target.closest('.speed-btn-down')) { e.stopPropagation(); window.adjustFlasherSpeed(id, 100); }
            if (e.target.closest('.lock-down-btn')) { e.stopPropagation(); window.togglePushButtonLock(id, true); }
            if (e.target.closest('.lock-up-btn')) { e.stopPropagation(); window.togglePushButtonLock(id, false); }
            if (e.target.closest('.range-btn')) {
                e.stopPropagation();
                const currentComp = CircuitStore.components.find(c => c.id === id);
                if (currentComp) {
                    currentComp.isMilli = !currentComp.isMilli;
                    // Langsung panggil CircuitStore.isSimulationActive
                    if (contentDiv.uiInstance) contentDiv.uiInstance.updateState(CircuitStore.isSimulationActive);
                }
            }
        });

        // Setel kursor khusus
        if(div) {
            div.style.cursor = ['switch', 'push_button', 'push_button_nc', 'switch_spst', 'potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(type) ? 'pointer' : 'default';
        }
    }
};