---
title: Dark mode, currency formats and Swedish translations, each set in one place
published: false
description: Format where you render, and your second locale costs you every screen. Put formats, words and colours in one place each, and let components read them when they draw.
tags: webcomponents, css, i18n, webdev
cover_image: https://raw.githubusercontent.com/relax-js/components/main/demos/screenshots/finance-tracker-light.png
series: Business UI with plain Web Components
---

You add dark mode. Then a customer in Sweden. Suddenly every screen has its own idea of how to write 1234.5, and half your colours are hard-coded. Put each concern in one place: formats, words and colours. Components read from those places when they draw, and switching language changes the whole page at once.

![A household budget in English and Swedish, light and dark](https://raw.githubusercontent.com/relax-js/components/main/demos/screenshots/finance-tracker-dark.png)

The examples come from the finance demo in [relax-js/components](https://github.com/relax-js/components). Run `npm run demo:finance` and switch language from the menu.

## The habit: format where you render

```ts
cell.textContent = `$${order.total.toFixed(2)}`;
```

It works until the second locale. A Swede writes that amount as `12 400,00 kr`: space for thousands, comma for decimals, unit after the number. Now find every `toFixed` in forty screens.

`Intl.NumberFormat` is the obvious fix, and it is better. But then the locale is a parameter you pass around, or a string you hard-code in every call. The formatting is right, but the decision about which locale to use is still everywhere.

## Numbers, amounts and dates: one call

Set the locale and currency once, before anything draws:

```ts
import { configureFormatting } from '@relax.js/components';

configureFormatting({ locale: 'sv-SE', currency: 'SEK' });
```

Every component follows it. Table cells, meter figures, chart axes and the hover read-out:

```html
<r-amount value="1285400"></r-amount>   <!-- 1 285 400 kr -->
<r-amount value="-3200" signed></r-amount>  <!-- −3 200 kr -->
```

An element can override it with its own `locale` or `currency` attribute, for the one amount in euros on a Swedish page.

## Words: one namespace

Components show a few words of their own: `No data`, `Next`, `last year`, `3 days`. They come from the i18n namespace `r-components`, and English and Swedish ship with the package:

```ts
import { loadNamespace, setLocale } from '@relax.js/core/i18n';

await setLocale('sv');
await loadNamespace('r-components');
```

Need German? Register your own file for the namespace. A key you leave out shows its English text, so a half-done translation never shows a raw key:

```ts
import { registerNamespace } from '@relax.js/core/i18n';

registerNamespace('de', 'r-components', () => import('./locales/de/r-components.json'));
```

## Your own text is your job

Column titles and menu labels are shown as you pass them. The component does not translate them, because it can't know your words.

The demo keeps its fixed text in one JSON file per language, and lets TypeScript check them against each other:

```ts
import type en from '../copy/en.json';

export type FinanceCopy = typeof en;

// Typed as FinanceCopy, so a key missing from a translation fails to compile.
const copies: Record<Language, () => Promise<{ default: FinanceCopy }>> = {
    en: () => import('../copy/en.json'),
    sv: () => import('../copy/sv.json'),
};
```

Forget a key in `sv.json`, and the build fails. You find out before your Swedish users do.

Plurals don't fit in a plain copy file, since Swedish and English inflect differently. Those go through `t()` with ICU messages:

```json
{
    "overBudget": "{count, plural, =0 {Alla kategorier håller budget} one {# kategori är över budget} other {# kategorier är över budget}}"
}
```

```ts
t('finance:overBudget', { count: categories.filter((c) => c.spent > c.budget).length });
```

## Switching at runtime: the order matters

Here is the demo's language switch:

```ts
async use(language: Language): Promise<void> {
    // Formats first: components redraw on the locale change and read them then.
    configureFormatting(formats[language]);
    const [copy] = await Promise.all([copies[language](), setLocale(language)]);
    // setLocale clears what was loaded, so the namespaces load again for the new language.
    await Promise.all([loadNamespace('finance'), loadNamespace('r-components')]);
    this.currentCopy = copy.default;
    document.documentElement.lang = language;
    this.dispatchEvent(new LanguageChangedEvent(language));
}
```

Two lines in there are easy to get wrong:

- **Call `configureFormatting` first.** Components redraw when the locale changes and read the formats at that moment. Configure afterwards, and you get Swedish words with English numbers until the next redraw.
- **Load the namespaces again after `setLocale`.** It clears what was loaded for the old language.

The library's components redraw on their own. Your own elements don't. They listen for the app's `LanguageChangedEvent` and draw again.

## Colours: variables with `light-dark()`

The usual way to add dark mode is a second set of rules:

```css
.card { background: #fff; color: #222; }
.dark .card { background: #1b1d1f; color: #ece9e4; }
```

Every component, twice. And the day someone adds a component and forgets the `.dark` rule, it glows white in the middle of a dark page.

The theme defines each colour once, with both modes in the same line:

```css
:root {
    color-scheme: light dark;
    --surface-bg:     light-dark(#f7f5f1, #1b1d1f);
    --text-primary:   light-dark(#2b2a27, #ece9e4);
    --accent-primary: light-dark(#3f7a0d, #8fd14f);
}
```

The page follows the operating system. Put `dark-theme` or `light-theme` on `<html>`, or on any container, to force one mode inside it.

Your brand colour is one rule, loaded after the theme:

```css
:root {
    --accent-primary: light-dark(#0066cc, #4da6ff);
}
```

The selected tab, the focus ring, the spinner and the current page in a pager follow.

## One component, without a fight

A component's own variables change only that component, such as `--spinner-size`. Components that render into Shadow DOM expose named parts:

```css
r-tabs::part(tab) {
    padding: var(--control-padding);
}
```

The table and tree view render into the page itself, so plain selectors reach them. Their own styles sit in a cascade layer called `relax-components`, and any rule of yours outside a layer beats a layered rule. So `r-table th { ... }` wins without `!important` and without a specificity contest.

## Where it does not fit

- **One locale per page.** The configuration is global. An amount can override it, but a page that shows three languages side by side is not what this was built for.
- **Two languages ship.** English and Swedish. Anything else is a JSON file you write, with 27 short keys.
- **`light-dark()` needs a 2024 browser.** Every current browser has it. If you still support older ones, you need a fallback.

## The takeaway

Format, translate and colour in one place each, and never where you render. Components then follow a locale switch or a dark mode setting on their own, and adding the next language is a JSON file, not a hunt through forty screens.

Next in the series: how I designed the library so coding agents get it right the first time.
