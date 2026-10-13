import { compareYears, type Better } from '../kpi-meter/KpiMeter';
import '../line-chart/LineChart';
import type { ChartData } from '../bar-chart/BarChart';
import { formatValue } from '../../foundations/formatting/formatting';
import { installStyles } from '../../foundations/styles';
import { text, whenLanguageChanges } from '../../foundations/text/text';

const attributeNames = ['label', 'value', 'previous', 'better', 'period'];

function parseFigure(name: string, raw: string): number {
    const figure = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(figure)) {
        throw new Error(`${name} "${raw}" is not a number`);
    }
    return figure;
}

const css = `
r-stat-tile {
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    padding: var(--card-padding);
    border: var(--card-border);
    border-radius: var(--card-radius);
    box-shadow: none;

    &:empty {
        display: none;
    }

    & .trend {
        height: 3rem;

        & svg {
            height: 100%;
        }

        & .legend {
            display: none;
        }
    }
}
`;

/**
 * One key figure in a card-sized tile: the label, the value, and the change against an earlier period.
 *
 * @example
 * ```html
 * <r-stat-tile label="Revenue" value="1285400" previous="1150000" period="last month"></r-stat-tile>
 * ```
 *
 * @attr {string} label - What the figure is
 * @attr {number} value - This period's figure
 * @attr {number} previous - The figure for the period compared against; without it no change is shown
 * @attr {higher|lower} better - Whether a rise is good news (default `higher`)
 * @attr {string} period - Name of the period compared against, shown as given (default "last year")
 */
export class StatTile extends HTMLElement {
    static get observedAttributes(): string[] {
        return attributeNames;
    }

    private stopListening: (() => void) | undefined;
    private trendData: ChartData | undefined;

    /** Chart data drawn as a sparkline under the figure; without it no space is taken. */
    get trend(): ChartData | undefined {
        return this.trendData;
    }

    set trend(value: ChartData | undefined) {
        this.trendData = value;
        if (this.isConnected) {
            this.draw();
        }
    }

    connectedCallback(): void {
        installStyles(this, 'r-stat-tile', css);
        this.stopListening = whenLanguageChanges(() => this.draw());
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        const raw = attributeNames.map((name) => this.getAttribute(name));
        if (raw.some((attribute) => attribute !== null && attribute.includes('{{'))) {
            return;
        }
        this.textContent = '';
        try {
            const [label, valueRaw, previousRaw, betterRaw, period] = raw;
            if (label === null || label.trim() === '') {
                throw new Error('the label is missing');
            }
            const value = parseFigure('value', valueRaw ?? '');
            const previous = previousRaw === null ? null : parseFigure('previous', previousRaw);
            const better = betterRaw ?? 'higher';
            if (better !== 'higher' && better !== 'lower') {
                throw new RangeError(`better must be "higher" or "lower", not "${better}"`);
            }

            this.append(part('div', 'label', label), part('div', 'value', formatValue(value)));
            if (previous !== null) {
                const comparison = compareYears(value, previous, better as Better);
                const change = part(
                    'div',
                    'change',
                    text('changeAgainstPeriod', {
                        change: comparison.change,
                        period: period ?? text('lastYear'),
                    }),
                );
                change.dataset.tone = comparison.tone;
                this.append(change);
            }
            if (this.trendData !== undefined) {
                drawTrend(this, this.trendData);
            }
        } catch (error) {
            this.textContent = '';
            console.error(`r-stat-tile: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/** Draws the trend as a small line chart; a chart that cannot draw the data renders nothing, which is reported. */
function drawTrend(host: HTMLElement, data: ChartData): void {
    const chart = document.createElement('r-line-chart');
    chart.className = 'trend';
    host.append(chart);
    chart.data = data;
    if (chart.childElementCount === 0) {
        throw new Error('the trend cannot be drawn');
    }
}

function part(tag: string, className: string, content: string): HTMLElement {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = content;
    return element;
}

if (!customElements.get('r-stat-tile')) {
    customElements.define('r-stat-tile', StatTile);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-stat-tile': StatTile;
    }
}
