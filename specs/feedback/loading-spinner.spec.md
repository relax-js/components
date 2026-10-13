---
feature: Loading spinner
status: verified
authored: planned
built: true
---

# Loading spinner

## Goal
A developer wraps an area that is waiting for data so it is dimmed under a spinner until the load finishes, while the rest of the page stays usable, telling sighted users and assistive technology alike that the area is busy.

## Showing a loading state
- **Loading attribute**: while the `loading` attribute is present, an overlay dims the wrapped content and shows a centered spinner, and removing it hides both (docs/manual/feedback/Spinner.md#Attributes)
  - **Attribute value ignored**: `loading="false"` still shows the overlay, since only the attribute's presence counts
  - **Loading from the start**: an element with `loading` in its markup is dimmed and its content inert as soon as it is connected
- **Loading property**: setting the `loading` property to true or false adds or removes the `loading` attribute and shows or hides the overlay, and reading it reports whether the attribute is present (docs/manual/feedback/Spinner.md#Properties)
- **Only the wrapped area**: the overlay covers only the spinner element's own box, so content outside it stays visible and usable (docs/manual/feedback/Spinner.md#Spinner)
- **No delay**: the overlay appears as soon as loading starts and goes as soon as it ends, with no delay before showing and no minimum time shown
- **Busy state**: the spinner carries `aria-busy` true while loading and false otherwise (docs/manual/feedback/Spinner.md#Accessibility)
- **Content inert while loading**: the dimmed content can be neither clicked nor focused while loading (docs/manual/feedback/Spinner.md#Accessibility)
  - **Usable again**: once loading ends, the content can be clicked and focused again
- **Loading announced**: when loading starts, screen readers are told the `loading` text from the `r-components` namespace, English "Loading", and nothing is announced while not loading
  - **Language change**: after `localechange` the announced text is in the new language
- **Fade in**: the overlay fades in over `--motion-base`, and appears without a fade when the user prefers reduced motion (docs/manual/feedback/Spinner.md#Variables)
  - **Ring under reduced motion**: the ring keeps spinning when the user prefers reduced motion

## Using my own spinner or look
- **Custom spinner**: an element placed in the `spinner` slot is shown and rotated like the ring, and the default ring is hidden (docs/authoring/DesignLanguage.md#Replaceable Visuals)
  - **Custom spinner removed**: removing the slotted element brings the default ring back
- **Themed ring**: the ring is `--spinner-size` wide and high, default `2.5rem`, with a `--spinner-thickness` line, default `3px`, in `--accent-primary` on a `--bd-muted` track (docs/manual/feedback/Spinner.md#Variables)
- **Styling parts**: a page can style the dimming layer through `::part(overlay)` and the default ring through `::part(ring)` (docs/manual/feedback/Spinner.md#Parts)
