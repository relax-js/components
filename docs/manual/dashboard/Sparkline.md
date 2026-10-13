# Sparkline

The trend of one series as a small line without axes, grid or legend, the latest value marked. It fits in a table cell or beside a figure; a [stat tile](StatTile.md) draws one under its value.

## Screenshots

<!-- screenshots: r-sparkline -->
<!-- /screenshots -->

## Usage

```html
<r-sparkline id="cash"></r-sparkline>
```

```typescript
const spark = document.querySelector('#cash')!;
spark.data = {
    labels: ['Jan', 'Feb', 'Mar'],
    series: [{ name: 'Cash', values: [4, 6, 5] }],
    summary: 'Cash over the quarter',
};
```

- The data is the shape every chart takes, with exactly one series. More than one series reports an error naming the tag and draws nothing.
- The line runs from the series' own lowest value at the bottom to its highest at the top, not from zero. Equal values draw a level line through the middle; a single value draws only the marker.
- A `null` value breaks the line. The marker sits on the last value that is present.
- The line and marker take `--series-1`, never a tone colour, even inside a toned card.
- Pointing at the line shows a read-out for the nearest value.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `ChartData \| undefined` | What to draw; setting it on a connected sparkline redraws it. See [Line Chart](LineChart.md#properties) for the shape. |
| `valueFormat` | `(value: number) => string` | Formats the read-out and table values; plain numbers in the [configured locale](../Formatting.md) by default |

Data with no labels or no series shows the empty state every chart has.

## Parts

| Selector | What it is |
|----------|------------|
| `.line` | The line |
| `.marker` | The latest value's marker |
| `.readout` | The hover read-out, a floating surface |
| `.visually-hidden` | The figures for screen readers |

## Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--sparkline-width` | `6rem` | The drawing's width |
| `--sparkline-height` | `1.5rem` | The drawing's height |

The drawing stretches to that box without keeping a fixed shape.

## Accessibility

The sparkline is a `role="figure"` named by the summary, with the drawing hidden from screen readers and a visually hidden table holding one row per label.
