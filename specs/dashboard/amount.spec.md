---
feature: Amount
status: verified
authored: planned
---

# Amount

## Goal
A reader sees money amounts grouped and formatted the way their locale writes them, as round figures in overviews and with decimals in detail views, with movements showing their sign and losses written with a real minus sign. A developer writes an amount the same way wherever it appears: as an element in markup, from code, or in a relaxjs template.

## Showing an amount
- **Locale grouping**: `<r-amount value="…">` writes its value grouped and with the decimal mark and currency of the configured locale and currency (docs/manual/Amount.md#Usage)
  - **Swedish config**: configured with `sv-SE` and `SEK`, `value="1285400"` reads `1 285 400 kr`
  - **Relaxjs locale ignored**: with the formatting configured as `sv-SE` and the relaxjs locale set to `en`, the amount still reads the Swedish way
- **Round by default**: an amount shows whole figures unless `decimals="2"` asks for two decimals (docs/manual/Amount.md#Attributes)
- **Without unit**: `unit="none"` leaves the currency out (docs/manual/Amount.md#Attributes)
- **Real minus sign**: a negative amount is written with a real minus sign (−), whatever sign the locale itself writes
- **Signed movement**: `signed` shows the sign of a non-zero amount both ways, as `+3 200 kr` or `−3 200 kr`, and no sign on zero (docs/manual/Amount.md#Attributes)
  - **Rounds to zero**: an amount that rounds to zero at the shown decimals, such as `-0.4` in whole figures, reads `0 kr` without a sign, signed or not
- **Negative marking**: with the `mark-negative` attribute, a negative amount carries the class `negative`, so the page styles every negative amount in one place
  - **Turns positive**: when the value changes from negative to zero or positive, the class is removed
- **Locale and currency attributes**: `locale` and `currency` attributes override the configured locale and currency for that amount (docs/manual/Amount.md#Attributes)
- **Attributes observed**: changing `value`, `decimals`, `unit`, `signed`, `mark-negative`, `locale` or `currency` reformats the amount (docs/manual/Amount.md#Attributes)
  - **Not a number**: a missing `value`, an empty one, or one that is not a JavaScript number literal, such as `1 285 400` or `1285400,5`, reports an error and renders empty, never `0 kr`
- **Bad options**: a `decimals` other than 0 or 2, a `unit` other than `none`, or a locale or currency that cannot be formatted with, reports an error and renders empty (specs/dashboard/dashboard-foundations.spec.md#Putting a component on a page)
- **Kept on one line**: an amount never breaks across lines between its digit groups or before its currency

## Formatting an amount from code
- **Format as a function**: `formatAmount(value, { decimals, withUnit, signed, locale, currency })` returns the same text the element shows for the same value and options (docs/manual/Amount.md#Usage)
  - **Wrong use from code**: a value that is not a finite number, a `decimals` other than 0 or 2, or a locale or currency that cannot be formatted with, throws an error naming the amount
- **Amount pipe**: the package's pipe registry, passed to `compileTemplate`, has an `amount` pipe that writes the same text as `formatAmount`, next to the relaxjs built-in pipes (docs/authoring/TextAndValues.md#Templates)
- **Pipe arguments**: the `amount` pipe takes, in any order, `0` or `2` for decimals, `signed`, `nounit` and a three-letter currency code, as in `{{change | amount:2:signed:EUR}}`
  - **Unknown argument**: any other argument throws an error naming the amount
  - **Empty value**: a `null` or `undefined` value gives empty text, so `| default:…` can follow it
  - **Value not a number**: any other value that is not a number reports an error and gives empty text, without throwing
