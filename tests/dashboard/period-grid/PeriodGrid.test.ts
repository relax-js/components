import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/period-grid/PeriodGrid';
import type { PeriodGrid, Period } from '../../../src/dashboard/period-grid/PeriodGrid';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';

function grid(year: string | null, periods: Period[] = []): PeriodGrid {
    const element = document.createElement('r-period-grid');
    if (year !== null) {
        element.setAttribute('year', year);
    }
    element.periods = periods;
    return element;
}

const months: Period[] = [
    { month: 'Jan', state: 'closed' },
    { month: 'Feb', state: 'locked' },
    { month: 'Mar', state: 'open' },
    { month: 'Apr', state: 'coming' },
];

const titles = (element: Element) => [...element.querySelectorAll<HTMLElement>('.tile')].map((tile) => tile.title);

describe('r-period-grid', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('year_attribute_is_shown_above_the_periods', () => {
        const { element } = mount(grid('2026', months));

        expect(element.querySelector('.year')?.textContent).toBe('2026');
        expect(element.firstElementChild?.className).toBe('year');
    });

    it('missing_or_non_numeric_year_reports_an_error_and_renders_empty', () => {
        const reported = captureProblems();

        expect(mount(grid(null, months)).element.children).toHaveLength(0);
        expect(mount(grid('abc', months)).element.children).toHaveLength(0);
        expect(reported.messages()).toHaveLength(2);
    });

    it('changing_year_updates_the_heading_and_every_tile_title', () => {
        const { element } = mount(grid('2026', months));

        element.setAttribute('year', '2027');

        expect(element.querySelector('.year')?.textContent).toBe('2027');
        expect(titles(element)).toEqual(['Jan 2027: closed', 'Feb 2027: locked', 'Mar 2027: open', 'Apr 2027: not started']);
    });

    it('each_period_becomes_an_item_labelled_month_and_year_in_the_given_order', () => {
        const { element } = mount(grid('2026', [months[2], months[0]]));

        expect(titles(element)).toEqual(['Mar 2026: open', 'Jan 2026: closed']);
    });

    it('month_text_is_shown_as_given_and_missing_months_are_not_filled_in', () => {
        const { element } = mount(grid('2026', [{ month: 'januari', state: 'open' }, { month: 'Mars', state: 'open' }]));

        expect([...element.querySelectorAll('.month')].map((m) => m.textContent)).toEqual(['januari', 'Mars']);
        expect(element.querySelectorAll('ol.months > li')).toHaveLength(2);
    });

    it('default_states_are_closed_locked_open_and_coming_with_their_tones_in_the_key', () => {
        const { element } = mount(grid('2026'));

        const key = [...element.querySelectorAll<HTMLElement>('ul.key > li')].map((li) => [li.dataset.tone, li.textContent]);
        expect(key).toEqual([['ok', 'closed'], ['ok', 'locked'], ['info', 'open'], ['muted', 'not started']]);
    });

    it('default_states_all_show_an_icon_open_the_clock_and_coming_the_info', () => {
        const { element } = mount(grid('2026'));

        const icons = [...element.querySelectorAll('ul.key > li r-icon')].map((icon) => icon.getAttribute('name'));
        expect(icons).toEqual(['check', 'lock', 'clock', 'info']);
    });

    it('default_state_texts_come_from_the_namespace_and_redraw_when_the_language_changes', async () => {
        const { element } = mount(grid('2026', months));

        await rewordEnglish({ periodClosed: 'stängd' });

        expect(titles(element)[0]).toBe('Jan 2026: stängd');
        expect(element.querySelector('ul.key li')?.textContent).toBe('stängd');
    });

    it('page_states_replace_the_defaults_in_the_tiles_and_the_key', () => {
        const { element } = mount(grid('2026', [{ month: 'Jan', state: 'paid' }]));

        element.states = [{ id: 'paid', label: 'Paid', icon: 'lock', tone: 'warn' }, { id: 'late', label: 'Late' }];

        expect(titles(element)).toEqual(['Jan 2026: Paid']);
        expect([...element.querySelectorAll<HTMLElement>('ul.key > li')].map((li) => [li.dataset.tone, li.textContent]))
            .toEqual([['warn', 'Paid'], ['muted', 'Late']]);
        expect(element.querySelector('ol.months > li.paid r-icon')?.getAttribute('name')).toBe('lock');
    });

    it('closed_is_an_unknown_state_once_the_page_replaces_the_states_without_it', () => {
        const reported = captureProblems();
        const { element } = mount(grid('2026', [{ month: 'Jan', state: 'closed' }]));

        element.states = [{ id: 'paid', label: 'Paid' }];

        expect(reported.messages()).not.toEqual([]);
        expect(element.children).toHaveLength(0);
    });

    it('markup_carries_the_documented_parts', () => {
        const { element } = mount(grid('2026', months));

        expect(element.querySelector('.year')).not.toBeNull();
        expect([...element.querySelectorAll('ol.months > li')].map((li) => li.className)).toEqual(['closed', 'locked', 'open', 'coming']);
        expect(element.querySelectorAll('ol.months > li > .month')).toHaveLength(4);
        expect(element.querySelectorAll('ol.months > li > .tile')).toHaveLength(4);
        expect(element.querySelector('ul.key')).not.toBeNull();
    });
});
