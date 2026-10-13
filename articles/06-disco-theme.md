---
title: Your business components can party. Mine run a disco on one variable.
published: false
description: A component library is not locked to its look. Name every colour by what it is for, and one turning hue repaints charts, meters and tiles in a full light show without touching a component.
tags: css, webcomponents, design, webdev
series: Business UI with plain Web Components
---

Business components are built to look calm, with tables in beige, meters in sage and charts in sensible blues. So when you need them to look like something else, such as a kiosk, a campaign page or the big screen at a company party, you assume you will have to fight them. You won't, as long as the library names every colour by what it is for. Then you can turn the whole thing into a disco by changing one number.

I built exactly that to prove the point. Run `npm run demo:disco` in [relax-js/components](https://github.com/relax-js/components) and you get Club Relax: stat tiles, an equalizer, a dance-floor heatmap and a DJ booth full of meters, all pulsing to 126 BPM in colours that slide through the whole spectrum. Not one of those components knows it is at a party.

## The habit: restyle each component

You have seen this stylesheet, and maybe you wrote it. I have:

```css
.my-table th { background: #ff00aa !important; }
.my-meter .bar-inner { background-color: lime !important; }
.chart-wrapper svg rect:nth-child(odd) { fill: cyan !important; }
.chart-wrapper svg rect:nth-child(even) { fill: magenta !important; }
```

It works until the chart library changes its markup, the odd and even rects swap places, and the next version ships a new tooltip that is still beige. Every override is a bet on someone else's internals, and sooner or later you lose one.

There is a fair counter-argument. A component library should protect its look, since consistency is the reason you picked one, and a library that lets you paint anything also lets you paint something ugly. That is true, but it is an argument for good defaults, not for locks. A library can ship a calm default and still give you a clean way out.

## The cure: colours named by intent

Every component in this library reads its colours from variables named for what they do. `--surface-raised` is something lifted off the page, `--series-1` to `--series-5` are chart series in order, `--scale-low` and `--scale-high` are the ends of a heatmap, and `--status-danger` means "this is wrong". You will not find a `--meter-fill-color` or a `--card-bg`.

That one rule is what makes the disco cheap. You never restyle a meter; you redefine what "danger" looks like tonight, and the meter follows.

The package splits its theme into two files. `theme-sizes.css` holds spacing, radius and motion, and `theme-colors.css` holds the palette. So the disco loads only the sizes and brings its own colours:

```ts
import '@relax.js/components/theme-sizes.css';
import './styles.css';
```

## One hue to rule the room

The whole trick is a number that the browser can animate. Register it with `@property` and let it turn:

```css
@property --hue {
    syntax: '<number>';
    inherits: true;
    initial-value: 0;
}

:root {
    animation: hue-turn 16s linear infinite;
}

@keyframes hue-turn {
    to { --hue: 360; }
}
```

Every colour is then worked out from that hue with `oklch()`, which keeps the brightness steady while the colour spins. The chart series are spread around the colour wheel, so neighbouring series never land on the same colour:

```css
:root {
    --series-1: oklch(78% 0.25 var(--hue));
    --series-2: oklch(78% 0.25 calc(var(--hue) + 140));
    --series-3: oklch(78% 0.25 calc(var(--hue) + 70));

    --scale-low:  oklch(20% 0.08 calc(var(--hue) + 200) / 0.6);
    --scale-high: oklch(85% 0.3 var(--hue));

    --surface-raised: oklch(20% 0.08 calc(var(--hue) + 280) / 0.55);
}
```

Over each sixteen-second lap, the equalizer's left channel moves from hot pink through lime to electric blue, with the right channel chasing it 140 degrees behind, while the dance floor glows in whatever colour the room happens to be.

Does that reach into Shadow DOM? Yes, because custom properties inherit through shadow roots. A chart drawn inside its own shadow tree picks up the new `--series-1` on every frame, without `::part()`, `!important` or anyone reaching into its markup.

## Keep the meaning, lose the beige

There is one set of colours I did NOT put on the wheel, and that is the status colours:

```css
--status-ok:      oklch(86% 0.25 145);   /* neon green */
--status-warning: oklch(90% 0.19 100);   /* acid yellow */
--status-danger:  oklch(70% 0.29 350);   /* hot pink */
```

When the volume meter crosses 110 dB, it has to read as "too loud" whatever colour the room is. If danger turned green every sixteen seconds, the meter would be lying half the time. So the tones got brighter but kept their meaning, and that is the line between theming and vandalism.

## Then make it move

The components only draw the data they are given. The beat lives in one small file of plain TypeScript, where a `setTimeout` at 60000 / BPM feeds them new numbers.

The equalizer is an ordinary bar chart with two series and a fixed ceiling:

```ts
document.querySelector<BarChart>('#equalizer')!.data = {
    labels: bands,
    series: [
        { name: 'Left', values: equalizerLevels(kick) },
        { name: 'Right', values: equalizerLevels(kick) },
        // A fixed ceiling keeps the axis still while the bars jump.
        { name: 'Clipping', values: bands.map(() => 100), threshold: true },
    ],
    summary: 'Live levels per frequency band',
};
```

Without the threshold series, the axis rescales to the highest bar on every update and the whole chart wobbles like a bad tripod. With it, the dashed "Clipping" line stays put and only the bars dance.

The dance floor is a heatmap with a sine ripple running out from the middle, and the meters are plain attributes such as `value="104"` that switch tone on their own as they cross their limits. Behind them, radial gradients drift into each other (two more animated `@property` values), two spotlights sweep with `mix-blend-mode: screen`, a mirror ball spins as one `repeating-conic-gradient`, and the cards are frosted glass thanks to `backdrop-filter`. On every beat, one Web Animations call makes the whole room flash.

None of that is library code. It is your CSS and your page, sitting next to the components.

## Where it does not fit

- **It costs frames.** Animating a variable on `:root` restyles the whole page many times a second, and `backdrop-filter` on every card adds to the bill. An old laptop will let you know about it, loudly. That is fine for a party screen, but not for the order desk your staff use eight hours a day.
- **Motion is not for everyone.** Under `prefers-reduced-motion`, the demo stops the spinning, sweeping and flashing but keeps the colours. Do the same, or your demo becomes the reason someone gets a headache. (I forgot this in the first version. Of course I did.)
- **Contrast becomes your job.** With the default palette, readable text is the library's problem; with your own palette, it is yours. (I checked mine by squinting. Do better.)
- **It needs a recent browser.** `@property` and `oklch()` require a browser from 2024 or later.

## The takeaway

What locks you into a library's look is not the library itself but the way it names its colours. Name every colour by what it is for, and a calm business dashboard and a disco become the same components with a different stylesheet. Keep the status colours meaning what they mean, and everything else is free to dance.
