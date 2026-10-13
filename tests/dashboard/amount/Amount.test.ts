import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/amount/Amount';
import type { Amount } from '../../../src/dashboard/amount/Amount';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';

function amount(attributes: Record<string, string>): Amount {
    const element = document.createElement('r-amount');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
}

const nbsp = ' ';

describe('r-amount', () => {
    beforeEach(() => configureFormatting({ locale: 'sv-SE', currency: 'SEK' }));
    afterEach(() => {
        document.body.replaceChildren();
        resetFormatting();
        vi.restoreAllMocks();
    });

    it('writes_the_value_grouped_with_the_configured_locale_and_currency', () => {
        configureFormatting({ locale: 'en-US', currency: 'USD' });
        const { element } = mount(amount({ value: '1285400' }));

        expect(element.textContent).toBe('$1,285,400');
    });

    it('swedish_config_reads_1_285_400_kr', () => {
        const { element } = mount(amount({ value: '1285400' }));

        expect(element.textContent?.replace(/\s/g, ' ')).toBe('1 285 400 kr');
    });

    it('the_relaxjs_locale_is_ignored', () => {
        document.documentElement.lang = 'en';
        const { element } = mount(amount({ value: '1285400' }));

        expect(element.textContent?.replace(/\s/g, ' ')).toBe('1 285 400 kr');
        document.documentElement.lang = '';
    });

    it('rounds_to_whole_figures_unless_two_decimals_are_asked_for', () => {
        const whole = mount(amount({ value: '1285400.5' })).element;
        const two = mount(amount({ value: '1285400.5', decimals: '2' })).element;

        expect(whole.textContent).toContain('285' + nbsp + '401');
        expect(two.textContent).toContain('400,50');
    });

    it('unit_none_leaves_the_currency_out', () => {
        const { element } = mount(amount({ value: '1285400', unit: 'none' }));

        expect(element.textContent).toBe('1' + nbsp + '285' + nbsp + '400');
    });

    it('a_negative_amount_gets_a_real_minus_sign', () => {
        const { element } = mount(amount({ value: '-3200' }));

        expect(element.textContent?.startsWith('−3')).toBe(true);
        expect(element.textContent).not.toContain('-');
    });

    it('signed_shows_the_sign_both_ways_and_none_on_zero', () => {
        const plus = mount(amount({ value: '3200', signed: '' })).element;
        const minus = mount(amount({ value: '-3200', signed: '' })).element;
        const zero = mount(amount({ value: '0', signed: '' })).element;

        expect(plus.textContent?.startsWith('+3')).toBe(true);
        expect(minus.textContent?.startsWith('−3')).toBe(true);
        expect(zero.textContent).toBe('0' + nbsp + 'kr');
    });

    it('an_amount_that_rounds_to_zero_reads_zero_without_a_sign', () => {
        const plain = mount(amount({ value: '-0.4', 'mark-negative': '' })).element;
        const signed = mount(amount({ value: '-0.4', signed: '' })).element;

        expect(plain.textContent).toBe('0' + nbsp + 'kr');
        expect(signed.textContent).toBe('0' + nbsp + 'kr');
        expect(plain.classList.contains('negative')).toBe(false);
    });

    it('mark_negative_gives_a_negative_amount_the_class_negative', () => {
        const marked = mount(amount({ value: '-5', 'mark-negative': '' })).element;
        const unmarked = mount(amount({ value: '-5' })).element;

        expect(marked.classList.contains('negative')).toBe(true);
        expect(unmarked.classList.contains('negative')).toBe(false);
    });

    it('the_class_is_removed_when_the_value_turns_positive', () => {
        const { element } = mount(amount({ value: '-5', 'mark-negative': '' }));
        element.setAttribute('value', '5');

        expect(element.classList.contains('negative')).toBe(false);
    });

    it('locale_and_currency_attributes_override_the_configuration', () => {
        const { element } = mount(amount({ value: '1234', locale: 'en-US', currency: 'USD' }));

        expect(element.textContent).toBe('$1,234');
    });

    it('changing_an_observed_attribute_reformats_the_amount', () => {
        const { element } = mount(amount({ value: '1234' }));

        element.setAttribute('value', '99');
        expect(element.textContent).toBe('99' + nbsp + 'kr');
        element.setAttribute('decimals', '2');
        expect(element.textContent).toContain('99,00');
        element.setAttribute('unit', 'none');
        expect(element.textContent).toBe('99,00');
        element.setAttribute('signed', '');
        expect(element.textContent).toBe('+99,00');
        element.setAttribute('locale', 'en-US');
        expect(element.textContent).toBe('+99.00');
        element.removeAttribute('unit');
        element.setAttribute('currency', 'USD');
        expect(element.textContent).toBe('+$99.00');
        element.setAttribute('value', '-99');
        element.setAttribute('mark-negative', '');
        expect(element.classList.contains('negative')).toBe(true);
    });

    it.each([[null], [''], ['1 285 400'], ['1285400,5'], ['abc']])('a_value_that_is_not_a_number_logs_and_renders_empty_%s', (value) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { element } = mount(value === null ? amount({}) : amount({ value }));

        expect(element.textContent).toBe('');
        expect(error).toHaveBeenCalled();
    });

    it.each([[{ decimals: '1' }], [{ unit: 'kr' }], [{ locale: 'not a locale' }], [{ currency: 'XX' }]])(
        'bad_options_log_and_render_empty_%j',
        (options) => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const { element } = mount(amount({ value: '5', ...options }));

            expect(element.textContent).toBe('');
            expect(error).toHaveBeenCalled();
        },
    );

    it('an_amount_is_kept_on_one_line', () => {
        const { element } = mount(amount({ value: '1285400' }));

        expect(element.textContent).not.toContain(' ');
        expect(document.head.querySelector('style[data-r-styles="r-amount"]')?.textContent).toContain('white-space: nowrap');
    });
});
