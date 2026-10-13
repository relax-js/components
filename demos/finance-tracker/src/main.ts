// Services first: components inject them when they are constructed.
import { LanguageService, type Language } from './language/LanguageService';
import './budget/FinanceService';

import '@relax.js/components';
import '@relax.js/components/theme.css';
import '../../shared/demo.css';
import './styles.css';

import './shell/AppHeader';
import './overview/OverviewPage';
import './budget/BudgetPage';
import './transactions/TransactionsPage';

import { container } from '@relax.js/core/di';
import { registerCatalogue } from '@relax.js/core/i18n';
import { defineRoutes, startRouting } from '@relax.js/core/routing';

async function bootstrap(): Promise<void> {
    registerCatalogue(import.meta.glob('./i18n/locales/*/*.json', { eager: true }));
    const browser: Language = navigator.language.startsWith('sv') ? 'sv' : 'en';
    await container.resolve(LanguageService).use(browser);

    // The header reads the copy when it is constructed, so it is added once the copy is loaded.
    document.querySelector('.app-header')!.append(document.createElement('app-header'));

    defineRoutes([
        { name: 'overview', path: '/', componentTagName: 'overview-page' },
        { name: 'budget', path: '/budget', componentTagName: 'budget-page' },
        { name: 'transactions', path: '/transactions', componentTagName: 'transactions-page' },
    ]);
    startRouting();
}

void bootstrap();
