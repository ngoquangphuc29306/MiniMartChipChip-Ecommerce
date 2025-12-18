import { supabase } from '@/lib/customSupabaseClient';

// =============================================
// LOYALTY TIERS SERVICE
// =============================================

// Tier configuration (fallback if DB not available)
const DEFAULT_TIERS = [
    { slug: 'bronze', name: 'Thành viên Đồng', min_points: 0, discount_percent: 0, free_shipping_threshold: null, badge_color: 'amber', icon: '🥉' },
    { slug: 'silver', name: 'Thành viên Bạc', min_points: 1000, discount_percent: 5, free_shipping_threshold: 200000, badge_color: 'gray', icon: '🥈' },
    { slug: 'gold', name: 'Thành viên Vàng', min_points: 5000, discount_percent: 10, free_shipping_threshold: 100000, badge_color: 'yellow', icon: '🥇' },
    { slug: 'diamond', name: 'Thành viên Kim Cương', min_points: 15000, discount_percent: 15, free_shipping_threshold: 0, badge_color: 'cyan', icon: '💎' }
];

// Cache tiers from DB
let cachedTiers = null;

/**
 * Fetch all loyalty tiers from database
 */
export const getLoyaltyTiers = async () => {
    if (cachedTiers) return cachedTiers;

    try {
        const { data, error } = await supabase
            .from('loyalty_tiers')
            .select('*')
            .order('min_points', { ascending: true });

        if (error) {
            console.warn('Using default tiers (DB not available):', error.message);
            return DEFAULT_TIERS;
        }

        cachedTiers = data || DEFAULT_TIERS;
        return cachedTiers;
    } catch (err) {
        console.warn('Using default tiers:', err);
        return DEFAULT_TIERS;
    }
};

/**
 * Get user's current tier based on total_points
 * @param {number} totalPoints - User's total accumulated points (never decreases)
 * @returns {object} Tier object with all properties
 */
export const getUserTier = async (totalPoints) => {
    const tiers = await getLoyaltyTiers();

    // Find highest tier that user qualifies for
    let userTier = tiers[0]; // Default to bronze

    for (const tier of tiers) {
        if (totalPoints >= tier.min_points) {
            userTier = tier;
        }
    }

    return userTier;
};

/**
 * Get next tier and progress towards it
 * @param {number} totalPoints - User's total accumulated points
 * @returns {object} { currentTier, nextTier, progress, pointsToNext }
 */
export const getTierProgress = async (totalPoints) => {
    const tiers = await getLoyaltyTiers();
    const currentTier = await getUserTier(totalPoints);

    // Find next tier
    const currentIndex = tiers.findIndex(t => t.slug === currentTier.slug);
    const nextTier = tiers[currentIndex + 1] || null;

    if (!nextTier) {
        // Already at max tier
        return {
            currentTier,
            nextTier: null,
            progress: 100,
            pointsToNext: 0,
            isMaxTier: true
        };
    }

    // Calculate progress percentage
    const pointsInCurrentTier = totalPoints - currentTier.min_points;
    const pointsNeededForNext = nextTier.min_points - currentTier.min_points;
    const progress = Math.min(100, Math.round((pointsInCurrentTier / pointsNeededForNext) * 100));
    const pointsToNext = nextTier.min_points - totalPoints;

    return {
        currentTier,
        nextTier,
        progress,
        pointsToNext,
        isMaxTier: false
    };
};

/**
 * Calculate tier discount for cart
 * @param {number} subtotal - Cart subtotal before discount
 * @param {object} tier - User's tier object
 * @returns {number} Discount amount
 */
export const calculateTierDiscount = (subtotal, tier) => {
    if (!tier || !tier.discount_percent) return 0;
    return Math.round(subtotal * (tier.discount_percent / 100));
};

/**
 * Check if user qualifies for free shipping based on tier
 * @param {number} subtotal - Cart subtotal
 * @param {object} tier - User's tier object
 * @returns {object} { isFreeShipping, threshold, amountToFreeShip }
 */
export const checkFreeShipping = (subtotal, tier) => {
    if (!tier || tier.free_shipping_threshold === null) {
        return { isFreeShipping: false, threshold: null, amountToFreeShip: null };
    }

    // free_shipping_threshold = 0 means always free
    if (tier.free_shipping_threshold === 0) {
        return { isFreeShipping: true, threshold: 0, amountToFreeShip: 0 };
    }

    const isFreeShipping = subtotal >= tier.free_shipping_threshold;
    const amountToFreeShip = isFreeShipping ? 0 : tier.free_shipping_threshold - subtotal;

    return {
        isFreeShipping,
        threshold: tier.free_shipping_threshold,
        amountToFreeShip
    };
};

