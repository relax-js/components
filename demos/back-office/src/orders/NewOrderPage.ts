import { Inject } from '@relax.js/core/di';
import { compileTemplate } from '@relax.js/core/html';
import { navigate } from '@relax.js/core/routing';
import type { Step, Table } from '@relax.js/components';
import { CatalogService, type Customer, type Product } from '../catalog/CatalogService';
import { OrderService } from './OrderService';

interface DraftLine {
    productId: number;
    sku: string;
    product: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

interface ReviewView {
    customer: string;
    reference: string;
    deliveryDate: string;
    total: number;
    problem: string;
}

const sampleLines = 'sku;quantity\nSKU-1001;4\nSKU-1005;1\nSKU-1012;2\n';

/**
 * Placing an order in three steps: who it is for, what is in it (read from a CSV file in the
 * browser, nothing uploaded), and a review before it is sent.
 */
class NewOrderPage extends HTMLElement {
    @Inject(OrderService)
    private orders!: OrderService;

    @Inject(CatalogService)
    private catalog!: CatalogService;

    private customers: Customer[] = [];
    private products: Product[] = [];
    private header: Record<string, string> = {};
    private lines: DraftLine[] = [];

    private readonly review = compileTemplate<ReviewView>(`
        <dl class="details">
            <dt>Customer</dt><dd>{{customer}}</dd>
            <dt>Reference</dt><dd>{{reference}}</dd>
            <dt>Delivery date</dt><dd>{{deliveryDate}}</dd>
            <dt>Total</dt><dd><r-amount value="{{total}}" decimals="2"></r-amount></dd>
        </dl>
        <r-banner tone="danger" if="problem">{{problem}}</r-banner>
    `);

    connectedCallback(): void {
        const today = new Date().toISOString().slice(0, 10);
        this.innerHTML = /* html */ `
            <h2 class="page-heading">New order</h2>
            <ol class="wizard-steps">
                <li>Customer</li>
                <li>Lines</li>
                <li>Review</li>
            </ol>
            <r-step class="customer-step">
                <form class="form">
                    <label for="customerId">Customer</label>
                    <select id="customerId" name="customerId" required><option value="">Choose a customer</option></select>
                    <label for="reference">Customer reference</label>
                    <input id="reference" name="reference" maxlength="40">
                    <label for="deliveryDate">Delivery date</label>
                    <input id="deliveryDate" name="deliveryDate" type="date" min="${today}" required>
                    <div class="form-actions"><button class="primary">Next</button></div>
                </form>
            </r-step>
            <r-step class="lines-step" hidden>
                <form class="form">
                    <p>Order lines come from a CSV file with the columns <code>sku;quantity</code>.
                       <a download="order-lines.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(sampleLines)}">Download a sample</a>.</p>
                    <r-file-input name="linesFile" accept=".csv,text/csv" max-size="100000" required></r-file-input>
                    <r-banner tone="warn" class="unknown-skus" hidden></r-banner>
                    <r-table class="draft-lines" page-size="10">
                        <r-column field="sku" width="8rem">SKU</r-column>
                        <r-column field="product">Product</r-column>
                        <r-column field="quantity" width="7rem">Quantity</r-column>
                        <r-column field="lineTotal" width="9rem">Line total</r-column>
                    </r-table>
                    <div class="form-actions">
                        <button type="button" class="back">Back</button>
                        <button class="primary">Next</button>
                    </div>
                </form>
            </r-step>
            <section class="review-step" hidden>
                <div class="review"></div>
                <div class="form-actions">
                    <button type="button" class="back">Back</button>
                    <button type="button" class="primary place">Place order</button>
                </div>
            </section>
        `;
        this.querySelector('.review')!.append(this.review.content);
        this.show(0);

        this.addEventListener('r-step-done', (event) => {
            if (event.target === this.querySelector('.customer-step')) {
                this.header = event.values;
                this.show(1);
            } else {
                this.showReview();
            }
        });
        this.addEventListener('r-file-read', (event) => this.readLines(String(event.content)));
        this.addEventListener('r-file-error', (event) => this.warn(`${event.name}: ${event.reason}`));
        this.addEventListener('click', (event) => {
            const button = (event.target as Element).closest('button');
            if (button?.classList.contains('back')) {
                this.show(this.current() - 1);
            } else if (button?.classList.contains('place')) {
                void this.place();
            }
        });
        void this.loadCatalog();
    }

    private async loadCatalog(): Promise<void> {
        [this.customers, this.products] = await Promise.all([this.catalog.customers(), this.catalog.products()]);
        const select = this.querySelector<HTMLSelectElement>('#customerId')!;
        select.append(...this.customers.map((customer) => new Option(`${customer.name}, ${customer.city}`, String(customer.id))));
    }

    private steps(): HTMLElement[] {
        return [...this.querySelectorAll<HTMLElement>('.customer-step, .lines-step, .review-step')];
    }

    private current(): number {
        return this.steps().findIndex((step) => !step.hidden);
    }

    private show(index: number): void {
        this.steps().forEach((step, i) => (step.hidden = i !== index));
        this.querySelectorAll('.wizard-steps li').forEach((item, i) =>
            i === index ? item.setAttribute('aria-current', 'step') : item.removeAttribute('aria-current')
        );
        // Going back to the first step shows what was entered there.
        if (index === 0) {
            this.querySelector<Step>('.customer-step')!.value = this.header;
        }
    }

    private readLines(csv: string): void {
        const unknown: string[] = [];
        this.lines = csv
            .split(/\r?\n/)
            .slice(1)
            .map((line) => line.split(/[;,]/).map((cell) => cell.trim()))
            .filter(([sku]) => sku)
            .flatMap(([sku, quantityText]) => {
                const product = this.products.find((p) => p.sku === sku);
                const quantity = Number(quantityText);
                if (!product || !Number.isInteger(quantity) || quantity < 1) {
                    unknown.push(sku);
                    return [];
                }
                return [{ productId: product.id, sku, product: product.name, quantity, unitPrice: product.price, lineTotal: quantity * product.price }];
            });
        this.querySelector<Table>('.draft-lines')!.rows = this.lines.map((line) => ({ ...line }));
        this.warn(unknown.length ? `Left out lines that name no known product or quantity: ${unknown.join(', ')}` : '');
    }

    private warn(message: string): void {
        const banner = this.querySelector<HTMLElement>('.unknown-skus')!;
        banner.textContent = message;
        banner.hidden = message === '';
    }

    private showReview(problem = ''): void {
        const customer = this.customers.find((c) => String(c.id) === this.header.customerId);
        this.review.render({
            customer: customer?.name ?? '',
            reference: this.header.reference || '(none)',
            deliveryDate: this.header.deliveryDate,
            total: this.lines.reduce((sum, line) => sum + line.lineTotal, 0),
            problem,
        });
        this.show(2);
    }

    private async place(): Promise<void> {
        const result = await this.orders.create({
            customerId: Number(this.header.customerId),
            reference: this.header.reference,
            deliveryDate: this.header.deliveryDate,
            lines: this.lines.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
        });
        if (result.saved) {
            navigate('order', { params: { orderId: result.value } });
        } else {
            this.showReview(Object.values(result.problem.errors).flat().join(' ') || result.problem.title);
        }
    }
}

customElements.define('new-order-page', NewOrderPage);
