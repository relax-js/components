import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TabsContainer, TabItem } from '../../../src/components/panels/tabs';

describe('Tabs Component', () => {
    let container: HTMLElement;

    function simulateClick(element: Element) {
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(clickEvent);
    }

    beforeEach(() => {
        if (!customElements.get('r-tabs')) {
            customElements.define('r-tabs', TabsContainer);
        }
        if (!customElements.get('r-tab')) {
            customElements.define('r-tab', TabItem);
        }

        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    it('should render tabs with correct structure', () => {
        container.innerHTML = `
      <r-tabs>
        <r-tab label="First Tab">Content 1</r-tab>
        <r-tab label="Second Tab">Content 2</r-tab>
      </r-tabs>
    `;

        const tabsElement = container.querySelector('r-tabs');
        const shadowRoot = tabsElement?.shadowRoot;

        expect(tabsElement).not.toBeNull();
        expect(shadowRoot).not.toBeNull();

        const menuItems = shadowRoot?.querySelectorAll('menu li');
        expect(menuItems?.length).toBe(2);
        expect(menuItems?.[0].textContent).toBe('First Tab');
        expect(menuItems?.[1].textContent).toBe('Second Tab');
    });

    it('should select the first tab by default', () => {
        container.innerHTML = `
      <r-tabs>
        <r-tab label="First Tab">Content 1</r-tab>
        <r-tab label="Second Tab">Content 2</r-tab>
      </r-tabs>
    `;

        const tabsElement = container.querySelector('r-tabs');
        const tabs = tabsElement?.querySelectorAll('r-tab');

        expect(tabs?.[0].hasAttribute('selected')).toBe(true);
        expect(tabs?.[1].hasAttribute('selected')).toBe(false);

        const menuItems = tabsElement?.shadowRoot?.querySelectorAll('menu li');
        expect(menuItems?.[0].classList.contains('selected')).toBe(true);
        expect(menuItems?.[1].classList.contains('selected')).toBe(false);
    });

    it('should change selected tab when menu item is clicked', () => {
        container.innerHTML = `
      <r-tabs>
        <r-tab label="First Tab">Content 1</r-tab>
        <r-tab label="Second Tab">Content 2</r-tab>
      </r-tabs>
    `;

        const tabsElement = container.querySelector('r-tabs');
        const shadowRoot = tabsElement?.shadowRoot;
        const menuItems = shadowRoot?.querySelectorAll('menu li');

        // Simulate a click on the second tab
        if (menuItems?.[1]) {
            simulateClick(menuItems[1]);
        }

        const tabs = tabsElement?.querySelectorAll('r-tab');
        expect(tabs?.[0].hasAttribute('selected')).toBe(false);
        expect(tabs?.[1].hasAttribute('selected')).toBe(true);

        // Check menu items after click
        expect(menuItems?.[0].classList.contains('selected')).toBe(false);
        expect(menuItems?.[1].classList.contains('selected')).toBe(true);
    });

    it('should dispatch tab-change event when tab is changed', () => {
        container.innerHTML = `
      <r-tabs>
        <r-tab label="First Tab">Content 1</r-tab>
        <r-tab label="Second Tab">Content 2</r-tab>
      </r-tabs>
    `;

        const tabsElement = container.querySelector('r-tabs');
        const eventSpy = vi.fn();
        tabsElement?.addEventListener('tab-change', eventSpy);

        const shadowRoot = tabsElement?.shadowRoot;
        const menuItems = shadowRoot?.querySelectorAll('menu li');

        // Simulate a click on the second tab
        if (menuItems?.[1]) {
            simulateClick(menuItems[1]);
        }

        expect(eventSpy).toHaveBeenCalledTimes(1);
        expect(eventSpy.mock.calls[0][0].detail).toEqual({ selectedIndex: 1 });
    });

    it('should change selected tab when selected attribute is set', () => {
        container.innerHTML = `
      <r-tabs>
        <r-tab label="First Tab">Content 1</r-tab>
        <r-tab label="Second Tab">Content 2</r-tab>
      </r-tabs>
    `;

        const tabsElement = container.querySelector('r-tabs');
        tabsElement?.setAttribute('selected', '1');

        const tabs = tabsElement?.querySelectorAll('r-tab');
        expect(tabs?.[0].hasAttribute('selected')).toBe(false);
        expect(tabs?.[1].hasAttribute('selected')).toBe(true);

        const menuItems = tabsElement?.shadowRoot?.querySelectorAll('menu li');
        expect(menuItems?.[0].classList.contains('selected')).toBe(false);
        expect(menuItems?.[1].classList.contains('selected')).toBe(true);
    });

    it('should update tabs when content changes', () => {
        container.innerHTML = `
      <r-tabs>
        <r-tab label="First Tab">Content 1</r-tab>
      </r-tabs>
    `;

        const tabsElement = container.querySelector('r-tabs');
        const shadowRoot = tabsElement?.shadowRoot;

        let menuItems = shadowRoot?.querySelectorAll('menu li');
        expect(menuItems?.length).toBe(1);

        // Add a new tab
        const newTab = document.createElement('r-tab');
        newTab.setAttribute('label', 'Second Tab');
        newTab.textContent = 'Content 2';
        tabsElement?.appendChild(newTab);

        // Need to manually trigger updateTabs since MutationObserver is not automatically
        // triggered in jsdom
        (tabsElement as any).updateTabs();

        // Check if the new tab was added to the menu
        menuItems = shadowRoot?.querySelectorAll('menu li');
        expect(menuItems?.length).toBe(2);
        expect(menuItems?.[1].textContent).toBe('Second Tab');
    });

    it('should render TabItem with shadow DOM and content', () => {
        container.innerHTML = `<r-tab label="Test Tab">Test Content</r-tab>`;

        const tabElement = container.querySelector('r-tab');
        const shadowRoot = tabElement?.shadowRoot;

        expect(tabElement).not.toBeNull();
        expect(shadowRoot).not.toBeNull();

        const slotElement = shadowRoot?.querySelector('slot');
        expect(slotElement).not.toBeNull();

        // Check if the content is properly set
        expect(tabElement?.textContent?.trim()).toBe('Test Content');
    });
});
