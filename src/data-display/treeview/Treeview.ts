import { reportProblem } from '../../foundations/problems/problems';
import { installStyles } from '../../foundations/styles';
import type { Tone } from '../../foundations/tone/tone';
import { parseInlineNodes } from './inlineNodes';
import { createItemElement, groupOf, makeLeaf } from './treeItemDom';
import { isTypedCharacter, TypeAhead } from './typeAhead';

/** A short status or count shown after a node's label. */
export interface TreeNodeBadge {
    /** Text shown as given; ignored when `count` is set. */
    text?: string;
    /** A whole number written for the configured locale; zero is shown. */
    count?: number;
    tone?: Tone;
}

/**
 * One node handed to `<r-treeview>`. The tree never modifies these objects; `data` is yours
 * to carry whatever identifies the node in your application.
 */
export interface TreeNode<T = unknown> {
    /** Text shown for the node. */
    label: string;
    /** Application data, matched by `find()` and handed back in events. */
    data: T;
    /**
     * Identifies the node across `nodes` sets, so expanded branches and the selection survive a
     * refresh, and lets `select`, `expand` and `collapse` take the key in place of the node.
     */
    key?: string;
    children?: TreeNode<T>[];
    /** Shows the children when the node is first drawn. */
    expanded?: boolean;
    /** A branch whose children `loadChildren` supplies when it is first expanded. */
    hasChildren?: boolean;
    /** An icon name shown before the label. */
    icon?: string;
    /** Secondary text shown after the label, such as a size or a count of lines. */
    note?: string;
    badge?: TreeNodeBadge;
    /** Colours the node's icon and label; a node without its own icon shows the tone's icon. */
    tone?: Tone;
}

/** Loads the children of a branch marked `hasChildren`; `signal` aborts when the tree is redrawn. */
export type ChildLoader<T> = (node: TreeNode<T>, signal: AbortSignal) => Promise<TreeNode<T>[]>;

/** How `select` behaves. */
export interface SelectOptions {
    /** Selects without dispatching `r-node-navigated`, for reflecting a selection the app made itself. */
    silent?: boolean;
}

/** A node given by its object or by its `key`. */
export type NodeRef<T> = TreeNode<T> | string;

/**
 * Dispatched by `<r-treeview>` when a node is selected by a click, the keyboard or
 * `select()` without `silent`.
 */
export class NodeNavigatedEvent<T = unknown> extends Event {
    static readonly type = 'r-node-navigated';

    constructor(public readonly node: TreeNode<T>) {
        super(NodeNavigatedEvent.type, { bubbles: true, composed: true });
    }
}

/**
 * Dispatched by `<r-treeview>` when the user expands or collapses a branch with the pointer or
 * the keyboard. `expand()`, `collapse()` and `select()` dispatch nothing.
 */
export class NodeToggledEvent<T = unknown> extends Event {
    static readonly type = 'r-node-toggled';

