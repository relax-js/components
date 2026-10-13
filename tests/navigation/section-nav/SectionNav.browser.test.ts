import { describe, expect, it } from 'vitest';
import '../../../src/navigation/section-nav/SectionNav';
import { layoutProblems, mount, widths } from '../../layout';

describe('r-section-nav layout', () => {
    it.each(widths)('at_%ipx_links_that_do_not_fit_scroll_within_the_nav_instead_of_widening_the_page', async (width) => {
        const element = document.createElement('r-section-nav');
        element.setAttribute('label', 'Settings');
        element.innerHTML = ['Company profile', 'Notifications', 'Users and permissions', 'Billing and invoices', 'Integrations', 'Audit log']
            .map((title, i) => `<a href="/settings/${String(i)}">${title}</a>`).join('');
        await mount(element, width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
