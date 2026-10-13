---
feature: Stat tile
status: verified
authored: planned
---

# Stat tile

## Goal
A reader scans a row of key figures on an overview page, each in its own tile showing the figure, how it changed against a period the page names, and, where it helps, a small trend line, so the reader can see without relying on colour which figures moved the right way. The tile reuses the KPI meter's comparison instead of defining its own.

## Reading a key figure
- **Tile inputs**: `<r-stat-tile>` reads `label`, `value`, `previous` and `better`, where `better` is `higher` by default or `lower` when a rise is bad news
  - **Not a number**: a `value` or `previous` that is not a JavaScript number literal logs an error and the tile renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
  - **Unknown better**: a `better` other than `higher` or `lower` logs an error and the tile renders empty
  - **Missing label**: a tile without a `label` logs an error and renders empty
- **Tile content**: the tile shows the label, the value written as a plain grouped number in the configured locale, and the change against the period, such as "+4 % vs last month"
- **Change text**: the change is written the way the KPI meter writes it, as a whole percent of the previous figure in the locale's percent format with its sign always shown and a real minus sign, such as `+4 %` in Swedish and `+4%` in English (specs/dashboard/kpi-meter.spec.md#Reading a figure against last year)
  - **Previous is zero**: when `previous` is 0 the change reads ±0, never infinity
- **Change tone**: the change carries `data-tone` `ok` when the figure moved the way `better` asks for or stayed level, and `danger` otherwise (specs/dashboard/kpi-meter.spec.md#Reading a figure against last year)
- **Change message**: the change and the period name are written as one `r-components` message with placeholders, never joined from separate words (docs/authoring/TextAndValues.md#Messages with Values)
- **Period name**: the `period` attribute names the period compared against and is shown exactly as given
  - **No period**: without `period` the tile reads "last year" from the namespace
- **No comparison**: a tile without `previous` shows its label and value and leaves the change out, without logging an error
- **Card tier**: the tile takes its radius, padding, gap and border from the `--card-*` role variables and casts no shadow (docs/authoring/DesignLanguage.md#Component Tiers)
- **Not interactive**: the tile cannot be focused, sends no events and does not change its background under the pointer (docs/authoring/DesignLanguage.md#Hover)

## Showing a trend
- **Trend line**: chart data set as the `trend` property, the same data a sparkline takes, is drawn as a sparkline under the figure (specs/dashboard/sparkline.spec.md#Showing a trend)
  - **No trend**: a tile without a trend leaves the space out rather than drawing an empty sparkline
  - **Bad trend**: a `trend` the sparkline cannot draw is reported and the tile renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
