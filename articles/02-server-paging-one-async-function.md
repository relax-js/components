---
title: Server-side paging and sorting for an HTML table, with one async function
published: false
description: Hand-written table paging has a race condition almost everybody ships. Let the table ask for pages, pass the abort signal on, and the race is gone.
tags: webcomponents, typescript, webdev, javascript
cover_image: https://raw.githubusercontent.com/relax-js/components/main/demos/screenshots/back-office-light.png
series: Business UI with plain Web Components
---

You want a table that pages and sorts on the server. Usually that means state for the page, the sort, the loading flag and the total, plus code that throws away answers that arrive too late. With `<r-table>` you write one async function, and the table keeps the state.

## The habit

Most hand-written server tables look like this:

```ts
let page = 1;
let sort = { column: 'orderDate', direction: 'desc' };

async function load() {
    showSpinner();
    const response = await fetch(`/api/orders?page=${page}&sort=${sort.column}&direction=${sort.direction}`);
    const result = await response.json();
    drawRows(result.rows);
    drawPager(result.totalCount);
    hideSpinner();
}
```

It works on your machine. In production, someone clicks page 2 and then page 3. Page 2 is slow, so its answer arrives last, and the screen shows page 2's rows under a pager that says 3.

It IS a bug, and almost every table I have seen has it. You don't notice it on localhost, because every answer is fast there.

To be fair, fetching it yourself is simple and gives you full control. The fetch is not the problem. The problem is all the state around it, which you write again in every screen.

## The cure: the table asks, you answer

Declare the columns:

```html
<r-table page-size="15">
    <r-column field="number" sortable>Order</r-column>
    <r-column field="customer" sortable>Customer</r-column>
    <r-column field="orderDate" sortable sort="desc">Date</r-column>
    <r-column field="total" sortable>Total</r-column>
</r-table>
```

Then give the table a function that loads one page:

```ts
import type { Table, TableProvider } from '@relax.js/components';

const loadOrders: TableProvider = async ({ page, pageSize, sort, signal }) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (sort[0]) {
        query.set('sort', sort[0].column);
        query.set('direction', sort[0].direction);
    }
    const response = await fetch(`/api/orders?${query}`, { signal });
    return response.json(); // { rows: [...], totalCount: 312 }
};

document.querySelector<Table>('r-table')!.provider = loadOrders;
```

That is the whole screen. The table calls the function for the first page, and again for every click on a header or a page button. Pages are 1-based, and a header click goes ascending, descending, then back to the server's own order.

While a page loads, the table sets its `loading` attribute and `aria-busy`, and dims the rows. The pager hides when one page holds every row.

## The signal is the important part

Each time the table asks for a page, it aborts the signal of the request before. Pass the signal on to `fetch`, and the browser cancels the HTTP request the user no longer wants.

And if you forget? The table checks the signal when your answer comes back, and an answer to an aborted request is never drawn. Page 2 can arrive as late as it likes. The screen shows page 3.

## Filters: the mistake I made myself

A filter form above the table is the next thing every list screen needs. My first version reloaded the table on every keystroke:

```ts
form.addEventListener('input', () => table.refresh());
```

Looks fine. But `refresh()` loads the page the user is on. Stand on page 7, type a customer name that matches two pages of orders, and you get an empty page 7. (I made exactly this mistake in the demo app for this library. Yes, the app that is supposed to show how it's done.)

So when the filter changes, give the table a new provider for that filter instead:

```ts
function ordersMatching(search: string, status: string): TableProvider {
    return async ({ page, pageSize, sort, signal }) => {
        const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, status });
        if (sort[0]) {
            query.set('sort', sort[0].column);
            query.set('direction', sort[0].direction);
        }
        const response = await fetch(`/api/orders?${query}`, { signal });
        return response.json();
    };
}

form.addEventListener('input', () => {
    const data = new FormData(form);
    table.provider = ordersMatching(String(data.get('search')), String(data.get('status')));
});
```

Setting `provider` starts at page 1, and aborts the request in flight. Type fast, and every keystroke cancels the request before it. You may still want a debounce to spare your server, but you no longer need one to get the right rows.

`refresh()` is for when the data changed and the user should stay where they are:

```ts
await saveOrder(order);
await table.refresh();
```

It resolves once the page is drawn, so you know when to close the dialog.

## Records you already hold

Small lists don't need a server. Set `rows` instead:

```ts
table.rows = customers;
```

The table sorts and pages them itself. Under the hood `rows` is wrapped in a provider with the same contract, so there is one code path for both. When the list outgrows the browser, you swap `rows` for `provider` and the markup stays as it is.

In-memory sorting follows the configured locale and compares digits as numbers, so `SO-9` comes before `SO-10`.

## When the server fails

A provider that throws while the user pages or sorts does not break the screen. The rows on screen stay, the pager goes back to the page shown, and the table reports `r-table: the provider failed to load page` with your error, through the same error channel as the rest of the app. `refresh()` rejects with the error, so you can tell the user.

If you already use Relax.js core, its `DataLoader` takes the same request, so it plugs in with one line:

```ts
table.provider = (request) => loader.load(request);
```

## Where it does not fit

- **It sorts by one column.** The request carries a list of sort columns, but the table sends at most one.
- **A cell shows a value, not markup.** Numbers are grouped and dates written for the locale, but a status badge inside a cell is not something the table does.
- **There is no row click event.** The table draws plain rows. The demo listens for clicks on the table and maps the row's index back to the record it shows. That works, but it's code you write.
- **Your server has to count.** The pager needs `totalCount`. On a table with millions of rows, that `COUNT(*)` is a cost you should know about up front.

## The takeaway

The table owns the page, the sort and the race. You own one function that turns a request into rows. Pass the signal on, set a new provider when the filter changes, and the classic "page 2 shows up on page 3" bug cannot happen.

Next in the series: a live ops dashboard with no chart library and no framework.
