---
feature: Area chart
status: verified
authored: planned
---

# Area chart

## Goal
A reader sees how an amount over time is made up of its parts: several series stacked as bands, so the top edge reads as the total and each band as one part of it, or a single series as one shaded area.

## Drawing areas
- **Same chart data**: the page sets the same `data` shape as the line chart, with `labels`, `series` and a `summary` (docs/manual/LineChart.md#Properties)
- **Mismatched series**: a series whose number of values differs from the number of labels logs an error naming that series and nothing is drawn (docs/manual/LineChart.md#Properties)
- **Stacked areas**: with several series, each series is a band drawn on top of the ones before it in the order given, so the first series sits on the zero line and the top edge of the last is the total
- **Single area**: a single series is drawn as a line with the space between it and zero shaded
  - **Below zero**: a single series with negative values dips below the zero line, shaded up to zero, and the axis extends down to cover it
- **Axis from zero**: the value axis starts at zero and ends on a round figure above the highest point drawn (docs/manual/LineChart.md#Drawing)
- **Threshold over the stack**: a `threshold` series is drawn as a dashed line over the bands, outside the stack and the total
- **No markers**: areas are drawn without point markers

## Reading values on hover
- **Snap to nearest**: a pointer anywhere in the plot's height selects the nearest label and shows a vertical crosshair there (docs/manual/LineChart.md#Hover)
