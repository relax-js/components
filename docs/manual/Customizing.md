# Customizing

How to change the look of the components in your app. What each variable is for is in [Theming](../authoring/Theming.md#variables); the default values are in the theme stylesheets.

## Loading the Theme

The whole default theme ships as `@relax.js/components/theme.css`:

```css
@import "@relax.js/components/theme.css";
```

It is also split in two, for an app that brings its own palette:

| Stylesheet | Holds |
|------------|-------|
| `@relax.js/components/theme-sizes.css` | Spacing, corners, motion and the role variables built on them; no colours |
| `@relax.js/components/theme-colors.css` | The palette, `color-scheme`, and the switches that force light or dark |

Every theme variable sits in the `relax-theme` cascade layer, so a variable your app sets outside a layer wins whatever order the stylesheets load in. If your own styles are in cascade layers too, declare `relax-theme` first: `@layer relax-theme, app;`.

## Light and Dark Mode

The components follow the operating system's light or dark setting. Put `dark-theme` or `light-theme` on `<html>` or a container, or set `data-theme="dark"` or `data-theme="light"`, to force one mode inside it.

## Your Own Colours

Override a shared variable on `:root` or a container, giving both modes:

```css
:root {
    --accent-primary: light-dark(#0066cc, #4da6ff);
    --accent-text:    light-dark(#004f9e, #7fbfff);
}
```

`--accent-text` is the accent as text, such as a link; set it when your fill colour does not read well as text.

## An App with Its Own Theme

An app that already has design tokens loads only the sizes, and points the theme's colour variables at its own tokens once:

```css
@import "@relax.js/components/theme-sizes.css";

:root {
    --surface-bg:     var(--app-background);
    --surface-raised: var(--app-panel);
    --text-primary:   var(--app-text);
    --accent-primary: var(--app-brand);
    /* … every colour variable in Theming */
}
```

Its own `color-scheme` and dark-mode switch then stay in charge. The tone rules (`[data-tone]` → `--tone`) need no copy: the components install them themselves.

The theme's names are generic (`--radius`, `--space-1`, `--series-1`, `--tone`). Where your tokens use the same names with other values, yours win, since they sit outside the theme's layer; check that the components still look right with them.

## One Component

A component's own variables change only that component. They are listed in its doc, for example `--spinner-size` in [Spinner](feedback/Spinner.md#variables) and `--card-heading-size` in [Card](dashboard/Card.md#variables).

## Inside a Component

A component rendering into Shadow DOM exposes named parts:

```css
r-tabs::part(tab) {
    padding: var(--control-padding);
}
```

## Replacing a Visual

A named slot replaces a default visual, such as the spinner's ring through the `spinner` slot.

## Components in the Light DOM

Most components render into the page itself, so ordinary selectors on what they render style them: `r-table`, `r-treeview`, `r-card`, `r-badge`, `r-banner`, the dashboard elements and charts, `r-dialog` and `r-setting-row`. Their own styles sit in the `relax-components` cascade layer, so any rule of yours outside a layer wins without extra specificity or a particular load order. The selectors each one renders are listed under Parts in its page, such as [Table](data-display/Table.md#parts) and [Card](dashboard/Card.md#parts).
