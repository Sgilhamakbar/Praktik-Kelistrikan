import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class TextLabelModel extends BaseComponent {
    // Kosong! 
    // Komponen ini tidak butuh injectMatrix() atau applyResults()
    // karena tidak memiliki aliran listrik. Ia murni komponen kosmetik.
}

// Daftarkan ke ComponentRegistry
ComponentRegistry['text_label'] = TextLabelModel;