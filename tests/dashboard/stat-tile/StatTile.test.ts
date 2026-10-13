import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/stat-tile/StatTile';
import type { StatTile } from '../../../src/dashboard/stat-tile/StatTile';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';

function tile(attributes: Record<string, string>): StatTile {
    const element = document.createElement('r-stat-tile');
    for (const [name, value] of Object.entries({ label: 'Revenue', value: '1285400', ...attributes })) {
        element.setAttribute(name, value);
    }
    return mount(element).element;
}

function change(element: StatTile): HTMLElement | null {
    return element.querySelector('.change');
}

describe('r-stat-tile', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        resetFormatting();
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('tile_content_shows_label_grouped_value_and_change_against_the_period', () => {
        configureFormatting({ locale: 'en-US' });
        const element = tile({ value: '1000', previous: '960', period: 'last month' });
        expect(element.querySelector('.label')?.textContent).toBe('Revenue');
        expect(element.querySelector('.value')?.textContent).toBe('1,000');
        expect(change(element)?.textContent).toBe('+4% vs last month');
    });

    it('tile_inputs_better_defaults_to_higher_and_lower_makes_a_rise_bad', () => {
        expect(change(tile({ value: '110', previous: '100' }))?.dataset.tone).toBe('ok');
        expect(change(tile({ value: '110', previous: '100', better: 'lower' }))?.dataset.tone).toBe('danger');
    });

    it('not_a_number_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(tile({ value: 'abc' }).childElementCount).toBe(0);
        expect(tile({ value: '1', previous: 'x' }).childElementCount).toBe(0);
        expect(error).toHaveBeenCalledTimes(2);
    });

    it('unknown_better_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(tile({ previous: '1', better: 'sideways' }).childElementCount).toBe(0);
        expect(error).toHaveBeenCalledTimes(1);
    });

    it('missing_label_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const element = document.createElement('r-stat-tile');
        element.setAttribute('value', '1');
        expect(mount(element).element.childElementCount).toBe(0);
        expect(error).toHaveBeenCalledTimes(1);
    });

    it('change_text_is_signed_percent_with_real_minus_in_the_locale_format', () => {
        configureFormatting({ locale: 'sv-SE' });
        expect(change(tile({ value: '104', previous: '100', period: 'förra månaden' }))?.textContent).toBe('+4\u00a0% vs förra månaden');
        configureFormatting({ locale: 'en-US' });
        expect(change(tile({ value: '97', previous: '100' }))?.textContent).toBe('−3% vs last year');
    });

    it('previous_zero_reads_plus_minus_zero_never_infinity', () => {
        configureFormatting({ locale: 'en-US' });
        expect(change(tile({ value: '50', previous: '0' }))?.textContent).toBe('±0% vs last year');
    });

    it('change_tone_is_ok_when_moving_the_better_way_or_level_and_danger_otherwise', () => {
        expect(change(tile({ value: '90', previous: '100' }))?.dataset.tone).toBe('danger');
        expect(change(tile({ value: '90', previous: '100', better: 'lower' }))?.dataset.tone).toBe('ok');
        expect(change(tile({ value: '100', previous: '100' }))?.dataset.tone).toBe('ok');
    });

    it('change_message_is_one_reworded_message_with_placeholders', async () => {
        configureFormatting({ locale: 'en-US' });
        await rewordEnglish({ changeAgainstPeriod: '{period}: {change}' });
        expect(change(tile({ value: '104', previous: '100', period: 'May' }))?.textContent).toBe('May: +4%');
    });

    it('period_is_shown_exactly_as_given_and_defaults_to_last_year_from_the_namespace', async () => {
        configureFormatting({ locale: 'en-US' });
        expect(change(tile({ value: '104', previous: '100', period: 'Q1 (rev.)' }))?.textContent).toContain('vs Q1 (rev.)');
        await rewordEnglish({ lastYear: 'twelve months ago' });
        expect(change(tile({ value: '104', previous: '100' }))?.textContent).toBe('+4% vs twelve months ago');
    });

    it('no_comparison_leaves_the_change_out_without_an_error', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const element = tile({ value: '5' });
        expect(element.querySelector('.label')).not.toBeNull();
        expect(element.querySelector('.value')).not.toBeNull();
        expect(change(element)).toBeNull();
        expect(error).not.toHaveBeenCalled();
    });

    it('trend_data_is_drawn_as_a_sparkline_under_the_figure', () => {
        const element = document.createElement('r-stat-tile');
        element.setAttribute('label', 'Revenue');
        element.setAttribute('value', '5');
        element.setAttribute('previous', '4');
        element.trend = { labels: ['Jan', 'Feb'], series: [{ name: 'Revenue', values: [1, 2] }], summary: 'Revenue trend' };
        const mounted = mount(element).element;
        expect(mounted.querySelector('r-line-chart svg')).not.toBeNull();
        expect(mounted.lastElementChild?.tagName).toBe('R-LINE-CHART');
    });

    it('no_trend_leaves_the_space_out_rather_than_an_empty_sparkline', () => {
        expect(tile({}).querySelector('r-line-chart')).toBeNull();
    });

    it('bad_trend_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const element = document.createElement('r-stat-tile');
        element.setAttribute('label', 'Revenue');
        element.setAttribute('value', '5');
        element.trend = { labels: ['Jan'], series: [{ name: 'Revenue', values: [1, 2] }], summary: 'Bad' };
        expect(mount(element).element.childElementCount).toBe(0);
        expect(error).toHaveBeenCalled();
    });

    it('card_tier_takes_card_variables_and_casts_no_shadow', () => {
        tile({});
        const css = document.head.querySelector('style[data-r-styles="r-stat-tile"]')?.textContent ?? '';
        for (const variable of ['--card-radius', '--card-padding', '--card-gap', '--card-border']) {
            expect(css).toContain(`var(${variable})`);
        }
        expect(css).toContain('box-shadow: none');
        expect(css).not.toContain(':hover');
    });

    it('not_interactive_has_no_tabindex_and_sends_no_events', () => {
        const element = document.createElement('r-stat-tile');
        element.setAttribute('label', 'A');
        element.setAttribute('value', '1');
        element.setAttribute('previous', '2');
        const listener = vi.fn();
        element.addEventListener('r-change', listener);
        const mounted = mount(element).element;
        expect(mounted.hasAttribute('tabindex')).toBe(false);
        expect(mounted.querySelector('a, button, input, [tabindex]')).toBeNull();
        expect(listener).not.toHaveBeenCalled();
    });
});
