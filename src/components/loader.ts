/**
 * A loader overlay component that dims wrapped content and displays a centered spinner.
 *
 * @example Basic usage with default spinner
 * ```html
 * <r-spinner loading>
 *   <div>Content to dim while loading</div>
 * </r-spinner>
 * ```
 *
 * @example Custom spinner image
 * ```html
 * <r-spinner loading>
 *   <img slot="spinner" src="spinner.gif" alt="" />
 *   <div>Content</div>
 * </r-spinner>
 * ```
 *
 * @example Styled via CSS custom properties
 * ```html
 * <style>
 *   r-spinner {
 *     --loader-overlay-color: rgba(255, 255, 255, 0.8);
 *     --loader-spinner-size: 64px;
 *     --loader-spinner-color: #e11d48;
 *     --loader-spinner-width: 6px;
 *     --loader-spin-duration: 600ms;
 *     --loader-transition-duration: 200ms;
 *   }
 * </style>
 * ```
 *
 * @attr {boolean} loading - When present, shows the overlay and spinner
 *
 * @csspart overlay - The dimming overlay element
 * @csspart spinner-container - Wrapper around the spinner (default or slotted)
 * @csspart default-spinner - The default CSS ring spinner
 *
 * @slot - Default slot for content to be wrapped
 * @slot spinner - Optional custom spinner element (replaces default)
 */
class RelaxSpinner extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['loading'];
  }

  private _shadow: ShadowRoot;

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._render();
  }

  /** Reflects the loading state. Controls overlay visibility. */
  get loading(): boolean {
    return this.hasAttribute('loading');
  }

  set loading(value: boolean) {
    if (value) {
      this.setAttribute('loading', '');
    } else {
      this.removeAttribute('loading');
    }
  }

  attributeChangedCallback(name: string, _oldValue: string | null, _newValue: string | null): void {
    if (name === 'loading') {
      this._updateAriaState();
    }
  }

  connectedCallback(): void {
    this._updateAriaState();
    this._observeSpinnerSlot();
  }

  private _updateAriaState(): void {
    // Communicate loading state to assistive technologies
    this.setAttribute('aria-busy', String(this.loading));
  }

  private _observeSpinnerSlot(): void {
    const spinnerSlot = this._shadow.querySelector<HTMLSlotElement>('slot[name="spinner"]');
    if (!spinnerSlot) return;

    const updateVisibility = (): void => {
      const hasCustomSpinner = spinnerSlot.assignedElements().length > 0;
      const defaultSpinner = this._shadow.querySelector<HTMLElement>('.default-spinner');
      if (defaultSpinner) {
        defaultSpinner.style.display = hasCustomSpinner ? 'none' : 'block';
      }
    };

    // Toggle default spinner visibility based on whether custom spinner is slotted
    spinnerSlot.addEventListener('slotchange', updateVisibility);
    // Run once on init for pre-slotted content
    updateVisibility();
  }

  private _render(): void {
    this._shadow.innerHTML = /* html */ `
      <style>
        :host {
          display: block;
          position: relative;

          &([loading]) .overlay {
            opacity: 1;
            visibility: visible;
          }
        }

        .overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--loader-overlay-color, rgba(0, 0, 0, 0.5));
          opacity: 0;
          visibility: hidden;
          transition:
            opacity var(--loader-transition-duration, 300ms) ease,
            visibility var(--loader-transition-duration, 300ms) ease;
          z-index: 1000;
        }

        .spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .default-spinner {
          width: var(--loader-spinner-size, 48px);
          height: var(--loader-spinner-size, 48px);
          border: var(--loader-spinner-width, 4px) solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--loader-spinner-color, #3b82f6);
          border-radius: 50%;
          animation: spin var(--loader-spin-duration, 800ms) linear infinite;
        }

        ::slotted([slot="spinner"]) {
          animation: spin var(--loader-spin-duration, 800ms) linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>

      <slot></slot>

      <div class="overlay" part="overlay">
        <div class="spinner-container" part="spinner-container">
          <slot name="spinner"></slot>
          <div class="default-spinner" part="default-spinner"></div>
        </div>
      </div>
    `;
  }
}

// Register once to avoid duplicate registration errors in HMR scenarios
if (!customElements.get('r-spinner')) {
  customElements.define('r-spinner', RelaxSpinner);
}

export { RelaxSpinner };

// Extend HTMLElementTagNameMap for type-safe querySelector
declare global {
  interface HTMLElementTagNameMap {
    'r-spinner': RelaxSpinner;
  }
}
