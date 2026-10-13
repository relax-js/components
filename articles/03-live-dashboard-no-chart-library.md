---
title: I built a live ops dashboard with no chart library and no framework
published: false
description: Stat tiles, a line chart against capacity, meters and a status grid, updating every second from one Server-Sent Events stream. All plain custom elements.
tags: webcomponents, dataviz, webdev, showdev
cover_image: https://raw.githubusercontent.com/relax-js/components/main/demos/screenshots/ops-dashboard-dark.png
series: Business UI with plain Web Components
---

A dashboard that updates every second usually means a chart library, a state store and a framework to glue them together. This one has none of the three. It's custom elements, one small service and a Server-Sent Events stream.

![The ops dashboard: four stat tiles with sparklines, a traffic chart against capacity, three meters and a service status grid](https://raw.githubusercontent.com/relax-js/components/main/demos/screenshots/ops-dashboard-light.png)

You can run it yourself: clone [relax-js/components](https://github.com/relax-js/components) and run `npm run demo:ops`.

## The habit

You need one chart, so you add a chart library. Then you need a figure with a trend line, so you add a sparkline package. Then each widget fetches its own data, and you add a store to keep them in step.

Chart libraries earn their place. They draw fifty chart types, zoom, pan and export, and they are battle-tested. If you need that, use one.

But look at what an ops dashboard actually shows: a few figures against a moment ago, a trend, a level not to cross, usage against a limit, and the state of each service. You pay for the fifty chart types anyway. And each chart is styled through its own configuration object instead of CSS, so dark mode becomes a second configuration.

Here is what it costs in bytes. Every component in `@relax.js/components`, the charts, table, tree view, menus and dialogs included, is 34 KB gzipped. Chart.js 4.4 on its own is 70 KB. (Both measured from jsDelivr's builds. Chart.js does a lot more, which is exactly the point.)

## The parts

The overview page is markup:

```ts
this.innerHTML = `
    <incident-banners></incident-banners>
    <live-figures class="figure-row"></live-figures>
    <div class="panels">
        <r-card heading="Traffic" lead="Requests per second, the last minute.">
            <live-traffic-chart></live-traffic-chart>
        </r-card>
        <r-card heading="Capacity" lead="Usage against what the fleet has.">
            <capacity-meters></capacity-meters>
        </r-card>
        <r-card heading="Services" lead="Where every service stands right now."
                link-text="Traffic details" href="/traffic">
            <service-health-grid></service-health-grid>
        </r-card>
    </div>
`;
```

The `r-` tags come from the library. The others are the app's own small elements, each feeding one library component:

- `<r-stat-tile>`: a figure against an earlier one, with a sparkline of the trend
- `<r-line-chart>`: series over time, including a dashed level not to cross
- `<r-meter>`: usage against a limit, turning to warning and danger tones
- `<r-status-grid>`: one tile per service, coloured by state
- `<r-card>`: the panel around each one

## One stream, one service

The tempting way to make a widget live is to let it fetch its own data:

```ts
class TrafficChart extends HTMLElement {
    connectedCallback() {
        setInterval(async () => {
            const response = await fetch('/api/telemetry/last-minute');
            this.draw(await response.json());
        }, 1000);
    }
}
```

Four widgets means four requests a second, four slightly different ideas of "now", and an interval that keeps running after the page is gone.

Instead, one service holds the last minute and tells whoever is watching when it changes:

```ts
export class Telemetry extends EventTarget {
    readonly samples: TelemetrySample[] = [];
    private source?: EventSource;

    watch(listener: () => void): () => void {
        this.addEventListener('change', listener);
        this.source ??= this.connect();
        return () => this.removeEventListener('change', listener);
    }

    private connect(): EventSource {
        const source = new EventSource('/api/telemetry');
        source.addEventListener('telemetry-sample', (event) => {
            this.samples.push(JSON.parse(event.data));
            if (this.samples.length > 60) {
                this.samples.shift();
            }
            this.dispatchEvent(new Event('change'));
        });
        return source;
    }
}

export const telemetry = new Telemetry();
```

One connection serves the whole page, however many widgets show it. The demo uses Relax.js core's SSE client and hands the service out through dependency injection, but `EventTarget` and `EventSource` straight from the browser do the same job.

## One widget

Here is the traffic chart. It watches the service while it is on the page, and draws every time a sample arrives:

```ts
import type { LineChart } from '@relax.js/components';
import { telemetry } from './telemetry';

const capacity = 1800;

class LiveTrafficChart extends HTMLElement {
    private readonly chart: LineChart = document.createElement('r-line-chart');
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.replaceChildren(this.chart);
        this.stopWatching = telemetry.watch(() => this.draw());
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const samples = telemetry.samples;
        if (samples.length < 2) {
            return;
        }
        this.chart.data = {
            labels: samples.map((s) => s.at),
            series: [
                { name: 'Requests per second', values: samples.map((s) => s.requestsPerSecond), area: true },
                { name: 'Capacity', values: samples.map(() => capacity), threshold: true },
            ],
            summary: 'Requests per second over the last minute, against capacity',
        };
    }
}

customElements.define('live-traffic-chart', LiveTrafficChart);
```

`area: true` shades under the line. `threshold: true` draws the capacity as a dashed line without markers. That's the whole configuration.

The other widgets follow the same rule as every component in the library: scalars are attributes, lists are properties. A stat tile gets its figures as attributes and its trend as a property:

```ts
tile.setAttribute('value', String(latest.p95Ms));
tile.setAttribute('previous', String(halfAMinuteAgo.p95Ms));
tile.setAttribute('better', 'lower');
tile.trend = { labels, series: [{ name: 'p95 latency (ms)', values }], summary: 'p95 latency over the last minute' };
```

`better="lower"` matters more than it looks. Latency going up is bad news, so the tile colours the change as bad. A dashboard that shows every rise in green is lying to you.

## No reactivity, no store

Does that mean the components re-render when the data changes? No. They redraw when you set an attribute or a property, and at no other time. There is no reactive system to reason about. If the screen is wrong, the last thing you set is wrong.

Once a second, sixty points per series, is nothing for an SVG to redraw.

## Dark mode and screen readers come with it

The series colours are CSS variables, `--series-1` to `--series-5`, each defined with `light-dark()`. The cover image of this article is the same page with the operating system set to dark. No second configuration.

A chart drawn on a canvas is an image to a screen reader, and you add the text alternative yourself. Here every chart is a `role="figure"` named by its `summary`, with a visually hidden table holding the same figures. You wrote the summary already: it is a required field of the data.

## Where it does not fit

- **Thousands of points per series.** SVG redraws the whole chart. For a minute of samples, that's fine. For a day of per-second data, use a canvas-based library.
- **Exploring the data.** There is no zoom, pan, brush or export. The charts answer "where are we now?", not "let me dig".
- **Chart types.** Line, area, bar, heatmap and sparkline. No pie, no scatter.

## The takeaway

An ops dashboard needs a handful of figures, trends and states, drawn the same way everywhere, not a chart library. Feed every widget from one service, set attributes and properties when data arrives, and let CSS handle the look.

Next in the series: dark mode, currency formats and Swedish translations, each set in one place.
