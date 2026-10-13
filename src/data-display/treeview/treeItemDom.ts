import '../../dashboard/badge/Badge';
import '../../foundations/icon/Icon';
import { reportProblem } from '../../foundations/problems/problems';
import { isTone, toneIcon } from '../../foundations/tone/tone';
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
    row.append(toggle);

    let tone = node.tone;
    if (tone !== undefined && !isTone(tone)) {
        reportProblem('r-treeview', `tone "${String(tone)}" is not one of ok, info, warn, danger, muted`);
        tone = undefined;
    }
    if (tone !== undefined) {
        row.dataset.tone = tone;
    }
    // A node's own icon wins; otherwise its tone's icon keeps the tone from being told by colour alone.
    const iconName = node.icon ?? (tone !== undefined ? toneIcon[tone] : undefined);
    if (iconName) {
        const icon = document.createElement('r-icon');
        icon.className = 'icon';
        icon.setAttribute('name', iconName);
        row.append(icon);
    }

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = node.label;
    row.append(label);

    if (node.note) {
        const note = document.createElement('span');
        note.className = 'note';
        note.textContent = node.note;
        row.append(note);
    }
    if (node.badge) {
        row.append(badgeElement(node.badge));
    }
    item.append(row);
    return item;
}

function badgeElement(badge: NonNullable<TreeNode['badge']>): HTMLElement {
    const element = document.createElement('r-badge');
    if (badge.tone !== undefined) {
        element.setAttribute('tone', badge.tone);
    }
    if (badge.count !== undefined) {
        element.setAttribute('count', String(badge.count));
        // A count on a node is a measurement, so zero is shown rather than hidden.
        element.setAttribute('show-zero', '');
    } else {
        element.textContent = badge.text ?? '';
    }
    return element;
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

/** Turns a branch back into a leaf, for a branch whose loaded children turned out to be none. */
export function makeLeaf(item: HTMLLIElement): void {
    item.querySelector(':scope > .children')?.remove();
    item.removeAttribute('aria-expanded');
    item.querySelector(':scope > .node-row > .toggle')!.replaceChildren();
}
