---
feature: Line chart
status: verified
authored: planned
---

# Line chart

## Goal
A reader follows amounts over time as lines, such as cash against the minimum it must stay above. They name each series from a legend and read the exact figures for a label by pointing anywhere above it. A screen reader user gets the same figures as a table, so the chart never holds information only the eye can reach.

## Drawing a chart
- **Chart data**: the page sets the `data` property with `labels`, `series` (each with `name`, `values` and optional `threshold` and `area`) and a `summary`, and setting it on a connected chart redraws it (docs/manual/LineChart.md#Properties)
- **Shared data rules**: the line chart reports mismatched series and bad values, and draws missing values, the way every chart does (specs/dashboard/chart-foundations.spec.md#Giving a chart its data)
- **Shared chart rules**: the line chart has the legend, series colours, five-series limit, hover read-out, value formats with their amount defaults and the round value axis every chart has (specs/dashboard/chart-foundations.spec.md#Reading a chart)
- **Plot layout**: the SVG has a 640×230 `viewBox` with padding of 72 left, 12 right, 12 top and 28 bottom, and a grid line and axis label at each step (docs/manual/LineChart.md#Drawing)
- **Even X labels**: X labels are spaced evenly across the plot (docs/manual/LineChart.md#Drawing)
  - **Single point**: a chart with one label puts it in the middle
- **Series order**: each series is drawn as `g.series.series-{n}`, numbered from 1 in the order given (docs/manual/LineChart.md#Parts)
- **Threshold series**: a `threshold` series is drawn dashed and without markers (docs/manual/LineChart.md#Drawing)
- **Area series**: an `area` series is shaded between its line and zero (docs/manual/LineChart.md#Drawing)
- **Point markers**: every series that is not a threshold has a marker of radius 4 at each point (docs/manual/LineChart.md#Drawing)
- **Legend**: `ul.legend` has one `li.series-{n}` per series, with `.threshold` added for threshold series (docs/manual/LineChart.md#Parts)

## Reading values on hover
- **Snap to nearest**: a pointer anywhere in the plot's height selects the nearest label (docs/manual/LineChart.md#Hover)
- **Read-out**: the selected label shows a vertical `.crosshair` and a `.readout` with the label and the value of every series, threshold series included (docs/manual/LineChart.md#Hover)
- **Crosshair hides**: the crosshair hides with the read-out on `pointerleave` and when the pointer is in the left or right padding, outside the plot (docs/manual/LineChart.md#Hover)

## Reading the chart without sight
- **Shared reading without sight**: the line chart is a figure named by its summary with the drawing hidden, and holds the hidden data table every chart has (specs/dashboard/chart-foundations.spec.md#Reading a chart without sight)
- **Data table**: the hidden data table is a `table.visually-hidden` (docs/manual/LineChart.md#Parts)

## A chart with no data
- **Line chart empty state**: data with no labels or no series shows the empty state every chart has instead of axes, lines and legend (specs/dashboard/chart-foundations.spec.md#A chart with no data)
