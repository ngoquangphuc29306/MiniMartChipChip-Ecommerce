
import { supabase } from '@/lib/customSupabaseClient';
import { deductPointsOrder } from './loyaltyService';

// =============================================
// ORDER SERVICE
// =============================================

/**
 * Create order with server-side price validation
 * Uses RPC function for atomic operation with price validation
 * Falls back to legacy method if RPC is not available
 */
export const createOrder = async (cartItems, totalPrice, customerInfo, voucherCode = null, discountAmount = 0, shippingFee = 0) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Prepare cart items for RPC (format: product_id, quantity)
        const cartItemsForRpc = cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));

        // Try to use RPC function for server-side price validation
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_with_validation', {
            p_user_id: user.id,
            p_cart_items: cartItemsForRpc,
            p_customer_info: {
                name: customerInfo.name,
                phone: customerInfo.phone,
                address: customerInfo.address,
                note: customerInfo.note,
                paymentMethod: customerInfo.paymentMethod || 'cod'
            },
            p_voucher_code: voucherCode,
            p_discount_amount: discountAmount,
            p_shipping_fee: shippingFee
        });

        // If RPC succeeded, return the result
        if (!rpcError && rpcResult) {
            console.log('Order created via RPC with server-side validation:', rpcResult);
            return {
                id: rpcResult.id,
                total_price: rpcResult.total_price,
                status: rpcResult.status,
                payment_status: rpcResult.payment_status
            };
        }

        // Fallback to legacy method if RPC is not available
        console.warn('RPC not available, falling back to legacy order creation:', rpcError?.message);
        return await createOrderLegacy(cartItems, totalPrice, customerInfo, voucherCode);

    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

/**
 * Legacy order creation method (fallback)
 * Used when RPC function is not available in database
 */
const createOrderLegacy = async (cartItems, totalPrice, customerInfo, voucherCode = null) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        // Determine payment_status based on payment method
        const paymentStatus = customerInfo.paymentMethod === 'cod' ? 'unpaid' : 'paid';

        // 1. Create Order Record
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([
                {
                    user_id: user?.id,
                    total_price: totalPrice,
                    status: 'Pending',
                    full_name: customerInfo.name,
                    phone: customerInfo.phone,
                    address: customerInfo.address,
                    note: customerInfo.note,
                    payment_method: customerInfo.paymentMethod || 'cod',
                    payment_status: paymentStatus,
                    voucher_code: voucherCode
                }
            ])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.sale_price || item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // 3. Handle Voucher Usage (if applicable)
        if (voucherCode) {
            // Check if it's a unique user voucher (has suffix)
            if (voucherCode.includes('_')) {
                await supabase
                    .from('redeemed_vouchers')
                    .update({ is_used: true, used_at: new Date().toISOString() })
                    .eq('voucher_code', voucherCode);
            }

            // Record usage in used_vouchers table for history
            if (user) {
                await supabase.from('used_vouchers').insert([{
                    user_id: user.id,
                    voucher_code: voucherCode,
                    used_at: new Date().toISOString()
                }]);
            }

            // Increment global usage count for the base voucher
            const baseCode = voucherCode.split('_')[0];
            const { data: voucher } = await supabase.from('vouchers').select('id, used_count').eq('code', baseCode).maybeSingle();
            if (voucher) {
                await supabase.from('vouchers').update({ used_count: (voucher.used_count || 0) + 1 }).eq('id', voucher.id);
            }
        }

        return order;
    } catch (error) {
        console.error('Error creating order (legacy):', error);
        throw error;
    }
};


export const getOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (
        *,
        products (
          name,
          image
        )
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
    return data;
};

// --- ADMIN FUNCTIONS ---

export const getAllOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      profiles:user_id (
        full_name,
        email,
        phone,
        address
      ),
      order_items (
        *,
        products (
          name,
          image
        )
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all orders:', error);
        return [];
    }
    return data;
};

