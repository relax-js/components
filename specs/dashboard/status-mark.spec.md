---
feature: Status mark
status: verified
authored: planned
---

# Status mark

## Goal
A reader sees where something stands, such as paid or overdue, with an icon for its tone and a date or reason underneath.

## Marking a status
- **Mark content**: `<r-status-mark>` replaces its content with the tone's icon, a `.label` holding its original text, and a `.note` from the `note` attribute (docs/manual/StatusMark.md#Usage)
  - **No note**: an empty or missing `note` leaves the `.note` out
  - **No label**: a mark with no text leaves the `.label` out and shows only the icon and the note
- **Default tone**: a mark without `tone` is `muted` (docs/manual/StatusMark.md#Usage)
  - **Unknown tone**: a `tone` that is not one of the five logs an error and the mark is `muted` (specs/dashboard/dashboard-foundations.spec.md#Reading a tone)
- **Tone reflected**: the mark carries its tone as `data-tone` (docs/authoring/DesignLanguage.md#Tones)
- **Draws once**: moving the mark in the DOM keeps its label and does not draw it again (docs/manual/StatusMark.md#Usage)
- **Tone and note observed**: changing `tone` or `note` after the mark is drawn updates its icon, `data-tone` and note and keeps its label
  - **Text changed after drawing**: changing the element's text after the mark is drawn does not change the label
