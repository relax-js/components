import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineRoutes, startRouting } from '@relax.js/core/routing';
import '../../../src/navigation/side-menu/SideMenu';
import type { SideMenu } from '../../../src/navigation/side-menu/SideMenu';
import type { MenuItem } from '../../../src/navigation/top-menu/TopMenu';

const items: MenuItem[] = [
    { name: 'profile', title: 'Profile', href: '/settings/profile' },
    { name: 'billing', title: 'Billing', href: '/settings/billing' },
    { name: 'settings', title: 'Settings', href: '/settings' },
];

function links(menu: SideMenu): HTMLAnchorElement[] {
    return Array.from(menu.shadowRoot!.querySelectorAll('a'));
}

function marked(menu: SideMenu): string[] {
    return links(menu)
        .filter((link) => link.getAttribute('aria-current') === 'page')
        .map((link) => link.textContent!);
}

function mountMenu(title: string | null = 'Settings area'): SideMenu {
    const element = document.createElement('r-side-menu') as SideMenu;
    if (title !== null) {
        element.setAttribute('title', title);
    }
    document.body.append(element);
    element.items = items;
    return element;
}

describe('r-side-menu', () => {
    afterEach(() => {
        document.body.replaceChildren();
        history.replaceState(null, '', '/');
        vi.restoreAllMocks();
    });

    it('title_is_shown_above_the_links_in_order_inside_a_landmark_labelled_by_it', () => {
        const menu = mountMenu();
        const nav = menu.shadowRoot!.querySelector('nav')!;
        const heading = menu.shadowRoot!.querySelector('h2')!;

        expect(heading.textContent).toBe('Settings area');
        expect(nav.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(nav.contains(heading)).toBe(true);
        expect(heading.compareDocumentPosition(nav.querySelector('ul')!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(links(menu).map((link) => link.textContent)).toEqual(['Profile', 'Billing', 'Settings']);
    });

    it('a_menu_without_a_title_reports_an_error_and_still_shows_its_links', () => {
        const reported = captureProblems();
        const menu = mountMenu(null);

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-side-menu'));
        expect(links(menu)).toHaveLength(3);
    });

    it('items_set_before_connecting_are_drawn_when_the_menu_connects', () => {
        const menu = document.createElement('r-side-menu') as SideMenu;
        menu.setAttribute('title', 'Early');
        menu.items = items;
        expect(links(menu)).toHaveLength(0);

        document.body.append(menu);

        expect(links(menu).map((link) => link.getAttribute('href'))).toEqual([
            '/settings/profile',
            '/settings/billing',
            '/settings',
        ]);
    });

    it('the_link_for_the_current_route_is_marked_with_aria_current_and_the_deepest_match_wins', () => {
        history.replaceState(null, '', '/settings/billing/invoices?x=1#top');
        const menu = mountMenu();

        expect(marked(menu)).toEqual(['Billing']);
    });

    it('a_link_to_a_partial_segment_is_not_marked_and_no_match_marks_nothing', () => {
        history.replaceState(null, '', '/settingsplus');
        const menu = mountMenu();

        expect(marked(menu)).toEqual([]);
    });

    it('the_mark_follows_the_route_when_it_changes', () => {
        history.replaceState(null, '', '/settings/profile');
        const menu = mountMenu();
        expect(marked(menu)).toEqual(['Profile']);

        history.pushState(null, '', '/settings/billing');
        window.dispatchEvent(new PopStateEvent('popstate'));

        expect(marked(menu)).toEqual(['Billing']);
    });

    it('a_link_to_a_defined_route_navigates_without_reloading_the_page', () => {
        customElements.define('x-profile', class extends HTMLElement {});
        defineRoutes([
            { name: 'home', path: '/', componentTagName: 'x-profile' },
            { name: 'profile', path: '/settings/profile', componentTagName: 'x-profile' },
        ]);
        startRouting();
        const menu = mountMenu();
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });

        links(menu)[0].dispatchEvent(click);

        expect(click.defaultPrevented).toBe(true);
    });

    it('links_taller_than_the_menu_scroll_inside_the_list_rather_than_stretching_the_page', () => {
        const menu = mountMenu();
        const css = menu.shadowRoot!.querySelector('style')!.textContent!;

        expect(css).toMatch(/ul\s*{[^}]*overflow-y:\s*auto/);
        expect(css).toMatch(/:host\s*{[^}]*height:\s*100%/);
    });

    it('the_marked_link_is_scrolled_into_view_on_first_draw_and_on_each_route_change', () => {
        const scroll = vi.fn();
        Element.prototype.scrollIntoView = scroll;
        history.replaceState(null, '', '/settings/profile');
        const menu = mountMenu();
        const afterDraw = scroll.mock.contexts.at(-1) as HTMLElement;
        expect(afterDraw.textContent).toBe('Profile');

        history.pushState(null, '', '/settings/billing');
        window.dispatchEvent(new PopStateEvent('popstate'));

        expect((scroll.mock.contexts.at(-1) as HTMLElement).textContent).toBe('Billing');
        expect(menu).toBeTruthy();
    });

    it('an_item_with_children_is_a_non_link_heading_with_its_links_always_shown_under_it', () => {
        const menu = mountMenu();
        menu.items = [
            { name: 'account', title: 'Account', href: '/account', children: [
                { name: 'profile', title: 'Profile', href: '/settings/profile' },
                { name: 'billing', title: 'Billing', href: '/settings/billing' },
            ] },
        ];
        const heading = menu.shadowRoot!.querySelector('[part="group"]')!;

        expect(heading.textContent).toBe('Account');
        expect(heading.closest('a')).toBeNull();
        expect(links(menu).map((link) => link.textContent)).toEqual(['Profile', 'Billing']);
        expect(heading.nextElementSibling!.tagName).toBe('UL');
        expect(menu.shadowRoot!.querySelector('details')).toBeNull();
    });

    it('an_item_nested_deeper_than_one_group_reports_an_error_and_is_left_out', () => {
        const reported = captureProblems();
        const menu = mountMenu();
        menu.items = [
            { name: 'account', title: 'Account', children: [
                { name: 'profile', title: 'Profile', href: '/settings/profile' },
                { name: 'more', title: 'More', children: [{ name: 'deep', title: 'Deep', href: '/deep' }] },
            ] },
        ];

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-side-menu'));
        expect(links(menu).map((link) => link.textContent)).toEqual(['Profile']);
        expect(menu.shadowRoot!.textContent).not.toContain('Deep');
    });

    it('the_menu_takes_panel_padding_and_gaps_casts_no_shadow_and_has_square_corners', () => {
        const css = mountMenu().shadowRoot!.querySelector('style')!.textContent!;

        expect(css).toMatch(/:host\s*{[^}]*padding:\s*var\(--panel-padding\)/);
        expect(css).toMatch(/gap:\s*var\(--panel-gap\)/);
        expect(css).toMatch(/:host\s*{[^}]*box-shadow:\s*none/);
        expect(css).toMatch(/:host\s*{[^}]*border-radius:\s*0/);
    });
});
