import { text } from '../../foundations/text/text';
import type { AreaChartData, AreaChartSeries } from './AreaChart';

export const width = 640;
export const height = 230;
export const pad = { left: 72, right: 12, top: 12, bottom: 28 };
const SVG = 'http://www.w3.org/2000/svg';

/** Maps data positions and values to chart coordinates. */
export interface Plot {
    plotHeight: number;
    x: (i: number) => number;
    y: (v: number) => number;
    line: (values: number[]) => string;
}

export interface Scale {
    bottom: number;
    top: number;
    step: number;
}

export interface Edges {
    bottom: number[];
    top: number[];
}

export function createPlot(count: number, scale: Scale): Plot {
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const x = (i: number) => pad.left + (count <= 1 ? plotWidth / 2 : (plotWidth * i) / (count - 1));
    const y = (v: number) => pad.top + plotHeight * (1 - (v - scale.bottom) / (scale.top - scale.bottom));
    const line = (values: number[]) => values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join('');
    return { plotHeight, x, y, line };
}

/** Cumulative bottom and top edge of each stacked band; the first sits on zero. */
export function stackEdges(stacked: AreaChartSeries[], count: number): Edges[] {
    const edges: Edges[] = [];
    let running: number[] = new Array<number>(count).fill(0);
    for (const series of stacked) {
        const top = running.map((v, i) => v + series.values[i]);
        edges.push({ bottom: running, top });
        running = top;
    }
    return edges;
}

export function createSvg(): SVGSVGElement {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('aria-hidden', 'true');
    return svg;
}

export function appendAxes(
    svg: SVGSVGElement,
    data: AreaChartData,
    plot: Plot,
    scale: Scale,
    axisFormatter: (value: number) => string
): void {
    const { y, x } = plot;
    for (let value = scale.bottom; value <= scale.top + scale.step / 1000; value += scale.step) {
        const grid = document.createElementNS(SVG, 'line');
        grid.setAttribute('class', value === 0 ? 'zero' : 'grid');
        grid.setAttribute('x1', String(pad.left));
        grid.setAttribute('x2', String(width - pad.right));
        grid.setAttribute('y1', String(y(value)));
        grid.setAttribute('y2', String(y(value)));
        const label = document.createElementNS(SVG, 'text');
        label.setAttribute('class', 'axis-label');
        label.setAttribute('x', String(pad.left - 8));
        label.setAttribute('y', String(y(value) + 4));
        label.setAttribute('text-anchor', 'end');
        label.textContent = axisFormatter(value);
        svg.append(grid, label);
    }
    data.labels.forEach((text, i) => {
        const label = document.createElementNS(SVG, 'text');
        label.setAttribute('x', String(x(i)));
        label.setAttribute('y', String(height - 8));
        label.setAttribute('text-anchor', 'middle');
        label.textContent = text;
        svg.append(label);
    });
}

function createSeriesGroup(series: AreaChartSeries, number: number): SVGGElement {
    const group = document.createElementNS(SVG, 'g');
    group.setAttribute('class', `series series-${number}`);
    group.dataset.name = series.name;
    return group;
}

export function appendSeries(
    svg: SVGSVGElement,
    data: AreaChartData,
    stacked: AreaChartSeries[],
    thresholds: AreaChartSeries[],
    edges: Edges[],
    plot: Plot
): void {
    const { x, y, line } = plot;
    stacked.forEach((series, index) => {
        const { bottom: below, top: above } = edges[index];
        const group = createSeriesGroup(series, data.series.indexOf(series) + 1);
        const reverse = below.map((v, i) => `L${x(i)},${y(v)}`).reverse().join('');
        const area = document.createElementNS(SVG, 'path');
        area.setAttribute('class', 'area');
        area.setAttribute('d', `${line(above)}${reverse}Z`);
        const edge = document.createElementNS(SVG, 'path');
        edge.setAttribute('class', 'line');
        edge.setAttribute('d', line(above));
        group.append(area, edge);
        svg.append(group);
    });
    for (const series of thresholds) {
        const group = createSeriesGroup(series, data.series.indexOf(series) + 1);
        group.classList.add('threshold');
        const edge = document.createElementNS(SVG, 'path');
        edge.setAttribute('class', 'line');
        edge.setAttribute('d', line(series.values));
        group.append(edge);
        svg.append(group);
    }
}

