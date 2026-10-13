# Components

Pre-built Web Components for common UI patterns.

## Data Display

| Component | Tag | Description |
|-----------|-----|-------------|
| [Table](data-display/Table.md) | `<r-table>` | Records with sortable headers and a pager, from memory or a server |
| [Treeview](data-display/Treeview.md) | `<r-treeview>` | Hierarchy with expand/collapse, selection and search |

## Navigation

| Component | Tag | Description |
|-----------|-----|-------------|
| [Tabs](navigation/Tabs.md) | `<r-tabs>` | Labelled panels shown one at a time |
| [TopMenu](navigation/TopMenu.md) | `<r-top-menu>` | Menu bar with sliding submenus |

## Feedback

| Component | Tag | Description |
|-----------|-----|-------------|
| [Spinner](feedback/Spinner.md) | `<r-spinner>` | Dims content under a spinner while it loads |

## Dashboard Components

| Component | Tag | Description |
|-----------|-----|-------------|
| [Card](Card.md) | `<r-card>` | Overview card with heading, lead and a link to the full list |
| [KPI Meter](KpiMeter.md) | `<r-kpi-meter>` | One figure against the same period last year |
| [Line Chart](LineChart.md) | `<r-line-chart>` | Amounts over time with legend, hover read-out and a table for screen readers |
| [Period Grid](PeriodGrid.md) | `<r-period-grid>` | A year's periods and how far each has come |
| [Days Left](DaysLeft.md) | `<r-days-left>` | Days to a deadline, toned by urgency |
| [Status Mark](StatusMark.md) | `<r-status-mark>` | Where something stands, with an icon and a note |
| [Amount](Amount.md) | `<r-amount>` | A money amount formatted for the locale |
| [Icon](Icon.md) | `<r-icon>` | A line icon by name |

Numbers, amounts and dates follow one [formatting configuration](Formatting.md), and the words components show come from the Relaxjs i18n namespace `r-components`.

## Routing Components

| Component | Tag | Description |
|-----------|-----|-------------|
| [RouteTarget](https://github.com/relax-js/core/blob/main/lib/routing/RoutingTarget.md) | `<r-route-target>` | Renders routed components |
| [RouteLink](https://github.com/relax-js/core/blob/main/lib/routing/RouteLink.md) | `<r-link>` | Client-side navigation link |

## Patterns

| Pattern | Description |
|---------|-------------|
| [Popover](PopoverPattern.md) | Native popover API for dropdowns, tooltips, and popup menus |

## Authoring

Writing a component for this library: see [Authoring](../authoring/README.md).

## Theming

All components follow one shared theme and design language: see [Theming](../authoring/Theming.md) and [Design Language](../authoring/DesignLanguage.md). To change the look in your app, see [Customizing](Customizing.md).
