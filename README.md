# @relax.js/components

The UI pieces a business web app needs, built as native Web Components: tables and trees for records, menus and tabs for navigation, loading feedback, and figures, meters and charts for dashboards.

They are made for [Relax.js](https://github.com/relax-js/core) apps, but every one is a plain custom element. Put a tag in any page, with any framework or none, and it works.

## Why Use It

- **No framework to buy into.** Components build on what the browser already has: a table is a native `<table>`, menus use the Popover API, modals use `<dialog>`, inputs take part in native forms. There is nothing to learn beyond HTML, and nothing to migrate away from later.
- **One look, yours to change.** Every component follows one design language and one theme stylesheet, so a page built from them looks like one product. Change a colour once and every component follows; light and dark mode come with it.
- **Speaks your users' language.** Numbers, amounts and dates follow one locale and currency setting, and the words components show are translatable. English and Swedish ship with the package.
- **Server data without glue code.** Give a table an async function, and it asks for each page and sort order as the user needs them, cancelling loads it no longer wants. An existing Relax.js `DataLoader` plugs straight in.
- **Accessible by default.** What the user can see (selected, expanded, loading) is reflected as ARIA state, focus is always visible, and charts carry a table for screen readers.
- **Easy to use correctly, by people and by coding agents.** Every component has one doc in the same shape, typings for every tag and event, and a `custom-elements.json` manifest. A wrong attribute value is logged with what is wrong, never silently guessed at.

## Install

```bash
npm install @relax.js/components @relax.js/core
```

```typescript
import '@relax.js/components';
```

```css
@import "@relax.js/components/theme.css";
```

Importing the package registers every tag. ES modules only.

```html
<r-tabs>
    <r-tab label="Overview">...</r-tab>
    <r-tab label="Details">...</r-tab>
</r-tabs>
```

## Learn More

- [Manual](docs/manual/Components.md): every component, with usage, attributes, events and styling hooks.
- [Formatting](docs/manual/Formatting.md): locale, currency and translations.
- [Customizing](docs/manual/Customizing.md): colours, dark mode and restyling one component.
- [Authoring](docs/authoring/README.md): writing or changing a component in this library.
- [CHANGELOG](CHANGELOG.md): what changed between versions.

## License

MIT
