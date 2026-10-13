import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/bar-chart/BarChart';
import type { BarChart, ChartData } from '../../../src/dashboard/bar-chart/BarChart';
import { mount, overflowing, overlapping, resize, tooSmallText, widths } from '../../layout';

const services = ['gateway', 'checkout', 'payments', 'search', 'shipping'];

const errors: ChartData = {
    labels: services,
    series: [
        { name: 'Client errors', values: [140, 180, 210, 290, 190] },
        { name: 'Server errors', values: [120, 30, 40, 50, 60] },
        { name: 'Timeouts', values: [10, 40, 20, 60, 30] },
        { name: 'Error budget', values: services.map(() => 400), threshold: true },
    ],
    summary: 'Errors per service',
};

const spending: ChartData = {
    labels: ['Groceries and household', 'Rent', 'Transport', 'Eating out', 'Subscriptions and memberships'],
    series: [{ name: 'Spent', values: [6200, 9800, 1400, 2100, 640] }],
    summary: 'Spending per category',
};

function chart(data: ChartData, attributes: Record<string, string> = {}): BarChart {
    const element = document.createElement('r-bar-chart');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    element.data = data;
    return element;
}

function labels(element: BarChart): SVGTextElement[] {
    return [...element.querySelectorAll<SVGTextElement>('text.axis-label')];
}

describe('r-bar-chart layout', () => {
    describe.each(widths)('at %ipx', (width) => {
        it('upright_stacked_bars_fit_with_readable_labels_that_do_not_overlap', async () => {
            const element = await mount(chart(errors, { stacked: '' }), width);

            expect(overflowing(element)).toEqual([]);
            expect(tooSmallText(element)).toEqual([]);
            expect(overlapping(labels(element))).toEqual([]);
        });

        it('sideways_bars_with_values_fit_with_readable_labels_that_do_not_overlap', async () => {
            const element = await mount(chart(spending, { orientation: 'horizontal', 'show-values': '' }), width);

            expect(overflowing(element)).toEqual([]);
            expect(tooSmallText(element)).toEqual([]);
            expect(overlapping(labels(element))).toEqual([]);
        });
    });

    it('a_chart_that_narrows_redraws_so_its_text_keeps_its_size', async () => {
        const element = await mount(chart(errors, { stacked: '' }), 960);

        await resize(element, 280);

        expect(tooSmallText(element)).toEqual([]);
        expect(overflowing(element)).toEqual([]);
    });
});
