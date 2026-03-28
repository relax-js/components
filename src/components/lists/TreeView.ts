export interface TreeNode {
    label: string; // The display label of the node
    children?: TreeNode[]; // Optional array of child nodes
    expanded?: boolean; // Optional property to track if the node is expanded
    parent?: TreeNode;
    data: any;
}

export class FindResult<T> {
    constructor(public data: T, public node: TreeNode) {}
}

export interface TreeFindResult {}

export class TreeNodeNavigated extends Event {
    static NAME = 'TreeNodeNavigated';
    constructor(public node: TreeNode, eventInit?: EventInit) {
        super(TreeNodeNavigated.NAME, eventInit);
    }
}

export class TreeView extends HTMLElement {
    private root: HTMLUListElement;
    private elementToNode = new Map<HTMLLIElement, TreeNode>();
    private nodeToElement = new Map<TreeNode, HTMLLIElement>();
    private nodes: TreeNode[] = [];

    constructor() {
        super();
    }

    connectedCallback() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                font-family: Arial, sans-serif;
            }
            .tree-node {
                cursor: pointer;
                align-items: center;
                user-select: none;
                margin-left: 1rem;
            }
            .tree-icon {
                margin-right: 0.5rem;
                font-size: 0.9rem;
            }
            .tree-children {
                display: none;
                padding-left: 1rem;
            }
            .tree-node.expanded + .tree-children {
                display: block;
            }
            .treeview {
                list-style-type: none;
                padding-left: 0;
            }
            .treeview ul {
                list-style-type: none;
            }
            .selected > div {
                background-color: #f0f0f0;
            }
        `;
        this.appendChild(style);
        this.root = document.createElement('ul');
        this.root.className = 'treeview';
        this.appendChild(this.root);
        var template = this.querySelector('template[name="data"]');
        if (template && template.textContent) {
            const data = JSON.parse(template.textContent);
            this.renderTreeImp(data);
        }
    }

    selected?: TreeNode;

    render(nodes: TreeNode[]) {
        this.root.innerHTML = '';
        this.elementToNode.clear();
        this.nodes.length = 0;
        this.renderTreeImp(nodes, null);
    }

    add(node: TreeNode) {
        if (!node) {
            throw Error('node was not specified');
        }

        this.addNode(node);
    }

    addToParent(node: TreeNode, parent: TreeNode, addAlphabetically?: boolean) {
        if (!parent) {
            throw Error('Parent was not specified');
        }

        if (!node) {
            throw Error('node was not specified');
        }

        this.addNode(node, parent, addAlphabetically);
    }

    /**
     * Finds nodes in the tree that match the provided filter
     *
     * @param filter - Function to test each node's data
     * @param parent - Optional parent node to limit search scope
     * @returns Array of FindResult objects containing matches
     *
     * @example
     * // Find all nodes with data type User and name "John"
     * treeView.find(data => data.type === 'User' && data.name === 'John');
     *
     * @example
     * // Find nodes under a specific parent
     * treeView.find(data => data.isActive, parentNode);
     */
    find<T>(filter: (data: T) => boolean, parent?: TreeNode): FindResult<T>[] {
        if (parent) {
            const matches: FindResult<T>[] = [];
            this.findInSubtree(parent, filter, matches);
            return matches;
        }

        // This loop goes through this.nodes which contains all
        // and not just parent nodes.
        const matches: FindResult<T>[] = [];
        for (const node of this.nodes) {
            if (filter(node.data)) {
                matches.push(new FindResult(node.data, node));
            }
        }
        return matches;
    }

    /**
     * Selects a node in the tree and ensures all parent nodes are expanded
     *
     * @param node - The node to select
     * @returns True if node was successfully selected, false otherwise
     *
     * @example
     * // Select a node obtained from a find operation
     * const results = treeView.find(data => data.id === 42);
     * if (results.length > 0) {
     *   treeView.select(results[0].node);
     * }
     */
    select(node: TreeNode): boolean {
        if (!this.nodeToElement.has(node)) {
            return false;
        }

        this.expandPathToNode(node);
        this.selectNode(node);
        this.dispatchEvent(new TreeNodeNavigated(node, { bubbles: true }));
        return true;
    }

    private findInSubtree<T>(
        parentNode: TreeNode,
        filter: (data: T) => boolean,
        results: FindResult<T>[]
    ) {
        if (!parentNode.children || parentNode.children.length == 0) {
            return;
        }

        for (const child of parentNode.children) {
            if (filter(child.data)) {
                results.push(new FindResult(child.data, child));
            }

            this.findInSubtree(child, filter, results);
        }
    }

    private expandPathToNode(node: TreeNode) {
        const path: TreeNode[] = [];
        let current: TreeNode | undefined = node.parent;

        while (current) {
            path.unshift(current);
            current = current.parent;
        }

        for (const pathNode of path) {
            pathNode.expanded = true;
            const element = this.nodeToElement.get(pathNode);
            if (element) {
                const treeNode = element.querySelector(
                    '.tree-node'
                ) as HTMLDivElement;
                const icon = treeNode.querySelector(
                    '.tree-icon'
                ) as HTMLElement;

                if (!treeNode.classList.contains('expanded')) {
                    treeNode.classList.add('expanded');
                    icon.className = 'tree-icon fa-regular fa-square-minus';
                }
            }
        }
    }

    private renderTreeImp(data: TreeNode[], parent?: TreeNode) {
        data.forEach((node) => {
            this.addNode(node, parent);
        });
    }

    private addNode(
        node: TreeNode,
        parentNode?: TreeNode,
        addAlphabetically?: boolean
    ) {
        let container: HTMLUListElement;
        if (parentNode) {
            const parentElement = this.nodeToElement.get(parentNode);
            if (!parentElement) {
                console.log(
                    'Failed to find parent element for parent ',
                    parentNode
                );
                throw Error(
                    'Failed to find parent element for parent ' +
                        parentNode.label
                );
            }
            container = parentElement.querySelector('ul');
            node.parent = parentNode;
            if (!parentNode.children){
                parentNode.children = [node];
            }
            else{
                parentNode.children.push(node);
            }
        } else {
            container = this.root;
        }

        const nodeElement = document.createElement('li');
        this.elementToNode.set(nodeElement, node);
        this.nodeToElement.set(node, nodeElement);
        this.nodes.push(node);


        const iconStr =
            node.children && node.children.length > 0
                ? 'fa-square-plus'
                : 'fa-circle';
        nodeElement.innerHTML = `
                <div class="tree-node"><i class="tree-icon fa-regular ${iconStr}"></i> ${node.label}</div>
                <ul class="tree-children"></ul>
            `;

        if (addAlphabetically) [container];
        container.appendChild(nodeElement);

        const treeNode = nodeElement.querySelector(
            '.tree-node'
        ) as HTMLDivElement;
        const treeChildren = nodeElement.querySelector(
            '.tree-children'
        ) as HTMLUListElement;
        const icon = treeNode.querySelector('.tree-icon') as HTMLElement;

        if (node.children && node.children.length > 0) {
            treeNode.classList.add('expandable');
            treeNode.addEventListener('click', () => {
                const isExpanded = treeNode.classList.toggle('expanded');
                if (isExpanded) {
                    this.dispatchEvent(
                        new TreeNodeNavigated(node, { bubbles: true })
                    );
                }

                this.selectNode(node);
                if (node.children && node.children.length > 0) {
                    icon.className = isExpanded
                        ? 'tree-icon fa-regular fa-square-minus'
                        : 'tree-icon fa-regular fa-square-plus';
                } else {
                    icon.className = 'tree-icon fa-solid fa-plus';
                }
            });
            this.renderTreeImp(node.children, node);
        } else {
            icon.className = 'tree-icon fas fa-angle-right'; // Leaf node icon
            treeNode.addEventListener('click', () => {
                this.selectNode(node);
                this.dispatchEvent(
                    new TreeNodeNavigated(node, { bubbles: true })
                );
            });
        }
    }

    private selectNode(node: TreeNode) {
        if (this.selected) {
            this.nodeToElement.get(this.selected).classList.remove('selected');
        }

        this.nodeToElement.get(node).classList.add('selected');
        this.selected = node;
    }

    private implementsInterface<T>(
        obj: any,
        properties: (keyof T)[]
    ): obj is T {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return properties.every((prop) => prop in obj);
    }
}

customElements.define('r-treeview', TreeView);
