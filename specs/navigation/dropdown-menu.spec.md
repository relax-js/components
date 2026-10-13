---
feature: Dropdown menu
status: verified
authored: planned
---

# Dropdown menu

## Goal
A developer gives a page an `r-dropdown-menu`: a button that opens a short list of links and actions lying over the content, so a user can pick one and the list gets out of the way as soon as it is no longer wanted.

## Opening and closing the menu
- **Trigger label**: the `label` attribute is the trigger button's text, and the `icon` attribute adds that `r-icon` before it
  - **Icon-only trigger**: with `icon-only` set the trigger shows only the icon and the label stays its accessible name
  - **Missing label**: a menu without `label` logs an error naming `r-dropdown-menu` and renders empty (docs/authoring/ComponentContract.md#Failing Loudly)
- **Trigger toggles**: clicking the trigger opens the panel of items as a popover in the top layer, and clicking it again closes it (docs/authoring/DesignLanguage.md#Native First)
- **Expanded state**: the element reflects `open` while the panel shows, and the trigger carries `aria-haspopup="menu"` and an `aria-expanded` that matches it (docs/authoring/ComponentContract.md#State in the DOM)
- **Placement**: the panel opens below the trigger, aligned with its start edge
  - **Near the viewport edge**: a panel that would overflow the viewport flips above the trigger or to its other edge so it stays inside
- **Floating panel**: the panel takes the floating tier's role variables and casts a shadow (docs/authoring/DesignLanguage.md#Component Tiers)
- **Outside click closes**: a click outside the menu closes the panel (docs/authoring/DesignLanguage.md#Transient vs Modal)
  - **Another menu opens**: opening another dropdown menu closes this one, so only one is open at a time
  - **Route change closes**: navigating to another route while the panel is open closes it
- **Escape closes**: Escape closes the panel and returns focus to the trigger (docs/authoring/DesignLanguage.md#Transient vs Modal)

## Choosing an item
- **Set items**: setting `items`, in the same item shape as the top menu, shows each item's title in the panel, in order (docs/manual/navigation/TopMenu.md#Properties)
  - **Set before connecting**: items set before the menu connects are drawn when it connects
  - **No items**: with no items the trigger is disabled
- **No submenus**: an item with `children` logs an error naming `r-dropdown-menu` and is left out
- **Action items**: an item without `href` is a button, and choosing it dispatches `r-menu-selected` carrying the item (docs/manual/navigation/TopMenu.md#r-menu-selected)
- **Link items**: an item with `href` is a link the browser follows, after `r-menu-selected` is dispatched for it (docs/manual/navigation/TopMenu.md#Usage)
- **Choosing closes**: choosing an item closes the panel

## Moving with the keyboard
- **Open from keys**: Enter, Space or Down on the trigger opens the panel with focus on the first item, and Up opens it with focus on the last
- **Arrow keys**: with the panel open, Down and Up move the focus to the next and previous item, wrapping around at the ends
- **Home and End**: Home focuses the first item and End the last
- **Tab closes**: Tab closes the panel and moves focus on past the trigger
