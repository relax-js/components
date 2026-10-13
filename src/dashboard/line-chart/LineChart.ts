import { reportProblem } from '../../foundations/problems/problems';
import { formatAmount } from '../amount/Amount';
import { installStyles } from '../../foundations/styles';
import { text } from '../../foundations/text/text';
import type { ChartData } from '../bar-chart/BarChart';
import { ChartWidth } from '../bar-chart/chartSvg';
import { drawPlot } from './LinePlot';

const seriesColours = 5;

const css = `
r-line-chart {
    display: block;
    position: relative;
}
r-line-chart svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    font-size: 11px;
}
r-line-chart .grid { stroke: currentColor; stroke-opacity: 0.15; }
r-line-chart .zero { stroke: currentColor; stroke-opacity: 0.5; }
r-line-chart .axis-label { fill: currentColor; }
r-line-chart .line { fill: none; stroke: var(--series-color); stroke-width: 2; }
r-line-chart .threshold .line { stroke-dasharray: 6 4; }
r-line-chart .area { fill: var(--series-color); fill-opacity: 0.2; stroke: none; }
r-line-chart .marker { fill: var(--series-color); }
r-line-chart .series-1 { --series-color: var(--series-1); }
r-line-chart .series-2 { --series-color: var(--series-2); }
r-line-chart .series-3 { --series-color: var(--series-3); }
r-line-chart .series-4 { --series-color: var(--series-4); }
r-line-chart .series-5 { --series-color: var(--series-5); }
r-line-chart .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; list-style: none; margin: 0; padding: 0; }
r-line-chart .legend li::before {
    content: '';
    display: inline-block;
    width: 0.75em;
    height: 0.75em;
    margin-right: 0.4em;
    background: var(--series-color);
}
r-line-chart .legend li.threshold::before { height: 0; border-top: 2px dashed var(--series-color); background: none; }
r-line-chart .crosshair { stroke: currentColor; stroke-opacity: 0.5; pointer-events: none; }
r-line-chart .readout {
    position: absolute;
    pointer-events: none;
    transform: translate(12px, -50%);
    background: Canvas;
    color: CanvasText;
    border-radius: var(--floating-radius);
    padding: var(--floating-padding);
    box-shadow: var(--floating-shadow);
    white-space: nowrap;
}
r-line-chart .readout.left { transform: translate(calc(-100% - 12px), -50%); }
r-line-chart .readout-label { font-weight: bold; }
r-line-chart .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    /* A table is never narrower than its cells otherwise, and would widen the page out of sight. */
    table-layout: fixed;
}
r-line-chart .empty { padding: 1rem; text-align: center; }
`;

/**
 * Amounts over time as lines, with a legend. A `threshold` series is a dashed level to stay
 * above, an `area` series is shaded down to zero.
 *
 * @example
 * ```typescript
 * const chart = document.querySelector('r-line-chart')!;
 * chart.data = {
 *     labels: ['Jan', 'Feb'],
 *     series: [{ name: 'Cash', values: [410000, 385000], area: true }],
 *     summary: 'Cash over the quarter'
 * };
 * ```
 */
export class LineChart extends HTMLElement {
    private chartData: ChartData | undefined;
    private axisFormatter: (value: number) => string = (value) => formatAmount(value, { withUnit: false });
    private valueFormatter: (value: number) => string = (value) => formatAmount(value);
    private readonly width = new ChartWidth(this, () => {
        this.draw();
    });

    /** What to draw; setting it on a connected chart redraws it. */
    get data(): ChartData | undefined {
        return this.chartData;
    }

    set data(value: ChartData | undefined) {
        this.chartData = value;
        this.redraw();
    }

    /** Formats the axis labels; whole amounts without the unit by default. */
    get axisFormat(): (value: number) => string {
        return this.axisFormatter;
    }

    set axisFormat(value: (value: number) => string) {
        this.axisFormatter = value;
        this.redraw();
    }

    /** Formats the read-out and table values; whole amounts with the unit by default. */
    get valueFormat(): (value: number) => string {
        return this.valueFormatter;
    }

    set valueFormat(value: (value: number) => string) {
        this.valueFormatter = value;
        this.redraw();
    }

    connectedCallback(): void {
        installStyles(this, 'r-line-chart', css);
        this.width.observe();
        this.draw();
    }

    disconnectedCallback(): void {
        this.width.disconnect();
    }

    private redraw(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        this.replaceChildren();
        const data = this.chartData;
        if (!data || !this.isValid(data)) {
            return;
        }
        const figure = document.createElement('div');
        figure.setAttribute('role', 'figure');
        figure.setAttribute('aria-label', data.summary);
        this.append(figure);
        if (data.labels.length === 0 || data.series.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty';
            empty.textContent = text('noData');
            figure.append(empty);
            return;
        }
        const readout = document.createElement('div');
        readout.className = 'readout';
        readout.hidden = true;
        const plot = drawPlot(data, {
            host: this,
            readout,
            axisFormat: this.axisFormatter,
            fillReadout: (target, shown, label) => {
                this.fillReadout(target, shown, label);
            },
        }, this.width.take());
        figure.append(plot, this.drawLegend(data), readout, this.drawTable(data));
    }

    /** The same figures as the drawing, for screen readers: a row per label and a column per series. */
    private drawTable(data: ChartData): HTMLTableElement {
        const table = document.createElement('table');
        table.className = 'visually-hidden';
        const head = table.createTHead().insertRow();
        head.append(document.createElement('th'));
        for (const series of data.series) {
            const cell = document.createElement('th');
            cell.scope = 'col';
            cell.textContent = series.name;
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
                const value = series.values[label];
                row.insertCell().textContent = value === null ? '' : this.valueFormatter(value);
            }
        });
        return table;
    }

    private fillReadout(readout: HTMLElement, data: ChartData, label: number): void {
        const title = document.createElement('div');
        title.className = 'readout-label';
        title.textContent = data.labels[label];
        const rows = data.series.map((series) => {
            const value = series.values[label];
            const row = document.createElement('div');
            row.textContent = `${series.name}: ${value === null ? text('noData') : this.valueFormatter(value)}`;
            return row;
        });
        readout.replaceChildren(title, ...rows);
    }

    private isValid(data: ChartData): boolean {
        if (typeof data.summary !== 'string' || data.summary === '') {
            reportProblem('r-line-chart', 'the data needs a summary');
            return false;
        }
        if (data.series.length > seriesColours) {
            reportProblem('r-line-chart', `${String(data.series.length)} series is more than the ${String(seriesColours)} the theme colours`);
            return false;
        }
        for (const series of data.series) {
            if (series.values.length !== data.labels.length) {
                reportProblem('r-line-chart', `series "${series.name}" has ${String(series.values.length)} values for ${String(data.labels.length)} labels`,
                );
                return false;
            }
            if (series.values.some((value) => value !== null && !Number.isFinite(value))) {
                reportProblem('r-line-chart', `series "${series.name}" has a value that is not a number`);
                return false;
            }
        }
        return true;
    }

    private drawLegend(data: ChartData): HTMLElement {
        const legend = document.createElement('ul');
        legend.className = 'legend';
        data.series.forEach((series, index) => {
            const item = document.createElement('li');
            item.className = `series-${String(index + 1)}`;
            item.classList.toggle('threshold', series.threshold === true);
            item.textContent = series.name;
            legend.append(item);
        });
        return legend;
    }

}

if (!customElements.get('r-line-chart')) {
    customElements.define('r-line-chart', LineChart);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-line-chart': LineChart;
    }
}
