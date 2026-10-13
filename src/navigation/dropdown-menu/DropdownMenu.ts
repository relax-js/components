import { reportProblem } from '../../foundations/problems/problems';
import '../../foundations/icon/Icon';
import { MenuSelectedEvent, type MenuItem } from '../top-menu/TopMenu';
import { panelPosition } from './panelPosition';

/** The menus whose panel is showing; opening one closes the others. */
const openMenus = new Set<DropdownMenu>();

/**
 * A button that opens a short panel lying over the content, closed again by clicking
 * outside, pressing Escape, opening another dropdown menu or navigating to another route.
 *
 * @example
 * ```html
 * <r-dropdown-menu label="Account" icon="user"></r-dropdown-menu>
 * ```
 *
 * @attr {string} label - The trigger's text, and its accessible name when `icon-only`
 * @attr {string} icon - Name of an `r-icon` shown before the label
 * @attr {boolean} icon-only - Shows only the icon in the trigger
 * @attr {boolean} open - Reflected while the panel shows
 * @csspart trigger - The trigger button
 * @csspart panel - The floating panel
 * @csspart item - Each item button or link
 * @fires r-menu-selected - {@link MenuSelectedEvent}
 */
export class DropdownMenu extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['label', 'icon', 'icon-only'];
    }

    private readonly styles: HTMLStyleElement;
    private readonly trigger: HTMLButtonElement;
    private readonly panel: HTMLElement;
    private isOpen = false;
    private menuItems: MenuItem[] = [];

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        this.styles = document.createElement('style');
        this.styles.textContent = /* css */ `
            :host {
                display: inline-block;
            }

            button {
                display: inline-flex;
                align-items: center;
                gap: var(--control-gap);
                font: inherit;
                color: inherit;
                background: none;
                border: none;
                border-radius: var(--control-radius);
                padding: var(--control-padding);
                cursor: pointer;

                &:hover {
                    background: var(--surface-hover);
                }

                &:focus-visible {
                    outline: 2px solid var(--focus-ring);
                }
            }

            .panel {
                position: fixed;
                inset: auto;
                margin: 0;
                box-sizing: border-box;
                /* As wide as its longest item, but never wider than a phone's window; a long item wraps instead. */
                width: max-content;
                max-width: calc(100vw - 16px);
                background: var(--surface-raised);
                color: var(--text-primary);
                border: 1px solid var(--bd-muted);
                border-radius: var(--floating-radius);
                padding: var(--floating-padding);
                box-shadow: var(--floating-shadow);
            }

            /* One item per line, the whole width of the panel. */
            .panel [role='menuitem'] {
                display: flex;
                width: 100%;
                box-sizing: border-box;
                text-align: start;
                color: inherit;
                text-decoration: none;
            }
        `;

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.setAttribute('part', 'trigger');
        this.trigger.setAttribute('aria-haspopup', 'menu');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.addEventListener('click', () => this.toggle());

        this.panel = document.createElement('div');
        this.panel.className = 'panel';
        this.panel.setAttribute('part', 'panel');
        this.panel.setAttribute('role', 'menu');
        this.panel.setAttribute('popover', 'manual');

        shadow.append(this.styles);
        this.addEventListener('keydown', (event) => {
            this.onKeyDown(event);
        });
    }

    private menuItemElements(): HTMLElement[] {
        return Array.from(this.panel.querySelectorAll<HTMLElement>('[role=menuitem]'));
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (!this.isOpen) {
            const first = event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown';
            if (first || event.key === 'ArrowUp') {
                event.preventDefault();
                this.show();
                const items = this.menuItemElements();
                (first ? items[0] : items[items.length - 1])?.focus();
            }
            return;
        }

        const items = this.menuItemElements();
        const current = items.indexOf(this.shadowRoot!.activeElement as HTMLElement);
        switch (event.key) {
            case 'Escape':
                this.close();
                this.trigger.focus();
                break;
            case 'Tab':
                // Focus the trigger first so the browser moves on from there, past the hidden panel.
                this.close();
                this.trigger.focus();
                break;
            case 'ArrowDown':
                event.preventDefault();
                items[(current + 1) % items.length]?.focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                items[current <= 0 ? items.length - 1 : current - 1]?.focus();
                break;
            case 'Home':
                event.preventDefault();
                items[0]?.focus();
                break;
            case 'End':
                event.preventDefault();
                items[items.length - 1]?.focus();
                break;
        }
    }

    private readonly closeOnOutsideClick = (event: Event) => {
        if (!event.composedPath().includes(this)) {
            this.close();
        }
    };

    private readonly closeOnRouteChange = () => this.close();

    connectedCallback(): void {
        this.render();
    }

    disconnectedCallback(): void {
        this.close();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.render();
        }
    }

    /** The menu's items, in the same shape as the top menu's. Items with children are left out. */
    get items(): MenuItem[] {
        return this.menuItems;
    }

    set items(items: MenuItem[]) {
        this.menuItems = items;
        if (this.isConnected) {
            this.render();
        }
    }

    private createItem(item: MenuItem): HTMLElement {
        const control = item.href ? document.createElement('a') : document.createElement('button');
        if (control instanceof HTMLAnchorElement) {
            control.href = item.href!;
        } else {
            control.type = 'button';
        }
        control.setAttribute('part', 'item');
        control.setAttribute('role', 'menuitem');
        control.textContent = item.title;
        control.addEventListener('click', () => {
            this.dispatchEvent(new MenuSelectedEvent(item));
            this.close();
        });
        return control;
    }

    /** Whether the panel shows. */
    get open(): boolean {
        return this.isOpen;
    }

    /** Opens the panel below the trigger and closes any other open dropdown menu. */
    show(): void {
        if (this.isOpen || !this.trigger.isConnected) {
            return;
        }
        for (const other of Array.from(openMenus)) {
            other.close();
        }
        this.isOpen = true;
        openMenus.add(this);
        this.setAttribute('open', '');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.panel.showPopover();
        this.place();
        document.addEventListener('click', this.closeOnOutsideClick);
        document.addEventListener('rlx.navigateRoute', this.closeOnRouteChange);
    }

    /** Closes the panel. */
    close(): void {
        if (!this.isOpen) {
            return;
        }
        this.isOpen = false;
        openMenus.delete(this);
        this.removeAttribute('open');
        this.trigger.setAttribute('aria-expanded', 'false');
        if (this.panel.isConnected) {
            this.panel.hidePopover();
        }
        document.removeEventListener('click', this.closeOnOutsideClick);
        document.removeEventListener('rlx.navigateRoute', this.closeOnRouteChange);
    }

    private toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.show();
        }
    }

    private render(): void {
        const label = this.getAttribute('label');
        if (!label) {
            reportProblem('r-dropdown-menu', 'the label attribute is missing or empty');
            this.close();
            this.shadowRoot!.replaceChildren();
            return;
        }

        const iconName = this.getAttribute('icon');
        const iconOnly = this.hasAttribute('icon-only') && iconName !== null;
        const children: (Node | string)[] = [];
        if (iconName) {
            const icon = document.createElement('r-icon');
            icon.setAttribute('name', iconName);
            children.push(icon);
        }
        if (iconOnly) {
            this.trigger.setAttribute('aria-label', label);
        } else {
            this.trigger.removeAttribute('aria-label');
            children.push(label);
        }
        this.trigger.replaceChildren(...children);

        const entries = this.menuItems.filter((item) => {
            if (item.children) {
                reportProblem('r-dropdown-menu', `item "${item.name}" has children, but submenus are not supported`);
                return false;
            }
            return true;
        });
        this.panel.replaceChildren(...entries.map((item) => this.createItem(item)));
        this.trigger.disabled = entries.length === 0;
        if (!this.trigger.isConnected) {
            this.shadowRoot!.replaceChildren(this.styles,this.trigger, this.panel);
        }
    }

    /** Places the panel below the trigger at its start edge. */
    private place(): void {
        const rtl = getComputedStyle(this).direction === 'rtl';
        const { top, left } = panelPosition(this.trigger.getBoundingClientRect(), this.panel.getBoundingClientRect(), rtl);
        this.panel.style.top = `${top}px`;
        this.panel.style.left = `${left}px`;
    }
}

if (!customElements.get('r-dropdown-menu')) {
    customElements.define('r-dropdown-menu', DropdownMenu);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-dropdown-menu': DropdownMenu;
    }
}
