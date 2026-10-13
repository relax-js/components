# Customizing

How to change the look of the components in your app. What each variable is for is in [Theming](../authoring/Theming.md#variables); the default values are in the theme stylesheet.

## Loading the Theme

The theme ships as a stylesheet, `@relax.js/components/theme.css`. Load it before your own styles so your overrides win:

```css
@import "@relax.js/components/theme.css";
```

## Light and Dark Mode

The components follow the operating system's light or dark setting. Put `dark-theme` or `light-theme` on `<html>` or a container to force one mode inside it.

## Your Own Colours

Override a shared variable on `:root` or a container, giving both modes:

```css
:root {
    --accent-primary: light-dark(#0066cc, #4da6ff);
}
```

## One Component

A component's own variables change only that component. They are listed in its doc, for example `--spinner-size` in [Spinner](feedback/Spinner.md#variables).

## Inside a Component

A component rendering into Shadow DOM exposes named parts:

```css
r-tabs::part(tab) {
    padding: var(--control-padding);
}
```

## Replacing a Visual

A named slot replaces a default visual, such as the spinner's ring through the `spinner` slot.

## Table and Tree View

`r-table` and `r-treeview` render into the page itself, so ordinary selectors on what they render style them. Their own styles sit in the `relax-components` cascade layer, so any rule of yours wins without extra specificity. The selectors are listed under Parts in [Table](data-display/Table.md#parts) and [Treeview](data-display/Treeview.md#parts).
