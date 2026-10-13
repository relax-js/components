# Dropdown Menu

A button that opens a short panel of items lying over the content, such as an account menu in a header. For a whole menu bar, use the [top menu](TopMenu.md).

## Screenshots

<!-- screenshots: r-dropdown-menu -->
<!-- /screenshots -->

## Usage

```html
<r-dropdown-menu label="Account" icon="user"></r-dropdown-menu>
```

```typescript
const menu = document.querySelector('r-dropdown-menu')!;
menu.items = [
    { name: 'profile', title: 'Profile', href: '/profile' },
    { name: 'sign-out', title: 'Sign out' },
];
menu.addEventListener('r-menu-selected', (event) => {
    if (event.item.name === 'sign-out') {
        signOut();
    }
});
```

- Clicking the trigger opens the panel as a popover in the top layer, below the trigger at its start edge; clicking it again closes it.
- The panel closes on a click outside, Escape, Tab, choosing an item, opening another dropdown menu, or navigating to another route.
- The items take the [top menu's](TopMenu.md#properties) `MenuItem` shape. An item with `href` is a link; every other item is a button. Submenus are not supported: an item with `children` reports an error and is left out. A menu with no items has a disabled trigger.
- The panel is as wide as its longest item, never wider than the window; items are one per line.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | `string` | The trigger's text, and its accessible name when `icon-only`. A menu without one reports an error and renders empty. |
| `icon` | `string` | An [icon](../foundations/Icon.md) name shown before the label |
| `icon-only` | `boolean` | Shows only the icon in the trigger |
| `open` | `boolean` | Present while the panel shows; set by the menu |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `items` | `MenuItem[]` | The menu's items |
| `open` | `boolean` (read only) | Whether the panel shows |

## Methods

### show()

Opens the panel and closes any other open dropdown menu.

### close()

Closes the panel.

## Events

### r-menu-selected

Dispatched as `MenuSelectedEvent` when an item is chosen, link items included, before the browser follows the link. Bubbles. See [TopMenu](TopMenu.md#events).

## Parts

| Part | What it is |
|------|------------|
| `trigger` | The trigger button |
| `panel` | The floating panel |
| `item` | Each item button or link |

## Variables

The panel takes `--floating-radius`, `--floating-padding` and `--floating-shadow` on `--surface-raised`; the trigger and items take the control variables and hover `--surface-hover`. See [Theming](../../authoring/Theming.md#variables).

## Accessibility

The trigger carries `aria-haspopup="menu"` and an `aria-expanded` matching the panel, which is `role="menu"` with `menuitem`s.

| Key | Action |
|-----|--------|
| Enter / Space / Down | On the trigger: opens and focuses the first item |
| Up | On the trigger: opens and focuses the last item |
| Down / Up | Next / previous item, wrapping around |
| Home / End | First / last item |
| Escape | Closes and focuses the trigger |
| Tab | Closes and moves on from the trigger |
