import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/period-grid/PeriodGrid';
import type { PeriodGrid } from '../../../src/dashboard/period-grid/PeriodGrid';
import { layoutProblems, mount, widths } from '../../layout';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function grid(): PeriodGrid {
    const element = document.createElement('r-period-grid');
    element.setAttribute('year', '2026');
    element.periods = months.map((month, i) => ({ month, state: i < 8 ? 'closed' : i === 8 ? 'locked' : i === 9 ? 'open' : 'coming' }));
    return element;
}

describe('r-period-grid layout', () => {
    it.each(widths)('at_%ipx_the_periods_and_key_fit_without_text_overlapping', async (width) => {
        const element = await mount(grid(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
