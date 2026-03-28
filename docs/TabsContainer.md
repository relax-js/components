# TabsContainer

A tab panel component for organizing content into switchable sections.

## Usage

```html
<r-tabs>
    <r-tab label="Overview">
        <p>Overview content here</p>
    </r-tab>
    <r-tab label="Details">
        <p>Detailed information</p>
    </r-tab>
    <r-tab label="Settings">
        <form><!-- Settings form --></form>
    </r-tab>
</r-tabs>
```

## Attributes

### r-tabs

| Attribute | Type | Description |
|-----------|------|-------------|
| `selected` | `number` | Zero-based index of the initially selected tab |

### r-tab

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | `string` | Text displayed in the tab header |

## Events

### tab-change

Fired when the selected tab changes.

```typescript
const tabs = document.querySelector('r-tabs');
tabs.addEventListener('tab-change', (e: CustomEvent) => {
    console.log('Selected tab index:', e.detail.selectedIndex);
});
```

## Programmatic Selection

### Via Attribute

```html
<r-tabs selected="1">
    <!-- Starts on second tab -->
</r-tabs>
```

```typescript
tabs.setAttribute('selected', '2');
```

## Styling

The component uses Shadow DOM. Override CSS variables for theming:

```css
r-tabs {
    --bd-muted: #e0e0e0;
}
```

Custom styles for tab headers:

```css
r-tabs::part(tab-header) {
    padding: 0.5rem 1rem;
}

r-tabs::part(tab-header):hover {
    background: var(--surface-hover);
}
```

## Components

### TabsContainer (r-tabs)

The container that manages tab state and renders the tab header bar.

### TabItem (r-tab)

Individual tab panels. Content is slotted and displayed when the tab is selected. The `selected` attribute is added/removed automatically by the parent container.
