# Demos

Three small applications built with `@relax.js/components` and `@relax.js/core`, each showing a different side of the two together. They run against the components' source in `src/`, so a change there shows up in a running demo without a build. Each demo's backend runs inside the Vite dev server (`mock/`), with its data kept in memory.

| Demo | Run | Shows |
|------|-----|-------|
| [Ops dashboard](ops-dashboard) | `npm run demo:ops` (port 5301) | Live data over Server-Sent Events: stat tiles, meters, status grid, line chart and incident banners that update every second from one shared service. Plus heatmap, bar and area charts, KPI meters, and a certificate list mixing templates with days-left and status marks. |
| [Back office](back-office) | `npm run demo:office` (port 5302) | An order desk: a server-paged and sorted table with filters, an order page with tabs and an actions menu, an edit form routed into a dialog (`FormValidator` with server-side errors in the summary), a three-step new-order flow that reads order lines from a CSV in the browser, a category tree with products, and settings rows behind section navigation. |
| [Finance tracker](finance-tracker) | `npm run demo:finance` (port 5303) | English and Swedish, switched at runtime: typed copy for fixed text, ICU plurals through `t()`, and every amount, date and component word changing with the locale. Period grid, budget meters, horizontal bar chart, sparklines and a balance line chart. |

| Ops dashboard | Back office | Finance tracker |
|---------------|-------------|-----------------|
| ![Ops dashboard](screenshots/ops-dashboard-light.png) | ![Order list](screenshots/back-office-light.png) | ![Household budget](screenshots/finance-tracker-light.png) |
| ![Ops dashboard, dark](screenshots/ops-dashboard-dark.png) | ![Order list, dark](screenshots/back-office-dark.png) | ![Household budget, dark](screenshots/finance-tracker-dark.png) |

`npm run demo:screenshots` takes these again, in light and dark, after a design change.

## Disco

[disco](disco) (`npm run demo:disco`, port 5305) shows how far a theme reaches. It loads only `theme-sizes.css` and works out every colour variable from one hue that keeps turning. Stat tiles, an equalizer bar chart, a dance-floor heatmap and meters pulse to the beat in colours that cycle through the spectrum, over drifting gradients, sweeping spotlights and a mirror ball. None of the components knows about any of it.

## Component gallery

[gallery](gallery) is not an application: it draws each component in its main states, one state per stage. `npm run demo:gallery` (port 5304) shows them all on one page, and `?shot=r-table/sorted` shows one alone.

`npm run docs:screenshots` captures every state to `docs/manual/images/`, in the folders of `src/` (`data-display/table/sorted.png`), and rewrites the generated parts of the manual: each `<!-- screenshots: r-tag -->` block and [Gallery.md](../docs/manual/Gallery.md). The manual ships in the package but the images do not: the manual links them on GitHub's main branch, so a new image shows there once it is pushed. Run it after a change to how a component looks; `npm run docs:screenshots -- r-table` takes one component's shots only. To show a new state, add it to `gallery/src/shots.ts`. To put a component's shots on its manual page, add an empty block there:

```markdown
<!-- screenshots: r-meter -->
<!-- /screenshots -->
``` `npm run demo:check` type-checks all three. `tests/demos` checks every template against its view model and that each translation has the same keys as English.

## How they are put together

- `index.html` holds the page shell and `<r-route-target>`. Pages are created by the router after startup.
- `main.ts` imports services before components, then sets up formatting and i18n, then routing.
- Services use `@ContainerService`. Components get them with `@Inject` and never construct them.
- Widgets that show the same data watch one service rather than each other.
- `shared/demoConfig.ts` lowers decorators for the browser: Vite's dev transform otherwise leaves them in the code.
