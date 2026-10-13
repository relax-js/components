import { reportProblem } from '../../foundations/problems/problems';
import '../../foundations/icon/Icon';
import { text, whenLanguageChanges } from '../../foundations/text/text';

/**
 * One entry in `<r-top-menu>`.
 *
 * An item with `children` opens a submenu instead of being selected. An item with `href`
 * renders as a link, so the browser (or the Relaxjs router) navigates without any listener.
 */
export interface MenuItem {
    /** Identifies the item in {@link MenuSelectedEvent}. Unique within the menu. */
    name: string;
    /** Text shown in the menu. */
    title: string;
    /** Renders the item as a link to this URL. */
    href?: string;
    /** Items of the submenu this item opens. */
    children?: MenuItem[];
}

/**
 * Dispatched by `<r-top-menu>` when an item without children is chosen. Also dispatched for
 * link items, before the browser follows the link.
 */
export class MenuSelectedEvent extends Event {
    static readonly type = 'r-menu-selected';

    constructor(public readonly item: MenuItem) {
        super(MenuSelectedEvent.type, { bubbles: true, composed: true });
    }
}

/** Thrown when items of an `<r-top-menu>` share a name. */
export class DuplicateMenuItemNameError extends Error {
    constructor(public readonly itemName: string) {
        super(`r-top-menu: item name "${itemName}" is not unique`);
        this.name = 'DuplicateMenuItemNameError';
    }
}

// A name identifies an item in the selected event, so it must be unique across every level.
function assertUniqueNames(items: MenuItem[], seen = new Set<string>()): void {
    for (const item of items) {
        if (seen.has(item.name)) {
            throw new DuplicateMenuItemNameError(item.name);
        }
        seen.add(item.name);
        if (item.children) {
            assertUniqueNames(item.children, seen);
        }
    }
}

const alignments = ['left', 'center', 'right'];

/**
 * A horizontal menu bar. Opening an item with children slides its submenu in over the bar,
 * with a back button to return. Escape also goes back one level.
 *
 * @example
 * ```typescript
 * const menu = document.querySelector('r-top-menu')!;
 * menu.items = [
 *     { name: 'home', title: 'Home', href: '/' },
 *     { name: 'file', title: 'File', children: [{ name: 'file.new', title: 'New' }] },
 * ];
 * menu.addEventListener('r-menu-selected', (e) => console.log(e.item.name));
 * ```
 *
 * @attr {'left' | 'center' | 'right'} align - Placement of the items, `center` when absent
 * @csspart bar - The strip holding the items
 * @csspart item - Each item button or link
 * @csspart back - The back button in a submenu
 * @fires r-menu-selected - {@link MenuSelectedEvent}
 */
