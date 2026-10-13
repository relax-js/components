import { reportProblem } from '../../foundations/problems/problems';
import type { MenuItem } from '../top-menu/TopMenu';

/**
 * A titled list of links at the side of the page. The link for the current route is marked
 * with `aria-current="page"`, and the list scrolls inside the menu when it is taller than the menu.
 *
 * @example
 * ```typescript
 * const menu = document.querySelector('r-side-menu')!;
 * menu.items = [
 *     { name: 'profile', title: 'Profile', href: '/settings/profile' },
 *     { name: 'billing', title: 'Billing', href: '/settings/billing' },
 * ];
 * ```
 *
 * @attr {string} title - Heading of the menu and accessible name of its navigation landmark
 * @csspart title - The heading
 * @csspart item - Each link
 */
export class SideMenu extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['title'];
    }

    private menuItems: MenuItem[] = [];
    private readonly heading: HTMLElement;
    private readonly nav: HTMLElement;
    private readonly list: HTMLUListElement;
    private stopListening?: () => void;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = /* html */ `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    height: 100%;
                    min-height: 0;
                    background: var(--surface-raised);
                    color: var(--text-primary);
                    padding: var(--panel-padding);
                    box-shadow: none;
                    border-radius: 0;
                }

                nav {
                    display: flex;
                    flex-direction: column;
                    gap: var(--panel-gap);
                    min-height: 0;
                    flex: 1;
                }

                h2 {
                    margin: 0;
                    font: inherit;
                    font-weight: 600;
                }

                ul {
                    display: flex;
                    flex-direction: column;
                    gap: var(--panel-gap);
                    min-height: 0;
                    flex: 1;
                    overflow-y: auto;
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }

                [part='group'] {
                    display: block;
                    font-weight: 600;
                    padding: var(--control-padding);
                }

                li ul {
                    overflow: visible;
                    flex: none;
                }

                a {
                    display: block;
                    color: inherit;
                    text-decoration: none;
                    border-radius: var(--control-radius);
                    padding: var(--control-padding);

                    &:hover {
                        background: var(--surface-hover);
                    }

                    &[aria-current='page'] {
                        background: var(--surface-selected);
                    }

                    &:focus-visible {
                        outline: 2px solid var(--focus-ring);
                    }
                }
            </style>
            <nav>
                <h2 id="title" part="title" hidden></h2>
                <ul></ul>
            </nav>
        `;
        this.nav = shadow.querySelector('nav')!;
        this.heading = shadow.querySelector('h2')!;
        this.list = shadow.querySelector('ul')!;
    }

    private readonly followRoute = () => {
        this.markCurrent();
        this.scrollCurrentIntoView();
    };

    // A client-side navigation changes the address after the click has bubbled through the menu.
    private readonly followClick = () => setTimeout(this.followRoute, 0);

    connectedCallback(): void {
        window.addEventListener('popstate', this.followRoute);
        this.addEventListener('click', this.followClick);
        const navigation = (window as { navigation?: EventTarget }).navigation;
        navigation?.addEventListener('currententrychange', this.followRoute);
        this.stopListening = () => {
            window.removeEventListener('popstate', this.followRoute);
            this.removeEventListener('click', this.followClick);
            navigation?.removeEventListener('currententrychange', this.followRoute);
        };
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    /** The menu's links. Setting them redraws the menu. */
    get items(): MenuItem[] {
        return this.menuItems;
    }

    set items(items: MenuItem[]) {
        this.menuItems = items;
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        const title = this.getAttribute('title');
        if (title) {
            this.heading.textContent = title;
            this.heading.hidden = false;
            this.nav.setAttribute('aria-labelledby', 'title');
        } else {
            reportProblem('r-side-menu', 'the title attribute is missing');
            this.heading.hidden = true;
            this.nav.removeAttribute('aria-labelledby');
        }

        this.list.replaceChildren(...this.menuItems.map((item) => this.createLink(item)));
        this.markCurrent();
        this.scrollCurrentIntoView();
    }

    // Groups are always open; only one level of grouping is supported.
    private createGroup(item: MenuItem): HTMLLIElement {
        const heading = document.createElement('span');
        heading.setAttribute('part', 'group');
        heading.textContent = item.title;
        const sub = document.createElement('ul');
        for (const child of item.children ?? []) {
            if (child.children?.length) {
                reportProblem('r-side-menu', `"${child.title}" is nested too deep, only one level of groups is supported`);
                continue;
            }
            sub.append(this.createLink(child));
        }
        const li = document.createElement('li');
        li.append(heading, sub);
        return li;
    }

    private createLink(item: MenuItem): HTMLLIElement {
        if (item.children?.length) {
            return this.createGroup(item);
        }
        const link = document.createElement('a');
        link.setAttribute('part', 'item');
        if (item.href !== undefined) {
            link.href = item.href;
        }
        link.textContent = item.title;
        const li = document.createElement('li');
        li.append(link);
        return li;
    }

    // The link whose path is the current path or an ancestor of it, by whole segments, wins by depth.
    private markCurrent(): void {
        const current = segmentsOf(window.location.href);
        let best: HTMLAnchorElement | undefined;
        let bestDepth = -1;
        for (const link of this.links()) {
            const own = link.hasAttribute('href') ? segmentsOf(link.href) : undefined;
            link.removeAttribute('aria-current');
            if (own && own.length > bestDepth && own.every((segment, i) => current[i] === segment)) {
                best = link;
                bestDepth = own.length;
            }
        }
        best?.setAttribute('aria-current', 'page');
    }

    private scrollCurrentIntoView(): void {
        this.list.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' });
    }

    private links(): HTMLAnchorElement[] {
        return Array.from(this.list.querySelectorAll('a'));
    }
}

function segmentsOf(href: string): string[] {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
        return ['\0'];
    }
    return url.pathname.split('/').filter((segment) => segment !== '');
}

if (!customElements.get('r-side-menu')) {
    customElements.define('r-side-menu', SideMenu);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-side-menu': SideMenu;
    }
}
