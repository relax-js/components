import { reportProblem } from '../../foundations/problems/problems';
import '../../foundations/icon/Icon';
import { whenLanguageChanges } from '../../foundations/text/text';
import { installStyles } from '../../foundations/styles';
import { readDeclaredColumns } from './declaredColumns';
import { drawPager } from './pager';
import { TableGrid } from './tableGrid';
import { rowsProvider } from './rowsProvider';

/** One record shown as a table row. */
export type TableRow = Record<string, unknown>;

/** Direction of a sorted column. */
export declare type SortDirection = 'asc' | 'desc';

/** One column of `<r-table>`, declared with `<r-column>` or set through `columns`. */
export interface TableColumn {
    /** Property of each row shown in this column. Also the sort key the provider receives. */
    field: string;
    /** Header text. */
    title: string;
    /** CSS width of the column, such as `120px` or `20%`. */
    width?: string;
    /** Lets the user sort by this column by clicking its header. */
    sortable?: boolean;
    /** Sorts by this column when the table first loads. */
    sort?: SortDirection;
}

/** What `<r-table>` asks its provider for. The shape matches `DataLoader.load()` from `@relax.js/core`. */
export interface TablePageRequest {
    /** 1-based page number. */
    page: number;
    pageSize: number;
    /** The sorted column, or an empty list for the provider's own order. */
    sort: { column: string; direction: SortDirection }[];
    /** Aborted when the table no longer needs this page, because another page or sort was asked for. */
    signal: AbortSignal;
}

/** One page of rows, and how many rows there are on all pages together. */
export interface TablePage {
    rows: TableRow[];
    totalCount: number;
}

/** Loads one page of rows for `<r-table>`. */
export type TableProvider = (request: TablePageRequest) => Promise<TablePage>;

const defaultPageSize = 25;

const styles = /* css */ `
    r-table {
        display: block;

        r-column {
            display: none;
        }

        .scroller {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            text-align: start;
            font-weight: 600;
            padding: var(--item-padding);
            border-bottom: 2px solid var(--bd-muted);
        }

        td {
            padding: var(--item-padding);
            border-bottom: var(--item-separator);
        }

        tbody tr:not(.empty):hover {
            background: var(--surface-hover);
        }

        .empty td {
            color: var(--text-muted);
            text-align: center;
        }

        .sort {
            display: inline-flex;
            align-items: center;
            gap: var(--control-gap);
            font: inherit;
            color: inherit;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;

            &:focus-visible {
                outline: 2px solid var(--focus-ring);
            }
        }

        &[loading] tbody {
            opacity: 0.3;
            pointer-events: none;
            user-select: none;
        }

        .pager {
            display: flex;
            justify-content: flex-end;
            gap: var(--control-gap);
            padding-block: var(--control-gap);

            button {
                font: inherit;
                color: inherit;
                background: none;
                border: 1px solid var(--bd-muted);
                border-radius: var(--control-radius);
                padding: var(--control-padding);
                cursor: pointer;

                &:hover:not(:disabled) {
                    background: var(--surface-hover);
                }

                &:focus-visible {
                    outline: 2px solid var(--focus-ring);
                }

                &[aria-current='page'] {
                    background: var(--surface-selected);
                    border-color: var(--accent-primary);
                }

                &:disabled {
                    color: var(--text-muted);
                    cursor: default;
                }
            }

            .gap {
                align-self: center;
                color: var(--text-muted);
            }
        }
    }
`;

/**
 * A data table with click-to-sort headers and a pager, rendered as a native `<table>` in the
 * light DOM, so the page's CSS reaches it.
 *
 * Set `rows` to show records that are already in memory; the table sorts and pages them
 * itself. Set `provider` to have it ask for each page and sort order, so a server does the
 * work.
 *
 * @example
 * ```html
 * <r-table page-size="20">
 *     <r-column field="name" sortable>Name</r-column>
 *     <r-column field="email" width="40%">Email</r-column>
 * </r-table>
 * ```
 * ```typescript
 * document.querySelector('r-table')!.rows = users;
 * ```
 *
 * @attr {number} page-size - Rows per page, 25 when absent. The pager hides when one page holds every row.
 * @attr {boolean} loading - Present while a page is loading
 */
export class Table extends HTMLElement {
    private tableColumns?: TableColumn[];
    private tableRows?: TableRow[];
    private tableProvider?: TableProvider;
    private grid?: TableGrid;
    private page = 1;
    private shownPage = 1;
    private waiting: { resolve: () => void; reject: (error: unknown) => void }[] = [];
    private loadedPageSize?: number;
    private sort?: { column: string; direction: SortDirection };
    private pendingLoad?: AbortController;
    private readonly lateColumns = new MutationObserver((records) => {
        const added = records.some((record) =>
            Array.from(record.addedNodes).some((node) => node instanceof Element && node.localName === 'r-column')
        );
        if (added) {
            throw new Error('r-table: <r-column> was added after the table was drawn. Set columns instead.');
        }
    });

    private stopListening?: () => void;
    private readonly redrawWords = () => void this.load();

