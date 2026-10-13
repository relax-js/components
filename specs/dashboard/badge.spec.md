---
feature: Badge
status: verified
authored: planned
---

# Badge

## Goal
A reader picks up a short status or a count beside something, such as "Draft" on a record or the number of unread items in a menu, from a small toned badge that sits in the line rather than standing apart from it as a status mark with its icon and note does, and whose tone is never told by colour alone.

## Labelling something
- **Text content**: the badge shows the page's text exactly as given, never translated, and shows new text as soon as the page changes it (docs/authoring/TextAndValues.md#Data Is Shown as Given)
  - **Empty badge**: a badge with no text and no count is hidden and reports nothing
- **Badge tone**: the badge carries its `tone` attribute as `data-tone`, `muted` when absent, and follows a change of `tone` (docs/authoring/DesignLanguage.md#Tones)
  - **Unknown tone**: an unknown `tone` reports an error and the badge is `muted` (specs/dashboard/dashboard-foundations.spec.md#Reading a tone)
- **No icon on text**: a badge showing text shows no icon, since its text says what its tone means

## Counting items
- **Count**: a badge with a `count` attribute shows that number written for the configured locale in place of its text (specs/dashboard/dashboard-foundations.spec.md#Formatting for a locale)
  - **Bad count**: a count that is negative, fractional or not a number literal reports an error and the badge renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
  - **Language changed**: after `setLocale()`, the count is written in the new locale
  - **Count changed**: changing `count` shows the new number
- **Zero count**: a count of 0 hides the badge
- **Large counts**: with a `max` attribute, a count above it shows as that maximum followed by a plus, worded from the `r-components` namespace, and without `max` the full number is shown
  - **Bad max**: a `max` that is not a whole positive number literal reports an error and the badge renders empty
- **Toned count icon**: a count badge with a tone other than `muted` shows that tone's default icon before the number (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
