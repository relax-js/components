import { TableRenderer, TableSorter, SortColumn } from 'relaxjs/html';
import { Pager, PageSelectedEvent } from 'relaxjs/collections';
import type { DataLoader } from 'relaxjs';

export class RelaxedTable extends HTMLElement {
  private renderer!: TableRenderer;
  private sorter!: TableSorter;
  private pager!: Pager;
  private table!: HTMLTableElement;
  private template!: HTMLTemplateElement;
  private loader!: DataLoader;

  private pageSize = 10;

  connectedCallback() {
    this.table = this.children[0] as HTMLTableElement;
    this.template = this.children[1] as HTMLTemplateElement;

    if (!(this.table instanceof HTMLTableElement)) {
      throw new Error('First child must be a <table>');
    }
    if (!(this.template instanceof HTMLTemplateElement)) {
      throw new Error('Second child must be a <template>');
    }

    const pagerContainer = document.createElement('div');
    pagerContainer.className = 'pager';
    this.appendChild(pagerContainer);

    this.renderer = new TableRenderer(this.table, this.template, 'id', this);
    this.sorter = new TableSorter(this.table, this);
    this.pager = new Pager(pagerContainer, 0, this.pageSize);

    this.addEventListener('sortchange', (e: CustomEvent<SortColumn[]>) => {
      this.loadPage(1);
    });

    this.addEventListener('pageselected', (e: PageSelectedEvent) => {
      this.loadPage(e.page);
    });
  }

  public set dataLoader(loader: DataLoader) {
    this.loader = loader;
    this.loadPage(1);
  }

  private async loadPage(page: number) {
    if (!this.loader) return;

    const sort = this.sorter.getSortColumns();
    const { rows, totalCount } = await this.loader.load({
      page,
      pageSize: this.pageSize,
      sort,
    });

    this.renderer.render(rows);
    this.pager.update(totalCount);
  }
}

customElements.define('relaxed-table', RelaxedTable);
