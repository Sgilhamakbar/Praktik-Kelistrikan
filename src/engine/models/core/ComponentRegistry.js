// File: src/engine/models/core/ComponentRegistry.js

// 1. WAJIB IMPORT BaseComponent agar tidak error ReferenceError
import { BaseComponent } from './BaseComponent.js';

export const ComponentRegistry = {};

// 2. Ekspor fungsi ini sebagai modul ES6 biasa, BUKAN ke window
export function createComponentInstance(data) {
    const ComponentClass = ComponentRegistry[data.type] || BaseComponent;
    return new ComponentClass(data);
}