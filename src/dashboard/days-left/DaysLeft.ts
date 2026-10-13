import { formatValue } from '../../foundations/formatting/formatting';
import { text, whenLanguageChanges } from '../../foundations/text/text';
import type { Tone } from '../../foundations/tone/tone';

const defaultUrgent = 7;
const defaultSoon = 14;

/**
 * The tone of a deadline: `danger` when it is at most `urgent` days away (or has passed),
 * `warn` when at most `soon`, `muted` beyond that. Throws when `days` is not a whole number.
 */
export function deadlineTone(days: number, urgent = defaultUrgent, soon = defaultSoon): Tone {
    if (!Number.isInteger(days)) {
        throw new RangeError(`days must be a whole number, not ${String(days)}`);
    }
    if (days <= urgent) {
        return 'danger';
    }
    return days <= soon ? 'warn' : 'muted';
}

function parseNumber(name: string, raw: string | null, fallback: number): number {
    if (raw === null) {
        return fallback;
    }
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(value)) {
        throw new Error(`${name} "${raw}" is not a number`);
    }
    return value;
}

/**
 * Counts days down to a deadline, with a tone that grows more urgent as it nears.
 *
 * @example
 * ```html
 * <r-days-left days="5"></r-days-left>
 * ```
 *
 * @attr {number} days - Whole days left; zero or negative once the deadline has passed
 * @attr {number} urgent - At most this many days is `danger` (default 7)
 * @attr {number} soon - At most this many days is `warn` (default 14)
 */
export class DaysLeft extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['days', 'urgent', 'soon'];
    }

    connectedCallback(): void {
        this.stopListening = whenLanguageChanges(this.redraw);
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    private stopListening?: () => void;
    private readonly redraw = () => this.draw();

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        const raw = this.getAttribute('days');
        if (raw !== null && raw.includes('{{')) {
            return;
        }
        this.textContent = '';
        delete this.dataset.tone;
        try {
            const days = Number(raw);
            if (raw === null || raw.trim() === '' || !Number.isInteger(days)) {
                throw new Error(`days "${raw ?? ''}" is not a whole number`);
            }
            const urgent = parseNumber('urgent', this.getAttribute('urgent'), defaultUrgent);
            const soon = parseNumber('soon', this.getAttribute('soon'), defaultSoon);
            if (urgent > soon) {
                throw new RangeError(`urgent (${urgent}) must not be larger than soon (${soon})`);
            }
            const n = formatValue(Math.abs(days));
            this.textContent = days < 0 ? text('daysOverdue', { count: -days, n }) : text('days', { count: days, n });
            this.dataset.tone = deadlineTone(days, urgent, soon);
        } catch (error) {
            console.error(`r-days-left: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

if (!customElements.get('r-days-left')) {
    customElements.define('r-days-left', DaysLeft);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-days-left': DaysLeft;
    }
}
