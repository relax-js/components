# Design Language

The visual and interaction rules every component in this library follows. Every value named here comes from [Theming](Theming.md).

## Native First

Components build on native elements and browser APIs: a table renders a native `<table>`, popups use the Popover API, modals use `<dialog>` and inputs are form-associated.

## Transient vs Modal

Menus, tooltips and dropdowns are popovers that close on an outside click or Escape. Confirmations and forms that need the user's attention are dialogs.

## Component Tiers

Every component belongs to one tier, and takes its radius, padding, gaps and depth from that tier's role variables in [Theming](Theming.md#variables).

| Tier | What it is | Examples |
|------|------------|----------|
| Control | Something the user operates | button, input, select, tab header, menu item, chip |
| Dense item | One entry in a repeated list or grid, separated by a line | table cell, tree node, list row |
| Content container | A section of one thing, grouping related content | form section, fieldset, accordion item, tab panel, article |
| Card | One self-contained unit in the layout, often repeated or clickable | record card, summary tile, overview card |
| Floating | Transient UI lying above the content | popover, menu dropdown, tooltip, chart read-out |
| Dialog | Modal UI that needs the user's attention | confirmation, form dialog, sheet |
| Panel | A region of the page layout | sidebar, header bar, page region |
| Well | Content set into the page rather than lying on it | code block, read-only value |

- A content container is open by default: no frame, and the panel around it supplies the padding. Only when it is boxed does it take `--content-radius`, `--content-padding` and a border.
- A panel meeting the viewport edge has square corners there.
- Running text in a content container is no wider than `--content-measure`.
- A rounded element inside another is never rounder than its container.

## Spacing

Padding and gaps come from the tier's role variables; see Component Tiers.

## Borders

A `1px` `--bd-muted` line separates items, and a `2px` line marks a header from its content.

## Shape and Elevation

Corners come from the tier's role variables; see Component Tiers. A shadow means floating: only floating surfaces and dialogs cast one, while cards, panels and content containers in the layout are set apart by a border or by `--surface-raised` against `--surface-bg`.

## Dimming

Content that is busy or covered is dimmed with `--overlay-dim`.

## Motion

State changes such as fades and submenu reveals animate with `--motion-fast` or `--motion-base` instead of snapping, and animation is dropped when the user prefers reduced motion.

## Hover

A surface responds when the pointer hovers over it, using `--surface-hover`, only when clicking anywhere on it does something, such as a tab header, a menu item, a tree node or a card that is a link as a whole. A surface that only holds interactive parts, such as a card with a link and an action, or a panel, stays still, and only those parts respond.

## Selection

The selected item is marked with `--surface-selected`.

## Tones

A tone says how much something asks of the reader, and is one of five:

| Tone | Meaning | Icon |
|------|---------|------|
| `ok` | Fine, done | `check-circle` |
| `info` | Under way | `clock` |
| `warn` | Worth a look | `minus-circle` |
| `danger` | Wrong | `x-circle` |
| `muted` | Nothing asked of the reader | `info` |

A component reflects its tone as `data-tone` and colours it through `--tone` and `--tone-soft` (see [Theming](Theming.md#tones)). A tone is never shown by colour alone: an icon or text always says the same.

## Focus

Keyboard focus is always visible as a `--focus-ring` outline.

## Icons

Icons are line drawings shown with `r-icon`: inline SVG on a 24-unit grid, stroked in the text's colour with no fill, sized by the font. An icon is decoration beside text that carries the meaning, so it is hidden from assistive technology. Components use `r-icon` for every icon they draw, and an app adds shapes of its own to the same set.

## Replaceable Visuals

A default visual, such as the spinner's ring, can be replaced through a named slot, and the default hides itself when it is.

## Accessibility

Components report their state to assistive technology through ARIA, such as `aria-busy` while loading. Popups get Escape, outside-click dismissal and focus handling from the browser. Nothing is told by colour alone, and a chart gives screen reader users the same figures as a table.
