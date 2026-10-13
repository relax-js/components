import { describe, expect, it } from 'vitest';
import { flush } from '@relax.js/core/testing';
import '../../../src/data-display/table/Table';
import type { Table, TableRow } from '../../../src/data-display/table/Table';
import { mount, overflowing, widths } from '../../layout';

const orders: TableRow[] = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    number: `ORD-2026-${String(1000 + i)}`,
    customer: ['Nordic Furniture Wholesale AB', 'Linnea Berg', 'Cafe Oslo'][i % 3],
    placed: '2026-10-13',
    status: i % 2 ? 'Shipped' : 'Awaiting payment',
    total: 12000 + i * 37,
}));

function table(): Table {
    const element = document.createElement('r-table');
    element.innerHTML = `
        <r-column field="number" sortable>Order</r-column>
        <r-column field="customer" sortable>Customer</r-column>
        <r-column field="placed">Placed</r-column>
        <r-column field="status">Status</r-column>
        <r-column field="total">Total</r-column>`;
    element.setAttribute('page-size', '10');
    return element;
}

describe('r-table layout', () => {
    it.each(widths)('at_%ipx_a_wide_table_scrolls_within_itself_and_its_pager_stays_in_view', async (width) => {
        const element = await mount(table(), width);
        element.rows = orders;
        await flush();

        expect(overflowing(element)).toEqual([]);
        const pager = element.querySelector('.pager')!;
        expect(pager.getBoundingClientRect().right).toBeLessThanOrEqual(element.getBoundingClientRect().right + 1);
    });
});
