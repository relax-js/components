# TopMenu

A horizontal navigation menu bar with animated submenu navigation.

## Usage

### Programmatic Setup

```typescript
import { TopMenu, MenuItem, SubMenuItem } from 'relaxjs/components';

const menu = document.querySelector('r-top-menu') as TopMenu;

const items: MenuItem[] = [
    new MenuItem('File', 'file', [
        new SubMenuItem('New', 'file.new'),
        new SubMenuItem('Open', 'file.open'),
        new SubMenuItem('Save', 'file.save')
    ]),
    new MenuItem('Edit', 'edit', [
        new SubMenuItem('Cut', 'edit.cut'),
        new SubMenuItem('Copy', 'edit.copy'),
        new SubMenuItem('Paste', 'edit.paste')
    ]),
    new MenuItem('Help', 'help')
];

menu.setItems(items);
```

### HTML

```html
<r-top-menu align="left"></r-top-menu>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `align` | `'left' \| 'center' \| 'right'` | `'center'` | Horizontal alignment of menu items |

## Events

### rlx.menuSelected

Fired when a menu item is clicked. Typed via `HTMLElementEventMap`.

```typescript
document.addEventListener('rlx.menuSelected', (e: MenuEvent) => {
    console.log('Selected:', e.menuItem.title, e.menuItem.actionName);

    if (e.menuItem.route) {
        navigate(e.menuItem.route.name);
    }
});
```

## Methods

### setItems(items: MenuItem[])

Sets the menu items and renders the menu.

```typescript
menu.setItems(items);
```

### resetMenu()

Returns from a submenu to the main menu.

```typescript
menu.resetMenu();
```

## Types

### MenuItem

```typescript
class MenuItem {
    constructor(
        public title: string,
        public actionName?: string,
        public submenu?: SubMenuItem[],
        public requiredClaims?: string[],
        public route?: Route
    )
}
```

| Property | Description |
|----------|-------------|
| `title` | Display text |
| `actionName` | Identifier for event handling |
| `submenu` | Array of SubMenuItem for dropdown |
| `requiredClaims` | Authorization claims required to show this item |
| `route` | Associated Route for navigation |

### SubMenuItem

```typescript
class SubMenuItem {
    constructor(
        public title: string,
        public actionName?: string,
        public componentName?: string,
        public requiredClaims?: string[]
    )
}
```

### MenuEvent

```typescript
class MenuEvent extends Event {
    static readonly SELECTED_EVENT = 'rlx.menuSelected';
    static readonly ADDED_EVENT = 'rlx.menuAdded';
    static readonly REMOVED_EVENT = 'rlx.menuRemoved';

    menuItem: MenuItem;
}
```

## Styling

The component uses Shadow DOM with CSS variables:

```css
r-top-menu {
    --menu-bg-color: #1a1a1a;
    --menu-text-color: #fff;
    --submenu-bg-color: #2a2a2a;
    --menu-shadow: 0 4px 10px rgba(0, 0, 0, 0.8);
    --menu-glow: 0px 0px 15px rgba(255, 255, 255, 0.5);
    --chevron-size: 16px;
}
```

## Behavior

1. Top-level items with submenus animate to reveal the submenu
2. A "Back" chevron appears to return to the main menu
3. Items without submenus fire `rlx.menuSelected` directly
4. Submenu items fire `rlx.menuSelected` when clicked
