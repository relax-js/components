---
feature: Meter
status: verified
authored: planned
---

# Meter

## Goal
A reader sees how much of a limit is used, such as storage or a budget, as a labelled, filled track with the figures beside it, and the tone warns in colour and icon as the value nears or passes the limit, so running out never comes as a surprise.

## Showing usage against a limit
- **Meter inputs**: `<r-meter>` reads `label`, `value`, `max` as the limit, optional `warn-at` and `danger-at`, and an optional `unit`
- **Fill against limit**: the track is filled by the value's share of the limit
  - **Over the limit**: a value above the limit fills the whole track and the figures still show the real value
  - **Negative value**: a negative value fills nothing
- **Figures**: the meter writes "{value} of {limit}" as one message from the `r-components` namespace, with both numbers formatted for the configured locale (specs/dashboard/dashboard-foundations.spec.md#Formatting for a locale)
  - **Unit shown as given**: with `unit` set, each figure carries the unit exactly as the page wrote it, never translated (docs/authoring/TextAndValues.md#Data Is Shown as Given)
  - **No percentage**: the meter shows no percentage of the limit
- **Threshold tone**: the tone is `ok` below the warning threshold, `warn` from it and `danger` from the danger threshold, which by default are 80 % and 100 % of the limit
  - **At the limit**: a value equal to the limit is `danger`
- **Own thresholds**: `warn-at` and `danger-at` replace the default thresholds with values in the same unit as `value`
- **Rising usage only**: a lower value never gets a stronger tone than a higher one on the same meter
- **Tone shown in icon**: the meter carries its tone as `data-tone` and shows the tone's icon beside the figures (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Accessible meter**: the meter draws its own track and is exposed as `role="meter"` named by `label`, with a minimum of 0, the limit as maximum, the value as current value and the written figures as its value text
  - **Over the limit read out**: a value above the limit is reported with the limit as current value while the value text gives the real figures
- **Bad meter input**: a missing `label`, a `value` or `max` that is missing or not a number, a `max` of zero or less, or a `warn-at` above `danger-at` logs an error and the meter renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Changes in place**: changing any attribute of a connected meter updates its figures, fill and tone without building a second track (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
