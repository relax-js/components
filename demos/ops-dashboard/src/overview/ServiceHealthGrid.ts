import { Inject } from '@relax.js/core/di';
import type { StatusGrid } from '@relax.js/components';
import { TelemetryService } from '../telemetry/TelemetryService';

/** Every service of the fleet as a tile in its current state. */
class ServiceHealthGrid extends HTMLElement {
    @Inject(TelemetryService)
    private telemetry!: TelemetryService;

    private readonly grid: StatusGrid = document.createElement('r-status-grid');
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.grid.states = [
            { id: 'healthy', label: 'Healthy', tone: 'ok' },
            { id: 'degraded', label: 'Degraded', tone: 'warn' },
            { id: 'down', label: 'Down', tone: 'danger' },
            { id: 'maintenance', label: 'Maintenance', tone: 'muted', icon: 'clock' },
        ];
        this.replaceChildren(this.grid);
        this.stopWatching = this.telemetry.watch(() => this.draw());
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const services = this.telemetry.latest?.services ?? [];
        this.grid.items = services.map((service) => ({ label: service.name, state: service.state }));
    }
}

customElements.define('service-health-grid', ServiceHealthGrid);
