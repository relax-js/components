import { describe, expect, it } from 'vitest';
import '../../../src/navigation/top-menu/TopMenu';
import type { TopMenu } from '../../../src/navigation/top-menu/TopMenu';
import { layoutProblems, mount, widths } from '../../layout';

function menu(): TopMenu {
    const element = document.createElement('r-top-menu');
    element.items = [
        { name: 'orders', title: 'Orders', href: '/' },
        { name: 'products', title: 'Products', href: '/products' },
        { name: 'customers', title: 'Customers', href: '/customers' },
        { name: 'reports', title: 'Reports', href: '/reports' },
        { name: 'settings', title: 'Settings', children: [{ name: 'company', title: 'Company', href: '/settings/company' }] },
    ];
    return element;
}

describe('r-top-menu layout', () => {
    it.each(widths)('at_%ipx_every_item_can_be_reached_and_none_is_cut_off', async (width) => {
        const element = await mount(menu(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
