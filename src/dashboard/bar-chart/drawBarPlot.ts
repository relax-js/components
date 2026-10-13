import type { ChartData } from './BarChart';
import { element, height, pad, width } from './chartSvg';

const textHeight = 12;
const characterWidth = 6.5;
const valueGap = 4;

/**
 * The axis for the given extremes: it starts at zero (or the lowest value below it) and ends on a
 * round figure, each step being 1, 2, 2.5, 5 or 10 × 10ⁿ.
 */
export function niceScale(min: number, max: number, steps = 4): { bottom: number; top: number; step: number } {
    const high = Math.max(max, 0);
    const low = Math.min(min, 0);
    if (high === 0 && low === 0) {
        return { bottom: 0, top: 1, step: 1 };
    }
    const raw = (high - low) / steps;
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= raw * (1 - 1e-9)) ?? 10 * power;
    return { bottom: Math.floor(low / step) * step + 0, top: Math.ceil(high / step) * step + 0, step };
}

interface Segment {
    from: number;
    to: number;
    value: number;
}

interface Plot {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface Layout {
    horizontal: boolean;
    stacked: boolean;
    plot: Plot;
    bandSize: number;
    valueExtent: number;
    along: (value: number) => number;
    bandStart: (label: number) => number;
}

export interface PlotOptions {
    horizontal: boolean;
    stacked: boolean;
    showValues: boolean;
    axisFormat: (value: number) => string;
    valueFormat: (value: number) => string;
}

export function drawBarPlot(data: ChartData, options: PlotOptions): SVGSVGElement {
    const { horizontal, stacked } = options;
    const svg = element('svg', { viewBox: `0 0 ${String(width)} ${String(height)}`, 'aria-hidden': 'true' });
    const segments = segmentsOf(data, stacked);
    const ends = segments.flat(2).flatMap((segment) => [segment.from, segment.to]);
    const scale = niceScale(Math.min(0, ...ends), Math.max(0, ...ends));

    const plot = { left: pad.left, top: pad.top, width: width - pad.left - pad.right, height: height - pad.top - pad.bottom };
    const span = scale.top - scale.bottom;
    // Where a value sits along the value axis.
    const along = (value: number): number => {
        const fraction = (value - scale.bottom) / span;
        return horizontal ? plot.left + fraction * plot.width : plot.top + (1 - fraction) * plot.height;
    };
    const bandSize = (horizontal ? plot.height : plot.width) / data.labels.length;
    const layout: Layout = {
        horizontal,
        stacked,
        plot,
        bandSize,
        valueExtent: horizontal ? plot.width : plot.height,
        along,
        bandStart: (label) => (horizontal ? plot.top : plot.left) + label * bandSize,
    };

    drawValueAxis(svg, scale, layout, options.axisFormat);
    drawLabelAxis(svg, data, layout);
    drawBars(svg, data, segments, layout, options);
    drawThresholds(svg, data, layout);
    return svg;
}

/** The segments of each label's bars, one list per series (empty for threshold series). */
function segmentsOf(data: ChartData, stacked: boolean): Segment[][][] {
    const result: Segment[][][] = data.series.map(() => data.labels.map(() => []));
    data.labels.forEach((_, label) => {
        let positive = 0;
        let negative = 0;
        data.series.forEach((series, index) => {
            const value = series.values[label];
            if (series.threshold || value === null || value === undefined) {
                return;
            }
            if (!stacked) {
                result[index][label] = [{ from: 0, to: value, value }];
            } else if (value >= 0) {
                result[index][label] = [{ from: positive, to: positive + value, value }];
                positive += value;
            } else {
                result[index][label] = [{ from: negative, to: negative + value, value }];
                negative += value;
            }
        });
    });
    return result;
}

/** Grid and value axis. */
function drawValueAxis(svg: SVGSVGElement, scale: { bottom: number; top: number; step: number }, layout: Layout, format: (value: number) => string): void {
    const { horizontal, plot } = layout;
    const stepCount = Math.round((scale.top - scale.bottom) / scale.step);
    for (let i = 0; i <= stepCount; i++) {
        const value = scale.bottom + i * scale.step;
        const position = layout.along(value);
        const line = horizontal
            ? element('line', { x1: position, x2: position, y1: plot.top, y2: plot.top + plot.height })
            : element('line', { x1: plot.left, x2: plot.left + plot.width, y1: position, y2: position });
        line.classList.add(value === 0 ? 'zero' : 'grid');
        const label = element('text', horizontal ? { x: position, y: height - 8, 'text-anchor': 'middle' } : { x: pad.left - 6, y: position + 4, 'text-anchor': 'end' });
        label.classList.add('axis-label');
        label.textContent = format(value);
        svg.append(line, label);
    }
}

function drawLabelAxis(svg: SVGSVGElement, data: ChartData, layout: Layout): void {
    const { horizontal } = layout;
    data.labels.forEach((text, index) => {
        const centre = layout.bandStart(index) + layout.bandSize / 2;
        const label = element('text', horizontal ? { x: pad.left - 6, y: centre + 4, 'text-anchor': 'end' } : { x: centre, y: height - 8, 'text-anchor': 'middle' });
        label.classList.add('axis-label', 'label');
        label.textContent = text;
        svg.append(label);
    });
}

function drawBars(svg: SVGSVGElement, data: ChartData, segments: Segment[][][], layout: Layout, options: PlotOptions): void {
    const { stacked, bandSize } = layout;
    const barSeries = data.series.map((series, index) => ({ series, index })).filter((entry) => !entry.series.threshold);
    const slots = stacked ? 1 : barSeries.length;
    const groupSize = bandSize * (stacked ? 0.6 : 0.7);
    const barSize = groupSize / Math.max(slots, 1);
    barSeries.forEach(({ index }, slot) => {
        const group = element('g', {});
        group.classList.add('series', `series-${String(index + 1)}`);
        data.labels.forEach((_, label) => {
            const segment = segments[index][label][0] as Segment | undefined;
            if (!segment) {
                return;
            }
            const barStart = layout.bandStart(label) + (bandSize - groupSize) / 2 + (stacked ? 0 : slot * barSize);
            group.append(...drawBar(segment, barStart, barSize, layout, options));
        });
        svg.append(group);
    });
}

/** A bar, and its written value where the value is shown and fits. */
function drawBar(segment: Segment, barStart: number, barSize: number, layout: Layout, options: PlotOptions): SVGElement[] {
    const { horizontal, stacked, plot, bandSize, valueExtent, along } = layout;
    const a = along(segment.from);
    const b = along(segment.to);
    const low = Math.min(a, b);
    const length = Math.abs(a - b);
    const bar = horizontal
        ? element('rect', { x: low, y: barStart, width: length, height: barSize })
        : element('rect', { x: barStart, y: low, width: barSize, height: length });
    bar.classList.add('bar');
    if (!options.showValues) {
        return [bar];
    }
    const written = options.valueFormat(segment.value);
    const textLength = written.length * characterWidth;
    const fitted = placeValue({ horizontal, stacked, segment, written, textLength, a, b, barStart, barSize, bandSize, plot, valueExtent, along });
    return fitted ? [bar, fitted] : [bar];
}

/** The dashed line of each threshold series, edge to edge through the middle of the bands. */
function drawThresholds(svg: SVGSVGElement, data: ChartData, layout: Layout): void {
    data.series.forEach((series, index) => {
        if (!series.threshold) {
            return;
        }
        const group = element('g', {});
        group.classList.add('series', `series-${String(index + 1)}`);
        const line = element('polyline', { points: thresholdPoints(series.values, layout).join(' ') });
        line.classList.add('threshold');
        group.append(line);
        svg.append(group);
    });
}

function thresholdPoints(values: (number | null)[], layout: Layout): string[] {
    const { horizontal, plot, along } = layout;
    const points: string[] = [];
    const point = (position: number, value: number): void => {
        points.push(horizontal ? `${String(along(value))},${String(position)}` : `${String(position)},${String(along(value))}`);
    };
    const present = values.map((value, label) => ({ value, label })).filter((entry) => entry.value !== null);
    present.forEach(({ value, label }, order) => {
        const centre = layout.bandStart(label) + layout.bandSize / 2;
        if (order === 0) {
            point(horizontal ? plot.top : plot.left, value as number);
        }
        point(centre, value as number);
        if (order === present.length - 1) {
            point(horizontal ? plot.top + plot.height : plot.left + plot.width, value as number);
        }
    });
    return points;
}

/** A bar's value, or undefined where the text would not fit. */
function placeValue(c: {
    horizontal: boolean;
    stacked: boolean;
    segment: Segment;
    written: string;
    textLength: number;
    a: number;
    b: number;
    barStart: number;
    barSize: number;
    bandSize: number;
    plot: Plot;
    valueExtent: number;
    along: (value: number) => number;
}): SVGTextElement | undefined {
    const negative = c.segment.value < 0;
    const low = Math.min(c.a, c.b);
    const high = Math.max(c.a, c.b);
    const length = high - low;
    const across = c.horizontal ? textHeight : c.textLength;
    const lengthwise = c.horizontal ? c.textLength : textHeight;
    const centre = c.barStart + c.barSize / 2;
    let position: number;
    if (c.stacked) {
        // Written inside the segment.
        if (lengthwise > length || across > c.barSize) {
            return undefined;
        }
        position = (low + high) / 2;
    } else {
        if (across > c.bandSize) {
            return undefined;
        }
        const plotStart = c.horizontal ? c.plot.left : c.plot.top;
        const plotEnd = plotStart + c.valueExtent;
        // Past the end of the bar: right/below for horizontal positives, above for vertical positives.
        const pastEnd = c.horizontal === !negative ? high : low;
        const room = c.horizontal === !negative ? plotEnd - pastEnd : pastEnd - plotStart;
        if (lengthwise + valueGap > room) {
            return undefined;
        }
        const offset = (lengthwise + valueGap) / 2;
        position = c.horizontal === !negative ? pastEnd + offset : pastEnd - offset;
    }
    const attributes = c.horizontal
        ? { x: position, y: centre + 4, 'text-anchor': 'middle' }
        : { x: centre, y: position + 4, 'text-anchor': 'middle' };
    const label = element('text', attributes);
    label.classList.add('value');
    label.classList.toggle('inside', c.stacked);
    label.textContent = c.written;
    return label;
}
