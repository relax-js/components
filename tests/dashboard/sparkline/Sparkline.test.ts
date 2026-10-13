import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/sparkline/Sparkline';
import type { Sparkline } from '../../../src/dashboard/sparkline/Sparkline';
import type { ChartData } from '../../../src/dashboard/bar-chart/BarChart';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';
import { text } from '../../../src/foundations/text/text';

function spark(values: (number | null)[], labels?: string[]): Sparkline {
    const element = document.createElement('r-sparkline');
    document.body.append(element);
    element.data = { labels: labels ?? values.map((_, i) => `L${String(i)}`), series: [{ name: 'Cash', values }], summary: 'Summary' };
    return element;
}

function points(path: Element): { x: number; y: number }[] {
    return [...(path.getAttribute('d') ?? '').matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
}

function hover(element: Element, clientX: number): void {
    const svg = element.querySelector('svg')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 30 }) as DOMRect;
    svg.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY: 10 }));
}

describe('r-sparkline', () => {
    afterEach(() => {
        document.body.replaceChildren();
        resetFormatting();
        vi.restoreAllMocks();
    });

    it('the_data_property_with_one_series_draws_and_redraws_when_set_again', () => {
        const element = spark([1, 2, 3]);
        expect(element.querySelector('svg')).not.toBeNull();
        element.data = { labels: ['A'], series: [{ name: 'N', values: [1] }], summary: 'S' };
        expect(element.querySelectorAll('.marker')).toHaveLength(1);
        expect(element.data.labels).toEqual(['A']);
    });

    it('more_than_one_series_reports_an_error_naming_the_tag_and_draws_nothing', () => {
        const reported = captureProblems();
        const element = document.createElement('r-sparkline');
        document.body.append(element);
        const data: ChartData = {
            labels: ['A'],
            series: [
                { name: 'One', values: [1] },
                { name: 'Two', values: [2] },
            ],
            summary: 'S',
        };
        element.data = data;
        expect(reported.messages()).toContainEqual(expect.stringContaining('r-sparkline'));
        expect(element.childElementCount).toBe(0);
    });

    it('the_values_are_drawn_as_one_line_without_axes_grid_labels_or_legend', () => {
        const element = spark([1, 2, 3]);
        expect(element.querySelectorAll('path.line')).toHaveLength(1);
        expect(element.querySelectorAll('svg text, svg line')).toHaveLength(0);
        expect(element.querySelector('.legend')).toBeNull();
    });

    it('the_drawing_stretches_to_the_box_and_the_box_takes_component_variable_defaults', () => {
        const element = spark([1, 2, 3]);
        const svg = element.querySelector('svg')!;
        expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
        const styles = document.querySelector('style[data-r-styles="r-sparkline"]')?.textContent ?? '';
        expect(styles).toContain('var(--sparkline-width');
        expect(styles).toContain('var(--sparkline-height');
    });

    it('the_lowest_value_sits_at_the_bottom_and_the_highest_at_the_top', () => {
        const ys = points(spark([10, 20, 30]).querySelector('path.line')!).map((p) => p.y);
        expect(ys).toEqual([30, 15, 0]);
    });

    it('equal_values_draw_a_level_line_through_the_middle', () => {
        const ys = points(spark([5, 5, 5]).querySelector('path.line')!).map((p) => p.y);
        expect(ys).toEqual([15, 15, 15]);
    });

    it('a_single_value_draws_only_the_marker_in_the_middle', () => {
        const element = spark([5]);
        expect(element.querySelectorAll('path.line')).toHaveLength(0);
        expect(element.querySelector('.marker')?.getAttribute('d')).toBe('M50,15h0');
    });

    it('a_null_breaks_the_line_reads_out_no_data_and_has_an_empty_table_cell', () => {
        const element = spark([1, null, 3, 4]);
        expect(element.querySelectorAll('path.line')).toHaveLength(1);
        expect(element.querySelectorAll('tbody tr')[1].querySelector('td')?.textContent).toBe('');
        hover(element, 33);
        expect(element.querySelector('.readout')?.textContent).toContain(`Cash: ${text('noData')}`);
    });

    it('only_the_last_value_carries_a_marker', () => {
        const element = spark([1, 2, 3]);
        const markers = element.querySelectorAll('.marker');
        expect(markers).toHaveLength(1);
        expect(markers[0].getAttribute('d')).toBe('M100,0h0');
    });

    it('when_the_last_values_are_null_the_marker_sits_on_the_last_present_value', () => {
        const element = spark([1, 2, null, null]);
        expect(element.querySelector('.marker')?.getAttribute('d')).toMatch(/^M33\.3+\d*,0h0$/);
    });

    it('the_line_and_marker_take_the_first_series_colour', () => {
        const element = spark([1, 2]);
        expect(element.querySelector('path.line')).not.toBeNull();
        const css = document.querySelector('style[data-r-styles="r-sparkline"]')?.textContent ?? '';
        expect(css).toMatch(/\.line[^}]*var\(--series-1\)/);
        expect(css).toMatch(/\.marker[^}]*var\(--series-1\)/);
    });

    it('the_sparkline_is_a_figure_named_by_its_summary_with_a_hidden_table', () => {
        const element = spark([1, 2]);
        expect(element.querySelector('[role="figure"]')?.getAttribute('aria-label')).toBe('Summary');
        expect(element.querySelector('table.visually-hidden')).not.toBeNull();
        expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    });

    it('data_with_no_labels_or_no_series_shows_the_empty_state', () => {
        const element = spark([], []);
        expect(element.querySelector('.empty')?.textContent).toBe(text('noData'));
        expect(element.querySelector('svg')).toBeNull();
        element.data = { labels: ['A'], series: [], summary: 'S' };
        expect(element.querySelector('.empty')).not.toBeNull();
    });

    it('pointing_at_the_line_reads_out_the_nearest_value_in_the_value_format_or_the_locale', () => {
        configureFormatting({ locale: 'sv-SE' });
        const element = spark([1000.5, 2, 3]);
        hover(element, 4);
        expect(element.querySelector('.readout')?.textContent).toContain('1 000,5');
        element.valueFormat = (value) => `${String(value)} kr`;
        hover(element, 96);
        expect(element.querySelector('.readout')?.textContent).toContain('3 kr');
    });
});
