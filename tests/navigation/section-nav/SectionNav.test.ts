import { afterEach, describe, expect, it } from 'vitest';
import '../../../src/navigation/section-nav/SectionNav';
import type { SectionNav } from '../../../src/navigation/section-nav/SectionNav';

function mount(markup: string): SectionNav {
    document.body.innerHTML = markup;
    return document.querySelector('r-section-nav')!;
}

const links = `
    <r-section-nav label="Settings">
        <a href="/settings/profile">Profile</a>
        <a href="/settings/billing">Billing</a>
    </r-section-nav>`;

describe('r-section-nav', () => {
    afterEach(() => document.body.replaceChildren());

    it('the_pages_own_links_are_slotted_in_given_order_and_never_copied', () => {
        const nav = mount(links);
        const slot = nav.shadowRoot!.querySelector('slot')!;
        const assigned = slot.assignedElements();

        expect(assigned).toEqual(Array.from(nav.querySelectorAll('a')));
        expect(assigned.map((a) => a.textContent)).toEqual(['Profile', 'Billing']);
        expect(nav.shadowRoot!.querySelectorAll('a').length).toBe(0);
    });

    it('links_added_removed_or_relabelled_are_reflected_in_the_row', () => {
        const nav = mount(links);
        const slot = nav.shadowRoot!.querySelector('slot')!;
        const extra = document.createElement('a');
        extra.href = '/settings/team';
        extra.textContent = 'Team';

        nav.append(extra);
        nav.querySelector('a')!.textContent = 'Account';
        nav.querySelectorAll('a')[1].remove();

        expect(slot.assignedElements().map((a) => a.textContent)).toEqual(['Account', 'Team']);
    });

    it('the_links_sit_in_a_navigation_landmark_in_a_row', () => {
        const nav = mount(links);
        const landmark = nav.shadowRoot!.querySelector('nav')!;

        expect(landmark).not.toBeNull();
        expect(landmark.contains(nav.shadowRoot!.querySelector('slot'))).toBe(true);
        expect(nav.shadowRoot!.querySelector('style')!.textContent).toMatch(/flex-direction:\s*row/);
    });

    it('the_label_attribute_names_the_landmark', () => {
        const nav = mount(links);
        const landmark = nav.shadowRoot!.querySelector('nav')!;
        expect(landmark.getAttribute('aria-label')).toBe('Settings');

        nav.setAttribute('label', 'Account');
        expect(landmark.getAttribute('aria-label')).toBe('Account');
    });

    function marked(nav: SectionNav): string[] {
        return Array.from(nav.querySelectorAll('a[aria-current="page"]')).map((a) => a.textContent!);
    }

    const routed = `
        <r-section-nav label="S">
            <a href="/set">Set</a>
            <a href="/settings">Settings</a>
            <a href="/settings/billing">Billing</a>
        </r-section-nav>`;

    it('the_link_for_the_current_route_carries_aria_current_page', () => {
        history.pushState({}, '', '/settings/profile');
        const nav = mount(routed);
        expect(marked(nav)).toEqual(['Settings']);
    });

    it('the_mark_follows_client_side_navigation_and_back_and_forward', () => {
        history.pushState({}, '', '/settings');
        const nav = mount(routed);
        history.pushState({}, '', '/settings/billing');
        window.dispatchEvent(new PopStateEvent('popstate'));
        expect(marked(nav)).toEqual(['Billing']);
        history.pushState({}, '', '/settings');
        window.dispatchEvent(new PopStateEvent('popstate'));
        expect(marked(nav)).toEqual(['Settings']);
    });

    it('no_link_is_marked_when_none_matches_the_route', () => {
        history.pushState({}, '', '/other');
        expect(marked(mount(routed))).toEqual([]);
    });

    it('the_link_with_the_most_segments_wins_among_matching_links', () => {
        history.pushState({}, '', '/settings/billing/invoices');
        expect(marked(mount(routed))).toEqual(['Billing']);
    });

    it('a_link_to_set_does_not_match_settings', () => {
        history.pushState({}, '', '/settings');
        expect(marked(mount(routed))).not.toContain('Set');
    });

    it('query_and_hash_of_link_and_address_are_ignored', () => {
        history.pushState({}, '', '/settings/billing?tab=1#top');
        const nav = mount(`<r-section-nav><a href="/settings/billing?x=2#y">Billing</a></r-section-nav>`);
        expect(marked(nav)).toEqual(['Billing']);
    });

    it('links_scroll_sideways_instead_of_wrapping', () => {
        const css = mount(links).shadowRoot!.querySelector('style')!.textContent!;
        expect(css).toMatch(/overflow-x:\s*auto/);
        expect(css).not.toMatch(/flex-wrap:\s*wrap/);
    });

    it('the_marked_link_is_scrolled_into_view_on_first_draw_and_on_route_change', () => {
        const calls: string[] = [];
        const original = HTMLElement.prototype.scrollIntoView;
        HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
            calls.push(this.textContent!);
        };
        try {
            history.pushState({}, '', '/settings');
            mount(routed);
            history.pushState({}, '', '/settings/billing');
            window.dispatchEvent(new PopStateEvent('popstate'));
        } finally {
            HTMLElement.prototype.scrollIntoView = original;
        }
        expect(calls).toEqual(['Settings', 'Billing']);
    });

    it('links_stay_native_links_with_no_tab_roles_and_no_panels', () => {
        const nav = mount(links);

        expect(nav.shadowRoot!.querySelector('[role="tab"], [role="tablist"], [role="tabpanel"]')).toBeNull();
        expect(nav.querySelector('[role]')).toBeNull();
        nav.querySelectorAll('a').forEach((a) => expect(a.hasAttribute('tabindex')).toBe(false));
    });
});
