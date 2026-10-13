import { installStyles } from '../../foundations/styles';
import '../../foundations/icon/Icon';
import { text, whenLanguageChanges } from '../../foundations/text/text';
import { readTone, toneIcon } from '../../foundations/tone/tone';

const styles = /* css */ `
    r-banner {
        display: block;
        padding: var(--panel-padding);
        border: 1px solid var(--tone);
        background: var(--tone-soft);
        box-shadow: none;

        > r-icon.banner-icon {
            vertical-align: middle;
            margin-inline-end: var(--panel-gap);
        }

        > [slot="action"] {
            margin-inline-start: var(--panel-gap);
        }
    }

    r-banner > button.banner-close {
        float: inline-end;
        border: 0;
        background: none;
        color: inherit;
        cursor: pointer;
        font: inherit;
    }

    r-banner[hidden] {
        display: none;
    }
`;

/**
 * A notice about the whole page, drawn as a strip: the tone's icon, then the page's own children
 * as the message, then an optional action. The message is left as the page wrote it, so it may
 * hold a link. The banner carries its tone as `data-tone` and announces itself as an alert for
 * `warn` and `danger`, and as a status otherwise.
 *
 * @example
 * ```html
 * <r-banner tone="warn">Maintenance tonight at 22:00. <a slot="action" href="/status">Details</a></r-banner>
 * ```
 *
 * @attr {string} tone - ok, info, warn, danger or muted (default)
 * @attr {boolean} dismissible - Shows a close button that hides the banner and fires `r-banner-dismiss`
 * @slot action - A direct child with this slot is moved to the end of the strip
 */
export class Banner extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['tone', 'dismissible'];
    }

    private stopListening?: () => void;

    connectedCallback(): void {
        installStyles(this, 'r-banner', styles);
        this.render();
        this.stopListening = whenLanguageChanges(() => this.render());
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.render();
        }
    }

    private render(): void {
        const tone = readTone(this, 'muted');
        this.dataset.tone = tone;
        this.setAttribute('role', tone === 'warn' || tone === 'danger' ? 'alert' : 'status');

        // Redrawing reuses the icon already there, so a moved banner never gains a second one.
        let icon = this.querySelector<HTMLElement>(':scope > r-icon.banner-icon');
        if (icon === null) {
            icon = document.createElement('r-icon');
            icon.className = 'banner-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.setAttribute('name', toneIcon[tone]);
            this.prepend(icon);
        }
        icon.setAttribute('name', toneIcon[tone]);

        const actions = this.querySelectorAll<HTMLElement>(':scope > [slot="action"]');
        this.append(...actions);

        let close = this.querySelector<HTMLButtonElement>(':scope > button.banner-close');
        if (!this.hasAttribute('dismissible')) {
            close?.remove();
            return;
        }
        if (close === null) {
            close = document.createElement('button');
            close.type = 'button';
            close.className = 'banner-close';
            close.textContent = '×';
            close.addEventListener('click', () => this.dismiss());
        }
        close.setAttribute('aria-label', text('close'));
        this.append(close);
    }

    // Nothing is stored: a fresh page load shows the banner again.
    private dismiss(): void {
        this.hidden = true;
        this.dispatchEvent(new CustomEvent('r-banner-dismiss', { bubbles: true }));
    }
}

if (!customElements.get('r-banner')) {
    customElements.define('r-banner', Banner);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-banner': Banner;
    }
}
