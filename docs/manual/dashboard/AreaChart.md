# Area Chart

Amounts over time as stacked bands, so the top edge reads as the total, or as one shaded area for a single series. For series that should not add up, use a [line chart](LineChart.md).

## Screenshots

<!-- screenshots: r-area-chart -->
<!-- /screenshots -->

## Usage

```html
<r-area-chart id="spending"></r-area-chart>
```

```typescript
const chart = document.querySelector('#spending')!;
chart.data = {
    labels: ['Jan', 'Feb', 'Mar'],
    series: [
        { name: 'Rent', values: [10000, 10000, 10500] },
        { name: 'Food', values: [5200, 6100, 5800] },
        { name: 'Limit', values: [18000, 18000, 18000], threshold: true },
    ],
    summary: 'Spending by kind, under the limit every month.',
};
```

- Each series is a band drawn on top of the ones before it, in the order given: the first sits on the zero line and the top edge of the last is the total.
- A single series is a line with the space between it and zero shaded; negative values dip below zero and the axis extends to cover them.
- A `threshold` series is a dashed line over the bands, outside the stack and the total.
- Areas have no point markers. The value axis starts at zero and ends on a round figure, the same way the [line chart](LineChart.md#drawing) does.
- A pointer anywhere in the plot's height selects the nearest label and shows a crosshair and read-out there.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `AreaChartData` | What to draw; setting it on a connected chart redraws it |
| `axisFormat` | `(value: number) => string` | Formats the axis labels; whole amounts without the unit by default |
| `valueFormat` | `(value: number) => string` | Formats the read-out and table values; whole amounts with the unit by default |

```typescript
interface AreaChartSeries { name: string; values: number[]; threshold?: boolean }
interface AreaChartData { labels: string[]; series: AreaChartSeries[]; summary: string }
```

A series whose number of values differs from the number of labels reports an error naming that series and nothing is drawn. The default formats follow the [formatting configuration](../Formatting.md).

## Parts

| Selector | What it is |
|----------|------------|
| `.series-{n}` | One series, numbered from 1 in the order given |
| `.area`, `.line` | A series' shaded band and its top line |
| `.threshold` | A threshold series |
| `.crosshair` | The vertical line at the selected label |
| `ul.legend` | The legend, one `li.series-{n}` per series, with `.threshold` on threshold series |
| `.readout` | The hover read-out, a floating surface |
| `.visually-hidden` | The figures for screen readers |

## Accessibility

The chart is a `role="figure"` named by the summary, with the drawing hidden from screen readers and a visually hidden table holding one row per label and one column per series, plus a total column when the series stack.
