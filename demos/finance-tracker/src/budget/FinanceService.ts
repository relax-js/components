import { ContainerService } from '@relax.js/core/di';
import { round, seededRandom } from '../../../shared/random';

export type CategoryKey = 'housing' | 'food' | 'transport' | 'leisure' | 'utilities';
export type AccountKey = 'everyday' | 'savings' | 'buffer';
export type BillKey = 'rent' | 'electricity' | 'broadband' | 'insurance';

export interface CategoryBudget {
    category: CategoryKey;
    budget: number;
    spent: number;
}

export interface Account {
    account: AccountKey;
    /** Month-end balances, oldest first; the last is today's balance. */
    balances: number[];
}

export interface Bill {
    bill: BillKey;
    amount: number;
    daysLeft: number;
}

export interface Transaction {
    date: Date;
    description: string;
    category: CategoryKey;
    amount: number;
}

export interface MonthSummary {
    month: Date;
    spending: number;
    saved: number;
}

const budgets: Record<CategoryKey, number> = {
    housing: 11500,
    food: 6200,
    transport: 2400,
    leisure: 3000,
    utilities: 1900,
};

const merchants: Record<CategoryKey, string[]> = {
    housing: ['Hyresvärden AB', 'Bauhaus', 'IKEA'],
    food: ['ICA Kvantum', 'Coop', 'Willys', 'Hemköp', 'Pressbyrån'],
    transport: ['SL', 'Circle K', 'SJ'],
    leisure: ['SF Bio', 'Spotify', 'Akademibokhandeln', 'Friskis & Svettis'],
    utilities: ['Vattenfall', 'Telia', 'Bahnhof'],
};

const random = seededRandom(2026);
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
const categoryKeys = Object.keys(budgets) as CategoryKey[];

function monthsBack(count: number): Date[] {
    const now = new Date();
    return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth() - count + 1 + i, 1));
}

/** One household's money, generated in the browser: there is no server behind this demo. */
@ContainerService({ inject: [] })
export class FinanceService {
    readonly months: MonthSummary[] = monthsBack(13).map((month) => {
        const spending = round(25000 + random() * 6000);
        return { month, spending, saved: round(38000 - spending - random() * 3000) };
    });

    readonly categories: CategoryBudget[] = categoryKeys.map((category) => ({
        category,
        budget: budgets[category],
        spent: round(budgets[category] * (0.55 + random() * 0.6)),
    }));

    readonly accounts: Account[] = (['everyday', 'savings', 'buffer'] as AccountKey[]).map((account, a) => {
        let balance = [14000, 82000, 45000][a];
        return {
            account,
            balances: monthsBack(12).map(() => (balance = round(balance + (a === 0 ? random() * 6000 - 3000 : random() * 4000 - 500)))),
        };
    });

    readonly bills: Bill[] = [
        { bill: 'rent', amount: 9800, daysLeft: 3 },
        { bill: 'electricity', amount: 640, daysLeft: 9 },
        { bill: 'broadband', amount: 399, daysLeft: 16 },
        { bill: 'insurance', amount: 1250, daysLeft: 24 },
    ];

    readonly transactions: Transaction[] = Array.from({ length: 34 }, () => {
        const category = pick(categoryKeys);
        const now = new Date();
        return {
            date: new Date(now.getFullYear(), now.getMonth(), 1 + Math.floor(random() * Math.max(1, now.getDate()))),
            description: pick(merchants[category]),
            category,
            amount: -round(budgets[category] / (category === 'housing' ? 2 : 8) * (0.4 + random())),
        };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());

    /** What a household wants to keep across its accounts. */
    readonly bufferTarget = 150000;

    get thisMonth(): MonthSummary {
        return this.months[this.months.length - 1];
    }

    get lastMonth(): MonthSummary {
        return this.months[this.months.length - 2];
    }

    /** The same month a year ago. */
    get sameMonthLastYear(): MonthSummary {
        return this.months[0];
    }

    /** Every account's month-end balances added together. */
    totalBalances(): number[] {
        return this.accounts[0].balances.map((_, i) => this.accounts.reduce((sum, account) => sum + account.balances[i], 0));
    }

    /** The year's months: earlier ones closed, the one before last locked for review, this one open. */
    periods(): { month: Date; state: 'closed' | 'locked' | 'open' | 'coming' }[] {
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const month = new Date(now.getFullYear(), i, 1);
            const state = i < now.getMonth() - 1 ? 'closed' : i === now.getMonth() - 1 ? 'locked' : i === now.getMonth() ? 'open' : 'coming';
            return { month, state };
        });
    }
}
