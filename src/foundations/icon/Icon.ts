import { reportProblem } from '../problems/problems';
import { installStyles } from '../styles';
import { defaultIcons } from './icons';

export { defaultIcons } from './icons';

// The SVG fills the element, so sizing `r-icon` sizes the shape; the element defaults to one em.
const styles = /* css */ `
    r-icon {
        display: inline-block;
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        vertical-align: -0.125em;

        > svg {
            display: block;
            width: 100%;
            height: 100%;
        }
    }

    r-icon[hidden] {
        display: none;
    }
`;

const shapes = new Map<string, string>(Object.entries(defaultIcons));
const svgNamespace = 'http://www.w3.org/2000/svg';
const connectedIcons = new Set<Icon>();

/**
 * Adds icon shapes by name, each the SVG content of one icon on a 24-unit grid. Every
 * `r-icon` can use them from then on; registering an existing name replaces its shape.
 *
 * @example
 * registerIcons({ receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/>' });
 */
export function registerIcons(icons: Record<string, string>): void {
    for (const [name, shape] of Object.entries(icons)) {
        shapes.set(name, shape);
    }
    for (const icon of connectedIcons) {
        if (isNamedIn(icon, icons)) {
            icon.redraw();
        }
    }
}

function isNamedIn(icon: Icon, icons: Record<string, string>): boolean {
    const name = icon.getAttribute('name');
    return name !== null && Object.prototype.hasOwnProperty.call(icons, name);
}

/**
 * A small line icon drawn as inline SVG, sized by the font and stroked in the text's colour.
 * It is decoration beside text that carries the meaning, so it is hidden from assistive
 * technology.
 *
 * @example
 * ```html
 * <r-icon name="check-circle"></r-icon> Paid
 * ```
 *
 * @attr {string} name - The registered shape to draw
 */
export class Icon extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['name'];
    }

    private missingNameCheckQueued = false;

    connectedCallback(): void {
        installStyles(this, 'r-icon', styles);
        this.setAttribute('aria-hidden', 'true');
        connectedIcons.add(this);
        this.draw();
    }

    disconnectedCallback(): void {
        connectedIcons.delete(this);
    }

    /** Draws again with the shape currently registered for the name. */
    redraw(): void {
        this.draw();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        const name = this.getAttribute('name') ?? '';
        if (name.includes('{{')) {
            return;
        }
        if (name === '') {
            this.replaceChildren();
            this.reportMissingNameLater();
            return;
        }
        const shape = shapes.get(name);
        if (shape === undefined) {
            reportProblem('r-icon', `no icon is registered as "${name}"`);
            this.replaceChildren();
            return;
        }
        const svg = document.createElementNS(svgNamespace, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.75');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.innerHTML = shape;
        this.replaceChildren(svg);
    }

    // Code that creates an icon usually puts it on the page before naming it, so a missing name is
    // reported only if the icon is still connected without one once that code has finished.
    private reportMissingNameLater(): void {
        if (this.missingNameCheckQueued) {
            return;
        }
        this.missingNameCheckQueued = true;
        queueMicrotask(() => {
            this.missingNameCheckQueued = false;
            if (this.isConnected && (this.getAttribute('name') ?? '') === '') {
                reportProblem('r-icon', 'the name attribute is missing or empty');
            }
        });
    }
}

if (!customElements.get('r-icon')) {
    customElements.define('r-icon', Icon);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-icon': Icon;
    }
}
