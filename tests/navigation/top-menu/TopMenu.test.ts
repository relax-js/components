import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import { defineRoutes, startRouting } from '@relax.js/core';
import { resetFormatting } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';
import '../../../src/navigation/top-menu/TopMenu';
import type { MenuItem, MenuSelectedEvent, TopMenu } from '../../../src/navigation/top-menu/TopMenu';

const items: MenuItem[] = [
    { name: 'home', title: 'Home', href: '/' },
    {
        name: 'file',
        title: 'File',
        children: [
            { name: 'file.new', title: 'New' },
            { name: 'file.open', title: 'Open' },
        ],
    },
    { name: 'help', title: 'Help' },
];

function level(menu: TopMenu, name: 'root' | 'submenu'): HTMLElement {
    return menu.shadowRoot!.querySelector(`.${name}`)!;
}

function control(menu: TopMenu, levelName: 'root' | 'submenu', text: string): HTMLElement {
    return Array.from(level(menu, levelName).querySelectorAll<HTMLElement>('button, a')).find(
        (element) => element.textContent === text
    )!;
}

function selections(menu: TopMenu): string[] {
    const names: string[] = [];
    menu.addEventListener('r-menu-selected', (event: MenuSelectedEvent) => names.push(event.item.name));
    return names;
}

describe('r-top-menu', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        resetFormatting();
        await restoreWords();
        vi.restoreAllMocks();
    });

    itemAndBackTests();
    popupAndFocusTests();
    selectionEventAndAlignmentTests();
});

function itemAndBackTests() {
    it('top_level_items_are_shown_in_order', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;

        expect(Array.from(level(element, 'root').querySelectorAll('li')).map((li) => li.textContent)).toEqual([
            'Home',
            'File',
            'Help',
        ]);
    });

    it('items_set_before_connecting_are_drawn_on_connect', () => {
        const menu = document.createElement('r-top-menu');
        menu.items = items;

        mount(menu);

        expect(level(menu, 'root').querySelectorAll('li')).toHaveLength(3);
    });

    it('an_item_with_a_submenu_opens_it_and_reports_no_selection', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        const selected = selections(element);

        control(element, 'root', 'File').click();

        expect(selected).toEqual([]);
        expect(level(element, 'submenu').hasAttribute('inert')).toBe(false);
        expect(level(element, 'root').hasAttribute('inert')).toBe(true);
        expect(control(element, 'submenu', 'New')).toBeDefined();
    });

    it('an_item_without_a_submenu_reports_its_selection', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        const selected = selections(element);

        control(element, 'root', 'Help').click();

        expect(selected).toEqual(['help']);
    });

    it('a_submenu_item_reports_its_selection', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        const selected = selections(element);

        control(element, 'root', 'File').click();
        control(element, 'submenu', 'Open').click();

        expect(selected).toEqual(['file.open']);
    });

    it('an_item_with_an_href_is_a_link', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;

        expect(control(element, 'root', 'Home').getAttribute('href')).toBe('/');
    });

    it('the_back_button_uses_the_configured_text_and_returns_to_the_top_level', async () => {
        await rewordEnglish({ back: 'Tillbaka' });
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        control(element, 'root', 'File').click();

        const back = element.shadowRoot!.querySelector<HTMLButtonElement>('[part="back"]')!;
        expect(back.textContent).toBe('Tillbaka');
        back.click();

        expect(level(element, 'root').hasAttribute('inert')).toBe(false);
        expect(level(element, 'submenu').childElementCount).toBe(0);
    });

    it('escape_goes_back_one_level', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        control(element, 'root', 'File').click();

        control(element, 'submenu', 'New').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(level(element, 'root').hasAttribute('inert')).toBe(false);
    });

}

function popupAndFocusTests() {
    it('an_item_with_children_is_marked_as_a_popup_and_shows_a_chevron', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;

        const file = control(element, 'root', 'File');
        expect(file.getAttribute('aria-haspopup')).toBe('menu');
        expect(file.querySelector('r-icon')!.getAttribute('name')).toBe('chevron-right');
        expect(control(element, 'root', 'Help').hasAttribute('aria-haspopup')).toBe(false);
    });

    it('a_nested_submenu_opens_without_reporting_a_selection_at_any_depth', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = [
            { name: 'a', title: 'A', children: [{ name: 'a.b', title: 'B', children: [{ name: 'a.b.c', title: 'C' }] }] },
        ];
        const selected = selections(element);

        control(element, 'root', 'A').click();
        control(element, 'submenu', 'B').click();

        expect(selected).toEqual([]);
        expect(control(element, 'submenu', 'C')).toBeDefined();
    });

    it('the_slide_is_disabled_when_the_user_prefers_reduced_motion', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        const css = element.shadowRoot!.querySelector('style')!.textContent!;

        expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*ul\s*\{\s*transition: none/);
    });

    it('escape_at_the_top_level_changes_nothing', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;

        control(element, 'root', 'Help').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(level(element, 'root').hasAttribute('inert')).toBe(false);
        expect(level(element, 'root').querySelectorAll('li')).toHaveLength(3);
    });

    it('the_back_text_follows_a_language_change', async () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        control(element, 'root', 'File').click();

        await rewordEnglish({ back: 'Tillbaka' });

        expect(element.shadowRoot!.querySelector('[part="back"]')!.textContent).toBe('Tillbaka');
    });

    it('opening_a_submenu_focuses_the_back_button_and_going_back_refocuses_the_opener', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;

        control(element, 'root', 'File').click();
        expect(element.shadowRoot!.activeElement).toBe(element.shadowRoot!.querySelector('[part="back"]'));

        element.shadowRoot!.querySelector<HTMLElement>('[part="back"]')!.click();
        expect(element.shadowRoot!.activeElement).toBe(control(element, 'root', 'File'));

        control(element, 'root', 'File').click();
        control(element, 'submenu', 'New').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(element.shadowRoot!.activeElement).toBe(control(element, 'root', 'File'));
    });

    it('show_top_level_closes_an_open_submenu', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        control(element, 'root', 'File').click();

        element.showTopLevel();

        expect(level(element, 'submenu').hasAttribute('inert')).toBe(true);
    });

    it('the_selected_event_carries_the_item_and_reaches_a_listener_outside_the_shadow_root', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        const received: MenuItem[] = [];
        document.body.addEventListener('r-menu-selected', (event) => received.push((event as MenuSelectedEvent).item));

        control(element, 'root', 'Help').click();

        expect(received).toEqual([items[2]]);
    });

}

