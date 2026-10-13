---
feature: Table pagination
status: verified
authored: planned
built: true
---

# Table pagination

## Goal
A developer shows a large data set one page at a time, either paging records already in memory or giving the table a provider that fetches only the page and sort order the user asks for.

## Paging through data
- **Page size**: the `page-size` attribute sets the rows per page, 25 when absent (docs/manual/data-display/Table.md#r-table)
  - **Invalid page size**: anything but a whole number above zero reports an error and the table renders empty
- **Page count**: the number of pages is the provider's `totalCount`, or the number of records in memory, divided by the page size and rounded up (docs/manual/data-display/Table.md#Properties)
- **Pager**: a pager under the table is a `nav` named by the `pages` text, with Previous and Next buttons and page buttons that move between pages (docs/manual/data-display/Table.md#Accessibility)
  - **One page**: the pager is hidden when one page holds every row
- **Current page marked**: the button of the page shown carries `aria-current="page"` and is marked with `--surface-selected` (docs/manual/data-display/Table.md#Accessibility)
- **Many pages**: with more than seven pages, the pager shows buttons for the first page, the last page, and the shown page with two neighbours on each side, with each gap between them marked
- **Back to first page**: setting `rows`, `provider` or `columns`, choosing a new sort, or changing `page-size` shows the first page (docs/manual/data-display/Table.md#Properties)

## Loading pages from a server
- **Page through loader**: the table calls its `provider` for each page with the 1-based page, the page size, the sort order the user chose and an abort signal, and shows the rows it returns (docs/manual/data-display/Table.md#Loading Pages from a Server)
  - **Unsorted**: with no sort chosen, the provider gets an empty sort and its own order is shown
  - **Set before connecting**: a provider set before the table connects is first called when it connects
- **Cached page** [removed]: asking for a page already loaded renders its cached records without calling the page loader
- **Abandoned load**: a load the user moved past, by picking another page or sort first, has its signal aborted, and a response arriving after that is never drawn (docs/manual/data-display/Table.md#Loading Pages from a Server)
- **Rows or provider**: setting `rows` replaces the provider and setting `provider` replaces the rows (docs/manual/data-display/Table.md#Loading Pages from a Server)
- **Busy while loading**: while a page loads the table carries the `loading` attribute and `aria-busy` (docs/manual/data-display/Table.md#Accessibility)
  - **Busy dimmed**: the rows on screen are dimmed and cannot be used while the page loads, looking the same as content the Loading spinner dims
- **Refresh**: `refresh()` loads the shown page again, resolving once it is drawn and rejecting with the provider's error (docs/manual/data-display/Table.md#Methods)
  - **Refresh overtaken**: when the user picks another page or sort before the refreshed page is drawn, the refresh is aborted and its promise resolves once the page the user picked is drawn, or rejects with that load's error
  - **Refresh with rows**: with records in memory, `refresh()` redraws the shown page and resolves
  - **Shown page gone**: when the refreshed `totalCount` no longer reaches the shown page, the last page is shown
- **Failure while paging**: a provider failing while the user pages or sorts reports `r-table: the provider failed to load page` with the error, and the rows on screen stay (docs/manual/data-display/Table.md#Methods)
  - **Pager stays**: the pager keeps marking the page still on screen, not the page that was asked for
- **First load fails**: a provider failing when no rows are on screen yet reports the error and shows one row with the `loadFailed` text from the `r-components` namespace in the `danger` tone with its icon
