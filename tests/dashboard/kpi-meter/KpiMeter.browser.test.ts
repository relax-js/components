import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/kpi-meter/KpiMeter';
import { layoutProblems, mount, widths } from '../../layout';

function meter(): HTMLElement {
    const element = document.createElement('r-kpi-meter');
    element.setAttribute('label', 'Requests served this month across every region');
    element.setAttribute('value', '2840000000');
    element.setAttribute('previous', '2310000000');
    return element;
}

describe('r-kpi-meter layout', () => {
    it.each(widths)('at_%ipx_the_figures_and_bar_fit_without_text_overlapping', async (width) => {
        const element = await mount(meter(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
