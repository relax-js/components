# Future work

### Tabs remember the selected tab in the address
- decided: `r-tabs` gains a `hash` option instead of a second tabs component: with it, the tab named in the address is selected first, falling back to the `selected` attribute and then the first tab, and selecting a tab writes it back with `history.replaceState`, while nested tabs each touch only their own tabs.
- affects: Tabs, docs/manual/navigation/Tabs.md

### KPI meter becomes Comparison
- decided: The KPI meter is renamed Comparison, since it compares any figure with any previous period and carries no unit, while components that render a unit or format, such as Amount and Days left, keep names saying what they show.
- affects: KPI meter, Stat tile, docs/manual/KpiMeter.md, docs/manual/Components.md

### Keyboard read-out for charts
- decided: A keyboard user can later focus a chart and step through its labels or cells to get the read-out; until then, the hidden table is the only way to the values without a pointer.
- affects: Chart foundations, Line chart, Bar chart, Area chart, Sparkline, Heatmap
