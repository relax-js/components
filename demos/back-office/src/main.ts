// Services first: components inject them when they are constructed.
import './orders/OrderService';
import './catalog/CatalogService';

import { configureFormatting } from '@relax.js/components';
import '@relax.js/components/theme.css';
import '../../shared/demo.css';
import './styles.css';

import './shell/AccountMenu';
import './orders/OrdersPage';
import './orders/OrderPage';
import './orders/OrderEditPage';
import './orders/NewOrderPage';
import './catalog/ProductsPage';
import './settings/SettingsPage';

import { loadNamespaces, setLocale } from '@relax.js/core/i18n';
import { defineRoutes, startRouting } from '@relax.js/core/routing';

async function bootstrap(): Promise<void> {
    configureFormatting({ locale: 'sv-SE', currency: 'SEK' });
    await setLocale('en');
    await loadNamespaces(['r-components', 'r-validation']);

    document.querySelector('r-top-menu')!.items = [
        { name: 'orders', title: 'Orders', href: '/' },
        { name: 'products', title: 'Products', href: '/products' },
        {
            name: 'settings',
            title: 'Settings',
            children: [
                { name: 'settings-company', title: 'Company', href: '/settings/company' },
                { name: 'settings-notifications', title: 'Notifications', href: '/settings/notifications' },
            ],
        },
    ];

    defineRoutes([
        { name: 'orders', path: '/', componentTagName: 'orders-page' },
        { name: 'order-new', path: '/orders/new', componentTagName: 'new-order-page' },
        { name: 'order', path: '/orders/;orderId', componentTagName: 'order-page' },
        { name: 'order-edit', path: '/orders/;orderId/edit', target: 'order-editor', componentTagName: 'order-edit-page' },
        { name: 'products', path: '/products', componentTagName: 'products-page' },
        { name: 'settings', path: '/settings/:section', componentTagName: 'settings-page' },
    ]);
    startRouting();
}

void bootstrap();
