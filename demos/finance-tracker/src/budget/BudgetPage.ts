import { Inject } from '@relax.js/core/di';
import { compileTemplate } from '@relax.js/core/html';
import { t } from '@relax.js/core/i18n';
import type { BarChart, PeriodGrid } from '@relax.js/components';
import { LanguageService, type FinanceCopy } from '../language/LanguageService';
import { FinanceService } from './FinanceService';

interface LimitRow {
    name: string;
    spent: number;
    budget: number;
}

interface BudgetView {
    copy: FinanceCopy;
    overBudgetLead: string;
    unit: string;
    year: number;
    limits: LimitRow[];
}

/** This month's spending against the budget, category by category, and where the year stands. */
class BudgetPage extends HTMLElement {
    @Inject(LanguageService)
    private language!: LanguageService;

    @Inject(FinanceService)
    private finance!: FinanceService;

    private stopWatching?: () => void;

    private readonly view = compileTemplate<BudgetView>(`
        <h2 class="page-heading">{{copy.budget.heading}}</h2>
        <div class="panels">
            <r-card heading="{{copy.budget.byCategory}}" lead="{{copy.budget.byCategoryLead}}">
                <r-bar-chart orientation="horizontal"></r-bar-chart>
            </r-card>
            <r-card heading="{{copy.budget.limits}}" lead="{{overBudgetLead}}">
                <div class="meter-list">
                    <r-meter loop="limit in limits" label="{{limit.name}}" value="{{limit.spent}}" max="{{limit.budget}}" unit="{{unit}}"></r-meter>
                </div>
            </r-card>
            <r-card heading="{{copy.budget.year}}" lead="{{copy.budget.yearLead}}" class="wide">
                <r-period-grid year="{{year}}"></r-period-grid>
            </r-card>
        </div>
    `);

    connectedCallback(): void {
        this.draw();
        this.replaceChildren(this.view.content);
        this.drawData();
        this.stopWatching = this.language.watch(() => {
            this.draw();
            this.drawData();
        });
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const { copy, locale } = this.language;
        const categories = this.finance.categories;
        this.view.render({
            copy,
            overBudgetLead: t('finance:overBudget', { count: categories.filter((c) => c.spent > c.budget).length }),
            unit: currencySymbol(locale),
            year: new Date().getFullYear(),
            limits: categories.map((c) => ({ name: copy.categories[c.category], spent: c.spent, budget: c.budget })),
        });
    }

    // The chart and the grid take their data as properties, so they are set after rendering.
    private drawData(): void {
        const { copy, locale } = this.language;
        const categories = this.finance.categories;
        this.querySelector<BarChart>('r-bar-chart')!.data = {
            labels: categories.map((c) => copy.categories[c.category]),
            series: [
                { name: copy.budget.spent, values: categories.map((c) => c.spent) },
                { name: copy.budget.budget, values: categories.map((c) => c.budget), threshold: true },
            ],
            summary: copy.budget.byCategoryLead,
        };

        const month = new Intl.DateTimeFormat(locale, { month: 'short' });
        this.querySelector<PeriodGrid>('r-period-grid')!.periods = this.finance
            .periods()
            .map((period) => ({ month: month.format(period.month), state: period.state }));
    }
}

/** How the locale writes the currency on its own, such as "kr" in Swedish and "SEK" in English. */
function currencySymbol(locale: string): string {
    const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: 'SEK' }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? 'SEK';
}

customElements.define('budget-page', BudgetPage);
