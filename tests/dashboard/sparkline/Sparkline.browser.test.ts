import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/sparkline/Sparkline';
import type { Sparkline } from '../../../src/dashboard/sparkline/Sparkline';
import { layoutProblems, mount } from '../../layout';

function sparkline(): Sparkline {
    const element = document.createElement('r-sparkline');
    const labels = Array.from({ length: 30 }, (_, i) => String(i + 1));
    element.data = { labels, series: [{ name: 'Requests', values: labels.map((_, i) => 1400 + Math.round(Math.sin(i / 3) * 200)) }], summary: 'Requests per second' };
    return element;
}

describe('r-sparkline layout', () => {
    it.each([96, 190, 480])('at_%ipx_the_line_and_its_end_marker_stay_inside', async (width) => {
        const element = await mount(sparkline(), width);

        expect(layoutProblems(element)).toEqual([]);
        expect(element.getBoundingClientRect().height).toBeGreaterThan(0);
    });
});
