import type { MockReply, MockRoute } from '../../shared/mockApi';
import {
    categories, customerName, customers, orders, orderTotal, productName, products, settings,
    type Order, type OrderLine, type OrderStatus,
} from './store';

/** A validation failure in the shape the client shows next to its form. */
function problem(title: string, errors: Record<string, string[]>): MockReply {
    return { status: 400, body: { title, errors } };
}

function summaryOf(order: Order) {
    return {
        id: order.id,
        number: order.number,
        customer: customerName(order.customerId),
        orderDate: order.orderDate,
        status: order.status,
        total: orderTotal(order),
    };
}

function detailOf(order: Order) {
    return {
        ...order,
        customer: customerName(order.customerId),
        total: orderTotal(order),
        lines: order.lines.map((line) => ({
            ...line,
            product: productName(line.productId),
            lineTotal: line.quantity * line.unitPrice,
        })),
    };
}

function findOrder(id: string): Order | undefined {
    return orders.find((order) => order.id === Number(id));
}

const today = () => new Date().toISOString().slice(0, 10);

export const backOfficeRoutes: MockRoute[] = [
    {
        method: 'GET',
        path: '/api/orders',
        handle: ({ query }) => {
            const page = Number(query.get('page') ?? 1);
            const pageSize = Number(query.get('pageSize') ?? 25);
            const search = (query.get('search') ?? '').toLowerCase();
            const status = query.get('status') ?? '';
            const column = query.get('sort') ?? 'orderDate';
            const direction = query.get('direction') === 'asc' ? 1 : -1;

            const rows = orders
                .map(summaryOf)
                .filter((row) => status === '' || row.status === status)
                .filter((row) => search === '' || `${row.number} ${row.customer}`.toLowerCase().includes(search))
                .sort((a, b) => {
                    const left = a[column as keyof typeof a];
                    const right = b[column as keyof typeof b];
                    return (left < right ? -1 : left > right ? 1 : 0) * direction;
                });
            return { status: 200, body: { rows: rows.slice((page - 1) * pageSize, page * pageSize), totalCount: rows.length } };
        },
    },
    {
        method: 'GET',
        path: '/api/orders/:id',
        handle: ({ params }) => {
            const order = findOrder(params.id);
            return order ? { status: 200, body: detailOf(order) } : { status: 404 };
        },
    },
    {
        method: 'PUT',
        path: '/api/orders/:id',
        handle: ({ params, body }) => {
            const order = findOrder(params.id);
            if (!order) {
                return { status: 404 };
            }
            if (order.status === 'shipped') {
                return problem('A shipped order cannot be changed', { status: ['The order has already left the warehouse.'] });
            }
            const change = body as { reference: string; deliveryDate: string; status: OrderStatus; notes: string };
            if (change.deliveryDate < order.orderDate) {
                return problem('The order could not be saved', { deliveryDate: [`Delivery cannot be before the order date (${order.orderDate}).`] });
            }
            if (change.status !== order.status) {
                order.history.push({ at: today(), text: `Status changed from ${order.status} to ${change.status}` });
            }
            Object.assign(order, change);
            order.history.push({ at: today(), text: 'Order details edited' });
            return { status: 200, body: detailOf(order) };
        },
    },
    {
        method: 'POST',
        path: '/api/orders',
        handle: ({ body }) => {
            const draft = body as { customerId: number; reference: string; deliveryDate: string; lines: OrderLine[] };
            if (!draft.lines?.length) {
                return problem('The order has no lines', { lines: ['Add at least one product.'] });
            }
            const id = orders.length + 1;
            orders.push({
                id,
                number: `SO-${10000 + id}`,
                customerId: draft.customerId,
                orderDate: today(),
                deliveryDate: draft.deliveryDate,
                status: 'confirmed',
                reference: draft.reference,
                notes: '',
                lines: draft.lines,
                history: [{ at: today(), text: 'Order created from the order desk' }],
            });
            return { status: 201, body: { id } };
        },
    },
    {
        method: 'DELETE',
        path: '/api/orders/:id',
        handle: ({ params }) => {
            const index = orders.findIndex((order) => order.id === Number(params.id));
            if (index < 0) {
                return { status: 404 };
            }
            orders.splice(index, 1);
            return { status: 204 };
        },
    },
    { method: 'GET', path: '/api/customers', handle: () => ({ status: 200, body: customers }) },
    { method: 'GET', path: '/api/categories', handle: () => ({ status: 200, body: categories }) },
    {
        method: 'GET',
        path: '/api/products',
        handle: ({ query }) => {
            const category = Number(query.get('category'));
            const inCategory = (categoryId: number) =>
                categoryId === category || Math.floor(categoryId / 10) === category;
            return { status: 200, body: query.has('category') ? products.filter((p) => inCategory(p.categoryId)) : products };
        },
    },
    { method: 'GET', path: '/api/settings', handle: () => ({ status: 200, body: settings }) },
    {
        method: 'PUT',
        path: '/api/settings/:key',
        handle: ({ params, body }) => {
            if (!(params.key in settings)) {
                return { status: 404 };
            }
            settings[params.key] = (body as { value: string }).value;
            return { status: 200, body: settings };
        },
    },
];
