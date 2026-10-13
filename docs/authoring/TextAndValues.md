# Text and Values

How a component gets the words it shows and writes the numbers, amounts and dates it shows. What an app configures is in [Formatting](../manual/Formatting.md).

## Where Each Part Comes From

A component uses Relaxjs where Relaxjs already solves the problem, and the browser's `Intl` where Relaxjs adds nothing.

| What | Comes from | Why |
|------|------------|-----|
| Words: labels, button texts, accessible names, messages | Relaxjs i18n, namespace `r-components` | It already has namespaces, ICU plurals, lazy loading, overriding and locale switching |
| Locale for values | The formatting configuration (`configureFormatting({ locale })`), then the browser's default | Relaxjs reduces its locale to a language (`sv-SE` becomes `sv`), and a region changes how dates and numbers are written |
| Currency | The formatting configuration, then the currency of the locale's region | Currency is not a language setting |
| Numbers, amounts, dates, lists, sorting | `Intl`, through the package's shared formatters | The Relaxjs `currency` and `date` pipes use the language-only locale and default to USD |

An attribute on one element, such as `locale` or `currency`, overrides the configuration for that element only.

## Defaults

Without configuration a component writes values exactly as the browser does, so a page mixing components with native controls and `toLocaleString()` reads as one.

- **Locale:** the locale `Intl` uses when given none (`new Intl.NumberFormat().resolvedOptions().locale`), not `navigator.language`. The two can differ: an English browser on a Swedish system formats as `en-SE`, writing `1,285,400.5` with Swedish dates.
- **Currency:** the browser has no currency setting, so the default is the official currency of the default locale's region. The region comes from `new Intl.Locale(locale).maximize().region`, so `sv` gives `SE` and `SEK`, and `en-SE` gives `SEK` too. A region without one currency, such as `419` (Latin America), gives no currency, and an amount is then written as a grouped number without a unit.
- **Time zone:** the browser's own. A component never converts dates to UTC or to another time zone for display.

The defaults are resolved when a component draws, never fixed when the package is imported, so a test or a page that changes the default locale gets matching output.

## Words

Every word a component writes, visible or not (`aria-label`, `title`, visually hidden text), is a key in the `r-components` namespace. A component never writes a literal string.

- The package ships `locales/en/r-components.json` and `locales/sv/r-components.json` and registers both with `registerNamespace` when it is imported.
- A component asks for a word through the package's `text(key, values?)` helper, never through `t()` directly. The helper calls `t('r-components:<key>', values, { fallback })` with the English message as the fallback, so a component shows English when the app has not set up i18n or has not loaded the namespace, and never shows a key.
- The key type is `keyof` the English file, so a misspelled key fails to compile.
- Keys are flat camelCase and named for what the text says, not for the component (`noData`, `previousPage`). Two components that say the same thing share a key.
- A key added to `en` is added to `sv` in the same change.

An app rewords or translates the components by registering its own `r-components` namespace, which replaces the shipped one for that locale, as with `r-validation`.

## Messages with Values

Text that combines words with values is one message with placeholders, never strings joined in code, because word order differs between languages:

```json
{ "tileTitle": "{item}: {state}", "monthOfYear": "{month} {year}" }
```

A placeholder gets text that is already formatted. A component formats the number or date with the shared formatters first and passes the result.

## Plurals

A word that depends on a count is an ICU plural message. The count selects the branch, and the formatted number goes in its own placeholder outside the plural block:

```json
{ "daysLeft": "{n} {count, plural, one {day} other {days}} left" }
```

```typescript
text('daysLeft', { count: days, n: formatNumber(days) });
```

`#` inside a branch is not used: it writes the raw number without the locale's digit grouping, and the Relaxjs formatter does not resolve a placeholder nested inside a branch.

## Values

A component writes every number, amount and date through the shared formatters in `foundations/formatting` (`formatValue`, `formatAmount` and others), which call `Intl` with the resolved locale and currency. One kind of value is written one way in the whole package: a chart that shows amounts writes them with `formatAmount`.

- Numbers and amounts use `Intl.NumberFormat`, dates `Intl.DateTimeFormat`, and relative times such as "yesterday" `Intl.RelativeTimeFormat`.
- A list of names joined for reading uses `Intl.ListFormat`, and text sorted for display uses `Intl.Collator`. Neither is joined with commas or compared with `<`.
- A component never calls `toLocaleString()` without a locale, never builds separators or currency symbols itself, and never uses the Relaxjs `currency`, `date` or `daysAgo` pipes.
- A formatter that cannot format with the given locale or currency reports it as described in [Failing Loudly](ComponentContract.md#failing-loudly).

## Values in Attributes

A value written in an attribute is in invariant form, never localized: numbers as JavaScript number literals (`value="-1285400.5"`) and dates as ISO 8601 (`date="2026-10-13"`). A component parses them with `Number()` and as ISO dates, and anything else is bad data.

## Data Is Shown as Given

Text that arrives as data, such as a column title, a menu label or a cell holding a string, is shown exactly as given and set with `textContent`. A component never translates data: the app passes text that is already in the reader's language.

## Templates

A value that can appear in a Relaxjs template gets a pipe that writes the same text as the element and the function, such as `amount` for `formatAmount`. The package exports a pipe registry that adds its pipes to the Relaxjs built-ins from `createPipeRegistry()`, and the app passes it to `compileTemplate`.

A component that builds its own markup with `compileTemplate` writes values through the same pipes and words through `text()`.

## Changing Language

A component draws with the words and configuration as they stand at that moment. While connected, it listens for the Relaxjs `localechange` event on `document` and redraws its words and values. It removes the listener when disconnected. An app that changes language calls `configureFormatting` before `setLocale`, so that one redraw gets both.

`configureFormatting` on its own does not redraw anything already drawn.

## Testing

- One test checks that every file in `locales/` has exactly the keys of `en`. The compiler catches a missing key but not an extra one (Relaxjs docs, `i18n/typed-copy.md`, "Keeping languages in sync").
- A component's tests run in English and in one other locale, and assert formatted output for both (`1 285 400 kr` in `sv-SE`).
- Tests call `resetFormatting()` and restore the Relaxjs locale after changing it.
