import { Inject } from '@relax.js/core/di';
import type { LineChart } from '@relax.js/components';
import { TelemetryService } from '../telemetry/TelemetryService';

/** What the fleet is sized for; traffic above it is shed. */
const capacity = 1800;

const wholeNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

/** Requests per second over the last minute, against the fleet's capacity. */
class LiveTrafficChart extends HTMLElement {
    @Inject(TelemetryService)
    private telemetry!: TelemetryService;

    private readonly chart: LineChart = document.createElement('r-line-chart');
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.chart.axisFormat = (value) => wholeNumber.format(value);
        this.chart.valueFormat = (value) => `${wholeNumber.format(value)} req/s`;
        this.replaceChildren(this.chart);
        this.stopWatching = this.telemetry.watch(() => this.draw());
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const samples = this.telemetry.samples;
        if (samples.length < 2) {
            return;
        }
        this.chart.data = {
            labels: samples.map((s) => s.at),
            series: [
                { name: 'Requests per second', values: samples.map((s) => s.requestsPerSecond), area: true },
                { name: 'Capacity', values: samples.map(() => capacity), threshold: true },
            ],
            summary: 'Requests per second over the last minute, against capacity',
        };
    }
}

customElements.define('live-traffic-chart', LiveTrafficChart);
