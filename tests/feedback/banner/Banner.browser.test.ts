import { describe, expect, it } from 'vitest';
import '../../../src/feedback/banner/Banner';
import { layoutProblems, mount, widths } from '../../layout';

describe('r-banner layout', () => {
    it.each(widths)('at_%ipx_the_icon_message_action_and_close_button_fit_without_text_overlapping', async (width) => {
        const element = document.createElement('r-banner');
        element.setAttribute('tone', 'warn');
        element.setAttribute('dismissible', '');
        element.innerHTML = `Scheduled maintenance of the payment gateway tonight between 22:00 and 23:30; card payments may fail.
            <a slot="action" href="/status">See the status page</a>`;
        await mount(element, width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
