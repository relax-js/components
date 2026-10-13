---
feature: Days left
status: verified
authored: planned
---

# Days left

## Goal
A reader sees how many days remain to a deadline, marked by how urgent it is, so what has no slack left stands out from what only needs planning.

## Counting down to a deadline
- **Days text**: `<r-days-left days="5">` reads "5 days", with the word from the `days` text of the `r-components` namespace (docs/manual/dashboard/DaysLeft.md#Usage)
- **Deadline tone**: the element carries `data-tone` `danger` when `days` is at most `urgent`, `warn` when it is at most `soon`, and `muted` beyond that, with `urgent` 7 and `soon` 14 by default (docs/manual/dashboard/DaysLeft.md#Usage)
  - **Threshold days**: with the defaults, 7 days is `danger`, 8 and 14 days are `warn`, and 15 days is `muted`
- **Own thresholds**: `urgent` and `soon` attributes replace the 7 and 14 day thresholds (docs/manual/dashboard/DaysLeft.md#Attributes)
- **Deadline passed**: 0 days reads "0 days" and a negative count reads as days overdue, such as "3 days overdue" for `-3`, from its own text in the `r-components` namespace, both with tone `danger`
- **Days observed**: changing `days` updates the text and tone (docs/manual/dashboard/DaysLeft.md#Attributes)
  - **Thresholds changed**: changing `urgent` or `soon` on a drawn element updates its tone
- **Not a whole number**: a missing `days`, or one that is not a whole number, reports an error and the element shows no text and carries no `data-tone` (docs/manual/dashboard/DaysLeft.md#Attributes)
- **Bad thresholds**: an `urgent` or `soon` that is not a number reports an error and the element shows no text and carries no `data-tone` (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
  - **Thresholds reversed**: an `urgent` larger than `soon` is bad input the same way
- **Exported rule matches**: `deadlineTone(days, urgent, soon)` gives the same tone as the element for the same values, and throws when `days` is not a whole number (docs/manual/dashboard/DaysLeft.md#Usage)
