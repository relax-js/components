import { reportProblem } from '../../foundations/problems/problems';
import { formatValue } from '../../foundations/formatting/formatting';
import { installStyles } from '../../foundations/styles';
import { text } from '../../foundations/text/text';
import { toneIcon } from '../../foundations/tone/tone';
import type { Tone } from '../../foundations/tone/tone';
import '../../foundations/icon/Icon';

const styles = /* css */ `
    r-meter {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        column-gap: var(--control-gap);
        color: var(--tone);

        .label {
            grid-row: 1;
            grid-column: 1 / -1;
            color: var(--text);
        }

        r-icon {
            grid-row: 2;
            grid-column: 1;
        }

        .figures {
            grid-row: 2;
            grid-column: 2;
        }

        .track {
            grid-row: 3;
            grid-column: 1 / -1;
            height: 0.5rem;
            overflow: hidden;
            border-radius: 0.25rem;
            background: var(--tone-soft);
        }

        .fill {
            height: 100%;
            background: var(--tone);
        }
    }
`;

const defaultWarnShare = 0.8;

function requiredNumber(name: string, raw: string | null): number {
    const value = Number(raw);
    if (raw === null || raw.trim() === '' || !Number.isFinite(value)) {
        throw new Error(`${name} "${raw ?? ''}" is not a number`);
    }
    return value;
}

function optionalNumber(name: string, raw: string | null): number | undefined {
    return raw === null ? undefined : requiredNumber(name, raw);
}

/**
 * Shows usage against a limit: a filled track, the figures "{value} of {limit}" and a tone that
 * grows stronger as usage nears the limit. A value above the limit fills the whole track.
 *
 * @example
 * ```html
 * <r-meter label="Storage" value="42" max="50" unit="GB"></r-meter>
 * ```
 *
 * @attr {string} label - What is measured; names the meter
 * @attr {number} value - Usage so far
 * @attr {number} max - The limit
 * @attr {number} warn-at - Usage from which the tone is `warn` (default 80 % of the limit)
 * @attr {number} danger-at - Usage from which the tone is `danger` (default the limit)
 * @attr {string} unit - Written after each figure exactly as given
 */
export class Meter extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['label', 'value', 'max', 'warn-at', 'danger-at', 'unit'];
    }

    connectedCallback(): void {
        installStyles(this, 'r-meter', styles);
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

    private clear(): void {
        this.replaceChildren();
        delete this.dataset.tone;
        for (const name of ['role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext']) {
            this.removeAttribute(name);
        }
    }

    private draw(): void {
        const rawValue = this.getAttribute('value');
        const rawMax = this.getAttribute('max');
        if ((rawValue !== null && rawValue.includes('{{')) || (rawMax !== null && rawMax.includes('{{'))) {
            return;
        }
        this.clear();
        try {
            const label = (this.getAttribute('label') ?? '').trim();
            if (label === '') {
                throw new Error('label is missing');
            }
            const value = requiredNumber('value', rawValue);
            const max = requiredNumber('max', rawMax);
            if (max <= 0) {
                throw new RangeError(`max (${max}) must be larger than zero`);
            }
            const warnAt = optionalNumber('warn-at', this.getAttribute('warn-at'));
            const dangerAt = optionalNumber('danger-at', this.getAttribute('danger-at'));
            if (warnAt !== undefined && dangerAt !== undefined && warnAt > dangerAt) {
                throw new RangeError(`warn-at (${warnAt}) must not be larger than danger-at (${dangerAt})`);
            }
            const danger = dangerAt ?? max;
            // A warning never starts above the danger threshold, so a lower value is never stronger.
            const warn = warnAt ?? Math.min(max * defaultWarnShare, danger);
            if (warnAt !== undefined && warnAt > danger) {
                throw new RangeError(`warn-at (${warnAt}) must not be larger than danger-at (${danger})`);
            }
            const tone: Tone = value >= danger ? 'danger' : value >= warn ? 'warn' : 'ok';

            const unit = this.getAttribute('unit') ?? '';
            const figure = (n: number) => (unit === '' ? formatValue(n) : `${formatValue(n)} ${unit}`);
            const figures = text('meterFigures', { value: figure(value), limit: figure(max) });
            const share = Math.min(Math.max(value / max, 0), 1);

            const labelElement = document.createElement('span');
            labelElement.className = 'label';
            labelElement.textContent = label;
            const icon = document.createElement('r-icon');
            icon.setAttribute('name', toneIcon[tone]);
            const figuresElement = document.createElement('span');
            figuresElement.className = 'figures';
            figuresElement.textContent = figures;
            const track = document.createElement('div');
            track.className = 'track';
            const fill = document.createElement('div');
            fill.className = 'fill';
            fill.style.width = `${share * 100}%`;
            track.append(fill);
            this.replaceChildren(labelElement, icon, figuresElement, track);

            this.dataset.tone = tone;
            this.setAttribute('role', 'meter');
            this.setAttribute('aria-label', label);
            this.setAttribute('aria-valuemin', '0');
            this.setAttribute('aria-valuemax', String(max));
            this.setAttribute('aria-valuenow', String(Math.min(Math.max(value, 0), max)));
            this.setAttribute('aria-valuetext', figures);
        } catch (error) {
            this.clear();
            reportProblem('r-meter', error instanceof Error ? error.message : String(error));
        }
    }
}

if (!customElements.get('r-meter')) {
    customElements.define('r-meter', Meter);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-meter': Meter;
    }
}
