# Tabs

Splits content into labelled panels and shows one at a time, with a bar of headers to switch between them. Reach for it when the panels are alternatives the user moves between; for sections that can be open together, use native `<details>`.

## Usage

```html
<r-tabs selected="1">
    <r-tab label="Overview">...</r-tab>
    <r-tab label="Details">...</r-tab>
    <r-tab label="Settings">...</r-tab>
</r-tabs>
```

```typescript
const tabs = document.querySelector('r-tabs')!;
tabs.addEventListener('r-tab-change', (event) => {
    console.log('Now showing', event.tab.label, 'at', event.selectedIndex);
});
```

The header bar follows the tabs: adding, removing or relabelling an `r-tab` updates it.

## Attributes

### r-tabs

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected` | `number` | `0` | Zero-based index of the tab shown. Changing it switches tab. A value that is not the index of a tab reports an error and no tab is shown. |

### r-tab

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | `string` | Text of the tab's header. A tab without one reports an error and gets an empty header. |
| `selected` | `boolean` | Set by `r-tabs` on the tab shown, and removed from the others |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `tabs` | `Tab[]` (read only) | The `r-tab` children, in order |
| `selectedIndex` | `number` (read only) | Index of the tab shown, or `-1` while `selected` is invalid |

## Methods

### select(index)

Shows the tab at `index` and dispatches `r-tab-change` when it was not already shown. An index with no tab throws.

```typescript
tabs.select(2);
```

## Events

### r-tab-change

Dispatched as `TabChangeEvent` when a different tab is shown because of a click, the keyboard or `select()`. Changing the `selected` attribute directly dispatches nothing. Bubbles.

| Property | Type | Description |
|----------|------|-------------|
| `selectedIndex` | `number` | Index of the tab now shown |
| `tab` | `Tab` | The tab now shown |

## Slots

| Slot | Description |
|------|-------------|
| *(default)* | The `r-tab` panels |

## Parts

| Part | What it is |
|------|------------|
| `tablist` | The header bar |
| `tab` | Each header |
| `selected` | Added to the header of the tab shown, so `r-tabs::part(tab selected)` styles it |

```css
r-tabs::part(tab) {
    padding: var(--control-padding);
}
```

## Variables

Headers take the control variables, hover `--surface-hover`, the selected header `--surface-selected` with an `--accent-primary` underline, and the bar a `2px` `--bd-muted` line. The panels are open content containers spaced by `--content-gap`. See [Theming](../../authoring/Theming.md#variables).

## Accessibility

The tabs follow the WAI-ARIA tabs pattern: headers are `role="tab"` buttons with `aria-selected`, panels are `role="tabpanel"` named by their label, and only the selected header is in the tab order.

| Key | Action |
|-----|--------|
| Right / Left | Next / previous tab, wrapping around |
| Home / End | First / last tab |
