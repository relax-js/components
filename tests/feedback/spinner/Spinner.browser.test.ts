import { describe, expect, it } from 'vitest';
import '../../../src/feedback/spinner/Spinner';
import { mount, overflowing, widths } from '../../layout';

describe('r-spinner layout', () => {
    it.each(widths)('at_%ipx_the_overlay_covers_exactly_the_content_it_wraps', async (width) => {
        const element = document.createElement('r-spinner');
        element.setAttribute('loading', '');
        element.innerHTML = '<p>Orders waiting to be packed and shipped from the main warehouse.</p>';
        await mount(element, width);

        // The overlay lies over the content on purpose, so only sticking out is checked.
        expect(overflowing(element)).toEqual([]);
        const overlay = element.shadowRoot!.querySelector('[part~="overlay"]')!.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        expect([overlay.left, overlay.right, overlay.top, overlay.bottom]).toEqual([box.left, box.right, box.top, box.bottom]);
    });
});
