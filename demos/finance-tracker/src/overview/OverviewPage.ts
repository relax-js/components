import { Inject } from '@relax.js/core/di';
import { compileTemplate } from '@relax.js/core/html';
import { t } from '@relax.js/core/i18n';
import type { LineChart, Sparkline } from '@relax.js/components';
import { FinanceService } from '../budget/FinanceService';
import { LanguageService, type FinanceCopy } from '../language/LanguageService';

interface AccountRow {
    name: string;
    balance: number;
}

interface BillRow {
    name: string;
    amount: number;
    daysLeft: number;
}

interface OverviewView {
    copy: FinanceCopy;
    spending: number;
    spendingLastYear: number;
    saved: number;
    savedLastMonth: number;
    total: number;
    totalLastMonth: number;
    billsLead: string;
    accounts: AccountRow[];
    bills: BillRow[];
}

/** The month at a glance: spending and saving, every account, what is due and the year's balance. */
class OverviewPage extends HTMLElement {
    @Inject(LanguageService)
    private language!: LanguageService;

    @Inject(FinanceService)
    private finance!: FinanceService;

    private stopWatching?: () => void;

    private readonly view = compileTemplate<OverviewView>(`
        <h2 class="page-heading">{{copy.overview.heading}}</h2>
        <div class="figure-row">
            <r-kpi-meter label="{{copy.overview.spending}}" value="{{spending}}" previous="{{spendingLastYear}}" better="lower"></r-kpi-meter>
            <r-stat-tile label="{{copy.overview.saved}}" value="{{saved}}" previous="{{savedLastMonth}}" period="{{copy.overview.lastMonth}}"></r-stat-tile>
            <r-stat-tile label="{{copy.overview.total}}" value="{{total}}" previous="{{totalLastMonth}}" period="{{copy.overview.lastMonth}}"></r-stat-tile>
        </div>
        <div class="panels">
            <r-card heading="{{copy.overview.accounts}}" lead="{{copy.overview.accountsLead}}">
                <ul class="accounts">
                    <li loop="account in accounts">
                        <span class="name">{{account.name}}</span>
                        <r-sparkline></r-sparkline>
                        <r-amount value="{{account.balance}}"></r-amount>
                    </li>
                </ul>
            </r-card>
            <r-card heading="{{copy.overview.bills}}" lead="{{billsLead}}" icon="clock">
                <ul class="bills">
                    <li loop="bill in bills">
                        <span class="name">{{bill.name}}</span>
                        <r-days-left days="{{bill.daysLeft}}"></r-days-left>
                        <r-amount value="{{bill.amount}}"></r-amount>
                    </li>
                </ul>
            </r-card>
            <r-card heading="{{copy.overview.balance}}" lead="{{copy.overview.balanceLead}}" class="wide">
                <r-line-chart></r-line-chart>
            </r-card>
        </div>
    `);

    connectedCallback(): void {
        this.draw();
        this.replaceChildren(this.view.content);
        this.drawCharts();
        this.stopWatching = this.language.watch(() => {
            this.draw();
            this.drawCharts();
        });
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const { copy } = this.language;
        const finance = this.finance;
        const totals = finance.totalBalances();
        const dueSoon = finance.bills.filter((bill) => bill.daysLeft <= 14).length;
        this.view.render({
            copy,
            spending: finance.thisMonth.spending,
            spendingLastYear: finance.sameMonthLastYear.spending,
            saved: finance.thisMonth.saved,
            savedLastMonth: finance.lastMonth.saved,
            total: totals[totals.length - 1],
            totalLastMonth: totals[totals.length - 2],
            billsLead: t('finance:billsDue', { count: dueSoon }),
            accounts: finance.accounts.map((account) => ({
                name: copy.accounts[account.account],
                balance: account.balances[account.balances.length - 1],
            })),
            bills: finance.bills.map((bill) => ({ name: copy.bills[bill.bill], amount: bill.amount, daysLeft: bill.daysLeft })),
        });
    }

    // Charts take their data as properties, which a template cannot bind, so they are set after rendering.
    private drawCharts(): void {
        const { copy } = this.language;
        const months = this.monthLabels();
        this.querySelectorAll<Sparkline>('.accounts r-sparkline').forEach((spark, i) => {
            const account = this.finance.accounts[i];
            spark.data = {
                labels: months,
                series: [{ name: copy.accounts[account.account], values: account.balances }],
                summary: copy.overview.accountsLead,
            };
        });

        const chart = this.querySelector<LineChart>('r-line-chart')!;
        chart.data = {
            labels: months,
            series: [
                { name: copy.overview.total, values: this.finance.totalBalances(), area: true },
                { name: copy.overview.bufferTarget, values: months.map(() => this.finance.bufferTarget), threshold: true },
            ],
            summary: copy.overview.balanceLead,
        };
    }

    private monthLabels(): string[] {
        const format = new Intl.DateTimeFormat(this.language.locale, { month: 'short' });
        return this.finance.months.slice(-12).map((summary) => format.format(summary.month));
    }
}

customElements.define('overview-page', OverviewPage);
