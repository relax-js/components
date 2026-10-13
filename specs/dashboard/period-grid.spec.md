---
feature: Period grid
status: verified
authored: planned
---

# Period grid

## Goal
A reader sees a year's accounting periods side by side and how far each has come, from not started to closed, with every state told apart by icon and text as well as colour. The page gives the year and the periods, and can swap the accounting states for its own.

## Seeing a year's periods
- **Year heading**: the grid shows its `year` attribute above the periods (docs/manual/PeriodGrid.md#Attributes)
  - **Invalid year**: a missing or non-numeric `year` logs an error and the grid renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
  - **Year changed**: changing `year` on a drawn grid updates the heading and every tile's title
- **Months as items**: each entry of the `periods` property becomes a status grid item labelled `"{month} {year}"` in the given order, so a tile's title reads such as `"Jan 2026: closed"` (specs/dashboard/status-grid.spec.md#Seeing where each item stands)
  - **Months shown as given**: the month text is shown exactly as the page gave it, never translated, and months the page left out are not filled in (docs/authoring/TextAndValues.md#Data Is Shown as Given)
- **Default states**: without states from the page, the grid has, in this order in the key, `closed` (tone ok, icon `check`, "closed"), `locked` (tone ok, icon `lock`, "locked"), `open` (tone info, "open") and `coming` (tone muted, "not started") (docs/manual/PeriodGrid.md#Default States)
  - **Default without icon**: `open` shows the info tone's `clock` icon and `coming` the muted tone's `info` icon, so no period state is shown without an icon (specs/dashboard/status-grid.spec.md#Seeing where each item stands)
- **State texts from the namespace**: the default state texts come from the `period…` keys of the `r-components` namespace and redraw when the language changes (specs/dashboard/dashboard-foundations.spec.md#Formatting for a locale)
- **Documented parts**: the grid's markup carries `.year` for the year, `ol.months` with one `li.{state}` per period, `.month` for a period's label, `.tile` for its tile and `ul.key` for the legend (docs/manual/PeriodGrid.md#Parts)

## Using the app's own states
- **Configurable states**: the page sets the `states` property with status grid state definitions (id, label, optional icon, optional tone), and they replace the default states in the tiles and the key (docs/manual/PeriodGrid.md#Properties)
  - **Defaults replaced whole**: after the page replaces the states, a period in `closed` is an unknown state unless the page's own set defines `closed`
