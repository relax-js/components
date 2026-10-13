import { reportProblem } from '../../foundations/problems/problems';
import type { TableColumn } from './Table';

/** Reads the `<r-column>` children of a table, or `undefined` after reporting an invalid one. */
export function readDeclaredColumns(host: HTMLElement): TableColumn[] | undefined {
    const declared = Array.from(host.querySelectorAll(':scope > r-column'));
    const columns: TableColumn[] = [];
    for (const element of declared) {
        const field = element.getAttribute('field');
        if (!field) {
            reportProblem('r-table', `<r-column> "${element.textContent?.trim()}" has no field attribute`);
            return undefined;
        }
        const sort = element.getAttribute('sort');
        if (sort !== null && sort !== 'asc' && sort !== 'desc') {
            reportProblem('r-table', `<r-column field="${field}"> has sort="${sort}", which is not asc or desc`);
            return undefined;
        }
        columns.push({
            field,
            title: element.textContent?.trim() ?? '',
            width: element.getAttribute('width') ?? undefined,
            sortable: element.hasAttribute('sortable'),
            sort: sort ?? undefined,
        });
    }
    return columns;
}
