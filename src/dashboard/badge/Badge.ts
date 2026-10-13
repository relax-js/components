import { installStyles } from '../../foundations/styles';
import { formatting } from '../../foundations/formatting/formatting';
import { text, whenLanguageChanges } from '../../foundations/text/text';
import '../../foundations/icon/Icon';
import { readTone, toneIcon, type Tone } from '../../foundations/tone/tone';

const styles = /* css */ `
    r-badge {
        display: inline-block;
        padding: 0 var(--control-gap);
        border-radius: var(--radius-small);
        background: var(--tone-soft);
        color: var(--tone);
        font-size: 0.85em;
        line-height: 1.5;
        white-space: nowrap;
    }

    r-badge[hidden] {
        display: none;
    }
`;

/**
 * A short status or count that sits in the line. The element's own text is shown as given and
 * follows later changes to it; a badge without text is hidden. The badge carries its tone as
 * `data-tone`.
 *
 * @example
 * ```html
 * <r-badge tone="warn">Draft</r-badge>
 * ```
 *
 * @attr {string} tone - ok, info, warn, danger or muted (default)
 * @attr {number} count - A whole number shown in place of the text; 0 hides the badge
 * @attr {number} max - A count above it shows as this number followed by a plus
 */
export class Badge extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['tone', 'count', 'max'];
    }

    private readonly observer = new MutationObserver(() => this.update());

    connectedCallback(): void {
        installStyles(this, 'r-badge', styles);
        this.observer.observe(this, { childList: true, characterData: true, subtree: true });
        this.stopListening = whenLanguageChanges(this.redraw);
        this.update();
    }

    disconnectedCallback(): void {
        this.observer.disconnect();
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.update();
        }
    }

    private stopListening?: () => void;
    private readonly redraw = () => {
        if (this.isConnected) {
            this.update();
        }
    };

    private update(): void {
        const tone = readTone(this, 'muted');
        this.dataset.tone = tone;
        if (this.hasAttribute('count')) {
            this.drawCount(tone);
        }
        this.hidden = (this.textContent ?? '').trim() === '';
    }

    private drawCount(tone: Tone): void {
        // Rendering changes our own children; the observer must not take that for new text.
        this.observer.disconnect();
        this.replaceChildren();
        try {
            const count = this.getAttribute('count') ?? '';
            if (!/^\d+$/.test(count)) {
                throw new Error(`count "${count}" must be a whole number of zero or more`);
            }
            const max = this.getAttribute('max');
            if (max !== null && !/^[1-9]\d*$/.test(max)) {
                throw new Error(`max "${max}" must be a whole number above zero`);
            }
            const value = Number(count);
            if (value === 0) {
                return;
            }
            const { locale } = formatting();
            const format = (n: number) => new Intl.NumberFormat(locale).format(n);
            const shown =
                max !== null && value > Number(max) ? format(Number(max)) + text('plus') : format(value);
            if (tone !== 'muted') {
                const icon = document.createElement('r-icon');
                icon.setAttribute('name', toneIcon[tone]);
                this.append(icon, ' ');
            }
            this.append(shown);
        } catch (error) {
            this.replaceChildren();
            console.error(`r-badge: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.observer.observe(this, { childList: true, characterData: true, subtree: true });
        }
    }
}

if (!customElements.get('r-badge')) {
    customElements.define('r-badge', Badge);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-badge': Badge;
    }
}
