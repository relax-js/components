import { Inject } from '@relax.js/core/di';
import { compileTemplate } from '@relax.js/core/html';
import { TelemetryService } from '../telemetry/TelemetryService';

interface CapacityView {
    cpu: number;
    memory: number;
    disk: number;
}

/** The fleet's CPU, memory and disk against their limits. */
class CapacityMeters extends HTMLElement {
    @Inject(TelemetryService)
    private telemetry!: TelemetryService;

    private readonly view = compileTemplate<CapacityView>(`
        <r-meter label="CPU" value="{{cpu}}" max="100" unit="%" warn-at="75" danger-at="90"></r-meter>
        <r-meter label="Memory" value="{{memory}}" max="64" unit="GB"></r-meter>
        <r-meter label="Disk" value="{{disk}}" max="2000" unit="GB" warn-at="1600"></r-meter>
    `);
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.stopWatching = this.telemetry.watch(() => this.draw());
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const latest = this.telemetry.latest;
        if (!latest) {
            return;
        }
        this.view.render({ cpu: latest.cpu, memory: latest.memoryGb, disk: latest.diskGb });
        // Added once there are figures, so no meter draws without a value.
        if (!this.contains(this.view.content)) {
            this.append(this.view.content);
        }
    }
}

customElements.define('capacity-meters', CapacityMeters);
