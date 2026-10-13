import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/badge/Badge';
import { layoutProblems, mount, widths } from '../../layout';

describe('r-badge layout', () => {
    it.each(widths)('at_%ipx_badges_in_a_line_of_text_fit_and_do_not_overlap', async (width) => {
        const line = document.createElement('p');
        line.innerHTML = `Order ORD-2026-1042 <r-badge tone="warn">Awaiting payment confirmation</r-badge>
            <r-badge tone="info" count="1250" max="99"></r-badge> <r-badge tone="ok">Shipped</r-badge>`;
        await mount(line, width);

        expect(layoutProblems(line)).toEqual([]);
    });
});