// Get single order by ID
export const getOrderById = async (orderId) => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (
        *,
        products (
          name,
          image
        )
      )
    `)
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }
    return data;
};

export const updateOrderStatus = async (orderId, status, note = '') => {
    // First get current order to append tracking history
    const { data: currentOrder } = await supabase
        .from('orders')
        .select('tracking_history')
        .eq('id', orderId)
        .single();

    // Build tracking history entry
    const trackingEntry = {
        status,
        timestamp: new Date().toISOString(),
        note: note || getDefaultStatusNote(status)
    };

    // Append to existing history or create new
    const existingHistory = currentOrder?.tracking_history || [];
    const newHistory = [...existingHistory, trackingEntry];

    const { data, error } = await supabase
        .from('orders')
        .update({
            status,
            tracking_history: newHistory
        })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
    return data;
};

// Helper to get default note for status
const getDefaultStatusNote = (status) => {
    const notes = {
        'Pending': 'Đơn hàng đã được tạo',
        'Confirmed': 'Đơn hàng đã được xác nhận',
        'Processing': 'Đang chuẩn bị hàng',
        'Shipping': 'Đang giao hàng',
        'Delivered': 'Đã giao thành công',
        'Cancelled': 'Đơn hàng đã bị hủy',
        'Refunded': 'Đã hoàn tiền'
    };
    return notes[status] || `Trạng thái: ${status}`;
};

export const getDashboardStats = async () => {
    try {
        // 1. Total Revenue (Completed orders)
        const { data: revenueData, error: revenueError } = await supabase
            .from('orders')
            .select('total_price')
            .eq('status', 'Completed');

        if (revenueError) throw revenueError;
        const totalRevenue = revenueData.reduce((sum, order) => sum + (order.total_price || 0), 0);

        // 2. Total Orders
        const { count: totalOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (ordersError) throw ordersError;

        // 3. Pending Orders
        const { count: pendingOrders, error: pendingError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');

        if (pendingError) throw pendingError;

        // 4. Total Users
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        return {
            totalRevenue,
            totalOrders: totalOrders || 0,
            pendingOrders: pendingOrders || 0,
            userCount: userCount || 0
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return { totalRevenue: 0, totalOrders: 0, pendingOrders: 0, userCount: 0 };
    }
};

export const refundOrderOnCancel = async (orderId) => {
    try {
        // 1. Get order details to check for voucher and total price
        const { data: order, error } = await supabase
            .from('orders')
            .select('voucher_code, user_id, total_price')
            .eq('id', orderId)
            .single();

        if (error || !order) return { success: false };

        let voucherRefunded = false;
        let pointsDeducted = 0;

        // 2. Refund Voucher if used
        if (order.voucher_code) {
            const voucherCode = order.voucher_code;

            // If it's a unique code (from redeemed_vouchers), reactivate it
            if (voucherCode.includes('_')) {
                await supabase
                    .from('redeemed_vouchers')
                    .update({ is_used: false, used_at: null })
                    .eq('voucher_code', voucherCode);

                voucherRefunded = true;
            }

            // Decrement global usage count for the base voucher
            const baseCode = voucherCode.split('_')[0];
            const { data: voucher } = await supabase.from('vouchers').select('id, used_count').eq('code', baseCode).maybeSingle();

            if (voucher && voucher.used_count > 0) {
                await supabase
                    .from('vouchers')
                    .update({ used_count: voucher.used_count - 1 })
                    .eq('id', voucher.id);
            }
        }

        // 3. Deduct points if they were earned (Standard logic: 1 point / 10k VND)
        if (order.user_id && order.total_price > 0) {
            const result = await deductPointsOrder(order.user_id, order.total_price);
            if (result.deducted) {
                pointsDeducted = result.pointsToDeduct;
            }
        }

        return { success: true, voucherRefunded, pointsDeducted };

    } catch (error) {
        console.error('Error refunding order:', error);
        return { success: false };
    }
};

// =============================================
// VOUCHER SERVICE - CRUD & Validation
// =============================================

// --- ADMIN FUNCTIONS ---

export const getAllVouchers = async () => {
    const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching vouchers:', error);
        throw error;
    }
    return data || [];
};

export const createVoucher = async (voucherData) => {
    // Clean data - convert empty strings to null
    const cleanData = {};
    Object.entries(voucherData).forEach(([key, value]) => {
        if (value === '' || value === undefined) {
            cleanData[key] = null;
        } else {
            cleanData[key] = value;
        }
    });

    const { data, error } = await supabase
        .from('vouchers')
        .insert([cleanData])
        .select()
        .single();

    if (error) {
        console.error('Error creating voucher:', error);
        throw error;
    }
    return data;
};

export const updateVoucher = async (id, voucherData) => {
    const cleanData = {};
    Object.entries(voucherData).forEach(([key, value]) => {
        if (value === '' || value === undefined) {
            cleanData[key] = null;
        } else {
            cleanData[key] = value;
        }
    });

    const { data, error } = await supabase
        .from('vouchers')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating voucher:', error);
        throw error;
    }
    return data;
};

export const deleteVoucher = async (id) => {
    const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting voucher:', error);
        throw error;
    }
    return true;
};

// --- PUBLIC FUNCTIONS ---

// Get public vouchers for display (Home, Cart)
export const getPublicVouchers = async () => {
    const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching public vouchers:', error);
        return [];
    }

    // Filter expired vouchers on client side
    const now = new Date();
    return (data || []).filter(v => {
        const validFrom = v.valid_from ? new Date(v.valid_from) : null;
        const validUntil = v.valid_until ? new Date(v.valid_until) : null;

        if (validFrom && validFrom > now) return false;
        if (validUntil && validUntil < now) return false;
        return true;
    });
};

// Get redeemable vouchers (for points exchange)
export const getRedeemableVouchers = async () => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', false)
        .gt('points_cost', 0)
        .or(`valid_from.is.null,valid_from.lte.${now}`)
        .or(`valid_until.is.null,valid_until.gte.${now}`);

    if (error) {
        console.error('Error fetching redeemable vouchers:', error);
        return [];
    }
    return data || [];
};

// Get voucher by code
export const getVoucherByCode = async (code) => {
    const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('Error fetching voucher by code:', error);
        return null;
    }
    return data;
};

// Validate voucher for cart
export const validateVoucher = async (code, userId, cartItems, subtotal) => {
    const voucher = await getVoucherByCode(code);

    if (!voucher) {
        return { valid: false, error: 'Mã voucher không tồn tại.' };
    }

    const now = new Date();

    // Check expiration
    if (voucher.valid_from && new Date(voucher.valid_from) > now) {
        return { valid: false, error: 'Voucher chưa có hiệu lực.' };
    }
    if (voucher.valid_until && new Date(voucher.valid_until) < now) {
        return { valid: false, error: 'Voucher đã hết hạn.' };
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        return { valid: false, error: 'Voucher đã hết lượt sử dụng.' };
    }

    // Check target user
    if (voucher.target_user_id && voucher.target_user_id !== userId) {
        return { valid: false, error: 'Voucher này không dành cho bạn.' };
    }

    // Check minimum order
    if (voucher.min_order && subtotal < voucher.min_order) {
        return {
            valid: false,
            error: `Đơn hàng cần tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.min_order)}đ.`
        };
    }

    // Check target category
    if (voucher.target_category) {
        const hasValidCategory = cartItems.some(item => item.category === voucher.target_category);
        if (!hasValidCategory) {
            return {
                valid: false,
                error: `Voucher chỉ áp dụng cho danh mục "${voucher.target_category}".`
            };
        }
    }

    return { valid: true, voucher };
};

// Increment usage count after order
export const incrementVoucherUsage = async (code) => {
    const voucher = await getVoucherByCode(code);
    if (!voucher) return;

    await supabase
        .from('vouchers')
        .update({ used_count: (voucher.used_count || 0) + 1 })
        .eq('id', voucher.id);
};

// Calculate discount amount
export const calculateDiscount = (voucher, subtotal, shippingFee = 0) => {
    if (!voucher) return 0;

    let discount = 0;

    if (voucher.type === 'percent') {
        discount = Math.floor((subtotal * voucher.value) / 100);
        if (voucher.max_discount) {
            discount = Math.min(discount, voucher.max_discount);
        }
    } else if (voucher.type === 'fixed') {
        // Special case for freeship vouchers
        if (voucher.code.includes('FREESHIP')) {
            discount = Math.min(voucher.value, shippingFee);
        } else {
            discount = voucher.value;
        }
    }

    return discount;
};

// Save voucher to user's inventory (redeemed_vouchers)
export const saveVoucherToInventory = async (userId, voucherCode) => {
    // Generate unique code with suffix
    const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uniqueCode = `${voucherCode}_${codeSuffix}`;

    const { data, error } = await supabase
        .from('redeemed_vouchers')
        .insert([{
            user_id: userId,
            voucher_code: uniqueCode,
            original_code: voucherCode,
            redeemed_at: new Date().toISOString(),
            is_used: false
        }])
        .select()
        .single();

    if (error) {
        console.error('Error saving voucher:', error);
        throw error;
    }
    return data;
};

// Get list of original voucher codes user has already saved
export const getUserSavedVoucherCodes = async (userId) => {
    const { data, error } = await supabase
        .from('redeemed_vouchers')
        .select('original_code, voucher_code')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user saved vouchers:', error);
        return [];
    }
    // Return array of original codes (base codes like GIAM30K, not the unique suffix versions)
    return data?.map(v => v.original_code || v.voucher_code.split('_')[0]) || [];
};
