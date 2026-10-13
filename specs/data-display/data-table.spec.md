---
feature: Data table
status: verified
authored: planned
built: true
---

# Data table

## Goal
A developer shows a list of records as a table by declaring its columns in markup or code and handing it the records, so tabular screens need no hand-built table markup, and the reader scans those records and sorts them by a column to find what they are looking for.

## Defining columns
- **Declarative columns**: each `r-column` in `r-table` becomes a column showing the record property its `field` names, with its text as the header (docs/manual/data-display/Table.md#r-column)
  - **Columns inside template** [removed]: an `r-columns` placed inside a `template` in `r-table` gives the same columns
  - **Missing field**: an `r-column` without `field` reports an error and the table renders empty (docs/authoring/ComponentContract.md#Failing Loudly)
- **Programmatic columns**: setting `columns` redraws the table with one column per definition, its `title` as the header, and loads the first page again (docs/manual/data-display/Table.md#Columns from Code)
  - **Column without field**: a definition without `field` throws an error (docs/authoring/ComponentContract.md#Failing Loudly)
- **Column width**: a column's width, such as `120px` or `20%`, sizes that column (docs/manual/data-display/Table.md#r-column)
- **Initial sort order**: a column with `sort` set to `asc` or `desc` orders the rows by that column when the table first loads (docs/manual/data-display/Table.md#r-column)
  - **Invalid initial sort**: a `sort` other than `asc` or `desc`, or `sort` set on more than one column, reports an error and the table renders empty
- **Columns read once**: the column markup is read once, when the table first draws (docs/manual/data-display/Table.md#r-column)
  - **Table moved**: a table moved elsewhere on the page keeps the columns it read
  - **Columns added later**: an `r-column` added after the first draw throws an error naming the table

## Sorting by a column
- **Click to sort**: clicking the header button of a `sortable` column sorts the rows by that column (docs/manual/data-display/Table.md#r-column)
  - **Not sortable**: the header of a column without `sortable` has no button and no `aria-sort`, and clicking it changes nothing
  - **Other column clicked**: sorting by one column replaces the sort by any other, so the rows are sorted by one column at a time
- **Sort cycle**: repeated clicks on the same header sort ascending, then descending, then return to the unsorted order, which is the order the records were given in or the provider's own order
- **Sort order of values**: text sorts by the configured locale's collation with runs of digits compared by value, so `item2` comes before `item10`, numbers sort by value and dates by time (docs/authoring/TextAndValues.md#Values)
  - **Empty values**: `null` and `undefined` sort after every other value in both directions
- **Sort announced**: every sortable header carries `aria-sort` of `ascending`, `descending` or `none` (docs/manual/data-display/Table.md#Accessibility)

## Showing data
- **Native table**: the table renders as a native table with the column titles in its header and one body row per record on the page (docs/manual/data-display/Table.md#Usage)
- **Narrow space**: a table wider than the space it is given scrolls sideways within itself, so the page does not, and the pager stays in view (docs/manual/data-display/Table.md#Parts)
- **Set data**: setting `rows` shows the first page, with the table sorting the records itself (docs/manual/data-display/Table.md#Usage)
  - **Data set again**: setting `rows` a second time replaces the rows rather than appending to them, keeps the sort the user chose and shows the first page
  - **Set before connecting**: records set before the table connects are drawn when it connects
- **Add row** [removed]: adding a record appends one row after the existing ones
- **Cell values**: each cell shows the record's value for its column written for the configured locale, numbers grouped, dates in the short form, and `null` or `undefined` as an empty cell (docs/manual/data-display/Table.md#What a Cell Shows)
  - **Language changed**: after the locale changes, the cells and the `noData` text are drawn again in the new locale (docs/authoring/TextAndValues.md#Changing Language)
  - **Text with markup**: a value containing markup is shown as literal text, exactly as given and never translated (docs/authoring/TextAndValues.md#Data Is Shown as Given)
  - **Date strings**: only date values get the short date form, while a date written as a string is shown as given
- **No records**: with no records, one row shows the `noData` text (docs/manual/data-display/Table.md#What a Cell Shows)
  - **Nothing set yet**: before any `rows` or `provider` is set, the table shows its headers and the `noData` row
- **Page styles win**: the table's own styles sit in the `relax-components` cascade layer, so the page's rules for the table override them (docs/manual/Customizing.md#Components in the Light DOM)
