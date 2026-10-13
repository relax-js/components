import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/heatmap/Heatmap';
import { formatValue } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';
import type { Heatmap, HeatmapValue } from '../../../src/dashboard/heatmap/Heatmap';

function heatmap(values: unknown, attributes: Record<string, string> = {}, columns = ['a', 'b']): Heatmap {
    const element = document.createElement('r-heatmap');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    element.rows = ['r1', 'r2'];
    element.columns = columns;
    element.summary = 'Visits by weekday and hour';
    element.values = values as HeatmapValue[][];
    return element;
}

function cells(element: Element): HTMLElement[] {
    return [...element.querySelectorAll<HTMLElement>('.cell')];
}

function positions(element: Element): string[] {
    return cells(element).map((cell) => cell.style.getPropertyValue('--position'));
}

describe('r-heatmap', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('draws_one_cell_per_row_and_column_in_the_given_order', () => {
        const { element } = mount(heatmap([[1, 2], [3, 4]]));

        expect(cells(element)).toHaveLength(4);
        expect(cells(element).map((cell) => `${cell.dataset.row}, ${cell.dataset.column}`)).toEqual(['r1, a', 'r1, b', 'r2, a', 'r2, b']);
    });

    it('a_row_with_the_wrong_number_of_values_logs_an_error_naming_the_tag_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { element } = mount(heatmap([[1, 2], [3]]));

        expect(error).toHaveBeenCalledWith(expect.stringContaining('r-heatmap'));
        expect(element.children).toHaveLength(0);
    });

    it('a_value_that_is_not_a_number_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { element } = mount(heatmap([[1, 'x'], [3, 4]]));

        expect(error).toHaveBeenCalled();
        expect(element.children).toHaveLength(0);
    });

    it('sequential_scale_puts_lowest_at_low_end_highest_at_high_end_and_between_in_proportion', () => {
        const { element } = mount(heatmap([[0, 5], [10, 5]]));

        expect(positions(element)).toEqual(['0', '0.5', '1', '0.5']);
    });

    it('when_every_value_is_equal_every_cell_takes_one_colour_and_nothing_logs', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { element } = mount(heatmap([[3, 3], [3, 3]]));

        expect(new Set(positions(element)).size).toBe(1);
        expect(error).not.toHaveBeenCalled();
    });

    it('diverging_scale_gives_two_sides_stronger_with_distance_and_the_midpoint_the_middle', () => {
        const { element } = mount(heatmap([[-10, -5], [0, 10]], { scale: 'diverging' }));
        const all = cells(element);

        expect(all.map((cell) => cell.dataset.side)).toEqual(['below', 'below', 'above', 'above']);
        expect(positions(element)).toEqual(['1', '0.5', '0', '1']);
    });

    it('diverging_scale_reaches_as_far_below_the_midpoint_as_above_it', () => {
        const { element } = mount(heatmap([[-2, 2], [-8, 0]], { scale: 'diverging' }));

        expect(positions(element)).toEqual(['0.25', '0.25', '1', '0']);
    });

    it('diverging_scale_uses_the_midpoint_the_page_gives', () => {
        const { element } = mount(heatmap([[5, 10], [0, 5]], { scale: 'diverging', midpoint: '5' }));

        expect(positions(element)).toEqual(['0', '1', '1', '0']);
    });

    it('an_unknown_scale_or_a_midpoint_that_is_not_a_number_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const unknown = mount(heatmap([[1, 2], [3, 4]], { scale: 'rainbow' })).element;
        const midpoint = mount(heatmap([[1, 2], [3, 4]], { scale: 'diverging', midpoint: 'abc' })).element;

        expect(error).toHaveBeenCalledTimes(2);
        expect(unknown.children).toHaveLength(0);
        expect(midpoint.children).toHaveLength(0);
    });

    it('a_fixed_minimum_and_maximum_replace_the_range_of_the_data', () => {
        const { element } = mount(heatmap([[0, 5], [10, 5]], { min: '0', max: '20' }));

        expect(positions(element)).toEqual(['0', '0.25', '0.5', '0.25']);
    });

    it('a_value_beyond_the_fixed_range_takes_the_end_colour_while_showing_its_own_value', () => {
        const { element } = mount(heatmap([[-5, 50], [10, 5]], { min: '0', max: '20', 'show-values': '' }));

        expect(positions(element)[0]).toBe('0');
        expect(positions(element)[1]).toBe('1');
        expect(cells(element)[1].textContent).toBe('50');
    });

    it('a_minimum_not_below_the_maximum_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { element } = mount(heatmap([[1, 2], [3, 4]], { min: '5', max: '5' }));

        expect(error).toHaveBeenCalled();
        expect(element.children).toHaveLength(0);
    });

    it('both_scales_take_colours_from_their_own_theme_variables', async () => {
        const { readFileSync } = await import('node:fs');
        const { element } = mount(heatmap([[1, 2], [3, 4]]));
        const css = document.head.querySelector('style[data-r-styles="r-heatmap"]')!.textContent!;
        const theme = readFileSync('src/theme.css', 'utf8');

        expect(element.isConnected).toBe(true);
        expect(css).not.toMatch(/--(series|status|accent)-/);
        for (const name of ['--scale-low', '--scale-high', '--scale-diverging-low', '--scale-diverging-mid', '--scale-diverging-high']) {
            expect(css).toContain(`var(${name})`);
            expect(theme).toContain(`${name}:`);
        }
    });

    it('a_missing_cell_is_marked_missing_and_gets_no_scale_position', () => {
        const { element } = mount(heatmap([[0, null], [10, undefined]]));
        const all = cells(element);

        expect(all[1].hasAttribute('data-missing')).toBe(true);
        expect(all[3].hasAttribute('data-missing')).toBe(true);
        expect(all[1].style.getPropertyValue('--position')).toBe('');
        expect(all[0].hasAttribute('data-missing')).toBe(false);
    });

    it('cells_write_their_formatted_value_only_when_the_page_turns_them_on', () => {
        const off = mount(heatmap([[1, 2], [3, 4]])).element;
        const on = mount(heatmap([[1, 2], [3, 4]], { 'show-values': '' })).element;

        expect(cells(off).map((cell) => cell.textContent)).toEqual(['', '', '', '']);
        expect(cells(on).map((cell) => cell.textContent)).toEqual(['1', '2', '3', '4']);
    });

    it('a_value_that_does_not_fit_inside_its_cell_is_left_out', () => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(10);
        vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(30);
        const { element } = mount(heatmap([[1, 2], [3, 4]], { 'show-values': '' }));

        for (const value of element.querySelectorAll<HTMLElement>('.value')) {
            expect(value.hidden).toBe(true);
        }
    });

    function legendLabels(element: Element): string[] {
        return [...element.querySelectorAll('.scale-legend .ramp-labels span')].map((label) => label.textContent!);
    }

    it('the_scale_legend_shows_the_formatted_lowest_and_highest_value_of_the_range', () => {
        const { element } = mount(heatmap([[1, 2], [3, 1500]]));

        expect(legendLabels(element)).toEqual([formatValue(1), formatValue(1500)]);
    });

    it('the_scale_legend_shows_the_midpoint_as_well_in_diverging_mode', () => {
        const { element } = mount(heatmap([[-4, 2], [3, 8]], { scale: 'diverging', midpoint: '1' }));

        expect(legendLabels(element)).toEqual([formatValue(-4), formatValue(1), formatValue(8)]);
    });

    it('the_legend_shows_the_missing_look_with_the_no_data_word_only_when_a_cell_is_missing', async () => {
        await rewordEnglish({ noData: 'Nothing here' });
        try {
            const { element } = mount(heatmap([[1, null], [3, 4]]));
            expect(element.querySelector('.scale-legend .missing-key')?.textContent).toBe('Nothing here');
            expect(element.querySelector('.scale-legend .swatch')).not.toBeNull();

            const { element: full } = mount(heatmap([[1, 2], [3, 4]]));
            expect(full.querySelector('.scale-legend .missing-key')).toBeNull();
        } finally {
            await restoreWords();
        }
    });

    it('the_heatmap_shows_its_scale_legend_in_place_of_a_series_legend', () => {
        const { element } = mount(heatmap([[1, 2], [3, 4]]));

        expect(element.querySelectorAll('.scale-legend')).toHaveLength(1);
        expect(element.querySelector('ul.legend')).toBeNull();
    });

    function point(element: Element, target: Element): void {
        target.dispatchEvent(new Event('pointermove', { bubbles: true }));
        void element;
    }

    function readout(element: Element): HTMLElement {
        return element.querySelector<HTMLElement>('.readout')!;
    }

    it('pointing_at_a_cell_shows_the_read_out_with_row_column_and_value_and_leaving_the_grid_hides_it', () => {
        const { element } = mount(heatmap([[1, 2], [3, 1500]]));
        expect(readout(element).hidden).toBe(true);

        point(element, cells(element)[3]);

        expect(readout(element).hidden).toBe(false);
        expect(readout(element).textContent).toBe(`r2, b${formatValue(1500)}`);

        element.querySelector('.grid')!.dispatchEvent(new Event('pointerleave'));
        expect(readout(element).hidden).toBe(true);
    });

    it('pointing_at_a_missing_cell_shows_the_no_data_word_in_place_of_the_value', async () => {
        await rewordEnglish({ noData: 'Nothing here' });
        try {
            const { element } = mount(heatmap([[1, null], [3, 4]]));
            point(element, cells(element)[1]);
            expect(readout(element).textContent).toBe('r1, bNothing here');
        } finally {
            await restoreWords();
        }
    });

    it('values_are_plain_numbers_in_the_configured_locale_by_default_and_the_page_can_give_its_own_format', () => {
        const { element } = mount(heatmap([[1, 2], [3, 1500]], { 'show-values': '' }));
        expect(cells(element)[3].textContent).toBe(formatValue(1500));
        expect(tableCells(element)[3]).toBe(formatValue(1500));

        element.valueFormat = (value) => `${String(value)} pts`;
        point(element, cells(element)[3]);

        expect(cells(element)[3].textContent).toBe('1500 pts');
        expect(readout(element).textContent).toBe('r2, b1500 pts');
        expect(legendLabels(element)).toEqual(['1 pts', '1500 pts']);
        expect(tableCells(element)[3]).toBe('1500 pts');
    });

    function tableCells(element: Element): string[] {
        return [...element.querySelectorAll('tbody td')].map((cell) => cell.textContent!);
    }

    it('the_heatmap_is_a_figure_named_by_the_summary_with_the_drawing_hidden_from_screen_readers', () => {
        const { element } = mount(heatmap([[1, 2], [3, 4]]));

        const figure = element.querySelector('[role="figure"]')!;
        expect(figure.getAttribute('aria-label')).toBe('Visits by weekday and hour');
        expect(element.querySelector('.plot')!.getAttribute('aria-hidden')).toBe('true');
        expect(element.querySelector('table')!.closest('[aria-hidden]')).toBeNull();
    });

    it('data_without_a_summary_logs_an_error_and_draws_nothing', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const element = heatmap([[1, 2], [3, 4]]);
        element.summary = '';
        mount(element);

        expect(error).toHaveBeenCalledWith(expect.stringContaining('r-heatmap'));
        expect(element.children).toHaveLength(0);
    });

    it('a_hidden_table_holds_a_row_per_row_label_and_a_column_per_column_label_with_missing_cells_empty', () => {
        const { element } = mount(heatmap([[1, null], [3, 4]]));

        const table = element.querySelector('table')!;
        expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual(['a', 'b']);
        expect([...table.querySelectorAll('tbody th')].map((cell) => cell.textContent)).toEqual(['r1', 'r2']);
        expect(tableCells(element)).toEqual(['1', '', '3', '4']);
    });

    it('no_rows_or_no_columns_shows_the_empty_state_in_place_of_the_grid_the_legend_and_the_table', async () => {
        await rewordEnglish({ noData: 'Nothing here' });
        try {
            const noRows = heatmap([]);
            noRows.rows = [];
            const { element } = mount(noRows);
            expect(element.querySelector('.empty')?.textContent).toBe('Nothing here');
            expect(element.querySelector('[role="figure"]')!.getAttribute('aria-label')).toBe('Visits by weekday and hour');

            const { element: noColumns } = mount(heatmap([[], []], {}, []));
            expect(noColumns.querySelector('.empty')?.textContent).toBe('Nothing here');
            for (const drawn of [element, noColumns]) {
                expect(drawn.querySelector('.grid, .scale-legend, table')).toBeNull();
            }
        } finally {
            await restoreWords();
        }
    });
});
