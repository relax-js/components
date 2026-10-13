---
feature: Banner
status: verified
authored: planned
---

# Banner

## Goal
A user sees a notice that concerns the whole page, such as a maintenance window or an expired subscription, in a strip across the top of the page whose tone says in colour and icon how serious it is, that can offer the one thing to do about it, and that the user can close when the page allows it.

## Showing a notice
- **Message as given**: the banner's own children are its message and stay as the page wrote them, so a message may hold markup such as a link (docs/authoring/TextAndValues.md#Data Is Shown as Given)
  - **Moved banner**: moving the banner in the DOM never adds a second icon or close button (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Banner surface**: the banner takes the panel tier's role variables, is filled with `--tone-soft` and edged with `--tone`, and casts no shadow (docs/authoring/DesignLanguage.md#Shape and Elevation)
- **Banner tone**: the banner carries its `tone` as `data-tone` and shows that tone's icon before the message (docs/authoring/DesignLanguage.md#Tones)
  - **Tone changed**: changing `tone` on a drawn banner updates its `data-tone`, icon and role in place
- **Default tone**: a banner without `tone` is `muted`
  - **Unknown tone**: an unknown `tone` logs an error and the banner is `muted` (specs/dashboard/dashboard-foundations.spec.md#Reading a tone)
- **Banner action**: a direct child with `slot="action"` is moved to the end of the strip, while one marked deeper down stays where it is (docs/manual/Card.md#Slots)
- **Announced**: a `warn` or `danger` banner has `role="alert"`, and a banner of any other tone has `role="status"`

## Dismissing a notice
- **Opt-in close**: only a banner with the `dismissible` attribute shows a close button, whose accessible name comes from the `r-components` namespace (docs/authoring/ComponentContract.md#Text and Numbers)
- **Dismiss**: activating the close button sets `hidden` on the banner and fires `r-banner-dismiss` (docs/authoring/ComponentContract.md#Naming)
- **Not remembered**: the banner keeps no record of a dismissal, so the same banner on a new page load shows again unless the page leaves it out
