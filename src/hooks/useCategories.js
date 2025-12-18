import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { getCategories } from '@/services/productService';

/**
 * Hook to fetch all categories
 * Categories don't change often, so cache for longer
 */
export const useCategories = () => {
    return useQuery({
        queryKey: queryKeys.categories.all,
        queryFn: getCategories,
        staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
        gcTime: 60 * 60 * 1000, // 1 hour cache
    });
};
