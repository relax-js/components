# Side Menu

A titled list of links at the side of the page, such as the sections of a settings area, with the link for the current route marked. For a row of links across the top of an area, use a [section nav](SectionNav.md).

## Screenshots

<!-- screenshots: r-side-menu -->
<!-- /screenshots -->

## Usage

```html
<r-side-menu title="Settings"></r-side-menu>
```

```typescript
const menu = document.querySelector('r-side-menu')!;
menu.items = [
    { name: 'profile', title: 'Profile', href: '/settings/profile' },
    {
        name: 'billing',
        title: 'Billing',
        children: [
            { name: 'plan', title: 'Plan', href: '/settings/plan' },
            { name: 'invoices', title: 'Invoices', href: '/settings/invoices' },
        ],
    },
];
```

- The items take the [top menu's](TopMenu.md#properties) `MenuItem` shape. An item with `children` is a group heading, not a link, with its children's links under it. Groups are always open, and only one level is supported: deeper items report an error and are left out.
- The link for the current route carries `aria-current="page"`, matched by whole path segments the way a [section nav](SectionNav.md) matches. It follows client-side navigation and the browser's back and forward, and is scrolled into view within the menu.
- Links that do not fit the menu's height scroll inside the menu.
- A link to a defined route navigates client side with the Relax.js router.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `title` | `string` | The menu's heading and the accessible name of its navigation landmark. A menu without one reports an error and still shows its links. |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `items` | `MenuItem[]` | The menu's links. Setting them redraws the menu; items set before it connects are drawn when it does. |

## Parts

| Part | What it is |
|------|------------|
| `title` | The heading |
| `item` | Each link |
| `group` | A group heading |

```css
r-side-menu::part(item) {
    padding: var(--control-padding);
}
```

## Variables

The menu takes `--panel-padding` and `--panel-gap`, casts no shadow and has square corners. Links take the control variables, hover `--surface-hover` and the current link `--surface-selected`. See [Theming](../../authoring/Theming.md#variables).
