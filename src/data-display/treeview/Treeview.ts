import { installStyles } from '../../foundations/styles';
import { parseInlineNodes } from './inlineNodes';
import { createItemElement, groupOf } from './treeItemDom';

/**
 * One node handed to `<r-treeview>`. The tree never modifies these objects; `data` is yours
 * to carry whatever identifies the node in your application.
 */
export interface TreeNode<T = unknown> {
    /** Text shown for the node. */
    label: string;
    /** Application data, matched by `find()` and handed back in events. */
    data: T;
    children?: TreeNode<T>[];
    /** Shows the children when the node is first drawn. */
    expanded?: boolean;
}

/**
 * Dispatched by `<r-treeview>` when a node is selected by a click, the keyboard or
 * `select()`.
 */
export class NodeNavigatedEvent<T = unknown> extends Event {
    static readonly type = 'r-node-navigated';

    constructor(public readonly node: TreeNode<T>) {
        super(NodeNavigatedEvent.type, { bubbles: true, composed: true });
    }
}

const styles = /* css */ `
    r-treeview {
        display: block;

        .tree,
        .children {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .children {
            padding-left: 1.25em;
        }

        [aria-expanded='false'] > .children {
            display: none;
        }

        .node:focus {
            outline: none;
        }

        .node:focus-visible > .node-row {
            outline: 2px solid var(--focus-ring);
            outline-offset: -2px;
        }

        .node-row {
            display: flex;
            align-items: center;
            gap: var(--control-gap);
            padding: var(--item-padding);
            cursor: pointer;
            user-select: none;
            transition: background var(--motion-fast) ease;

            &:hover {
                background: var(--surface-hover);
            }
        }

        [aria-selected='true'] > .node-row {
            background: var(--surface-selected);
        }

        .toggle {
            flex: none;
            display: inline-grid;
            place-items: center;
            width: 1em;
            color: var(--text-muted);
            transition: transform var(--motion-fast) ease;
        }

        [aria-expanded='true'] > .node-row > .toggle {
            transform: rotate(90deg);
        }

        @media (prefers-reduced-motion: reduce) {
            .node-row,
            .toggle {
                transition: none;
            }
        }
    }
`;

/**
 * A hierarchical list where branches expand and collapse and one node at a time is selected.
 *
 * Clicking the arrow toggles a branch; clicking the label selects the node. The keyboard
 * follows the WAI-ARIA tree pattern: arrows move and expand, Enter or Space selects.
 * Renders into the light DOM, so the page's CSS reaches it.
 *
 * @example
 * ```typescript
 * const tree = document.querySelector('r-treeview') as Treeview<{ id: number }>;
 * tree.nodes = [{ label: 'Docs', data: { id: 1 }, children: [{ label: 'a.pdf', data: { id: 2 } }] }];
 * tree.addEventListener('r-node-navigated', (e) => console.log(e.node.label));
 * ```
 *
 * @fires r-node-navigated - {@link NodeNavigatedEvent}
 */
export class Treeview<T = unknown> extends HTMLElement {
    private readonly tree: HTMLUListElement;
    private readonly itemOf = new Map<TreeNode<T>, HTMLLIElement>();
    private readonly nodeOf = new WeakMap<Element, TreeNode<T>>();
    private rootNodes?: TreeNode<T>[];
    private selectedNode?: TreeNode<T>;

