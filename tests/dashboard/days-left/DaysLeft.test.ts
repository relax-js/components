import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/days-left/DaysLeft';
import { deadlineTone } from '../../../src/dashboard/days-left/DaysLeft';
import type { DaysLeft } from '../../../src/dashboard/days-left/DaysLeft';
import { resetFormatting } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';

function daysLeft(attributes: Record<string, string>): DaysLeft {
    const element = document.createElement('r-days-left');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
}

describe('r-days-left', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        resetFormatting();
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('days_text_reads_the_count_with_the_configured_word', async () => {
        expect(mount(daysLeft({ days: '5' })).element.textContent).toBe('5 days');
        await rewordEnglish({ days: '{n} dagar' });
        expect(mount(daysLeft({ days: '5' })).element.textContent).toBe('5 dagar');
    });

    it('tone_is_danger_up_to_urgent_warn_up_to_soon_and_muted_beyond', () => {
        const tones = ['3', '7', '8', '14', '15'].map((days) => mount(daysLeft({ days })).element.dataset.tone);

        expect(tones).toEqual(['danger', 'danger', 'warn', 'warn', 'muted']);
    });

    it('own_thresholds_replace_the_defaults', () => {
        const tones = ['2', '3', '10', '11'].map((days) => mount(daysLeft({ days, urgent: '2', soon: '10' })).element.dataset.tone);

        expect(tones).toEqual(['danger', 'warn', 'warn', 'muted']);
    });

    it('a_passed_deadline_reads_zero_or_overdue_with_tone_danger', async () => {
        await rewordEnglish({ daysOverdue: '{n} dagar försenad' });
        const zero = mount(daysLeft({ days: '0' })).element;
        const late = mount(daysLeft({ days: '-3' })).element;

        expect([zero.textContent, zero.dataset.tone]).toEqual(['0 days', 'danger']);
        expect([late.textContent, late.dataset.tone]).toEqual(['3 dagar försenad', 'danger']);
        await restoreWords();
        expect(mount(daysLeft({ days: '-3' })).element.textContent).toBe('3 days overdue');
    });

    it('changing_days_updates_text_and_tone', () => {
        const { element } = mount(daysLeft({ days: '5' }));
        element.setAttribute('days', '30');

        expect([element.textContent, element.dataset.tone]).toEqual(['30 days', 'muted']);
    });

    it('changing_urgent_or_soon_updates_the_tone', () => {
        const { element } = mount(daysLeft({ days: '10' }));
        expect(element.dataset.tone).toBe('warn');
        element.setAttribute('soon', '9');
        expect(element.dataset.tone).toBe('muted');
        element.setAttribute('urgent', '10');
        element.setAttribute('soon', '12');
        expect(element.dataset.tone).toBe('danger');
    });

    it.each<Record<string, string>>([{}, { days: '' }, { days: 'x' }, { days: '2.5' }])('a_days_that_is_not_a_whole_number_logs_and_renders_empty_%j', (attributes) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { element } = mount(daysLeft(attributes));

        expect(error).toHaveBeenCalled();
        expect(element.textContent).toBe('');
        expect(element.hasAttribute('data-tone')).toBe(false);
    });

    it.each<Record<string, string>>([{ urgent: 'x' }, { soon: '' }])('thresholds_that_are_not_numbers_log_and_render_empty_%j', (attributes) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { element } = mount(daysLeft({ days: '5', ...attributes }));

        expect(error).toHaveBeenCalled();
        expect(element.textContent).toBe('');
        expect(element.hasAttribute('data-tone')).toBe(false);
    });

    it('urgent_larger_than_soon_logs_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { element } = mount(daysLeft({ days: '5', urgent: '20', soon: '10' }));

        expect(error).toHaveBeenCalled();
        expect(element.textContent).toBe('');
        expect(element.hasAttribute('data-tone')).toBe(false);
    });
});

describe('deadlineTone', () => {
    it('gives_the_same_tone_as_the_element_and_throws_for_a_fraction', () => {
        for (const days of [-3, 0, 7, 8, 14, 15]) {
            const { element } = mount(daysLeft({ days: String(days) }));
            expect(deadlineTone(days, 7, 14)).toBe(element.dataset.tone);
        }
        expect(deadlineTone(4, 3, 5)).toBe('warn');
        expect(() => deadlineTone(1.5, 7, 14)).toThrow();
    });
});
