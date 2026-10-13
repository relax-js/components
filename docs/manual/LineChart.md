# Line Chart

Amounts over time as lines, with a legend, a hover read-out, and the same figures as a table for screen reader users.

## Usage

```html
<r-line-chart id="cash"></r-line-chart>
```

```typescript
const chart = document.querySelector('#cash')!;
chart.data = {
    labels: ['Jan', 'Feb', 'Mar'],
    series: [
        { name: 'Cash', values: [410000, 385000, 432000], area: true },
        { name: 'Minimum', values: [300000, 300000, 300000], threshold: true }
    ],
    summary: 'Cash stayed above the minimum all quarter.'
};
```

### Drawing

- The SVG has a 640×230 `viewBox` with padding of 72 left, 12 right, 12 top and 28 bottom, and a grid line and axis label at each step.
- The Y axis ends on a round figure a person would say out loud, from `niceScale(max, steps = 4)`: the step is 1, 2, 2.5, 5 or 10 × 10ⁿ and the top is `ceil(max / step) × step`. When `max` is 0 or less the axis has top 1 and step 1.
- X labels are spaced evenly; a single label sits in the middle.
- Series are coloured `--series-1`, `--series-2` and so on in the order given, and the first series is the one the chart is about.
- A `threshold` series is a level to stay above, drawn dashed without markers. An `area` series is shaded under its line. Every other series has a marker of radius 4 at each point.

### Hover

- The pointer anywhere in the plot's height selects the nearest label, so nobody has to hit a marker.
- The selected label shows a vertical crosshair and a read-out with the label and every series' value. Past 60 % of the width the read-out sits to the left of the pointer.
- Both hide on `pointerleave` and when the pointer is outside the data.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `ChartData` | What to draw; setting it on a connected chart redraws it |
| `axisFormat` | `(value: number) => string` | Formats the axis labels; whole amounts without the unit by default |
| `valueFormat` | `(value: number) => string` | Formats the read-out and table values; whole amounts with the unit by default |

```typescript
interface ChartSeries { name: string; values: number[]; threshold?: boolean; area?: boolean }
interface ChartData { labels: string[]; series: ChartSeries[]; summary: string }
```

A series whose number of values differs from the number of labels logs an error naming that series and nothing is drawn. The default formats follow the [formatting configuration](Formatting.md).

## Parts

| Selector | What it is |
|----------|------------|
| `g.series.series-{n}` | One series, numbered from 1 in the order given |
| `ul.legend` | The legend, one `li.series-{n}` per series, with `.threshold` on threshold series |
| `.crosshair` | The vertical line at the selected label |
| `.readout` | The hover read-out, a floating surface |
| `table.visually-hidden` | The figures for screen readers |

## Accessibility

The chart is a `role="figure"` with the summary as its `aria-label`, and the SVG is `aria-hidden`. A visually hidden table holds the same data, one row per label and one column per series.
