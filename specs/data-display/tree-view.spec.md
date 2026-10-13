---
feature: Tree view
status: verified
authored: planned
built: true
---

# Tree view

## Goal
A developer shows hierarchical data, such as folders and files, as a tree the user expands, collapses and selects nodes in with the pointer or the keyboard, and finds, selects and adds nodes from code, reacting when the user navigates to a node.

## Showing a tree
- **Render nodes**: setting `nodes` shows each node's label with its children nested under it, replacing what the tree showed before and clearing the selection (docs/manual/data-display/Treeview.md#Properties)
  - **Set before connecting**: nodes set before the tree connects are drawn when it connects
  - **Template and nodes**: a tree holding a `data` template whose `nodes` are also set shows the set nodes in place of the template's
- **Inline JSON data**: a tree holding a `template` named `data` with a JSON list of nodes shows those nodes without any code (docs/manual/data-display/Treeview.md#Nodes in Markup)
  - **Invalid JSON**: JSON that does not parse logs an error starting `r-treeview:` and the tree renders empty
  - **Not a node list**: JSON that parses but is not a list of nodes is handled as invalid JSON
- **Initially expanded**: a node marked expanded shows its children when first drawn, and an unmarked node shows them collapsed (docs/manual/data-display/Treeview.md#Properties)
- **Nodes left untouched**: the tree never changes the node objects or the data it is given (docs/manual/data-display/Treeview.md#Usage)
- **Labels as given**: a label holding markup is shown as that literal text (docs/authoring/TextAndValues.md#Data Is Shown as Given)
- **Tree pattern roles**: the tree has `role="tree"`, each node `treeitem` with `aria-selected`, each children list `group`, and each branch an `aria-expanded` matching its state (docs/manual/data-display/Treeview.md#Accessibility)
- **Drawn once**: moving the tree elsewhere in the document keeps its expanded branches and its selection and draws no node twice (docs/authoring/ComponentContract.md#Drawing Once)
- **Styles yield**: the tree draws into the light DOM with the class names listed under Parts, and its styles sit in the `relax-components` cascade layer so the app's own rules win (docs/manual/Customizing.md#Table and Tree View)

## Expanding and collapsing
- **Arrow toggles**: clicking a branch's arrow expands or collapses it without selecting anything or dispatching an event (docs/manual/data-display/Treeview.md#Usage)
- **Expand from code**: `expand` and `collapse` show and hide a branch's children without selecting anything or dispatching an event (docs/manual/data-display/Treeview.md#Methods)
  - **Leaf expanded**: `expand` or `collapse` on a leaf changes nothing
  - **Collapse around focus**: collapsing a branch that holds the focused node moves focus to that branch and keeps the selection

## Selecting a node
- **Click navigates**: clicking a node's label selects it and dispatches `r-node-navigated` carrying that node (docs/manual/data-display/Treeview.md#r-node-navigated)
  - **Click selected again**: clicking the node that is already selected dispatches `r-node-navigated` again
- **Event bubbles**: `r-node-navigated` is a `NodeNavigatedEvent` that bubbles to the tree's ancestors (docs/manual/data-display/Treeview.md#r-node-navigated)
- **Select from code**: `select` expands every branch above the node, marks it selected and dispatches `r-node-navigated` (docs/manual/data-display/Treeview.md#Methods)
- **Selected property**: `selected` returns the selected node, and is undefined before any selection and after `nodes` is set (docs/manual/data-display/Treeview.md#Properties)
- **Keyboard navigation**: Down and Up move focus to the next and previous visible node, Home and End to the first and last visible node, Right expands a collapsed branch or moves to its first child, and Left collapses an expanded branch or moves to its parent (docs/manual/data-display/Treeview.md#Accessibility)
  - **Focus is not selection**: moving focus with these keys selects nothing and dispatches nothing
- **Keyboard selects**: Enter or Space selects the focused node and dispatches `r-node-navigated` (docs/manual/data-display/Treeview.md#r-node-navigated)
- **One tab stop**: exactly one node is in the tab order at a time (docs/manual/data-display/Treeview.md#Accessibility)
  - **Tabbing in**: tabbing into the tree focuses the node that last had focus in it, or the selected node when none has had focus, or the first node when neither exists

## Working with nodes from code
- **Node not in tree**: every method given a node the tree does not hold throws an error naming the tree (docs/manual/data-display/Treeview.md#Methods)
- **Find by data**: `find` returns the nodes whose data matches, in display order (docs/manual/data-display/Treeview.md#Methods)
  - **Within a subtree**: finding under a node searches only that node's descendants
- **Add at root**: adding a node without a parent places it after the existing top-level nodes (docs/manual/data-display/Treeview.md#Methods)
- **Add under parent**: adding a node to a parent places it as that parent's last child (docs/manual/data-display/Treeview.md#Methods)
  - **Alphabetical insert** [removed]: adding with alphabetical order places the node among its siblings in label order
  - **Leaf becomes branch**: a leaf that gets a child becomes a collapsed branch
- **Added nodes stay inside**: after `add`, `find` and `select` reach the added node and `nodes` returns a new list that includes added top-level nodes, while the list the caller set and every node's `children` stay unchanged
