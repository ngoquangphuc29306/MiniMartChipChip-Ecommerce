import React from 'react';
import { Skeleton, SkeletonShimmer } from '@/components/ui/skeleton';

/**
 * Skeleton for order card in Account page
 */
const OrderCardSkeleton = () => {
    return (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full" />
            </div>

            {/* Order Items */}
            <div className="flex gap-3 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                    <SkeletonShimmer key={i} className="w-16 h-16 rounded-lg flex-shrink-0" />
                ))}
                <Skeleton className="w-8 h-16 rounded-lg flex-shrink-0" />
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-border">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-28" />
            </div>
        </div>
    );
};

/**
 * List of OrderCardSkeletons
 */
const OrderListSkeleton = ({ count = 3 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
                <OrderCardSkeleton key={index} />
            ))}
        </div>
    );
};

export { OrderCardSkeleton, OrderListSkeleton };
