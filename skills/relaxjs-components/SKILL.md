---
name: relaxjs-components
description: Using the ready-made r-* Web Components from @relax.js/components (tables, tree views, tabs, menus, dialogs, banners, charts, meters and other dashboard elements) in an app. Use when putting an r-* tag on a page, giving one data, listening to its events, styling or translating it, or when one renders empty.
---

# Using @relax.js/components

Every component is a plain custom element with its own doc in
`@relax.js/components/docs/manual/`. Start at `Components.md`, then read the one doc for the tag
you use: it lists every attribute, property, event and styling hook. The typings and
`custom-elements.json` say the same.

## Nothing shows until both are loaded

`import '@relax.js/components'` registers every tag; a page that only uses the tags in HTML still
needs it. To load fewer, import each element by its name in `Components.md`, such as
`import '@relax.js/components/card'`. The look comes from `@relax.js/components/theme.css`.
Without it the components work but look broken. An app with its own design tokens loads
`theme-sizes.css` alone and points the colour variables at its tokens.

## Lists go in properties, never attributes

A scalar (a number, a name, a flag) is an attribute. A list, series or record set is a property set
from code: `table.rows = records`, `chart.data = { labels, series, summary }`. A JSON string in an
attribute is not read, and the component stays empty. The one markup form is a tree view's
`<template name="data">` child holding JSON.

Server data for a table is a `provider`: an async function the table calls per page and sort. Do
not fetch pages yourself and set `rows`; pass the `signal` you are given on to `fetch`.

## Events are classes, not CustomEvent

Listen by the `r-` name and read typed properties on the event (`event.selectedIndex`,
`event.result`). There is no `event.detail`. The event class is exported next to its component.

## An empty component reported why

Bad input renders the component empty and is reported through the Relaxjs error channel as
`<tag>: <what is wrong>`, never thrown. In a browser, read `window.relaxErrors`. In a test, use
`captureRelaxErrors()` and assert on `captured.messages()` (see the **relaxjs-testing** skill).

## Words and numbers are configured once

Call `configureFormatting({ locale, currency })` before components draw, and load the
`r-components` i18n namespace after `setLocale()`. Text you pass in (column titles, menu labels) is
shown as given: translate it first.

## Detail

- `@relax.js/components/docs/manual/Components.md` for every component
- `@relax.js/components/docs/manual/Formatting.md` for locale, currency and words
- `@relax.js/components/docs/manual/Customizing.md` for colours, dark mode and styling hooks
