---
feature: Chart foundations
status: verified
authored: planned
---

# Chart foundations

## Goal
Every chart in the library reads the same way, so a page can use any of them without learning each one again. A reader names each series from a legend and reads exact values on hover. Amounts and other figures are written as the rest of the package writes them. Stacked series add up to a total that the reader can read. A screen reader user gets the same figures as a table along with the page's summary. Bad data is reported rather than drawn as if it were right, and a chart with nothing to show says so instead of drawing empty axes.

## Giving a chart its data
- **Mismatched series**: a series whose number of values differs from the number of labels logs an error naming the tag and that series, and nothing is drawn (docs/manual/LineChart.md#Properties)
- **Missing value**: a `null` value draws nothing at its label, so a line breaks there and a bar is left out, while the read-out shows the `noData` word for it and its table cell is empty
  - **Not a number**: any other value that is not a finite number logs an error naming the tag and its series, and nothing is drawn (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)

## Reading a chart
- **Series legend**: a chart with series shows a legend naming each series in the order given, beside its colour (docs/manual/LineChart.md#Parts)
- **Series colours**: series n is coloured with `--series-n` in the order given, and never with a status colour (docs/authoring/Theming.md#Data Series)
  - **Too many series**: data with more series than the theme's five series colours logs an error naming the tag, and nothing is drawn
- **Hover read-out**: pointing at the data shows a read-out naming what the pointer selects and its values, in legend order and in the value format, and leaving the plot hides it (docs/manual/LineChart.md#Hover)
  - **Near the right edge**: past 60 % of the chart's width the read-out sits to the left of the pointer
- **Read-out surface**: the read-out is a floating surface with the floating tier's radius, padding and shadow (docs/authoring/DesignLanguage.md#Component Tiers)
- **Value formats**: every chart takes `valueFormat` for the read-out, the table and any value written on the chart, and a chart with a value axis also takes `axisFormat` for its axis labels (docs/manual/LineChart.md#Properties)
- **Default amount format**: by default a chart of amounts writes its values with Amount's formatting as whole amounts in the configured currency, and leaves the currency off its axis (docs/authoring/TextAndValues.md#Values)
  - **Negative amount**: a negative value is written with Amount's real minus sign, never a hyphen
- **Default number format**: by default a chart of anything other than amounts writes its values as plain numbers, grouped as the configured locale groups them
- **Round value axis**: a value axis starts at zero and ends on a round figure above the highest value, with four steps by default, each step 1, 2, 2.5, 5 or 10 × 10ⁿ, and a top of `ceil(max / step) × step` (docs/manual/LineChart.md#Drawing)
  - **Values below zero**: the axis extends down past the lowest value to a round figure, in the same steps
  - **All zero**: when every value is zero the axis has top 1 and step 1

## Stacking series
- **Stacked axis**: in a stacked chart the value axis covers the largest stack at any label instead of the largest single value
- **Negatives stack below zero**: positive values stack up from zero and negative values stack down from it, each in series order, and the axis covers the lowest stack too
- **Threshold outside the stack**: a `threshold` series is never stacked and never counted in the total
- **Stacked read-out**: the read-out shows each series' own value, not its stacked height, and the label's total, introduced by a word from the `r-components` namespace
  - **Single stacked series**: with one series the read-out shows no total
  - **Total with a gap**: a missing value leaves the total as the sum of the values present
- **Total column**: the hidden table of a stacked chart has a total column after the series columns
  - **One series table**: with one series the table has no total column

## Reading a chart without sight
- **Figure with summary**: the chart is a figure whose accessible name is the summary the page gives, and the drawing itself is hidden from screen readers (docs/manual/LineChart.md#Accessibility)
- **Hidden data table**: a visually hidden table holds the same figures as the drawing in the value format, one row per label and one column per series (docs/authoring/DesignLanguage.md#Accessibility)
- **Table headers**: each series name heads its column and each label heads its row, so a screen reader reads every value with both
- **Missing summary**: a chart given data without a summary logs an error naming its tag and draws nothing (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)

## A chart with no data
- **Empty state**: data with no labels or no series shows the `noData` text in place of the plot, the legend and the table (docs/authoring/TextAndValues.md#Words)
  - **Data cleared**: setting empty data on a drawn chart replaces the drawing with the empty state
  - **Empty state announced**: the empty chart's accessible name is still the page's summary
