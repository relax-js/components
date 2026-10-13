import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/kpi-meter/KpiMeter';
import { compareYears, type KpiMeter } from '../../../src/dashboard/kpi-meter/KpiMeter';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';

function meter(attributes: Record<string, string>): KpiMeter {
    const element = document.createElement('r-kpi-meter');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
}

function drawn(attributes: Record<string, string>): KpiMeter {
    return mount(meter({ label: 'Revenue', ...attributes })).element;
}

function change(attributes: Record<string, string>): HTMLElement {
    return drawn(attributes).querySelector('.change') as HTMLElement;
}

describe('r-kpi-meter', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        resetFormatting();
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('change_text_is_a_signed_whole_percent_with_a_real_minus_in_the_locale_format', () => {
        configureFormatting({ locale: 'en-US' });
        expect(change({ value: '112', previous: '100' }).textContent).toBe('+12%');
        expect(change({ value: '97', previous: '100' }).textContent).toBe('−3%');
        configureFormatting({ locale: 'sv-SE' });
        expect(change({ value: '112', previous: '100' }).textContent).toBe('+12 %');
        expect(change({ value: '97', previous: '100' }).textContent).toBe('−3 %');
        expect(change({ value: '100', previous: '100' }).textContent).toBe('±0 %');
    });

    it('no_previous_year_reads_plus_minus_zero_never_infinity', () => {
        configureFormatting({ locale: 'en-US' });
        expect(change({ value: '50', previous: '0' }).textContent).toBe('±0%');
    });

    it('a_change_that_rounds_to_zero_reads_plus_minus_zero_and_is_ok_either_way', () => {
        configureFormatting({ locale: 'en-US' });
        const up = change({ value: '1003', previous: '1000', better: 'lower' });
        const down = change({ value: '997', previous: '1000', better: 'higher' });
        expect([up.textContent, up.dataset.tone]).toEqual(['±0%', 'ok']);
        expect([down.textContent, down.dataset.tone]).toEqual(['±0%', 'ok']);
    });

    it('a_negative_previous_year_is_compared_by_its_size_so_minus_100_to_50_reads_plus_150', () => {
        configureFormatting({ locale: 'en-US' });
        expect(change({ value: '50', previous: '-100' }).textContent).toBe('+150%');
    });

    it('change_tone_is_ok_when_moving_the_better_way_and_danger_otherwise', () => {
        expect(change({ value: '90', previous: '100', better: 'higher' }).dataset.tone).toBe('danger');
        expect(change({ value: '90', previous: '100', better: 'lower' }).dataset.tone).toBe('ok');
        const element = drawn({ value: '90', previous: '100' });
        expect((element.querySelector('.bar') as HTMLElement).dataset.tone).toBe('danger');
    });

    it('rising_revenue_is_ok_with_better_higher', () => {
        expect(change({ value: '120', previous: '100', better: 'higher' }).dataset.tone).toBe('ok');
    });

    it('rising_costs_are_danger_with_better_lower', () => {
        expect(change({ value: '120', previous: '100', better: 'lower' }).dataset.tone).toBe('danger');
    });

    it('a_rise_is_ok_when_better_is_left_out', () => {
        expect(change({ value: '120', previous: '100' }).dataset.tone).toBe('ok');
    });

    it('bar_scale_is_the_larger_figure_or_one_times_one_point_fifteen', () => {
        const bar = drawn({ value: '50', previous: '100' }).querySelector('.bar') as HTMLElement;
        expect(parseFloat(bar.style.getPropertyValue('--fill'))).toBeCloseTo((50 / 115) * 100, 5);
        expect(parseFloat(bar.style.getPropertyValue('--mark'))).toBeCloseTo((100 / 115) * 100, 5);
        const small = drawn({ value: '0', previous: '0' }).querySelector('.bar') as HTMLElement;
        expect(small.style.getPropertyValue('--fill')).toBe('0%');
    });

    it('a_negative_figure_gives_zero_percent_never_a_negative_one', () => {
        const bar = drawn({ value: '-20', previous: '-5' }).querySelector('.bar') as HTMLElement;
        expect([bar.style.getPropertyValue('--fill'), bar.style.getPropertyValue('--mark')]).toEqual(['0%', '0%']);
    });

    it('figures_are_grouped_numbers_in_the_configured_locale_without_currency', () => {
        configureFormatting({ locale: 'sv-SE', currency: 'SEK' });
        const element = drawn({ value: '1285400', previous: '1150000' });
        expect(element.querySelector('.figures')?.textContent).toContain('1 285 400');
        expect(element.textContent).not.toContain('kr');
        expect(element.querySelector('.previous')?.textContent).toBe('1 150 000 last year');
    });

    it('previous_year_text_is_one_message_with_the_formatted_previous_figure', async () => {
        configureFormatting({ locale: 'en-US' });
        expect(drawn({ value: '1', previous: '1500' }).querySelector('.previous')?.textContent).toBe('1,500 last year');
        await rewordEnglish({ previousYear: 'vs {previous} in 2025' });
        expect(drawn({ value: '1', previous: '1500' }).querySelector('.previous')?.textContent).toBe('vs 1,500 in 2025');
    });

    it('meter_markup_has_label_figures_change_bar_and_previous', () => {
        configureFormatting({ locale: 'en-US' });
        const element = drawn({ value: '1285400', previous: '1150000' });
        expect(element.querySelector('.label')?.textContent).toBe('Revenue');
        expect(element.querySelector('.figures')?.textContent).toContain('1,285,400');
        expect(element.querySelector('.figures .change[data-tone]')).not.toBeNull();
        expect(element.querySelector('.bar[data-tone] .this-year')).not.toBeNull();
        expect(element.querySelector('.bar[data-tone] .last-year')).not.toBeNull();
        expect(element.querySelector('.previous')).not.toBeNull();
    });

    it('the_bar_is_hidden_from_assistive_technology', () => {
        expect(drawn({ value: '1', previous: '1' }).querySelector('.bar')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('changing_an_attribute_redraws_in_place_without_a_second_copy', () => {
        configureFormatting({ locale: 'en-US' });
        const element = drawn({ value: '112', previous: '100' });
        element.setAttribute('value', '97');
        element.setAttribute('label', 'Sales');

        expect(element.querySelectorAll('.label')).toHaveLength(1);
        expect(element.querySelector('.label')?.textContent).toBe('Sales');
        expect(element.querySelector('.change')?.textContent).toBe('−3%');
    });

    it('a_missing_or_invalid_attribute_logs_an_error_naming_the_meter_and_renders_nothing', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const cases: Record<string, string>[] = [{ label: 'x', previous: '1' }, { label: 'x', value: '1' }, { label: 'x', value: '1', previous: '1', better: 'up' }];
        for (const attributes of cases) {
            expect(mount(meter(attributes)).element.children).toHaveLength(0);
        }
        expect(error).toHaveBeenCalledTimes(3);
        expect(error.mock.calls.every(([message]) => String(message).startsWith('r-kpi-meter:'))).toBe(true);
    });

    it('a_value_that_is_not_a_number_literal_is_bad_input', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const element = mount(meter({ label: 'x', value: '1 285 400', previous: '1' })).element;

        expect(element.children).toHaveLength(0);
        expect(error).toHaveBeenCalledOnce();
    });

    it('a_better_other_than_higher_or_lower_is_bad_input', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const element = mount(meter({ label: 'x', value: '1', previous: '1', better: 'bigger' })).element;

        expect(element.children).toHaveLength(0);
        expect(error).toHaveBeenCalledOnce();
    });

    it('compare_years_returns_the_change_tone_fill_and_mark_the_meter_shows_for_the_same_figures', () => {
        configureFormatting({ locale: 'en-US' });
        const result = compareYears(112, 100, 'higher');
        const shown = drawn({ value: '112', previous: '100', better: 'higher' });

        expect(result.change).toBe('+12%');
        expect(result.tone).toBe('ok');
        expect(result.change).toBe(shown.querySelector('.change')?.textContent);
        expect(result.fill).toBeCloseTo(112 / (112 * 1.15) * 100);
        expect(result.mark).toBeCloseTo(100 / (112 * 1.15) * 100);
        expect(compareYears(112, 100, 'lower').tone).toBe('danger');
    });

    it('compare_years_throws_an_error_naming_the_meter_for_bad_input', () => {
        const bad: [number, number, string][] = [
            [Number.NaN, 1, 'higher'],
            [1, Number.POSITIVE_INFINITY, 'higher'],
            [1, 1, 'bigger'],
        ];
        for (const [value, previous, better] of bad) {
            expect(() => compareYears(value, previous, better as 'higher')).toThrow(/r-kpi-meter/);
        }
    });

    it('a_meter_without_a_label_is_bad_input', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const element = mount(meter({ value: '1', previous: '1' })).element;

        expect(element.children).toHaveLength(0);
        expect(error).toHaveBeenCalledOnce();
    });
});
