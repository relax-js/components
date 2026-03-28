# Components

Pre-built Web Components for common UI patterns.

## UI Components

| Component | Tag | Description |
|-----------|-----|-------------|
| [TreeView](TreeView.md) | `<r-treeview>` | Hierarchical tree with expand/collapse and search |
| [TabsContainer](TabsContainer.md) | `<r-tabs>` | Tab panels for organizing content |
| [TopMenu](TopMenu.md) | `<r-top-menu>` | Horizontal navigation menu bar |
| [Table](Table.md) | `<r-table>` | Data table with declarative columns and pagination |
| [Spinner](Spinner.md) | `<r-spinner>` | Loading overlay with customizable spinner |

## Routing Components

| Component | Tag | Description |
|-----------|-----|-------------|
| [RouteTarget](https://github.com/relax-js/core/blob/main/lib/routing/RoutingTarget.md) | `<r-route-target>` | Renders routed components |
| [RouteLink](https://github.com/relax-js/core/blob/main/lib/routing/RouteLink.md) | `<r-link>` | Client-side navigation link |

## Patterns

| Pattern | Description |
|---------|-------------|
| [Popover](PopoverPattern.md) | Native popover API for dropdowns, tooltips, and popup menus |

## Creating Custom Components

Use the `r-` prefix for custom components:

```typescript
class MyCustomList extends HTMLElement {
    static formAssociated = true;

    connectedCallback() {
        // Setup
    }

    get value() { return this._value; }
    set value(v) { this._value = v; }

    getData() { return this._data; }
    setData(data) { this._data = data; }
}

customElements.define('r-custom-list', MyCustomList);
```

For form components, see [Creating Form Components](https://github.com/relax-js/core/blob/main/lib/forms/creating-form-components.md).

## Theming

Components use CSS variables for consistent theming:

```css
:root {
    --surface-bg: #ffffff;
    --input-bg: #f5f5f5;
    --accent-primary: #0066cc;
    --bd-muted: #e0e0e0;
}

.dark-theme {
    --surface-bg: #1a1a1a;
    --input-bg: #2d2d2d;
    --accent-primary: #4da6ff;
    --bd-muted: #404040;
}
```
