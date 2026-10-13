import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/area-chart/AreaChart';
import type { AreaChart, AreaChartData } from '../../../src/dashboard/area-chart/AreaChart';
import { mount, overflowing, overlapping, resize, tooSmallText, widths } from '../../layout';

const days = Array.from({ length: 14 }, (_, day) => `2026-10-${String(day + 1).padStart(2, '0')}`);

const regions: AreaChartData = {
    labels: days,
    series: ['Europe', 'North America', 'Asia Pacific'].map((name, region) => ({
        name,
        values: days.map((_, day) => (3 - region) * 22000 + Math.round(Math.sin(day / 2) * 6000)),
    })),
    summary: 'Requests per day by region',
};

function chart(data: AreaChartData): AreaChart {
    const element = document.createElement('r-area-chart');
    element.data = data;
    return element;
}

function labels(element: AreaChart): SVGTextElement[] {
    return [...element.querySelectorAll<SVGTextElement>('text.axis-label')];
}

describe('r-area-chart layout', () => {
    it.each(widths)('at_%ipx_the_chart_fits_with_readable_labels_that_do_not_overlap', async (width) => {
        const element = await mount(chart(regions), width);

        expect(overflowing(element)).toEqual([]);
        expect(tooSmallText(element)).toEqual([]);
        expect(labels(element).length).toBeGreaterThan(1);
        expect(overlapping(labels(element))).toEqual([]);
    });

    it('a_chart_that_narrows_redraws_so_its_text_keeps_its_size', async () => {
        const element = await mount(chart(regions), 960);

        await resize(element, 280);

        expect(tooSmallText(element)).toEqual([]);
        expect(overlapping(labels(element))).toEqual([]);
    });
});
