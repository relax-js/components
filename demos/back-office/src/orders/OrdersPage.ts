import { Inject } from '@relax.js/core/di';
import { readData } from '@relax.js/core/forms';
import { navigate } from '@relax.js/core/routing';
import type { Table, TableRow } from '@relax.js/components';
import { OrderService, type OrderFilter } from './OrderService';

/**
 * The order list: a filter bar and a table the server pages and sorts. Typing in the filter asks
 * the table for its first page again; the table cancels the request it no longer needs.
 */
class OrdersPage extends HTMLElement {
    @Inject(OrderService)
    private orders!: OrderService;

    private shownRows: TableRow[] = [];

    connectedCallback(): void {
        this.innerHTML = /* html */ `
            <div class="page-title">
                <h2 class="page-heading">Orders</h2>
                <a class="button primary" href="/orders/new">New order</a>
            </div>
            <form class="filters" role="search">
                <label>Search <input name="search" type="search" placeholder="Order number or customer"></label>
                <label>Status
                    <select name="status">
                        <option value="">All</option>
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </label>
            </form>
            <r-table page-size="15" class="orders">
                <r-column field="number" sortable width="9rem">Order</r-column>
                <r-column field="customer" sortable>Customer</r-column>
                <r-column field="orderDate" sortable sort="desc" width="9rem">Date</r-column>
                <r-column field="status" sortable width="8rem">Status</r-column>
                <r-column field="total" sortable width="8rem">Total</r-column>
            </r-table>
        `;
        const form = this.querySelector('form')!;
        const table = this.querySelector<Table>('r-table')!;
        table.provider = async (request) => {
            const page = await this.orders.page(request, readData<OrderFilter>(form));
            this.shownRows = page.rows;
            return page;
        };
        form.addEventListener('input', () => table.refresh());
        form.addEventListener('submit', (event) => event.preventDefault());
        table.addEventListener('click', this.openClickedOrder);
    }

    // The table draws plain rows, so the page maps a clicked row back to the record it shows.
    private readonly openClickedOrder = (event: MouseEvent): void => {
        const row = (event.target as Element).closest('tbody tr');
        if (!row || row.classList.contains('empty')) {
            return;
        }
        const index = Array.from(row.parentElement!.children).indexOf(row);
        const order = this.shownRows[index];
        if (order) {
            navigate('order', { params: { orderId: Number(order.id) } });
        }
    };
}

customElements.define('orders-page', OrdersPage);
