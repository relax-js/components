import { afterEach, describe, expect, it, vi } from 'vitest';
import { readTone, toneIcon } from '../../../src/foundations/tone/tone';

describe('readTone', () => {
    afterEach(() => vi.restoreAllMocks());

    it('a_missing_tone_attribute_gives_the_fallback', () => {
        expect(readTone(document.createElement('div'), 'muted')).toBe('muted');
    });

    it('a_known_tone_is_returned', () => {
        const element = document.createElement('div');
        element.setAttribute('tone', 'warn');

        expect(readTone(element, 'muted')).toBe('warn');
    });

    it('an_unknown_tone_logs_an_error_naming_the_tag_and_gives_the_fallback', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const element = document.createElement('r-card');
        element.setAttribute('tone', 'loud');

        expect(readTone(element, 'info')).toBe('info');
        expect(error.mock.calls[0][0]).toMatch(/^r-card: tone "loud"/);
    });

    it('every_tone_has_an_icon_so_it_is_never_told_by_colour_alone', () => {
        expect(toneIcon).toEqual({
            ok: 'check-circle',
            info: 'clock',
            warn: 'minus-circle',
            danger: 'x-circle',
            muted: 'info',
        });
    });
});
