import { captureProblems } from '../../captureProblems';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/navigation/dropdown-menu/DropdownMenu';
import type { MenuItem } from '../../../src/navigation/top-menu/TopMenu';
import type { DropdownMenu } from '../../../src/navigation/dropdown-menu/DropdownMenu';

function trigger(menu: DropdownMenu): HTMLButtonElement {
    return menu.shadowRoot!.querySelector('button')!;
}

function panel(menu: DropdownMenu): HTMLElement {
    return menu.shadowRoot!.querySelector('.panel')!;
}

function mountMenu(
    attributes: Record<string, string> = { label: 'Account' },
    items: MenuItem[] = [{ name: 'default', title: 'Default' }]
): DropdownMenu {
    const menu = document.createElement('r-dropdown-menu');
    menu.items = items;
    for (const [name, value] of Object.entries(attributes)) {
        menu.setAttribute(name, value);
    }
    mount(menu);
    return menu;
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
    return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top } as DOMRect;
}

describe('r-dropdown-menu', () => {
    const shown: HTMLElement[] = [];

    beforeEach(() => {
        shown.length = 0;
        // jsdom has no popover API
        HTMLElement.prototype.showPopover = function (this: HTMLElement) {
            shown.push(this);
            this.setAttribute('data-shown', '');
        };
        HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
            shown.splice(shown.indexOf(this), 1);
            this.removeAttribute('data-shown');
        };
    });

    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('label_is_the_trigger_text_and_icon_is_added_before_it', () => {
        const menu = mountMenu({ label: 'Account', icon: 'user' });

        const button = trigger(menu);
        expect(button.firstElementChild?.tagName).toBe('R-ICON');
        expect(button.firstElementChild?.getAttribute('name')).toBe('user');
        expect(button.textContent).toBe('Account');
    });

    it('icon_only_shows_just_the_icon_and_keeps_the_label_as_accessible_name', () => {
        const menu = mountMenu({ label: 'Account', icon: 'user', 'icon-only': '' });

        const button = trigger(menu);
        expect(button.textContent).toBe('');
        expect(button.querySelector('r-icon')).not.toBeNull();
        expect(button.getAttribute('aria-label')).toBe('Account');
    });

    it('missing_label_reports_an_error_naming_the_element_and_renders_empty', () => {
        const reported = captureProblems();

        const menu = mountMenu({});

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-dropdown-menu'));
        expect(menu.shadowRoot!.childElementCount).toBe(0);
    });

    it('clicking_the_trigger_toggles_the_panel_popover', () => {
        const menu = mountMenu();

        trigger(menu).click();
        expect(shown).toEqual([panel(menu)]);
        expect(panel(menu).getAttribute('popover')).toBe('manual');

        trigger(menu).click();
        expect(shown).toEqual([]);
    });

    it('open_is_reflected_with_aria_haspopup_and_matching_aria_expanded', () => {
        const menu = mountMenu();
        expect(trigger(menu).getAttribute('aria-haspopup')).toBe('menu');
        expect(trigger(menu).getAttribute('aria-expanded')).toBe('false');
        expect(menu.hasAttribute('open')).toBe(false);

        trigger(menu).click();
        expect(menu.hasAttribute('open')).toBe(true);
        expect(trigger(menu).getAttribute('aria-expanded')).toBe('true');

        trigger(menu).click();
        expect(menu.hasAttribute('open')).toBe(false);
        expect(trigger(menu).getAttribute('aria-expanded')).toBe('false');
    });

    describe('placement', () => {
        beforeEach(() => {
            vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(500);
            vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(400);
        });

        function open(anchor: DOMRect): DropdownMenu {
            const menu = mountMenu();
            vi.spyOn(trigger(menu), 'getBoundingClientRect').mockReturnValue(anchor);
            vi.spyOn(panel(menu), 'getBoundingClientRect').mockReturnValue(rect(0, 0, 100, 80));
            trigger(menu).click();
            return menu;
        }

        it('panel_opens_below_the_trigger_aligned_with_its_start_edge', () => {
            const menu = open(rect(50, 20, 60, 30));

            expect(panel(menu).style.top).toBe('54px');
            expect(panel(menu).style.left).toBe('50px');
        });

        it('panel_flips_above_and_to_the_other_edge_when_it_would_leave_the_viewport', () => {
            const menu = open(rect(420, 350, 60, 30));

            expect(panel(menu).style.top).toBe('266px');
            expect(panel(menu).style.left).toBe('380px');
        });
    });

    it('panel_takes_the_floating_tier_variables_and_casts_a_shadow', () => {
        const menu = mountMenu();
        const css = menu.shadowRoot!.querySelector('style')!.textContent!;

        expect(css).toContain('var(--floating-radius)');
        expect(css).toContain('var(--floating-padding)');
        expect(css).toContain('box-shadow: var(--floating-shadow)');
    });

    it('clicking_outside_the_menu_closes_the_panel', () => {
        const menu = mountMenu();
        trigger(menu).click();

        document.body.click();

        expect(menu.hasAttribute('open')).toBe(false);
        expect(shown).toEqual([]);
    });

    it('clicking_inside_the_menu_keeps_the_panel_open', () => {
        const menu = mountMenu();
        trigger(menu).click();

        panel(menu).click();

        expect(menu.hasAttribute('open')).toBe(true);
    });

    it('opening_another_menu_closes_this_one', () => {
        const first = mountMenu();
        const second = mountMenu({ label: 'Other' });
        trigger(first).click();

        trigger(second).click();

        expect(first.hasAttribute('open')).toBe(false);
        expect(second.hasAttribute('open')).toBe(true);
        expect(shown).toEqual([panel(second)]);
    });

    it('navigating_to_another_route_closes_the_panel', () => {
        const menu = mountMenu();
        trigger(menu).click();

        document.dispatchEvent(new Event('rlx.navigateRoute'));

        expect(menu.hasAttribute('open')).toBe(false);
    });

    function items(menu: DropdownMenu): HTMLElement[] {
        return Array.from(panel(menu).children) as HTMLElement[];
    }

    it('set_items_show_each_title_in_order', () => {
        const menu = mountMenu();
        menu.items = [{ name: 'a', title: 'First' }, { name: 'b', title: 'Second' }];

        expect(items(menu).map((i) => i.textContent)).toEqual(['First', 'Second']);
    });

    it('items_set_before_connecting_are_drawn_when_it_connects', () => {
        const menu = document.createElement('r-dropdown-menu');
        menu.setAttribute('label', 'Account');
        menu.items = [{ name: 'a', title: 'First' }];
        mount(menu);

        expect(items(menu).map((i) => i.textContent)).toEqual(['First']);
    });

    it('trigger_is_disabled_when_there_are_no_items', () => {
        const menu = mountMenu({ label: 'Account' }, []);
        expect(trigger(menu).disabled).toBe(true);

        menu.items = [{ name: 'a', title: 'First' }];
        expect(trigger(menu).disabled).toBe(false);
    });

    it('item_with_children_reports_an_error_naming_the_element_and_is_left_out', () => {
        const reported = captureProblems();
        const menu = mountMenu();
        menu.items = [
            { name: 'a', title: 'Parent', children: [{ name: 'c', title: 'Child' }] },
            { name: 'b', title: 'Plain' },
        ];

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-dropdown-menu'));
        expect(items(menu).map((i) => i.textContent)).toEqual(['Plain']);
    });

    it('item_without_href_is_a_button_that_dispatches_menu_selected_with_the_item', () => {
        const menu = mountMenu();
        const item = { name: 'a', title: 'First' };
        menu.items = [item];
        const received: unknown[] = [];
        menu.addEventListener('r-menu-selected', (e) => received.push(e.item));

        expect(items(menu)[0].tagName).toBe('BUTTON');
        items(menu)[0].click();

        expect(received).toEqual([item]);
    });

    it('item_with_href_is_a_link_and_menu_selected_is_dispatched_before_the_browser_follows', () => {
        const menu = mountMenu();
        const item = { name: 'a', title: 'First', href: '/first' };
        menu.items = [item];
        const received: unknown[] = [];
        menu.addEventListener('r-menu-selected', (e) => received.push(e.item));

        const link = items(menu)[0] as HTMLAnchorElement;
        expect(link.tagName).toBe('A');
        expect(link.getAttribute('href')).toBe('/first');
        link.addEventListener('click', (e) => {
            expect(received).toEqual([item]);
            e.preventDefault();
        });
        link.click();
    });

    it('choosing_an_item_closes_the_panel', () => {
        const menu = mountMenu();
        menu.items = [{ name: 'a', title: 'First' }];
        trigger(menu).click();

        items(menu)[0].click();

        expect(menu.hasAttribute('open')).toBe(false);
    });

    it('escape_closes_the_panel_and_returns_focus_to_the_trigger', () => {
        const menu = mountMenu();
        trigger(menu).click();

        panel(menu).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));

        expect(menu.hasAttribute('open')).toBe(false);
        expect(menu.shadowRoot!.activeElement).toBe(trigger(menu));
    });

    describe('keyboard', () => {
        const threeItems: MenuItem[] = [
            { name: 'a', title: 'A' },
            { name: 'b', title: 'B' },
            { name: 'c', title: 'C' },
        ];

        function press(from: HTMLElement, key: string): KeyboardEvent {
            const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true });
            from.dispatchEvent(event);
            return event;
        }

        function focused(menu: DropdownMenu): Element | null {
            return menu.shadowRoot!.activeElement;
        }

        it.each(['Enter', ' ', 'ArrowDown'])('%s_on_the_trigger_opens_the_panel_with_focus_on_the_first_item', (key) => {
            const menu = mountMenu({ label: 'Account' }, threeItems);

            press(trigger(menu), key);

            expect(menu.hasAttribute('open')).toBe(true);
            expect(focused(menu)).toBe(items(menu)[0]);
        });

        it('up_on_the_trigger_opens_the_panel_with_focus_on_the_last_item', () => {
            const menu = mountMenu({ label: 'Account' }, threeItems);

            press(trigger(menu), 'ArrowUp');

            expect(menu.hasAttribute('open')).toBe(true);
            expect(focused(menu)).toBe(items(menu)[2]);
        });

        it('down_and_up_move_focus_to_the_next_and_previous_item_wrapping_at_the_ends', () => {
            const menu = mountMenu({ label: 'Account' }, threeItems);
            press(trigger(menu), 'ArrowDown');
            const list = items(menu);

            press(list[0], 'ArrowDown');
            expect(focused(menu)).toBe(list[1]);
            press(list[1], 'ArrowDown');
            press(list[2], 'ArrowDown');
            expect(focused(menu)).toBe(list[0]);
            press(list[0], 'ArrowUp');
            expect(focused(menu)).toBe(list[2]);
            press(list[2], 'ArrowUp');
            expect(focused(menu)).toBe(list[1]);
        });

        it('home_focuses_the_first_item_and_end_the_last', () => {
            const menu = mountMenu({ label: 'Account' }, threeItems);
            press(trigger(menu), 'ArrowDown');
            const list = items(menu);

            press(list[0], 'End');
            expect(focused(menu)).toBe(list[2]);
            press(list[2], 'Home');
            expect(focused(menu)).toBe(list[0]);
        });

        it('tab_closes_the_panel_and_leaves_focus_on_the_trigger_so_it_moves_on_past_it', () => {
            const menu = mountMenu({ label: 'Account' }, threeItems);
            press(trigger(menu), 'ArrowDown');

            const event = press(items(menu)[1], 'Tab');

            expect(menu.hasAttribute('open')).toBe(false);
            expect(focused(menu)).toBe(trigger(menu));
            expect(event.defaultPrevented).toBe(false);
        });
    });
});
