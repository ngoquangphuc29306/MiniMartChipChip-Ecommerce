import React from 'react';
import { Skeleton, SkeletonShimmer } from '@/components/ui/skeleton';

/**
 * Skeleton loading state for ProductCard
 * Matches the exact layout of ProductCard component
 */
const ProductCardSkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-card rounded-2xl p-4 flex gap-4 border border-border">
        {/* Image */}
        <SkeletonShimmer className="w-24 h-24 rounded-xl flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>
    );
  }

  // Grid mode (default)
  return (
    <div className="bg-card rounded-[1.5rem] overflow-hidden border border-border shadow-sm">
      {/* Image Container */}
      <div className="relative aspect-square p-4">
        <SkeletonShimmer className="w-full h-full rounded-xl" />

        {/* Badge placeholder */}
        <Skeleton className="absolute top-4 left-4 h-6 w-16 rounded-full" />

        {/* Wishlist button placeholder */}
        <Skeleton className="absolute top-4 right-4 w-8 h-8 rounded-full" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-20" />

        {/* Title */}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-4 h-4 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Add to cart button */}
        <Skeleton className="h-12 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
};

/**
 * Grid of ProductCardSkeletons
 */
const ProductGridSkeleton = ({
  count = 8,
  viewMode = 'grid',
  className = ''
}) => {
  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
    : 'flex flex-col gap-4';

  return (
    <div className={`${gridClass} ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
};

export { ProductCardSkeleton, ProductGridSkeleton };
