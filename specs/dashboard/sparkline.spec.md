---
feature: Sparkline
status: verified
authored: planned
---

# Sparkline

## Goal
A reader sees the trend of one figure in a line small enough to sit beside text or inside a tile, with the latest value standing out.

## Showing a trend
- **Chart data**: the page sets the `data` property every chart takes, with labels, exactly one series and a summary (specs/dashboard/chart-foundations.spec.md#Reading a chart)
- **One series**: data with more than one series reports an error naming the tag and draws nothing (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Line without axes**: the values are drawn as one line with no axes, grid or labels
- **No legend**: the sparkline shows no legend
- **Fits its box**: the drawing stretches to the element's width and height without keeping a fixed shape
  - **No size given**: a sparkline the page gives no size takes the default width and height of its own component variables and is never drawn with zero height
- **Own range**: the lowest value sits at the bottom of the box and the highest at the top, rather than the line being measured from zero
  - **Flat series**: values that are all equal draw a level line through the middle
  - **Single value**: a series of one value draws only the latest-point marker, in the middle
- **Gaps**: a `null` value breaks the line at its label, its read-out shows the `noData` word and its table cell is empty (specs/dashboard/chart-foundations.spec.md#Giving a chart its data)
- **Latest point**: the last value carries a marker and no other value does
  - **Gap at the end**: when the last values are `null`, the marker sits on the last value that is present
- **Series colour**: the line and its marker take the first series colour and never a tone colour, even inside a toned tile or card (docs/authoring/Theming.md#Data Series)
- **Summary and table**: the sparkline has the summary and hidden table every chart has (specs/dashboard/chart-foundations.spec.md#Reading a chart without sight)
- **Empty sparkline**: a sparkline given data with no labels or no series shows the empty state every chart has (specs/dashboard/chart-foundations.spec.md#A chart with no data)
- **Hover read-out**: pointing at the line shows the read-out for the nearest value, written in the page's `valueFormat` or, without one, as a plain number in the configured locale (specs/dashboard/chart-foundations.spec.md#Reading a chart)
