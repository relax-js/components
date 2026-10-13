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
- **Render nodes**: setting `nodes` shows each node's label with its children nested under it, replacing what the tree showed before; the selection is cleared unless it is a keyed node the new nodes hold too (docs/manual/data-display/Treeview.md#Properties)
  - **Set before connecting**: nodes set before the tree connects are drawn when it connects
  - **Template and nodes**: a tree holding a `data` template whose `nodes` are also set shows the set nodes in place of the template's
- **Inline JSON data**: a tree holding a `template` named `data` with a JSON list of nodes shows those nodes without any code (docs/manual/data-display/Treeview.md#Nodes in Markup)
  - **Invalid JSON**: JSON that does not parse reports an error starting `r-treeview:` and the tree renders empty
  - **Not a node list**: JSON that parses but is not a list of nodes is handled as invalid JSON
- **Initially expanded**: a node marked expanded shows its children when first drawn, and an unmarked node shows them collapsed (docs/manual/data-display/Treeview.md#Properties)
- **Rich nodes**: a node may show an icon before its label, a note after it and a badge with a text or a count and a tone, each shown as given, and a node tone colours its icon and label (docs/manual/data-display/Treeview.md#Properties)
  - **Tone without icon**: a toned node without an icon of its own shows its tone's icon, so the tone is never told by colour alone
  - **Zero count**: a badge count of 0 is shown
  - **Unknown node tone**: a node tone that is not one of the five reports an error and the node is untoned
- **Tree name**: the `label` attribute is the tree's accessible name (docs/manual/data-display/Treeview.md#Attributes)
- **Nodes left untouched**: the tree never changes the node objects or the data it is given (docs/manual/data-display/Treeview.md#Usage)
- **Labels as given**: a label holding markup is shown as that literal text (docs/authoring/TextAndValues.md#Data Is Shown as Given)
- **Tree pattern roles**: the tree has `role="tree"`, each node `treeitem` with `aria-selected`, each children list `group`, and each branch an `aria-expanded` matching its state (docs/manual/data-display/Treeview.md#Accessibility)
- **Drawn once**: moving the tree elsewhere in the document keeps its expanded branches and its selection and draws no node twice (docs/authoring/ComponentContract.md#Drawing Once)
- **Styles yield**: the tree draws into the light DOM with the class names listed under Parts, and its styles sit in the `relax-components` cascade layer so the app's own rules win (docs/manual/Customizing.md#Components in the Light DOM)

## Expanding and collapsing
- **Arrow toggles**: clicking a branch's arrow, or double-clicking its row, expands or collapses it without selecting anything (docs/manual/data-display/Treeview.md#Usage)
- **Toggle event**: the user expanding or collapsing a branch with the pointer or the keyboard dispatches `r-node-toggled` carrying the branch and whether it is now expanded (docs/manual/data-display/Treeview.md#r-node-toggled)
- **Expand from code**: `expand` and `collapse` show and hide a branch's children without selecting anything or dispatching an event, and `expand` resolves once the children are shown (docs/manual/data-display/Treeview.md#Methods)
  - **Leaf expanded**: `expand` or `collapse` on a leaf changes nothing
  - **Collapse around focus**: collapsing a branch that holds the focused node moves focus to that branch and keeps the selection
- **Lazy branches**: a node marked `hasChildren` without children is drawn as a collapsed branch whose children the page's `loadChildren` supplies the first time it is expanded, with the node marked busy until they are shown (docs/manual/data-display/Treeview.md#A Navigator)
  - **Loaded once**: expanding the branch again does not load its children again
  - **Load fails**: a failed load is reported, the branch collapses, and the next expand loads again
  - **No children after all**: a load that gives no children turns the node into a leaf
  - **No loader**: expanding such a branch without `loadChildren` reports an error and the branch stays collapsed
  - **Nodes replaced**: setting `nodes` aborts loads still running, and their children are never drawn
  - **Expanded from the start**: a lazy branch marked expanded loads its children when drawn, whichever of `nodes` and `loadChildren` the page sets first

## Selecting a node
- **Click navigates**: clicking a node's label selects it and dispatches `r-node-navigated` carrying that node (docs/manual/data-display/Treeview.md#r-node-navigated)
  - **Click selected again**: clicking the node that is already selected dispatches `r-node-navigated` again
- **Event bubbles**: `r-node-navigated` is a `NodeNavigatedEvent` that bubbles to the tree's ancestors (docs/manual/data-display/Treeview.md#r-node-navigated)
- **Select from code**: `select` expands every branch above the node, marks it selected and dispatches `r-node-navigated` (docs/manual/data-display/Treeview.md#Methods)
  - **Silent select**: `select` with `silent` set selects without dispatching, so reflecting a selection the app made cannot loop back into it
- **Selected property**: `selected` returns the selected node, and is undefined before any selection and after `nodes` is set without the selected node's key (docs/manual/data-display/Treeview.md#Properties)
- **Keyboard navigation**: Down and Up move focus to the next and previous visible node, Home and End to the first and last visible node, Right expands a collapsed branch or moves to its first child, and Left collapses an expanded branch or moves to its parent (docs/manual/data-display/Treeview.md#Accessibility)
  - **Focus is not selection**: moving focus with these keys selects nothing and dispatches nothing
- **Type to jump**: typing a character moves focus to the next visible node whose label starts with what was typed, keys typed in quick succession spelling one prefix, and selects nothing (docs/manual/data-display/Treeview.md#Accessibility)
- **Keyboard selects**: Enter or Space selects the focused node and dispatches `r-node-navigated` (docs/manual/data-display/Treeview.md#r-node-navigated)
- **One tab stop**: exactly one node is in the tab order at a time (docs/manual/data-display/Treeview.md#Accessibility)
  - **Tabbing in**: tabbing into the tree focuses the node that last had focus in it, or the selected node when none has had focus, or the first node when neither exists

## Working with nodes from code
- **Node not in tree**: every method given a node or key the tree does not hold throws an error naming the tree (docs/manual/data-display/Treeview.md#Methods)
- **Keys**: a node's `key` reaches it in `select`, `expand`, `collapse`, `find` and `add` in place of the node object (docs/manual/data-display/Treeview.md#Methods)
  - **Duplicate key**: a key used by more than one node reports an error and reaches the first
- **Kept across refresh**: setting `nodes` again keeps whether each keyed branch was expanded and a keyed selection, without dispatching, while a node new to the tree follows its own flags (docs/manual/data-display/Treeview.md#A Navigator)
  - **Selection gone**: a selected key the new nodes no longer hold clears the selection
- **Find by data**: `find` returns the nodes whose data matches, in display order (docs/manual/data-display/Treeview.md#Methods)
  - **Within a subtree**: finding under a node searches only that node's descendants
- **Add at root**: adding a node without a parent places it after the existing top-level nodes (docs/manual/data-display/Treeview.md#Methods)
- **Add under parent**: adding a node to a parent places it as that parent's last child (docs/manual/data-display/Treeview.md#Methods)
  - **Alphabetical insert** [removed]: adding with alphabetical order places the node among its siblings in label order
  - **Leaf becomes branch**: a leaf that gets a child becomes a collapsed branch
- **Added nodes stay inside**: after `add`, `find` and `select` reach the added node and `nodes` returns a new list that includes added top-level nodes, while the list the caller set and every node's `children` stay unchanged
