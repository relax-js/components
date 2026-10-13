import { Inject } from '@relax.js/core/di';
import { compileTemplate } from '@relax.js/core/html';
import { navigate, type LoadRoute } from '@relax.js/core/routing';
import { Dialog, type DropdownMenu, type Table } from '@relax.js/components';
import { OrderService, statusTones, type Order } from './OrderService';

interface OrderView {
    order: Order;
    tone: string;
    editable: boolean;
}

/** One order: its lines, details and history, with the actions that apply to it. */
class OrderPage extends HTMLElement implements LoadRoute<{ orderId: number }> {
    @Inject(OrderService)
    private orders!: OrderService;

    private order!: Order;

    private readonly view = compileTemplate<OrderView>(`
        <div class="page-title">
            <h2 class="page-heading">{{order.number}}</h2>
            <r-status-mark tone="{{tone}}" note="{{order.orderDate}}">{{order.status}}</r-status-mark>
            <r-dropdown-menu label="Actions" class="actions"></r-dropdown-menu>
        </div>
        <r-banner tone="info" unless="editable">Shipped orders are read-only.</r-banner>
        <r-tabs>
            <r-tab label="Lines">
                <r-table class="lines">
                    <r-column field="product">Product</r-column>
                    <r-column field="quantity" width="7rem">Quantity</r-column>
                    <r-column field="unitPrice" width="9rem">Unit price</r-column>
                    <r-column field="lineTotal" width="9rem">Line total</r-column>
                </r-table>
                <p class="order-total">Total <r-amount value="{{order.total}}" decimals="2"></r-amount></p>
            </r-tab>
            <r-tab label="Details">
                <dl class="details">
                    <dt>Customer</dt><dd>{{order.customer}}</dd>
                    <dt>Order date</dt><dd>{{order.orderDate}}</dd>
                    <dt>Delivery date</dt><dd>{{order.deliveryDate}}</dd>
                    <dt>Reference</dt><dd>{{order.reference}}</dd>
                    <dt>Notes</dt><dd>{{order.notes}}</dd>
                </dl>
            </r-tab>
            <r-tab label="History">
                <ol class="history">
                    <li loop="entry in order.history"><time>{{entry.at}}</time> {{entry.text}}</li>
                </ol>
            </r-tab>
        </r-tabs>
    `);

    async loadRoute(data: { orderId: number }): Promise<void> {
        this.order = await this.orders.get(data.orderId);
    }

    connectedCallback(): void {
        const order = this.order;
        const editable = order.status !== 'shipped';
        this.view.render({ order, tone: statusTones[order.status], editable });
        this.replaceChildren(this.view.content);

        this.querySelector<Table>('r-table.lines')!.rows = order.lines.map((line) => ({ ...line }));

        const actions = this.querySelector<DropdownMenu>('r-dropdown-menu')!;
        actions.items = editable
            ? [
                  { name: 'edit', title: 'Edit order', href: `/orders/${order.id}/edit` },
                  { name: 'delete', title: 'Delete order' },
              ]
            : [{ name: 'delete', title: 'Delete order' }];
        actions.addEventListener('r-menu-selected', (event) => {
            if (event.item.name === 'delete') {
                void this.delete();
            }
        });
    }

    private async delete(): Promise<void> {
        const confirmed = await Dialog.confirm({
            heading: `Delete ${this.order.number}?`,
            message: `The order for ${this.order.customer} is removed for good.`,
            tone: 'danger',
            confirmText: 'Delete order',
        });
        if (confirmed) {
            await this.orders.remove(this.order.id);
            navigate('orders');
        }
    }
}

customElements.define('order-page', OrderPage);
