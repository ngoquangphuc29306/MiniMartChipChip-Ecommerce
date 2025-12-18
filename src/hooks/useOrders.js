import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as orderService from '@/services/orderService';

/**
 * Hook to fetch all orders for current user
 */
export const useOrders = () => {
    return useQuery({
        queryKey: queryKeys.orders.list(),
        queryFn: () => orderService.getOrders(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to fetch a single order by ID
 * @param {string} orderId - Order ID
 */
export const useOrder = (orderId) => {
    return useQuery({
        queryKey: queryKeys.orders.detail(orderId),
        queryFn: () => orderService.getOrderById(orderId),
        enabled: !!orderId,
        staleTime: 1 * 60 * 1000, // 1 minute for order details
    });
};

/**
 * Hook to fetch order tracking history
 * @param {string} orderId - Order ID
 */
export const useOrderTracking = (orderId) => {
    return useQuery({
        queryKey: queryKeys.orders.tracking(orderId),
        queryFn: async () => {
            const order = await orderService.getOrderById(orderId);
            return order?.tracking_history || [];
        },
        enabled: !!orderId,
        staleTime: 30 * 1000, // 30 seconds - tracking updates frequently
        refetchInterval: 60 * 1000, // Auto refetch every minute
    });
};

/**
 * Hook to create a new order
 */
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ cartItems, totalPrice, customerInfo, voucherCode }) =>
            orderService.createOrder(cartItems, totalPrice, customerInfo, voucherCode),
        onSuccess: () => {
            // Invalidate orders cache after creating new order
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
            // Also invalidate cart
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        },
    });
};

/**
 * Hook to update order status (Admin only)
 */
export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, status, note }) =>
            orderService.updateOrderStatus(orderId, status, note),
        onSuccess: (data, variables) => {
            // Invalidate specific order and orders list
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
        },
    });
};

/**
 * Hook to invalidate orders cache
 */
export const useInvalidateOrders = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    };
};