function selectionEventAndAlignmentTests() {
    it('a_link_item_dispatches_the_selected_event_before_the_browser_follows_the_link', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        const link = control(element, 'root', 'Home');
        const selected = selections(element);
        let selectedWhenClickReachedDocument: string[] = [];
        const onClick = (event: Event) => {
            selectedWhenClickReachedDocument = [...selected];
            event.preventDefault();
        };
        document.addEventListener('click', onClick);

        link.click();
        document.removeEventListener('click', onClick);

        expect(selectedWhenClickReachedDocument).toEqual(['home']);
    });

    it('a_link_to_a_defined_route_navigates_without_reloading_when_routing_is_started', () => {
        class HomePage extends HTMLElement {}
        customElements.define('top-menu-test-page', HomePage);
        defineRoutes([
            { name: 'menu-start', path: '/menu-start', componentTagName: 'top-menu-test-page' },
            { name: 'menu-test', path: '/menu-test', componentTagName: 'top-menu-test-page' },
        ]);
        history.replaceState({}, '', '/menu-start');
        startRouting();
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = [{ name: 'menu-test', title: 'Test', href: '/menu-test' }];

        const click = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
        control(element, 'root', 'Test').dispatchEvent(click);

        expect(click.defaultPrevented).toBe(true);
        expect(location.pathname).toBe('/menu-test');
    });

    it('a_choice_inside_a_submenu_leaves_the_submenu_shown_until_show_top_level_is_called', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        control(element, 'root', 'File').click();

        control(element, 'submenu', 'New').click();

        expect(level(element, 'submenu').hasAttribute('inert')).toBe(false);
        element.showTopLevel();
        expect(level(element, 'submenu').hasAttribute('inert')).toBe(true);
    });

    it('setting_items_while_a_submenu_is_open_shows_the_top_level_with_the_new_items', () => {
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;
        control(element, 'root', 'File').click();

        element.items = [{ name: 'other', title: 'Other' }];

        expect(level(element, 'root').hasAttribute('inert')).toBe(false);
        expect(level(element, 'submenu').childElementCount).toBe(0);
        expect(level(element, 'root').textContent).toBe('Other');
    });

    it('items_with_duplicate_names_throw_a_named_error', () => {
        const { element } = mount<TopMenu>('r-top-menu');

        expect(() => {
            element.items = [
                { name: 'a', title: 'A' },
                { name: 'file', title: 'F', children: [{ name: 'a', title: 'Again' }] },
            ];
        }).toThrow(expect.objectContaining({ name: 'DuplicateMenuItemNameError' }));
    });

    it('titles_are_shown_as_given_as_text_and_never_parsed_or_translated', async () => {
        await rewordEnglish({ Help: 'Hjälp' });
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = [
            { name: 'x', title: '<b>Bold</b>' },
            { name: 'help', title: 'Help' },
        ];

        const root = level(element, 'root');
        expect(root.querySelector('b')).toBeNull();
        expect(Array.from(root.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['<b>Bold</b>', 'Help']);
    });

    it.each(['left', 'center', 'right'])('align_%s_is_accepted_and_renders_the_items', (align) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { element } = mount<TopMenu>('r-top-menu');
        element.setAttribute('align', align);
        element.items = items;

        expect(level(element, 'root').querySelectorAll('li')).toHaveLength(3);
        expect(error).not.toHaveBeenCalled();
    });

    it('an_absent_alignment_renders_the_items_without_error', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { element } = mount<TopMenu>('r-top-menu');
        element.items = items;

        expect(level(element, 'root').querySelectorAll('li')).toHaveLength(3);
        expect(error).not.toHaveBeenCalled();
    });

    it('an_unknown_alignment_logs_an_error_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const menu = document.createElement('r-top-menu');
        menu.setAttribute('align', 'middle');
        menu.items = items;

        mount(menu);

        expect(level(menu, 'root').childElementCount).toBe(0);
        expect(error).toHaveBeenCalledWith(expect.stringMatching(/^r-top-menu: align="middle"/));
    });
}