    connectedCallback(): void {
        installStyles(this, 'r-table', styles);
        this.stopListening?.();
        this.stopListening = whenLanguageChanges(this.redrawWords);
        if (this.grid) {
            return;
        }
        if (!this.tableColumns && document.readyState === 'loading' && !this.querySelector('r-column')) {
            document.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
            return;
        }
        if (!this.tableColumns) {
            this.tableColumns = readDeclaredColumns(this);
        }
        // The page size is read once, when the table loads; later attribute changes are ignored.
        this.loadedPageSize = this.pageSize;
        if (this.tableColumns && this.loadedPageSize !== undefined) {
            this.drawTable();
            void this.load();
        }
        this.lateColumns.observe(this, { childList: true });
    }

    disconnectedCallback(): void {
        this.stopListening?.();
        this.lateColumns.disconnect();
    }

    /** Rows per page from the `page-size` attribute, or `undefined` while that attribute is invalid. */
    get pageSize(): number | undefined {
        const value = this.getAttribute('page-size');
        if (value === null) {
            return defaultPageSize;
        }
        const size = Number(value);
        if (!Number.isInteger(size) || size < 1) {
            reportProblem('r-table', `page-size="${value}" is not a whole number above zero`);
            return undefined;
        }
        return size;
    }

    /** The columns. Setting them redraws the table and loads the first page again. */
    get columns(): TableColumn[] {
        return this.tableColumns ?? [];
    }

    set columns(columns: TableColumn[]) {
        const missingField = columns.find((column) => !column.field);
        if (missingField) {
            throw new Error(`r-table: column '${missingField.title}' has no field.`);
        }
        this.tableColumns = columns;
        this.redraw();
    }

    /** Records already in memory. Setting them replaces `provider` and shows the first page. */
    get rows(): TableRow[] | undefined {
        return this.tableRows;
    }

    set rows(rows: TableRow[]) {
        this.tableRows = rows;
        this.tableProvider = rowsProvider(rows);
        this.page = 1;
        void this.load();
    }

    /** Loads each page on demand. Setting it replaces `rows` and shows the first page. */
    get provider(): TableProvider | undefined {
        return this.tableProvider;
    }

    set provider(provider: TableProvider) {
        this.tableRows = undefined;
        this.tableProvider = provider;
        this.page = 1;
        void this.load();
    }

    /**
     * Loads the shown page again, for example after the data behind the provider changed.
     * Resolves once it is drawn.
     */
    refresh(): Promise<void> {
        return this.load();
    }

    private redraw(): void {
        if (!this.isConnected) {
            return;
        }
        this.grid?.remove();
        this.grid = undefined;
        this.drawTable();
        this.page = 1;
        void this.load();
    }

    private drawTable(): void {
        const columns = this.columns;
        const initial = columns.find((column) => column.sort);
        this.sort = initial ? { column: initial.field, direction: initial.sort! } : undefined;

        this.grid = new TableGrid(this, columns, (field) => this.sortBy(field));
        this.grid.showSortState(this.sort);
    }

    private sortBy(field: string): void {
        if (this.sort?.column !== field) {
            this.sort = { column: field, direction: 'asc' };
        } else if (this.sort.direction === 'asc') {
            this.sort = { column: field, direction: 'desc' };
        } else {
            this.sort = undefined;
        }
        this.grid!.showSortState(this.sort);
        this.page = 1;
        this.loadForUser();
    }

    private goToPage(page: number): void {
        this.page = page;
        this.loadForUser();
    }

    /**
     * Resolves once a page is drawn. A load overtaken by a newer one hands its callers on, so
     * they settle with the newer load.
     */
    private load(): Promise<void> {
        if (!this.tableProvider || !this.grid || this.loadedPageSize === undefined) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            this.waiting.push({ resolve, reject });
            void this.run(this.tableProvider!, this.loadedPageSize!);
        });
    }

    private async run(provider: TableProvider, pageSize: number): Promise<void> {
        this.pendingLoad?.abort();
        const thisLoad = new AbortController();
        this.pendingLoad = thisLoad;
        this.setLoading(true);
        try {
            const result = await provider({
                page: this.page,
                pageSize,
                sort: this.sort ? [this.sort] : [],
                signal: thisLoad.signal,
            });
            if (thisLoad.signal.aborted) {
                return;
            }
            this.shownPage = this.page;
            this.grid!.drawRows(result.rows);
            drawPager(this.grid!.pager, {
                page: this.shownPage,
                pageCount: Math.max(1, Math.ceil(result.totalCount / pageSize)),
                onSelect: (page) => this.goToPage(page),
            });
            this.settleWaiting();
        } catch (error) {
            if (thisLoad.signal.aborted) {
                return;
            }
            reportProblem('r-table', 'the provider failed to load page', { error });
            this.page = this.shownPage;
            this.settleWaiting(error);
        } finally {
            if (this.pendingLoad === thisLoad) {
                this.setLoading(false);
            }
        }
    }

    private settleWaiting(failure?: unknown): void {
        const waiting = this.waiting.splice(0);
        for (const { resolve, reject } of waiting) {
            if (failure === undefined) {
                resolve();
            } else {
                reject(failure);
            }
        }
    }

    // A failure is already reported; the user paging or sorting has nobody to hand it to.
    private loadForUser(): void {
        this.load().catch(() => {});
    }

    private setLoading(loading: boolean): void {
        this.toggleAttribute('loading', loading);
        this.setAttribute('aria-busy', String(loading));
    }

}

if (!customElements.get('r-table')) {
    customElements.define('r-table', Table);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-table': Table;
    }
}
