import axios, { AxiosResponse } from 'axios';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
    BrandResponse,
    Product,
    brandProductsURL,
    brandsURL,
    productURL,
} from './types';

const getBrands = async () => {
    return await axios.get<BrandResponse[]>(brandsURL);
};

export const useGetBrands = (enabled = true) => {
    return useQuery<AxiosResponse<BrandResponse[]>>({
        queryKey: ['getBrands'],
        queryFn: getBrands,
        enabled,
        retry: 1,
    });
};

const getBrandProducts = async (
    brandId: string,
    limit: number,
    offset: number
) => {
    return await axios.get<Product[]>(brandProductsURL(brandId), {
        params: { limit, offset },
    });
};

export const useGetBrandProducts = (
    brands: BrandResponse[] = [],
    limit = 100,
    offset = 0
) => {
    const pageLimit = Math.min(100, Math.max(1, limit));

    return useQueries({
        queries: brands.map(({ id }) => ({
            queryKey: ['getBrandProducts', id, pageLimit, offset],
            queryFn: () => getBrandProducts(id, pageLimit, offset),
            retry: 1,
        })),
    });
};

const getProduct = async (productName: string) => {
    return await axios.get<Product>(productURL(productName));
};

export const useGetProduct = (enabled = true, productName?: string) => {
    return useQuery<AxiosResponse<Product>>({
        queryKey: ['getProduct', productName],
        queryFn: () => getProduct(productName!),
        enabled: enabled && !!productName,
        retry: 1,
    });
};