export class TopMenu extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['align'];
    }

    private menuItems: MenuItem[] = [];
    private readonly openPath: MenuItem[] = [];
    private readonly bar: HTMLElement;
    private readonly rootLevel: HTMLUListElement;
    private readonly subLevel: HTMLUListElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = /* html */ `
            <style>
                :host {
                    display: block;
                    --align: center;
                }

                :host([align='left']) { --align: flex-start; }
                :host([align='right']) { --align: flex-end; }

                nav {
                    position: relative;
                    overflow: hidden;
                    height: calc(1lh + var(--panel-padding));
                    background: var(--surface-raised);
                    color: var(--text-primary);
                    border-bottom: 1px solid var(--bd-muted);
                }

                ul {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    /* Items that do not fit scroll sideways, starting from the first rather than cut off at both ends. */
                    justify-content: safe var(--align);
                    overflow-x: auto;
                    scrollbar-width: none;
                    gap: var(--control-gap);
                    margin: 0;
                    padding: 0 var(--panel-padding);
                    list-style: none;
                    background: var(--surface-raised);
                    transition: transform var(--motion-base) ease-in-out, visibility var(--motion-base);
                }

                li {
                    flex: none;
                }

                /* The level slid out of view is hidden too, so it takes no focus. */
                .submenu {
                    transform: translateX(100%);
                    visibility: hidden;
                }

                nav.submenu-open {
                    .root { transform: translateX(-100%); visibility: hidden; }
                    .submenu { transform: translateX(0); visibility: visible; }
                }

                button,
                a {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--control-gap);
                    font: inherit;
                    color: inherit;
                    text-decoration: none;
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

                @media (prefers-reduced-motion: reduce) {
                    ul {
                        transition: none;
                    }
                }
            </style>
            <nav part="bar">
                <ul class="root"></ul>
                <ul class="submenu" inert></ul>
            </nav>
        `;
        this.bar = shadow.querySelector('nav')!;
        this.rootLevel = shadow.querySelector('.root')!;
        this.subLevel = shadow.querySelector('.submenu')!;
        this.bar.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.openPath.length > 0) {
                this.goBack();
            }
        });
    }

    private readonly controls = new Map<MenuItem, HTMLElement>();
    private backButton?: HTMLElement;

    private goBack(): void {
        const closed = this.openPath.pop();
        this.drawLevels();
        this.controls.get(closed!)?.focus();
    }

    private stopListening?: () => void;
    private readonly redrawWords = () => this.drawLevels();

    connectedCallback(): void {
        this.stopListening = whenLanguageChanges(this.redrawWords);
        this.drawLevels();
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.drawLevels();
        }
    }

    /** The menu's items. Setting them shows the top level with the new items. */
    get items(): MenuItem[] {
        return this.menuItems;
    }

    set items(items: MenuItem[]) {
        assertUniqueNames(items);
        this.menuItems = items;
        this.openPath.length = 0;
        if (this.isConnected) {
            this.drawLevels();
        }
    }

    /** Closes every submenu and shows the top level. */
    showTopLevel(): void {
        this.openPath.length = 0;
        this.drawLevels();
    }

    private hasValidAlignment(): boolean {
        const align = this.getAttribute('align');
        if (align !== null && !alignments.includes(align)) {
            reportProblem('r-top-menu', `align="${align}" is not one of ${alignments.join(', ')}`);
            return false;
        }
        return true;
    }

    private drawLevels(): void {
        if (!this.hasValidAlignment()) {
            this.rootLevel.replaceChildren();
            this.subLevel.replaceChildren();
            return;
        }
        const open = this.openPath.at(-1);
        this.controls.clear();
        this.rootLevel.replaceChildren(...this.menuItems.map((item) => this.createItem(item)));
        this.bar.classList.toggle('submenu-open', open !== undefined);
        this.rootLevel.toggleAttribute('inert', open !== undefined);
        this.subLevel.toggleAttribute('inert', open === undefined);
        this.subLevel.replaceChildren(
            ...(open ? [this.createBackButton(), ...open.children!.map((item) => this.createItem(item))] : [])
        );
    }

    private createBackButton(): HTMLLIElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('part', 'back');
        button.append(icon('chevron-left'), text('back'));
        button.addEventListener('click', () => this.goBack());
        this.backButton = button;
        return listItem(button);
    }

    private createItem(item: MenuItem): HTMLLIElement {
        if (item.children?.length) {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('part', 'item');
            button.setAttribute('aria-haspopup', 'menu');
            button.append(item.title, icon('chevron-right'));
            button.addEventListener('click', () => {
                this.openPath.push(item);
                this.drawLevels();
                this.backButton?.focus();
            });
            this.controls.set(item, button);
            return listItem(button);
        }

        const control = item.href ? document.createElement('a') : document.createElement('button');
        if (control instanceof HTMLAnchorElement) {
            control.href = item.href!;
        } else {
            control.type = 'button';
        }
        control.setAttribute('part', 'item');
        control.textContent = item.title;
        this.controls.set(item, control);
        control.addEventListener('click', () => this.dispatchEvent(new MenuSelectedEvent(item)));
        return listItem(control);
    }
}

function icon(name: string): HTMLElement {
    const element = document.createElement('r-icon');
    element.setAttribute('name', name);
    return element;
}

function listItem(control: HTMLElement): HTMLLIElement {
    const li = document.createElement('li');
    li.append(control);
    return li;
}

if (!customElements.get('r-top-menu')) {
    customElements.define('r-top-menu', TopMenu);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-top-menu': TopMenu;
    }

    interface HTMLElementEventMap {
        [MenuSelectedEvent.type]: MenuSelectedEvent;
    }
}
