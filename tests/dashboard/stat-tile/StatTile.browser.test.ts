import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/stat-tile/StatTile';
import '../../../src/dashboard/sparkline/Sparkline';
import type { Sparkline } from '../../../src/dashboard/sparkline/Sparkline';
import { layoutProblems, mount, widths } from '../../layout';

function tile(): HTMLElement {
    const element = document.createElement('r-stat-tile');
    element.setAttribute('label', 'Requests per second at the edge');
    element.setAttribute('value', '1284567');
    element.setAttribute('previous', '1150000');
    element.setAttribute('period', '30 s ago');
    const spark = document.createElement('r-sparkline') as Sparkline;
    const labels = Array.from({ length: 30 }, (_, i) => String(i));
    spark.data = { labels, series: [{ name: 'Requests', values: labels.map((_, i) => 1400 + (i % 5) * 40) }], summary: 'Requests per second' };
    element.append(spark);
    return element;
}

describe('r-stat-tile layout', () => {
    it.each([160, ...widths])('at_%ipx_the_label_value_change_and_trend_fit_without_text_overlapping', async (width) => {
        const element = await mount(tile(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
