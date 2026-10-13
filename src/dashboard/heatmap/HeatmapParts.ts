import { text } from '../../foundations/text/text';
import type { HeatmapValue } from './Heatmap';
import type { ScaleRange, Settings } from './HeatmapSettings';

export type ValueFormatter = (value: number) => string;

/** The figures for a screen reader: a row per row label, a column per column label, an empty cell where a value is missing. */
export function drawTable(rowLabels: string[], columnLabels: string[], cellValues: HeatmapValue[][], format: ValueFormatter): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'data-table';
    const head = table.createTHead().insertRow();
    head.append(document.createElement('td'));
    for (const label of columnLabels) {
        const header = document.createElement('th');
        header.scope = 'col';
        header.textContent = label;
        head.append(header);
    }
    const body = table.createTBody();
    rowLabels.forEach((label, rowIndex) => {
        const row = body.insertRow();
        const header = document.createElement('th');
        header.scope = 'row';
        header.textContent = label;
        row.append(header);
        for (const value of cellValues[rowIndex]) {
            const cell = row.insertCell();
            cell.textContent = typeof value === 'number' ? format(value) : '';
        }
    });
    return table;
}

/** The scale with its formatted ends (and midpoint when diverging), plus the missing cell's look when a cell is missing. */
export function drawLegend(settings: Settings, range: ScaleRange, anyMissing: boolean, format: ValueFormatter): HTMLElement {
    const legend = document.createElement('div');
    legend.className = 'scale-legend';
    const ramp = document.createElement('span');
    ramp.className = 'ramp';
    ramp.dataset.scale = settings.scale;
    const labels = document.createElement('span');
    labels.className = 'ramp-labels';
    const stops = settings.scale === 'diverging' ? [range.low, settings.midpoint, range.high] : [range.low, range.high];
    for (const stop of stops) {
        const label = document.createElement('span');
        label.textContent = format(stop);
        labels.append(label);
    }
    const scale = document.createElement('span');
    scale.className = 'scale';
    scale.append(ramp, labels);
    legend.append(scale);
    if (anyMissing) {
        const missing = document.createElement('span');
        missing.className = 'missing-key';
        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        const word = document.createElement('span');
        word.textContent = text('noData');
        missing.append(swatch, word);
        legend.append(missing);
    }
    return legend;
}

export function drawLabel(className: string, labelText: string): HTMLElement {
    const label = document.createElement('span');
    label.className = className;
    label.textContent = labelText;
    return label;
}

export function drawCell(settings: Settings, range: ScaleRange, value: HeatmapValue): HTMLElement {
    const cell = document.createElement('span');
    cell.className = 'cell';
    cell.dataset.scale = settings.scale;
    if (typeof value !== 'number') {
        cell.dataset.missing = '';
        return cell;
    }
    const clamped = Math.min(Math.max(value, range.low), range.high);
    if (settings.scale === 'sequential') {
        const span = range.high - range.low;
        cell.style.setProperty('--position', String(span === 0 ? 0 : (clamped - range.low) / span));
    } else {
        // The scale reaches as far below the midpoint as above it, so equal distances are equally strong.
        const reach = Math.max(settings.midpoint - range.low, range.high - settings.midpoint);
        const distance = clamped - settings.midpoint;
        cell.dataset.side = distance < 0 ? 'below' : 'above';
        cell.style.setProperty('--position', String(reach === 0 ? 0 : Math.abs(distance) / reach));
    }
    return cell;
}

/** Pointing at a cell names its row, its column and its value (the no-data word for a missing one); leaving the grid hides it. */
export function showReadoutOnHover(
    owner: HTMLElement,
    grid: HTMLElement,
    readout: HTMLElement,
    valueAt: (row: string, column: string) => HeatmapValue,
    format: ValueFormatter,
): void {
    grid.addEventListener('pointermove', (event) => {
        const cell = (event.target as Element).closest<HTMLElement>('.cell');
        if (cell === null) {
            readout.hidden = true;
            return;
        }
        const value = valueAt(cell.dataset.row!, cell.dataset.column!);
        const where = document.createElement('span');
        where.className = 'readout-cell';
        where.textContent = `${cell.dataset.row}, ${cell.dataset.column}`;
        const shown = document.createElement('span');
        shown.className = 'readout-value';
        shown.textContent = typeof value === 'number' ? format(value) : text('noData');
        readout.replaceChildren(where, shown);
        const bounds = owner.getBoundingClientRect();
        const x = ((event as MouseEvent).clientX ?? 0) - bounds.left;
        const y = ((event as MouseEvent).clientY ?? 0) - bounds.top;
        readout.dataset.flipped = '';
        if (x <= bounds.width * 0.6) {
            delete readout.dataset.flipped;
        }
        readout.style.left = `${x + (readout.hasAttribute('data-flipped') ? -12 : 12)}px`;
        readout.style.top = `${y + 12}px`;
        readout.hidden = false;
    });
    grid.addEventListener('pointerleave', () => {
        readout.hidden = true;
    });
}
