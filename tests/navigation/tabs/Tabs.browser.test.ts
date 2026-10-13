import { describe, expect, it } from 'vitest';
import '../../../src/navigation/tabs/Tabs';
import { layoutProblems, mount, settle, widths } from '../../layout';

describe('r-tabs layout', () => {
    it.each(widths)('at_%ipx_headers_that_do_not_fit_scroll_within_the_bar_and_the_selected_one_is_in_view', async (width) => {
        const element = document.createElement('r-tabs');
        element.setAttribute('selected', '4');
        element.innerHTML = ['Overview', 'Order lines', 'Delivery address', 'Payments and refunds', 'History', 'Notes']
            .map((label) => `<r-tab label="${label}"><p>${label} of order ORD-2026-1042.</p></r-tab>`).join('');
        await mount(element, width);
        await settle();

        expect(layoutProblems(element)).toEqual([]);
        const selected = element.shadowRoot!.querySelector('[part~="selected"]')!.getBoundingClientRect();
        const bar = element.shadowRoot!.querySelector('[part~="tablist"]')!.getBoundingClientRect();
        expect(selected.left).toBeGreaterThanOrEqual(bar.left - 1);
        expect(selected.right).toBeLessThanOrEqual(bar.right + 1);
    });
});
