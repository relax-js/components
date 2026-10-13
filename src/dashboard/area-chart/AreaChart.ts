import { installStyles } from '../../foundations/styles';
import { text } from '../../foundations/text/text';
import { formatAmount } from '../amount/Amount';
import { niceScale } from '../bar-chart/BarChart';
import {
    appendAxes,
    appendSeries,
    attachReadout,
    createLegend,
    createPlot,
    createSvg,
    stackEdges
} from './AreaChartSvg';

/** One series of an area chart. */
export interface AreaChartSeries {
    name: string;
    values: number[];
    /** A level to stay above, drawn dashed over the areas and left out of the stack. */
    threshold?: boolean;
}

/** What an area chart draws. */
export interface AreaChartData {
    labels: string[];
    series: AreaChartSeries[];
    /** Read by screen readers as the chart's name. */
    summary: string;
}

const seriesColours = 5;

const styles = /* css */ `
    r-area-chart {
        display: block;
        position: relative;

        .legend {
            display: flex;
            flex-wrap: wrap;
            gap: .25rem 1rem;
            list-style: none;
            margin: 0;
            padding: 0;

            li::before {
                content: '';
                display: inline-block;
                width: .75em;
                height: .75em;
                margin-right: .4em;
                background: var(--series-color);
            }

            li.threshold::before {
                height: 0;
                border-top: 2px dashed var(--series-color);
                background: none;
            }
        }

        .readout {
            position: absolute;
            pointer-events: none;
            transform: translate(12px, -50%);
            background: Canvas;
            color: CanvasText;
            border-radius: var(--floating-radius);
            padding: var(--floating-padding);
            box-shadow: var(--floating-shadow);
            white-space: nowrap;

            &.left {
                transform: translate(calc(-100% - 12px), -50%);
            }

            .readout-label {
                font-weight: bold;
            }
        }

        .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }

        svg {
            width: 100%;
            height: auto;
        }

        .grid {
            stroke: var(--bd-muted);
        }

        .zero {
            stroke: var(--bd-strong);
        }

        text {
            fill: var(--text-muted);
            font-size: 11px;
        }

        .crosshair {
            stroke: var(--bd-strong);
            pointer-events: none;
        }

        .area {
            stroke: none;
            fill: var(--series-color);
            fill-opacity: .35;
        }

        .line {
            fill: none;
            stroke: var(--series-color);
            stroke-width: 2;
        }

        .threshold .line {
            stroke-dasharray: 6 4;
        }

        .series-1 { --series-color: var(--series-1); }
        .series-2 { --series-color: var(--series-2); }
        .series-3 { --series-color: var(--series-3); }
        .series-4 { --series-color: var(--series-4); }
        .series-5 { --series-color: var(--series-5); }
    }
`;

/**
 * Shows amounts over time as stacked bands, or as one shaded area for a single series. The
 * value axis starts at zero (or below it when values are negative) and ends on a round figure.
 *
 * @example
 * ```typescript
 * const chart = document.querySelector('r-area-chart')!;
 * chart.data = {
 *     labels: ['Jan', 'Feb'],
 *     series: [{ name: 'Rent', values: [10, 12] }, { name: 'Food', values: [5, 6] }],
 *     summary: 'Costs by kind'
 * };
 * ```
 */
export class AreaChart extends HTMLElement {
    private chartData: AreaChartData | undefined;
    private axisFormatter: (value: number) => string = (value) => formatAmount(value, { withUnit: false });
    private valueFormatter: (value: number) => string = (value) => formatAmount(value);

    /** Formats the axis labels; whole amounts without the unit by default. */
    get axisFormat(): (value: number) => string {
        return this.axisFormatter;
    }

    set axisFormat(value: (value: number) => string) {
        this.axisFormatter = value;
        this.draw();
    }

    /** Formats the read-out values; whole amounts with the unit by default. */
    get valueFormat(): (value: number) => string {
        return this.valueFormatter;
    }

    set valueFormat(value: (value: number) => string) {
        this.valueFormatter = value;
        this.draw();
    }

    connectedCallback(): void {
        installStyles(this, 'r-area-chart', styles);
        this.draw();
    }

    /** What to draw; setting it on a connected chart redraws it. */
    get data(): AreaChartData | undefined {
        return this.chartData;
    }

    set data(value: AreaChartData | undefined) {
        this.chartData = value;
        this.draw();
    }

    private draw(): void {
        if (!this.isConnected) {
            return;
        }
        const data = this.chartData;
        if (data === undefined || !this.isDrawable(data)) {
            this.replaceChildren();
            return;
        }

        this.setAttribute('role', 'figure');
        this.setAttribute('aria-label', data.summary);
        if (data.labels.length === 0 || data.series.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty';
            empty.textContent = text('noData');
            this.replaceChildren(empty);
            return;
        }

        const stacked = data.series.filter((s) => !s.threshold);
        const thresholds = data.series.filter((s) => s.threshold);
        const edges = stackEdges(stacked, data.labels.length);

        const drawn = [...edges.flatMap((e) => [...e.top, ...e.bottom]), ...thresholds.flatMap((t) => t.values), 0];
        const scale = niceScale(Math.min(...drawn), Math.max(...drawn));
        const plot = createPlot(data.labels.length, scale);

        const svg = createSvg();
        appendAxes(svg, data, plot, scale, this.axisFormatter);
        appendSeries(svg, data, stacked, thresholds, edges, plot);
        const readout = attachReadout(svg, this, data, plot, this.valueFormatter);

        this.replaceChildren(svg, createLegend(data), readout, this.drawTable(data, stacked.length > 1));
    }

    /** The same figures as the drawing, for screen readers: a row per label and a column per series, plus the total of the stack. */
    private drawTable(data: AreaChartData, withTotal: boolean): HTMLTableElement {
        const table = document.createElement('table');
        table.className = 'visually-hidden';
        const head = table.createTHead().insertRow();
        head.append(document.createElement('th'));
        const columns = data.series.map((series) => series.name);
        if (withTotal) {
            columns.push(text('total'));
        }
        for (const name of columns) {
            const cell = document.createElement('th');
            cell.scope = 'col';
            cell.textContent = name;
            head.append(cell);
        }
        const body = table.createTBody();
        data.labels.forEach((labelText, label) => {
            const row = body.insertRow();
            const header = document.createElement('th');
            header.scope = 'row';
            header.textContent = labelText;
            row.append(header);
            for (const series of data.series) {
                row.insertCell().textContent = this.valueFormatter(series.values[label]);
            }
            if (withTotal) {
                const sum = data.series.filter((s) => !s.threshold).reduce((total, s) => total + s.values[label], 0);
                row.insertCell().textContent = this.valueFormatter(sum);
            }
        });
        return table;
    }

    private isDrawable(data: AreaChartData): boolean {
        if (typeof data.summary !== 'string' || data.summary === '') {
            console.error('r-area-chart: the data needs a summary');
            return false;
        }
        if (data.series.length > seriesColours) {
            console.error(`r-area-chart: ${data.series.length} series is more than the ${seriesColours} the theme colours`);
            return false;
        }
        for (const series of data.series) {
            if (series.values.length !== data.labels.length) {
                console.error(
                    `r-area-chart: series "${series.name}" has ${series.values.length} values for ${data.labels.length} labels`
                );
                return false;
            }
        }
        return true;
    }
}

if (!customElements.get('r-area-chart')) {
    customElements.define('r-area-chart', AreaChart);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-area-chart': AreaChart;
    }
}
