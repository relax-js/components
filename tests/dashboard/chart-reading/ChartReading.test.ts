import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/bar-chart/BarChart';
import '../../../src/dashboard/line-chart/LineChart';
import '../../../src/dashboard/area-chart/AreaChart';
import '../../../src/dashboard/heatmap/Heatmap';
import { niceScale } from '../../../src/dashboard/bar-chart/BarChart';
import { configureFormatting, resetFormatting } from '../../../src/foundations/formatting/formatting';
import barSource from '../../../src/dashboard/bar-chart/BarChart.ts?raw';
import lineSource from '../../../src/dashboard/line-chart/LineChart.ts?raw';
import areaSource from '../../../src/dashboard/area-chart/AreaChart.ts?raw';

interface AnyChart extends HTMLElement {
    data: unknown;
    axisFormat: (value: number) => string;
    valueFormat: (value: number) => string;
}

interface Subject {
    tag: string;
    source: string;
    /** Points at the given x (in a 640 wide chart) inside the plot. */
    point: (chart: HTMLElement, x: number) => void;
    leave: (chart: HTMLElement) => void;
    /** What the read-out ends with after the series rows: stacked charts add the label's total. */
    readoutEnd: string;
}

function box(element: Element): void {
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 230 }) as DOMRect;
}

const subjects: Subject[] = [
    {
        tag: 'r-bar-chart',
        source: barSource,
        point: (chart, x) => {
            box(chart);
            chart.querySelector('rect.band')!.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: 100 }));
        },
        leave: (chart) => chart.querySelector('svg')!.dispatchEvent(new Event('pointerleave')),
        readoutEnd: '',
    },
    {
        tag: 'r-line-chart',
        source: lineSource,
        point: (chart, x) => {
            const svg = chart.querySelector('svg')!;
            box(svg);
            box(chart);
            svg.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: 100 }));
        },
        leave: (chart) => chart.querySelector('svg')!.dispatchEvent(new Event('pointerleave')),
        readoutEnd: '',
    },
    {
        tag: 'r-area-chart',
        source: areaSource,
        point: (chart, x) => {
            const svg = chart.querySelector('svg')!;
            box(svg);
            box(chart);
            svg.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: 100 }));
        },
        leave: (chart) => chart.querySelector('svg')!.dispatchEvent(new Event('pointerleave')),
        // Areas always stack, so the read-out ends with the label's total.
        readoutEnd: 'Total: <1004>',
    },
];

