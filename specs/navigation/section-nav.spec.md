---
feature: Section nav
status: verified
authored: planned
---

# Section nav

## Goal
A user moves between the sections of one area, such as the pages of a settings area, from a row of links that shows which section they are in, while the page keeps writing those links as its own markup.

## Declaring the sections
- **Links from markup**: the sections are the page's own `<a href>` children, shown as given and never copied or rebuilt, and a link to a defined route still navigates client side (docs/authoring/ComponentContract.md#Drawing Once)
  - **Links change**: adding, removing or relabelling a link child updates the row and the mark
- **Row of links**: the links are shown in a row, in the order given, inside a navigation landmark
- **Landmark name**: the `label` attribute gives the navigation landmark its accessible name
- **Links not tabs**: each section stays a native link in the tab order, and the row uses no tab roles and shows no panels

## Following the route
- **Current route marked**: the link for the current route is shown selected and carries `aria-current="page"` (docs/authoring/DesignLanguage.md#Selection)
  - **Route changes**: client-side navigation and the browser's back and forward move the mark to the link for the new route
  - **No match**: when no link matches the current route, none is marked
- **Matching a route**: a link matches its own path and every path below it by whole segments, and when several links match, the one with the most segments is marked
  - **Partial segment**: a link to `/set` does not match `/settings`
  - **Query and hash**: the query string and hash of both the link and the current address are ignored
- **Too many links**: links that do not fit the width scroll sideways rather than wrapping onto a second row
  - **Current link in view**: on first draw and on each route change, the marked link is scrolled into view
