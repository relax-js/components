import { ContainerService } from '@relax.js/core/di';
import { get } from '@relax.js/core/http';

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

async function load<T>(url: string): Promise<T> {
    const response = await get(url);
    if (!response.success) {
        throw new Error(`${url} failed with ${response.statusCode}`);
    }
    return response.as<T>();
}

/** Customers, categories and products: what orders are made of. */
@ContainerService({ inject: [] })
export class CatalogService {
    customers(): Promise<Customer[]> {
        return load('/api/customers');
    }

    categories(): Promise<Category[]> {
        return load('/api/categories');
    }

    /** Every product, or those in one category and its subcategories. */
    products(categoryId?: number): Promise<Product[]> {
        return load(categoryId === undefined ? '/api/products' : `/api/products?category=${categoryId}`);
    }
}
