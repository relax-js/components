# Popover Pattern

Use the native Popover API for dropdowns, tooltips, and popup menus. No JavaScript is needed for basic show/hide, focus management, or click-outside-to-close.

## Basic Usage

```html
<button popovertarget="my-menu">Options</button>
<div id="my-menu" popover>
    <ul>
        <li>Edit</li>
        <li>Delete</li>
    </ul>
</div>
```

The browser handles:
- Toggling visibility when the button is clicked
- Closing when clicking outside (light dismiss)
- Closing on Escape key
- Focus management
- Placing the popover in the top layer (above all other content)

## In a Web Component

```typescript
class RDropdown extends HTMLElement {
    connectedCallback() {
        const id = `dropdown-${crypto.randomUUID()}`;

        this.innerHTML = `
            <button popovertarget="${id}">
                <slot name="trigger">Open</slot>
            </button>
            <div id="${id}" popover>
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('r-dropdown', RDropdown);
```

```html
<r-dropdown>
    <span slot="trigger">Settings</span>
    <ul>
        <li>Profile</li>
        <li>Preferences</li>
        <li>Logout</li>
    </ul>
</r-dropdown>
```

## Manual Popover

Use `popover="manual"` when you need programmatic control (no light dismiss):

```html
<div id="notification" popover="manual">
    Connection lost. Retrying...
</div>
```

```typescript
const notification = document.querySelector('#notification');
notification.showPopover();   // Show
notification.hidePopover();   // Hide
notification.togglePopover(); // Toggle
```

## Styling

```css
/* The popover itself */
[popover] {
    background: var(--surface-bg);
    border: 1px solid var(--bd-muted);
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* The backdrop behind the popover */
[popover]::backdrop {
    background: rgba(0, 0, 0, 0.1);
}
```

## When to Use Popover vs Dialog

| Feature | `popover` | `<dialog>` |
|---------|-----------|------------|
| Light dismiss (click outside) | Yes (auto) | No |
| Focus trapping | No | Yes (modal) |
| Backdrop | Optional | Yes (modal) |
| Use case | Menus, tooltips, dropdowns | Confirmations, forms, modals |

Use `popover` for transient UI (menus, tooltips). Use `<dialog>` for modal interactions that require user attention (see [RouteTarget dialog](../lib/routing/RoutingTarget.md#dialog-targets)).
