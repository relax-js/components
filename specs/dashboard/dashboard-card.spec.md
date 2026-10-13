---
feature: Dashboard card
status: verified
authored: planned
---

# Dashboard card

## Goal
A developer frames one area of an overview page as a card that says what it is about, why it matters in one sentence, and links to the full list, with the page's own content as the body.

## Showing an overview card
- **Card tier**: the card takes its radius, padding, gap and border from the `--card-*` role variables and casts no shadow (docs/manual/Card.md#Variables)
- **Still under the pointer**: the card does not change its background when the pointer hovers over it
- **Text as given**: the heading, lead and link text are shown exactly as given, as text, never parsed as markup or translated (docs/authoring/TextAndValues.md#Data Is Shown as Given)
- **Icons with r-icon**: every icon in the heading row, including the link's arrow, is an `r-icon` (docs/authoring/DesignLanguage.md#Icons)
- **Heading row first**: `<r-card>` puts a `.card-head` holding the icon, an `hgroup`, the action and the link, in that order, before its existing children, which stay as the body (docs/manual/Card.md#Parts)
- **Heading**: the `heading` attribute is the text of the `<h2>` in the heading row's `hgroup` (docs/manual/Card.md#Attributes)
  - **Missing heading**: a missing or empty `heading` logs `r-card: heading is missing` and leaves out the heading row while the body stays
- **Lead**: the `lead` attribute is a paragraph under the heading in the `hgroup` (docs/manual/Card.md#Attributes)
  - **No lead**: an empty or missing lead leaves the lead out
- **Heading icon**: the `icon` attribute shows that icon in the heading row (docs/manual/Card.md#Attributes)
  - **No icon**: an empty or missing icon on a card without a tone leaves the icon out
- **More link**: `link-text` and `href` add a link to `href` with an arrow icon to the heading row (docs/manual/Card.md#Attributes)
  - **No link text**: an empty or missing `link-text` leaves the link out
  - **No href**: a `link-text` without `href` logs an error naming `r-card` and leaves the link out
- **Action in heading row**: a direct child with `slot="action"` is moved into the heading row (docs/manual/Card.md#Slots)
  - **Nested action**: an element with `slot="action"` deeper than a direct child stays where it is
- **One heading on reconnect**: moving the card in the DOM never adds a second heading row (docs/manual/Card.md#Usage)
  - **Action after a move**: a card moved after its action went into the heading row still has that one action there
- **Attribute change in place**: changing `heading`, `lead`, `icon`, `link-text`, `href` or `tone` on a connected card updates its heading row without building a second one

## Marking a card with a tone
- **Card accent**: the `tone` attribute is reflected on the card as `data-tone`, which gives the card its accent (docs/manual/Card.md#Attributes)
  - **No tone**: a card without `tone` has no `data-tone` and no accent
  - **Unknown tone**: an unknown tone logs an error and the card has no `data-tone`
- **Tone icon in place of icon**: a card with a tone and no `icon` shows that tone's default icon in the heading row (docs/authoring/DesignLanguage.md#Tones)
  - **Own icon wins**: a card with both a tone and an `icon` shows only its own icon, leaving its lead to say the tone in words
