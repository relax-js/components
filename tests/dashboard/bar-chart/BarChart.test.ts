import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/bar-chart/BarChart';
import type { BarChart, ChartData } from '../../../src/dashboard/bar-chart/BarChart';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';

// The plot inside the 640 x 230 drawing: 72 left, 12 right, 12 top, 28 bottom.
const plot = { left: 72, top: 12, width: 556, height: 190 };

function chart(data: ChartData | undefined, attributes: Record<string, string> = {}): BarChart {
    const element = document.createElement('r-bar-chart');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    element.axisFormat = String;
    element.valueFormat = String;
    document.body.append(element);
    if (data) {
        element.data = data;
    }
    return element;
}

function bars(element: Element, series: number): SVGRectElement[] {
    return [...element.querySelectorAll<SVGRectElement>(`g.series-${String(series)} rect.bar`)];
}

function num(element: Element, name: string): number {
    return Number(element.getAttribute(name));
}

function data(...series: { name: string; values: (number | null)[]; threshold?: boolean; area?: boolean }[]): ChartData {
    return { labels: ['A', 'B', 'C'], series, summary: 'Summary' };
}

describe('r-bar-chart', () => {
    afterEach(() => {
        document.body.replaceChildren();
        resetFormatting();
        vi.restoreAllMocks();
    });

    it('a_series_with_the_wrong_number_of_values_reports_an_error_naming_it_and_draws_nothing', () => {
        const reported = captureProblems();
        const element = chart(data({ name: 'Cash', values: [1, 2] }));

        expect(reported.messages()).toContainEqual(expect.stringContaining('Cash'));
        expect(element.querySelector('svg')).toBeNull();
    });

    it('a_series_with_the_wrong_number_of_values_reports_an_error_naming_the_tag_and_the_series', () => {
        const reported = captureProblems();
        chart(data({ name: 'Cash', values: [1, 2] }));

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-bar-chart'));
        expect(reported.messages()).toContainEqual(expect.stringContaining('"Cash"'));
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, '5' as unknown as number])(
        'a_value_that_is_not_a_finite_number_logs_an_error_naming_the_tag_and_series_and_draws_nothing',
        (bad) => {
            const reported = captureProblems();
            const element = chart(data({ name: 'Bad', values: [1, bad, 3] }));

            expect(reported.messages()).toContainEqual(expect.stringContaining('r-bar-chart'));
            expect(reported.messages()).toContainEqual(expect.stringContaining('"Bad"'));
            expect(element.querySelector('svg')).toBeNull();
        },
    );

    it('a_missing_value_leaves_its_bar_out_and_reads_out_the_no_data_word', () => {
        const element = chart(data({ name: 'One', values: [1, null, 3] }));

        expect(bars(element, 1)).toHaveLength(2);
        element.querySelectorAll('rect.band')[1].dispatchEvent(new Event('pointermove'));
        expect(element.querySelector('.readout')?.textContent).toContain('One: No data');
    });

    it('the_chart_has_a_legend_in_series_order_and_series_colours', () => {
        const element = chart(data({ name: 'One', values: [1, 2, 3] }, { name: 'Two', values: [1, 2, 3] }));

        const legend = [...element.querySelectorAll('ul.legend li')];
        expect(legend.map((item) => item.textContent)).toEqual(['One', 'Two']);
        expect(legend.map((item) => item.className)).toEqual(['series-1', 'series-2']);
        expect(element.querySelector('g.series.series-2')).not.toBeNull();
    });

    it('bars_stand_upright_by_default_and_lie_sideways_when_horizontal', () => {
        const upright = chart(data({ name: 'One', values: [10, 20, 30] }));
        const sideways = chart(data({ name: 'One', values: [10, 20, 30] }), { orientation: 'horizontal' });

        const [first, , third] = bars(upright, 1);
        expect(num(third, 'x')).toBeGreaterThan(num(first, 'x'));
        expect(num(third, 'height')).toBeGreaterThan(num(first, 'height'));
        const [sideFirst, , sideThird] = bars(sideways, 1);
        expect(num(sideThird, 'y')).toBeGreaterThan(num(sideFirst, 'y'));
        expect(num(sideThird, 'width')).toBeGreaterThan(num(sideFirst, 'width'));
        expect(sideways.querySelector('text.label')?.getAttribute('text-anchor')).toBe('end');
    });

    it('an_orientation_other_than_vertical_or_horizontal_reports_an_error_naming_the_tag_and_draws_nothing', () => {
        const reported = captureProblems();
        const element = chart(data({ name: 'One', values: [1, 2, 3] }), { orientation: 'diagonal' });

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-bar-chart'));
        expect(element.querySelector('svg')).toBeNull();
    });

    it('changing_orientation_or_stacked_redraws_the_chart', () => {
        const element = chart(data({ name: 'One', values: [1, 2, 3] }, { name: 'Two', values: [1, 2, 3] }));
        const grouped = num(bars(element, 2)[0], 'x');

        element.setAttribute('stacked', '');
        expect(num(bars(element, 2)[0], 'x')).not.toBe(grouped);

        element.setAttribute('orientation', 'horizontal');
        expect(num(bars(element, 1)[0], 'width')).toBeGreaterThan(0);
        expect(num(bars(element, 1)[0], 'x')).toBe(plot.left);
    });

    it('each_label_gets_an_equal_band_with_its_bar_centred_in_it', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }));

        const band = plot.width / 3;
        bars(element, 1).forEach((bar, index) => {
            expect(num(bar, 'x') + num(bar, 'width') / 2).toBeCloseTo(plot.left + band * (index + 0.5), 5);
        });
    });

    it('several_series_sit_side_by_side_in_series_order_centred_in_the_band', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }, { name: 'Two', values: [5, 15, 25] }));

        const one = bars(element, 1)[0];
        const two = bars(element, 2)[0];
        expect(num(two, 'x')).toBeCloseTo(num(one, 'x') + num(one, 'width'), 5);
        const middle = (num(one, 'x') + num(two, 'x') + num(two, 'width')) / 2;
        expect(middle).toBeCloseTo(plot.left + plot.width / 6, 5);
    });

    it('stacked_series_share_one_bar_per_label_in_series_order', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }, { name: 'Two', values: [5, 15, 25] }), { stacked: '' });

        const one = bars(element, 1)[0];
        const two = bars(element, 2)[0];
        expect(num(two, 'x')).toBe(num(one, 'x'));
        expect(num(two, 'y') + num(two, 'height')).toBeCloseTo(num(one, 'y'), 5);
    });

    it('positive_and_negative_values_stack_outward_from_zero_on_opposite_sides', () => {
        const element = chart(
            data({ name: 'One', values: [10, 10, 10] }, { name: 'Two', values: [-5, -5, -5] }, { name: 'Three', values: [10, 10, 10] }, { name: 'Four', values: [-5, -5, -5] }),
            { stacked: '' },
        );

        const [one, two, three, four] = [1, 2, 3, 4].map((n) => bars(element, n)[0]);
        expect(num(three, 'y') + num(three, 'height')).toBeCloseTo(num(one, 'y'), 5);
        expect(num(four, 'y')).toBeCloseTo(num(two, 'y') + num(two, 'height'), 5);
        expect(num(two, 'y')).toBeGreaterThan(num(one, 'y'));
    });

    it('a_threshold_series_is_a_dashed_level_never_a_bar_never_stacked_and_ignores_area', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }, { name: 'Minimum', values: [15, 15, 15], threshold: true, area: true }), {
            stacked: '',
        });

        expect(bars(element, 2)).toHaveLength(0);
        const line = element.querySelector('g.series-2 polyline.threshold');
        expect(line).not.toBeNull();
        const first = (line?.getAttribute('points') ?? '').split(' ')[0].split(',');
        expect(Number(first[0])).toBe(plot.left);
        // 15 on an axis from 0 to 30 is half way up the plot.
        expect(Number(first[1])).toBeCloseTo(plot.top + plot.height / 2, 5);
        expect(element.querySelector('g.series-2 polygon, g.series-2 path')).toBeNull();
    });

    it('the_value_axis_starts_at_zero_and_ends_on_a_round_figure_above_the_highest_bar', () => {
        const element = chart(data({ name: 'One', values: [10, 87, 30] }));

        const labels = [...element.querySelectorAll('text.axis-label:not(.label)')].map((label) => label.textContent);
        expect(labels).toEqual(['0', '25', '50', '75', '100']);
    });

    it('a_negative_value_draws_below_zero_and_the_axis_extends_to_a_round_figure_below', () => {
        const element = chart(data({ name: 'One', values: [-30, 80, 0] }));

        const labels = [...element.querySelectorAll('text.axis-label:not(.label)')].map((label) => label.textContent);
        expect(labels).toEqual(['-50', '0', '50', '100']);
        const [negative, positive] = bars(element, 1);
        const zero = plot.top + (plot.height * 100) / 150;
        expect(num(negative, 'y')).toBeCloseTo(zero, 5);
        expect(num(positive, 'y') + num(positive, 'height')).toBeCloseTo(zero, 5);
    });

    it('show_values_writes_each_value_past_the_bar_end_and_leaves_out_what_does_not_fit', () => {
        const element = chart(data({ name: 'One', values: [50, 100, 25] }), { 'show-values': '' });
        element.valueFormat = (value) => (value === 25 ? 'x'.repeat(40) : String(value));

        const written = [...element.querySelectorAll('text.value')].map((value) => value.textContent);
        // 100 reaches the top of the plot, so there is no room above it, and 40 characters exceed the band.
        expect(written).toEqual(['50']);
        const text = element.querySelector('text.value');
        const bar = bars(element, 1)[0];
        expect(num(text as Element, 'y')).toBeLessThan(num(bar, 'y'));
    });

    it('a_stacked_value_is_written_inside_its_segment_and_left_out_where_it_is_too_small', () => {
        const element = chart(data({ name: 'One', values: [50, 50, 50] }, { name: 'Two', values: [50, 1, 50] }), { stacked: '', 'show-values': '' });

        const written = [...element.querySelectorAll('g.series-2 text.value')];
        expect(written).toHaveLength(2);
        const bar = bars(element, 2)[0];
        const y = num(written[0], 'y');
        expect(y).toBeGreaterThan(num(bar, 'y'));
        expect(y).toBeLessThan(num(bar, 'y') + num(bar, 'height') + 4);
    });

    it('data_with_no_labels_shows_the_empty_state_instead_of_axes_bars_and_legend', () => {
        configureFormatting({ locale: 'en-US' });
        const element = chart({ labels: [], series: [{ name: 'One', values: [] }], summary: 'Nothing' });

        expect(element.querySelector('.empty')?.textContent).toBe('No data');
        expect(element.querySelector('svg')).toBeNull();
        expect(element.querySelector('ul.legend')).toBeNull();
    });

    it('pointing_anywhere_in_a_labels_band_selects_it_and_reads_out_every_series', () => {
        const element = chart(data({ name: 'One', values: [1, 2, 3] }, { name: 'Two', values: [4, 5, 6] }));
        const readout = element.querySelector<HTMLElement>('.readout');
        expect(readout?.hidden).toBe(true);

        const bands = element.querySelectorAll('rect.band');
        bands[1].dispatchEvent(new Event('pointermove'));

        expect(bands[1].classList.contains('selected')).toBe(true);
        expect(readout?.hidden).toBe(false);
        expect(readout?.textContent).toContain('B');
        expect(readout?.textContent).toContain('One: 2');
        expect(readout?.textContent).toContain('Two: 5');

        element.querySelector('svg')?.dispatchEvent(new Event('pointerleave'));
        expect(readout?.hidden).toBe(true);
    });

    it('a_label_whose_values_are_all_zero_is_still_selected_and_read_out', () => {
        const element = chart(data({ name: 'One', values: [5, 0, 3] }));

        element.querySelectorAll('rect.band')[1].dispatchEvent(new Event('pointerenter'));

        expect(element.querySelector('rect.band.selected')).not.toBeNull();
        expect(element.querySelector('.readout')?.textContent).toContain('One: 0');
    });

    it('the_chart_is_a_figure_named_by_the_summary_with_the_drawing_hidden_and_a_hidden_table_of_the_figures', () => {
        const element = chart(data({ name: 'One', values: [1, null, 3] }, { name: 'Two', values: [4, 5, 6] }));

        const figure = element.querySelector('[role=figure]');
        expect(figure?.getAttribute('aria-label')).toBe('Summary');
        expect(element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        const rows = [...element.querySelectorAll('table.visually-hidden tr')].map((row) =>
            [...row.children].map((cell) => cell.textContent),
        );
        expect(rows).toEqual([
            ['', 'One', 'Two'],
            ['A', '1', '4'],
            ['B', '', '5'],
            ['C', '3', '6'],
        ]);
    });

    function axisLabels(element: Element): (string | null)[] {
        return [...element.querySelectorAll('text.axis-label:not(.label)')].map((label) => label.textContent);
    }

    function readoutAt(element: Element, label: number): string {
        element.querySelectorAll('rect.band')[label].dispatchEvent(new Event('pointermove'));
        return element.querySelector('.readout')?.textContent ?? '';
    }

    function tableRows(element: Element): (string | null)[][] {
        return [...element.querySelectorAll('table.visually-hidden tr')].map((row) => [...row.children].map((cell) => cell.textContent));
    }

    it('a_stacked_value_axis_covers_the_largest_stack_at_any_label', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }, { name: 'Two', values: [10, 20, 30] }), { stacked: '' });

        expect(axisLabels(element).at(-1)).toBe('60');
    });

    it('a_stacked_value_axis_covers_the_lowest_negative_stack_too', () => {
        const element = chart(data({ name: 'One', values: [-10, -20, -30] }, { name: 'Two', values: [-10, -20, -30] }), { stacked: '' });

        expect(axisLabels(element)[0]).toBe('-60');
    });

    it('a_threshold_series_is_not_counted_in_the_stacked_axis_or_total', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }, { name: 'Two', values: [1, 2, 3] }, { name: 'Min', values: [500, 500, 500], threshold: true }), {
            stacked: '',
        });

        expect(axisLabels(element).at(-1)).toBe('40');
        const readout = readoutAt(element, 0);
        expect(readout).toContain('Total: 11');
        expect(tableRows(element)[1]).toEqual(['A', '10', '1', '500', '11']);
    });

    it('the_stacked_read_out_shows_each_series_own_value_and_the_labels_total', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }, { name: 'Two', values: [5, 15, 25] }), { stacked: '' });

        const readout = readoutAt(element, 1);
        expect(readout).toContain('One: 20');
        expect(readout).toContain('Two: 15');
        expect(readout).toContain('Total: 35');
    });

    it('a_single_stacked_series_shows_no_total_in_the_read_out', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }), { stacked: '' });

        expect(readoutAt(element, 1)).not.toContain('Total');
    });

    it('a_missing_value_leaves_the_total_as_the_sum_of_the_values_present', () => {
        const element = chart(data({ name: 'One', values: [10, null, 30] }, { name: 'Two', values: [5, 15, 25] }), { stacked: '' });

        expect(readoutAt(element, 1)).toContain('Total: 15');
    });

    it('the_hidden_table_of_a_stacked_chart_has_a_total_column_after_the_series_columns', () => {
        const element = chart(data({ name: 'One', values: [10, null, 30] }, { name: 'Two', values: [5, 15, 25] }), { stacked: '' });

        expect(tableRows(element)).toEqual([
            ['', 'One', 'Two', 'Total'],
            ['A', '10', '5', '15'],
            ['B', '', '15', '15'],
            ['C', '30', '25', '55'],
        ]);
    });

    it('a_single_series_table_has_no_total_column', () => {
        const element = chart(data({ name: 'One', values: [10, 20, 30] }), { stacked: '' });

        expect(tableRows(element)[0]).toEqual(['', 'One']);
    });
});
