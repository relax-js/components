const svgNamespace = 'http://www.w3.org/2000/svg';

/** The width drawn when the chart has not been laid out yet. */
export const defaultWidth = 640;
/** The narrowest width a chart lays itself out for; a narrower chart is this drawing scaled down. */
export const narrowestWidth = 160;
export const height = 230;
/** An estimate of a character's width at the axis font size, used to find the room text needs. */
export const characterWidth = 6.5;
/** The height of a line of axis text. */
export const textHeight = 14;
/** Space between an axis label and the plot. */
export const labelGap = 6;
/** The least room left of the plot for the value axis; wider only where a label needs more. */
export const valueAxisRoom = 72;

export interface Pad {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export function element<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number>): SVGElementTagNameMap[K] {
    const created = document.createElementNS(svgNamespace, name);
    for (const [key, value] of Object.entries(attributes)) {
        created.setAttribute(key, String(value));
    }
    return created;
}

/** The room the text needs at the axis font size. */
export function textWidth(text: string): number {
    return text.length * characterWidth;
}

/** The widest of the texts. */
export function widestText(texts: string[]): number {
    return Math.max(0, ...texts.map(textWidth));
}

/** The text shortened with an ellipsis to fit the room, or the text itself where it fits. */
export function fitText(text: string, room: number): string {
    if (textWidth(text) <= room) {
        return text;
    }
    const characters = Math.max(1, Math.floor(room / characterWidth) - 1);
    return `${text.slice(0, characters).trimEnd()}…`;
}

/** An axis label, carrying its full text as a tooltip where it had to be shortened. */
export function labelText(attributes: Record<string, string | number>, text: string, room: number): SVGTextElement {
    const label = element('text', attributes);
    const shown = fitText(text, room);
    label.textContent = shown;
    if (shown !== text) {
        const title = element('title', {});
        title.textContent = text;
        label.append(title);
    }
    return label;
}

/**
 * Room around a plot of values over labels: the widest value label at the left, and a label
 * centred under each end point, so the first and last stay inside the chart.
 */
export function plotPad(labels: string[], values: string[]): Pad {
    const edge = 12;
    // A single label sits in the middle, away from either end.
    const atEnds = labels.length > 1;
    const halfFirst = atEnds ? textWidth(labels[0]) / 2 + 2 : 0;
    const halfLast = atEnds ? textWidth(labels[labels.length - 1]) / 2 + 2 : 0;
    return {
        left: Math.ceil(Math.max(widestText(values) + labelGap + 2, halfFirst, valueAxisRoom)),
        right: Math.ceil(Math.max(halfLast, edge)),
        top: edge,
        bottom: 28,
    };
}

/** How many labels apart the shown labels are, so the ones shown fit side by side in `room` each `spacing` apart. */
export function labelStep(spacing: number, room: number): number {
    return spacing <= 0 ? 1 : Math.max(1, Math.ceil(room / spacing));
}

/**
 * Keeps a chart drawn at its own width, so text and markers are never scaled with the drawing:
 * the chart takes the width when it draws, and is redrawn when its width changes.
 */
export class ChartWidth {
    private drawnWidth = 0;
    private readonly observer: ResizeObserver | undefined;

    constructor(private readonly host: HTMLElement, redraw: () => void) {
        this.observer = typeof ResizeObserver === 'undefined'
            ? undefined
            : new ResizeObserver(() => {
                if (this.host.isConnected && this.measure() !== this.drawnWidth) {
                    redraw();
                }
            });
    }

    observe(): void {
        this.observer?.observe(this.host);
    }

    disconnect(): void {
        this.observer?.disconnect();
    }

    /** The width to draw at now. */
    take(): number {
        this.drawnWidth = this.measure();
        return this.drawnWidth;
    }

    private measure(): number {
        const width = Math.round(this.host.clientWidth);
        return width === 0 ? defaultWidth : Math.max(narrowestWidth, width);
    }
}
