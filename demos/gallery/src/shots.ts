import {
    Dialog,
    type AreaChartData,
    type ChartData,
    type DropdownMenu,
    type MenuItem,
    type PeriodGrid,
    type SettingRow,
    type StatTile,
    type StatusGrid,
    type Table,
    type TableRow,
    type TopMenu,
    type Treeview,
} from '@relax.js/components';

/** One component in one state, captured by `npm run docs:screenshots`. */
export interface Shot {
    /** The state, unique within the tag; the image's file name. */
    name: string;
    /**
     * The component shown. Picks the manual page the image goes on, and its folder: the
     * component's folder in src/, so r-table's images are in `docs/manual/images/data-display/table/`.
     */
    tag: string;
    /** The state shown, used as the image's caption. */
    title: string;
    /** Width of the stage in CSS pixels, 480 when absent. */
    width?: number;
    /** Least height of the stage, for a panel that lies outside the component's own box. */
    height?: number;
    /** Captures the whole window instead of the stage, for a modal dialog over the page. */
    window?: boolean;
    /** Builds the state inside `stage`. The capture waits for it and two frames more. */
    render(stage: HTMLElement): void | Promise<void>;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const year = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const revenueAndCosts: ChartData = {
    labels: months,
    series: [
        { name: 'Revenue', values: [182000, 196000, 171000, 214000, 228000, 241000] },
        { name: 'Costs', values: [143000, 151000, 158000, 149000, 162000, 168000] },
        { name: 'Target', values: [160000, 160000, 160000, 160000, 160000, 160000], threshold: true },
    ],
    summary: 'Revenue and costs, first half year',
};

const costsByKind: AreaChartData = {
    labels: months,
    series: [
        { name: 'Rent', values: [12000, 12000, 12000, 12500, 12500, 12500] },
        { name: 'Staff', values: [31000, 32500, 31800, 34000, 35200, 36100] },
        { name: 'Marketing', values: [4200, 6100, 3900, 7400, 5200, 8300] },
    ],
    summary: 'Costs by kind, first half year',
};

const salesByRegion: ChartData = {
    labels: ['North', 'South', 'East', 'West'],
    series: [
        { name: '2025', values: [420, 380, 290, 510] },
        { name: '2026', values: [460, 350, 340, 560] },
    ],
    summary: 'Sales by region',
};

const noChartData: ChartData = { labels: [], series: [], summary: 'No figures yet' };

const customers: TableRow[] = [
    ['Ada Lovelace', 'ada@example.com', 'London', 42],
    ['Alan Turing', 'alan@example.com', 'Manchester', 17],
    ['Grace Hopper', 'grace@example.com', 'New York', 63],
    ['Edsger Dijkstra', 'edsger@example.com', 'Austin', 8],
    ['Barbara Liskov', 'barbara@example.com', 'Boston', 29],
    ['Donald Knuth', 'don@example.com', 'Stanford', 51],
    ['Margaret Hamilton', 'margaret@example.com', 'Cambridge', 36],
    ['Ken Thompson', 'ken@example.com', 'Berkeley', 12],
    ['Frances Allen', 'frances@example.com', 'Peru, NY', 24],
    ['John Backus', 'john@example.com', 'Ashland', 5],
    ['Radia Perlman', 'radia@example.com', 'Seattle', 19],
    ['Niklaus Wirth', 'niklaus@example.com', 'Zürich', 33],
].map(([name, email, city, orders]) => ({ name, email, city, orders }));

const tableColumns = /* html */ `
    <r-column field="name" sortable>Name</r-column>
    <r-column field="email">Email</r-column>
    <r-column field="city" sortable>City</r-column>
    <r-column field="orders" sortable width="5rem">Orders</r-column>`;

const appMenu: MenuItem[] = [
    { name: 'home', title: 'Home', href: '#' },
    {
        name: 'orders',
        title: 'Orders',
        children: [
            { name: 'orders.open', title: 'Open' },
            { name: 'orders.shipped', title: 'Shipped' },
            { name: 'orders.returns', title: 'Returns' },
        ],
    },
    { name: 'catalog', title: 'Catalog', href: '#' },
    { name: 'reports', title: 'Reports', href: '#' },
];

const accountMenu: MenuItem[] = [
    { name: 'profile', title: 'Profile' },
    { name: 'settings', title: 'Settings' },
    { name: 'sign-out', title: 'Sign out' },
];

const settingsLinks: MenuItem[] = [
    { name: 'profile', title: 'Profile', href: '/settings/profile' },
    { name: 'billing', title: 'Billing', href: '/settings/billing' },
    { name: 'notifications', title: 'Notifications', href: '/settings/notifications' },
    { name: 'security', title: 'Security', href: '/settings/security' },
];

/** Fills `stage` with markup and gives back the first element in it. */
function place<T extends Element>(stage: HTMLElement, markup: string): T {
    stage.innerHTML = markup;
    return stage.firstElementChild as T;
}

/** Lays variants out as a captioned list, each caption naming the attributes that make it. */
function variants(stage: HTMLElement, rows: [caption: string, markup: string][]): void {
    stage.innerHTML = `<dl class="variants">${rows
        .map(([caption, markup]) => `<dt><code>${caption}</code></dt><dd>${markup}</dd>`)
        .join('')}</dl>`;
}

/** Waits for the browser to draw what was just placed. */
function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

/**
 * Moves a pretend pointer to a point inside `element`, given as fractions of its width and
 * height, so a chart shows its read-out for that point.
 */
async function pointAt(element: Element, across: number, down: number): Promise<void> {
    await nextFrame();
    const box = element.getBoundingClientRect();
    const clientX = box.left + box.width * across;
    const clientY = box.top + box.height * down;
    const target = document.elementFromPoint(clientX, clientY) ?? element;
    for (const type of ['pointerover', 'pointerenter', 'pointermove']) {
        target.dispatchEvent(new PointerEvent(type, { clientX, clientY, bubbles: type !== 'pointerenter', pointerType: 'mouse' }));
    }
}

/** Shows `path` in the address bar without loading it, so navigation marks the link to it as current. */
function pretendRoute(path: string): void {
    history.replaceState(history.state, '', path + location.search);
}

function shadowButton(host: Element, label: string): HTMLElement {
    const button = [...(host.shadowRoot?.querySelectorAll<HTMLElement>('button, a') ?? [])].find(
        (candidate) => candidate.textContent?.trim() === label
    );
    if (!button) {
        throw new Error(`${host.localName} has no button "${label}"`);
    }
    return button;
}

export const shots: Shot[] = [
    // Foundations

    {
        name: 'set',
        tag: 'r-icon',
        title: 'Every icon in the default set',
        render(stage) {
            const names = [
                'arrow-down', 'arrow-up', 'arrow-right', 'check', 'check-circle', 'chevron-left', 'chevron-right',
                'clock', 'file', 'info', 'lock', 'minus-circle', 'x-circle',
            ];
            stage.innerHTML = `<ul class="icon-set">${names
                .map((name) => `<li><r-icon name="${name}"></r-icon><code>${name}</code></li>`)
                .join('')}</ul>`;
        },
    },

    // Dashboard

    {
        name: 'tones',
        tag: 'r-badge',
        title: 'Tones and counts',
        render(stage) {
            variants(stage, [
                ['tone="ok"', '<r-badge tone="ok">Paid</r-badge>'],
                ['tone="info"', '<r-badge tone="info">Processing</r-badge>'],
                ['tone="warn"', '<r-badge tone="warn">Draft</r-badge>'],
                ['tone="danger"', '<r-badge tone="danger">Overdue</r-badge>'],
                ['tone="muted"', '<r-badge>Archived</r-badge>'],
                ['count="7"', '<r-badge tone="info" count="7"></r-badge>'],
                ['count="140" max="99"', '<r-badge tone="danger" count="140" max="99"></r-badge>'],
            ]);
        },
    },
    {
        name: 'tones',
        tag: 'r-status-mark',
        title: 'One mark per tone, with notes',
        render(stage) {
            variants(stage, [
                ['tone="ok"', '<r-status-mark tone="ok" note="2026-09-20">Paid</r-status-mark>'],
                ['tone="info"', '<r-status-mark tone="info" note="Sent to bank">Processing</r-status-mark>'],
                ['tone="warn"', '<r-status-mark tone="warn" note="Due in 3 days">Unpaid</r-status-mark>'],
                ['tone="danger"', '<r-status-mark tone="danger" note="Card declined">Failed</r-status-mark>'],
                ['tone="muted"', '<r-status-mark>Not sent</r-status-mark>'],
            ]);
        },
    },
    {
        name: 'urgency',
        tag: 'r-days-left',
        title: 'From plenty of time to overdue',
        render(stage) {
            variants(stage, [
                ['days="30"', '<r-days-left days="30"></r-days-left>'],
                ['days="12"', '<r-days-left days="12"></r-days-left>'],
                ['days="3"', '<r-days-left days="3"></r-days-left>'],
                ['days="1"', '<r-days-left days="1"></r-days-left>'],
                ['days="-4"', '<r-days-left days="-4"></r-days-left>'],
            ]);
        },
    },
    {
        name: 'default',
        tag: 'r-card',
        title: 'Heading, lead, list and link',
        render(stage) {
            place(
                stage,
                /* html */ `
                <r-card heading="Invoices" lead="Three are past due." icon="file" link-text="All invoices" href="#">
                    <ul class="plain-list">
                        <li><span>Acme Ltd</span> <r-days-left days="-4"></r-days-left></li>
                        <li><span>Globex</span> <r-days-left days="-1"></r-days-left></li>
                        <li><span>Initech</span> <r-days-left days="0"></r-days-left></li>
                    </ul>
                </r-card>`
            );
        },
    },
    {
        name: 'tone-action',
        tag: 'r-card',
        title: 'Toned, with an action',
        render(stage) {
            place(
                stage,
                /* html */ `
                <r-card heading="Certificates" lead="One expires this week." icon="lock" tone="warn" link-text="All certificates" href="#">
                    <select slot="action" aria-label="Environment"><option>Production</option><option>Staging</option></select>
                    <ul class="plain-list">
                        <li><span>api.example.com</span> <r-days-left days="5"></r-days-left></li>
                        <li><span>www.example.com</span> <r-days-left days="41"></r-days-left></li>
                    </ul>
                </r-card>`
            );
        },
    },
    {
        name: 'directions',
        tag: 'r-kpi-meter',
        title: 'Better, worse and lower-is-better',
        width: 420,
        render(stage) {
            stage.innerHTML = /* html */ `
                <div class="stack">
                    <r-kpi-meter label="Revenue" value="1285400" previous="1150000"></r-kpi-meter>
                    <r-kpi-meter label="New customers" value="212" previous="248"></r-kpi-meter>
                    <r-kpi-meter label="Costs" value="412000" previous="398000" better="lower"></r-kpi-meter>
                </div>`;
        },
    },
    {
        name: 'variants',
        tag: 'r-stat-tile',
        title: 'With change, trend and without a comparison',
        width: 760,
        render(stage) {
            stage.innerHTML = /* html */ `
                <div class="tiles">
                    <r-stat-tile label="Revenue" value="1285400" previous="1150000" period="last month"></r-stat-tile>
                    <r-stat-tile label="Refunds" value="18400" previous="12100" better="lower"></r-stat-tile>
                    <r-stat-tile label="Orders" value="3204"></r-stat-tile>
                </div>`;
            const tile = stage.querySelector<StatTile>('r-stat-tile')!;
            tile.trend = { labels: months, series: [{ name: 'Revenue', values: [182, 196, 171, 214, 228, 241] }], summary: 'Revenue trend' };
        },
    },
    {
        name: 'levels',
        tag: 'r-meter',
        title: 'Within limits, near the limit, at and over it',
        width: 420,
        render(stage) {
            stage.innerHTML = /* html */ `
                <div class="stack">
                    <r-meter label="Storage" value="18" max="50" unit="GB"></r-meter>
                    <r-meter label="Seats" value="43" max="50"></r-meter>
                    <r-meter label="API calls" value="10000" max="10000"></r-meter>
                    <r-meter label="Bandwidth" value="1240" max="1000" unit="GB"></r-meter>
                </div>`;
        },
    },
    {
        name: 'default',
        tag: 'r-sparkline',
        title: 'A trend with its latest value marked',
        width: 260,
        render(stage) {
            place<HTMLElement & { data: ChartData }>(stage, '<r-sparkline></r-sparkline>').data = {
                labels: year,
                series: [{ name: 'Cash', values: [41, 38, 40, 37, 39, 43, 45, 44, 48, 47, 51, 54] }],
                summary: 'Cash over the year',
            };
        },
    },
    {
        name: 'series',
        tag: 'r-line-chart',
        title: 'Two series and a threshold',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: ChartData }>(stage, '<r-line-chart></r-line-chart>').data = revenueAndCosts;
        },
    },
    {
        name: 'readout',
        tag: 'r-line-chart',
        title: 'Read-out under the pointer',
        width: 640,
        async render(stage) {
            const chart = place<HTMLElement & { data: ChartData }>(stage, '<r-line-chart></r-line-chart>');
            chart.data = revenueAndCosts;
            await pointAt(chart.querySelector('svg')!, 0.62, 0.45);
        },
    },
    {
        name: 'area',
        tag: 'r-line-chart',
        title: 'One series shaded as an area',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: ChartData }>(stage, '<r-line-chart></r-line-chart>').data = {
                labels: months,
                series: [{ name: 'Cash', values: [410000, 385000, 402000, 371000, 395000, 428000], area: true }],
                summary: 'Cash over the half year',
            };
        },
    },
    {
        name: 'empty',
        tag: 'r-line-chart',
        title: 'No data',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: ChartData }>(stage, '<r-line-chart></r-line-chart>').data = noChartData;
        },
    },
    {
        name: 'stacked',
        tag: 'r-area-chart',
        title: 'Stacked bands',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: AreaChartData }>(stage, '<r-area-chart></r-area-chart>').data = costsByKind;
        },
    },
    {
        name: 'readout',
        tag: 'r-area-chart',
        title: 'Read-out under the pointer',
        width: 640,
        async render(stage) {
            const chart = place<HTMLElement & { data: AreaChartData }>(stage, '<r-area-chart></r-area-chart>');
            chart.data = costsByKind;
            await pointAt(chart.querySelector('svg')!, 0.6, 0.5);
        },
    },
    {
        name: 'single',
        tag: 'r-area-chart',
        title: 'One series',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: AreaChartData }>(stage, '<r-area-chart></r-area-chart>').data = {
                labels: months,
                series: [{ name: 'Visitors', values: [8200, 9100, 8700, 10400, 11800, 12500] }],
                summary: 'Visitors per month',
            };
        },
    },
    {
        name: 'grouped',
        tag: 'r-bar-chart',
        title: 'Series side by side',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: ChartData }>(stage, '<r-bar-chart></r-bar-chart>').data = salesByRegion;
        },
    },
    {
        name: 'stacked',
        tag: 'r-bar-chart',
        title: 'Stacked, values on the bars',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: ChartData }>(stage, '<r-bar-chart stacked show-values></r-bar-chart>').data = salesByRegion;
        },
    },
    {
        name: 'horizontal',
        tag: 'r-bar-chart',
        title: 'Sideways bars',
        width: 640,
        render(stage) {
            place<HTMLElement & { data: ChartData }>(stage, '<r-bar-chart orientation="horizontal" show-values></r-bar-chart>').data = {
                labels: ['Housing', 'Food', 'Transport', 'Leisure', 'Savings'],
                series: [{ name: 'Spent', values: [9800, 4300, 2100, 1650, 3000] }],
                summary: 'Spending by category',
            };
        },
    },
    {
        name: 'readout',
        tag: 'r-bar-chart',
        title: 'Read-out under the pointer',
        width: 640,
        async render(stage) {
            const chart = place<HTMLElement & { data: ChartData }>(stage, '<r-bar-chart></r-bar-chart>');
            chart.data = salesByRegion;
            await pointAt(chart.querySelector('svg')!, 0.62, 0.6);
        },
    },
    {
        name: 'sequential',
        tag: 'r-heatmap',
        title: 'Sequential scale, a missing value',
        width: 640,
        render(stage) {
            const map = document.createElement('r-heatmap');
            map.summary = 'Orders per hour';
            map.rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            map.columns = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
            map.values = [
                [2, 9, 14, 18, 22, 12, 15, 17, 11, 4],
                [3, 8, 16, 21, 25, 14, 16, 19, 10, 5],
                [1, 7, 12, null, 19, 11, 13, 15, 9, 3],
                [4, 10, 17, 23, 27, 15, 18, 21, 13, 6],
                [2, 6, 11, 15, 16, 8, 9, 7, 5, 1],
            ];
            // connected last: a connected heatmap redraws on each setter and fails while rows and values disagree
            stage.append(map);
        },
    },
    {
        name: 'diverging',
        tag: 'r-heatmap',
        title: 'Diverging scale, values in the cells',
        width: 640,
        render(stage) {
            const map = document.createElement('r-heatmap');
            map.setAttribute('scale', 'diverging');
            map.setAttribute('show-values', '');
            map.summary = 'Change against budget, percent';
            map.rows = ['Sales', 'Support', 'Engineering', 'Marketing'];
            map.columns = ['Q1', 'Q2', 'Q3', 'Q4'];
            map.values = [
                [12, 4, -3, 8],
                [-6, -2, 1, 3],
                [2, -11, -7, 0],
                [18, 9, -14, -4],
            ];
            stage.append(map);
        },
    },
    {
        name: 'default',
        tag: 'r-status-grid',
        title: 'Items in their states, with the legend',
        width: 640,
        render(stage) {
            const grid = place<StatusGrid>(stage, '<r-status-grid></r-status-grid>');
            grid.states = [
                { id: 'up', label: 'Operational', tone: 'ok' },
                { id: 'slow', label: 'Degraded', tone: 'warn' },
                { id: 'down', label: 'Outage', tone: 'danger' },
                { id: 'maintenance', label: 'Maintenance', tone: 'info', icon: 'clock' },
            ];
            grid.items = [
                { label: 'API', state: 'up' },
                { label: 'Web', state: 'up' },
                { label: 'Search', state: 'slow' },
                { label: 'Payments', state: 'down' },
                { label: 'Email', state: 'maintenance' },
                { label: 'Storage', state: 'up' },
            ];
        },
    },
    {
        name: 'year',
        tag: 'r-period-grid',
        title: 'A year from closed to not started',
        width: 760,
        render(stage) {
            const grid = place<PeriodGrid>(stage, '<r-period-grid year="2026"></r-period-grid>');
            const states = ['closed', 'closed', 'closed', 'closed', 'closed', 'closed', 'closed', 'locked', 'open', 'coming', 'coming', 'coming'];
            grid.periods = year.map((month, i) => ({ month, state: states[i] }));
        },
    },

    // Data display

    {
        name: 'default',
        tag: 'r-table',
        title: 'Rows from memory, first page',
        width: 720,
        render(stage) {
            place<Table>(stage, `<r-table page-size="5">${tableColumns}</r-table>`).rows = customers;
        },
    },
    {
        name: 'sorted',
        tag: 'r-table',
        title: 'Sorted by orders, second page',
        width: 720,
        async render(stage) {
            const table = place<Table>(stage, `<r-table page-size="5">${tableColumns.replace('width="5rem"', 'width="5rem" sort="desc"')}</r-table>`);
            table.rows = customers;
            await nextFrame();
            [...table.querySelectorAll<HTMLButtonElement>('nav button')].find((button) => button.textContent === '2')?.click();
        },
    },
    {
        name: 'loading',
        tag: 'r-table',
        title: 'Waiting for the provider',
        width: 720,
        render(stage) {
            const table = place<Table>(stage, `<r-table page-size="5">${tableColumns}</r-table>`);
            table.rows = customers;
            table.setAttribute('loading', '');
        },
    },
    {
        name: 'empty',
        tag: 'r-table',
        title: 'No rows',
        width: 720,
        render(stage) {
            place<Table>(stage, `<r-table page-size="5">${tableColumns}</r-table>`).rows = [];
        },
    },
    {
        name: 'expanded',
        tag: 'r-treeview',
        title: 'Expanded branches and a selected node',
        width: 360,
        render(stage) {
            const tree = place<Treeview<string>>(stage, '<r-treeview></r-treeview>');
            const invoice = { label: 'invoice-0042.pdf', data: 'invoice' };
            tree.nodes = [
                {
                    label: 'Documents',
                    data: 'docs',
                    expanded: true,
                    children: [
                        {
                            label: 'Invoices',
                            data: 'invoices',
                            expanded: true,
                            children: [{ label: 'invoice-0041.pdf', data: '41' }, invoice, { label: 'invoice-0043.pdf', data: '43' }],
                        },
                        { label: 'Contracts', data: 'contracts', children: [{ label: 'lease.pdf', data: 'lease' }] },
                    ],
                },
                { label: 'Pictures', data: 'pictures', children: [{ label: 'logo.png', data: 'logo' }] },
                { label: 'notes.txt', data: 'notes' },
            ];
            tree.select(invoice);
        },
    },
    {
        name: 'collapsed',
        tag: 'r-treeview',
        title: 'Collapsed',
        width: 360,
        render(stage) {
            place<Treeview<string>>(stage, '<r-treeview></r-treeview>').nodes = [
                { label: 'Documents', data: 'docs', children: [{ label: 'Invoices', data: 'invoices' }] },
                { label: 'Pictures', data: 'pictures', children: [{ label: 'logo.png', data: 'logo' }] },
                { label: 'notes.txt', data: 'notes' },
            ];
        },
    },

    // Feedback

    {
        name: 'tones',
        tag: 'r-banner',
        title: 'One banner per tone',
        width: 640,
        render(stage) {
            stage.innerHTML = /* html */ `
                <div class="stack">
                    <r-banner tone="ok">Your changes were published.</r-banner>
                    <r-banner tone="info">Prices are updated every night at 02:00.</r-banner>
                    <r-banner tone="warn">Maintenance tonight at 22:00.</r-banner>
                    <r-banner tone="danger">Payments are failing. We are looking into it.</r-banner>
                    <r-banner>This workspace is read-only.</r-banner>
                </div>`;
        },
    },
    {
        name: 'action',
        tag: 'r-banner',
        title: 'Dismissible, with an action',
        width: 640,
        render(stage) {
            place(stage, '<r-banner tone="warn" dismissible>Maintenance tonight at 22:00. <a slot="action" href="#">Details</a></r-banner>');
        },
    },
    {
        name: 'loading',
        tag: 'r-spinner',
        title: 'Loading',
        width: 420,
        render(stage) {
            place(stage, '<r-spinner loading><div class="filler"><h3>Orders</h3><p>Fourteen orders wait for shipping.</p><p>Two are on hold.</p></div></r-spinner>');
        },
    },
    {
        name: 'idle',
        tag: 'r-spinner',
        title: 'Not loading',
        width: 420,
        render(stage) {
            place(stage, '<r-spinner><div class="filler"><h3>Orders</h3><p>Fourteen orders wait for shipping.</p><p>Two are on hold.</p></div></r-spinner>');
        },
    },

    // Forms

    {
        name: 'states',
        tag: 'r-file-input',
        title: 'Empty, chosen, multiple and disabled',
        width: 520,
        render(stage) {
            stage.innerHTML = /* html */ `
                <dl class="variants">
                    <dt><code>empty</code></dt><dd><r-file-input accept=".csv"></r-file-input></dd>
                    <dt><code>chosen</code></dt><dd><r-file-input accept=".csv" id="chosen"></r-file-input></dd>
                    <dt><code>multiple</code></dt><dd><r-file-input multiple></r-file-input></dd>
                    <dt><code>disabled</code></dt><dd><fieldset disabled class="bare"><r-file-input></r-file-input></fieldset></dd>
                </dl>`;
            const input = stage.querySelector('#chosen input[type=file]') as HTMLInputElement;
            const files = new DataTransfer();
            files.items.add(new File(['date;amount\n2026-10-01;120'], 'statement-october.csv', { type: 'text/csv' }));
            input.files = files.files;
            input.dispatchEvent(new Event('change'));
        },
    },

    // Layout

    {
        name: 'form',
        tag: 'r-dialog',
        title: 'Open, with a form',
        window: true,
        width: 720,
        height: 420,
        render(stage) {
            const dialog = place<Dialog>(
                stage,
                /* html */ `
                <r-dialog heading="Rename project">
                    <template>
                        <form class="form" method="dialog">
                            <label>Name <input name="name" value="Website relaunch"></label>
                            <div class="buttons"><button>Save</button></div>
                        </form>
                    </template>
                </r-dialog>`
            );
            void dialog.open();
        },
    },
    {
        name: 'confirm',
        tag: 'r-dialog',
        title: 'Dialog.confirm() with the danger tone',
        window: true,
        width: 720,
        height: 360,
        render() {
            void Dialog.confirm({
                heading: 'Delete order?',
                message: 'Order 10432 and its three lines will be deleted. This cannot be undone.',
                tone: 'danger',
                confirmText: 'Delete',
            });
        },
    },
    {
        name: 'list',
        tag: 'r-setting-row',
        title: 'Settings in a list',
        width: 560,
        render(stage) {
            stage.innerHTML = /* html */ `
                <div class="settings">
                    <r-setting-row name="Email notifications" state="On, daily digest"><template><form></form></template></r-setting-row>
                    <r-setting-row name="Language" state="English"><template><form></form></template></r-setting-row>
                    <r-setting-row name="Two-step sign-in" state="Off"><template><form></form></template></r-setting-row>
                </div>`;
        },
    },
    {
        name: 'failed',
        tag: 'r-setting-row',
        title: 'Form open after a failed save',
        window: true,
        width: 720,
        height: 420,
        async render(stage) {
            const row = place<SettingRow>(
                stage,
                /* html */ `
                <r-setting-row name="Language" state="English">
                    <template>
                        <form class="form">
                            <label>Language <select name="language"><option value="en">English</option><option value="sv">Svenska</option></select></label>
                            <div class="buttons"><button>Save</button></div>
                        </form>
                    </template>
                </r-setting-row>`
            );
            row.value = { language: 'sv' };
            row.save = () => Promise.reject(new Error('The server is down'));
            row.querySelector('button')!.click();
            row.querySelector('form')!.requestSubmit();
            await nextFrame();
        },
    },

    // Navigation

    {
        name: 'default',
        tag: 'r-tabs',
        title: 'First tab shown',
        width: 520,
        render(stage) {
            place(
                stage,
                /* html */ `
                <r-tabs>
                    <r-tab label="Overview"><p>Order 10432 was placed on 2 October and ships tomorrow.</p></r-tab>
                    <r-tab label="Lines"><p>Three lines, 14 items.</p></r-tab>
                    <r-tab label="History"><p>Created, paid, packed.</p></r-tab>
                </r-tabs>`
            );
        },
    },
    {
        name: 'selected',
        tag: 'r-tabs',
        title: 'Second tab selected',
        width: 520,
        render(stage) {
            place(
                stage,
                /* html */ `
                <r-tabs selected="1">
                    <r-tab label="Overview"><p>Order 10432 was placed on 2 October and ships tomorrow.</p></r-tab>
                    <r-tab label="Lines"><p>Three lines, 14 items.</p></r-tab>
                    <r-tab label="History"><p>Created, paid, packed.</p></r-tab>
                </r-tabs>`
            );
        },
    },
    {
        name: 'bar',
        tag: 'r-top-menu',
        title: 'Top level',
        width: 640,
        render(stage) {
            place<TopMenu>(stage, '<r-top-menu></r-top-menu>').items = appMenu;
        },
    },
    {
        name: 'submenu',
        tag: 'r-top-menu',
        title: 'A submenu opened, with the back button',
        width: 640,
        async render(stage) {
            const menu = place<TopMenu>(stage, '<r-top-menu></r-top-menu>');
            menu.items = appMenu;
            shadowButton(menu, 'Orders').click();
            await nextFrame();
        },
    },
    {
        name: 'closed',
        tag: 'r-dropdown-menu',
        title: 'Closed',
        width: 320,
        render(stage) {
            place<DropdownMenu>(stage, '<r-dropdown-menu label="Account"></r-dropdown-menu>').items = accountMenu;
        },
    },
    {
        name: 'open',
        tag: 'r-dropdown-menu',
        title: 'Open',
        width: 320,
        height: 220,
        async render(stage) {
            const menu = place<DropdownMenu>(stage, '<r-dropdown-menu label="Account"></r-dropdown-menu>');
            menu.items = accountMenu;
            menu.show();
            await nextFrame();
        },
    },
    {
        name: 'current',
        tag: 'r-section-nav',
        title: 'The current section marked',
        width: 560,
        render(stage) {
            pretendRoute('/settings/billing');
            place(
                stage,
                /* html */ `
                <r-section-nav label="Settings">
                    ${settingsLinks.map((link) => `<a href="${link.href}">${link.title}</a>`).join('')}
                </r-section-nav>`
            );
        },
    },
    {
        name: 'current',
        tag: 'r-side-menu',
        title: 'The current page marked',
        width: 260,
        render(stage) {
            pretendRoute('/settings/billing');
            const menu = place<HTMLElement & { items: MenuItem[] }>(stage, '<r-side-menu title="Settings"></r-side-menu>');
            menu.items = settingsLinks;
        },
    },
];
