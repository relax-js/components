import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/dashboard/status-grid/StatusGrid';
import type { StatusGrid, StatusGridItem, StatusGridState } from '../../../src/dashboard/status-grid/StatusGrid';

function gridWith(states: StatusGridState[], items: StatusGridItem[]): StatusGrid {
    const grid = document.createElement('r-status-grid');
    mount(grid);
    grid.states = states;
    grid.items = items;
    return grid;
}

const paid: StatusGridState = { id: 'paid', label: 'Paid', tone: 'ok', icon: 'check' };
const open: StatusGridState = { id: 'open', label: 'Open' };

function tiles(grid: StatusGrid): HTMLElement[] {
    return Array.from(grid.querySelectorAll<HTMLElement>('.tile'));
}

describe('r-status-grid', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('the_page_sets_states_and_items_as_properties_and_gets_them_back', () => {
        const grid = gridWith([paid], [{ label: 'Jan', state: 'paid' }]);

        expect(grid.states).toEqual([paid]);
        expect(grid.items).toEqual([{ label: 'Jan', state: 'paid' }]);
    });

    it('a_state_without_a_tone_is_muted', () => {
        const grid = gridWith([open], [{ label: 'Jan', state: 'open' }]);

        expect(tiles(grid)[0].dataset.tone).toBe('muted');
    });

    it('an_unknown_tone_logs_an_error_and_is_shown_as_muted', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const grid = gridWith(
            [{ id: 'x', label: 'X', tone: 'purple' as never }],
            [{ label: 'Jan', state: 'x' }]
        );

        expect(error).toHaveBeenCalled();
        expect(tiles(grid)[0].dataset.tone).toBe('muted');
    });

    it('two_states_with_the_same_id_log_an_error_and_the_grid_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const grid = gridWith([paid, { ...open, id: 'paid' }], [{ label: 'Jan', state: 'paid' }]);

        expect(error).toHaveBeenCalled();
        expect(grid.childElementCount).toBe(0);
    });

    it('shows_one_tile_per_item_in_the_given_order_with_the_label_beside_it', () => {
        const grid = gridWith(
            [paid, open],
            [
                { label: 'Feb', state: 'open' },
                { label: 'Jan', state: 'paid' },
            ]
        );

        const items = Array.from(grid.querySelectorAll('.items > li'));
        expect(items.map((item) => item.querySelector('.label')!.textContent)).toEqual(['Feb', 'Jan']);
        expect(items.every((item) => item.querySelector('.tile') !== null)).toBe(true);
    });

    it('an_item_whose_state_is_not_defined_logs_an_error_and_the_grid_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const grid = gridWith([paid], [{ label: 'Jan', state: 'gone' }]);

        expect(error).toHaveBeenCalled();
        expect(grid.childElementCount).toBe(0);
    });

    it('an_empty_item_list_shows_no_tiles_and_logs_no_error', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const grid = gridWith([paid], []);

        expect(tiles(grid)).toHaveLength(0);
        expect(error).not.toHaveBeenCalled();
    });

    it('each_tile_shows_its_states_icon', () => {
        const grid = gridWith([paid], [{ label: 'Jan', state: 'paid' }]);

        expect(tiles(grid)[0].querySelector('r-icon')!.getAttribute('name')).toBe('check');
    });

    it('a_state_without_an_icon_shows_its_tones_default_icon', () => {
        const grid = gridWith(
            [{ id: 'bad', label: 'Bad', tone: 'danger' }],
            [{ label: 'Jan', state: 'bad' }]
        );

        expect(tiles(grid)[0].querySelector('r-icon')!.getAttribute('name')).toBe('x-circle');
    });

    it('each_tile_carries_its_tone_and_its_state_id', () => {
        const grid = gridWith([paid], [{ label: 'Jan', state: 'paid' }]);

        expect(tiles(grid)[0].dataset.tone).toBe('ok');
        expect(tiles(grid)[0].dataset.state).toBe('paid');
    });

    it('each_tiles_title_is_the_item_label_and_the_state_label', () => {
        const grid = gridWith([paid], [{ label: 'Jan', state: 'paid' }]);

        expect(tiles(grid)[0].title).toBe('Jan: Paid');
    });

    it('each_tiles_accessible_name_gives_the_item_label_and_the_state_label', () => {
        const grid = gridWith([paid], [{ label: 'Jan', state: 'paid' }]);

        expect(tiles(grid)[0].getAttribute('role')).toBe('img');
        expect(tiles(grid)[0].getAttribute('aria-label')).toBe('Jan: Paid');
    });

    it('the_legend_lists_every_state_in_order_including_states_no_item_is_in', () => {
        const grid = gridWith([open, paid], [{ label: 'Jan', state: 'paid' }]);

        const entries = Array.from(grid.querySelectorAll('.legend > li'));
        expect(entries.map((entry) => entry.textContent)).toEqual(['Open', 'Paid']);
        expect(entries[1].querySelector('r-icon')!.getAttribute('name')).toBe('check');
        expect(entries[0].querySelector('r-icon')!.getAttribute('name')).toBe('info');
    });

    it('tiles_are_not_focusable_and_have_no_controls', () => {
        const grid = gridWith([paid], [{ label: 'Jan', state: 'paid' }]);

        expect(tiles(grid)[0].hasAttribute('tabindex')).toBe(false);
        expect(grid.querySelector('button, a, input, [tabindex]')).toBeNull();
    });
});
