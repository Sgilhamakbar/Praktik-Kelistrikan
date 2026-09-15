// File: src/components/actuators/MotorDCUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class MotorDCUI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; }
    getSVG() {
        return `<svg width="80" height="80" viewBox="0 0 80 80">
        <line class="pin-in-0" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="2"/>
        <line class="pin-out-0" x1="60" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="2"/>
        <circle cx="40" cy="40" r="20" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        <g class="anim-rotor" style="transform-origin: 40px 40px;">
            <circle cx="40" cy="40" r="14" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="4 4"/>
            <line x1="40" y1="26" x2="40" y2="54" stroke="#1e293b" stroke-width="1.5"/>
            <line x1="26" y1="40" x2="54" y2="40" stroke="#1e293b" stroke-width="1.5"/>
            <circle cx="40" cy="40" r="4" fill="#1e293b"/>
        </g>
        <text x="40" y="16" class="val-trigger" text-anchor="middle" font-size="9" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;">DC MOTOR</text>
        <text class="rpm-text" x="40" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="#0ea5e9">0 RPM</text>
        </svg>`;
    }
    updateState(isSimActive) {
        const rpmText = this.contentDiv.querySelector('.rpm-text');
        if (rpmText) rpmText.textContent = `${this.compData.rpm || 0} RPM`;

        if (typeof this.compData.visualAngle === 'undefined') this.compData.visualAngle = 0;
        let visualSpeed = (this.compData.rpm || 0) * 0.05;
        
        // Mencegah Wagon-Wheel Effect pada UI
        if (visualSpeed > 25) visualSpeed = 25;
        if (visualSpeed < -25) visualSpeed = -25;

        this.compData.visualAngle = (this.compData.visualAngle + visualSpeed) % 360;
        const rotor = this.contentDiv.querySelector('.anim-rotor');
        if (rotor) {
            rotor.style.transform = `rotate(${this.compData.visualAngle}deg)`;
        }
    }
}
UIRegistry['motor_dc'] = MotorDCUI;