import type { MockRoute } from '../../shared/mockApi';
import { round, seededRandom } from '../../shared/random';

const random = seededRandom(7);

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

// Thousands of requests: busy office hours on weekdays, an evening bump at weekends.
const heatmap = {
    rows: weekdays,
    columns: hours,
    values: weekdays.map((_, day) =>
        hours.map((_, hour) => {
            const weekend = day >= 5;
            const office = hour >= 8 && hour <= 17 ? 1 : 0.3;
            const evening = hour >= 18 && hour <= 22 ? 0.9 : 0.4;
            const level = weekend ? evening * 0.8 : office;
            return round(level * 4200 + random() * 600);
        })
    ),
};

const errorServices = ['gateway', 'checkout', 'payments', 'search', 'shipping'];
const errors = {
    labels: errorServices,
    series: [
        { name: 'Client errors', values: errorServices.map(() => round(80 + random() * 260)) },
        { name: 'Server errors', values: errorServices.map(() => round(10 + random() * 120)) },
        { name: 'Timeouts', values: errorServices.map(() => round(random() * 60)) },
        { name: 'Error budget', values: errorServices.map(() => 400), threshold: true },
    ],
};

const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 13 + i);
    return date.toISOString().slice(0, 10);
});
const regions = {
    labels: days,
    series: ['Europe', 'North America', 'Asia Pacific'].map((name, region) => ({
        name,
        values: days.map((_, day) => round((3 - region) * 22000 + Math.sin(day / 2) * 6000 + random() * 4000)),
    })),
};

const certificateHosts = ['api.fleet.example', 'auth.fleet.example', 'pay.fleet.example', 'cdn.fleet.example', 'status.fleet.example'];
const certificates = certificateHosts.map((host, i) => {
    const daysLeft = [3, 12, 41, 88, 160][i];
    const expires = new Date();
    expires.setDate(expires.getDate() + daysLeft);
    return { host, issuer: i % 2 ? 'ZeroSSL' : "Let's Encrypt", expires: expires.toISOString().slice(0, 10), daysLeft };
});

const usage = {
    requestsThisMonth: 2_840_000_000,
    requestsLastYear: 2_310_000_000,
    incidentsThisMonth: 4,
    incidentsLastYear: 7,
};

export const trafficRoutes: MockRoute[] = [
    { method: 'GET', path: '/api/traffic/heatmap', handle: () => ({ status: 200, body: heatmap }) },
    { method: 'GET', path: '/api/traffic/errors', handle: () => ({ status: 200, body: errors }) },
    { method: 'GET', path: '/api/traffic/regions', handle: () => ({ status: 200, body: regions }) },
    { method: 'GET', path: '/api/certificates', handle: () => ({ status: 200, body: certificates }) },
    { method: 'GET', path: '/api/usage', handle: () => ({ status: 200, body: usage }) },
];
