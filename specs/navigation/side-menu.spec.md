---
feature: Side menu
status: verified
authored: planned
---

# Side menu

## Goal
A user finds their way around an app from a titled list of links at the side of the page, grouped under headings where the app has many, that shows where they are. The developer gives the menu its links as data and places it in the page; how the side of the page behaves on narrow screens is the page layout's business, not the menu's.

## Following the route
- **Title and links**: the menu shows its title above a list of links, in the order given, inside a navigation landmark labelled by the title
  - **No title**: a menu without a title reports an error and still shows its links (docs/authoring/ComponentContract.md#Failing Loudly)
- **Items as data**: the links come from the `items` property in the menu item shape the top menu uses, and items set before the menu connects are drawn when it connects (docs/manual/navigation/TopMenu.md#Properties)
- **Current route marked**: the link for the current route is marked the way a section nav marks it (specs/navigation/section-nav.spec.md#Following the route)
- **Client-side navigation**: a link to a defined route navigates without reloading the page (docs/manual/navigation/TopMenu.md#Usage)
- **Long lists scroll**: links that do not fit the menu's height scroll inside the menu rather than stretching the page
  - **Current link in view**: on first draw and on each route change, the marked link is scrolled into view within the menu
- **Panel tier**: the menu takes its padding and gaps from the panel variables, casts no shadow, and has square corners where it meets the viewport edge (docs/authoring/DesignLanguage.md#Component Tiers)

## Grouping links
- **Group headings**: an item with `children` is shown as a heading with its children's links under it, and the heading is not a link
  - **Always open**: groups are always shown and cannot be collapsed
- **One level deep**: an item whose children have children of their own reports an error and its deeper items are left out (docs/authoring/ComponentContract.md#Failing Loudly)
