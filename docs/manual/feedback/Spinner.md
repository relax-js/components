# Spinner

Dims the content it wraps and shows a centered spinner while it loads. Wrap the area waiting for data, not the whole page, so the rest stays usable.

## Usage

```html
<r-spinner id="orders">
    <table>...</table>
</r-spinner>
```

```typescript
const spinner = document.querySelector('r-spinner')!;

spinner.loading = true;
try {
    renderOrders(await loadOrders());
} finally {
    spinner.loading = false;
}
```

### Your Own Spinner

Put an element in the `spinner` slot to replace the default ring:

```html
<r-spinner loading>
    <img slot="spinner" src="spinner.svg" alt="" />
    <div>Content</div>
</r-spinner>
```

The slotted element spins like the ring does.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `loading` | `boolean` | Shows the overlay while present |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `loading` | `boolean` | Mirrors the `loading` attribute |

## Slots

| Slot | Description |
|------|-------------|
| *(default)* | The content dimmed while loading |
| `spinner` | Replaces the default ring |

## Parts

| Part | What it is |
|------|------------|
| `overlay` | The dimming layer over the content |
| `ring` | The default ring |

```css
r-spinner::part(ring) {
    border-top-color: var(--status-info);
}
```

## Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--spinner-size` | `2.5rem` | Width and height of the ring |
| `--spinner-thickness` | `3px` | Width of the ring's line |

The overlay takes `--overlay-dim` and fades in over `--motion-base`; the ring is `--accent-primary` on a `--bd-muted` track. See [Theming](../../authoring/Theming.md#variables).

## Accessibility

- The spinner carries `aria-busy="true"` while loading and `false` otherwise.
- The dimmed content is `inert` while loading, so it can be neither clicked nor focused.
- The fade is dropped when the user prefers reduced motion.
