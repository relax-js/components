import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadNamespace, registerNamespace, setLocale } from '@relax.js/core/i18n';
import { configureFormatting, formatting, formatValue, resetFormatting } from '../../../src/foundations/formatting/formatting';
import { text } from '../../../src/foundations/text/text';
import '../../../src/dashboard/amount/Amount';
import '../../../src/dashboard/days-left/DaysLeft';
import en from '../../../src/locales/en/r-components.json';
import sv from '../../../src/locales/sv/r-components.json';
import { restoreWords } from '../text/words';

function draw(tag: string, attributes: Record<string, string>): HTMLElement {
    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    document.body.append(element);
    return element;
}

describe('formatting', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        resetFormatting();
        vi.restoreAllMocks();
        await restoreWords();
    });

    it('configured_locale_and_currency_are_kept_when_only_one_changes', () => {
        configureFormatting({ locale: 'sv-SE' });
        configureFormatting({ currency: 'SEK' });

        expect(formatting()).toMatchObject({ locale: 'sv-SE', currency: 'SEK' });
    });

    it('numbers_are_written_the_way_the_configured_locale_writes_them', () => {
        configureFormatting({ locale: 'de-DE' });

        expect(formatValue(1234.5)).toBe('1.234,5');
    });

    it('null_and_undefined_values_are_written_as_empty_text', () => {
        expect(formatValue(null)).toBe('');
        expect(formatValue(undefined)).toBe('');
    });

    it('a_date_is_written_in_the_browsers_time_zone_never_converted_to_utc', () => {
        configureFormatting({ locale: 'en-US' });
        const justAfterLocalMidnight = new Date(2026, 9, 13, 0, 30);

        expect(formatValue(justAfterLocalMidnight)).toBe('10/13/2026');
    });

    it('unconfigured_numbers_and_dates_are_written_in_the_browsers_preferred_language', () => {
        vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
        const date = new Date(2026, 9, 13);

        expect(formatting().locale).toBe('en-GB');
        expect(formatValue(1234567.5)).toBe(new Intl.NumberFormat('en-GB').format(1234567.5));
        expect(formatValue(date)).toBe(new Intl.DateTimeFormat('en-GB').format(date));
    });

    it.each(['sv-SE', 'en-SE', 'de-DE'])('unconfigured_amounts_are_euros_whatever_the_region_%s', (language) => {
        vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
        const amount = draw('r-amount', { value: '1000' });

        expect(formatting().currency).toBe('EUR');
        expect(amount.textContent).toContain('€');
    });

    it('configuring_after_drawing_changes_nothing_until_the_element_draws_again', () => {
        configureFormatting({ locale: 'en-US', currency: 'USD' });
        const amount = draw('r-amount', { value: '1000' });
        configureFormatting({ locale: 'sv-SE', currency: 'SEK' });

        expect(amount.textContent).toBe('$1,000');
        amount.setAttribute('value', '2000');
        expect(amount.textContent).toContain('kr');
    });

    it('an_attribute_overrides_the_config_for_that_element_only', () => {
        configureFormatting({ locale: 'en-US', currency: 'USD' });
        const overridden = draw('r-amount', { value: '1000', currency: 'GBP' });
        const other = draw('r-amount', { value: '1000' });

        expect(overridden.textContent).toBe('£1,000');
        expect(other.textContent).toBe('$1,000');
    });

    it('changing_the_language_redraws_connected_components_with_the_new_words_and_values', async () => {
        configureFormatting({ locale: 'sv-SE' });
        await setLocale('en');
        await loadNamespace('r-components');
        const days = draw('r-days-left', { days: '1285400' });
        expect(days.textContent).toBe('1 285 400 days');

        await setLocale('sv');
        await loadNamespace('r-components');

        // The element loads the words on its own and redraws after that, not after this test's load.
        await vi.waitFor(() => expect(days.textContent).toBe('1 285 400 dagar'));
    });

    it('passing_texts_throws_an_error_saying_words_are_reworded_through_the_namespace', () => {
        const withTexts = { texts: { back: 'Tillbaka' } } as unknown as Parameters<typeof configureFormatting>[0];

        expect(() => configureFormatting(withTexts)).toThrow(/r-components/);
    });

    it('without_i18n_set_up_the_english_text_is_written_never_a_key', () => {
        registerNamespace('xx', 'r-components', {});

        expect(text('noData')).toBe('No data');
        expect(text('days', { count: 1, n: '1' })).toBe('1 day');
    });

    it('an_app_namespace_lacking_a_key_shows_that_keys_english_text', async () => {
        registerNamespace('en', 'r-components', { back: 'Return' });
        await setLocale('en');
        await loadNamespace('r-components');

        expect(text('back')).toBe('Return');
        expect(text('noData')).toBe('No data');
    });

    it('the_shipped_english_and_swedish_files_have_exactly_the_same_keys', () => {
        expect(Object.keys(sv).sort()).toEqual(Object.keys(en).sort());
    });

    it.each([
        [1, '1 day'],
        [5, '5 days'],
    ])('in_english_days_left_reads_%i_as_%s', async (count, expected) => {
        await setLocale('en');
        await loadNamespace('r-components');

        expect(draw('r-days-left', { days: String(count) }).textContent).toBe(expected);
    });

    it('a_plural_word_groups_its_number_as_the_locale_groups_it', async () => {
        configureFormatting({ locale: 'sv-SE' });
        await setLocale('sv');
        await loadNamespace('r-components');

        expect(draw('r-days-left', { days: '1' }).textContent).toBe('1 dag');
        expect(draw('r-days-left', { days: '1285400' }).textContent).toBe('1 285 400 dagar');
    });
});