/**
 * Add points to user after order completion
 * This updates BOTH points (usable) and total_points (for tier)
 * Uses atomic RPC function to prevent race conditions
 * @param {string} userId - User's ID
 * @param {number} orderTotal - Order total in VND
 * @param {number} pointsPerUnit - Points per 10,000đ (default: 1)
 */
export const addPointsForOrder = async (userId, orderTotal, pointsPerUnit = 1) => {
    // Calculate points earned (1 point per 10,000đ by default)
    const pointsEarned = Math.floor(orderTotal / 10000) * pointsPerUnit;

    if (pointsEarned <= 0) return { pointsEarned: 0 };

    try {
        // Try atomic RPC update first (handles concurrency)
        const { data: rpcResult, error: rpcError } = await supabase.rpc('update_points_atomic', {
            p_user_id: userId,
            p_points_delta: pointsEarned,
            p_update_total_points: true
        });

        if (!rpcError && rpcResult?.success) {
            console.log('Points added via atomic RPC:', rpcResult);
            return {
                pointsEarned,
                newPoints: rpcResult.new_points,
                newTotalPoints: rpcResult.new_total_points
            };
        }

        // Fallback to legacy method if RPC not available
        console.warn('RPC not available for points, using legacy method:', rpcError?.message);
        return await addPointsForOrderLegacy(userId, pointsEarned);
    } catch (error) {
        console.error('Error adding points:', error);
        return { pointsEarned: 0, error };
    }
};

// Legacy fallback for addPointsForOrder
const addPointsForOrderLegacy = async (userId, pointsEarned) => {
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points, total_points')
        .eq('id', userId)
        .single();

    if (fetchError) throw fetchError;

    const currentPoints = profile?.points || 0;
    const currentTotalPoints = profile?.total_points || 0;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            points: currentPoints + pointsEarned,
            total_points: currentTotalPoints + pointsEarned
        })
        .eq('id', userId);

    if (updateError) throw updateError;

    return {
        pointsEarned,
        newPoints: currentPoints + pointsEarned,
        newTotalPoints: currentTotalPoints + pointsEarned
    };
};

/**
 * Deduct points from user after order cancellation/refund
 * This updates BOTH points (usable) and total_points (for tier)
 * Uses atomic RPC function to prevent race conditions
 * @param {string} userId - User's ID
 * @param {number} orderTotal - Order total in VND
 * @param {number} pointsPerUnit - Points per 10,000đ (default: 1)
 */
export const deductPointsOrder = async (userId, orderTotal, pointsPerUnit = 1) => {
    // Calculate points to deduct (same logic as earned)
    const pointsToDeduct = Math.floor(orderTotal / 10000) * pointsPerUnit;

    if (pointsToDeduct <= 0) return { pointsToDeduct: 0 };

    try {
        // Try atomic RPC update first (handles concurrency)
        const { data: rpcResult, error: rpcError } = await supabase.rpc('update_points_atomic', {
            p_user_id: userId,
            p_points_delta: -pointsToDeduct, // Negative for deduction
            p_update_total_points: true
        });

        if (!rpcError && rpcResult?.success) {
            console.log('Points deducted via atomic RPC:', rpcResult);
            return {
                pointsToDeduct,
                newPoints: rpcResult.new_points,
                newTotalPoints: rpcResult.new_total_points,
                deducted: true
            };
        }

        // Fallback to legacy method if RPC not available
        console.warn('RPC not available for points, using legacy method:', rpcError?.message);
        return await deductPointsOrderLegacy(userId, pointsToDeduct);
    } catch (error) {
        console.error('Error deducting points:', error);
        return { pointsToDeduct: 0, error };
    }
};

// Legacy fallback for deductPointsOrder
const deductPointsOrderLegacy = async (userId, pointsToDeduct) => {
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points, total_points')
        .eq('id', userId)
        .single();

    if (fetchError) throw fetchError;

    const currentPoints = profile?.points || 0;
    const currentTotalPoints = profile?.total_points || 0;
    const newPoints = Math.max(0, currentPoints - pointsToDeduct);
    const newTotalPoints = Math.max(0, currentTotalPoints - pointsToDeduct);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            points: newPoints,
            total_points: newTotalPoints
        })
        .eq('id', userId);

    if (updateError) throw updateError;

    return {
        pointsToDeduct,
        newPoints,
        newTotalPoints,
        deducted: true
    };
};

