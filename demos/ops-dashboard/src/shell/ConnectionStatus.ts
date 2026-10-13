import { Inject } from '@relax.js/core/di';
import { TelemetryService } from '../telemetry/TelemetryService';

/** Whether the live stream is connected, shown in the header. */
class ConnectionStatus extends HTMLElement {
    @Inject(TelemetryService)
    private telemetry!: TelemetryService;

    private readonly badge = document.createElement('r-badge');
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.replaceChildren(this.badge);
        this.stopWatching = this.telemetry.watch(() => this.draw());
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const connected = this.telemetry.connected;
        this.badge.setAttribute('tone', connected ? 'ok' : 'warn');
        this.badge.textContent = connected ? 'Live' : 'Connecting…';
    }
}

customElements.define('connection-status', ConnectionStatus);
