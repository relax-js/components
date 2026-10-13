---
title: Web Components that work in React, Vue or a plain HTML file, without rewriting them
published: false
description: Your component library is married to your framework. A table built as a custom element is not, and that changes what an upgrade costs you.
tags: webcomponents, javascript, webdev, frontend
series: Business UI with plain Web Components
---

Your component library is married to your framework. When the framework moves on, you rewrite screens that worked fine. Build the table, the tabs and the charts as custom elements instead, and they move with you to whatever comes next.

This article shows the same components in a plain HTML file, in React and in Vue. And where the approach stops working.

## The habit

You pick React. Then you pick a React component library. Of course you do.

Those libraries are good. They are polished, well documented, and every developer you hire already knows one. If your team stays on one framework for the life of the app, that is a fine choice.

But business apps live long. An order desk built today will still take orders in eight years. In that time your framework will ship a new way to write components at least once, and your component library will follow with a major version or two. You do not pay for the library once. You pay every time either of them moves.

And then there is the old admin page nobody has rewritten yet. It needs the same table as the new screens. Your React table does not run there.

## The browser already has a component model

A custom element is a tag you define yourself. The browser creates it, tells it when it enters and leaves the page, and tells it when an attribute changes. Every framework renders HTML, so every framework can render a custom element.

I built [@relax.js/components](https://github.com/relax-js/components) on that: tables, tree views, tabs, menus, dialogs, charts and meters for business screens. Each is a plain custom element. Where the browser already has the part, the component uses it: the table is a native `<table>`, menus use the Popover API, dialogs use `<dialog>`.

Let's put them on three kinds of page.

## A plain HTML file

No bundler, no `npm install`. Save this and open it:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Orders</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@relax.js/components@2.0.0/dist/theme.css">
    <script type="module" src="https://cdn.jsdelivr.net/npm/@relax.js/components@2.0.0/+esm"></script>
    <style>
        body { font-family: system-ui; background: var(--surface-bg); color: var(--text-primary); }
    </style>
</head>
<body>
    <r-tabs>
        <r-tab label="Orders">
            <r-table page-size="2">
                <r-column field="number" sortable>Order</r-column>
                <r-column field="customer" sortable>Customer</r-column>
                <r-column field="total" sortable>Total</r-column>
            </r-table>
        </r-tab>
        <r-tab label="Notes">Nothing here yet.</r-tab>
    </r-tabs>

    <script type="module">
        await customElements.whenDefined('r-table');
        document.querySelector('r-table').rows = [
            { number: 'SO-10001', customer: 'Fjällbo AB', total: 12400 },
            { number: 'SO-10002', customer: 'Kvarnen HB', total: 860 },
            { number: 'SO-10003', customer: 'Ekdahl & Son', total: 3150 },
        ];
    </script>
</body>
</html>
```

You get two tabs, a sortable table with grouped numbers, and a pager.

Do note the one rule that trips everybody up: the records go in a property, not an attribute. Attributes are strings. A list in an attribute is a JSON string the component would have to parse and keep in sync with the property. So `rows`, `columns` and chart `data` are set from code, and scalars like `page-size` are attributes.

## The same table in React

The component is a DOM element, so React talks to it through a ref:

```tsx
import '@relax.js/components';
import '@relax.js/components/theme.css';
import { useEffect, useRef } from 'react';
import type { Table, TableColumn } from '@relax.js/components';

const columns: TableColumn[] = [
    { field: 'number', title: 'Order', sortable: true },
    { field: 'customer', title: 'Customer', sortable: true },
    { field: 'total', title: 'Total', sortable: true },
];

export function OrderList({ orders }: { orders: Order[] }) {
    const table = useRef<Table>(null);

    useEffect(() => {
        table.current!.columns = columns;
        table.current!.rows = orders;
    }, [orders]);

    return <r-table ref={table} page-size="10" />;
}
```

That works in React 18 and 19. React 19 also assigns a prop as a property when the element has one, so `rows={orders}` works there without the ref.

Events are plain DOM events. Listen with `addEventListener('r-tab-change', ...)` in an effect, and remove the listener in its cleanup.

In TypeScript, JSX does not read the browser's tag map, so `<r-table>` is an unknown element until you declare it once in `JSX.IntrinsicElements`. It's a few lines, and it's the only React-specific code you write.

## And in Vue

Tell the compiler which tags are not Vue components:

```ts
// vite.config.ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('r-') } } })
```

Then bind lists with `.prop`, so Vue sets a property instead of an attribute:

```vue
<r-table page-size="10" :columns.prop="columns" :rows.prop="orders" />
```

Same element, same CSS, same behaviour. `@r-tab-change="onTabChange"` listens to the event like any native one.

## "But it needs Relax.js core"

Yes. The package has one peer dependency, `@relax.js/core`, and you install it next to the components. The jsDelivr link above pulls it in for you.

Does that make "no framework" a lie? No. A framework calls your code. It owns the lifecycle, the rendering and the state. A library is called by your code. The components call core for four things:

- translating the words they show (`No data`, `Next`)
- reporting errors through one channel
- formatting values
- letting the router open a dialog, and only for a dialog you give a `name`

Core never renders your page and never owns a component's state. Your React app keeps doing what it did.

## Where it does not fit

The above is a guideline and not a law. Three cases where I would pick something else:

- **Server-side rendering matters.** Custom elements draw in the browser. React on the server sends the tag, and the table appears when the JavaScript runs. Behind a login that rarely matters. On a public landing page it does.
- **You need a component it does not have.** The library covers business screens: records, navigation, feedback and dashboards. There is no date picker and no autocomplete. For dates it expects the native `<input type="date">`.
- **Your team wants `<Table onSort={...}>`.** You get a DOM element with properties and events, not a framework component with callbacks. Some teams hate that. You can wrap one, but somebody has to write and keep that wrapper.

## The takeaway

A framework component library is paid for every time the framework moves. A library built on custom elements is paid for once. If your app will outlive your framework's current major version, and business apps usually do, build on what the browser already has.

Next in the series: server-side paging and sorting, with one async function.
