---
feature: Top menu
status: verified
authored: planned
built: true
---

# Top menu

## Goal
A developer gives an application a horizontal menu bar whose items open submenus, follow a link or report a choice, so navigation needs no hand-built menu.

## Showing the menu
- **Set items**: setting `items` shows the top level with each item's title in the bar, in order (docs/manual/navigation/TopMenu.md#Properties)
  - **Set before connecting**: items set before the menu connects are drawn when it connects
  - **New items reset the level**: setting `items` while a submenu is open shows the top level with the new items
  - **Duplicate names**: items whose names are not unique within the menu throw a named error
- **Titles as given**: each item's title is shown exactly as given, as text, never parsed as markup or translated (docs/authoring/TextAndValues.md#Data Is Shown as Given)
- **Alignment**: the `align` attribute places the items left, center or right, and center when it is absent (docs/manual/navigation/TopMenu.md#Attributes)
  - **Invalid alignment**: any other value logs an error and the menu renders empty
- **Claims hide items** [removed]: a menu item or submenu item with required claims is shown only to a user holding every one of them

## Opening a submenu
- **Submenu marker**: an item with children carries `aria-haspopup="menu"` and shows a chevron icon (docs/manual/navigation/TopMenu.md#Accessibility)
- **Submenu reveal**: choosing an item with children slides its submenu in over the bar and never reports the item as selected, to any depth (docs/manual/navigation/TopMenu.md#Usage)
  - **Reduced motion**: when the user prefers reduced motion, the submenu replaces the level without sliding
- **Back button**: a submenu shows a back button, labelled with the `back` text, that returns one level (docs/manual/navigation/TopMenu.md#Accessibility)
  - **Escape goes back**: Escape also goes back one level
  - **Escape at top level**: Escape on the top level changes nothing
  - **Back text follows language**: the back button's text changes when the language changes (docs/authoring/ComponentContract.md#Text and Numbers)
- **Focus follows the level**: opening a submenu moves focus to its back button, and going back returns focus to the item that opened it
- **Reset menu**: `showTopLevel()` closes every open submenu and shows the top level (docs/manual/navigation/TopMenu.md#Methods)
- **Hidden level inert**: the level slid out of view is inert, so focus never lands on it (docs/manual/navigation/TopMenu.md#Accessibility)

## Choosing an item
- **Item selected event**: choosing an item without children dispatches `r-menu-selected` carrying the item (docs/manual/navigation/TopMenu.md#r-menu-selected)
  - **Item with route** [removed]: the item carried by the event holds its route, so a listener can navigate to it
  - **Event crosses shadow roots**: the event bubbles and reaches a listener outside the shadow root the menu sits in
- **Link items**: an item with `href` is a link the browser follows, after `r-menu-selected` is dispatched for it (docs/manual/navigation/TopMenu.md#Usage)
  - **Client-side routing**: with routing started, a link to a defined route navigates without reloading the page
- **Stays after a choice**: choosing an item inside a submenu leaves that submenu shown until the application calls `showTopLevel()` (docs/manual/navigation/TopMenu.md#showTopLevel())
