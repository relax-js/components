import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/days-left/DaysLeft';
import { layoutProblems, mount } from '../../layout';

describe('r-days-left layout', () => {
    it.each(['3', '160', '-12'])('%s_days_fit_a_narrow_table_cell', async (days) => {
        const element = document.createElement('r-days-left');
        element.setAttribute('days', days);
        const cell = document.createElement('div');
        cell.append(element);
        await mount(cell, 80);

        expect(layoutProblems(cell)).toEqual([]);
    });
});
