# Component Contract

The rules every component in this library follows, so an app author or a coding agent can use a component from its doc and typings alone. How it looks is in [Design Language](DesignLanguage.md) and [Theming](Theming.md).

## Doc Shape

Each component has one doc in the manual with these sections, in this order, leaving out those the component has none of: Usage, Attributes, Properties, Methods, Events, Slots, Parts, Variables, Accessibility.

## One Way per Task

A component offers one declarative way to configure it and at most one programmatic way.

## Naming

Tags start with `r-`. A class is named after its tag without the prefix (`r-tabs` is `Tabs`, `r-treeview` is `Treeview`, `r-kpi-meter` is `KpiMeter`). Events are named in kebab-case with the `r-` prefix (`r-tab-change`) and carried by an `Event` subclass with typed properties rather than `CustomEvent.detail`.

## Typings

Every tag is registered in `HTMLElementTagNameMap` and every event in `HTMLElementEventMap`, and the package ships a `custom-elements.json` manifest.

## State in the DOM

State the user can see (selected, loading, expanded) is reflected as an attribute and as its ARIA state.

## Data In, Events Out

A parent passes data in through attributes, properties, methods and data providers: async functions the component calls for the data it needs, given an abort signal for a load it no longer needs. A component reports what happened through events.

A scalar, such as a number, a name or a flag, goes in an attribute. Structured data, such as a list or a series, goes in a property: setting it on a connected component redraws it, and data set before the component connects is drawn when it does.

## Drawing Once

A component that builds its own markup builds it once. Moving it in the DOM, which disconnects and reconnects it, never builds it again or duplicates what it added.

## Styling

A component rendering into the light DOM ships its own stylesheet, written with semantic class names that say what each part is (`.label`, `.figures`, `.legend`), and its doc lists those classes under Parts. How either kind is styled is in [Theming](Theming.md#styling-hooks).

## Text and Numbers

Every word a component writes comes from the Relaxjs i18n namespace `r-components`. Every number, amount and date it writes goes through the package's shared `Intl` formatters, using the configured locale and currency (see [Formatting](../manual/Formatting.md)). A component reads both when it draws and redraws on `localechange`. An attribute on one element overrides the configuration for that element. The rules are in [Text and Values](TextAndValues.md).

## Failing Loudly

Nothing wrong is ignored or patched over with a guessed value; how it is reported depends on who made the mistake.

- **Bad data:** an attribute value that is missing, not a number or not one of the allowed values logs `console.error("<tag>: <what is wrong>")` and the component renders empty. Such a value often comes from data or a template binding that nobody can wrap in a `try`, so a throw would break the page instead of one element.
- **Wrong use from code:** a method called with arguments it cannot act on, or configuration added too late, throws an error naming the component and what was wrong.
