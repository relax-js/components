---
feature: Dashboard foundations
status: approved
authored: planned
---

# Dashboard foundations

## Goal
A developer builds an overview page from small dashboard elements that the theme and the page's own CSS style, that take data through attributes or a property, that speak the reader's language and write values in the configured locale and currency, and that report bad input instead of hiding it, so a wrong figure is never shown as if it were right.

## Putting a component on a page
- **Page styles the components**: dashboard components render into the light DOM, so the page's CSS reaches all their markup (docs/authoring/ComponentContract.md#Styling)
- **Structured data in a property**: lists and series are set as a property by the page, and setting it on a connected element redraws it (docs/authoring/ComponentContract.md#Data In, Events Out)
  - **Set before connecting**: data set before the element is connected is drawn when it connects
  - **Set while detached**: data set while the element is out of the page is drawn when it is put back
- **Draw once**: a component that builds its own markup does not build it again, or duplicate what it added, when the element is moved in the DOM and reconnects (docs/authoring/ComponentContract.md#Drawing Once)
- **Bad input reported**: a missing or invalid attribute is reported through the Relaxjs error channel as `<tag>: <what is wrong>` and the element renders empty, without throwing and without substituting a guessed value (docs/authoring/ComponentContract.md#Failing Loudly)
  - **Bad structured data**: data set as a property that the component cannot draw is reported and rendered empty the same way
  - **Fixed input redraws**: once the attribute or data is valid again, the element draws normally
- **Invariant attribute values**: a number in an attribute is read as a JavaScript number literal and a date as ISO 8601, and a localized value such as `1 285 400` is bad input (docs/authoring/TextAndValues.md#Values in Attributes)
- **Wrong use from code**: a function or method called with arguments it cannot act on throws an error naming the component and what was wrong (docs/authoring/ComponentContract.md#Failing Loudly)
- **Never colour alone**: anything shown with a tone also shows an icon or text saying the same (docs/authoring/DesignLanguage.md#Tones)
- **Theme colours**: each component's own stylesheet takes every colour from the theme's variables, each used for what it is meant for, and holds no colour value of its own (docs/authoring/Theming.md#Variables)
- **Tone colours**: the theme stylesheet gives an element with `data-tone` the `--tone` and `--tone-soft` of that tone's status pair, with `warn` taking `--status-warning`, and tone colouring uses only those two (docs/authoring/Theming.md#Tones)

## Reading a tone
- **Missing tone**: reading the `tone` attribute gives one of `ok`, `info`, `warn`, `danger` or `muted`, and the component's fallback tone when the attribute is absent (docs/authoring/CustomComponents.md#Tones)
  - **Unknown tone**: an unknown value reports an error and gives the fallback tone
- **Default tone icons**: ok shows `check-circle`, info `clock`, warn `minus-circle`, danger `x-circle` and muted `info` (docs/authoring/DesignLanguage.md#Tones)

## Formatting for a locale
- **One formatting config**: `configureFormatting({ locale, currency })` sets the locale and currency that every component in the package writes numbers, amounts and dates with (docs/authoring/ComponentContract.md#Text and Numbers)
  - **Local time zone**: a date is written in the browser's time zone, never converted to UTC or another zone
- **Default formatting**: without configuration the locale is the one `Intl` uses by default, and the currency is that of the locale's region (docs/authoring/TextAndValues.md#Defaults)
  - **Same as the browser**: an unconfigured number or date reads the same as `toLocaleString()` on that page
  - **Region currency**: with default locale `sv-SE` or `en-SE`, an unconfigured amount is written in `SEK`
  - **No currency**: when the region has no single currency, an amount shows its grouped number with no unit
- **Read at draw time**: a component uses the config and the words as they stand when it draws (docs/manual/Formatting.md#Usage)
  - **Config changed after drawing**: after `configureFormatting` alone, an element already drawn keeps its output until it next draws
  - **Language changed**: after `setLocale()`, every connected component redraws its words and values (docs/authoring/TextAndValues.md#Changing Language)
- **Attribute overrides config**: a per-element attribute takes precedence over the config for that element only (docs/manual/Formatting.md#Usage)
- **Words from the namespace**: every word a component writes, visible or not, comes from the `r-components` namespace, and passing `texts` to `configureFormatting` throws an error saying words are reworded through that namespace.
  - **Without i18n**: with no locale set or the namespace not loaded, components show the English texts and never a key
  - **Missing key**: an app namespace that lacks a key shows that key's English text
  - **Shipped languages**: the `en` and `sv` files have exactly the same keys
- **Plural words**: a word that depends on a count takes its plural form from the locale, with the number grouped as the locale groups it (docs/authoring/TextAndValues.md#Plurals)
  - **One and many**: in English, Days left reads `1 day` and `5 days`
