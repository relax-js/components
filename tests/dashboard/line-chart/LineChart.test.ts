import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/line-chart/LineChart';
import type { LineChart } from '../../../src/dashboard/line-chart/LineChart';
import type { ChartData } from '../../../src/dashboard/bar-chart/BarChart';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';

import { text } from '../../../src/foundations/text/text';

function chart(data?: ChartData): LineChart {
    const element = document.createElement('r-line-chart');
    document.body.append(element);
    if (data) {
        element.data = data;
    }
    return element;
}

function data(...series: { name: string; values: (number | null)[]; threshold?: boolean; area?: boolean }[]): ChartData {
    return { labels: ['A', 'B', 'C'], series, summary: 'Summary' };
}

function num(element: Element, name: string): number {
    return Number(element.getAttribute(name));
}

describe('r-line-chart', () => {
    afterEach(() => {
        document.body.replaceChildren();
        resetFormatting();
        vi.restoreAllMocks();
    });

    it('setting_data_on_a_connected_chart_redraws_it', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }));
        expect(element.querySelectorAll('g.series')).toHaveLength(1);

        element.data = data({ name: 'One', values: [1, 2, 3] }, { name: 'Two', values: [3, 2, 1] });

        expect(element.querySelectorAll('g.series')).toHaveLength(2);
        expect(element.data?.series).toHaveLength(2);
    });

    it('a_series_with_the_wrong_number_of_values_reports_an_error_naming_it_and_draws_nothing', () => {
        const reported = captureProblems();
        const element = chart(data({ name: 'Cash', values: [1, 2] }));

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-line-chart'));
        expect(reported.messages()).toContainEqual(expect.stringContaining('Cash'));
        expect(element.querySelector('svg')).toBeNull();
    });

    it('a_value_that_is_not_a_number_reports_an_error_and_a_missing_value_breaks_the_line', () => {
        const reported = captureProblems();
        expect(chart(data({ name: 'Bad', values: [1, Number.NaN, 3] })).querySelector('svg')).toBeNull();
        expect(reported.messages()).toContainEqual(expect.stringContaining('Bad'));

        const element = chart(data({ name: 'Gap', values: [1, null, 3] }));
        expect(element.querySelectorAll('g.series-1 path.line')).toHaveLength(2);
        expect(element.querySelectorAll('g.series-1 circle')).toHaveLength(2);
    });

    it('a_missing_value_reads_out_the_no_data_word', () => {
        const element = chart(data({ name: 'Gap', values: [1, null, 3] }));
        const svg = element.querySelector('svg')!;
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 230 }) as DOMRect;
        svg.dispatchEvent(new MouseEvent('pointermove', { clientX: 350, clientY: 100 }));

        expect(element.querySelector('.readout')?.textContent).toContain('Gap: No data');
    });

    it('more_series_than_the_theme_colours_reports_an_error_and_draws_nothing', () => {
        const reported = captureProblems();
        const many = Array.from({ length: 6 }, (_, i) => ({ name: `S${String(i)}`, values: [1, 2, 3] }));

        expect(chart(data(...many)).querySelector('svg')).toBeNull();
        expect(reported.messages()).toContainEqual(expect.stringContaining('r-line-chart'));
    });

    it('the_svg_has_the_plot_layout_with_a_grid_line_and_axis_label_at_each_step', () => {
        const element = chart(data({ name: 'Cash', values: [0, 50, 100] }));

        const svg = element.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 640 230');
        const lines = [...svg.querySelectorAll('line:not(.crosshair)')];
        expect(lines).toHaveLength(5);
        expect(svg.querySelectorAll('text.axis-label:not(.label)')).toHaveLength(5);
        expect(num(lines[0], 'x1')).toBe(72);
        expect(num(lines[0], 'x2')).toBe(628);
        const ys = lines.map((line) => num(line, 'y1'));
        expect(Math.max(...ys)).toBe(202);
        expect(Math.min(...ys)).toBe(12);
    });

    it('the_value_axis_ends_on_a_round_figure_with_default_amount_formats', () => {
        configureFormatting({ locale: 'en-US', currency: 'USD' });
        const element = chart(data({ name: 'Cash', values: [10, 20, 93] }));

        const labels = [...element.querySelectorAll('text.axis-label:not(.label)')].map((label) => label.textContent);
        expect(labels).toEqual(['0', '25', '50', '75', '100']);
    });

    it('x_labels_are_spaced_evenly_across_the_plot', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }));

        const xs = [...element.querySelectorAll('text.label')].map((label) => num(label, 'x'));
        expect(xs).toEqual([72, 350, 628]);
    });

    it('x_labels_that_do_not_fit_side_by_side_are_thinned_to_every_nth', () => {
        const labels = Array.from({ length: 60 }, (_, i) => `22:28:${String(i).padStart(2, '0')}`);
        const element = chart({ labels, series: [{ name: 'Rps', values: labels.map(() => 1) }], summary: 'S' });

        const shown = [...element.querySelectorAll('text.label')].map((label) => label.textContent);
        expect(shown.length).toBeLessThan(labels.length);
        expect(shown[0]).toBe(labels[0]);
        expect(element.querySelectorAll('circle')).toHaveLength(60);
    });

    it('a_chart_with_one_label_puts_it_in_the_middle', () => {
        const element = chart({ labels: ['Only'], series: [{ name: 'Cash', values: [5] }], summary: 'S' });

        expect(num(element.querySelector('text.label')!, 'x')).toBe(350);
        expect(num(element.querySelector('circle')!, 'cx')).toBe(350);
    });

    it('each_series_is_a_group_numbered_from_one_in_the_order_given', () => {
        const element = chart(data({ name: 'One', values: [1, 2, 3] }, { name: 'Two', values: [3, 2, 1] }));

        const groups = [...element.querySelectorAll('g.series')];
        expect(groups.map((group) => group.classList.contains('series-1') || group.classList.contains('series-2'))).toEqual([true, true]);
        expect(groups[0].classList.contains('series-1')).toBe(true);
        expect(groups[1].classList.contains('series-2')).toBe(true);
    });

    it('a_threshold_series_is_drawn_dashed_and_without_markers', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }, { name: 'Min', values: [1, 1, 1], threshold: true }));

        const threshold = element.querySelector('g.series-2')!;
        expect(threshold.classList.contains('threshold')).toBe(true);
        expect(threshold.querySelector('path.line')).not.toBeNull();
        expect(threshold.querySelector('circle')).toBeNull();
        expect(element.querySelector('g.series-1')!.classList.contains('threshold')).toBe(false);
    });

    it('an_area_series_is_shaded_between_its_line_and_zero', () => {
        const element = chart(data({ name: 'Cash', values: [10, 20, 30], area: true }, { name: 'Plain', values: [1, 2, 3] }));

        const area = element.querySelector('g.series-1 path.area')!;
        const zero = num(element.querySelector('line.zero')!, 'y1');
        expect(area.getAttribute('d')).toContain(`L628,${String(zero)}L72,${String(zero)}Z`);
        expect(element.querySelector('g.series-2 path.area')).toBeNull();
    });

    it('every_series_that_is_not_a_threshold_has_a_marker_of_radius_four_at_each_point', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }, { name: 'Min', values: [1, 1, 1], threshold: true }));

        const markers = [...element.querySelectorAll('g.series-1 circle')];
        expect(markers).toHaveLength(3);
        expect(markers.map((marker) => num(marker, 'r'))).toEqual([4, 4, 4]);
        expect(markers.map((marker) => num(marker, 'cx'))).toEqual([72, 350, 628]);
    });

    it('the_legend_has_one_item_per_series_with_threshold_added_for_threshold_series', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }, { name: 'Min', values: [1, 1, 1], threshold: true }));

        const items = [...element.querySelectorAll('ul.legend li')];
        expect(items.map((item) => item.textContent)).toEqual(['Cash', 'Min']);
        expect(items.map((item) => item.className)).toEqual(['series-1', 'series-2 threshold']);
    });

    function hover(element: LineChart, clientX: number, clientY = 100): SVGSVGElement {
        const svg = element.querySelector('svg')!;
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 230 }) as DOMRect;
        svg.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY }));
        return svg;
    }

    it('a_pointer_anywhere_in_the_plot_height_selects_the_nearest_label', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }));

        hover(element, 300, 5);

        const crosshair = element.querySelector('.crosshair')!;
        expect(crosshair.getAttribute('x1')).toBe('350');
        expect(element.querySelector('.readout-label')?.textContent).toBe('B');
    });

    it('the_selected_label_shows_a_crosshair_and_a_readout_with_every_series_threshold_included', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }, { name: 'Min', values: [1, 1, null], threshold: true }));

        hover(element, 640 - 14);

        const crosshair = element.querySelector('.crosshair')!;
        expect(crosshair.getAttribute('visibility')).toBe('visible');
        const readout = element.querySelector<HTMLElement>('.readout')!;
        expect(readout.hidden).toBe(false);
        expect(readout.querySelector('.readout-label')?.textContent).toBe('C');
        expect(readout.textContent).toContain('Cash: ');
        expect(readout.textContent).toContain('Min: ');
    });

    it('the_crosshair_hides_with_the_readout_on_pointerleave_and_in_the_padding', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }));
        const readout = element.querySelector<HTMLElement>('.readout')!;
        const crosshair = element.querySelector('.crosshair')!;

        const svg = hover(element, 350);
        svg.dispatchEvent(new MouseEvent('pointerleave'));
        expect(crosshair.getAttribute('visibility')).toBe('hidden');
        expect(readout.hidden).toBe(true);

        hover(element, 350);
        hover(element, 30);
        expect(crosshair.getAttribute('visibility')).toBe('hidden');
        expect(readout.hidden).toBe(true);

        hover(element, 350);
        hover(element, 635);
        expect(crosshair.getAttribute('visibility')).toBe('hidden');
        expect(readout.hidden).toBe(true);
    });

    it('data_with_no_labels_or_no_series_shows_the_empty_state_instead_of_axes_lines_and_legend', () => {
        for (const empty of [
            { labels: [], series: [{ name: 'Cash', values: [] }], summary: 'Summary' },
            { labels: ['A', 'B'], series: [], summary: 'Summary' }
        ]) {
            const element = chart(empty);

            expect(element.querySelector('.empty')!.textContent).toBe(text('noData'));
            expect(element.querySelector('svg')).toBeNull();
            expect(element.querySelector('.legend')).toBeNull();
            element.remove();
        }
    });

    it('the_chart_is_a_figure_named_by_its_summary_with_a_hidden_svg', () => {
        const element = chart(data({ name: 'Cash', values: [1, 2, 3] }));
        const figure = element.querySelector('[role="figure"]')!;

        expect(figure.getAttribute('aria-label')).toBe('Summary');
        expect(figure.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
        expect(figure.querySelector('table')).not.toBeNull();
    });

    it('the_hidden_data_table_is_a_visually_hidden_table_with_a_row_per_label_and_a_column_per_series', () => {
        configureFormatting({ locale: 'en-US', currency: 'USD' });
        const element = chart(data({ name: 'Cash', values: [1, null, 3] }, { name: 'Min', values: [2, 2, 2], threshold: true }));
        const table = element.querySelector('table.visually-hidden')!;

        expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(['', 'Cash', 'Min']);
        const rows = [...table.querySelectorAll('tbody tr')];
        expect(rows).toHaveLength(3);
        expect(rows[1].querySelector('th')!.textContent).toBe('B');
        expect(rows[1].querySelectorAll('td')[0].textContent).toBe('');
        expect(rows[0].querySelectorAll('td')[0].textContent).not.toBe('');
    });
});
