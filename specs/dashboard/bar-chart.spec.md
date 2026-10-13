---
feature: Bar chart
status: verified
authored: planned
---

# Bar chart

## Goal
A reader compares amounts across categories as bars, side by side or stacked into totals, upright or laid sideways, and reads the exact values of any category on hover or, where the page asks for it, written beside each bar, while a screen reader user gets the same figures as a table.

## Drawing bars
- **Bar chart data**: the page sets the `data` property with `labels`, `series` and a `summary` as for the line chart, and a series whose number of values differs from the number of labels reports an error naming that series and nothing is drawn (docs/manual/dashboard/LineChart.md#Properties)
- **Shared chart rules**: the bar chart has the legend, series colours, read-out and value formats every chart has (specs/dashboard/chart-foundations.spec.md#Reading a chart)
- **Vertical by default**: bars stand upright over their labels, and `orientation="horizontal"` lays them sideways with the labels down the side
  - **Bad orientation**: an `orientation` other than `vertical` or `horizontal` reports an error naming the tag and draws nothing
  - **Attribute changed**: changing `orientation` or `stacked` on a drawn chart redraws it
- **Even bands**: each label gets a band of equal width along the label axis, with its bars centred in it
- **Grouped series**: with several series, each label's band holds one bar per series side by side, in series order
- **Stacked series**: with the `stacked` attribute, each label's band holds one bar with the series stacked on each other in series order
  - **Mixed signs in a stack**: positive values stack outward from zero on one side and negative values on the other, each in series order
- **Threshold series**: a `threshold` series is drawn as a dashed level across the plot, never as a bar and never stacked, and the `area` flag is ignored
- **Axis from zero**: the value axis starts at zero and ends on a round figure above the highest bar (docs/manual/dashboard/LineChart.md#Drawing)
  - **Negative values**: a negative value draws its bar below or left of zero, and the axis extends to a round figure below the lowest bar
- **Value labels where they fit**: with the `show-values` attribute, each bar's value is written just past its end in the read-out's format, and left out where the text would not fit within the bar's band or the plot
  - **Stacked segment**: in stacked mode the value is written inside its segment and left out where the segment is too small to hold it
- **Bar chart empty state**: data with no labels shows the empty state every chart has instead of axes, bars and legend (specs/dashboard/chart-foundations.spec.md#A chart with no data)

## Reading a bar
- **Band hover**: pointing anywhere in a label's band selects that label and shows the read-out with the label and every series' value
  - **Zero bar**: a label whose values are all zero is still selected and read out when pointed at
- **Bar chart without sight**: the chart is a figure named by the summary with the drawing hidden, and a visually hidden table holds the same figures (specs/dashboard/chart-foundations.spec.md#Reading a chart without sight)