/**
 * Deduct points when redeeming voucher
 * Only deducts from 'points', NOT from 'total_points'
 * Uses atomic RPC function to prevent race conditions
 * @param {string} userId - User's ID
 * @param {number} pointsCost - Points to deduct
 */
export const deductPoints = async (userId, pointsCost) => {
    try {
        // Try atomic RPC update first (handles concurrency)
        const { data: rpcResult, error: rpcError } = await supabase.rpc('deduct_points_for_voucher', {
            p_user_id: userId,
            p_points_cost: pointsCost
        });

        if (!rpcError && rpcResult) {
            if (rpcResult.success) {
                console.log('Points deducted via atomic RPC:', rpcResult);
                return { success: true, newPoints: rpcResult.new_points };
            } else {
                // RPC returned error (e.g., not enough points)
                return { success: false, error: new Error(rpcResult.error) };
            }
        }

        // Fallback to legacy method if RPC not available
        console.warn('RPC not available for voucher points, using legacy method:', rpcError?.message);
        return await deductPointsLegacy(userId, pointsCost);
    } catch (error) {
        console.error('Error deducting points:', error);
        return { success: false, error };
    }
};

// Legacy fallback for deductPoints
const deductPointsLegacy = async (userId, pointsCost) => {
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

    if (fetchError) throw fetchError;

    const currentPoints = profile?.points || 0;

    if (currentPoints < pointsCost) {
        throw new Error('Không đủ điểm');
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: currentPoints - pointsCost })
        .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, newPoints: currentPoints - pointsCost };
};

/**
 * Get tier color classes for styling
 */
export const getTierColors = (slug) => {
    const colors = {
        bronze: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-700 dark:text-amber-400',
            border: 'border-amber-300 dark:border-amber-700',
            gradient: 'from-amber-400 to-orange-500'
        },
        silver: {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-700 dark:text-gray-300',
            border: 'border-gray-300 dark:border-gray-600',
            gradient: 'from-gray-300 to-gray-500'
        },
        gold: {
            bg: 'bg-yellow-100 dark:bg-yellow-900/30',
            text: 'text-yellow-700 dark:text-yellow-400',
            border: 'border-yellow-300 dark:border-yellow-700',
            gradient: 'from-yellow-400 to-amber-500'
        },
        diamond: {
            bg: 'bg-cyan-100 dark:bg-cyan-900/30',
            text: 'text-cyan-700 dark:text-cyan-400',
            border: 'border-cyan-300 dark:border-cyan-700',
            gradient: 'from-cyan-400 to-blue-500'
        }
    };

    return colors[slug] || colors.bronze;
};

// =============================================
// ADMIN FUNCTIONS
// =============================================

/**
 * Clear tier cache (call after CRUD operations)
 */
export const clearTierCache = () => {
    cachedTiers = null;
};

/**
 * Admin: Create a new tier
 */
export const adminCreateTier = async (tierData) => {
    try {
        const { data, error } = await supabase
            .from('loyalty_tiers')
            .insert({
                name: tierData.name,
                slug: tierData.slug,
                min_points: tierData.min_points || 0,
                discount_percent: tierData.discount_percent || 0,
                free_shipping_threshold: tierData.free_shipping_threshold,
                badge_color: tierData.badge_color || 'gray',
                icon: tierData.icon || '🎖️',
                benefits: tierData.benefits || [],
                sort_order: tierData.sort_order || 0
            })
            .select()
            .single();

        if (error) throw error;
        clearTierCache();
        return { success: true, data };
    } catch (error) {
        console.error('Error creating tier:', error);
        return { success: false, error };
    }
};

/**
 * Admin: Update an existing tier
 */
export const adminUpdateTier = async (tierId, tierData) => {
    try {
        const { data, error } = await supabase
            .from('loyalty_tiers')
            .update({
                name: tierData.name,
                slug: tierData.slug,
                min_points: tierData.min_points,
                discount_percent: tierData.discount_percent,
                free_shipping_threshold: tierData.free_shipping_threshold,
                badge_color: tierData.badge_color,
                icon: tierData.icon,
                benefits: tierData.benefits
            })
            .eq('id', tierId)
            .select()
            .single();

        if (error) throw error;
        clearTierCache();
        return { success: true, data };
    } catch (error) {
        console.error('Error updating tier:', error);
        return { success: false, error };
    }
};

/**
 * Admin: Delete a tier
 */
export const adminDeleteTier = async (tierId) => {
    try {
        const { error } = await supabase
            .from('loyalty_tiers')
            .delete()
            .eq('id', tierId);

        if (error) throw error;
        clearTierCache();
        return { success: true };
    } catch (error) {
        console.error('Error deleting tier:', error);
        return { success: false, error };
    }
};
