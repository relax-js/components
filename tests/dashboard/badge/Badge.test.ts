import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/badge/Badge';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';
import { setLocale } from '@relax.js/core/i18n';
import { toneIcon } from '../../../src/foundations/tone/tone';
import type { Badge } from '../../../src/dashboard/badge/Badge';

function badgeWith(html: string): Badge {
    document.body.innerHTML = html;
    return document.querySelector('r-badge')!;
}

const nextMutations = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('r-badge', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('the_badge_shows_the_page_text_as_given_and_follows_changes_to_it', async () => {
        const badge = badgeWith('<r-badge>Draft</r-badge>');
        expect(badge.textContent).toBe('Draft');
        expect(badge.hidden).toBe(false);

        badge.textContent = 'Final';
        await nextMutations();

        expect(badge.textContent).toBe('Final');
        expect(badge.hidden).toBe(false);
    });

    it('a_badge_with_no_text_and_no_count_is_hidden_and_reports_nothing', async () => {
        const reported = captureProblems();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const badge = badgeWith('<r-badge></r-badge>');

        expect(badge.hidden).toBe(true);

        badge.textContent = 'Back';
        await nextMutations();
        expect(badge.hidden).toBe(false);
        expect(reported.messages()).toEqual([]);
        expect(warn).not.toHaveBeenCalled();
    });

    it('the_badge_carries_its_tone_as_data_tone_muted_when_absent_and_follows_changes', () => {
        expect(badgeWith('<r-badge>x</r-badge>').dataset.tone).toBe('muted');

        const badge = badgeWith('<r-badge tone="ok">x</r-badge>');
        expect(badge.dataset.tone).toBe('ok');

        badge.setAttribute('tone', 'danger');
        expect(badge.dataset.tone).toBe('danger');
    });

    it('an_unknown_tone_reports_an_error_and_the_badge_is_muted', () => {
        const reported = captureProblems();
        const badge = badgeWith('<r-badge tone="loud">x</r-badge>');

        expect(reported.messages()).not.toEqual([]);
        expect(badge.dataset.tone).toBe('muted');
    });

    it('a_badge_showing_text_shows_no_icon', () => {
        const badge = badgeWith('<r-badge tone="ok">Paid</r-badge>');

        expect(badge.querySelector('r-icon')).toBeNull();
    });

    describe('counting', () => {
        afterEach(() => resetFormatting());

        it('a_count_is_shown_written_for_the_configured_locale_in_place_of_the_text', () => {
            configureFormatting({ locale: 'sv-SE' });
            const badge = badgeWith('<r-badge count="1234567">Text</r-badge>');

            expect(badge.textContent).toBe(new Intl.NumberFormat('sv-SE').format(1234567));
            expect(badge.hidden).toBe(false);
        });

        it.each(['-1', '1.5', 'abc', ''])('a_bad_count_%s_logs_an_error_and_renders_empty', (count) => {
            const reported = captureProblems();
            const badge = badgeWith(`<r-badge count="${count}">Text</r-badge>`);

            expect(reported.messages()).not.toEqual([]);
            expect(badge.textContent).toBe('');
            expect(badge.hidden).toBe(true);
        });

        it('after_the_language_changes_the_count_is_written_in_the_new_locale', async () => {
            configureFormatting({ locale: 'en-US' });
            const badge = badgeWith('<r-badge count="1234567"></r-badge>');
            expect(badge.textContent).toBe('1,234,567');

            configureFormatting({ locale: 'sv-SE' });
            await setLocale('sv');

            // The redraw waits for the new language's words to load, which takes an unknown number of ticks.
            await vi.waitFor(() => expect(badge.textContent).toBe(new Intl.NumberFormat('sv-SE').format(1234567)));
        });

        it('changing_count_shows_the_new_number', () => {
            const badge = badgeWith('<r-badge count="3"></r-badge>');
            badge.setAttribute('count', '7');

            expect(badge.textContent).toBe('7');
        });

        it('a_count_of_zero_hides_the_badge', () => {
            const badge = badgeWith('<r-badge count="2"></r-badge>');
            badge.setAttribute('count', '0');

            expect(badge.hidden).toBe(true);
            expect(badge.textContent).toBe('');
        });

        it('show_zero_shows_a_count_of_zero_because_none_open_is_information', () => {
            const badge = badgeWith('<r-badge count="0" tone="ok" show-zero></r-badge>');

            expect(badge.hidden).toBe(false);
            expect(badge.textContent!.trim()).toBe('0');
            expect(badge.querySelector('r-icon')).not.toBeNull();
        });

        it('removing_show_zero_hides_the_zero_again', () => {
            const badge = badgeWith('<r-badge count="0" show-zero></r-badge>');
            badge.removeAttribute('show-zero');

            expect(badge.hidden).toBe(true);
        });

        it('a_count_above_max_shows_the_maximum_and_a_plus_and_without_max_the_full_number', async () => {
            configureFormatting({ locale: 'en-US' });
            expect(badgeWith('<r-badge count="150" max="99"></r-badge>').textContent).toBe('99+');
            expect(badgeWith('<r-badge count="99" max="99"></r-badge>').textContent).toBe('99');
            expect(badgeWith('<r-badge count="12345"></r-badge>').textContent).toBe('12,345');

            await rewordEnglish({ plus: ' plus' });
            expect(badgeWith('<r-badge count="150" max="99"></r-badge>').textContent).toBe('99 plus');
        });

        it.each(['0', '-5', '2.5', 'many'])('a_bad_max_%s_logs_an_error_and_renders_empty', (max) => {
            const reported = captureProblems();
            const badge = badgeWith(`<r-badge count="5" max="${max}"></r-badge>`);

            expect(reported.messages()).not.toEqual([]);
            expect(badge.textContent).toBe('');
            expect(badge.hidden).toBe(true);
        });

        it('a_count_badge_with_a_tone_other_than_muted_shows_that_tones_icon_before_the_number', () => {
            const toned = badgeWith('<r-badge tone="danger" count="4"></r-badge>');
            const icon = toned.firstElementChild!;
            expect(icon.localName).toBe('r-icon');
            expect(icon.getAttribute('name')).toBe(toneIcon.danger);
            expect(toned.textContent?.trim()).toBe('4');

            expect(badgeWith('<r-badge count="4"></r-badge>').querySelector('r-icon')).toBeNull();
        });
    });
});
