import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache data for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus for better UX
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
        },
    },
});

// Query keys factory for consistent key management
export const queryKeys = {
    // Products
    products: {
        all: ['products'],
        list: (filters) => ['products', 'list', filters],
        detail: (id) => ['products', 'detail', id],
        featured: ['products', 'featured'],
        related: (category, excludeId) => ['products', 'related', category, excludeId],
    },
    // Categories
    categories: {
        all: ['categories'],
    },
    // Orders
    orders: {
        all: ['orders'],
        list: () => ['orders', 'list'],
        detail: (id) => ['orders', 'detail', id],
        tracking: (id) => ['orders', 'tracking', id],
    },
    // Reviews
    reviews: {
        byProduct: (productId) => ['reviews', 'product', productId],
        stats: (productId) => ['reviews', 'stats', productId],
    },
    // Cart
    cart: {
        all: ['cart'],
    },
    // Vouchers
    vouchers: {
        public: ['vouchers', 'public'],
        user: (userId) => ['vouchers', 'user', userId],
    },
};
