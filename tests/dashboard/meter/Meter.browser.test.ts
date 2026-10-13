import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/meter/Meter';
import { layoutProblems, mount, widths } from '../../layout';

function meter(): HTMLElement {
    const element = document.createElement('r-meter');
    element.setAttribute('label', 'Storage used by attachments');
    element.setAttribute('value', '1223');
    element.setAttribute('max', '2000');
    element.setAttribute('unit', 'GB');
    return element;
}

describe('r-meter layout', () => {
    it.each([...widths, 160])('at_%ipx_the_label_figures_and_track_fit_without_text_overlapping', async (width) => {
        const element = await mount(meter(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
