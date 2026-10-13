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
- Bad input and failed loads are reported through the Relax.js error channel (`onError()`, `window.relaxErrors`, `captureRelaxErrors()`) instead of the console, never thrown.
- A `custom-elements.json` manifest, referenced from `package.json`.
- An agent skill, `skills/relaxjs-components/SKILL.md`.

### Fixed

- `r-top-menu` reported items with a submenu as selected and opened an empty submenu for the others.
- Inline tree data in `<template name="data">` was never read in a browser.
- The build bundled `@relax.js/core` into the package.
- `r-bar-chart` and `r-area-chart` drew at a fixed width and scaled the drawing, so their text shrank to a few pixels in a narrow card. Every chart now draws at its own width, sizes its axis margins to its labels, thins crowded labels, and turns or shortens bar labels that do not fit.
- The hidden data table of the charts, sparkline and heatmap widened the page on narrow screens.
- `r-heatmap` column labels overlapped when the map was narrow; crowded ones are now thinned.
- A wide `r-table` widened the page; it now scrolls sideways within itself.
- `r-dialog` was wider than a phone's window, and a tall dialog ran past it; the dialog now stays inside the window and scrolls within itself.
- `r-dropdown-menu` laid its items out side by side, so the panel could be far wider than a phone; items are now one per line and the panel never leaves the window.
- `r-tabs` and `r-top-menu` widened the page or cut off items when they had more than fit; the bar now scrolls sideways within itself, and the top menu's hidden level takes no focus.
- `r-card` pushed its action and link out of a narrow card; they now move under the heading.
- `r-status-grid` let a long label stick out of a narrow grid.
