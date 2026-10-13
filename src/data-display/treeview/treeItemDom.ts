import '../../foundations/icon/Icon';
import type { TreeNode } from './Treeview';

/** Builds the `<li>` for one node, without its children. */
export function createItemElement<T>(node: TreeNode<T>): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'node';
    item.setAttribute('role', 'treeitem');
    item.setAttribute('aria-selected', 'false');
    item.tabIndex = -1;

    const row = document.createElement('div');
    row.className = 'node-row';
    const toggle = document.createElement('span');
    toggle.className = 'toggle';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = node.label;
    row.append(toggle, label);
    item.append(row);
    return item;
}

/** Returns the child list of an item, turning the item into a branch on first use. */
export function groupOf(item: HTMLLIElement): HTMLUListElement {
    const existing = item.querySelector<HTMLUListElement>(':scope > .children');
    if (existing) {
        return existing;
    }
    const group = document.createElement('ul');
    group.className = 'children';
    group.setAttribute('role', 'group');
    item.append(group);
    item.setAttribute('aria-expanded', 'false');
    const arrow = document.createElement('r-icon');
    arrow.setAttribute('name', 'chevron-right');
    item.querySelector(':scope > .node-row > .toggle')!.replaceChildren(arrow);
    return group;
}
