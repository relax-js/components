import '../../foundations/icon/Icon';
import { formatValue } from '../../foundations/formatting/formatting';
import { text } from '../../foundations/text/text';
import type { SortDirection, TableColumn, TableRow } from './Table';

/** The `<table>` and pager that `<r-table>` draws, and the redrawing of its header state and rows. */
export class TableGrid {
    readonly pager: HTMLElement;
    private readonly table: HTMLTableElement;
    private readonly scroller: HTMLElement;

    constructor(
        host: HTMLElement,
        private readonly columns: TableColumn[],
        onSort: (field: string) => void
    ) {
        const table = document.createElement('table');
        const colgroup = table.appendChild(document.createElement('colgroup'));
        const headerRow = table.createTHead().insertRow();
        for (const column of columns) {
            const col = colgroup.appendChild(document.createElement('col'));
            if (column.width) {
                col.style.width = column.width;
            }
            const th = headerRow.appendChild(document.createElement('th'));
            th.scope = 'col';
            th.dataset.field = column.field;
            if (column.sortable) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'sort';
                button.append(column.title, document.createElement('r-icon'));
                button.addEventListener('click', () => onSort(column.field));
                th.append(button);
            } else {
                th.textContent = column.title;
            }
        }
        table.createTBody();

        const pager = document.createElement('nav');
        pager.className = 'pager';
        pager.hidden = true;

        // A table wider than the page scrolls sideways within itself, leaving the page and the pager where they are.
        const scroller = document.createElement('div');
        scroller.className = 'scroller';
        scroller.append(table);

        host.append(scroller, pager);
        this.scroller = scroller;
        this.table = table;
        this.pager = pager;
    }

    remove(): void {
        this.scroller.remove();
        this.pager.remove();
    }

    showSortState(sort: { column: string; direction: SortDirection } | undefined): void {
        this.table.querySelectorAll<HTMLTableCellElement>('th').forEach((th) => {
            const sorted = sort && sort.column === th.dataset.field ? sort.direction : undefined;
            const icon = th.querySelector('r-icon');
            if (!icon) {
                return;
            }
            th.setAttribute('aria-sort', sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none');
            icon.hidden = !sorted;
            icon.setAttribute('name', sorted === 'desc' ? 'arrow-down' : 'arrow-up');
        });
    }

    drawRows(rows: TableRow[]): void {
        const body = this.table.tBodies[0];
        if (rows.length === 0) {
            const row = document.createElement('tr');
            row.className = 'empty';
            const cell = row.insertCell();
            cell.colSpan = this.columns.length;
            cell.textContent = text('noData');
            body.replaceChildren(row);
            return;
        }
        body.replaceChildren(
            ...rows.map((data) => {
                const row = document.createElement('tr');
                for (const column of this.columns) {
                    row.insertCell().textContent = formatValue(data[column.field]);
                }
                return row;
            })
        );
    }
}
