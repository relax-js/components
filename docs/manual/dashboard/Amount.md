# Amount

A money amount grouped and formatted the way the locale writes it. Overviews show round figures, detail views show decimals, and a movement shows its sign.

## Output

What each element writes with formatting configured as `en-GB` and `EUR`:

| Markup | Text |
|--------|------|
| `<r-amount value="1285400">` | €1,285,400 |
| `<r-amount value="1285400.5" decimals="2">` | €1,285,400.50 |
| `<r-amount value="3200" signed>` | +€3,200 |
| `<r-amount value="-3200" signed>` | −€3,200 |
| `<r-amount value="0" signed>` | €0 |
| `<r-amount value="1285400" unit="none">` | 1,285,400 |

The minus is a real minus sign (U+2212), not a hyphen. `mark-negative` adds the class `negative` to a negative amount and leaves its look to the page.

## Usage

```html
<r-amount value="1285400"></r-amount>              <!-- 1 285 400 kr -->
<r-amount value="1285400.5" decimals="2"></r-amount>
<r-amount value="-3200" signed></r-amount>          <!-- −3 200 kr -->
<r-amount value="1285400" unit="none"></r-amount>  <!-- 1 285 400 -->
```

The formatting is also exported as a pure function:

```typescript
formatAmount(value: number, options?: {
    decimals?: 0 | 2; withUnit?: boolean; signed?: boolean; locale?: string; currency?: string
}): string
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `number` | | The amount. A value that is not a number reports an error and clears the text. |
| `decimals` | `0 \| 2` | `0` | Whole figures, or two decimals |
| `unit` | `none` | | `none` leaves the currency out |
| `signed` | flag | | Shows the sign of a non-zero amount both ways and none on zero; meant for a movement rather than a balance |
| `locale` | `string` | from [Formatting](../Formatting.md) | Overrides the configured locale |
| `currency` | `string` | from [Formatting](../Formatting.md) | Overrides the configured currency |

Changing any attribute reformats the amount.
