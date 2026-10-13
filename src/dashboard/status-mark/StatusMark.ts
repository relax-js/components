import { installStyles } from '../../foundations/styles';
import { readTone, toneIcon } from '../../foundations/tone/tone';
import '../../foundations/icon/Icon';

const styles = /* css */ `
    r-status-mark {
        display: inline-grid;
        grid-template-columns: auto auto;
        align-items: center;
        column-gap: var(--control-gap);
        color: var(--tone);

        r-icon {
            grid-row: 1;
            grid-column: 1;
        }

        .label {
            grid-row: 1;
            grid-column: 2;
        }

        .note {
            grid-row: 2;
            grid-column: 2;
            color: var(--text-muted);
        }
    }
`;

/**
 * Shows where something stands: the tone's icon, a label and an optional note under it. The
 * element's own text becomes the label when the mark is first drawn; the mark carries its
 * tone as `data-tone`.
 *
 * @example
 * ```html
 * <r-status-mark tone="ok" note="2025-09-20">Paid</r-status-mark>
 * ```
 *
 * @attr {string} tone - ok, info, warn, danger or muted (default)
 * @attr {string} note - A date or reason under the label
 */
export class StatusMark extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['tone', 'note'];
    }

    private label = '';
    private drawn = false;

    connectedCallback(): void {
        installStyles(this, 'r-status-mark', styles);
        if (this.drawn) {
            return;
        }
        this.label = (this.textContent ?? '').trim();
        this.drawn = true;
        this.draw();
    }

    attributeChangedCallback(): void {
        if (this.drawn) {
            this.draw();
        }
    }

    private draw(): void {
        const tone = readTone(this, 'muted');
        this.dataset.tone = tone;

        const icon = document.createElement('r-icon');
        icon.setAttribute('name', toneIcon[tone]);
        const parts: HTMLElement[] = [icon];

        if (this.label !== '') {
            const label = document.createElement('span');
            label.className = 'label';
            label.textContent = this.label;
            parts.push(label);
        }

        const note = this.getAttribute('note') ?? '';
        if (note !== '') {
            const element = document.createElement('span');
            element.className = 'note';
            element.textContent = note;
            parts.push(element);
        }
        this.replaceChildren(...parts);
    }
}

if (!customElements.get('r-status-mark')) {
    customElements.define('r-status-mark', StatusMark);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-status-mark': StatusMark;
    }
}
