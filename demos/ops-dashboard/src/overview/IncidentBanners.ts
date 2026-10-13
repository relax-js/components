import { Inject } from '@relax.js/core/di';
import { TelemetryService } from '../telemetry/TelemetryService';

/**
 * One banner per open incident. A banner the operator closed stays closed until the incident is
 * resolved; a resolved incident's banner goes by itself.
 */
class IncidentBanners extends HTMLElement {
    @Inject(TelemetryService)
    private telemetry!: TelemetryService;

    private readonly shown = new Map<string, HTMLElement>();
    private readonly dismissed = new Set<string>();
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.addEventListener('r-banner-dismiss', this.onDismiss);
        this.stopWatching = this.telemetry.watch(() => this.draw());
        this.draw();
    }

    disconnectedCallback(): void {
        this.removeEventListener('r-banner-dismiss', this.onDismiss);
        this.stopWatching?.();
    }

    private readonly onDismiss = (event: Event): void => {
        const id = (event.target as HTMLElement).dataset.incident;
        if (id) {
            this.dismissed.add(id);
        }
    };

    private draw(): void {
        const open = new Map(this.telemetry.incidents.map((incident) => [incident.id, incident]));
        for (const [id, banner] of this.shown) {
            if (!open.has(id)) {
                banner.remove();
                this.shown.delete(id);
                this.dismissed.delete(id);
            }
        }
        for (const incident of open.values()) {
            if (this.shown.has(incident.id) || this.dismissed.has(incident.id)) {
                continue;
            }
            const banner = document.createElement('r-banner');
            banner.setAttribute('tone', incident.tone);
            banner.setAttribute('dismissible', '');
            banner.dataset.incident = incident.id;
            banner.textContent = incident.message;
            this.shown.set(incident.id, banner);
            this.append(banner);
        }
    }
}

customElements.define('incident-banners', IncidentBanners);
