import React from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    Package,
    Truck,
    Home,
    XCircle,
    RotateCcw,
    MapPin
} from 'lucide-react';

// Status configuration with icons and colors
const STATUS_CONFIG = {
    Pending: {
        icon: Clock,
        label: 'Chờ xác nhận',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-500',
        order: 0
    },
    Confirmed: {
        icon: CheckCircle2,
        label: 'Đã xác nhận',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-blue-500',
        order: 1
    },
    Processing: {
        icon: Package,
        label: 'Đang chuẩn bị',
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        borderColor: 'border-purple-500',
        order: 2
    },
    Shipping: {
        icon: Truck,
        label: 'Đang giao hàng',
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        borderColor: 'border-orange-500',
        order: 3
    },
    Delivered: {
        icon: Home,
        label: 'Đã giao thành công',
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-500',
        order: 4
    },
    // Alias: Completed = Delivered (database uses 'Completed')
    Completed: {
        icon: Home,
        label: 'Đã giao thành công',
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-500',
        order: 4
    },
    Cancelled: {
        icon: XCircle,
        label: 'Đã hủy',
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-500',
        order: -1
    },
    Refunded: {
        icon: RotateCcw,
        label: 'Đã hoàn tiền',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        borderColor: 'border-gray-500',
        order: -1
    }
};

// Default tracking steps
const DEFAULT_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipping', 'Delivered'];

// Get status order (Completed maps to Delivered = 4)
const getStatusOrder = (status) => {
    if (status === 'Completed') return 4;
    return STATUS_CONFIG[status]?.order ?? 0;
};

// Format timestamp to Vietnamese locale
const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Default note for each status
const getDefaultNote = (status) => {
    const notes = {
        'Pending': 'Đơn hàng đã được tạo',
        'Confirmed': 'Đơn hàng đã được xác nhận',
        'Processing': 'Đang chuẩn bị hàng',
        'Shipping': 'Đang giao hàng',
        'Delivered': 'Đã giao thành công',
        'Completed': 'Đã giao thành công',
        'Cancelled': 'Đơn hàng đã bị hủy',
        'Refunded': 'Đã hoàn tiền'
    };
    return notes[status] || status;
};

/**
 * Generate timeline from current status when no tracking_history exists
 * This creates entries for all steps up to and including current status
 */
const generateTimelineFromStatus = (order) => {
    const currentStatus = order?.status || 'Pending';
    const currentOrder = getStatusOrder(currentStatus);
    const createdAt = order?.created_at;

    // If cancelled/refunded, show Pending + that status
    if (currentStatus === 'Cancelled' || currentStatus === 'Refunded') {
        return [
            { status: 'Pending', timestamp: createdAt, note: 'Đơn hàng đã được tạo' },
            { status: currentStatus, timestamp: null, note: STATUS_CONFIG[currentStatus].label }
        ];
    }

    // Generate entries for all completed steps
    const timeline = [];
    for (let i = 0; i <= currentOrder && i < DEFAULT_STEPS.length; i++) {
        const stepStatus = DEFAULT_STEPS[i];
        timeline.push({
            status: stepStatus,
            timestamp: i === 0 ? createdAt : null,
            note: getDefaultNote(stepStatus)
        });
    }

    return timeline;
};

/**
 * Order Tracking Timeline Component
 * Displays order progress through different stages
 */
const OrderTracking = ({
    order,
    trackingHistory = [],
    compact = false
}) => {
    const currentStatus = order?.status || 'Pending';
    const isCancelled = currentStatus === 'Cancelled' || currentStatus === 'Refunded';
    const currentStatusOrder = getStatusOrder(currentStatus);

    // Use tracking history if available, otherwise auto-generate from current status
    const historyToShow = trackingHistory.length > 0
        ? trackingHistory
        : generateTimelineFromStatus(order);

    // Get remaining/future steps
    const remainingSteps = !isCancelled
        ? DEFAULT_STEPS.filter((_, idx) => idx > currentStatusOrder)
        : [];

    if (compact) {
        // Compact horizontal progress bar
        return (
            <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                    {DEFAULT_STEPS.map((step, index) => {
                        const config = STATUS_CONFIG[step];
                        const isActive = index <= currentStatusOrder && !isCancelled;
                        const isCurrent = index === currentStatusOrder && !isCancelled;
                        const Icon = config.icon;

                        return (
                            <div key={step} className="flex flex-col items-center relative flex-1">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isActive ? config.bgColor + ' ' + config.color : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}
                                    ${isCurrent ? 'ring-2 ring-offset-2 ' + config.borderColor : ''}
                                `}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] mt-1 text-center ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                    {config.label}
                                </span>

                                {/* Connecting line */}
                                {index < DEFAULT_STEPS.length - 1 && (
                                    <div className="absolute top-4 left-1/2 w-full h-0.5">
                                        <div className={`h-full transition-all duration-500 ${index < currentStatusOrder ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Full timeline view
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-yellow-500" />
                Theo dõi đơn hàng
                <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${STATUS_CONFIG[currentStatus]?.bgColor} ${STATUS_CONFIG[currentStatus]?.color}`}>
                    {STATUS_CONFIG[currentStatus]?.label || currentStatus}
                </span>
            </h3>

            {/* Timeline */}
            <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                {/* Completed steps */}
                {historyToShow.map((entry, index) => {
                    const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.Pending;
                    const Icon = config.icon;
                    const isLast = index === historyToShow.length - 1 && remainingSteps.length === 0;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pb-6"
                        >
                            {/* Icon */}
                            <div className={`
                                absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center
                                ${config.bgColor} ${config.color}
                            `}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>

                            {/* Content */}
                            <div className="ml-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-semibold ${config.color}`}>
                                        {config.label}
                                    </span>
                                    {isLast && (
                                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                            Hiện tại
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {entry.note || getDefaultNote(entry.status)}
                                </p>
                                {entry.timestamp && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatTimestamp(entry.timestamp)}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Future/Pending steps */}
                {remainingSteps.map((step) => {
                    const config = STATUS_CONFIG[step];
                    const Icon = config.icon;

                    return (
                        <div key={step} className="relative pb-6 last:pb-0 opacity-40">
                            <div className="absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="ml-4">
                                <span className="font-medium text-gray-400">{config.label}</span>
                                <p className="text-xs text-gray-400 mt-0.5">Đang chờ...</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status-specific messages */}
            {currentStatus === 'Shipping' && (
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="font-medium text-orange-700 dark:text-orange-400">
                                Đang trên đường giao đến bạn
                            </p>
                            <p className="text-sm text-orange-600/70 dark:text-orange-400/70">
                                Dự kiến giao trong 1-2 ngày
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {(currentStatus === 'Delivered' || currentStatus === 'Completed') && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="font-medium text-green-700 dark:text-green-400">
                                Đơn hàng đã được giao thành công!
                            </p>
                            <p className="text-sm text-green-600/70 dark:text-green-400/70">
                                Cảm ơn bạn đã mua sắm tại ChipChip
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTracking;
