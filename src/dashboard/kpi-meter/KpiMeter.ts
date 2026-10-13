import { formatValue, formatting } from '../../foundations/formatting/formatting';
import { installStyles } from '../../foundations/styles';
import { text } from '../../foundations/text/text';
import type { Tone } from '../../foundations/tone/tone';

const minus = '−';
const headroom = 1.15;

export type Better = 'higher' | 'lower';

export interface YearComparison {
    /** The change from last year as a signed whole percent, such as `+12 %`. */
    change: string;
    tone: Tone;
    /** This year as a percentage of the bar's scale. */
    fill: number;
    /** Last year as a percentage of the bar's scale. */
    mark: number;
}

function writeChange(percent: number): string {
    const digits = new Intl.NumberFormat(formatting().locale, { style: 'percent', maximumFractionDigits: 0 });
    const magnitude = digits.format(Math.abs(percent) / 100);
    if (percent === 0) {
        return '±' + magnitude;
    }
    return (percent < 0 ? minus : '+') + magnitude;
}

/**
 * Compares this year's figure with last year's: the change as a signed whole percent, its tone,
 * and where the fill and the mark sit on a bar. Throws for input that is not a finite number
 * or a `better` other than `higher` or `lower`.
 */
export function compareYears(value: number, previous: number, better: Better): YearComparison {
    if (!Number.isFinite(value)) {
        throw new RangeError('r-kpi-meter: value must be a finite number');
    }
    if (!Number.isFinite(previous)) {
        throw new RangeError('r-kpi-meter: previous must be a finite number');
    }
    if (better !== 'higher' && better !== 'lower') {
        throw new RangeError(`r-kpi-meter: better must be "higher" or "lower", not "${String(better)}"`);
    }
    // Taken against the size of last year's figure, so a rise from -100 to 50 is +150.
    const percent = previous === 0 ? 0 : Math.round(((value - previous) / Math.abs(previous)) * 100) || 0;
    const rose = percent > 0;
    const tone: Tone = percent === 0 || rose === (better === 'higher') ? 'ok' : 'danger';
    const scale = Math.max(value, previous, 1) * headroom;
    return {
        change: writeChange(percent),
        tone,
        fill: (Math.max(value, 0) / scale) * 100,
        mark: (Math.max(previous, 0) / scale) * 100,
    };
}

function parseFigure(name: string, raw: string | null): number {
    const figure = Number(raw);
    if (raw === null || raw.trim() === '' || !Number.isFinite(figure)) {
        throw new Error(`${name} "${raw ?? ''}" is not a number`);
    }
    return figure;
}

const css = `
r-kpi-meter {
    display: block;

    & .figures {
        display: flex;
        gap: 0.5em;
        align-items: baseline;
    }

    & .bar {
        position: relative;
        height: 0.5em;
        background: color-mix(in srgb, currentColor 12%, transparent);
    }

    & .this-year {
        position: absolute;
        inset: 0 auto 0 0;
        width: var(--fill);
        background: currentColor;
    }

    & .last-year {
        position: absolute;
        inset: -0.2em auto -0.2em var(--mark);
        width: 2px;
        background: currentColor;
    }
}
`;

/**
 * One key figure for this period next to the same period last year.
 *
 * @example
 * ```html
 * <r-kpi-meter label="Revenue" value="1285400" previous="1150000"></r-kpi-meter>
 * ```
 *
 * @attr {string} label - What the figure is
 * @attr {number} value - This period's figure
 * @attr {number} previous - The same period last year
 * @attr {higher|lower} better - Whether a rise is good news (default `higher`)
 */
export class KpiMeter extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['label', 'value', 'previous', 'better'];
    }

    connectedCallback(): void {
        installStyles(this, 'r-kpi-meter', css);
        document.addEventListener('localechange', this.redraw);
        this.draw();
    }

    disconnectedCallback(): void {
        document.removeEventListener('localechange', this.redraw);
    }

    private readonly redraw = () => this.draw();

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        const attributes = ['label', 'value', 'previous', 'better'].map((name) => this.getAttribute(name));
        if (attributes.some((raw) => raw !== null && raw.includes('{{'))) {
            return;
        }
        this.textContent = '';
        try {
            const label = attributes[0];
            if (label === null || label.trim() === '') {
                throw new Error('the label is missing');
            }
            const value = parseFigure('value', attributes[1]);
            const previous = parseFigure('previous', attributes[2]);
            const better = attributes[3] ?? 'higher';
            if (better !== 'higher' && better !== 'lower') {
                throw new RangeError(`better must be "higher" or "lower", not "${better}"`);
            }
            const comparison = compareYears(value, previous, better);

            const labelElement = part('div', 'label', label);
            const change = part('span', 'change', comparison.change);
            change.dataset.tone = comparison.tone;
            const figures = part('div', 'figures');
            figures.append(part('span', 'value', formatValue(value)), change);

            const bar = part('div', 'bar');
            bar.dataset.tone = comparison.tone;
            bar.setAttribute('aria-hidden', 'true');
            bar.style.setProperty('--fill', `${comparison.fill}%`);
            bar.style.setProperty('--mark', `${comparison.mark}%`);
            bar.append(part('div', 'this-year'), part('div', 'last-year'));

            const previousText = part('div', 'previous', text('previousYear', { previous: formatValue(previous) }));
            this.append(labelElement, figures, bar, previousText);
        } catch (error) {
            this.textContent = '';
            console.error(`r-kpi-meter: ${error instanceof Error ? error.message.replace(/^r-kpi-meter: /, '') : String(error)}`);
        }
    }
}

function part(tag: string, className: string, content = ''): HTMLElement {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = content;
    return element;
}

if (!customElements.get('r-kpi-meter')) {
    customElements.define('r-kpi-meter', KpiMeter);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-kpi-meter': KpiMeter;
    }
}
