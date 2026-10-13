# Theming

Every component in this library follows this theme. How the theme is applied (spacing, depth, motion, states) is in [Design Language](DesignLanguage.md).

## One Theme

All components take their colours, spacing, shape and motion from the one set of variables under Variables. A component does not define a theme of its own.

## Naming by Intent

A variable is named for what its value is for (`--surface-bg`, `--accent-primary`, `--bd-muted`), never for the UI part or CSS property it styles (`--menu-bg-color`, `--gap`, `--padding`).

## Light and Dark

The theme follows the operating system's light or dark setting. Each colour is declared once with `light-dark()`, and the `dark-theme` or `light-theme` class on an ancestor forces one mode.

## Variables

This section defines what each variable is for. The values live in the stylesheets: the default theme is [theme.css](../../src/theme.css), shipped as `@relax.js/components/theme.css`. A stylesheet that sets these variables is a theme; a variable added here is added to every stylesheet.

The default theme is minimal Scandinavian: warm linen and birch tones in light mode, cool charcoal in dark mode, muted earthy status colours (sage, slate, ochre, brick), and kiwi green as the accent for focus, selection and primary actions.

| Group | Variable | For |
|---|---|---|
| Surfaces | `--surface-bg` | The page and component background |
| | `--surface-raised` | Something lifted above the page: card, popover, dialog |
| | `--surface-sunken` | Something set into the page: input, well |
| | `--surface-hover` | An interactive item under the pointer |
| | `--surface-selected` | A selected item |
| Text | `--text-primary` | Body text |
| | `--text-muted` | Secondary text: hints, captions, placeholders |
| | `--text-subtle` | The quietest readable text: axis labels, notes under a value |
| | `--text-on-accent` | Text on an accent background |
| Borders | `--bd-muted` | Separators and quiet outlines |
| | `--bd-strong` | Outlines that must be seen, such as an input's edge |
| Accent | `--accent-primary` | Focus, selection and primary actions |
| | `--accent-hover` | The accent under the pointer |
| | `--focus-ring` | The keyboard focus outline |
| Status | `--status-ok` | The `ok` tone: fine, done |
| | `--status-info` | The `info` tone: under way |
| | `--status-warning` | Warnings, and the `warn` tone: worth a look |
| | `--status-danger` | Errors, destructive actions, and the `danger` tone: wrong |
| | `--status-muted` | The `muted` tone: nothing asked of the reader |
| | `--status-ok-soft` … `--status-muted-soft` | A quiet background in each status colour |
| Series | `--series-1` … `--series-5` | Data series in a chart, in this order |
| Depth | `--shadow-raised` | The shadow under a raised surface |
| | `--overlay-dim` | The veil over content that is busy or behind a modal |
| Scale | `--radius-small`, `--radius`, `--radius-large` | Corner rounding steps |
| | `--space-1` … `--space-4` | Spacing steps, smallest first |
| | `--motion-fast`, `--motion-base` | Transition durations |
| Controls (button, input, select, tab header, menu item, chip) | `--control-radius`, `--control-padding`, `--control-gap` | |
| Dense items (table cell, tree node, list row) | `--item-padding`, `--item-separator` | |
| Content containers (form section, fieldset, accordion item, tab panel, article) | `--content-radius`, `--content-padding`, `--content-heading-gap`, `--content-gap`, `--content-section-gap`, `--content-measure` | `--content-measure` is the longest comfortable line of text |
| Cards (one self-contained unit in the layout) | `--card-radius`, `--card-padding`, `--card-gap`, `--card-border` | |
| Floating (popover, menu dropdown, tooltip) | `--floating-radius`, `--floating-padding`, `--floating-shadow` | |
| Dialogs and sheets | `--dialog-radius`, `--dialog-padding` | |
| Panels (sidebar, header bar, page region) | `--panel-padding`, `--panel-gap` | |
| Wells (code block, read-only value) | `--well-bg`, `--well-radius` | |

A theme stylesheet also declares `color-scheme: light dark` on `:root`, and `.dark-theme` / `.light-theme` rules that set `color-scheme` to one mode.

## Scale and Roles

The `--space-*` and `--radius-*` steps are a scale that only the role variables (`--control-*`, `--item-*`, `--content-*`, `--card-*`, `--floating-*`, `--dialog-*`, `--panel-*`, `--well-*`) refer to. A component uses the role variables of its tier, never the scale directly. Which tier a component belongs to is in [Design Language](DesignLanguage.md#component-tiers).

A variable is used only for what it is for. A purpose no variable covers gets a new variable here rather than borrowing one meant for something else.

## Tones

An element with a `data-tone` attribute gets `--tone` and `--tone-soft` from the status pair of that tone (`warn` takes `--status-warning`), and the theme stylesheet sets them. Anything coloured by tone uses only those two. What the tones mean is in [Design Language](DesignLanguage.md#tones).

## Data Series

A chart colours its series `--series-1`, `--series-2` and so on, in the order the series are given. The order keeps neighbouring series apart for colour-blind readers, so it is never shuffled, and a series keeps its colour when others are filtered out. A chart with more series than colours folds the rest into one. Status colours are never used for a series.

## Component Variables

A component may expose variables of its own for what is specific to it. Their defaults come from the shared variables, so switching mode or theme reaches them without an override.

## Styling Hooks

A component rendering into Shadow DOM is styled through its variables and its named `::part()`s. A component rendering into the light DOM is styled with ordinary selectors on what it renders.
