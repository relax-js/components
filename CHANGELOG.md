# Changelog

## 2.0.0

### Breaking

- Requires `@relax.js/core` 2.3 as a peer dependency; ES modules only, the CommonJS build is gone.
- `r-table` replaces both `r-table` and `relaxed-table`: columns are `<r-column field>` children or the `columns` property, records go in `rows` or a `provider`. `r-columns`, the constructor columns, `setData()`, `addRow()`, `page()` and `pageLoader` are removed.
- `r-tabs` dispatches `r-tab-change` (`TabChangeEvent` with `selectedIndex` and `tab`) instead of `tab-change`. `TabsContainer` is `Tabs`, `TabItem` is `Tab`.
- `TreeView` is `Treeview`. Nodes are set with the `nodes` property instead of `render()`; `add(node, parent?)` replaces `addToParent()`; `find()` returns nodes; `select()` throws for a node not in the tree. `TreeNodeNavigated` is `NodeNavigatedEvent`, dispatched as `r-node-navigated`. Inline data is read from `template.content`.
- `r-top-menu` takes plain `MenuItem` objects (`name`, `title`, `href`, `children`) through the `items` property instead of `setItems()`. `SubMenuItem` and `MenuEvent` are removed; choosing an item dispatches `r-menu-selected` (`MenuSelectedEvent`). `resetMenu()` is `showTopLevel()`.
- `RelaxSpinner` is `Spinner`; its `default-spinner` part is `ring`, and its variables are `--spinner-size` and `--spinner-thickness` on top of the shared theme.
- Components take their colours, spacing and motion from the shared theme; their own `--menu-*`, `--loader-*` and `--tree-*` variables are gone.
- Font Awesome is no longer used.

### Added

- `r-icon` and `registerIcons()`.
- `configureFormatting()` and `formatting()`: locale, currency and texts for every component.
- `readTone()` and `toneIcon`.
- `r-table`: click-to-sort headers, a localized pager, `refresh()`, and providers that receive an abort signal.
- `r-treeview` and `r-tabs`: keyboard navigation following the WAI-ARIA patterns.
- `r-top-menu`: link items, nested submenus, Escape to go back.

### Fixed

- `r-top-menu` reported items with a submenu as selected and opened an empty submenu for the others.
- Inline tree data in `<template name="data">` was never read in a browser.
- The build bundled `@relax.js/core` into the package.
