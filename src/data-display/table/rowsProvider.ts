import { formatting } from '../../foundations/formatting/formatting';
import type { TablePage, TablePageRequest, TableProvider, TableRow } from './Table';

/**
 * Serves rows that are already in memory through the same paging and sorting contract a
 * server-backed provider has, so `<r-table>` has a single code path for both.
 */
export function rowsProvider(rows: TableRow[]): TableProvider {
    return async (request: TablePageRequest): Promise<TablePage> => {
        const sorted = request.sort.length ? [...rows].sort(compareBy(request.sort)) : rows;
        const start = (request.page - 1) * request.pageSize;
        return { rows: sorted.slice(start, start + request.pageSize), totalCount: rows.length };
    };
}

function compareBy(sort: TablePageRequest['sort']): (a: TableRow, b: TableRow) => number {
    return (a, b) => {
        for (const { column, direction } of sort) {
            const result = compareValues(a[column], b[column], direction === 'asc' ? 1 : -1);
            if (result !== 0) {
                return result;
            }
        }
        return 0;
    };
}

function compareValues(a: unknown, b: unknown, direction: 1 | -1): number {
    if (a === b) {
        return 0;
    }
    if (a === null || a === undefined) {
        return 1;
    }
    if (b === null || b === undefined) {
        return -1;
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return (a - b) * direction;
    }
    if (a instanceof Date && b instanceof Date) {
        return (a.getTime() - b.getTime()) * direction;
    }
    return String(a).localeCompare(String(b), formatting().locale, { numeric: true }) * direction;
}
