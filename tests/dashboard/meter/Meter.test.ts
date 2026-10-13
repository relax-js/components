import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/meter/Meter';
import type { Meter } from '../../../src/dashboard/meter/Meter';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';

function meter(attributes: Record<string, string>): Meter {
    const element = document.createElement('r-meter');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
}

const base = { label: 'Storage', max: '100' };

function toneOf(value: string, extra: Record<string, string> = {}): string | undefined {
    return mount(meter({ ...base, value, ...extra })).element.dataset.tone;
}

function fillOf(element: Meter): string {
    return element.querySelector<HTMLElement>('.fill')?.style.width ?? '';
}

describe('r-meter', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        resetFormatting();
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('meter_inputs_are_label_value_max_warn_at_danger_at_and_unit', () => {
        const element = mount(meter({ ...base, value: '30', 'warn-at': '50', 'danger-at': '70', unit: 'GB' })).element;

        expect(element.textContent).toContain('Storage');
        expect(element.textContent).toContain('30 GB of 100 GB');
        expect(element.dataset.tone).toBe('ok');
    });

    it('fill_is_the_values_share_of_the_limit', () => {
        expect(fillOf(mount(meter({ ...base, value: '25' })).element)).toBe('25%');
    });

    it('a_value_over_the_limit_fills_the_whole_track_and_shows_the_real_value', () => {
        const element = mount(meter({ ...base, value: '150' })).element;

        expect(fillOf(element)).toBe('100%');
        expect(element.textContent).toContain('150 of 100');
    });

    it('a_negative_value_fills_nothing', () => {
        expect(fillOf(mount(meter({ ...base, value: '-5' })).element)).toBe('0%');
    });

    it('figures_are_one_message_with_numbers_formatted_for_the_locale', async () => {
        configureFormatting({ locale: 'sv-SE' });
        await rewordEnglish({ meterFigures: '{value} av {limit}' });
        const element = mount(meter({ label: 'x', value: '1234.5', max: '10000' })).element;

        expect(element.querySelector('.figures')?.textContent).toBe(
            `${new Intl.NumberFormat('sv-SE').format(1234.5)} av ${new Intl.NumberFormat('sv-SE').format(10000)}`
        );
    });

    it('unit_is_shown_as_given_on_each_figure', () => {
        const element = mount(meter({ ...base, value: '5', unit: 'GB/mån' })).element;

        expect(element.querySelector('.figures')?.textContent).toBe('5 GB/mån of 100 GB/mån');
    });

    it('no_percentage_of_the_limit_is_shown', () => {
        expect(mount(meter({ ...base, value: '25' })).element.textContent).not.toContain('%');
    });

    it('tone_is_ok_below_80_percent_warn_from_it_and_danger_from_the_limit', () => {
        expect(['79', '80', '99', '100'].map((v) => toneOf(v))).toEqual(['ok', 'warn', 'warn', 'danger']);
    });

    it('a_value_equal_to_the_limit_is_danger', () => {
        expect(toneOf('100')).toBe('danger');
    });

    it('own_thresholds_replace_the_defaults', () => {
        const extra = { 'warn-at': '10', 'danger-at': '20' };

        expect(['9', '10', '19', '20'].map((v) => toneOf(v, extra))).toEqual(['ok', 'warn', 'warn', 'danger']);
    });

    it('a_lower_value_never_gets_a_stronger_tone_than_a_higher_one', () => {
        const rank = ['ok', 'warn', 'danger'];
        const tones = ['10', '50', '70', '90', '100'].map((v) => rank.indexOf(toneOf(v, { 'danger-at': '60' }) ?? ''));

        expect(tones).toEqual([...tones].sort());
        expect(tones[0]).toBe(0);
    });

    it('the_tone_is_carried_as_data_tone_with_its_icon_beside_the_figures', () => {
        const element = mount(meter({ ...base, value: '100' })).element;

        expect(element.dataset.tone).toBe('danger');
        expect(element.querySelector('r-icon')?.getAttribute('name')).toBe('x-circle');
    });

    it('the_meter_is_exposed_as_role_meter_named_by_label_with_range_and_value_text', () => {
        const element = mount(meter({ ...base, value: '30' })).element;

        expect(element.getAttribute('role')).toBe('meter');
        expect(element.getAttribute('aria-label')).toBe('Storage');
        expect(element.getAttribute('aria-valuemin')).toBe('0');
        expect(element.getAttribute('aria-valuemax')).toBe('100');
        expect(element.getAttribute('aria-valuenow')).toBe('30');
        expect(element.getAttribute('aria-valuetext')).toBe('30 of 100');
    });

    it('a_value_over_the_limit_reports_the_limit_as_current_value_and_real_figures_as_text', () => {
        const element = mount(meter({ ...base, value: '150' })).element;

        expect(element.getAttribute('aria-valuenow')).toBe('100');
        expect(element.getAttribute('aria-valuetext')).toBe('150 of 100');
    });

    it('bad_input_reports_an_error_and_renders_empty', () => {
        const reported = captureProblems();
        const bad: Record<string, string>[] = [
            { max: '100', value: '1' },
            { label: 'x', max: '100' },
            { label: 'x', max: '100', value: 'abc' },
            { label: 'x', value: '1' },
            { label: 'x', max: 'abc', value: '1' },
            { label: 'x', max: '0', value: '1' },
            { label: 'x', max: '-3', value: '1' },
            { ...base, value: '1', 'warn-at': '60', 'danger-at': '50' },
        ];

        for (const attributes of bad) {
            const element = mount(meter(attributes)).element;
            expect(element.childElementCount).toBe(0);
            expect(element.hasAttribute('role')).toBe(false);
        }
        expect(reported.messages()).toHaveLength(bad.length);
    });

    it('changing_attributes_updates_in_place_without_a_second_track', () => {
        const element = mount(meter({ ...base, value: '10' })).element;

        element.setAttribute('value', '170');
        element.setAttribute('max', '200');

        expect(element.querySelectorAll('.track')).toHaveLength(1);
        expect(fillOf(element)).toBe('85%');
        expect(element.querySelector('.figures')?.textContent).toBe('170 of 200');
        expect(element.dataset.tone).toBe('warn');
    });
});
