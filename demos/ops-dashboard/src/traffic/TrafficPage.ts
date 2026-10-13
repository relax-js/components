import { get } from '@relax.js/core/http';
import { compileTemplate } from '@relax.js/core/html';
import type { AreaChartData, ChartData, Spinner } from '@relax.js/components';

interface HeatmapData {
    rows: string[];
    columns: string[];
    values: (number | null)[][];
}

interface Certificate {
    host: string;
    issuer: string;
    expires: string;
    daysLeft: number;
}

interface Usage {
    requestsThisMonth: number;
    requestsLastYear: number;
    incidentsThisMonth: number;
    incidentsLastYear: number;
}

interface CertificateRow extends Certificate {
    tone: string;
    status: string;
}

interface TrafficView {
    usage?: Usage;
    certificates: CertificateRow[];
}

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 });

/** Where traffic comes from and when, which services fail, and what needs renewing. */
class TrafficPage extends HTMLElement {
    private readonly view = compileTemplate<TrafficView>(`
        <r-spinner loading>
            <div class="figure-row" if="usage">
                <r-kpi-meter label="Requests this month" value="{{usage.requestsThisMonth}}" previous="{{usage.requestsLastYear}}"></r-kpi-meter>
                <r-kpi-meter label="Incidents this month" value="{{usage.incidentsThisMonth}}" previous="{{usage.incidentsLastYear}}" better="lower"></r-kpi-meter>
            </div>
            <div class="panels">
                <r-card heading="Load by hour" lead="Requests per hour over a typical week." class="wide load"></r-card>
                <r-card heading="Errors by service" lead="Last 24 hours, against the error budget." class="errors"></r-card>
                <r-card heading="Traffic by region" lead="Requests per day, the last two weeks." class="regions"></r-card>
                <r-card heading="Certificates" lead="TLS certificates and when they run out." icon="lock" class="wide">
                    <table class="certificates">
                        <thead><tr><th>Host</th><th>Issuer</th><th>Status</th><th>Expires in</th></tr></thead>
                        <tbody>
                            <tr loop="certificate in certificates">
                                <td>{{certificate.host}}</td>
                                <td>{{certificate.issuer}}</td>
                                <td><r-status-mark tone="{{certificate.tone}}" note="{{certificate.expires}}">{{certificate.status}}</r-status-mark></td>
                                <td><r-days-left days="{{certificate.daysLeft}}" urgent="7" soon="30"></r-days-left></td>
                            </tr>
                        </tbody>
                    </table>
                </r-card>
            </div>
        </r-spinner>
    `);

    connectedCallback(): void {
        this.view.render({ certificates: [] });
        this.replaceChildren(this.view.content);
        void this.load();
    }

    private async load(): Promise<void> {
        const responses = await Promise.all([
            get('/api/traffic/heatmap'),
            get('/api/traffic/errors'),
            get('/api/traffic/regions'),
            get('/api/certificates'),
            get('/api/usage'),
        ]);
        const failed = responses.find((response) => !response.success);
        if (failed) {
            console.error(`traffic data failed to load (${failed.statusCode})`);
            return;
        }
        const [heatmap, errors, regions, certificates, usage] = responses;

        this.view.render({
            usage: usage.as<Usage>(),
            certificates: certificates.as<Certificate[]>().map(toRow),
        });
        this.drawLoad(heatmap.as<HeatmapData>());
        this.drawErrors(errors.as<Omit<ChartData, 'summary'>>());
        this.drawRegions(regions.as<Omit<AreaChartData, 'summary'>>());
        this.querySelector<Spinner>('r-spinner')!.loading = false;
    }

    // Each chart gets its data before it is added, so it never draws empty first.
    private drawLoad(data: HeatmapData): void {
        const map = document.createElement('r-heatmap');
        map.summary = 'Requests per hour for each weekday';
        map.valueFormat = (value) => compact.format(value);
        map.columns = data.columns;
        map.rows = data.rows;
        map.values = data.values;
        this.querySelector('.load')!.append(map);
    }

    private drawErrors(data: Omit<ChartData, 'summary'>): void {
        const chart = document.createElement('r-bar-chart');
        chart.setAttribute('stacked', '');
        chart.axisFormat = (value) => String(value);
        chart.valueFormat = (value) => String(value);
        chart.data = { ...data, summary: 'Errors per service in the last 24 hours' };
        this.querySelector('.errors')!.append(chart);
    }

    private drawRegions(data: Omit<AreaChartData, 'summary'>): void {
        const chart = document.createElement('r-area-chart');
        chart.axisFormat = (value) => compact.format(value);
        chart.valueFormat = (value) => compact.format(value);
        chart.data = { ...data, summary: 'Requests per day by region' };
        this.querySelector('.regions')!.append(chart);
    }
}

function toRow(certificate: Certificate): CertificateRow {
    const tone = certificate.daysLeft <= 7 ? 'danger' : certificate.daysLeft <= 30 ? 'warn' : 'ok';
    return { ...certificate, tone, status: certificate.daysLeft <= 30 ? 'Renew' : 'Valid' };
}

customElements.define('traffic-page', TrafficPage);
