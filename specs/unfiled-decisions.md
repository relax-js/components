# Unfiled decisions

### One import per element
- decided: Every element can be imported on its own by a short name, such as `@relax.js/components/card`, registering only that element and what it needs, while importing the package still registers every element.
- affects: Dashboard foundations, docs/manual/Components.md, README.md

### The theme is sizes plus colours, in a layer of its own
- decided: The default theme ships as a sizes stylesheet without colours and a colours stylesheet holding the palette, `color-scheme` and the mode switches, with `theme.css` as both, and every theme variable sits in the `relax-theme` cascade layer so an app's own unlayered variables win whatever the load order.
- affects: Dashboard foundations, docs/authoring/Theming.md, docs/manual/Customizing.md

### Two ways to force a mode
- decided: Light or dark mode is forced by either the `dark-theme` / `light-theme` class or `data-theme="dark"` / `data-theme="light"` on an ancestor.
- affects: docs/authoring/Theming.md, docs/manual/Customizing.md

### Accent as text has its own variable
- decided: Text drawn in the accent colour takes `--accent-text`, which defaults to `--accent-primary`, so a brand can use a different shade for text than for fills.
- affects: docs/authoring/Theming.md

### Tabs are not editor tabs
- decided: Tabs stay a panel switcher; a strip of open documents with close buttons, icons or drag to reorder is left to the app.
- affects: Tabs

### Card body stays the page's own children
- decided: The card does not wrap its body in an element of its own, so the page's selectors on its content keep working; a page that wants the body padded or filled wraps it itself.
- affects: Dashboard card

### Section nav owns marking the current route
- decided: Section nav owns how a navigation link is marked for the current route: `aria-current="page"` and the selected look, the mark following client-side navigation and back and forward, and matching by whole path segments with the most specific link winning while query and hash are ignored; Side menu cites it instead of defining its own.
- affects: Section nav, Side menu

### Top menu owns the menu item and its selection event
- decided: The menu item shape (name, title, optional link address, optional children) and the `r-menu-selected` event that reports a chosen item without children belong to Top menu, and Dropdown menu reuses them for its links and actions instead of defining its own.
- affects: Top menu, Dropdown menu

### Bad input keeps the page's own content
- decided: A component whose body is the page's own content, such as the card, leaves out only the markup it draws itself when an attribute is missing or invalid, and reports the error, instead of rendering empty.
- affects: Dashboard card, Dashboard foundations, docs/authoring/ComponentContract.md

### Card link needs an address
- decided: A card given link text but no `href` reports an error and leaves the link out, instead of linking to `#`.
- affects: Dashboard card, docs/manual/dashboard/Card.md

### Card without an icon shows its tone's icon
- decided: A card with a tone and no icon of its own shows the tone's default icon in its heading row, so its tone is never shown by the accent colour alone.
- affects: Dashboard card, docs/manual/dashboard/Card.md

### Period grid states take the status grid's shape
- decided: The Period grid's `states` property takes the Status grid's state definitions (id, label, optional icon, optional tone) instead of the `{ id, text, icon? }` shape the Period grid manual describes.
- affects: Period grid, Status grid, docs/manual/dashboard/PeriodGrid.md

### Amount owns how an amount is written
- decided: Charts that show amounts write them with Amount's formatting, so grouping, currency and the real minus sign come from Amount, and a chart only chooses the options, such as leaving the currency off its axis.
- affects: Amount

### Dashboard foundations owns overrides and bad-input reporting
- decided: The general rules that a per-element attribute overrides the formatting config and that bad input reports an error and renders empty belong to Dashboard foundations, and Amount keeps only its own attributes and cites foundations for how errors are reported.
- affects: Amount, Dashboard foundations

### Tone colours and drawing once are shared
- decided: Dashboard foundations owns how `data-tone` sets `--tone` and `--tone-soft` and the general rule that a component draws once across reconnects, while Dashboard card keeps only its own accent and its no-second-heading check.
- affects: Dashboard foundations, Dashboard card

### Overview cards do not hover
- decided: Only a card that is clickable as a whole responds to the pointer with `--surface-hover`, so the overview card, whose only interactive parts are its link and action, stays still.
- affects: Dashboard card, docs/authoring/DesignLanguage.md

### A card's own icon leaves the tone to its lead
- decided: A toned card with an icon of its own shows only that icon, and the page's lead text is what says the tone in words, so the card adds no tone icon beside it.
- affects: Dashboard card, docs/manual/dashboard/Card.md, docs/authoring/DesignLanguage.md

### Colour scales get theme variables of their own
- decided: The theme gains variables for a sequential colour scale (low and high end) and a diverging one (below, middle and above), which a chart colouring values on a scale uses instead of borrowing the series, status or accent variables.
- affects: Heatmap, docs/authoring/Theming.md

### Heatmap writes plain numbers by default
- decided: A heatmap writes its values as plain numbers in the configured locale by default, not as whole amounts in the currency, while Chart foundations keeps owning that a chart lets the page give its own value format.
- affects: Heatmap

### Chart foundations owns stacking
- decided: How any chart stacks its series belongs to Chart foundations: the value axis covers the largest total, and the read-out shows each series' own value, not its stacked height, together with the label's total; Bar chart and Area chart keep only how their own bars or bands are drawn.
- affects: Bar chart, Area chart

### Stacked totals and negatives in a stack
- decided: In any stacked chart the read-out's total takes its word from the `r-components` namespace and is left out when there is a single series, the hidden table gains a total column, and a negative value in a stack reports an error naming its series and nothing is drawn.
- affects: Bar chart, Area chart

