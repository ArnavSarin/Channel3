const baseURL = 'http://127.0.0.1:8000';
export const brandsURL = `${baseURL}/brands`;
export const brandProductsURL = (brandId: string) =>
    `${brandsURL}/${brandId}/products`;
export const productURL = (productName: string) =>
    `${baseURL}/products/${encodeURIComponent(productName)}`;

export interface ProductPrice {
    price: number;
    currency: string;
    compare_at_price?: number | null;
}

export interface ProductVariant {
    name?: string | null;
    size?: string | null;
    price?: ProductPrice | number | null;
    availability?: boolean | null;
    sku?: string | null;
    mpn?: string | null;
}

export interface Product {
    id: string;
    brand_id: string;
    name: string;
    brand: string;
    category: { name: string } | null;
    description: string;
    price: ProductPrice | null;
    key_features: string[];
    colors: string[];
    variants: ProductVariant[];
    image_urls: string[];
    video_url?: string | null;
}

export interface BrandResponse {
    id: string;
    name: string;
    product_count: number;
}
