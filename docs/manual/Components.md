# Components

Pre-built Web Components for common UI patterns. The manual's folders follow the package's: one folder per area, one page per element.

The [Gallery](Gallery.md) shows every component in its main states.

## Loading Them

`import '@relax.js/components'` registers every tag. To pay only for the elements a page uses, import each by the name in the Import column below, such as `@relax.js/components/card`. Each import registers its element and exports its types, events and helpers; code the elements share is loaded once.

```typescript
import '@relax.js/components/card';
import '@relax.js/components/badge';
import { Dialog } from '@relax.js/components/dialog';
```

The look comes from the theme stylesheet: see [Customizing](Customizing.md#loading-the-theme).

## Dashboard

| Component | Import | Description |
|-----------|--------|-------------|
| [Amount](dashboard/Amount.md) `<r-amount>` | `amount` | A money amount formatted for the locale |
| [Badge](dashboard/Badge.md) `<r-badge>` | `badge` | A short status or count that sits in the line |
| [Card](dashboard/Card.md) `<r-card>` | `card` | Overview card with heading, lead and a link to the full list |
| [Days Left](dashboard/DaysLeft.md) `<r-days-left>` | `days-left` | Days to a deadline, toned by urgency |
| [KPI Meter](dashboard/KpiMeter.md) `<r-kpi-meter>` | `kpi-meter` | One figure against the same period last year |
| [Meter](dashboard/Meter.md) `<r-meter>` | `meter` | Usage against a limit |
| [Period Grid](dashboard/PeriodGrid.md) `<r-period-grid>` | `period-grid` | A year's periods and how far each has come |
| [Stat Tile](dashboard/StatTile.md) `<r-stat-tile>` | `stat-tile` | One key figure and its change, with an optional trend |
| [Status Grid](dashboard/StatusGrid.md) `<r-status-grid>` | `status-grid` | Items as tiles, each in a state the app defines |
| [Status Mark](dashboard/StatusMark.md) `<r-status-mark>` | `status-mark` | Where something stands, with an icon and a note |

### Charts

| Component | Import | Description |
|-----------|--------|-------------|
| [Line Chart](dashboard/LineChart.md) `<r-line-chart>` | `line-chart` | Amounts over time as lines |
| [Area Chart](dashboard/AreaChart.md) `<r-area-chart>` | `area-chart` | Amounts over time as stacked bands |
| [Bar Chart](dashboard/BarChart.md) `<r-bar-chart>` | `bar-chart` | Amounts across categories, grouped or stacked |
| [Heatmap](dashboard/Heatmap.md) `<r-heatmap>` | `heatmap` | A grid of cells coloured by value |
| [Sparkline](dashboard/Sparkline.md) `<r-sparkline>` | `sparkline` | One series' trend as a small line |

Every chart has a legend or scale, a hover read-out, and the same figures as a table for screen readers.

## Data Display

| Component | Import | Description |
|-----------|--------|-------------|
| [Table](data-display/Table.md) `<r-table>` | `table` | Records with sortable headers and a pager, from memory or a server |
| [Treeview](data-display/Treeview.md) `<r-treeview>` | `treeview` | Hierarchy with expand/collapse, selection, lazy branches and search |

## Feedback

| Component | Import | Description |
|-----------|--------|-------------|
| [Banner](feedback/Banner.md) `<r-banner>` | `banner` | A notice about the whole page |
| [Spinner](feedback/Spinner.md) `<r-spinner>` | `spinner` | Dims content under a spinner while it loads |

## Forms

| Component | Import | Description |
|-----------|--------|-------------|
| [File Input](forms/FileInput.md) `<r-file-input>` | `file-input` | Reads a chosen or dropped file in the browser |
| [Step](forms/Step.md) `<r-step>` | `step` | One validated step of a multi-step flow |

## Layout

| Component | Import | Description |
|-----------|--------|-------------|
| [Dialog](layout/Dialog.md) `<r-dialog>` | `dialog` | A modal whose content exists only while open; confirmations; routes in a dialog |
| [Setting Row](layout/SettingRow.md) `<r-setting-row>` | `setting-row` | One setting with its state and a form to change it |

## Navigation

| Component | Import | Description |
|-----------|--------|-------------|
| [Dropdown Menu](navigation/DropdownMenu.md) `<r-dropdown-menu>` | `dropdown-menu` | A button opening a short panel of items |
| [Section Nav](navigation/SectionNav.md) `<r-section-nav>` | `section-nav` | A row of links to the sections of one area |
| [Side Menu](navigation/SideMenu.md) `<r-side-menu>` | `side-menu` | A titled list of links at the side of the page |
| [Tabs](navigation/Tabs.md) `<r-tabs>` | `tabs` | Labelled panels shown one at a time |
| [TopMenu](navigation/TopMenu.md) `<r-top-menu>` | `top-menu` | Menu bar with sliding submenus |

## Foundations

| Component | Import | Description |
|-----------|--------|-------------|
| [Icon](foundations/Icon.md) `<r-icon>` | `icon` | A line icon by name |
| [Formatting](Formatting.md) | `formatting` | Locale and currency for every number, amount and date |

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
