# @relax.js/components

The UI pieces a business web app needs, built as native Web Components: tables and trees for records, menus and tabs for navigation, loading feedback, and figures, meters and charts for dashboards.

They are made for [Relax.js](https://github.com/relax-js/core) apps, but every one is a plain custom element. Put a tag in any page, with any framework or none, and it works.

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="demos/screenshots/ops-dashboard-dark.png">
    <img alt="A live operations dashboard built from stat tiles with sparklines, a line chart against a capacity threshold, meters and a service status grid" src="demos/screenshots/ops-dashboard-light.png">
</picture>

The [demos](demos/README.md) show three complete apps built with these components: a live ops dashboard, an order desk and a household budget in English and Swedish.

## Why Use It

- **No framework to buy into.** Components build on what the browser already has: a table is a native `<table>`, menus use the Popover API, modals use `<dialog>`, inputs take part in native forms. There is nothing to learn beyond HTML, and nothing to migrate away from later.
- **One look, yours to change.** Every component follows one design language and one theme stylesheet, so a page built from them looks like one product. Change a colour once and every component follows; light and dark mode come with it.
- **Speaks your users' language.** Numbers, amounts and dates follow one locale and currency setting, and the words components show are translatable. English and Swedish ship with the package.
- **Server data without glue code.** Give a table an async function, and it asks for each page and sort order as the user needs them, cancelling loads it no longer wants. An existing Relax.js `DataLoader` plugs straight in.
- **Accessible by default.** What the user can see (selected, expanded, loading) is reflected as ARIA state, focus is always visible, and charts carry a table for screen readers.
- **Nothing hidden to reason about.** Each component is a plain custom element with the lifecycle documented on MDN: no base class, no reactivity, no store. It redraws when you change its attributes, properties or content, or switch language, and at no other time.
- **Every connection is one search away.** Tags, `r-` event names and their event classes are literal names, registered in TypeScript's element and event maps and listed in the shipped `custom-elements.json`. The compiler checks what a listener reads, and a search finds every use.
- **Failures you can see and test.** A wrong attribute value is never thrown or guessed around: the component renders empty and reports `<tag>: <what is wrong>` through the same Relax.js error channel as the rest of your app, so it reaches `onError()` and `window.relaxErrors`, and a test asserts on it with `captureRelaxErrors()`.

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

Importing the package registers every tag. To pay only for the elements you use, import them one by one instead, such as `import '@relax.js/components/card'`; the [manual](https://github.com/relax-js/components/blob/main/docs/manual/Components.md) names each import. ES modules only.

An app with its own palette loads `@relax.js/components/theme-sizes.css` alone and sets the colour variables itself; see [Customizing](https://github.com/relax-js/components/blob/main/docs/manual/Customizing.md).

```html
<r-tabs>
    <r-tab label="Overview">...</r-tab>
    <r-tab label="Details">...</r-tab>
</r-tabs>
```

## Working with a Coding Agent

Every component has one doc in the same shape, written so an agent can use it from the doc and the typings alone. The package also ships a skill covering the mistakes an agent makes from habit, such as passing a list as an attribute or reading `event.detail`. Copy `node_modules/@relax.js/components/skills/relaxjs-components/` into your agent's skills folder (`.claude/skills/` for Claude Code), or point its instruction file at the `SKILL.md` in it. Install the Relax.js core skills alongside it with `npx @relax.js/core init-agents`.

## Learn More

- [Manual](docs/manual/Components.md): every component, with usage, attributes, events and styling hooks.
- [Formatting](docs/manual/Formatting.md): locale, currency and translations.
- [Customizing](docs/manual/Customizing.md): colours, dark mode and restyling one component.
- [Authoring](docs/authoring/README.md): writing or changing a component in this library.
- [CHANGELOG](CHANGELOG.md): what changed between versions.

## License

MIT
