import { reportProblem } from '../../foundations/problems/problems';
import { formatAmount } from '../amount/Amount';
import { installStyles } from '../../foundations/styles';
import { text } from '../../foundations/text/text';
import { ChartWidth, element } from './chartSvg';
import { drawBarPlot } from './drawBarPlot';
import type { BarPlot } from './drawBarPlot';

export { niceScale } from './drawBarPlot';

export interface ChartSeries {
    name: string;
    values: (number | null)[];
    /** A level to stay above, drawn dashed instead of as bars. */
    threshold?: boolean;
    area?: boolean;
}

export interface ChartData {
    labels: string[];
    series: ChartSeries[];
    summary: string;
}

const seriesColours = 5;

/** The series that make up a stack; a threshold is a level to compare with, not a part of the total. */
function stackedSeries(data: ChartData): ChartSeries[] {
    return data.series.filter((series) => !series.threshold);
}

/** The sum of the values present at a label; a missing value adds nothing. */
function totalAt(data: ChartData, label: number): number {
    return stackedSeries(data).reduce((sum, series) => sum + (series.values[label] ?? 0), 0);
}

const css = `
r-bar-chart {
    display: block;
    position: relative;
}
r-bar-chart svg {
    display: block;
    width: 100%;
    height: auto;
    font-size: 11px;
}
r-bar-chart .grid { stroke: currentColor; stroke-opacity: 0.15; }
r-bar-chart .zero { stroke: currentColor; stroke-opacity: 0.5; }
r-bar-chart .axis-label { fill: currentColor; }
r-bar-chart .bar { fill: var(--series-color); }
r-bar-chart .threshold { fill: none; stroke: var(--series-color); stroke-width: 2; stroke-dasharray: 6 4; }
r-bar-chart .value { fill: currentColor; }
r-bar-chart .value.inside { fill: Canvas; }
r-bar-chart .series-1 { --series-color: var(--series-1); }
r-bar-chart .series-2 { --series-color: var(--series-2); }
r-bar-chart .series-3 { --series-color: var(--series-3); }
r-bar-chart .series-4 { --series-color: var(--series-4); }
r-bar-chart .series-5 { --series-color: var(--series-5); }
r-bar-chart .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; list-style: none; margin: 0; padding: 0; }
r-bar-chart .legend li::before {
    content: '';
    display: inline-block;
    width: 0.75em;
    height: 0.75em;
    margin-right: 0.4em;
    background: var(--series-color);
}
r-bar-chart .legend li.threshold::before { height: 0; border-top: 2px dashed var(--series-color); background: none; }
r-bar-chart .band { fill: transparent; pointer-events: all; }
r-bar-chart .band.selected { fill: currentColor; fill-opacity: 0.06; }
r-bar-chart .readout {
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
r-bar-chart .readout.left { transform: translate(calc(-100% - 12px), -50%); }
r-bar-chart .readout-label { font-weight: bold; }
r-bar-chart .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    /* A table is never narrower than its cells otherwise, and would widen the page out of sight. */
    table-layout: fixed;
}
r-bar-chart .empty { padding: 1rem; text-align: center; }
`;

/**
 * Amounts across categories as bars, side by side or stacked, upright or sideways.
 *
 * @example
 * ```html
 * <r-bar-chart stacked show-values></r-bar-chart>
 * ```
 *
 * @attr {vertical|horizontal} orientation - Upright bars over their labels (default) or sideways bars
 * @attr {boolean} stacked - Stacks the series in one bar per label
 * @attr {boolean} show-values - Writes each value on its bar where it fits
 */
