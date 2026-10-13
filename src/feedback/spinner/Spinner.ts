import { text, whenLanguageChanges } from '../../foundations/text/text';

/**
 * Dims the content it wraps and shows a centered spinner while `loading` is set.
 *
 * Wrap the area that is waiting for data, not the whole page, so the rest stays usable.
 * The dimmed content cannot be clicked or focused while loading.
 *
 * @example
 * ```html
 * <r-spinner loading>
 *     <table>...</table>
 * </r-spinner>
 * ```
 *
 * @attr {boolean} loading - Shows the overlay while present
 * @slot - Content that is dimmed while loading
 * @slot spinner - Replaces the default ring
 * @csspart overlay - The dimming layer
 * @csspart ring - The default ring
 */
export class Spinner extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['loading'];
    }

    private readonly content: HTMLElement;
    private readonly announcement: HTMLElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = /* html */ `
            <style>
                :host {
                    display: block;
                    position: relative;
                }

                .announcement {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                    clip-path: inset(50%);
                    white-space: nowrap;
                }

                .overlay {
                    position: absolute;
                    inset: 0;
                    display: grid;
                    place-items: center;
                    background: var(--overlay-dim);
                    opacity: 0;
                    visibility: hidden;
                    transition:
                        opacity var(--motion-base) ease,
                        visibility var(--motion-base) ease;
                }

                :host([loading]) .overlay {
                    opacity: 1;
                    visibility: visible;
                }

                .ring {
                    width: var(--spinner-size, 2.5rem);
                    height: var(--spinner-size, 2.5rem);
                    box-sizing: border-box;
                    border: var(--spinner-thickness, 3px) solid var(--bd-muted);
                    border-top-color: var(--accent-primary);
                    border-radius: 50%;
                    animation: spin 800ms linear infinite;
                }

                ::slotted([slot='spinner']) {
                    animation: spin 800ms linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .overlay {
                        transition: none;
                    }
                }
            </style>
            <div class="announcement" role="status" aria-live="polite"></div>
            <div class="content"><slot></slot></div>
            <div class="overlay" part="overlay">
                <slot name="spinner"><div class="ring" part="ring"></div></slot>
            </div>
        `;
        this.content = shadow.querySelector('.content')!;
        this.announcement = shadow.querySelector('.announcement')!;
    }

    private stopListening?: () => void;

    connectedCallback(): void {
        this.reflectLoading();
        this.stopListening = whenLanguageChanges(() => this.reflectLoading());
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        this.reflectLoading();
    }

    /** Whether the overlay is shown. Mirrors the `loading` attribute. */
    get loading(): boolean {
        return this.hasAttribute('loading');
    }

    set loading(value: boolean) {
        this.toggleAttribute('loading', value);
    }

    private reflectLoading(): void {
        this.setAttribute('aria-busy', String(this.loading));
        this.content.toggleAttribute('inert', this.loading);
        // Text is only present while loading, so the live region announces when loading starts.
        this.announcement.textContent = this.loading ? text('loading') : '';
    }
}

if (!customElements.get('r-spinner')) {
    customElements.define('r-spinner', Spinner);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-spinner': Spinner;
    }
}
