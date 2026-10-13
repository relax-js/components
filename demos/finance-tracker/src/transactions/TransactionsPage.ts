import { Inject } from '@relax.js/core/di';
import { t } from '@relax.js/core/i18n';
import type { Table } from '@relax.js/components';
import { FinanceService } from '../budget/FinanceService';
import { LanguageService } from '../language/LanguageService';

/** This month's transactions, newest first, sortable by any column. */
class TransactionsPage extends HTMLElement {
    @Inject(LanguageService)
    private language!: LanguageService;

    @Inject(FinanceService)
    private finance!: FinanceService;

    private readonly heading = document.createElement('h2');
    private readonly lead = document.createElement('p');
    private readonly table: Table = document.createElement('r-table');
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.heading.className = 'page-heading';
        this.lead.className = 'lead';
        this.table.setAttribute('page-size', '12');
        this.draw();
        this.replaceChildren(this.heading, this.lead, this.table);
        this.stopWatching = this.language.watch(() => this.draw());
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const { copy } = this.language;
        this.heading.textContent = copy.transactions.heading;
        this.lead.textContent = t('finance:transactionCount', { count: this.finance.transactions.length });
        this.table.columns = [
            { field: 'day', title: copy.transactions.date, width: '8rem', sortable: true },
            { field: 'description', title: copy.transactions.description, sortable: true },
            { field: 'category', title: copy.transactions.category, sortable: true },
            { field: 'amount', title: copy.transactions.amount, width: '9rem', sortable: true },
        ];
        // A Date cell sorts by time and is written in the configured locale by the table itself.
        this.table.rows = this.finance.transactions.map((transaction) => ({
            day: transaction.date,
            description: transaction.description,
            category: copy.categories[transaction.category],
            amount: transaction.amount,
        }));
    }
}

customElements.define('transactions-page', TransactionsPage);
