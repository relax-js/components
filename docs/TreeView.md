# TreeView

A hierarchical tree display component with expand/collapse, selection, and search capabilities.

## Usage

```html
<r-treeview id="fileTree"></r-treeview>
```

### Rendering Data

```typescript
import { TreeView, TreeNode } from '@relax.js/components';

const tree = document.getElementById('fileTree') as TreeView;

const nodes: TreeNode[] = [
    {
        label: 'Documents',
        data: { type: 'folder', id: 1 },
        children: [
            { label: 'Report.pdf', data: { type: 'file', id: 2 } },
            { label: 'Budget.xlsx', data: { type: 'file', id: 3 } }
        ]
    },
    {
        label: 'Images',
        data: { type: 'folder', id: 4 },
        children: [
            { label: 'Photo.jpg', data: { type: 'file', id: 5 } }
        ]
    }
];

tree.render(nodes);
```

### Inline Data via Template

```html
<r-treeview>
    <template name="data">
        [
            { "label": "Root", "data": { "id": 1 }, "children": [
                { "label": "Child", "data": { "id": 2 } }
            ]}
        ]
    </template>
</r-treeview>
```

## Events

### TreeNodeNavigated

Fired when a node is clicked or programmatically selected.

```typescript
tree.addEventListener('TreeNodeNavigated', (e: TreeNodeNavigated) => {
    console.log('Selected:', e.node.label, e.node.data);
});
```

## Methods

### render(nodes: TreeNode[])

Renders the tree with the provided nodes. Clears any existing content.

```typescript
tree.render(nodes);
```

### find\<T\>(filter, parent?): FindResult\<T\>[]

Searches for nodes matching a filter function. Optionally limit search to a subtree.

```typescript
interface FileData { type: string; id: number; }

const files = tree.find<FileData>(data => data.type === 'file');
files.forEach(result => {
    console.log(result.node.label, result.data.id);
});

const parent = tree.find<FileData>(d => d.id === 1)[0].node;
const childFiles = tree.find<FileData>(d => d.type === 'file', parent);
```

### select(node: TreeNode): boolean

Selects a node, expands all parent nodes, and fires `TreeNodeNavigated`. Returns `true` if successful.

```typescript
const results = tree.find(data => data.id === 5);
if (results.length > 0) {
    tree.select(results[0].node);
}
```

### add(node: TreeNode)

Adds a node to the root level.

```typescript
tree.add({ label: 'New Folder', data: { type: 'folder', id: 6 } });
```

### addToParent(node: TreeNode, parent: TreeNode, addAlphabetically?: boolean)

Adds a node as a child of an existing node.

```typescript
const parent = tree.find(d => d.id === 1)[0].node;
tree.addToParent(
    { label: 'NewFile.txt', data: { type: 'file', id: 7 } },
    parent
);
```

## Types

### TreeNode

```typescript
interface TreeNode {
    label: string;
    data: any;
    children?: TreeNode[];
    expanded?: boolean;
    parent?: TreeNode;
}
```

### FindResult\<T\>

```typescript
class FindResult<T> {
    data: T;
    node: TreeNode;
}
```

### TreeNodeNavigated

```typescript
class TreeNodeNavigated extends Event {
    static NAME = 'TreeNodeNavigated';
    node: TreeNode;
}
```

## Styling

The component uses Font Awesome icons and can be customized via CSS:

```css
r-treeview {
    --tree-selected-bg: #e0e0e0;
}

r-treeview .tree-node {
    padding: 0.25rem;
}

r-treeview .selected > div {
    background-color: var(--tree-selected-bg);
}
```
