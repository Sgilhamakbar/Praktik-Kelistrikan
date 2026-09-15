// File: src/engine/models/core/BaseComponent.js

export class BaseComponent {
    constructor(data) {
        Object.assign(this, data);
    }
    onTimeUpdate(_dt, _now) {} 
    solveDigital(_engine, _iter) {}
    applyFixedVoltage(_engine, _fixedNodes, _iter) {}
    injectMatrix(_engine, _sumVR, _sum1R, _iter) {}
    applyResults(_engine) {}
}