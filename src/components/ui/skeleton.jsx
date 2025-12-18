import { cn } from "@/lib/utils";

function Skeleton({
    className,
    ...props
}) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
                className
            )}
            {...props}
        />
    );
}

// Shimmer effect variant
function SkeletonShimmer({
    className,
    ...props
}) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700",
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
    );
}

// Text skeleton with natural line height
function SkeletonText({ lines = 1, className }) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

// Circle skeleton for avatars
function SkeletonAvatar({ size = "md", className }) {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-16 h-16"
    };

    return (
        <Skeleton
            className={cn("rounded-full", sizes[size], className)}
        />
    );
}

export { Skeleton, SkeletonShimmer, SkeletonText, SkeletonAvatar };
