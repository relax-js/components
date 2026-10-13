import { round, seededRandom } from '../../shared/random';

export type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'cancelled';

export interface Customer {
    id: number;
    name: string;
    city: string;
}

export interface Category {
    id: number;
    name: string;
    children?: Category[];
}

export interface Product {
    id: number;
    sku: string;
    name: string;
    categoryId: number;
    price: number;
    stock: number;
}

export interface OrderLine {
    productId: number;
    quantity: number;
    unitPrice: number;
}

export interface HistoryEntry {
    at: string;
    text: string;
}

export interface Order {
    id: number;
    number: string;
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    status: OrderStatus;
    reference: string;
    notes: string;
    lines: OrderLine[];
    history: HistoryEntry[];
}

const random = seededRandom(42);
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

const cities = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Oslo', 'Copenhagen', 'Helsinki', 'Tallinn'];
const companies = [
    'Birch & Pine', 'Nordlys Trading', 'Fjällstuga', 'Havsbris', 'Kvarnen', 'Granit AB', 'Solrosen', 'Lövånger',
    'Skärgård Supply', 'Tallbacken', 'Norrsken', 'Åkerholm', 'Strand & Co', 'Ekudden', 'Myrberg', 'Vinterviken',
];
export const customers: Customer[] = companies.map((name, i) => ({ id: i + 1, name, city: pick(cities) }));

export const categories: Category[] = [
    {
        id: 1, name: 'Furniture', children: [
            { id: 11, name: 'Chairs' },
            { id: 12, name: 'Tables' },
            { id: 13, name: 'Shelving' },
        ],
    },
    {
        id: 2, name: 'Lighting', children: [
            { id: 21, name: 'Ceiling' },
            { id: 22, name: 'Desk' },
        ],
    },
    {
        id: 3, name: 'Textiles', children: [
            { id: 31, name: 'Rugs' },
            { id: 32, name: 'Throws' },
            { id: 33, name: 'Cushions' },
        ],
    },
];

const productNames: Record<number, string[]> = {
    11: ['Spindle chair', 'Lounge chair', 'Bar stool', 'Rocking chair'],
    12: ['Oak dining table', 'Side table', 'Coffee table', 'Desk'],
    13: ['Wall shelf', 'Bookcase', 'Ladder shelf'],
    21: ['Pendant lamp', 'Ceiling spot', 'Chandelier'],
    22: ['Task lamp', 'Reading lamp', 'Clamp lamp'],
    31: ['Wool rug', 'Runner', 'Round rug'],
    32: ['Linen throw', 'Wool blanket'],
    33: ['Velvet cushion', 'Linen cushion', 'Floor cushion'],
};
export const products: Product[] = Object.entries(productNames).flatMap(([categoryId, names]) =>
    names.map((name) => ({
        id: 0,
        sku: '',
        name,
        categoryId: Number(categoryId),
        price: round(150 + random() * 4800),
        stock: Math.floor(random() * 120),
    }))
).map((product, i) => ({ ...product, id: i + 1, sku: `SKU-${String(1001 + i)}` }));

function isoDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
}

export const orders: Order[] = Array.from({ length: 230 }, (_, i) => {
    const age = 230 - i;
    const status: OrderStatus = age > 30 ? (random() < 0.9 ? 'shipped' : 'cancelled') : age > 7 ? pick(['confirmed', 'shipped']) : pick(['draft', 'confirmed']);
    const lines = Array.from({ length: 1 + Math.floor(random() * 4) }, () => {
        const product = pick(products);
        return { productId: product.id, quantity: 1 + Math.floor(random() * 8), unitPrice: product.price };
    });
    return {
        id: i + 1,
        number: `SO-${10001 + i}`,
        customerId: pick(customers).id,
        orderDate: isoDaysAgo(age),
        deliveryDate: isoDaysAgo(age - 5),
        status,
        reference: random() < 0.5 ? `PO ${Math.floor(random() * 9000) + 1000}` : '',
        notes: '',
        lines,
        history: [{ at: isoDaysAgo(age), text: 'Order created' }],
    };
});

export const settings: Record<string, string> = {
    companyName: 'Linnea Interiors AB',
    orgNumber: '556677-8899',
    invoiceDays: '30',
    notifyEmail: 'orders@linnea.example',
    lowStockLevel: '10',
};

export function orderTotal(order: Order): number {
    return order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function customerName(id: number): string {
    return customers.find((customer) => customer.id === id)?.name ?? 'Unknown customer';
}

export function productName(id: number): string {
    return products.find((product) => product.id === id)?.name ?? 'Unknown product';
}
