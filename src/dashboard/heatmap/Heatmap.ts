import { formatValue } from '../../foundations/formatting/formatting';
import { installStyles } from '../../foundations/styles';
import { text } from '../../foundations/text/text';
import { drawCell, drawLabel, drawLegend, drawTable, showReadoutOnHover } from './HeatmapParts';
import { readSettings, scaleRange } from './HeatmapSettings';
import type { ScaleRange, Settings } from './HeatmapSettings';
import { dataIsValid } from './HeatmapValidation';

/** A cell's value; null or undefined marks a cell without a value. */
export type HeatmapValue = number | null | undefined;

const tag = 'r-heatmap';

const styles = /* css */ `
    r-heatmap {
        display: block;
        position: relative;

        .readout {
            position: absolute;
            z-index: 1;
            display: flex;
            flex-direction: column;
            pointer-events: none;
            white-space: nowrap;
            background: var(--surface-raised);
            border-radius: var(--floating-radius);
            padding: var(--floating-padding);
            box-shadow: var(--floating-shadow);
        }

        .readout[hidden] {
            display: none;
        }

        .readout[data-flipped] {
            transform: translateX(-100%);
        }

        .empty {
            padding: 1rem;
            text-align: center;
        }

        .data-table {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }

        .grid {
            display: grid;
            grid-template-columns: auto repeat(var(--columns), minmax(0, 1fr));
            gap: 2px;
        }

        .column-label,
        .row-label {
            color: var(--text-muted);
            font-size: 0.85em;
        }

        .row-label {
            align-self: center;
            padding-inline-end: var(--space-2);
        }

        .column-label {
            text-align: center;
        }

        .cell {
            min-height: 1.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: var(--radius-small);
            color: var(--text-primary);
            font-size: 0.85em;
        }

        .cell[data-scale="sequential"] {
            background: color-mix(in oklab, var(--scale-high) calc(var(--position) * 100%), var(--scale-low));
        }

        .cell[data-scale="diverging"][data-side="below"] {
            background: color-mix(in oklab, var(--scale-diverging-low) calc(var(--position) * 100%), var(--scale-diverging-mid));
        }

        .cell[data-scale="diverging"][data-side="above"] {
            background: color-mix(in oklab, var(--scale-diverging-high) calc(var(--position) * 100%), var(--scale-diverging-mid));
        }

        .cell[data-missing] {
            background: none;
            outline: 1px dashed var(--bd-strong);
            outline-offset: -1px;
        }

        .scale-legend {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: var(--space-2) 1rem;
            margin-block-start: var(--space-2);
            font-size: 0.85em;
            color: var(--text-muted);
        }

        .scale-legend .scale {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 10rem;
        }

        .scale-legend .ramp {
            height: 0.75rem;
            border-radius: var(--radius-small);
            background: linear-gradient(to right, var(--scale-low), var(--scale-high));
        }

        .scale-legend .ramp[data-scale="diverging"] {
            background: linear-gradient(to right, var(--scale-diverging-low), var(--scale-diverging-mid), var(--scale-diverging-high));
        }

        .scale-legend .ramp-labels {
            display: flex;
            justify-content: space-between;
        }

        .scale-legend .missing-key {
            display: flex;
            align-items: center;
            gap: var(--space-2);
        }

        .scale-legend .swatch {
            width: 1.5rem;
            height: 0.75rem;
            border-radius: var(--radius-small);
            outline: 1px dashed var(--bd-strong);
            outline-offset: -1px;
        }

        .cell .value[hidden] {
            display: none;
        }
    }
`;

/**
 * A grid of coloured cells, one per row and column, coloured by the cell's value on a
 * sequential or diverging scale. A cell without a value (null or undefined) is drawn with no fill.
 *
 * @example
 * ```typescript
 * const map = document.querySelector('r-heatmap')!;
 * map.rows = ['Mon', 'Tue'];
 * map.columns = ['09', '10', '11'];
 * map.values = [[1, 4, 9], [2, null, 6]];
 * ```
 *
 * @attr {sequential|diverging} scale - The colour scale, sequential by default
 * @attr {number} midpoint - Where a diverging scale turns, 0 by default
 * @attr {number} min - Fixes the low end of the scale
 * @attr {number} max - Fixes the high end of the scale
 * @attr {boolean} show-values - Writes each cell's value in the cell when it fits
 */
