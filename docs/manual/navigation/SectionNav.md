# Section Nav

A row of links to the sections of one area, with the link for the current route marked. The links stay the page's own native links, so a router handles them and each is in the tab order. For alternative panels on one page, use [tabs](Tabs.md); for a list down the side, a [side menu](SideMenu.md).

## Screenshots

<!-- screenshots: r-section-nav -->
<!-- /screenshots -->

## Usage

```html
<r-section-nav label="Settings">
    <a href="/settings/profile">Profile</a>
    <a href="/settings/billing">Billing</a>
    <a href="/settings/billing/invoices">Invoices</a>
</r-section-nav>
```

- The links are slotted, never copied: adding, removing or relabelling one needs no redraw.
- The link for the current route carries `aria-current="page"`. A link matches its own path and every path below it by whole segments, and when several match, the one with the most segments wins: on `/settings/billing/invoices`, Invoices is marked. A link to `/set` does not match `/settings`, and the query and hash are ignored.
- The mark follows client-side navigation and the browser's back and forward. When no link matches, none is marked.
- Links that do not fit the width scroll sideways, and the marked link is scrolled into view.
- The row uses no tab roles and shows no panels.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | `string` | The accessible name of the navigation landmark |

## Slots

| Slot | Description |
|------|-------------|
| *(default)* | The `<a href>` links |

## Parts

| Part | What it is |
|------|------------|
| `nav` | The navigation landmark holding the links |

The links are the page's own, so the page's CSS styles them directly: `r-section-nav a[aria-current="page"]`.

## Variables

Links are spaced by `--control-gap`, and the current link takes `--surface-selected`. See [Theming](../../authoring/Theming.md#variables).
