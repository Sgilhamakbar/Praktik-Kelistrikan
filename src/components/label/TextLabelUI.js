import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class TextLabel extends BaseUIComponent {
    static getDimensions() { return [100, 30]; }
    getSVG() {
        const text = this.compData.customText || 'Teks Baru';
        const size = this.compData.fontSize || 16;
        const color = this.compData.textColor || '#ffffff';
        const font = this.compData.fontFamily || 'sans-serif';
        const showBox = this.compData.showBox ? 'block' : 'none';
        
        return `<svg class="label-svg-wrapper" width="100" height="30" style="overflow: visible;">
          <!-- Background Box (Bisa diaktifkan/nonaktifkan) -->
          <rect class="label-box" x="0" y="0" width="120" height="30" rx="4" fill="#0f172a" stroke="#334155" stroke-width="2" style="display: ${showBox};" />
          
          <!-- Background transparan murni untuk area pegangan mouse (Drag) -->
          <rect class="label-drag-area" x="-10" y="0" width="120" height="30" fill="transparent" />
          
          <!-- Elemen Teks -->
          <text class="label-content" x="10" y="${size + 4}" font-family="${font}" font-weight="bold" font-size="${size}px" fill="${color}" style="pointer-events: none;">${text}</text>
        </svg>`;
    }

    updateState(_isSimActive) {
        if (!this.contentDiv) return;
        
        const svgWrapper = this.contentDiv.querySelector('.label-svg-wrapper');
        const svgText = this.contentDiv.querySelector('.label-content');
        const svgBox = this.contentDiv.querySelector('.label-box');
        const svgDragArea = this.contentDiv.querySelector('.label-drag-area');
        
        if (svgText) {
            // Update Properti Teks
            svgText.textContent = this.compData.customText || 'Teks Baru';
            svgText.style.fontSize = (this.compData.fontSize || 16) + 'px';
            svgText.setAttribute('fill', this.compData.textColor || '#ffffff');
            svgText.setAttribute('font-family', this.compData.fontFamily || 'sans-serif');
            svgText.setAttribute('y', (this.compData.fontSize || 16) + 4);
            
            // Toggle Kotak Background
            if (svgBox) svgBox.style.display = this.compData.showBox ? 'block' : 'none';

            // 🌟 TRIK CERDAS: Otomatis menghitung lebar tulisan agar kotaknya pas!
            setTimeout(() => {
                const bbox = svgText.getBBox(); // Ambil ukuran asli teks yang sudah dirender
                const newWidth = Math.max(100, bbox.width + 20); // Tambah padding kiri-kanan
                const newHeight = Math.max(30, bbox.height + 10);
                
                // Lebarkan SVG dan Kotaknya
                if (svgWrapper) {
                    svgWrapper.setAttribute('width', newWidth);
                    svgWrapper.setAttribute('height', newHeight);
                }
                if (svgBox) {
                    svgBox.setAttribute('width', newWidth);
                    svgBox.setAttribute('height', newHeight);
                }
                if (svgDragArea) {
                    svgDragArea.setAttribute('width', newWidth);
                    svgDragArea.setAttribute('height', newHeight);
                }
            }, 0); // setTimeout 0 memberi jeda singkat ke browser untuk menghitung lebar font
        }
    }
}

UIRegistry['text_label'] = TextLabel;