### Line chart shades a series, Area chart stacks
- decided: A single shaded series among other lines is the line chart's `area` series, while the area chart is the chart for series stacked into a total and draws a lone series as a single shaded area.
- affects: Line chart, Area chart

### Chart foundations owns what every chart shares
- decided: Chart foundations owns what every chart shares: one value per label in each series, missing values, the series legend and colours, the hover read-out appearing, hiding and moving left past 60 % of the width, the floating read-out surface, the `valueFormat` and `axisFormat` properties with their defaults, the round value axis, stacking, the figure and summary, the hidden table and the empty state; Line chart keeps only its own markup classes, crosshair, snapping to the nearest label, plot size, threshold and area series and point markers.
- affects: Chart foundations, Bar chart, Area chart

### Negative values stack below zero
- decided: In any stacked chart, positive values stack up from zero and negative values stack down from it, each in series order. This replaces the earlier ruling that a negative value in a stack is bad data.
- affects: Bar chart, Area chart

### A chart takes at most five series
- decided: A chart given more series than the theme's five series colours reports an error and draws nothing, instead of folding the extra series into one.
- affects: Bar chart, Area chart, docs/authoring/Theming.md

### A missing chart value is a gap
- decided: A `null` value in a chart series is a gap: nothing is drawn at that label, the read-out says no data and the table cell is empty, while any other value that is not a finite number is bad data.
- affects: Line chart, Bar chart, Area chart, docs/manual/dashboard/LineChart.md

### Only charts of amounts default to the currency
- decided: Line, bar and area charts write whole amounts in the configured currency by default, while every other chart, the sparkline included, writes plain numbers in the configured locale unless the page gives its own format.
- affects: Line chart, Bar chart, Area chart

### A change in percent follows the locale
- decided: A percent change is written in the locale's own percent format with its sign always shown and a real minus sign, so it reads `+12 %` in Swedish and `+12%` in English rather than with one fixed spacing.
- affects: KPI meter, Stat tile, docs/manual/dashboard/KpiMeter.md

### Meter and KPI meter each own their bar fill
- decided: The Meter's fill, the value's share of its limit, and the KPI meter's fill, on its year-comparison scale with headroom, are separate behaviours that each feature owns, with no shared fill rule between them.
- affects: Meter, KPI meter

### Dialog owns its content and closing
- decided: A component that opens its content in a Dialog, such as Settings row, relies on Dialog for creating and removing the content, closing by the close button or Escape, and returning focus, and owns only what it does with the result the dialog closes with.
- affects: Dialog, Settings row

### Dialog owns how content closes it with a result
- decided: How a dialog's content closes it with a result, by the dialog's close method or by a form using the native dialog method, belongs to Dialog, so Settings row's form reports it saved by closing the dialog with a result and Settings row only reacts to that result.
- affects: Dialog, Settings row

### Routes can open in the Dialog
- decided: A route opened into a dialog target shows in the library's Dialog, with the same look, close button, Escape and focus handling as a dialog opened from code, so every modal in an app behaves alike.
- affects: Dialog, docs/manual/Components.md, docs/manual/PopoverPattern.md

### Each form-holding component states its own validation rule
- decided: Step and Settings row each keep their own rule that a form failing the browser's validation goes no further and shows the validation messages, rather than one feature owning it for both.
- affects: Step, Settings row

### Table pagination owns which page is shown
- decided: Data table owns the columns, the sort control, the cells, the `noData` row and `rows` as the table's records, while Table pagination owns the page size, the pager, the provider and which page is shown, including the return to the first page when `rows`, `provider`, `columns`, the sort or `page-size` change; Data table's rules no longer say which page is shown.
- affects: Data table, Table pagination

### A failed first load shows an error row
- decided: When a table's provider fails before any rows are on screen, the table shows one row with a "could not load" text from a new `loadFailed` key in the `r-components` namespace, in every shipped language, in the `danger` tone with its icon.
- affects: Table pagination, docs/manual/Formatting.md, docs/manual/data-display/Table.md

### Data table owns the empty table
- decided: Before any rows or provider are set, the table shows its headers and the `noData` row, a rule Data table owns; this answers Table pagination's question of what the table shows with no data source.
- affects: Data table, Table pagination

### A loading table dims like the spinner
- decided: While a page loads, the table dims its rows with the Loading spinner's overlay and inert content, on top of its own `loading` attribute and `aria-busy`, so every busy area in an app looks alike; Loading spinner owns how the dimming looks and behaves.
- affects: Table pagination, Loading spinner, docs/manual/data-display/Table.md

### The spinner announces loading
- decided: When loading starts, the spinner tells screen readers a "Loading" text taken from a new `loading` key in the `r-components` namespace, in every shipped language, instead of relying on `aria-busy` alone.
- affects: Loading spinner, docs/manual/Formatting.md, docs/manual/feedback/Spinner.md

### Progress indicators keep moving under reduced motion
- decided: When the user prefers reduced motion, fades and slides are dropped but a spinner's ring keeps spinning, since it is the only sign that work is in progress.
- affects: Loading spinner, docs/authoring/DesignLanguage.md, docs/manual/feedback/Spinner.md

### The sparkline has no legend
- decided: The sparkline draws a single series that the text beside it names, so it shows no legend, and the rule that a chart shows a legend naming its series holds for every chart except the sparkline.
- affects: Sparkline, Chart foundations

### Importing an element registers it, in development and production alike
- decided: Importing the package, or an element's own entry, registers its tags even as a bare import, so the package declares those entries as having side effects; only the formatting and tone entries are declared free of them, and an app that wants to pay only for what it uses imports per-element entries rather than relying on tree-shaking of the main entry.
- affects: docs/manual/Components.md, every component
