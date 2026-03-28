# Table

A data table component with declarative column definitions and pagination support.

## Usage

### Declarative Columns

```html
<r-table>
    <r-columns>
        <r-column name="id">ID</r-column>
        <r-column name="name">Name</r-column>
        <r-column name="email">Email</r-column>
    </r-columns>
</r-table>
```

```typescript
const table = document.querySelector('r-table') as Table;
table.setData([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]);
```

### Template-based Columns

```html
<r-table>
    <template>
        <r-columns>
            <r-column name="id" width="50px">ID</r-column>
            <r-column name="name" width="*">Name</r-column>
            <r-column name="status" sortOrder="ascending">Status</r-column>
        </r-columns>
    </template>
</r-table>
```

### Programmatic Setup

```typescript
import { Table, ColumnDefinition } from '@relax.js/components';

const columns: ColumnDefinition[] = [
    { property: 'id', title: 'ID', width: '50px' },
    { property: 'name', title: 'Name', width: '*' },
    { property: 'email', title: 'Email' }
];

const table = new Table(columns);
document.body.appendChild(table);
table.setData(data);
```

## Pagination

```typescript
const table = document.querySelector('r-table') as Table;

table.pageLoader = async (pageNumber: number) => {
    const response = await fetch(`/api/users?page=${pageNumber}`);
    return response.json();
};

table.page(1);
```

## Methods

### setData(data: unknown[])

Renders the table with the provided data array.

```typescript
table.setData([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
]);
```

### addRow(item: unknown)

Appends a single row to the table.

```typescript
table.addRow({ id: 3, name: 'Charlie' });
```

### page(pageNumber: number)

Loads and displays a specific page. Uses cached data if available, otherwise calls `pageLoader`.

```typescript
table.page(2);
```

## Types

### ColumnDefinition

```typescript
interface ColumnDefinition {
    property: string;
    title: string;
    width?: string;
    sortOrder?: 'ascending' | 'descending';
}
```

| Property | Description |
|----------|-------------|
| `property` | Data object key to display |
| `title` | Column header text |
| `width` | Width specifier: `"50px"`, `"10%"`, or `"*"` (fill) |
| `sortOrder` | Initial sort direction |

## Components

### Table (r-table)

The main table container. Renders `<table>` with `<thead>` and `<tbody>`.

### ColumnsElement (r-columns)

Container for column definitions. Place inside `r-table` or a `<template>`. The element is removed from the DOM after columns are parsed. It is purely declarative config and is not needed at render time.

> **Note:** Because `r-columns` is removed on first connect, moving an `r-table` to a different part of the DOM (which triggers a disconnect/reconnect cycle) will not re-read the column definitions. Columns are preserved via the internal `columns` array, so the table will still render correctly. However, any `r-columns` added after the first connection will be ignored.

### ColumnElement (r-column)

Individual column definition.

| Attribute | Description |
|-----------|-------------|
| `name` | Maps to data property |
| `width` | Column width |
| `sortOrder` | `"ascending"` or `"descending"` |
| `transformer` | Optional data transformation |

Text content becomes the column header title.

## Styling

The component renders a native `<table>` element:

```css
r-table table {
    width: 100%;
    border-collapse: collapse;
}

r-table th {
    background: var(--surface-bg);
    padding: 0.5rem;
    text-align: left;
    border-bottom: 2px solid var(--bd-muted);
}

r-table td {
    padding: 0.5rem;
    border-bottom: 1px solid var(--bd-muted);
}

r-table tr:hover {
    background: var(--surface-hover);
}
```
