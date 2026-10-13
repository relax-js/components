import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/amount/Amount';
import { layoutProblems, mount } from '../../layout';

describe('r-amount layout', () => {
    it('a_large_signed_amount_stays_on_one_line_inside_a_narrow_cell', async () => {
        const element = document.createElement('r-amount');
        element.setAttribute('value', '-1284567890.5');
        element.setAttribute('decimals', '2');
        element.setAttribute('signed', '');
        await mount(element, 280);

        expect(layoutProblems(element.parentElement!)).toEqual([]);
        const range = document.createRange();
        range.selectNodeContents(element);
        expect(range.getClientRects()).toHaveLength(1);
    });
});
