# Formatting

How components write numbers, amounts and dates, and where the words they show come from.

## Usage

Numbers, amounts and dates follow one configuration of locale and currency:

```typescript
import { configureFormatting } from '@relax.js/components';

configureFormatting({ locale: 'sv-SE', currency: 'SEK' });
```

Words come from the Relaxjs i18n namespace `r-components`. English and Swedish ship with the package; load the namespace after setting the locale:

```typescript
import { setLocale, loadNamespace } from '@relax.js/core/i18n';

await setLocale('sv');
await loadNamespace('r-components');
```

- Without i18n set up, components show English.
- An attribute on one element, such as `locale` or `currency` on an [amount](Amount.md), overrides the configuration for that element.
- A component reads the configuration and the words as they stand when it draws, and redraws when `setLocale()` changes the language. To change both, call `configureFormatting` first.
- Text you pass in, such as column titles and menu labels, is shown as given. Translate it before passing it.

## Defaults

Without configuration, values are written the way the browser writes them: in the locale `Intl` uses by default, and with the currency of that locale's region (`sv-SE` gives `SEK`, `en-GB` gives `GBP`). Where the region has no single currency, amounts are written without a unit.

## Words

To reword a text, or to add a language, register your own `r-components` namespace. It replaces the shipped one for that locale:

```typescript
import { registerNamespace } from '@relax.js/core/i18n';

registerNamespace('de', 'r-components', () => import('./locales/de/r-components.json'));
```

A key missing from your file shows its English text.

| Key | English | Shown by |
|-----|---------|----------|
| `back` | `Back` | The back button of a [top menu](navigation/TopMenu.md) submenu |
| `noData` | `No data` | A [table](data-display/Table.md) without records |
| `pages` | `Pages` | Accessible name of a table's pager |
| `previousPage` | `Previous` | A table's pager |
| `nextPage` | `Next` | A table's pager |
| `lastYear` | `last year` | [KPI meter](KpiMeter.md) |
| `days` | `{n} {count, plural, one {day} other {days}}` | [Days left](DaysLeft.md) |
| `periodClosed` | `closed` | [Period grid](PeriodGrid.md) |
| `periodLocked` | `locked` | Period grid |
| `periodOpen` | `open` | Period grid |
| `periodComing` | `not started` | Period grid |

In a message, `{n}` is the number already formatted for the locale and `count` selects the plural form.
