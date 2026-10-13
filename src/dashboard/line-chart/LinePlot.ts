import { niceScale } from '../bar-chart/BarChart';
import type { ChartData } from '../bar-chart/BarChart';
import { defaultWidth, element, height, labelGap, labelStep, plotPad, widestText } from '../bar-chart/chartSvg';
import type { Pad } from '../bar-chart/chartSvg';

const markerRadius = 4;

type Scale = ReturnType<typeof niceScale>;
type Series = ChartData['series'][number];
type Run = { index: number; value: number }[];

interface Projection {
    x: (index: number) => number;
    y: (value: number) => number;
}

/** What the plot needs from the chart that hosts it. */
export interface PlotHost {
    host: HTMLElement;
    readout: HTMLElement;
    axisFormat: (value: number) => string;
    fillReadout: (readout: HTMLElement, data: ChartData, label: number) => void;
}

/** Draws the plot `width` units wide, which the chart sets to its own width in pixels so text and markers keep their size. */
export function drawPlot(data: ChartData, plotHost: PlotHost, width = defaultWidth): SVGSVGElement {
    const svg = element('svg', { viewBox: `0 0 ${String(width)} ${String(height)}`, 'aria-hidden': 'true' });
    const present = data.series.flatMap((series) => series.values.filter((value): value is number => value !== null));
    const scale = niceScale(Math.min(0, ...present), Math.max(0, ...present));
    const stepCount = Math.round((scale.top - scale.bottom) / scale.step);
    const ticks = Array.from({ length: stepCount + 1 }, (_, i) => scale.bottom + i * scale.step);
    const pad = plotPad(data.labels, ticks.map(plotHost.axisFormat));
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const span = scale.top - scale.bottom;
    const count = data.labels.length;
    const projection: Projection = {
        x: (index) => pad.left + (count === 1 ? plotWidth / 2 : (plotWidth * index) / (count - 1)),
        y: (value) => pad.top + plotHeight * (1 - (value - scale.bottom) / span),
    };

    drawAxes(svg, data, { ticks, projection, width, pad, axisFormat: plotHost.axisFormat });
    data.series.forEach((series, index) => {
        svg.append(drawSeries(series, index, projection));
    });
    attachReadout(svg, data, { projection, plotHeight, width, pad }, plotHost);
    return svg;
}

interface Axes {
    ticks: number[];
    projection: Projection;
    width: number;
    pad: Pad;
    axisFormat: (value: number) => string;
}

function drawAxes(svg: SVGSVGElement, data: ChartData, { ticks, projection: { x, y }, width, pad, axisFormat }: Axes): void {
    for (const value of ticks) {
        const line = element('line', { x1: pad.left, x2: width - pad.right, y1: y(value), y2: y(value) });
        line.classList.add(value === 0 ? 'zero' : 'grid');
        const label = element('text', { x: pad.left - labelGap, y: y(value) + 4, 'text-anchor': 'end' });
        label.classList.add('axis-label');
        label.textContent = axisFormat(value);
        svg.append(line, label);
    }
    // Every nth label is shown when they do not all fit side by side.
    const spacing = data.labels.length > 1 ? x(1) - x(0) : Infinity;
    const every = labelStep(spacing, widestText(data.labels) + 2 * labelGap);
    data.labels.forEach((labelText, index) => {
        if (index % every !== 0) {
            return;
        }
        const label = element('text', { x: x(index), y: height - 8, 'text-anchor': 'middle' });
        label.classList.add('axis-label', 'label');
        label.textContent = labelText;
        svg.append(label);
    });
}

function drawSeries(series: Series, index: number, projection: Projection): SVGGElement {
    const group = element('g', {});
    group.classList.add('series', `series-${String(index + 1)}`);
    group.classList.toggle('threshold', series.threshold === true);
    for (const run of presentRuns(series)) {
        group.append(...drawRun(run, series, projection));
    }
    if (!series.threshold) {
        group.append(...drawMarkers(series, projection));
    }
    return group;
}

// A missing value breaks the line, so each run of present values is drawn on its own.
function presentRuns(series: Series): Run[] {
    const runs: Run[] = [[]];
    series.values.forEach((value, at) => {
        if (value === null) {
            runs.push([]);
        } else {
            runs[runs.length - 1].push({ index: at, value });
        }
    });
    return runs.filter((points) => points.length > 0);
}

function drawRun(run: Run, series: Series, { x, y }: Projection): SVGPathElement[] {
    const elements: SVGPathElement[] = [];
    const path = run.map((point, at) => `${at === 0 ? 'M' : 'L'}${String(x(point.index))},${String(y(point.value))}`).join('');
    if (series.area && !series.threshold) {
        const last = run[run.length - 1];
        const area = element('path', { d: `${path}L${String(x(last.index))},${String(y(0))}L${String(x(run[0].index))},${String(y(0))}Z` });
        area.classList.add('area');
        elements.push(area);
    }
    const line = element('path', { d: path });
    line.classList.add('line');
    elements.push(line);
    return elements;
}

function drawMarkers(series: Series, { x, y }: Projection): SVGCircleElement[] {
    const markers: SVGCircleElement[] = [];
    series.values.forEach((value, at) => {
        if (value !== null) {
            const marker = element('circle', { cx: x(at), cy: y(value), r: markerRadius });
            marker.classList.add('marker');
            markers.push(marker);
        }
    });
    return markers;
}

function nearestLabel(count: number, x: (index: number) => number, pointerX: number): number {
    let nearest = 0;
    for (let i = 1; i < count; i++) {
        if (Math.abs(x(i) - pointerX) < Math.abs(x(nearest) - pointerX)) {
            nearest = i;
        }
    }
    return nearest;
}

interface Frame {
    projection: Projection;
    plotHeight: number;
    width: number;
    pad: Pad;
}

function attachReadout(svg: SVGSVGElement, data: ChartData, { projection: { x }, plotHeight, width, pad }: Frame, plotHost: PlotHost): void {
    const { host, readout, fillReadout } = plotHost;
    const crosshair = element('line', { y1: pad.top, y2: pad.top + plotHeight });
    crosshair.classList.add('crosshair');
    crosshair.setAttribute('visibility', 'hidden');
    svg.append(crosshair);
    const hide = (): void => {
        crosshair.setAttribute('visibility', 'hidden');
        readout.hidden = true;
    };
    // The pointer anywhere in the plot's height selects the nearest label.
    svg.addEventListener('pointermove', (event) => {
        const box = svg.getBoundingClientRect();
        if (box.width === 0) {
            return;
        }
        const pointerX = ((event.clientX - box.left) / box.width) * width;
        if (pointerX < pad.left || pointerX > width - pad.right) {
            hide();
            return;
        }
        const nearest = nearestLabel(data.labels.length, x, pointerX);
        crosshair.setAttribute('x1', String(x(nearest)));
        crosshair.setAttribute('x2', String(x(nearest)));
        crosshair.setAttribute('visibility', 'visible');
        fillReadout(readout, data, nearest);
        const hostBox = host.getBoundingClientRect();
        const left = event.clientX - hostBox.left;
        readout.classList.toggle('left', hostBox.width > 0 && left > hostBox.width * 0.6);
        readout.style.left = `${String(left)}px`;
        readout.style.top = `${String(event.clientY - hostBox.top)}px`;
        readout.hidden = false;
    });
    svg.addEventListener('pointerleave', hide);
}
