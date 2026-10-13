import { afterEach, describe, expect, it } from 'vitest';
import '../../../src/theme.css';
import '../../../src/dashboard/status-mark/StatusMark';

describe('tones in a shadow root', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('a_toned_component_inside_a_shadow_root_takes_its_tone_colour', () => {
        const host = document.createElement('div');
        document.body.append(host);
        const mark = document.createElement('r-status-mark');
        mark.setAttribute('tone', 'warn');
        mark.textContent = 'Late';
        host.attachShadow({ mode: 'open' }).append(mark);

        const style = getComputedStyle(mark);
        expect(style.getPropertyValue('--tone').trim()).not.toBe('');
        expect(style.getPropertyValue('--tone')).toBe(getComputedStyle(document.documentElement).getPropertyValue('--status-warning'));
    });
});
