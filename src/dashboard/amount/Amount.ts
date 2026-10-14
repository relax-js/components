import { reportProblem } from '../../foundations/problems/problems';
import { formatting } from '../../foundations/formatting/formatting';
import { whenLanguageChanges } from '../../foundations/text/text';
import { installStyles } from '../../foundations/styles';

const minus = '−';

export interface AmountOptions {
    /** Whole figures (default) or two decimals. */
    decimals?: 0 | 2;
    /** Leaves the currency out when false. */
    withUnit?: boolean;
    /** Shows the sign of a non-zero amount both ways. */
    signed?: boolean;
    locale?: string;
    currency?: string;
}

/** An amount written the way the locale writes it, with a real minus sign. Throws for options that cannot be formatted with. */
export function formatAmount(value: number, options: AmountOptions = {}): string {
    try {
        return writeAmount(value, options).text;
    } catch (error) {
        if (error instanceof Error) {
            error.message = `r-amount: ${error.message}`;
        }
        throw error;
    }
}

function writeAmount(value: number, options: AmountOptions): { text: string; negative: boolean } {
    const decimals = options.decimals ?? 0;
    if (decimals !== 0 && decimals !== 2) {
        throw new RangeError(`decimals must be 0 or 2, not ${String(decimals)}`);
    }
    if (!Number.isFinite(value)) {
        throw new RangeError('the value must be a finite number');
    }
    const locale = options.locale ?? formatting().locale;
    const currency = options.currency ?? formatting().currency;
    const digits = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    const plain = new Intl.NumberFormat(locale, digits);
    // Built even without a unit, so a currency that cannot be used is reported either way. With no
    // currency at all (a region without a single one), the amount is written without a unit.
    const withCurrency =
        currency === undefined
            ? plain
            : new Intl.NumberFormat(locale, { ...digits, style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
    const formatter = options.withUnit === false ? plain : withCurrency;

    const magnitude = Math.abs(value);
    const parts = formatter.formatToParts(magnitude);
    const isZero = parts.every((part) => (part.type !== 'integer' && part.type !== 'fraction') || /^0+$/.test(part.value));
    // Keeps a number from breaking between its digit groups or before its currency.
    const text = formatter.format(magnitude).replace(/ /g, '\u00a0');
    const negative = value < 0 && !isZero;
    if (isZero) {
        return { text, negative: false };
    }
    if (negative) {
        return { text: minus + text, negative: true };
    }
    return { text: options.signed ? '+' + text : text, negative: false };
}

const css = `
r-amount {
    white-space: nowrap;
}
`;

/**
 * A money amount grouped and formatted the way the configured locale writes it.
 *
 * @example
 * ```html
 * <r-amount value="-3200" signed mark-negative></r-amount>
 * ```
 *
 * @attr {number} value - The amount
 * @attr {0|2} decimals - Whole figures (default) or two decimals
 * @attr {none} unit - `none` leaves the currency out
 * @attr {boolean} signed - Shows the sign of a non-zero amount both ways
 * @attr {boolean} mark-negative - Gives a negative amount the class `negative`
 * @attr {string} locale - Overrides the configured locale
 * @attr {string} currency - Overrides the configured currency
 */
export class Amount extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['value', 'decimals', 'unit', 'signed', 'mark-negative', 'locale', 'currency'];
    }

    connectedCallback(): void {
        installStyles(this, 'r-amount', css);
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
        const raw = this.getAttribute('value');
        if (raw !== null && raw.includes('{{')) {
            return;
        }
        this.textContent = '';
        this.classList.remove('negative');
        try {
            if (raw === null || raw.trim() === '') {
                throw new Error('the value is missing');
            }
            const value = Number(raw);
            if (Number.isNaN(value)) {
                throw new Error(`"${raw}" is not a number`);
            }
            const decimals = this.getAttribute('decimals');
            const unit = this.getAttribute('unit');
            if (unit !== null && unit !== 'none') {
                throw new RangeError(`unit must be "none", not "${unit}"`);
            }
            const written = writeAmount(value, {
                decimals: decimals === null ? 0 : (Number(decimals) as 0 | 2),
                withUnit: unit === null,
                signed: this.hasAttribute('signed'),
                locale: this.getAttribute('locale') ?? undefined,
                currency: this.getAttribute('currency') ?? undefined,
            });
            this.textContent = written.text;
            this.classList.toggle('negative', written.negative && this.hasAttribute('mark-negative'));
        } catch (error) {
            reportProblem('r-amount', error instanceof Error ? error.message : String(error));
        }
    }
}

if (!customElements.get('r-amount')) {
    customElements.define('r-amount', Amount);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-amount': Amount;
    }
}
