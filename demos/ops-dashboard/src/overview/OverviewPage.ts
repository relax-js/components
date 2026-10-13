import './CapacityMeters';
import './IncidentBanners';
import './LiveFigures';
import './LiveTrafficChart';
import './ServiceHealthGrid';

/** The live overview: every widget watches the same telemetry and updates on its own. */
class OverviewPage extends HTMLElement {
    connectedCallback(): void {
        this.innerHTML = /* html */ `
            <incident-banners></incident-banners>
            <live-figures class="figure-row"></live-figures>
            <div class="panels overview-panels">
                <r-card heading="Traffic" lead="Requests per second, the last minute.">
                    <live-traffic-chart></live-traffic-chart>
                </r-card>
                <r-card heading="Capacity" lead="Usage against what the fleet has.">
                    <capacity-meters class="meter-list"></capacity-meters>
                </r-card>
                <r-card heading="Services" lead="Where every service stands right now." class="wide"
                        link-text="Traffic details" href="/traffic">
                    <service-health-grid></service-health-grid>
                </r-card>
            </div>
        `;
    }
}

customElements.define('overview-page', OverviewPage);
