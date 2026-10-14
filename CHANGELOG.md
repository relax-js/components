# Changelog

## 2.0.2

### Changed

- An amount with no configured currency is written in the currency of the locale's region (`sv-SE` gives `SEK`, `en-GB` gives `GBP`), as the manual said, instead of in euros. Where the region has no single currency, such as `es-419`, it is written without a unit. `Formatting.currency` is `undefined` in that case. An app that wants euros everywhere calls `configureFormatting({ currency: 'EUR' })`.
- `r-icon` is sized by CSS on the element (one `em` square by default) instead of `width` and `height` attributes on its SVG, so setting the element's width and height sizes the icon.

### Added

- `defaultIcons` is exported, so code can list the names in the default set.
- The default icon set holds the icons most business apps need, such as `user`, `users`, `home`, `search`, `settings`, `mail`, `calendar`, `bell`, `menu`, `edit`, `trash-2`, `download` and `upload`: 96 in all, from Feather Icons.

### Fixed

- `r-banner` lost its icon and close button when the page set its message from code, such as with `textContent`. An action added later is now also moved to the end.
- `r-icon` reported a missing name when code put it on the page before naming it.

## 2.0.1

### Breaking

- The theme sits in the `relax-theme` cascade layer, so a variable the app sets wins whatever order the stylesheets load in. An app that relied on overriding theme variables from inside its own cascade layer declares `relax-theme` first.

### Added

- One import per element, such as `import '@relax.js/components/card'`, so an app pays only for the elements it uses. `import '@relax.js/components'` still registers every tag.
- The theme also ships as `theme-sizes.css` (spacing, shape, motion and roles) and `theme-colors.css` (the palette and light and dark mode); `theme.css` is both.
- `[data-theme="dark"]` and `[data-theme="light"]` force a mode, beside the `dark-theme` and `light-theme` classes.
- `--accent-text` for text drawn in the accent colour, and `--card-heading-size` for the size of a card's heading.
- `r-card`: a `heading` slot for a heading with markup, and a `level` attribute for the heading element.
- `r-badge`: `show-zero` shows a count of 0.
- `r-treeview`: nodes with an icon, a note, a badge and a tone; branches whose children load when first expanded (`hasChildren` and `loadChildren`); a `key` per node that keeps expanded branches and the selection across a `nodes` set and that `select`, `expand` and `collapse` accept; `select(node, { silent: true })`; `r-node-toggled` when the user expands or collapses a branch; type-to-jump; double-click to toggle; a `label` attribute for the tree's accessible name.

### Fixed

- Tones did not colour components inside a shadow root, which page rules never reach.
- The typings of the component words imported a locale file the package did not ship.
- The peer range asked for `@relax.js/core` 2.3.1 where 2.3.0 is enough.

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

- Dashboard elements: `r-amount`, `r-badge`, `r-card`, `r-days-left`, `r-kpi-meter`, `r-meter`, `r-period-grid`, `r-stat-tile`, `r-status-grid` and `r-status-mark`.
- Charts: `r-line-chart`, `r-area-chart`, `r-bar-chart`, `r-heatmap` and `r-sparkline`, each with a table for screen readers.
- `r-banner`, `r-dialog`, `r-setting-row`, `r-step` and `r-file-input`.
- Navigation: `r-dropdown-menu`, `r-side-menu` and `r-section-nav`.
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
