import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/line-chart/LineChart';
import type { LineChart } from '../../../src/dashboard/line-chart/LineChart';
import type { ChartData } from '../../../src/dashboard/bar-chart/BarChart';
import { mount, overflowing, overlapping, resize, tooSmallText, widths } from '../../layout';

const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct'];

const balance: ChartData = {
    labels: months,
    series: [
        { name: 'All accounts', values: months.map((_, month) => 146000 + month * 3700), area: true },
        { name: 'Buffer target', values: months.map(() => 150000), threshold: true },
    ],
    summary: 'Balance over the year',
};

function chart(data: ChartData): LineChart {
    const element = document.createElement('r-line-chart');
    element.data = data;
    return element;
}

function labels(element: LineChart): SVGTextElement[] {
    return [...element.querySelectorAll<SVGTextElement>('text.axis-label')];
}

describe('r-line-chart layout', () => {
    it.each(widths)('at_%ipx_the_chart_fits_with_readable_labels_that_do_not_overlap', async (width) => {
        const element = await mount(chart(balance), width);

        expect(overflowing(element)).toEqual([]);
        expect(tooSmallText(element)).toEqual([]);
        expect(overlapping(labels(element))).toEqual([]);
    });

    it('a_chart_narrower_than_it_lays_itself_out_for_is_scaled_down_to_fit', async () => {
        const element = await mount(chart(balance), 120);

        expect(overflowing(element)).toEqual([]);
        expect(overlapping(labels(element))).toEqual([]);
    });

    it('a_chart_that_narrows_redraws_so_its_text_keeps_its_size', async () => {
        const element = await mount(chart(balance), 960);

        await resize(element, 280);

        expect(tooSmallText(element)).toEqual([]);
        expect(overlapping(labels(element))).toEqual([]);
    });
});
