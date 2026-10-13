# Days Left

How many days remain to a deadline, toned by how urgent it is.

## Usage

```html
<r-days-left days="5"></r-days-left>
```

Reads "5 days", with the `days` text from the [`r-components` namespace](Formatting.md#words). The tone comes from `deadlineTone(days, urgent = 7, soon = 14)`, which is also exported:

- within `urgent` days: `danger`, no slack left
- within `soon` days: `warn`, it has to be on this week's list
- later: `muted`, it is just a date

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | `number` | | Whole days left. Changing it updates the text and tone. A value that is not a whole number logs an error and clears the text. |
| `urgent` | `number` | `7` | Days within which the deadline is `danger` |
| `soon` | `number` | `14` | Days within which the deadline is `warn` |

## Parts

The element itself carries `data-tone`.

## Accessibility

The number of days is always written out, so urgency never rests on colour.
