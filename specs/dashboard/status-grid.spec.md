---
feature: Status grid
status: verified
authored: planned
---

# Status grid

## Goal
A reader sees a set of items side by side, such as periods, and where each one stands. The app defines the states itself. The icon, the label and the legend each tell the states apart, so colour is never the only clue.

## Seeing where each item stands
- **App-defined states**: the page sets the states as a property, each with an id, a label, an optional icon and an optional tone
  - **Default tone**: a state without a tone is `muted`
  - **Unknown tone**: a state whose tone is not one of the five tones reports an error and is shown as `muted` (docs/authoring/CustomComponents.md#Tones)
  - **Duplicate state id**: two states with the same id report an error and the grid renders empty
- **One tile per item**: the page sets the items as a property, each with a label and a state id, and the grid shows one tile per item in the given order, with the item's label shown next to its tile
  - **Unknown state**: an item whose state id is not among the states reports an error and the grid renders empty (docs/manual/dashboard/PeriodGrid.md#Properties)
  - **No items**: an empty list of items shows no tiles and reports no error
- **State icon on tile**: each tile shows its state's icon
  - **State without icon**: a state with no icon shows its tone's default icon (docs/authoring/DesignLanguage.md#Tones)
- **Tile carries tone and state**: each tile carries its state's tone as `data-tone` and its state id as a hook the page's CSS can select on (docs/authoring/DesignLanguage.md#Tones)
- **Tile title**: each tile's title reads `"{item label}: {state label}"`
- **Long labels**: a tile wraps onto further lines as the grid needs, and a label longer than the grid is wide breaks rather than sticking out of it
- **Tile names its state**: each tile's accessible name gives the item label and the state label (docs/authoring/DesignLanguage.md#Accessibility)
- **States legend**: a legend under the grid lists every defined state in the given order with its icon and label, including states no item is in
- **Read-only tiles**: tiles cannot be focused and send no events
