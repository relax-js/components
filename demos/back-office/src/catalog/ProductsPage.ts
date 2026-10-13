import { Inject } from '@relax.js/core/di';
import type { Badge, Table, Treeview, TreeNode } from '@relax.js/components';
import { CatalogService, type Category } from './CatalogService';

function toNode(category: Category): TreeNode<number> {
    return {
        label: category.name,
        data: category.id,
        expanded: true,
        children: category.children?.map(toNode),
    };
}

/** Products by category: pick a branch of the tree to list what is in it. */
class ProductsPage extends HTMLElement {
    @Inject(CatalogService)
    private catalog!: CatalogService;

    private table!: Table;
    private heading!: HTMLElement;
    private count!: Badge;

    connectedCallback(): void {
        this.innerHTML = /* html */ `
            <h2 class="page-heading">Products</h2>
            <div class="master-detail">
                <r-card heading="Categories">
                    <r-treeview></r-treeview>
                </r-card>
                <r-card heading="All products">
                    <r-badge slot="action" tone="info"></r-badge>
                    <r-table page-size="12">
                        <r-column field="sku" sortable width="8rem">SKU</r-column>
                        <r-column field="name" sortable>Product</r-column>
                        <r-column field="price" sortable width="8rem">Price</r-column>
                        <r-column field="stock" sortable width="7rem">In stock</r-column>
                    </r-table>
                </r-card>
            </div>
        `;
        this.table = this.querySelector<Table>('r-table')!;
        this.heading = this.querySelectorAll('r-card')[1] as HTMLElement;
        this.count = this.querySelector<Badge>('r-badge')!;

        const tree = this.querySelector('r-treeview') as Treeview<number>;
        tree.addEventListener('r-node-navigated', (event) => {
            const node = event.node as TreeNode<number>;
            void this.list(node.label, node.data);
        });
        void this.loadTree(tree);
        void this.list('All products');
    }

    private async loadTree(tree: Treeview<number>): Promise<void> {
        tree.nodes = (await this.catalog.categories()).map(toNode);
    }

    private async list(title: string, categoryId?: number): Promise<void> {
        const products = await this.catalog.products(categoryId);
        this.heading.setAttribute('heading', title);
        this.count.setAttribute('count', String(products.length));
        this.table.rows = products.map((product) => ({ ...product }));
    }
}

customElements.define('products-page', ProductsPage);
