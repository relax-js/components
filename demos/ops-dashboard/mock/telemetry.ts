import type { ServerResponse } from 'node:http';
import { openEventStream, sendEvent, type MockStream } from '../../shared/mockApi';
import { round } from '../../shared/random';

type ServiceState = 'healthy' | 'degraded' | 'down' | 'maintenance';

interface Service {
    name: string;
    state: ServiceState;
    incidentId?: string;
}

const serviceNames = [
    'gateway', 'auth', 'accounts', 'catalog', 'search', 'checkout',
    'payments', 'inventory', 'shipping', 'notifications', 'recommendations', 'reports',
];

const historyLength = 30;
const tickMs = 1000;

/** One fleet per connection, so every open tab watches its own simulation. */
class Fleet {
    private tick = 0;
    private disk = 1210;
    private readonly services: Service[] = serviceNames.map((name) => ({
        name,
        state: name === 'reports' ? 'maintenance' : 'healthy',
    }));

    constructor(private readonly response: ServerResponse) {}

    /** Moves the fleet one tick on; `at` is when the sample was taken. */
    step(at = new Date()): void {
        this.tick++;
        for (const service of this.services) {
            this.moveState(service);
        }
        const down = this.services.filter((s) => s.state === 'down').length;
        const degraded = this.services.filter((s) => s.state === 'degraded').length;
        const wave = Math.sin(this.tick / 12);
        this.disk += Math.random() * 0.8;

        sendEvent(this.response, 'telemetry-sample', {
            at: at.toLocaleTimeString('en-GB'),
            requestsPerSecond: round(1250 + 320 * wave + Math.random() * 90 - down * 140),
            errorRate: round(0.25 + Math.random() * 0.2 + down * 1.6 + degraded * 0.4, 2),
            p95Ms: round(170 + Math.random() * 35 + degraded * 60 + down * 140),
            cpu: round(52 + 22 * wave + Math.random() * 10),
            memoryGb: round(38 + 8 * Math.sin(this.tick / 30) + Math.random() * 2, 1),
            diskGb: round(this.disk),
            services: this.services.map(({ name, state }) => ({ name, state })),
        });
    }

    private moveState(service: Service): void {
        // Across the fleet about one service a minute slows down; most recover within seconds and
        // about one in six goes down.
        const roll = Math.random();
        if (service.state === 'healthy' && roll < 0.0015) {
            this.change(service, 'degraded', 'warn', `${service.name} is responding slowly`);
        } else if (service.state === 'degraded' && roll < 0.02) {
            this.change(service, 'down', 'danger', `${service.name} is not responding`);
        } else if (service.state === 'degraded' && roll < 0.12) {
            this.change(service, 'healthy');
        } else if (service.state === 'down' && roll < 0.12) {
            this.change(service, 'healthy');
        }
    }

    private change(service: Service, state: ServiceState, tone?: 'warn' | 'danger', message?: string): void {
        if (service.incidentId) {
            sendEvent(this.response, 'telemetry-resolved', { id: service.incidentId });
            service.incidentId = undefined;
        }
        service.state = state;
        if (tone && message) {
            service.incidentId = `${service.name}-${this.tick}`;
            sendEvent(this.response, 'telemetry-incident', { id: service.incidentId, tone, message });
        }
    }
}

export const telemetryStream: MockStream = {
    path: '/api/telemetry',
    open: (response, request) => {
        openEventStream(response);
        const fleet = new Fleet(response);
        // A history up front, so the charts have a line from the first second, each sample a tick apart.
        for (let i = historyLength; i > 0; i--) {
            fleet.step(new Date(Date.now() - i * tickMs));
        }
        const timer = setInterval(() => fleet.step(), tickMs);
        request.on('close', () => clearInterval(timer));
    },
};
