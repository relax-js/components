import { Inject } from '@relax.js/core/di';
import { FormValidator, readData, setFormData } from '@relax.js/core/forms';
import { navigate, type Routable } from '@relax.js/core/routing';
import type { Dialog } from '@relax.js/components';
import { OrderService, type OrderChange } from './OrderService';

/**
 * Edits an order inside the order editor dialog. The route sends it there, so the order page
 * stays visible underneath; whichever way the dialog closes, the order page is shown again with
 * what the server now holds.
 */
class OrderEditPage extends HTMLElement implements Routable<{ orderId: number }> {
    @Inject(OrderService)
    private orders!: OrderService;

    // A dialog sets the route's parameters but does not call loadRoute, so the order loads on connect.
    routeData?: { orderId: number };

    private form!: HTMLFormElement;
    private validator!: FormValidator;

    connectedCallback(): void {
        this.innerHTML = /* html */ `
            <form class="form">
                <label for="reference">Customer reference</label>
                <input id="reference" name="reference" maxlength="40">

                <label for="deliveryDate">Delivery date</label>
                <input id="deliveryDate" name="deliveryDate" type="date" required>

                <label for="status">Status</label>
                <select id="status" name="status">
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <label for="notes">Notes</label>
                <textarea id="notes" name="notes" rows="3"></textarea>

                <div class="form-actions">
                    <button type="submit" class="primary">Save</button>
                </div>
            </form>
        `;
        this.form = FormValidator.FindForm(this);
        this.validator = new FormValidator(this.form, {
            useSummary: true,
            submitCallback: () => this.save(),
        });

        const orderId = this.orderId();
        this.dialog().addEventListener('r-dialog-close', () => navigate('order', { params: { orderId } }), { once: true });
        void this.load();
    }

    private orderId(): number {
        return Number(this.routeData!.orderId);
    }

    private dialog(): Dialog {
        return this.closest('r-dialog')!;
    }

    private async load(): Promise<void> {
        setFormData(this.form, await this.orders.get(this.orderId()));
    }

    private async save(): Promise<void> {
        const result = await this.orders.update(this.orderId(), readData<OrderChange>(this.form));
        if (result.saved) {
            this.dialog().close(result.value);
            return;
        }
        this.validator.clearErrorSummary();
        for (const [field, messages] of Object.entries(result.problem.errors)) {
            for (const message of messages) {
                this.validator.addErrorToSummary(field, message);
            }
        }
    }
}

customElements.define('order-edit-page', OrderEditPage);
