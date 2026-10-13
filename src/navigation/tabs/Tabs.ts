/**
 * Dispatched by `<r-tabs>` when a different tab becomes selected, by a click, the keyboard or
 * `select()`. Not dispatched when the `selected` attribute is changed directly.
 */
export class TabChangeEvent extends Event {
    static readonly type = 'r-tab-change';

    constructor(
        /** Zero-based index of the newly selected tab. */
        public readonly selectedIndex: number,
        /** The newly selected tab. */
        public readonly tab: Tab
    ) {
        super(TabChangeEvent.type, { bubbles: true });
    }
}

/**
 * One panel inside `<r-tabs>`. Its `label` attribute is the text of its tab header.
 *
 * @attr {string} label - Text of the tab header
 * @attr {boolean} selected - Set by `<r-tabs>` on the shown tab
 */
export class Tab extends HTMLElement {
    connectedCallback(): void {
        this.setAttribute('role', 'tabpanel');
    }

    /** Text of the tab header. */
    get label(): string {
        return this.getAttribute('label') ?? '';
    }
}

/**
 * Shows one `<r-tab>` at a time, with a bar of headers to switch between them.
 *
 * Headers follow the tabs: adding, removing or relabelling an `<r-tab>` updates the bar.
 * Arrow keys, Home and End move between headers, as in the WAI-ARIA tabs pattern.
 *
 * @example
 * ```html
 * <r-tabs selected="1">
 *     <r-tab label="Overview">...</r-tab>
 *     <r-tab label="Details">...</r-tab>
 * </r-tabs>
 * ```
 *
 * @attr {number} selected - Zero-based index of the shown tab, 0 when absent
 * @csspart tablist - The bar holding the headers
 * @csspart tab - Each header; `tab selected` on the selected one
 * @fires r-tab-change - {@link TabChangeEvent}
 */