export class Heatmap extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['scale', 'midpoint', 'min', 'max', 'show-values'];
    }

    private rowLabels: string[] = [];
    private columnLabels: string[] = [];
    private cellValues: HeatmapValue[][] = [];
    private resizeObserver: ResizeObserver | undefined;
    private pageSummary = '';
    private valueFormatter: (value: number) => string = (value) => formatValue(value);

    connectedCallback(): void {
        installStyles(this, tag, styles);
        this.draw();
    }

    disconnectedCallback(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
    }

    attributeChangedCallback(): void {
        this.draw();
    }

    /** The row labels, in the order they are drawn. */
    get rows(): string[] {
        return this.rowLabels;
    }

    set rows(value: string[]) {
        this.rowLabels = value;
        this.draw();
    }

    /** The column labels, in the order they are drawn. */
    get columns(): string[] {
        return this.columnLabels;
    }

    set columns(value: string[]) {
        this.columnLabels = value;
        this.draw();
    }

    /** One array of values per row, one value per column. */
    get values(): HeatmapValue[][] {
        return this.cellValues;
    }

    set values(value: HeatmapValue[][]) {
        this.cellValues = value;
        this.draw();
    }

    /** What the heatmap says to a screen reader; required. */
    get summary(): string {
        return this.pageSummary;
    }

    set summary(value: string) {
        this.pageSummary = value;
        this.draw();
    }

    /** Formats the read-out, legend, cell and table values; plain numbers in the configured locale by default. */
    get valueFormat(): (value: number) => string {
        return this.valueFormatter;
    }

    set valueFormat(value: (value: number) => string) {
        this.valueFormatter = value;
        this.draw();
    }

    private draw(): void {
        if (!this.isConnected) {
            return;
        }
        this.resizeObserver?.disconnect();
        const settings = readSettings(this);
        if (settings === undefined || !dataIsValid(this.rowLabels, this.columnLabels, this.cellValues)) {
            this.replaceChildren();
            return;
        }
        if (typeof this.pageSummary !== 'string' || this.pageSummary === '') {
            console.error(`${tag}: the heatmap needs a summary`);
            this.replaceChildren();
            return;
        }
        const figure = document.createElement('div');
        figure.setAttribute('role', 'figure');
        figure.setAttribute('aria-label', this.pageSummary);
        if (this.rowLabels.length === 0 || this.columnLabels.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty';
            empty.textContent = text('noData');
            figure.append(empty);
            this.replaceChildren(figure);
            return;
        }

        const flat = this.cellValues.flat().filter((value): value is number => typeof value === 'number');
        const range = scaleRange(settings, flat);
        if (range === undefined) {
            this.replaceChildren();
            return;
        }

        const valueTexts: HTMLElement[] = [];
        const grid = this.drawGrid(settings, range, valueTexts);
        const anyMissing = this.cellValues.some((row) => row.some((value) => typeof value !== 'number'));
        const readout = document.createElement('div');
        readout.className = 'readout';
        readout.hidden = true;
        showReadoutOnHover(
            this,
            grid,
            readout,
            (row, column) => this.cellValues[this.rowLabels.indexOf(row)]?.[this.columnLabels.indexOf(column)],
            this.valueFormatter,
        );
        const plot = document.createElement('div');
        plot.className = 'plot';
        plot.setAttribute('aria-hidden', 'true');
        plot.append(grid, drawLegend(settings, range, anyMissing, this.valueFormatter), readout);
        figure.append(plot, drawTable(this.rowLabels, this.columnLabels, this.cellValues, this.valueFormatter));
        this.replaceChildren(figure);
        this.hideValuesThatDoNotFit(valueTexts);
    }

    private drawGrid(settings: Settings, range: ScaleRange, valueTexts: HTMLElement[]): HTMLElement {
        const grid = document.createElement('div');
        grid.className = 'grid';
        grid.style.setProperty('--columns', String(this.columnLabels.length));
        grid.append(document.createElement('span'));
        for (const label of this.columnLabels) {
            grid.append(drawLabel('column-label', label));
        }
        this.rowLabels.forEach((rowLabel, rowIndex) => {
            grid.append(drawLabel('row-label', rowLabel));
            this.cellValues[rowIndex].forEach((value, columnIndex) => {
                const cell = drawCell(settings, range, value);
                cell.dataset.row = rowLabel;
                cell.dataset.column = this.columnLabels[columnIndex];
                if (settings.showValues && typeof value === 'number') {
                    const text = document.createElement('span');
                    text.className = 'value';
                    text.textContent = this.valueFormatter(value);
                    cell.append(text);
                    valueTexts.push(text);
                }
                grid.append(cell);
            });
        });
        return grid;
    }

    /** A value that does not fit inside its cell is left out. Unmeasurable (not laid out) cells keep theirs. */
    private hideValuesThatDoNotFit(texts: HTMLElement[]): void {
        const fit = (): void => {
            for (const text of texts) {
                text.hidden = false;
                const cell = text.parentElement!;
                text.hidden = cell.clientWidth > 0 && text.scrollWidth > cell.clientWidth;
            }
        };
        fit();
        if (texts.length > 0 && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(fit);
            this.resizeObserver.observe(this);
        }
    }

}

if (!customElements.get(tag)) {
    customElements.define(tag, Heatmap);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-heatmap': Heatmap;
    }
}
