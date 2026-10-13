---
feature: Tabs
status: verified
authored: planned
built: true
---

# Tabs

## Goal
A developer splits a screen's content into labelled panels the user switches between with the pointer or the keyboard, showing one panel at a time and letting the page react when the user changes tab.

## Switching tabs
- **Tab headers**: each `r-tab` gets a header showing its label, in the order the tabs are declared (docs/manual/navigation/Tabs.md#r-tab)
  - **Missing label**: a tab without `label` reports an error and gets an empty header
  - **Tabs moved**: a tab set moved elsewhere on the page keeps one header bar and never draws a second (docs/authoring/ComponentContract.md#Drawing Once)
- **Headers follow tabs**: adding, removing or relabelling an `r-tab` updates the header bar (docs/manual/navigation/Tabs.md#Usage)
  - **Shown tab removed**: removing the tab shown shows the tab now at the selected index, or the last tab when the index is past the end, and dispatches no event
- **Crowded headers**: headers that do not fit side by side scroll sideways within the bar instead of widening the page, and the selected header is scrolled into view within the bar
- **Initial tab**: the `selected` attribute on `r-tabs` picks, by zero-based index, the tab shown first (docs/manual/navigation/Tabs.md#r-tabs)
  - **No selected attribute**: without the attribute the first tab is shown
  - **Invalid selected**: a `selected` that is not the index of a tab reports an error, no tab is shown and `selectedIndex` reads `-1` (docs/manual/navigation/Tabs.md#Properties)
- **One panel shown**: only the selected tab's content is shown, and only the selected `r-tab` carries the `selected` attribute (docs/manual/navigation/Tabs.md#r-tab)
- **Header click selects**: clicking a tab header shows that tab (docs/manual/navigation/Tabs.md#r-tab-change)
- **Select via attribute**: changing the `selected` attribute switches to the tab at that index and dispatches no event (docs/manual/navigation/Tabs.md#r-tab-change)
- **Select from code**: `select(index)` shows the tab at that index (docs/manual/navigation/Tabs.md#Methods)
  - **No tab at index**: an index with no tab throws an error
- **Selection reflected**: a change of tab by a click, the keyboard or `select()` sets the `selected` attribute of `r-tabs` to the new index (docs/authoring/ComponentContract.md#State in the DOM)
- **Tab change event**: a change of tab by a click, the keyboard or `select()` dispatches a bubbling `r-tab-change` carrying the new index and tab (docs/manual/navigation/Tabs.md#r-tab-change)
  - **Same tab clicked**: choosing the tab already shown dispatches nothing
- **Keyboard switching**: Right and Left switch to the next and previous tab, wrapping around, Home and End to the first and last, and only the selected header is in the tab order (docs/manual/navigation/Tabs.md#Accessibility)
- **Tabs pattern roles**: headers are `role="tab"` with `aria-selected`, and panels are `role="tabpanel"` named by their tab's label (docs/manual/navigation/Tabs.md#Accessibility)
- **Styling parts**: the header bar is exposed as the `tablist` part, each header as `tab`, and the shown tab's header also as `selected` (docs/manual/navigation/Tabs.md#Parts)
- **Nested tabs**: a set's tabs are only its direct `r-tab` children, and a click or key in a set inside another's panel never switches the outer set
  - **Inner tab change**: the outer set dispatches no `r-tab-change` of its own when an inner set changes tab, though the inner event bubbles through it
