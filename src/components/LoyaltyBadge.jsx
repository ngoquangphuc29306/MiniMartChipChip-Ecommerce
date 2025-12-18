import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Gift, Truck, Star, Crown } from 'lucide-react';
import { getTierProgress, getTierColors } from '@/services/loyaltyService';

/**
 * LoyaltyBadge - Displays user's current tier with progress
 * @param {number} totalPoints - User's total accumulated points
 * @param {number} points - User's current usable points
 * @param {boolean} showProgress - Show progress bar to next tier
 * @param {boolean} compact - Compact mode for header/nav
 */
const LoyaltyBadge = ({
    totalPoints = 0,
    points = 0,
    showProgress = true,
    compact = false
}) => {
    const [tierData, setTierData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTierData = async () => {
            const data = await getTierProgress(totalPoints);
            setTierData(data);
            setLoading(false);
        };
        loadTierData();
    }, [totalPoints]);

    if (loading || !tierData) {
        return (
            <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl h-16 w-full" />
        );
    }

    const { currentTier, nextTier, progress, pointsToNext, isMaxTier } = tierData;
    const colors = getTierColors(currentTier.slug);

    if (compact) {
        // Compact badge for nav/header
        return (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} text-sm font-bold`}>
                <span>{currentTier.icon}</span>
                <span className="hidden sm:inline">{currentTier.name.replace('Thành viên ', '')}</span>
            </div>
        );
    }

    // Full badge with progress
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} p-5`}
        >
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} rounded-full blur-2xl`} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                        {currentTier.icon}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${colors.text}`}>{currentTier.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {isMaxTier ? 'Hạng cao nhất!' : `Còn ${pointsToNext.toLocaleString()} điểm nữa`}
                        </p>
                    </div>
                </div>

                {/* Points display */}
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Điểm khả dụng</p>
                    <p className={`text-2xl font-bold ${colors.text}`}>{points.toLocaleString()}</p>
                </div>
            </div>

            {/* Progress bar to next tier */}
            {showProgress && !isMaxTier && (
                <div className="relative z-10">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                            {currentTier.icon} {currentTier.min_points.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            {nextTier?.icon} {nextTier?.min_points.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        Tổng tích lũy: <span className="font-bold">{totalPoints.toLocaleString()}</span> điểm
                    </p>
                </div>
            )}

            {isMaxTier && (
                <div className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 mt-2">
                    <Crown className="w-4 h-4" />
                    <span>Bạn đang ở hạng cao nhất! Tận hưởng đặc quyền VIP</span>
                </div>
            )}

            {/* Benefits preview */}
            {currentTier.discount_percent > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>Giảm {currentTier.discount_percent}%</span>
                    </div>
                    {currentTier.free_shipping_threshold !== null && (
                        <div className="flex items-center gap-1 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-lg">
                            <Truck className="w-3 h-3 text-green-500" />
                            <span>
                                {currentTier.free_shipping_threshold === 0
                                    ? 'Free ship mọi đơn'
                                    : `Free ship từ ${(currentTier.free_shipping_threshold / 1000).toFixed(0)}k`}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

/**
 * TierBenefitsList - Show all benefits for a tier
 */
export const TierBenefitsList = ({ tier }) => {
    if (!tier?.benefits) return null;

    const benefits = typeof tier.benefits === 'string'
        ? JSON.parse(tier.benefits)
        : tier.benefits;

    return (
        <ul className="space-y-2">
            {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span>{benefit}</span>
                </li>
            ))}
        </ul>
    );
};

/**
 * AllTiersDisplay - Show all available tiers with requirements
 * @param {number} totalPoints - User's total points to determine current tier
 */
export const AllTiersDisplay = ({ totalPoints = 0 }) => {
    const [tiers, setTiers] = useState([]);
    const [currentTierSlug, setCurrentTierSlug] = useState('bronze');

    useEffect(() => {
        const loadTiers = async () => {
            const { getLoyaltyTiers, getUserTier } = await import('@/services/loyaltyService');
            const data = await getLoyaltyTiers();
            setTiers(data);

            // Calculate current tier from points
            const userTier = await getUserTier(totalPoints);
            if (userTier) {
                setCurrentTierSlug(userTier.slug);
            }
        };
        loadTiers();
    }, [totalPoints]);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {tiers.map((tier) => {
                const colors = getTierColors(tier.slug);
                const isActive = tier.slug === currentTierSlug;
                const benefits = typeof tier.benefits === 'string'
                    ? JSON.parse(tier.benefits)
                    : tier.benefits || [];

                return (
                    <div
                        key={tier.slug}
                        className={`rounded-2xl p-4 border-2 transition-all ${isActive
                            ? `${colors.border} ${colors.bg} shadow-lg`
                            : 'border-gray-200 dark:border-gray-700 bg-card'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">{tier.icon}</span>
                            <div>
                                <h4 className={`font-bold ${isActive ? colors.text : 'text-foreground'}`}>
                                    {tier.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    {tier.min_points === 0 ? 'Mặc định' : `Từ ${tier.min_points.toLocaleString()} điểm`}
                                </p>
                            </div>
                            {isActive && (
                                <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-bold">
                                    Hiện tại
                                </span>
                            )}
                        </div>
                        <ul className="space-y-1.5 text-sm">
                            {benefits.slice(0, 3).map((b, i) => (
                                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                                    <ChevronRight className="w-3 h-3" />
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};

export default LoyaltyBadge;
