import { installStyles } from '../../foundations/styles';
import { text } from '../../foundations/text/text';
import { formatValue } from '../../foundations/formatting/formatting';
import type { ChartData } from '../bar-chart/BarChart';
import { element } from '../bar-chart/chartSvg';

const boxWidth = 100;
const boxHeight = 30;

const css = `
r-sparkline {
    display: inline-block;
    position: relative;
    width: var(--sparkline-width, 6rem);
    height: var(--sparkline-height, 1.5rem);
    min-height: 1px;
    vertical-align: middle;
}
r-sparkline [role="figure"] { width: 100%; height: 100%; }
r-sparkline svg { display: block; width: 100%; height: 100%; overflow: visible; }
r-sparkline .line { fill: none; stroke: var(--series-1); stroke-width: 2; vector-effect: non-scaling-stroke; }
r-sparkline .marker { fill: none; stroke: var(--series-1); stroke-width: 6; stroke-linecap: round; vector-effect: non-scaling-stroke; }
r-sparkline .readout {
    position: absolute;
    pointer-events: none;
    transform: translate(12px, -50%);
    background: Canvas;
    color: CanvasText;
    border-radius: var(--floating-radius);
    padding: var(--floating-padding);
    box-shadow: var(--floating-shadow);
    white-space: nowrap;
    z-index: 1;
}
r-sparkline .readout.left { transform: translate(calc(-100% - 12px), -50%); }
r-sparkline .readout-label { font-weight: bold; }
r-sparkline .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}
r-sparkline .empty { margin: 0; text-align: center; }
`;

/**
 * The trend of one series as a small line without axes, the latest value marked.
 *
 * @example
 * ```typescript
 * const spark = document.querySelector('r-sparkline')!;
 * spark.data = { labels: ['Jan', 'Feb', 'Mar'], series: [{ name: 'Cash', values: [4, 6, 5] }], summary: 'Cash over the quarter' };
 * ```
 */
export class Sparkline extends HTMLElement {
    private chartData: ChartData | undefined;
    private valueFormatter: (value: number) => string = (value) => formatValue(value);

    /** What to draw; setting it on a connected sparkline redraws it. */
    get data(): ChartData | undefined {
        return this.chartData;
    }

    set data(value: ChartData | undefined) {
        this.chartData = value;
        this.redraw();
    }

    /** Formats the read-out and table values; plain numbers in the configured locale by default. */
    get valueFormat(): (value: number) => string {
        return this.valueFormatter;
    }

    set valueFormat(value: (value: number) => string) {
        this.valueFormatter = value;
        this.redraw();
    }

    connectedCallback(): void {
        installStyles(this, 'r-sparkline', css);
        this.draw();
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
        figure.append(this.drawLine(data, readout), readout, this.drawTable(data));
    }

    private drawLine(data: ChartData, readout: HTMLElement): SVGSVGElement {
        const svg = element('svg', { viewBox: `0 0 ${String(boxWidth)} ${String(boxHeight)}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
        const values = data.series[0].values;
        const count = data.labels.length;
        const present = values.filter((value): value is number => value !== null);
        if (present.length === 0) {
            return svg;
        }
        const lowest = Math.min(...present);
        const highest = Math.max(...present);
        // Its own range: the lowest value at the bottom, the highest at the top; a level series sits in the middle.
        const x = (index: number): number => (count === 1 ? boxWidth / 2 : (boxWidth * index) / (count - 1));
        const y = (value: number): number => (highest === lowest ? boxHeight / 2 : boxHeight * (1 - (value - lowest) / (highest - lowest)));

        // A missing value breaks the line, so each run of present values is drawn on its own.
        let path = '';
        let previousPresent = false;
        values.forEach((value, index) => {
            if (value === null) {
                previousPresent = false;
                return;
            }
            path += `${previousPresent ? 'L' : 'M'}${String(x(index))},${String(y(value))}`;
            previousPresent = true;
        });
        const runs = path.split('M').filter((run) => run.includes('L'));
        for (const run of runs) {
            const line = element('path', { d: `M${run}` });
            line.classList.add('line');
            svg.append(line);
        }

        const last = values.reduce<number>((found, value, index) => (value === null ? found : index), -1);
        const marker = element('path', { d: `M${String(x(last))},${String(y(values[last] as number))}h0` });
        marker.classList.add('marker');
        svg.append(marker);

        svg.addEventListener('pointermove', (event) => {
            const box = svg.getBoundingClientRect();
            if (box.width === 0) {
                return;
            }
            const fraction = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
            const nearest = count === 1 ? 0 : Math.round(fraction * (count - 1));
            this.fillReadout(readout, data, nearest);
            const hostBox = this.getBoundingClientRect();
            const left = event.clientX - hostBox.left;
            readout.classList.toggle('left', hostBox.width > 0 && left > hostBox.width * 0.6);
            readout.style.left = `${String(left)}px`;
            readout.style.top = `${String(event.clientY - hostBox.top)}px`;
            readout.hidden = false;
        });
        svg.addEventListener('pointerleave', () => {
            readout.hidden = true;
        });
        return svg;
    }

    private fillReadout(readout: HTMLElement, data: ChartData, label: number): void {
        const title = document.createElement('div');
        title.className = 'readout-label';
        title.textContent = data.labels[label];
        const value = data.series[0].values[label];
        const row = document.createElement('div');
        row.textContent = `${data.series[0].name}: ${value === null ? text('noData') : this.valueFormatter(value)}`;
        readout.replaceChildren(title, row);
    }

    /** The same figures as the drawing, for screen readers: a row per label. */
    private drawTable(data: ChartData): HTMLTableElement {
        const table = document.createElement('table');
        table.className = 'visually-hidden';
        const head = table.createTHead().insertRow();
        head.append(document.createElement('th'));
        const heading = document.createElement('th');
        heading.scope = 'col';
        heading.textContent = data.series[0].name;
        head.append(heading);
        const body = table.createTBody();
        data.labels.forEach((labelText, label) => {
            const row = body.insertRow();
            const header = document.createElement('th');
            header.scope = 'row';
            header.textContent = labelText;
            row.append(header);
            const value = data.series[0].values[label];
            row.insertCell().textContent = value === null ? '' : this.valueFormatter(value);
        });
        return table;
    }

    private isValid(data: ChartData): boolean {
        if (typeof data.summary !== 'string' || data.summary === '') {
            console.error('r-sparkline: the data needs a summary');
            return false;
        }
        if (data.series.length > 1) {
            console.error(`r-sparkline: ${String(data.series.length)} series, a sparkline draws exactly one`);
            return false;
        }
        for (const series of data.series) {
            if (series.values.length !== data.labels.length) {
                console.error(
                    `r-sparkline: series "${series.name}" has ${String(series.values.length)} values for ${String(data.labels.length)} labels`,
                );
                return false;
            }
            if (series.values.some((value) => value !== null && !Number.isFinite(value))) {
                console.error(`r-sparkline: series "${series.name}" has a value that is not a number`);
                return false;
            }
        }
        return true;
    }
}

if (!customElements.get('r-sparkline')) {
    customElements.define('r-sparkline', Sparkline);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-sparkline': Sparkline;
    }
}
