import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/heatmap/Heatmap';
import type { Heatmap } from '../../../src/dashboard/heatmap/Heatmap';
import { mount, overflowing, overlapping, resize, widths } from '../../layout';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

function heatmap(attributes: Record<string, string> = {}): Heatmap {
    const element = document.createElement('r-heatmap');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    element.summary = 'Requests per hour for each weekday';
    element.rows = weekdays;
    element.columns = hours;
    element.values = weekdays.map((_, day) => hours.map((_, hour) => 1300 + day * 100 + hour * 140));
    return element;
}

function columnLabels(element: Heatmap): HTMLElement[] {
    return [...element.querySelectorAll<HTMLElement>('.column-label')];
}

describe('r-heatmap layout', () => {
    it.each(widths)('at_%ipx_the_map_fits_and_its_column_labels_do_not_overlap', async (width) => {
        const element = await mount(heatmap(), width);

        expect(overflowing(element)).toEqual([]);
        expect(overlapping(columnLabels(element))).toEqual([]);
        expect(columnLabels(element)[0].checkVisibility({ visibilityProperty: true })).toBe(true);
    });

    it.each(widths)('at_%ipx_values_written_in_cells_fit_or_are_left_out', async (width) => {
        const element = await mount(heatmap({ 'show-values': '' }), width);

        expect(overflowing(element)).toEqual([]);
        expect(overlapping(element.querySelectorAll('.value'))).toEqual([]);
    });

    it('a_map_that_narrows_thins_its_column_labels_and_widening_brings_them_back', async () => {
        const element = await mount(heatmap(), 960);
        const shown = (): number => columnLabels(element).filter((label) => label.checkVisibility({ visibilityProperty: true })).length;
        expect(shown()).toBe(24);

        await resize(element, 280);
        expect(shown()).toBeLessThan(24);
        expect(overlapping(columnLabels(element))).toEqual([]);

        await resize(element, 960);
        expect(shown()).toBe(24);
    });
});
