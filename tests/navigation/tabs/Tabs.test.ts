import { afterEach, describe, expect, it, vi } from 'vitest';
import { flush } from '@relax.js/core/testing';
import '../../../src/navigation/tabs/Tabs';
import type { TabChangeEvent, Tabs } from '../../../src/navigation/tabs/Tabs';

function mountTabs(markup: string): Tabs {
    document.body.innerHTML = markup;
    return document.querySelector('r-tabs')!;
}

const threeTabs = `
    <r-tabs>
        <r-tab label="One">first</r-tab>
        <r-tab label="Two">second</r-tab>
        <r-tab label="Three">third</r-tab>
    </r-tabs>`;

function headers(tabs: Tabs): HTMLButtonElement[] {
    return Array.from(tabs.shadowRoot!.querySelectorAll('[role="tab"]'));
}

describe('r-tabs', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('each_tab_gets_a_header_with_its_label_in_declared_order', () => {
        const tabs = mountTabs(threeTabs);

        expect(headers(tabs).map((header) => header.textContent)).toEqual(['One', 'Two', 'Three']);
    });

    it('without_a_selected_attribute_the_first_tab_is_shown', () => {
        const tabs = mountTabs(threeTabs);

        expect(tabs.tabs.map((tab) => tab.hidden)).toEqual([false, true, true]);
        expect(tabs.tabs.map((tab) => tab.hasAttribute('selected'))).toEqual([true, false, false]);
    });

    it('the_selected_attribute_picks_the_tab_shown_first', () => {
        const tabs = mountTabs(threeTabs.replace('<r-tabs>', '<r-tabs selected="2">'));

        expect(tabs.tabs[2].hidden).toBe(false);
        expect(headers(tabs)[2].getAttribute('aria-selected')).toBe('true');
    });

    it('clicking_a_header_shows_its_tab_and_reports_the_change', () => {
        const tabs = mountTabs(threeTabs);
        const events: TabChangeEvent[] = [];
        tabs.addEventListener('r-tab-change', (event) => events.push(event));

        headers(tabs)[1].click();

        expect(tabs.selectedIndex).toBe(1);
        expect(events.map((event) => event.selectedIndex)).toEqual([1]);
        expect(events[0].tab).toBe(tabs.tabs[1]);
    });

    it('clicking_the_header_of_the_shown_tab_reports_nothing', () => {
        const tabs = mountTabs(threeTabs);
        const listener = vi.fn();
        tabs.addEventListener('r-tab-change', listener);

        headers(tabs)[0].click();

        expect(listener).not.toHaveBeenCalled();
    });

    it('changing_the_selected_attribute_switches_tab', () => {
        const tabs = mountTabs(threeTabs);

        tabs.setAttribute('selected', '1');

        expect(tabs.tabs[1].hidden).toBe(false);
        expect(tabs.tabs[0].hidden).toBe(true);
    });

    it('an_out_of_range_selected_attribute_logs_an_error_and_shows_no_tab', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const tabs = mountTabs(threeTabs.replace('<r-tabs>', '<r-tabs selected="7">'));

        expect(tabs.tabs.every((tab) => tab.hidden)).toBe(true);
        expect(error).toHaveBeenCalledWith(expect.stringMatching(/^r-tabs: selected="7"/));
    });

    it('a_selected_attribute_that_is_not_a_number_logs_an_error', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        mountTabs(threeTabs.replace('<r-tabs>', '<r-tabs selected="second">'));

        expect(error).toHaveBeenCalledWith(expect.stringMatching(/^r-tabs: selected="second"/));
    });

    it('selecting_a_tab_that_does_not_exist_from_code_throws', () => {
        const tabs = mountTabs(threeTabs);

        expect(() => tabs.select(3)).toThrow(/r-tabs: there is no tab at index 3/);
    });

    it('a_tab_added_later_gets_a_header', async () => {
        const tabs = mountTabs(threeTabs);
        const tab = document.createElement('r-tab');
        tab.setAttribute('label', 'Four');
        tabs.append(tab);
        await flush();

        expect(headers(tabs).map((header) => header.textContent)).toEqual(['One', 'Two', 'Three', 'Four']);
        expect(tab.hidden).toBe(true);
    });

    it('relabelling_a_tab_updates_its_header', async () => {
        const tabs = mountTabs(threeTabs);
        tabs.tabs[0].setAttribute('label', 'First');
        await flush();

        expect(headers(tabs)[0].textContent).toBe('First');
    });

    it('arrow_keys_move_to_the_next_tab_and_wrap_around', () => {
        const tabs = mountTabs(threeTabs);

        headers(tabs)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

        expect(tabs.selectedIndex).toBe(2);
    });

    it('a_tab_without_a_label_logs_an_error_and_gets_an_empty_header', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const tabs = mountTabs('<r-tabs><r-tab>x</r-tab></r-tabs>');

        expect(error).toHaveBeenCalled();
        expect(headers(tabs).map((header) => header.textContent)).toEqual(['']);
    });

    it('a_tab_set_moved_elsewhere_keeps_one_header_bar', () => {
        const tabs = mountTabs(`<div id="a">${threeTabs}</div><div id="b"></div>`);
        document.getElementById('b')!.append(tabs);

        expect(tabs.shadowRoot!.querySelectorAll('[role="tablist"]').length).toBe(1);
        expect(headers(tabs).length).toBe(3);
    });

    it('removing_a_tab_removes_its_header', async () => {
        const tabs = mountTabs(threeTabs);
        tabs.tabs[1].remove();
        await flush();

        expect(headers(tabs).map((header) => header.textContent)).toEqual(['One', 'Three']);
    });

    it('removing_the_shown_tab_shows_the_tab_now_at_the_index_without_an_event', async () => {
        const tabs = mountTabs(threeTabs.replace('<r-tabs>', '<r-tabs selected="1">'));
        const listener = vi.fn();
        tabs.addEventListener('r-tab-change', listener);
        tabs.tabs[1].remove();
        await flush();

        expect(tabs.tabs.map((tab) => tab.hidden)).toEqual([true, false]);
        expect(listener).not.toHaveBeenCalled();
    });

    it('removing_the_shown_last_tab_shows_the_new_last_tab_without_an_event', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const tabs = mountTabs(threeTabs.replace('<r-tabs>', '<r-tabs selected="2">'));
        const listener = vi.fn();
        tabs.addEventListener('r-tab-change', listener);
        tabs.tabs[2].remove();
        await flush();

        expect(tabs.selectedIndex).toBe(1);
        expect(tabs.tabs.map((tab) => tab.hidden)).toEqual([true, false]);
        expect(listener).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it('an_invalid_selected_attribute_reads_minus_one_as_selected_index', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const tabs = mountTabs(threeTabs.replace('<r-tabs>', '<r-tabs selected="7">'));

        expect(tabs.selectedIndex).toBe(-1);
    });

    it('only_the_selected_tab_carries_the_selected_attribute_and_is_shown', () => {
        const tabs = mountTabs(threeTabs);
        tabs.select(2);

        expect(tabs.tabs.map((tab) => tab.hasAttribute('selected'))).toEqual([false, false, true]);
        expect(tabs.tabs.map((tab) => tab.hidden)).toEqual([true, true, false]);
    });

    it('changing_the_selected_attribute_dispatches_no_event', () => {
        const tabs = mountTabs(threeTabs);
        const listener = vi.fn();
        tabs.addEventListener('r-tab-change', listener);
        tabs.setAttribute('selected', '2');

        expect(listener).not.toHaveBeenCalled();
    });

    it('select_from_code_shows_the_tab_reflects_the_attribute_and_dispatches_a_bubbling_event', () => {
        const tabs = mountTabs(threeTabs);
        const listener = vi.fn();
        document.body.addEventListener('r-tab-change', listener);
        tabs.select(1);
        document.body.removeEventListener('r-tab-change', listener);

        expect(tabs.getAttribute('selected')).toBe('1');
        expect(tabs.tabs[1].hidden).toBe(false);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('home_and_end_select_first_and_last_and_only_the_selected_header_is_tabbable', () => {
        const tabs = mountTabs(threeTabs);
        const press = (key: string) =>
            headers(tabs)[tabs.selectedIndex].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        press('End');
        expect(tabs.selectedIndex).toBe(2);
        expect(headers(tabs).map((header) => header.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
        press('ArrowRight');
        expect(tabs.selectedIndex).toBe(0);
        press('Home');
        expect(tabs.selectedIndex).toBe(0);
    });

    it('headers_and_panels_carry_tabs_pattern_roles_and_labels', () => {
        const tabs = mountTabs(threeTabs);

        expect(headers(tabs)[0].getAttribute('aria-selected')).toBe('true');
        expect(tabs.tabs[1].getAttribute('role')).toBe('tabpanel');
        expect(tabs.tabs[1].getAttribute('aria-label')).toBe('Two');
    });

    it('header_bar_and_headers_are_exposed_as_parts', () => {
        const tabs = mountTabs(threeTabs);

        expect(tabs.shadowRoot!.querySelector('[role="tablist"]')!.getAttribute('part')).toBe('tablist');
        expect(headers(tabs).map((header) => header.getAttribute('part'))).toEqual(['tab selected', 'tab', 'tab']);
    });

    it('a_nested_set_does_not_switch_or_report_through_the_outer_set', () => {
        const tabs = mountTabs(`
            <r-tabs>
                <r-tab label="Outer one"><r-tabs id="inner">
                    <r-tab label="a">a</r-tab><r-tab label="b">b</r-tab>
                </r-tabs></r-tab>
                <r-tab label="Outer two">two</r-tab>
            </r-tabs>`);
        const inner = document.getElementById('inner') as Tabs;
        const outerEvents: TabChangeEvent[] = [];
        tabs.addEventListener('r-tab-change', (event) => outerEvents.push(event));
        headers(inner)[1].click();

        expect(tabs.tabs.length).toBe(2);
        expect(headers(tabs).length).toBe(2);
        expect(tabs.selectedIndex).toBe(0);
        expect(tabs.hasAttribute('selected')).toBe(false);
        expect(outerEvents.map((event) => event.tab)).toEqual([inner.tabs[1]]);
        expect(outerEvents.every((event) => event.target === inner)).toBe(true);
    });
});