export class BarChart extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['orientation', 'stacked', 'show-values'];
    }

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

    /** Formats the values written on the chart; whole amounts with the unit by default. */
    get valueFormat(): (value: number) => string {
        return this.valueFormatter;
    }

    set valueFormat(value: (value: number) => string) {
        this.valueFormatter = value;
        this.redraw();
    }

    connectedCallback(): void {
        installStyles(this, 'r-bar-chart', css);
        this.width.observe();
        this.draw();
    }

    disconnectedCallback(): void {
        this.width.disconnect();
    }

    attributeChangedCallback(): void {
        this.redraw();
    }

    private redraw(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        this.replaceChildren();
        const data = this.chartData;
        if (!data) {
            return;
        }
        const orientation = this.getAttribute('orientation') ?? 'vertical';
        if (orientation !== 'vertical' && orientation !== 'horizontal') {
            reportProblem('r-bar-chart', `orientation must be "vertical" or "horizontal", not "${orientation}"`);
            return;
        }
        if (!this.isValid(data)) {
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
        const horizontal = orientation === 'horizontal';
        const stacked = this.hasAttribute('stacked');
        const plot = drawBarPlot(data, {
            width: this.width.take(),
            horizontal,
            stacked,
            showValues: this.hasAttribute('show-values'),
            axisFormat: this.axisFormatter,
            valueFormat: this.valueFormatter,
        });
        const readout = document.createElement('div');
        readout.className = 'readout';
        readout.hidden = true;
        this.bandsOf(plot, data, readout, stacked);
        figure.append(plot.svg, this.drawLegend(data), readout, this.drawTable(data, stacked));
    }

    /** One invisible band per label, so pointing anywhere in it selects the label, bars or not. */
    private bandsOf(plot: BarPlot, data: ChartData, readout: HTMLElement, stacked: boolean): void {
        const { svg } = plot;
        data.labels.forEach((_, label) => {
            const area = plot.band(label);
            const band = element('rect', { x: area.left, y: area.top, width: area.width, height: area.height });
            band.classList.add('band');
            const show = (event: Event): void => {
                const pointer = event as PointerEvent;
                svg.querySelectorAll('.band.selected').forEach((other) => other.classList.remove('selected'));
                band.classList.add('selected');
                this.fillReadout(readout, data, label, stacked);
                const box = this.getBoundingClientRect();
                const x = pointer.clientX - box.left;
                const left = box.width > 0 && x > box.width * 0.6;
                readout.classList.toggle('left', left);
                readout.style.left = `${String(x)}px`;
                readout.style.top = `${String(pointer.clientY - box.top)}px`;
                readout.hidden = false;
            };
            band.addEventListener('pointerenter', show);
            band.addEventListener('pointermove', show);
            svg.append(band);
        });
        svg.addEventListener('pointerleave', () => {
            svg.querySelectorAll('.band.selected').forEach((other) => other.classList.remove('selected'));
            readout.hidden = true;
        });
    }

    private fillReadout(readout: HTMLElement, data: ChartData, label: number, stacked: boolean): void {
        const title = document.createElement('div');
        title.className = 'readout-label';
        title.textContent = data.labels[label];
        const rows = data.series.map((series) => {
            const value = series.values[label];
            const row = document.createElement('div');
            row.textContent = `${series.name}: ${value === null ? text('noData') : this.valueFormatter(value)}`;
            return row;
        });
        if (stacked && stackedSeries(data).length > 1) {
            const total = document.createElement('div');
            total.textContent = `${text('total')}: ${this.valueFormatter(totalAt(data, label))}`;
            rows.push(total);
        }
        readout.replaceChildren(title, ...rows);
    }

    /** The same figures as the drawing, for screen readers: a row per label and a column per series, plus the total when stacked. */
    private drawTable(data: ChartData, stacked: boolean): HTMLTableElement {
        const withTotal = stacked && stackedSeries(data).length > 1;
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
        if (withTotal) {
            const cell = document.createElement('th');
            cell.scope = 'col';
            cell.textContent = text('total');
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
            if (withTotal) {
                row.insertCell().textContent = this.valueFormatter(totalAt(data, label));
            }
        });
        return table;
    }

    private isValid(data: ChartData): boolean {
        if (typeof data.summary !== 'string' || data.summary === '') {
            reportProblem('r-bar-chart', 'the data needs a summary');
            return false;
        }
        if (data.series.length > seriesColours) {
            reportProblem('r-bar-chart', `${String(data.series.length)} series is more than the ${String(seriesColours)} the theme colours`);
            return false;
        }
        for (const series of data.series) {
            if (series.values.length !== data.labels.length) {
                reportProblem('r-bar-chart', `series "${series.name}" has ${String(series.values.length)} values for ${String(data.labels.length)} labels`,
                );
                return false;
            }
            if (series.values.some((value) => value !== null && !Number.isFinite(value))) {
                reportProblem('r-bar-chart', `series "${series.name}" has a value that is not a number`);
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

if (!customElements.get('r-bar-chart')) {
    customElements.define('r-bar-chart', BarChart);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-bar-chart': BarChart;
    }
}
