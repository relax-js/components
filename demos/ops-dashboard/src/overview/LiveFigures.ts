import { Inject } from '@relax.js/core/di';
import type { ChartData, StatTile } from '@relax.js/components';
import { TelemetryService, type TelemetrySample } from '../telemetry/TelemetryService';

interface Figure {
    label: string;
    better: 'higher' | 'lower';
    read: (sample: TelemetrySample) => number;
}

const figures: Figure[] = [
    { label: 'Requests per second', better: 'higher', read: (s) => s.requestsPerSecond },
    { label: 'Error rate (%)', better: 'lower', read: (s) => s.errorRate },
    { label: 'p95 latency (ms)', better: 'lower', read: (s) => s.p95Ms },
    { label: 'Healthy services', better: 'higher', read: (s) => s.services.filter((x) => x.state === 'healthy').length },
];

/** How far back each tile compares: thirty samples, half a minute. */
const comparedSamples = 30;

/** The fleet's key figures, each against half a minute ago, with the last minute as a trend. */
class LiveFigures extends HTMLElement {
    @Inject(TelemetryService)
    private telemetry!: TelemetryService;

    private tiles: StatTile[] = [];
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.tiles = figures.map((figure) => {
            const tile = document.createElement('r-stat-tile');
            tile.setAttribute('label', figure.label);
            tile.setAttribute('better', figure.better);
            tile.setAttribute('period', '30 s ago');
            return tile;
        });
        this.stopWatching = this.telemetry.watch(() => this.draw());
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const samples = this.telemetry.samples;
        const latest = samples.at(-1);
        if (!latest) {
            return;
        }
        const earlier = samples.at(-1 - comparedSamples) ?? samples[0];
        figures.forEach((figure, i) => {
            const tile = this.tiles[i];
            tile.setAttribute('value', String(figure.read(latest)));
            tile.setAttribute('previous', String(figure.read(earlier)));
            tile.trend = trendOf(figure, samples);
        });
        // Added once there are figures, so no tile draws without a value.
        if (!this.hasChildNodes()) {
            this.append(...this.tiles);
        }
    }
}

function trendOf(figure: Figure, samples: readonly TelemetrySample[]): ChartData {
    return {
        labels: samples.map((s) => s.at),
        series: [{ name: figure.label, values: samples.map(figure.read) }],
        summary: `${figure.label} over the last minute`,
    };
}

customElements.define('live-figures', LiveFigures);
