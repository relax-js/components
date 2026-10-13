import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatAmount } from '../../../src/dashboard/amount/Amount';
import { createComponentPipeRegistry } from '../../../src/foundations/pipes/pipes';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';

const amount = createComponentPipeRegistry().get('amount');

describe('amount pipe', () => {
    afterEach(() => {
        resetFormatting();
        vi.restoreAllMocks();
    });

    it('formatAmount_returns_the_text_the_element_shows', () => {
        configureFormatting({ locale: 'sv-SE', currency: 'SEK' });

        expect(formatAmount(-1234.5, { decimals: 2 })).toBe('−1 234,50 kr');
        expect(formatAmount(5, { withUnit: false, signed: true })).toBe('+5');
    });

    it('formatAmount_throws_for_a_value_decimals_or_currency_it_cannot_use', () => {
        expect(() => formatAmount(Number.NaN)).toThrow();
        expect(() => formatAmount(1, { decimals: 1 as 0 })).toThrow();
        expect(() => formatAmount(1, { currency: 'nope' })).toThrow();
        expect(() => formatAmount(1, { locale: 'not a locale' })).toThrow();
    });

    it('registry_has_the_amount_pipe_next_to_the_builtin_pipes', () => {
        const registry = createComponentPipeRegistry();

        expect(registry.has('amount')).toBe(true);
        expect(registry.has('uppercase')).toBe(true);
        expect(registry.lookup('default')).not.toBeNull();
    });

    it('pipe_takes_decimals_signed_nounit_and_currency_in_any_order', () => {
        configureFormatting({ locale: 'en-US', currency: 'USD' });

        expect(amount(5, '2', 'signed', 'EUR')).toBe(formatAmount(5, { decimals: 2, signed: true, currency: 'EUR' }));
        expect(amount(5, 'EUR', 'signed', 2)).toBe(formatAmount(5, { decimals: 2, signed: true, currency: 'EUR' }));
        expect(amount(5, 'nounit')).toBe(formatAmount(5, { withUnit: false }));
    });

    it('pipe_throws_for_an_unknown_argument', () => {
        expect(() => amount(5, 'bold')).toThrow(/amount/);
        expect(() => amount(5, '3')).toThrow(/amount/);
    });

    it('pipe_gives_empty_text_for_null_and_undefined', () => {
        expect(amount(null)).toBe('');
        expect(amount(undefined)).toBe('');
    });

    it('pipe_logs_and_gives_empty_text_for_a_value_that_is_not_a_number', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(amount('abc')).toBe('');
        expect(error).toHaveBeenCalledOnce();
    });
});
