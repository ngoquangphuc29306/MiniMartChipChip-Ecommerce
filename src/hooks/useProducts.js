import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as productService from '@/services/productService';

/**
 * Hook to fetch products with filters
 * @param {Object} options - Filter options (category, searchQuery, sortOrder)
 */
export const useProducts = (options = {}) => {
    return useQuery({
        queryKey: queryKeys.products.list(options),
        queryFn: () => productService.getProducts(options),
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
};

/**
 * Hook to fetch a single product by ID
 * @param {string} productId - Product ID
 */
export const useProduct = (productId) => {
    return useQuery({
        queryKey: queryKeys.products.detail(productId),
        queryFn: () => productService.getProductById(productId),
        enabled: !!productId, // Only fetch if productId exists
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to fetch featured products
 */
export const useFeaturedProducts = () => {
    return useQuery({
        queryKey: queryKeys.products.featured,
        queryFn: () => productService.getFeaturedProducts(),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to fetch related products
 * @param {string} category - Product category
 * @param {string} excludeId - Product ID to exclude
 */
export const useRelatedProducts = (category, excludeId) => {
    return useQuery({
        queryKey: queryKeys.products.related(category, excludeId),
        queryFn: () => productService.getRelatedProducts(category, excludeId),
        enabled: !!category && !!excludeId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to search products
 * @param {string} query - Search query
 */
export const useSearchProducts = (query) => {
    return useQuery({
        queryKey: ['products', 'search', query],
        queryFn: () => productService.searchProducts(query),
        enabled: query?.length >= 2, // Only search with 2+ characters
        staleTime: 1 * 60 * 1000, // 1 minute for search results
    });
};

/**
 * Hook to invalidate products cache
 * Useful after adding/updating/deleting products
 */
export const useInvalidateProducts = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    };
};