export class Tabs extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['selected'];
    }

    private readonly tablist: HTMLElement;
    private shownTab: Tab | null = null;
    private readonly observer = new MutationObserver((records) => {
        const tabsChanged = records.some((record) =>
            record.type === 'childList' ? record.target === this : (record.target as Element).parentElement === this
        );
        if (tabsChanged) {
            this.drawHeaders();
        }
    });

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = /* html */ `
            <style>
                :host {
                    display: block;
                }

                [role='tablist'] {
                    display: flex;
                    gap: var(--control-gap);
                    border-bottom: 2px solid var(--bd-muted);
                }

                button {
                    font: inherit;
                    color: var(--text-muted);
                    background: none;
                    border: none;
                    border-radius: var(--control-radius) var(--control-radius) 0 0;
                    padding: var(--control-padding);
                    margin-bottom: -2px;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    transition: background var(--motion-fast) ease;

                    &:hover {
                        background: var(--surface-hover);
                    }

                    &:focus-visible {
                        outline: 2px solid var(--focus-ring);
                        outline-offset: -2px;
                    }

                    &[aria-selected='true'] {
                        color: var(--text-primary);
                        background: var(--surface-selected);
                        border-bottom-color: var(--accent-primary);
                    }
                }

                .panels {
                    padding-top: var(--content-gap);
                }

                @media (prefers-reduced-motion: reduce) {
                    button {
                        transition: none;
                    }
                }
            </style>
            <div role="tablist" part="tablist"></div>
            <div class="panels"><slot></slot></div>
        `;
        this.tablist = shadow.querySelector('[role="tablist"]')!;
        this.tablist.addEventListener('click', (event) => this.onHeaderClick(event));
        this.tablist.addEventListener('keydown', (event) => this.onHeaderKeyDown(event));
    }

    connectedCallback(): void {
        this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['label'] });
        this.drawHeaders();
    }

    disconnectedCallback(): void {
        this.observer.disconnect();
    }

    attributeChangedCallback(): void {
        this.showSelected();
    }

    /**
     * The `<r-tab>` children, in order. Matched by tag because they connect before they are
     * upgraded when the whole block is parsed at once.
     */
    get tabs(): Tab[] {
        return Array.from(this.children).filter((child): child is Tab => child.localName === 'r-tab');
    }

    /** Zero-based index of the shown tab, or -1 while the `selected` attribute is invalid. */
    get selectedIndex(): number {
        const value = this.getAttribute('selected');
        if (value === null) {
            return 0;
        }
        const index = Number(value);
        return Number.isInteger(index) && index >= 0 && index < this.tabs.length ? index : -1;
    }

    /** Shows the tab at `index` and dispatches a {@link TabChangeEvent} when it was not already shown. */
    select(index: number): void {
        const tab = this.tabs[index];
        if (!tab) {
            throw new RangeError(`r-tabs: there is no tab at index ${index}; there are ${this.tabs.length}.`);
        }
        if (index === this.selectedIndex) {
            return;
        }
        this.setAttribute('selected', String(index));
        this.dispatchEvent(new TabChangeEvent(index, tab));
    }

    private drawHeaders(): void {
        this.keepLastTabWhenShownTabIsRemoved();
        const headers = this.tabs.map((tab, index) => {
            const label = tab.getAttribute('label') ?? '';
            if (!label) {
                console.error(`r-tabs: tab ${index} has no label`);
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('role', 'tab');
            button.textContent = label;
            tab.setAttribute('aria-label', label);
            return button;
        });
        this.tablist.replaceChildren(...headers);
        this.showSelected();
    }

    /**
     * When the shown tab is removed and the selected index ends up past the end, the new last tab
     * is shown instead of none. No event: the selection was not changed by the user.
     */
    private keepLastTabWhenShownTabIsRemoved(): void {
        const tabs = this.tabs;
        if (this.shownTab && !tabs.includes(this.shownTab) && tabs.length > 0 && this.selectedIndex === -1) {
            const index = Number(this.getAttribute('selected'));
            if (Number.isInteger(index) && index >= tabs.length) {
                this.setAttribute('selected', String(tabs.length - 1));
            }
        }
    }

    private showSelected(): void {
        const selected = this.selectedIndex;
        this.shownTab = this.tabs[selected] ?? null;
        if (selected === -1 && this.isConnected && this.tabs.length > 0) {
            console.error(
                `r-tabs: selected="${this.getAttribute('selected')}" is not the index of one of its ${this.tabs.length} tabs`
            );
        }
        this.tabs.forEach((tab, index) => {
            tab.hidden = index !== selected;
            tab.toggleAttribute('selected', index === selected);
        });
        Array.from(this.tablist.children).forEach((button, index) => {
            const isSelected = index === selected;
            button.setAttribute('aria-selected', String(isSelected));
            button.setAttribute('tabindex', isSelected || (selected === -1 && index === 0) ? '0' : '-1');
            button.setAttribute('part', isSelected ? 'tab selected' : 'tab');
        });
    }

    private onHeaderClick(event: Event): void {
        const header = (event.target as Element).closest('[role="tab"]');
        if (header) {
            this.select(Array.from(this.tablist.children).indexOf(header));
        }
    }

    private onHeaderKeyDown(event: KeyboardEvent): void {
        const count = this.tabs.length;
        if (count === 0) {
            return;
        }
        const current = Math.max(this.selectedIndex, 0);
        const targets: Record<string, number> = {
            ArrowRight: (current + 1) % count,
            ArrowLeft: (current - 1 + count) % count,
            Home: 0,
            End: count - 1,
        };
        const next = targets[event.key];
        if (next === undefined) {
            return;
        }
        event.preventDefault();
        this.select(next);
        (this.tablist.children[next] as HTMLElement).focus();
    }
}

if (!customElements.get('r-tab')) {
    customElements.define('r-tab', Tab);
}
if (!customElements.get('r-tabs')) {
    customElements.define('r-tabs', Tabs);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-tabs': Tabs;
        'r-tab': Tab;
    }

    interface HTMLElementEventMap {
        [TabChangeEvent.type]: TabChangeEvent;
    }
}
