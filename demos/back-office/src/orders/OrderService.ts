import { ContainerService } from '@relax.js/core/di';
import { del, get, post, put, type HttpResponse } from '@relax.js/core/http';
import type { TablePage, TablePageRequest } from '@relax.js/components';

export type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'cancelled';

export interface OrderLine {
    productId: number;
    product: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface Order {
    id: number;
    number: string;
    customerId: number;
    customer: string;
    orderDate: string;
    deliveryDate: string;
    status: OrderStatus;
    reference: string;
    notes: string;
    total: number;
    lines: OrderLine[];
    history: { at: string; text: string }[];
}

/** What the order editor may change. */
export interface OrderChange {
    reference: string;
    deliveryDate: string;
    status: OrderStatus;
    notes: string;
}

export interface NewOrder {
    customerId: number;
    reference: string;
    deliveryDate: string;
    lines: { productId: number; quantity: number; unitPrice: number }[];
}

export interface OrderFilter {
    search: string;
    status: string;
}

/** Why the server refused a change, by field. */
export interface Problem {
    title: string;
    errors: Record<string, string[]>;
}

/** A save either succeeds with its result or is refused with the server's reasons. */
export type SaveResult<T> = { saved: true; value: T } | { saved: false; problem: Problem };

export const statusTones: Record<OrderStatus, string> = {
    draft: 'muted',
    confirmed: 'info',
    shipped: 'ok',
    cancelled: 'danger',
};

function failure(response: HttpResponse, what: string): Error {
    return new Error(`${what} failed with ${response.statusCode} ${response.statusReason}`);
}

function refusal<T>(response: HttpResponse, what: string): SaveResult<T> {
    if (response.statusCode !== 400) {
        throw failure(response, what);
    }
    return { saved: false, problem: JSON.parse(response.body as string) as Problem };
}

/** The orders of the order desk, as the server keeps them. */
@ContainerService({ inject: [] })
export class OrderService {
    /** One page of orders for `<r-table>`, filtered the way the order list is. */
    async page(request: TablePageRequest, filter: OrderFilter): Promise<TablePage> {
        const sort = request.sort[0];
        const response = await get(
            '/api/orders',
            {
                page: String(request.page),
                pageSize: String(request.pageSize),
                sort: sort?.column ?? 'orderDate',
                direction: sort?.direction ?? 'desc',
                search: filter.search,
                status: filter.status,
            },
            { signal: request.signal }
        );
        if (!response.success) {
            throw failure(response, 'Loading orders');
        }
        return response.as<TablePage>();
    }

    async get(id: number): Promise<Order> {
        const response = await get(`/api/orders/${id}`);
        if (!response.success) {
            throw failure(response, `Loading order ${id}`);
        }
        return response.as<Order>();
    }

    async update(id: number, change: OrderChange): Promise<SaveResult<Order>> {
        const response = await put(`/api/orders/${id}`, JSON.stringify(change));
        return response.success ? { saved: true, value: response.as<Order>() } : refusal(response, `Saving order ${id}`);
    }

    async create(order: NewOrder): Promise<SaveResult<number>> {
        const response = await post('/api/orders', JSON.stringify(order));
        return response.success ? { saved: true, value: response.as<{ id: number }>().id } : refusal(response, 'Placing the order');
    }

    async remove(id: number): Promise<void> {
        const response = await del(`/api/orders/${id}`);
        if (!response.success) {
            throw failure(response, `Deleting order ${id}`);
        }
    }
}