function series(...values: number[][]): { name: string; values: number[] }[] {
    return values.map((v, i) => ({ name: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'][i], values: v }));
}

function chart(tag: string, data: { name: string; values: number[] }[], configure?: (c: AnyChart) => void): AnyChart {
    const element = document.createElement(tag) as AnyChart;
    configure?.(element);
    document.body.append(element);
    element.data = { labels: ['A', 'B', 'C'], series: data, summary: 'Summary' };
    return element;
}

const sample = series([1000, 2000, 3000], [4, 5, 6]);

describe('chart reading', () => {
    afterEach(() => {
        document.body.replaceChildren();
        resetFormatting();
        vi.restoreAllMocks();
    });

    describe.each(subjects)('$tag', (subject) => {
        it('a_chart_with_series_shows_a_legend_naming_each_series_in_the_order_given_beside_its_colour', () => {
            const element = chart(subject.tag, sample);

            const items = [...element.querySelectorAll('ul.legend li')];
            expect(items.map((item) => item.textContent)).toEqual(['One', 'Two']);
            expect(items.map((item) => item.className)).toEqual(['series-1', 'series-2']);
        });

        it('series_n_is_coloured_with_series_n_in_the_order_given_and_never_with_a_status_colour', () => {
            const element = chart(subject.tag, sample);

            expect([...element.querySelectorAll('g.series')].map((group) => group.getAttribute('class'))).toEqual([
                expect.stringContaining('series-1'),
                expect.stringContaining('series-2'),
            ]);
            for (let n = 1; n <= 5; n++) {
                expect(subject.source).toContain(`--series-color: var(--series-${String(n)})`);
            }
            expect(subject.source).not.toMatch(/var\(--(danger|warn|success|ok|error|status)/);
        });

        it('more_series_than_the_five_theme_colours_reports_an_error_naming_the_tag_and_draws_nothing', () => {
            const reported = captureProblems();
            const six = series([1, 2, 3], [1, 2, 3], [1, 2, 3], [1, 2, 3], [1, 2, 3], [1, 2, 3]);

            const element = chart(subject.tag, six);

            expect(reported.messages()).toContainEqual(expect.stringContaining(subject.tag));
            expect(element.querySelector('svg')).toBeNull();
        });

        it('the_chart_is_a_figure_named_by_the_summary_with_the_drawing_hidden_from_screen_readers', () => {
            const element = chart(subject.tag, sample);

            const figure = element.matches('[role=figure]') ? element : element.querySelector('[role=figure]')!;
            expect(figure.getAttribute('aria-label')).toBe('Summary');
            expect(element.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
        });

        it('a_visually_hidden_table_holds_the_figures_in_the_value_format_with_series_names_and_labels_as_headers', () => {
            const element = chart(subject.tag, sample, (c) => {
                c.valueFormat = (value) => `<${String(value)}>`;
            });

            const table = element.querySelector('table.visually-hidden')!;
            const columns = [...table.querySelectorAll('thead th[scope=col]')].map((cell) => cell.textContent);
            expect(columns.slice(0, 2)).toEqual(['One', 'Two']);
            const rows = [...table.querySelectorAll('tbody tr')];
            expect(rows.map((row) => row.querySelector('th[scope=row]')!.textContent)).toEqual(['A', 'B', 'C']);
            expect([...rows[0].querySelectorAll('td')].slice(0, 2).map((cell) => cell.textContent)).toEqual(['<1000>', '<4>']);
            expect([...rows[2].querySelectorAll('td')].slice(0, 2).map((cell) => cell.textContent)).toEqual(['<3000>', '<6>']);
            expect(subject.source).toMatch(/\.visually-hidden\s*\{[^}]*clip-path: inset\(50%\)/);
        });

        it.each([
            ['no_labels', { labels: [], series: [{ name: 'One', values: [] }], summary: 'Summary' }],
            ['no_series', { labels: ['A'], series: [], summary: 'Summary' }],
        ])('data_with_%s_shows_the_noData_text_in_place_of_the_plot_the_legend_and_the_table', (_, data) => {
            const element = document.createElement(subject.tag) as AnyChart;
            document.body.append(element);

            element.data = data;

            expect(element.textContent).toBe('No data');
            expect(element.querySelector('svg, ul.legend, table')).toBeNull();
        });

        it('setting_empty_data_on_a_drawn_chart_replaces_the_drawing_with_the_empty_state', () => {
            const element = chart(subject.tag, sample);
            expect(element.querySelector('svg')).not.toBeNull();

            element.data = { labels: [], series: [], summary: 'Summary' };

            expect(element.textContent).toBe('No data');
            expect(element.querySelector('svg, ul.legend, table')).toBeNull();
        });

        it('the_empty_chart_is_still_named_by_the_summary', () => {
            const element = document.createElement(subject.tag) as AnyChart;
            document.body.append(element);

            element.data = { labels: [], series: [], summary: 'Nothing yet' };

            const figure = element.matches('[role=figure]') ? element : element.querySelector('[role=figure]')!;
            expect(figure.getAttribute('aria-label')).toBe('Nothing yet');
        });

        it('data_without_a_summary_reports_an_error_naming_the_tag_and_draws_nothing', () => {
            const reported = captureProblems();
            const element = document.createElement(subject.tag) as AnyChart;
            document.body.append(element);

            element.data = { labels: ['A', 'B', 'C'], series: sample, summary: '' };

            expect(reported.messages()).toContainEqual(expect.stringContaining(subject.tag));
            expect(element.querySelector('svg')).toBeNull();
            expect(element.querySelector('table')).toBeNull();
        });

        it('pointing_at_the_data_shows_a_readout_naming_the_selection_and_its_values_in_legend_order_and_value_format_and_leaving_hides_it', () => {
            const element = chart(subject.tag, sample, (c) => {
                c.valueFormat = (value) => `<${String(value)}>`;
            });

            subject.point(element, 100);

            const readout = element.querySelector<HTMLElement>('.readout')!;
            expect(readout.hidden).toBe(false);
            expect(readout.textContent).toMatch(/^A.*One: <1000>.*Two: <4>/);
            expect(readout.textContent!.split('Two: <4>')[1]).toBe(subject.readoutEnd);
            subject.leave(element);
            expect(readout.hidden).toBe(true);
        });

        it('past_sixty_percent_of_the_chart_width_the_readout_sits_to_the_left_of_the_pointer', () => {
            const element = chart(subject.tag, sample);

            subject.point(element, 300);
            const readout = element.querySelector<HTMLElement>('.readout')!;
            expect(readout.classList.contains('left')).toBe(false);

            subject.point(element, 400);
            expect(readout.classList.contains('left')).toBe(true);
        });

        it('the_readout_is_a_floating_surface_with_the_floating_tiers_radius_padding_and_shadow', () => {
            expect(subject.source).toContain('border-radius: var(--floating-radius)');
            expect(subject.source).toContain('padding: var(--floating-padding)');
            expect(subject.source).toContain('box-shadow: var(--floating-shadow)');
        });

        it('valueFormat_formats_the_readout_and_axisFormat_the_axis_labels', () => {
            const element = chart(subject.tag, sample, (c) => {
                c.valueFormat = (value) => `v${String(value)}`;
                c.axisFormat = (value) => `a${String(value)}`;
            });

            subject.point(element, 100);

            expect(element.querySelector('.readout')!.textContent).toContain('One: v1000');
            const axis = [...element.querySelectorAll('text.axis-label:not(.label)')].map((label) => label.textContent);
            expect(axis.length).toBeGreaterThan(0);
            expect(axis.every((label) => label?.startsWith('a'))).toBe(true);
        });

        it('by_default_amounts_are_written_as_whole_amounts_in_the_configured_currency_and_the_axis_leaves_the_currency_off', () => {
            configureFormatting({ locale: 'en-US', currency: 'USD' });
            const element = chart(subject.tag, series([1234, 2000, 3000]));

            subject.point(element, 100);

            expect(element.querySelector('.readout')!.textContent).toContain('$1,234');
            const axis = [...element.querySelectorAll('text.axis-label:not(.label)')].map((label) => label.textContent);
            expect(axis.join(' ')).not.toContain('$');
            expect(axis).toContain('3,000');
        });

        it('a_negative_value_is_written_with_the_real_minus_sign_never_a_hyphen', () => {
            configureFormatting({ locale: 'en-US', currency: 'USD' });
            const element = chart(subject.tag, series([-1234, 2000, 3000]));

            subject.point(element, 100);

            const readout = element.querySelector('.readout')!.textContent!;
            expect(readout).toContain('−');
            expect(readout).not.toContain('-');
        });
    });

    it('by_default_a_chart_of_numbers_writes_plain_numbers_grouped_as_the_configured_locale_groups_them', () => {
        configureFormatting({ locale: 'de-DE', currency: 'EUR' });
        const map = document.createElement('r-heatmap');
        map.rows = ['R'];
        map.columns = ['C'];
        map.values = [[1234567]];
        map.summary = 'Summary';
        document.body.append(map);

        expect(map.querySelector('tbody td')?.textContent).toBe('1.234.567');
    });

    it('a_value_axis_starts_at_zero_and_ends_on_a_round_figure_above_the_highest_value_in_four_steps', () => {
        expect(niceScale(0, 93)).toEqual({ bottom: 0, top: 100, step: 25 });
        expect(niceScale(0, 21)).toEqual({ bottom: 0, top: 30, step: 10 });
        expect(niceScale(0, 8)).toEqual({ bottom: 0, top: 8, step: 2 });
        expect(niceScale(0, 4000)).toEqual({ bottom: 0, top: 4000, step: 1000 });
    });

    it('every_axis_step_is_one_two_two_and_a_half_five_or_ten_times_a_power_of_ten_and_the_top_is_ceil_max_over_step_times_step', () => {
        for (const max of [3, 7, 13, 26, 41, 77, 130, 910, 12345]) {
            const { top, step } = niceScale(0, max);
            const mantissa = step / Math.pow(10, Math.floor(Math.log10(step)));
            expect([1, 2, 2.5, 5]).toContain(Math.round(mantissa * 1000) / 1000);
            expect(top).toBeCloseTo(Math.ceil(max / step) * step, 9);
        }
    });

    it('the_axis_extends_below_the_lowest_value_to_a_round_figure_in_the_same_steps', () => {
        expect(niceScale(-30, 10)).toEqual({ bottom: -30, top: 10, step: 10 });
        const { bottom, step } = niceScale(-33, 0);
        expect(bottom).toBe(Math.floor(-33 / step) * step);
        expect(bottom).toBeLessThanOrEqual(-33);
    });

    it('when_every_value_is_zero_the_axis_has_top_one_and_step_one', () => {
        expect(niceScale(0, 0)).toEqual({ bottom: 0, top: 1, step: 1 });
        const element = chart('r-area-chart', series([0, 0, 0]));
        const axis = [...element.querySelectorAll('text.axis-label:not(.label)')].map((label) => label.textContent);
        expect(axis).toEqual(['0', '1']);
    });
});
