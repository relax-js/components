import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/status-mark/StatusMark';
import { layoutProblems, mount } from '../../layout';

describe('r-status-mark layout', () => {
    it.each([90, 280])('at_%ipx_the_icon_label_and_note_fit_without_text_overlapping', async (width) => {
        const element = document.createElement('r-status-mark');
        element.setAttribute('tone', 'danger');
        element.setAttribute('note', 'Expired 2026-10-16 after three reminders');
        element.textContent = 'Renew immediately';
        await mount(element, width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
