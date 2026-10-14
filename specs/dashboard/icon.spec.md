---
feature: Icon
status: verified
authored: planned
---

# Icon

## Goal
A developer places a small line icon next to text by name; it matches the text's size and colour, stays out of the way of screen readers, and the set of icons can be extended by the app. Every icon the library's own components draw comes from the same set, so an app's shapes and the library's look alike.

## Showing an icon
- **Line icon**: `<r-icon name="…">` draws the named shape as inline SVG on a 24-unit grid, stroked with `currentColor` at width 1.75 with round caps and joins and no fill (docs/manual/foundations/Icon.md#Usage)
- **Follows the text**: the icon is one `em` square and takes its colour from the surrounding text (docs/authoring/DesignLanguage.md#Icons)
  - **Sized by the element**: setting the element's width and height sizes the shape, with no rule for the SVG inside (docs/manual/foundations/Icon.md#Usage)
  - **Never squeezed**: in a flex row the icon keeps its size
  - **Hidden icon**: an icon with `hidden` takes no space
- **Hidden from screen readers**: the icon always carries `aria-hidden="true"` (docs/manual/foundations/Icon.md#Accessibility)
- **Name change redraws**: changing `name` on a connected icon draws the new shape in place of the old one (docs/manual/foundations/Icon.md#Usage)
  - **Disconnected name change**: a name change while disconnected draws nothing until the icon connects, then draws the current name (docs/manual/foundations/Icon.md#Usage)
  - **Moved icon**: moving the icon elsewhere in the page never adds a second shape (docs/authoring/ComponentContract.md#Drawing Once)
- **Unknown name**: a name with no registered shape reports an error through the Relaxjs error channel starting with `r-icon:` and naming the name, and the icon shows no shape (docs/manual/foundations/Icon.md#Attributes)
  - **Unknown after known**: changing a drawn icon to an unknown name removes the shape it showed
  - **Missing name**: a missing or empty `name` reports an error starting with `r-icon:` and shows no shape (docs/authoring/ComponentContract.md#Failing Loudly)
  - **Named after connecting**: an icon created from code, put on the page and named by the same code reports nothing and draws the name (docs/manual/foundations/Icon.md#Usage)
  - **Template placeholder**: the unbound placeholder name a template carries before it binds the real name neither draws nor reports an error (docs/manual/foundations/Icon.md#Usage)

## Adding icons
- **Register icons**: `registerIcons(record)` adds shapes by name, each the SVG content of one 24-unit icon, that every icon can then use (docs/manual/foundations/Icon.md#Adding Shapes)
  - **Name already registered**: registering an existing name replaces its shape (docs/manual/foundations/Icon.md#Adding Shapes)
- **Registering redraws shown icons**: registering a name redraws every connected icon with that name, whether it showed no shape or the replaced one
- **Default set**: every icon the library's components draw is available without the app registering anything (docs/manual/foundations/Icon.md#Adding Shapes)
  - **Tone icons**: `check-circle`, `clock`, `minus-circle`, `x-circle` and `info` draw without registering (specs/dashboard/dashboard-foundations.spec.md#Reading a tone)
  - **Common app icons**: `user`, `home`, `search`, `settings`, `mail` and `calendar`, among other icons business apps need, draw without registering (docs/manual/foundations/Icon.md#The Default Set)
  - **Listing the set**: `defaultIcons`, exported from the package, gives every name in the default set with its shape (docs/manual/foundations/Icon.md#The Default Set)
