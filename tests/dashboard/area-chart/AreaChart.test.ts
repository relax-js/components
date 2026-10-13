import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/area-chart/AreaChart';
import type { AreaChart, AreaChartData } from '../../../src/dashboard/area-chart/AreaChart';

function chartWith(data: AreaChartData): AreaChart {
    const chart = document.createElement('r-area-chart');
    mount(chart);
    chart.data = data;
    return chart;
}

function axis(chart: AreaChart): number[] {
    return Array.from(chart.querySelectorAll('.axis-label')).map((t) => Number(t.textContent!.replace('−', '-').replace(/[^\d-]/g, '')));
}

/** The y coordinates of a path's points. */
function ys(path: Element): number[] {
    return Array.from(path.getAttribute('d')!.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)).map((m) => Number(m[2]));
}

const labels = ['Jan', 'Feb', 'Mar'];
const rent = { name: 'Rent', values: [10, 12, 14] };
const food = { name: 'Food', values: [5, 6, 7] };

describe('r-area-chart', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('the_page_sets_labels_series_and_summary_as_data', () => {
        const data = { labels, series: [rent], summary: 'Costs' };
        const chart = chartWith(data);

        expect(chart.data).toEqual(data);
        expect(chart.getAttribute('aria-label')).toBe('Costs');
        expect(chart.querySelectorAll('g.series')).toHaveLength(1);
    });

    it('a_series_with_a_different_number_of_values_than_labels_logs_an_error_naming_it_and_draws_nothing', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const chart = chartWith({ labels, series: [rent, { name: 'Short', values: [1] }], summary: 'Costs' });

        expect(error).toHaveBeenCalledWith(expect.stringContaining('Short'));
        expect(chart.querySelector('svg')).toBeNull();
    });

    it('stacked_series_are_bands_on_top_of_the_earlier_ones_with_the_first_on_the_zero_line', () => {
        const chart = chartWith({ labels, series: [rent, food], summary: 'Costs' });
        const [first, second] = Array.from(chart.querySelectorAll('g.series'));
        const zeroY = Number(chart.querySelector('.zero')!.getAttribute('y1'));

        const firstArea = ys(first.querySelector('.area')!);
        expect(firstArea.slice(-3)).toEqual([zeroY, zeroY, zeroY]);
        const firstTop = ys(first.querySelector('.line')!);
        const secondTop = ys(second.querySelector('.line')!);
        secondTop.forEach((y, i) => expect(y).toBeLessThan(firstTop[i]));
        const secondArea = ys(second.querySelector('.area')!);
        expect(secondArea.slice(-3).reverse()).toEqual(firstTop);
    });

    it('a_single_series_is_a_line_with_the_space_down_to_zero_shaded', () => {
        const chart = chartWith({ labels, series: [rent], summary: 'Costs' });
        const zeroY = Number(chart.querySelector('.zero')!.getAttribute('y1'));

        expect(chart.querySelector('.line')).not.toBeNull();
        expect(ys(chart.querySelector('.area')!).slice(-3)).toEqual([zeroY, zeroY, zeroY]);
    });

    it('a_single_series_below_zero_dips_under_the_zero_line_and_the_axis_extends_down', () => {
        const chart = chartWith({ labels, series: [{ name: 'Net', values: [-30, 10, -5] }], summary: 'Costs' });
        const zeroY = Number(chart.querySelector('.zero')!.getAttribute('y1'));
        const line = ys(chart.querySelector('.line')!);

        expect(line[0]).toBeGreaterThan(zeroY);
        expect(Math.min(...axis(chart))).toBeLessThanOrEqual(-30);
        expect(ys(chart.querySelector('.area')!).slice(-3)).toEqual([zeroY, zeroY, zeroY]);
    });

    it('the_axis_starts_at_zero_and_ends_on_a_round_figure_above_the_highest_point', () => {
        const chart = chartWith({ labels, series: [rent, food], summary: 'Costs' });

        expect(Math.min(...axis(chart))).toBe(0);
        expect(Math.max(...axis(chart))).toBe(30);
    });

    it('a_threshold_series_is_a_dashed_line_outside_the_stack_and_the_total', () => {
        const chart = chartWith({
            labels,
            series: [rent, food, { name: 'Limit', values: [8, 8, 8], threshold: true }],
            summary: 'Costs'
        });
        const threshold = chart.querySelector('g.series.threshold')!;

        expect(threshold.querySelector('.area')).toBeNull();
        expect(chart.querySelectorAll('g.series:not(.threshold)')).toHaveLength(2);
        expect(chart.querySelector('g.series-3.threshold')).not.toBeNull();
        // The stack still tops out at 21 (axis 25), so the threshold did not join it.
        expect(Math.max(...axis(chart))).toBe(30);
        // Drawn after the bands, so it lies over them.
        expect(chart.querySelector('g.series:last-of-type')).toBe(threshold);
    });

    it('a_pointer_anywhere_in_the_plot_height_snaps_a_crosshair_to_the_nearest_label', () => {
        const chart = chartWith({ labels, series: [rent], summary: 'Costs' });
        const svg = chart.querySelector('svg')!;
        // 1:1 with the 640 wide viewBox.
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 230 }) as DOMRect;
        const crosshair = chart.querySelector('.crosshair')!;
        const labelX = (i: number) => 72 + (556 * i) / 2;

        for (const clientY of [15, 120, 200]) {
            svg.dispatchEvent(new MouseEvent('pointermove', { clientX: labelX(1) + 40, clientY }));
            expect(Number(crosshair.getAttribute('x1'))).toBe(labelX(1));
            expect(crosshair.getAttribute('visibility')).toBe('visible');
        }
        svg.dispatchEvent(new MouseEvent('pointermove', { clientX: labelX(2) - 30, clientY: 100 }));
        expect(Number(crosshair.getAttribute('x1'))).toBe(labelX(2));
    });

    it('areas_are_drawn_without_point_markers', () => {
        const chart = chartWith({ labels, series: [rent, food], summary: 'Costs' });

        expect(chart.querySelector('circle')).toBeNull();
    });
});