/** The label index nearest the pointer, so nobody has to hit a point exactly. */
function nearestIndex(plot: Plot, count: number, pointerX: number): number {
    let nearest = 0;
    for (let i = 1; i < count; i++) {
        if (Math.abs(plot.x(i) - pointerX) < Math.abs(plot.x(nearest) - pointerX)) {
            nearest = i;
        }
    }
    return nearest;
}

function fillReadout(
    readout: HTMLElement,
    host: HTMLElement,
    data: AreaChartData,
    nearest: number,
    event: PointerEvent,
    valueFormatter: (value: number) => string
): void {
    const title = document.createElement('div');
    title.className = 'readout-label';
    title.textContent = data.labels[nearest];
    const rows = data.series.map((series) => {
        const row = document.createElement('div');
        row.textContent = `${series.name}: ${valueFormatter(series.values[nearest])}`;
        return row;
    });
    const stacked = data.series.filter((series) => !series.threshold);
    if (stacked.length > 1) {
        const total = document.createElement('div');
        total.textContent = `${text('total')}: ${valueFormatter(stacked.reduce((sum, series) => sum + series.values[nearest], 0))}`;
        rows.push(total);
    }
    readout.replaceChildren(title, ...rows);
    const box = host.getBoundingClientRect();
    const left = event.clientX - box.left;
    readout.classList.toggle('left', box.width > 0 && left > box.width * 0.6);
    readout.style.left = `${left}px`;
    readout.style.top = `${event.clientY - box.top}px`;
    readout.hidden = false;
}

/** Adds the crosshair to the svg and wires pointer tracking; returns the read-out element. */
export function attachReadout(
    svg: SVGSVGElement,
    host: HTMLElement,
    data: AreaChartData,
    plot: Plot,
    valueFormatter: (value: number) => string
): HTMLElement {
    const count = data.labels.length;
    const crosshair = document.createElementNS(SVG, 'line');
    crosshair.setAttribute('class', 'crosshair');
    crosshair.setAttribute('y1', String(pad.top));
    crosshair.setAttribute('y2', String(pad.top + plot.plotHeight));
    crosshair.setAttribute('visibility', 'hidden');
    svg.append(crosshair);
    const readout = document.createElement('div');
    readout.className = 'readout';
    readout.hidden = true;
    const hide = (): void => {
        crosshair.setAttribute('visibility', 'hidden');
        readout.hidden = true;
    };
    svg.addEventListener('pointermove', (event) => {
        const box = svg.getBoundingClientRect();
        if (box.width === 0) {
            return;
        }
        const pointerX = ((event.clientX - box.left) / box.width) * width;
        if (pointerX < pad.left || pointerX > width - pad.right || count === 0) {
            hide();
            return;
        }
        const nearest = nearestIndex(plot, count, pointerX);
        crosshair.setAttribute('x1', String(plot.x(nearest)));
        crosshair.setAttribute('x2', String(plot.x(nearest)));
        crosshair.dataset.index = String(nearest);
        crosshair.setAttribute('visibility', 'visible');
        fillReadout(readout, host, data, nearest, event, valueFormatter);
    });
    svg.addEventListener('pointerleave', hide);
    return readout;
}

export function createLegend(data: AreaChartData): HTMLElement {
    const legend = document.createElement('ul');
    legend.className = 'legend';
    data.series.forEach((series, index) => {
        const item = document.createElement('li');
        item.className = `series-${index + 1}`;
        item.classList.toggle('threshold', series.threshold === true);
        item.textContent = series.name;
        legend.append(item);
    });
    return legend;
}
