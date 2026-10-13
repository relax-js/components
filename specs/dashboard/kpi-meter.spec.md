---
feature: KPI meter
status: verified
authored: planned
---

# KPI meter

## Goal
A reader sees one key figure for this period next to the same period last year, and can tell at a glance, without relying on colour, whether it moved the right way.

## Reading a figure against last year
- **Change text**: the change is the difference from last year as a whole percent of last year's figure, written in the locale's percent format with its sign always shown and a real minus sign, such as `+12 %`, `−3 %` or `±0 %` in Swedish and `+12%` in English (docs/manual/KpiMeter.md#The Comparison)
  - **No previous year**: when `previous` is 0 the change reads ±0, never infinity
  - **Rounds to level**: a change that rounds to 0 reads ±0 and is toned `ok`, whichever way the figure moved before rounding
  - **Negative previous year**: the change is taken against the size of last year's figure, so a rise from −100 to 50 reads +150
- **Change tone**: the change and the bar are toned `ok` when the figure moved the way `better` asks for or stayed level, and `danger` otherwise (docs/manual/KpiMeter.md#The Comparison)
  - **Rising revenue**: with `better="higher"` a rise is `ok`
  - **Rising costs**: with `better="lower"` a rise is `danger`
  - **Better left out**: without `better`, a rise is `ok`
- **Bar scale**: the bar's scale is `max(value, previous, 1) × 1.15`, and this year's fill and last year's mark are percentages of it (docs/manual/KpiMeter.md#The Comparison)
  - **Negative figure**: a negative figure gives 0 %, never a negative percentage
- **Localised figures**: this year's and last year's figures are written as grouped numbers in the configured locale, with no currency (specs/dashboard/dashboard-foundations.spec.md#Formatting for a locale)
- **Previous year text**: the text under the bar, "{previous} last year", is one `r-components` message with the formatted previous figure as its value, never pieced together (docs/authoring/TextAndValues.md#Messages with Values)
- **Meter markup**: the meter shows `.label`, `.figures` with the formatted value and `.change[data-tone]`, a `.bar[data-tone]` whose `--fill` and `--mark` position `.this-year` and `.last-year`, and under it `.previous` (docs/manual/KpiMeter.md#Parts)
- **Bar hidden from screen readers**: the bar is hidden from assistive technology, since the written figures and change say the same
- **Attributes observed**: changing any attribute of a connected meter redraws it in place, without a second copy of its markup
- **Bad attributes reported**: a missing or invalid `label`, `value`, `previous` or `better` logs an error naming the meter and renders nothing (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
  - **Not a number**: a `value` or `previous` that is not a JavaScript number literal, such as `1 285 400`, is bad input
  - **Unknown better**: a `better` other than `higher` or `lower` is bad input
  - **Missing label**: a meter without a `label` is bad input

## Comparing from code
- **Comparison as a function**: the pure function `compareYears(value, previous, better)` returns the change, tone, fill and mark the meter shows for the same figures (docs/manual/KpiMeter.md#The Comparison)
- **Wrong use from code**: `compareYears` given a `value` or `previous` that is not a finite number, or a `better` other than `higher` or `lower`, throws an error naming the KPI meter (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
