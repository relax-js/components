# Treeview

A hierarchical list, such as folders and files, where branches expand and collapse and one node at a time is selected. Reach for it when the structure itself is what the user navigates; for a flat list, use a native list or a [table](Table.md).

## Usage

```html
<r-treeview id="files"></r-treeview>
```

```typescript
import type { TreeNode, Treeview } from '@relax.js/components';

interface FileData { id: number; kind: 'folder' | 'file' }

const tree = document.getElementById('files') as Treeview<FileData>;
tree.nodes = [
    {
        label: 'Documents',
        data: { id: 1, kind: 'folder' },
        expanded: true,
        children: [{ label: 'Report.pdf', data: { id: 2, kind: 'file' } }],
    },
    { label: 'Notes.txt', data: { id: 3, kind: 'file' } },
];

tree.addEventListener('r-node-navigated', (event) => {
    const data = event.node.data as FileData;
    openFile(data.id);
});
```

- Clicking the arrow of a branch expands or collapses it. Clicking a node's label selects it.
- `data` is yours: the tree never reads or changes it, and never changes the node objects you pass in.

### Nodes in Markup

A `template` named `data` holding a JSON list of nodes draws them without code:

```html
<r-treeview>
    <template name="data">
        [{ "label": "Root", "data": { "id": 1 }, "children": [{ "label": "Child", "data": { "id": 2 } }] }]
    </template>
</r-treeview>
```

JSON that does not parse reports an error and the tree renders empty.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `nodes` | `TreeNode<T>[]` | The top-level nodes. Setting them redraws the tree and clears the selection. Nodes set before the tree connects are drawn when it does. |
| `selected` | `TreeNode<T> \| undefined` (read only) | The selected node |

```typescript
interface TreeNode<T = unknown> {
    label: string;
    data: T;
    children?: TreeNode<T>[];
    expanded?: boolean;   // shows the children when the node is first drawn
}
```

## Methods

Every method taking a node throws an error naming the tree when that node is not in it. Pass a node from `nodes`, `add()` or `find()`.

### find(match, under?): TreeNode\<T\>[]

Returns the nodes whose `data` matches, in display order. Pass `under` to search only that node's descendants.

```typescript
const files = tree.find((data) => data.kind === 'file');
const inDocuments = tree.find((data) => data.kind === 'file', files[0]);
```

### select(node)

Selects a node, expands every branch above it and dispatches `r-node-navigated`.

```typescript
const [report] = tree.find((data) => data.id === 2);
tree.select(report);
```

### add(node, parent?)

Adds a node as the last top-level node, or as the last child of `parent`. A leaf that gets a child becomes a collapsed branch.

```typescript
tree.add({ label: 'Draft.docx', data: { id: 4, kind: 'file' } }, documents);
```

### expand(node) and collapse(node)

Show or hide a branch's children.

## Events

### r-node-navigated

Dispatched as `NodeNavigatedEvent` when a node is selected by a click, the keyboard or `select()`. Bubbles.

| Property | Type | Description |
|----------|------|-------------|
| `node` | `TreeNode` | The selected node |

Expanding or collapsing a branch selects nothing and dispatches nothing.

## Parts

The tree renders into the light DOM, so style it with ordinary selectors:

| Selector | What it is |
|----------|------------|
| `r-treeview .tree` | The outer list |
| `r-treeview .node` | One node, with `aria-expanded` on branches and `aria-selected` |
| `r-treeview .node-row` | The row holding a node's arrow and label |
| `r-treeview .toggle` | The expand/collapse arrow, empty on leaves |
| `r-treeview .label` | A node's text |
| `r-treeview .children` | The list of a branch's children |

## Variables

Rows take `--item-padding`, hover `--surface-hover`, the selected node `--surface-selected`, focus `--focus-ring`. See [Theming](../../authoring/Theming.md#variables).

## Accessibility

The tree follows the WAI-ARIA tree pattern: `role="tree"`, `treeitem` and `group`, with `aria-expanded` and `aria-selected`. One node is in the tab order at a time.

| Key | Action |
|-----|--------|
| Down / Up | Next / previous visible node |
| Right | Expands a collapsed branch, or moves to its first child |
| Left | Collapses an expanded branch, or moves to the parent |
| Home / End | First / last visible node |
| Enter / Space | Selects the node |
