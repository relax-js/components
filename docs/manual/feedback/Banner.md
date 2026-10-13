# Banner

A notice about the whole page, drawn as a strip: the tone's icon, the message, and an optional action, such as planned maintenance or an expiring plan. For a message about one field or record, put a [status mark](../dashboard/StatusMark.md) beside it instead.

## Screenshots

<!-- screenshots: r-banner -->
<!-- /screenshots -->

## Usage

```html
<r-banner tone="warn" dismissible>
    Maintenance tonight at 22:00.
    <a slot="action" href="/status">Details</a>
</r-banner>
```

```typescript
document.querySelector('r-banner')!.addEventListener('r-banner-dismiss', () => rememberDismissed());
```

- The banner's own children are the message, left as the page wrote them, so a message may hold a link.
- The tone's icon is shown before the message. Changing `tone` updates the icon, `data-tone` and role in place.
- A dismissal is not remembered: the same banner on a new page load shows again unless the page leaves it out.
- Moving the banner in the DOM never adds a second icon or close button.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `tone` | `ok \| info \| warn \| danger \| muted` | `muted` | The banner's tone, carried as `data-tone`. An unknown tone reports an error and the banner is `muted`. |
| `dismissible` | `boolean` | | Shows a close button that hides the banner and dispatches `r-banner-dismiss` |

## Events

### r-banner-dismiss

Dispatched as `BannerDismissEvent` when the user closes the banner with its close button, after `hidden` is set. Bubbles. It carries no properties.

## Slots

| Slot | Description |
|------|-------------|
| *(default)* | The message |
| `action` | A direct child with `slot="action"` is moved to the end of the strip. An element marked deeper down stays where it is. |

## Parts

| Selector | What it is |
|----------|------------|
| `r-banner[data-tone]` | The strip, carrying its tone |
| `r-icon.banner-icon` | The tone's icon |
| `button.banner-close` | The close button, named by the `close` text from the [`r-components` namespace](../Formatting.md#words) |

## Variables

The banner takes `--panel-padding` and `--panel-gap`, is filled with `--tone-soft` and edged with `--tone`, and casts no shadow. See [Theming](../../authoring/Theming.md#variables).

## Accessibility

A `warn` or `danger` banner has `role="alert"`; any other tone has `role="status"`.
