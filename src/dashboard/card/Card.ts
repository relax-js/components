import { reportProblem } from '../../foundations/problems/problems';
import { installStyles } from '../../foundations/styles';
import '../../foundations/icon/Icon';
import { readTone, toneIcon, type Tone } from '../../foundations/tone/tone';

const styles = /* css */ `
    r-card {
        display: flex;
        flex-direction: column;
        gap: var(--card-gap);
        padding: var(--card-padding);
        border: var(--card-border);
        border-radius: var(--card-radius);
        box-shadow: none;
    }

    r-card[data-tone] {
        border-inline-start: 4px solid var(--tone);
    }

    /* The action and link drop under the heading when there is no room beside it. */
    r-card .card-head {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: var(--card-gap);
    }

    r-card .card-head hgroup {
        flex: 1 1 12rem;
        min-width: 0;
        overflow-wrap: break-word;
    }

    r-card .card-head :is(h1, h2, h3, h4, h5, h6),
    r-card .card-head p {
        margin: 0;
    }

    /* The level keeps the page outline right; the size stays the card's own. */
    r-card .card-head :is(h1, h2, h3, h4, h5, h6) {
        font-size: var(--card-heading-size);
    }

    r-card .card-head a {
        display: inline-flex;
        align-items: center;
        gap: var(--control-gap);
        white-space: nowrap;
    }
`;

/**
 * An overview card: a heading row with icon, heading, lead, an optional action and a link to the
 * full list, followed by the page's own content as the body. The heading row is placed before the
 * existing children and is rebuilt in place when an attribute changes. Every direct child with
 * `slot="action"` moves into the heading row, in order; a direct child with `slot="heading"`
 * becomes the heading in place of the `heading` text.
 *
 * @example
 * ```html
 * <r-card heading="Invoices" lead="Three are past due." icon="file" link-text="All invoices" href="/invoices">
 *     <select slot="action"></select>
 *     <ul></ul>
 * </r-card>
 * ```
 *
 * @slot heading - Markup for the heading, such as a span holding a badge; wins over `heading`
 * @slot action - Controls for the heading row, such as a count badge and a button
 * @attr {string} heading - The card's heading text
 * @attr {number} level - The heading element, 1 to 6 for h1 to h6 (default 2)
 * @attr {string} lead - One sentence under the heading
 * @attr {string} icon - An icon name shown in the heading row
 * @attr {string} link-text - Text of the link to the full list
 * @attr {string} href - Where the link goes
 * @attr {string} tone - ok, info, warn, danger or muted
 */
export class Card extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['heading', 'lead', 'icon', 'link-text', 'href', 'tone', 'level'];
    }

    connectedCallback(): void {
        installStyles(this, 'r-card', styles);
        this.render();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.render();
        }
    }

    private head(): HTMLElement | null {
        return this.querySelector<HTMLElement>(':scope > .card-head');
    }

    private render(): void {
        // An unknown tone is reported by readTone and leaves the card without a tone.
        const raw = this.getAttribute('tone');
        const known = raw !== null && Object.hasOwn(toneIcon, raw);
        if (raw !== null) {
            readTone(this, 'muted');
        }
        const tone = known ? (raw as Tone) : null;
        if (tone !== null) {
            this.dataset.tone = tone;
        } else {
            delete this.dataset.tone;
        }
        const previous = this.head();
        // Actions already moved into the heading row are kept; new direct children join them.
        const actions = [
            ...(previous?.querySelectorAll<HTMLElement>(':scope > [slot="action"]') ?? []),
            ...this.querySelectorAll<HTMLElement>(':scope > [slot="action"]'),
        ];
        const richHeading =
            this.querySelector<HTMLElement>(':scope > [slot="heading"]') ??
            previous?.querySelector<HTMLElement>(':scope > hgroup > :first-child > [slot="heading"]') ??
            null;
        previous?.remove();

        const heading = this.getAttribute('heading') ?? '';
        if (heading === '' && richHeading === null) {
            reportProblem('r-card', 'heading is missing');
            // Without a heading row an action has nowhere to go; it returns to the body.
            this.prepend(...actions);
            return;
        }

        const head = document.createElement('div');
        head.className = 'card-head';

        const icon = this.getAttribute('icon') ?? '';
        // A card's own icon wins; otherwise its tone's icon keeps the tone from being told by colour alone.
        if (icon !== '') {
            head.append(this.iconElement(icon));
        } else if (tone !== null) {
            head.append(this.iconElement(toneIcon[tone]));
        }

        const group = document.createElement('hgroup');
        const title = document.createElement(`h${this.level()}`);
        if (richHeading !== null) {
            title.append(richHeading);
        } else {
            title.textContent = heading;
        }
        group.append(title);
        const lead = this.getAttribute('lead') ?? '';
        if (lead !== '') {
            const paragraph = document.createElement('p');
            paragraph.textContent = lead;
            group.append(paragraph);
        }
        head.append(group, ...actions);

        const link = this.linkElement();
        if (link) {
            head.append(link);
        }
        this.prepend(head);
    }

    private level(): number {
        const raw = this.getAttribute('level');
        if (raw === null) {
            return 2;
        }
        if (!/^[1-6]$/.test(raw)) {
            reportProblem('r-card', `level "${raw}" must be a whole number from 1 to 6`);
            return 2;
        }
        return Number(raw);
    }

    private iconElement(name: string): HTMLElement {
        const icon = document.createElement('r-icon');
        icon.setAttribute('name', name);
        return icon;
    }

    private linkElement(): HTMLAnchorElement | null {
        const linkText = this.getAttribute('link-text') ?? '';
        if (linkText === '') {
            return null;
        }
        const href = this.getAttribute('href') ?? '';
        if (href === '') {
            reportProblem('r-card', 'link-text needs an href');
            return null;
        }
        const link = document.createElement('a');
        link.href = href;
        link.append(linkText, this.iconElement('arrow-right'));
        return link;
    }
}

if (!customElements.get('r-card')) {
    customElements.define('r-card', Card);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-card': Card;
    }
}
