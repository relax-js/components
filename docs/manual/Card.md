# Card

An overview card: what an area of the page is about, one sentence on why it matters, and a link to the full list, with the page's own content as the body.

## Usage

```html
<r-card heading="Invoices" lead="Three are past their due date." icon="file"
        link-text="All invoices" href="/invoices" tone="warn">
    <select slot="action">
        <option>This month</option>
        <option>This year</option>
    </select>
    <ul>
        <li>…</li>
    </ul>
</r-card>
```

The card puts a heading row before its existing children, which stay as the body. Moving the card in the DOM never adds a second heading row.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `heading` | `string` | The card's `<h2>` text |
| `lead` | `string` | One sentence under the heading; left out when empty or missing |
| `icon` | `string` | An [icon](Icon.md) name shown in the heading row; left out when empty or missing |
| `link-text` | `string` | Text of a link with an arrow icon in the heading row; the link is left out when empty or missing |
| `href` | `string` | Where the link goes; `#` when missing |
| `tone` | `ok \| info \| warn \| danger \| muted` | The card's accent, through `--tone` and `--tone-soft` |

## Slots

| Slot | Description |
|------|-------------|
| *(default)* | The card's body: every child not marked for another slot |
| `action` | A direct child with `slot="action"`, such as a select or a button, is moved into the heading row. An element marked deeper down stays where it is. |

## Parts

| Selector | What it is |
|----------|------------|
| `.card-head` | The heading row: icon, `hgroup`, action and link |
| `.card-head hgroup` | The `<h2>` heading and the lead paragraph |
| `.card-head a` | The link to the full list |

## Variables

The card takes its radius, padding, gap and border from the card tier's role variables, and its accent from `--tone` and `--tone-soft`.
