/**
 * A row of links to the sections of one area. The links are the element's own `<a href>`
 * children: they are slotted, never copied, so they stay native links in the tab order and
 * a router still handles them. Adding, removing or relabelling a link needs no redraw.
 *
 * @example
 * ```html
 * <r-section-nav label="Settings">
 *     <a href="/settings/profile">Profile</a>
 *     <a href="/settings/billing">Billing</a>
 * </r-section-nav>
 * ```
 *
 * @attr {string} label - Accessible name of the navigation landmark
 * @csspart nav - The navigation landmark holding the links
 */
export class SectionNav extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['label'];
    }

    private readonly landmark: HTMLElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = /* html */ `
            <style>
                :host {
                    display: block;
                }
                nav {
                    display: flex;
                    flex-direction: row;
                    gap: var(--r-space-2, 0.5rem);
                    overflow-x: auto;
                }
                ::slotted(a) {
                    flex: none;
                    white-space: nowrap;
                }
                ::slotted(a[aria-current='page']) {
                    background: var(--surface-selected);
                }
            </style>
            <nav part="nav"><slot></slot></nav>`;
        this.landmark = shadow.querySelector('nav')!;
        shadow.querySelector('slot')!.addEventListener('slotchange', () => this.followRoute());
    }

    private readonly followRoute = () => {
        this.markCurrent();
        this.scrollCurrentIntoView();
    };

    // A client-side navigation changes the address after the click has bubbled through the nav.
    private readonly followClick = () => setTimeout(this.followRoute, 0);

    private stopListening?: () => void;

    connectedCallback(): void {
        this.applyLabel();
        window.addEventListener('popstate', this.followRoute);
        this.addEventListener('click', this.followClick);
        const navigation = (window as { navigation?: EventTarget }).navigation;
        navigation?.addEventListener('currententrychange', this.followRoute);
        this.stopListening = () => {
            window.removeEventListener('popstate', this.followRoute);
            this.removeEventListener('click', this.followClick);
            navigation?.removeEventListener('currententrychange', this.followRoute);
        };
        this.followRoute();
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    // The link whose path is the current path or an ancestor of it, by whole segments, wins by depth.
    // Query and hash are not part of the path, so they never take part.
    private markCurrent(): void {
        const current = segmentsOf(window.location.href);
        let best: HTMLAnchorElement | undefined;
        let bestDepth = -1;
        for (const link of this.querySelectorAll('a')) {
            link.removeAttribute('aria-current');
            const own = link.hasAttribute('href') ? segmentsOf(link.href) : undefined;
            if (own && own.length > bestDepth && own.every((segment, i) => current[i] === segment)) {
                best = link;
                bestDepth = own.length;
            }
        }
        best?.setAttribute('aria-current', 'page');
    }

    private scrollCurrentIntoView(): void {
        this.querySelector<HTMLElement>('a[aria-current="page"]')?.scrollIntoView?.({
            block: 'nearest',
            inline: 'nearest',
        });
    }

    attributeChangedCallback(): void {
        this.applyLabel();
    }

    private applyLabel(): void {
        const label = this.getAttribute('label');
        if (label) {
            this.landmark.setAttribute('aria-label', label);
        } else {
            this.landmark.removeAttribute('aria-label');
        }
    }
}

function segmentsOf(href: string): string[] {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
        return ['\0'];
    }
    return url.pathname.split('/').filter((segment) => segment !== '');
}

declare global {
    interface HTMLElementTagNameMap {
        'r-section-nav': SectionNav;
    }
}

if (!customElements.get('r-section-nav')) {
    customElements.define('r-section-nav', SectionNav);
}
