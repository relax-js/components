export interface ColumnDefinition {
    /**
     * With specifier, like "10px", "10%" or "*"
     */
    width?: string;

    sortOrder?: 'ascending' | 'descending';

    title: string;

    property: string;
}

export class Table extends HTMLElement {
    private table: HTMLTableElement = document.createElement('table');
    private tBody: HTMLTableSectionElement;
    private pages: Map<number, Record<string, unknown>[]> = new Map();

    constructor(private columns: ColumnDefinition[]) {
        super();
        this.appendChild(this.table);

        //        this.table.setAttribute('part', 'table');

        this.tBody = document.createElement('tbody');
        //this.tBody.setAttribute('part', "tbody");
        this.table.appendChild(this.tBody);
        //copyAttributes(this, this.table, ['style']);
        //this.tBody.innerHTML = "<tr><td colspan='2'>&nbsp;sss</td></tr>";

    }

    pageLoader: (pageNumber: number) => Promise<Record<string, unknown>[]>;

    template?: DocumentFragment;

    connectedCallback() {
        const template = this.querySelector('template')?.content;
        if (template) {
            this.template = template;

            const columnsTemplate = template.querySelector('r-columns');
            if (columnsTemplate) {
                this.columns = this.extractColumnsFromTemplate(template);
                this.renderColumns();
            }

            return;
        }

        const columnsTemplate = this.querySelector('r-columns');
        if (columnsTemplate) {
            this.columns = this.extractColumnsFromTemplate(columnsTemplate);
            columnsTemplate.remove();
            this.renderColumns();
        }
    }

    setData(data: unknown[]) {
        if (!this.isConnected) {
            console.log('NOT CONNECTED');
        }
        this.render(data);
    }

    addRow(x: unknown) {
        const row = document.createElement('tr');
        this.columns.forEach(column => {
            const td = document.createElement('td');
            var value=x[column.property];
            if (!value){
                console.log('missing ', x[column.property]);
            }

            td.innerText = (value ?? '').toString();
            row.appendChild(td);

        });

        this.tBody.appendChild(row);
    }

    render(data: unknown[]) {
        if (!this.table.tHead) {
            this.renderColumns();
        }

        const newRows: HTMLTableRowElement[] = [];
        data.forEach((x: Record<string, unknown>) => {
            this.addRow(x);
        });

        //this.tBody.replaceChildren(...newRows);
    }

    page(pageNumber: number) {
        const wantedPage = this.pages.get(pageNumber);
        if (wantedPage) {
            this.render(wantedPage);
            return;
        }

        this.pageLoader(pageNumber).then((result) => {
            this.pages[pageNumber] = result;
            this.render(result);
        });
    }

    private extractColumnsFromTemplate(
        template: ParentNode
    ): ColumnDefinition[] {
        const columns: ColumnDefinition[] = [];
        const columnElements = template.querySelectorAll('r-column');
        Array.from(columnElements).forEach((col) => {
            const title = col.textContent;
            const property = col.getAttribute('name') || '';
            const width = col.getAttribute('width');
            const sortOrder = col.getAttribute('sortOrder') as
                | 'ascending'
                | 'descending'
                | undefined;

            if (title && property) {
                columns.push({ title, property, width, sortOrder });
            }
        });

        return columns;
    }

    /**
     * Should only be done initially.
     */
    private renderColumns() {
        if (this.columns.length == 0) {
            if (this.template) {
                this.extractColumnsFromTemplate(this.template);
            } else {
                this.columns = [{ title: 'Name', property: 'name' }];
            }
        }

        const thead = document.createElement('thead');
        //thead.setAttribute('part', 'thead');
        const tr = document.createElement('tr');
        thead.appendChild(tr);
        this.table.tHead = thead;

        this.columns.forEach((column) => {
            const th = document.createElement('th');
            //  th.setAttribute('part', 'th');
            th.innerText = column.title;
            tr.appendChild(th);
        });

        this.table.tHead = thead;
    }
}

/**
 * Defines the columns for the table.
 * @element columns
 * @slot - Contains child `<column>` elements.
 */
export class ColumnsElement extends HTMLElement {
    private observer: MutationObserver;

    constructor() {
        super();

        this.observer = new MutationObserver(() => {
            this.updateColumns();
        });
    }

    connectedCallback() {
        this.observer.observe(this, { childList: true, subtree: false });
        this.updateColumns();
    }

    disconnectedCallback() {
        this.observer.disconnect();
    }

    get columns(): ColumnElement[] {
        return Array.from(this.querySelectorAll('column'));
    }

    set columns(value: ColumnElement[]) {
        this.innerHTML = '';
        value.forEach((column) => this.appendChild(column));
        this.updateColumns();
    }

    private updateColumns() {
        console.log('Columns updated:', this.columns);
    }
}

/**
 * A single column definition for a table.
 *
 * @element column
 * @attribute {string} name - Maps to a property in the data array.
 * @attribute {string} [mutators] - Optional transformations to apply to the data.
 */
export class ColumnElement extends HTMLElement {
    static get observedAttributes() {
        return ['name', 'transformer'];
    }

    get name(): string | null {
        return this.getAttribute('name');
    }

    set name(value: string | null) {
        if (value) {
            this.setAttribute('name', value);
        } else {
            this.removeAttribute('name');
        }
    }

    get transformer(): string | null {
        return this.getAttribute('transformer');
    }

    set transformer(value: string | null) {
        if (value) {
            this.setAttribute('transformer', value);
        } else {
            this.removeAttribute('transformer');
        }
    }

    get displayName(): string {
        return this.innerText;
    }

    set displayName(value: string) {
        this.innerText = value;
    }

    attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ) {
        console.log(
            `Attribute changed: ${name}, Old: ${oldValue}, New: ${newValue}`
        );
    }
}


customElements.define("r-table", Table);
customElements.define("r-column", ColumnElement);
customElements.define("r-columns", ColumnsElement);