    constructor(
        public readonly node: TreeNode<T>,
        public readonly expanded: boolean,
    ) {
        super(NodeToggledEvent.type, { bubbles: true, composed: true });
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

        [aria-busy='true'] > .node-row {
            cursor: progress;
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

        .icon,
        r-badge {
            flex: none;
        }

        .node-row[data-tone] > :is(.icon, .label) {
            color: var(--tone);
        }

        .note {
            color: var(--text-muted);
            font-size: 0.9em;
            white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
            .node-row,
            .toggle {
                transition: none;
            }
        }
    }
`;

/** Where the user was in the tree, by key, carried across a `nodes` set until the next one. */
interface KeyedState {
    expanded: Map<string, boolean>;
    selected?: string;
    focused?: string;
}

/**
 * A hierarchical list where branches expand and collapse and one node at a time is selected.
 *
 * Clicking the arrow or double-clicking the row toggles a branch; clicking the label selects the
 * node. The keyboard follows the WAI-ARIA tree pattern: arrows move and expand, Enter or Space
 * selects, typing jumps to the next node starting with the typed text. Renders into the light
 * DOM, so the page's CSS reaches it.
 *
 * @example
 * ```typescript
 * const tree = document.querySelector('r-treeview') as Treeview<{ id: number }>;
 * tree.nodes = [{ label: 'Docs', data: { id: 1 }, children: [{ label: 'a.pdf', data: { id: 2 } }] }];
 * tree.addEventListener('r-node-navigated', (e) => console.log(e.node.label));
 * ```
 *
 * @attr {string} label - The tree's accessible name
 * @fires r-node-navigated - {@link NodeNavigatedEvent}
 * @fires r-node-toggled - {@link NodeToggledEvent}
 */
export class Treeview<T = unknown> extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['label'];
    }

    /** Loads the children of a branch marked `hasChildren` the first time it is expanded. */
    loadChildren?: ChildLoader<T>;

    private readonly tree: HTMLUListElement;
    private readonly itemOf = new Map<TreeNode<T>, HTMLLIElement>();
    private readonly nodeOf = new WeakMap<Element, TreeNode<T>>();
    private readonly nodeByKey = new Map<string, TreeNode<T>>();
    private readonly unloaded = new Set<HTMLLIElement>();
    private readonly loading = new Map<HTMLLIElement, Promise<void>>();
    private readonly typeAhead = new TypeAhead();
    private loads = new AbortController();
    private rootNodes?: TreeNode<T>[];
    private selectedNode?: TreeNode<T>;
    private kept?: KeyedState;

    constructor() {
        super();
        this.tree = document.createElement('ul');
        this.tree.className = 'tree';
        this.tree.setAttribute('role', 'tree');
        this.tree.addEventListener('click', (event) => this.onClick(event));
        this.tree.addEventListener('dblclick', (event) => this.onDoubleClick(event));
        this.tree.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    connectedCallback(): void {
        installStyles(this, 'r-treeview', styles);
        this.applyLabel();
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

    attributeChangedCallback(): void {
        this.applyLabel();
    }

    /**
     * The top-level nodes. Setting them redraws the tree; keyed branches keep whether they were
     * expanded and a keyed selection is kept, while the rest starts from the nodes' own flags.
     */
    get nodes(): TreeNode<T>[] {
        return this.rootNodes ?? [];
    }

    set nodes(nodes: TreeNode<T>[]) {
        this.kept = this.tree.parentElement === this ? this.keyedState() : undefined;
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
    add(node: TreeNode<T>, parent?: NodeRef<T>): void {
        const parentItem = parent === undefined ? undefined : this.requireItem(parent);
        const item = this.createItem(node);
        if (parentItem) {
            groupOf(parentItem).append(item);
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
    find(match: (data: T) => boolean, under?: NodeRef<T>): TreeNode<T>[] {
        const scope = under === undefined ? this.tree : this.requireItem(under);
        return Array.from(scope.querySelectorAll('.node'))
            .map((item) => this.nodeOf.get(item)!)
            .filter((node) => match(node.data));
    }

    /**
     * Selects a node and expands every branch above it. Dispatches a {@link NodeNavigatedEvent}
     * unless `silent` is set.
     */
    select(node: NodeRef<T>, options: SelectOptions = {}): void {
        const item = this.requireItem(node);
        for (let ancestor = parentItem(item); ancestor; ancestor = parentItem(ancestor)) {
            ancestor.setAttribute('aria-expanded', 'true');
        }
        this.markSelected(item);
        if (!options.silent) {
            this.dispatchEvent(new NodeNavigatedEvent<T>(this.selectedNode!));
        }
    }

    /**
     * Shows the children of a node. Resolves once they are shown, loading them first for a
     * branch marked `hasChildren`, and rejects when that load fails.
     */
    expand(node: NodeRef<T>): Promise<void> {
        return this.setExpanded(this.requireItem(node), true);
    }

    /** Hides the children of a node. */
    collapse(node: NodeRef<T>): void {
        void this.setExpanded(this.requireItem(node), false);
    }

    private setExpanded(item: HTMLLIElement, expanded: boolean): Promise<void> {
        if (!item.hasAttribute('aria-expanded')) {
            return Promise.resolve();
        }
        item.setAttribute('aria-expanded', String(expanded));
        if (expanded) {
            return this.loadChildrenOf(item);
        }
        // Collapsing hides the focused node when it sits inside the branch, so focus moves to the branch.
        const group = item.querySelector(':scope > .children');
        const holdsFocus = group?.contains(document.activeElement);
        if (holdsFocus || group?.querySelector('[tabindex="0"]')) {
            this.makeFocusable(item);
            if (holdsFocus) {
                item.focus();
            }
        }
        return Promise.resolve();
    }

    private toggleByUser(item: HTMLLIElement, expanded: boolean): void {
        if (!item.hasAttribute('aria-expanded') || (item.getAttribute('aria-expanded') === 'true') === expanded) {
            return;
        }
        // A failed load is already reported; the user who expanded has nobody to hand it to.
        this.setExpanded(item, expanded).catch(() => undefined);
        this.dispatchEvent(new NodeToggledEvent<T>(this.nodeOf.get(item)!, expanded));
    }

    private loadChildrenOf(item: HTMLLIElement): Promise<void> {
        const running = this.loading.get(item);
        if (running) {
            return running;
        }
        if (!this.unloaded.has(item)) {
            return Promise.resolve();
        }
        const node = this.nodeOf.get(item)!;
        const loader = this.loadChildren;
        if (!loader) {
            const message = `node '${node.label}' has children to load, but loadChildren is not set`;
            reportProblem('r-treeview', message);
            item.setAttribute('aria-expanded', 'false');
            return Promise.reject(new Error(`r-treeview: ${message}`));
        }
        const signal = this.loads.signal;
        item.setAttribute('aria-busy', 'true');
        const load = loader(node, signal)
            .then(
                (children) => {
                    if (signal.aborted) {
                        return;
                    }
                    this.unloaded.delete(item);
                    if (children.length === 0) {
                        makeLeaf(item);
                        return;
                    }
                    groupOf(item).append(...children.map((child) => this.createItem(child)));
                    this.restoreSelection();
                    this.loadExpandedBranches(item);
                },
                (error: unknown) => {
                    if (signal.aborted) {
                        return;
                    }
                    const message = error instanceof Error ? error.message : String(error);
                    reportProblem('r-treeview', `loading the children of '${node.label}' failed: ${message}`);
                    item.setAttribute('aria-expanded', 'false');
                    throw error;
                },
            )
            .finally(() => {
                item.removeAttribute('aria-busy');
                this.loading.delete(item);
            });
        this.loading.set(item, load);
        return load;
    }

    // Branches drawn expanded whose children are still to load, under `scope`.
    private loadExpandedBranches(scope: Element): void {
        for (const item of this.unloaded) {
            if (scope.contains(item) && item.getAttribute('aria-expanded') === 'true') {
                this.loadChildrenOf(item).catch(() => undefined);
            }
        }
    }

    private applyLabel(): void {
        const label = this.getAttribute('label');
        if (label === null) {
            this.tree.removeAttribute('aria-label');
        } else {
            this.tree.setAttribute('aria-label', label);
        }
    }

    private readInlineNodes(): void {
        const nodes = parseInlineNodes<T>(this);
        if (nodes) {
            this.nodes = nodes;
        }
    }

    // Branches still to load keep what the previous nodes set carried for their descendants.
    private keyedState(): KeyedState {
        const expanded = new Map(this.kept?.expanded);
        for (const [key, node] of this.nodeByKey) {
            const item = this.itemOf.get(node)!;
            if (item.hasAttribute('aria-expanded')) {
                expanded.set(key, item.getAttribute('aria-expanded') === 'true');
            }
        }
        const focused = this.tree.querySelector('[tabindex="0"]');
        return {
            expanded,
            selected: this.selectedNode ? this.selectedNode.key : this.kept?.selected,
            focused: focused ? this.nodeOf.get(focused)?.key : undefined,
        };
    }

    private draw(): void {
        this.loads.abort();
        this.loads = new AbortController();
        this.itemOf.clear();
        this.nodeByKey.clear();
        this.unloaded.clear();
        this.loading.clear();
        this.selectedNode = undefined;
        this.tree.replaceChildren(...this.nodes.map((node) => this.createItem(node)));

        this.restoreSelection();
        const visible = this.visibleItems();
        const focusable = [this.itemByKey(this.kept?.focused), this.itemByKey(this.kept?.selected)].find(
            (item) => item !== undefined && visible.includes(item),
        );
        this.makeFocusable(focusable ?? visible[0]);
        // Deferred, so a loader set right after the nodes is the one asked.
        queueMicrotask(() => this.loadExpandedBranches(this.tree));
    }

    private itemByKey(key: string | undefined): HTMLLIElement | undefined {
        const node = key === undefined ? undefined : this.nodeByKey.get(key);
        return node ? this.itemOf.get(node) : undefined;
    }

    // A kept selection may sit in a branch still to load, so this also runs after each load.
    private restoreSelection(): void {
        const item = this.selectedNode ? undefined : this.itemByKey(this.kept?.selected);
        if (item) {
            const focused = this.tree.querySelector<HTMLLIElement>('[tabindex="0"]');
            this.markSelected(item);
            this.makeFocusable(focused ?? item);
        }
    }

    private createItem(node: TreeNode<T>): HTMLLIElement {
        const item = createItemElement(node);
        this.itemOf.set(node, item);
        this.nodeOf.set(item, node);
        if (node.key !== undefined) {
            if (this.nodeByKey.has(node.key)) {
                reportProblem('r-treeview', `key '${node.key}' is used by more than one node`);
            } else {
                this.nodeByKey.set(node.key, node);
            }
        }

        const keptExpanded = node.key === undefined ? undefined : this.kept?.expanded.get(node.key);
        const expanded = keptExpanded ?? node.expanded === true;
        if (node.children?.length) {
            groupOf(item).append(...node.children.map((child) => this.createItem(child)));
            item.setAttribute('aria-expanded', String(expanded));
        } else if (node.hasChildren) {
            groupOf(item);
            this.unloaded.add(item);
            item.setAttribute('aria-expanded', String(expanded));
        }
        return item;
    }

    private markSelected(item: HTMLLIElement): void {
        if (this.selectedNode) {
            this.itemOf.get(this.selectedNode)?.setAttribute('aria-selected', 'false');
        }
        item.setAttribute('aria-selected', 'true');
        this.selectedNode = this.nodeOf.get(item);
        this.makeFocusable(item);
    }

    private requireItem(ref: NodeRef<T>): HTMLLIElement {
        if (typeof ref === 'string') {
            const node = this.nodeByKey.get(ref);
            if (!node) {
                throw new Error(`r-treeview: no node with key '${ref}' in this tree.`);
            }
            return this.itemOf.get(node)!;
        }
        const item = ref ? this.itemOf.get(ref) : undefined;
        if (!item) {
            throw new Error(
                `r-treeview: node '${ref?.label}' is not in this tree. Pass a node from nodes, add() or find().`,
            );
        }
        return item;
    }

    private visibleItems(): HTMLLIElement[] {
        return Array.from(this.tree.querySelectorAll<HTMLLIElement>('.node')).filter(
            (item) => !item.parentElement!.closest('[aria-expanded="false"]'),
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
            this.toggleByUser(item, item.getAttribute('aria-expanded') !== 'true');
            return;
        }
        this.select(this.nodeOf.get(item)!);
    }

    private onDoubleClick(event: MouseEvent): void {
        const target = event.target as Element;
        const item = target.closest<HTMLLIElement>('.node');
        // The arrow already toggled on each of the two clicks.
        if (!item || !target.closest('.node-row') || target.closest('.toggle')) {
            return;
        }
        this.toggleByUser(item, item.getAttribute('aria-expanded') !== 'true');
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
                    this.toggleByUser(item, true);
                } else if (expanded === 'true') {
                    this.moveFocus(visible[index + 1]);
                }
                break;
            case 'ArrowLeft':
                if (expanded === 'true') {
                    this.toggleByUser(item, false);
                } else {
                    this.moveFocus(parentItem(item));
                }
                break;
            case 'Enter':
            case ' ':
                this.select(this.nodeOf.get(item)!);
                break;
            default:
                if (!isTypedCharacter(event)) {
                    return;
                }
                this.moveFocus(
                    this.typeAhead.next(event.key, visible, item, (candidate) =>
                        this.nodeOf.get(candidate)!.label,
                    ) as HTMLLIElement | undefined,
                );
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
        [NodeToggledEvent.type]: NodeToggledEvent;
    }
}