    constructor() {
        super();
        this.tree = document.createElement('ul');
        this.tree.className = 'tree';
        this.tree.setAttribute('role', 'tree');
        this.tree.addEventListener('click', (event) => this.onClick(event));
        this.tree.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    connectedCallback(): void {
        installStyles(this, 'r-treeview', styles);
        if (this.tree.parentElement === this) {
            return;
        }
        this.append(this.tree);
        if (this.rootNodes) {
            this.draw();
        } else {
            this.readInlineNodes();
        }
    }

    /** The top-level nodes. Setting them redraws the tree and clears the selection. */
    get nodes(): TreeNode<T>[] {
        return this.rootNodes ?? [];
    }

    set nodes(nodes: TreeNode<T>[]) {
        this.rootNodes = nodes;
        if (this.isConnected) {
            this.draw();
        }
    }

    /** The selected node, or `undefined` when nothing is selected. */
    get selected(): TreeNode<T> | undefined {
        return this.selectedNode;
    }

    /** Adds a node, at the top level or as the last child of `parent`. */
    add(node: TreeNode<T>, parent?: TreeNode<T>): void {
        const item = this.createItem(node);
        if (parent) {
            groupOf(this.requireItem(parent)).append(item);
        } else {
            this.rootNodes = [...this.nodes, node];
            this.tree.append(item);
        }
        if (!this.tree.querySelector('[tabindex="0"]')) {
            this.makeFocusable(item);
        }
    }

    /**
     * Returns the nodes whose `data` matches, in display order. Pass `under` to search only the
     * descendants of that node.
     *
     * @example
     * const [report] = tree.find((data) => data.id === 42);
     * tree.select(report);
     */
    find(match: (data: T) => boolean, under?: TreeNode<T>): TreeNode<T>[] {
        const scope = under ? this.requireItem(under) : this.tree;
        return Array.from(scope.querySelectorAll('.node'))
            .map((item) => this.nodeOf.get(item)!)
            .filter((node) => match(node.data));
    }

    /** Selects a node, expands every branch above it and dispatches a {@link NodeNavigatedEvent}. */
    select(node: TreeNode<T>): void {
        const item = this.requireItem(node);
        for (let ancestor = parentItem(item); ancestor; ancestor = parentItem(ancestor)) {
            ancestor.setAttribute('aria-expanded', 'true');
        }
        if (this.selectedNode) {
            this.itemOf.get(this.selectedNode)?.setAttribute('aria-selected', 'false');
        }
        item.setAttribute('aria-selected', 'true');
        this.selectedNode = node;
        this.makeFocusable(item);
        this.dispatchEvent(new NodeNavigatedEvent<T>(node));
    }

    /** Shows the children of a node. */
    expand(node: TreeNode<T>): void {
        this.setExpanded(this.requireItem(node), true);
    }

    /** Hides the children of a node. */
    collapse(node: TreeNode<T>): void {
        this.setExpanded(this.requireItem(node), false);
    }

    // Collapsing hides the focused node when it sits inside the branch, so focus moves to the branch.
    private setExpanded(item: HTMLLIElement, expanded: boolean): void {
        if (!item.hasAttribute('aria-expanded')) {
            return;
        }
        item.setAttribute('aria-expanded', String(expanded));
        if (expanded) {
            return;
        }
        const group = item.querySelector(':scope > .children');
        const holdsFocus = group?.contains(document.activeElement);
        if (holdsFocus || group?.querySelector('[tabindex="0"]')) {
            this.makeFocusable(item);
            if (holdsFocus) {
                item.focus();
            }
        }
    }

    private readInlineNodes(): void {
        const nodes = parseInlineNodes<T>(this);
        if (nodes) {
            this.nodes = nodes;
        }
    }

    private draw(): void {
        this.itemOf.clear();
        this.selectedNode = undefined;
        this.tree.replaceChildren(...this.nodes.map((node) => this.createItem(node)));
        this.makeFocusable(this.visibleItems()[0]);
    }

    private createItem(node: TreeNode<T>): HTMLLIElement {
        const item = createItemElement(node);
        this.itemOf.set(node, item);
        this.nodeOf.set(item, node);

        if (node.children?.length) {
            groupOf(item).append(...node.children.map((child) => this.createItem(child)));
            item.setAttribute('aria-expanded', String(node.expanded === true));
        }
        return item;
    }

    private requireItem(node: TreeNode<T>): HTMLLIElement {
        const item = node ? this.itemOf.get(node) : undefined;
        if (!item) {
            throw new Error(
                `r-treeview: node '${node?.label}' is not in this tree. Pass a node from nodes, add() or find().`
            );
        }
        return item;
    }

    private visibleItems(): HTMLLIElement[] {
        return Array.from(this.tree.querySelectorAll<HTMLLIElement>('.node')).filter(
            (item) => !item.parentElement!.closest('[aria-expanded="false"]')
        );
    }

    private makeFocusable(item: HTMLLIElement | undefined): void {
        if (!item) {
            return;
        }
        this.tree.querySelectorAll('[tabindex="0"]').forEach((other) => other.setAttribute('tabindex', '-1'));
        item.tabIndex = 0;
    }

    private moveFocus(item: HTMLLIElement | undefined | null): void {
        if (item) {
            this.makeFocusable(item);
            item.focus();
        }
    }

    private onClick(event: MouseEvent): void {
        const target = event.target as Element;
        const item = target.closest<HTMLLIElement>('.node');
        if (!item || !target.closest('.node-row')) {
            return;
        }
        if (target.closest('.toggle')) {
            this.setExpanded(item, item.getAttribute('aria-expanded') !== 'true');
            return;
        }
        this.select(this.nodeOf.get(item)!);
    }

    private onKeyDown(event: KeyboardEvent): void {
        const item = (event.target as Element).closest<HTMLLIElement>('.node');
        if (!item) {
            return;
        }
        const visible = this.visibleItems();
        const index = visible.indexOf(item);
        const expanded = item.getAttribute('aria-expanded');

        switch (event.key) {
            case 'ArrowDown':
                this.moveFocus(visible[index + 1]);
                break;
            case 'ArrowUp':
                this.moveFocus(visible[index - 1]);
                break;
            case 'Home':
                this.moveFocus(visible[0]);
                break;
            case 'End':
                this.moveFocus(visible.at(-1));
                break;
            case 'ArrowRight':
                if (expanded === 'false') {
                    this.setExpanded(item, true);
                } else if (expanded === 'true') {
                    this.moveFocus(visible[index + 1]);
                }
                break;
            case 'ArrowLeft':
                if (expanded === 'true') {
                    this.setExpanded(item, false);
                } else {
                    this.moveFocus(parentItem(item));
                }
                break;
            case 'Enter':
            case ' ':
                this.select(this.nodeOf.get(item)!);
                break;
            default:
                return;
        }
        event.preventDefault();
    }
}

function parentItem(item: Element): HTMLLIElement | null {
    return item.parentElement?.closest<HTMLLIElement>('.node') ?? null;
}

if (!customElements.get('r-treeview')) {
    customElements.define('r-treeview', Treeview);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-treeview': Treeview;
    }

    interface HTMLElementEventMap {
        [NodeNavigatedEvent.type]: NodeNavigatedEvent;
    }
}
