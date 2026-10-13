---
feature: Heatmap
status: verified
authored: planned
---

# Heatmap

## Goal
A reader spots where values run high or low across two dimensions, such as weekday by hour, from a grid of coloured cells with a scale legend that says what each colour means, while the exact figure of any cell is a hover or a hidden table away, so the values are never told by colour alone.

## Reading the grid
- **Grid of cells**: the page sets row labels, column labels and one value per cell as the chart's data, and the heatmap draws one cell per row and column in the given order, coloured by its value (specs/dashboard/chart-foundations.spec.md#Reading a chart)
  - **Mismatched dimensions**: a row whose number of values differs from the number of column labels logs an error naming the tag and the heatmap renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
  - **Not a number**: a cell value that is neither a number nor missing logs an error and the heatmap renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Sequential scale**: by default the lowest value takes the low end of the scale, the highest value its high end, values between take a colour between them in proportion, and equal values take the same colour
  - **All values equal**: when every value is the same, every cell takes one colour and nothing logs an error
- **Diverging scale**: with the scale set to diverging, values above and below a midpoint, zero unless the page gives another, take colours of two different hues that grow stronger with distance from it, and the midpoint itself takes the middle colour
  - **Equal reach both sides**: the scale reaches as far below the midpoint as above it, so two values the same distance from the midpoint are equally strong
  - **Unknown scale**: a scale value other than sequential or diverging, or a midpoint that is not a number, is bad input that logs an error and renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Scale range**: the scale runs from the data's lowest to highest value unless the page fixes a minimum and maximum, so several heatmaps can share one scale
  - **Value outside fixed range**: a value beyond a fixed minimum or maximum takes the colour of that end, while its read-out and table still show the value itself
  - **Minimum not below maximum**: a fixed minimum equal to or above the fixed maximum is bad input that logs an error and renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Scale colours**: both scales take their colours from theme variables of their own, never from the series, status or accent variables (docs/authoring/Theming.md#Scale and Roles)
- **Missing value**: a cell without a value is marked as missing and drawn with no fill, so it never looks like the lowest value
- **Values in cells**: when the page turns them on, each cell writes its formatted value, and a value that does not fit inside its cell is left out

## Reading the scale
- **Scale legend**: a legend shows the colour scale with the formatted lowest and highest value of its range, and the midpoint as well in diverging mode
  - **No data in legend**: when any cell is missing, the legend also shows the missing cell's look with the no-data word from the `r-components` namespace
- **No series legend**: the heatmap shows its scale legend in place of the series legend other charts have (specs/dashboard/chart-foundations.spec.md#Reading a chart)

## Reading exact values
- **Per-cell hover**: pointing at a cell shows the read-out with its row label, column label and value, and leaving the grid hides it (specs/dashboard/chart-foundations.spec.md#Reading a chart)
  - **Missing cell read-out**: pointing at a missing cell shows the no-data word in place of the value
- **Plain number format**: by default the read-out, legend, cell values and table write values as plain numbers in the configured locale, and the page can give its own format instead
- **Summary required**: the heatmap is a figure named by the page's summary with the drawing hidden from screen readers, and data without a summary logs an error and draws nothing (specs/dashboard/chart-foundations.spec.md#Reading a chart without sight)
- **Hidden table**: a visually hidden table holds one row per row label and one column per column label with each cell's formatted value, and a missing cell's table cell is empty (specs/dashboard/chart-foundations.spec.md#Reading a chart without sight)
- **Empty heatmap**: data with no rows or no columns shows the empty state every chart has in place of the grid, the legend and the table (specs/dashboard/chart-foundations.spec.md#A chart with no data)
