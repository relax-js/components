import { ContainerService } from '@relax.js/core/di';
import { SSEClient, type SSEDataEvent } from '@relax.js/core/http';

export type ServiceState = 'healthy' | 'degraded' | 'down' | 'maintenance';

export interface ServiceHealth {
    name: string;
    state: ServiceState;
}

/** One second of the fleet, as the telemetry stream reports it. */
export interface TelemetrySample {
    at: string;
    requestsPerSecond: number;
    errorRate: number;
    p95Ms: number;
    cpu: number;
    memoryGb: number;
    diskGb: number;
    services: ServiceHealth[];
}

export interface Incident {
    id: string;
    tone: 'warn' | 'danger';
    message: string;
}

/** Dispatched by the telemetry service whenever what it knows about the fleet changes. */
export class TelemetryChangedEvent extends Event {
    static readonly type = 'telemetry-changed';

    constructor() {
        super(TelemetryChangedEvent.type);
    }
}

/** How many samples the dashboard keeps: the last minute. */
const windowSize = 60;

/**
 * The live picture of the fleet, fed by the server's telemetry stream. Widgets watch it rather
 * than the stream, so one connection serves the whole page however many widgets show it.
 */
@ContainerService({ inject: [] })
export class TelemetryService extends EventTarget {
    private readonly window: TelemetrySample[] = [];
    private readonly open = new Map<string, Incident>();
    private client?: SSEClient;
    private isConnected = false;

    get samples(): readonly TelemetrySample[] {
        return this.window;
    }

    get latest(): TelemetrySample | undefined {
        return this.window.at(-1);
    }

    get incidents(): Incident[] {
        return [...this.open.values()];
    }

    get connected(): boolean {
        return this.isConnected;
    }

    /** Calls `listener` on every change, starting the stream on first use; returns the function that stops it. */
    watch(listener: () => void): () => void {
        this.addEventListener(TelemetryChangedEvent.type, listener);
        this.start();
        return () => this.removeEventListener(TelemetryChangedEvent.type, listener);
    }

    private start(): void {
        if (this.client) {
            return;
        }
        document.addEventListener('telemetry-sample', (event) => this.addSample((event as SSEDataEvent).data as TelemetrySample));
        document.addEventListener('telemetry-incident', (event) => this.openIncident((event as SSEDataEvent).data as Incident));
        document.addEventListener('telemetry-resolved', (event) => this.resolve((event as SSEDataEvent).data as { id: string }));
        this.client = new SSEClient('/api/telemetry', {
            eventTypes: ['telemetry-sample', 'telemetry-incident', 'telemetry-resolved'],
            onConnect: () => this.setConnected(true),
            onError: (_client, error) => {
                console.error('telemetry stream failed', error);
                this.setConnected(false);
            },
        });
        this.client.connect();
    }

    private addSample(sample: TelemetrySample): void {
        this.window.push(sample);
        if (this.window.length > windowSize) {
            this.window.shift();
        }
        this.changed();
    }

    private openIncident(incident: Incident): void {
        this.open.set(incident.id, incident);
        this.changed();
    }

    private resolve({ id }: { id: string }): void {
        this.open.delete(id);
        this.changed();
    }

    private setConnected(connected: boolean): void {
        this.isConnected = connected;
        this.changed();
    }

    private changed(): void {
        this.dispatchEvent(new TelemetryChangedEvent());
    }
}
