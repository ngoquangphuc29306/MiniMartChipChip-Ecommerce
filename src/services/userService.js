import { supabase } from '@/lib/customSupabaseClient';

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
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('is_active', true)
    .eq('is_public', true)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`);

  if (error) {
    console.error('Error fetching public vouchers:', error);
    return [];
  }
  return data || [];
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

  // Check per-user usage limit
  if (voucher.usage_limit && userId) {
    const { count, error } = await supabase
      .from('used_vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('voucher_code', `${code}%`);

    if (!error && count >= voucher.usage_limit) {
      return { valid: false, error: `Bạn đã sử dụng voucher này ${voucher.usage_limit} lần.` };
    }
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
  // Check target category - ALL items must match
  if (voucher.target_category) {
    const allMatch = cartItems.every(item => item.category === voucher.target_category);
    if (!allMatch) {
      return {
        valid: false,
        error: `Voucher chỉ áp dụng khi tất cả sản phẩm thuộc danh mục "${voucher.target_category}". Vui lòng xóa sản phẩm khác danh mục.`
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
  // First fetch voucher details
  const { data: voucher, error: voucherError } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', voucherCode)
    .eq('is_active', true)
    .single();

  if (voucherError || !voucher) {
    throw new Error('Voucher không tồn tại hoặc không khả dụng');
  }

  // Check if voucher is expired
  if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) {
    throw new Error('Voucher đã hết hạn sử dụng');
  }

  // Check if user has exhausted their usage limit for this voucher
  if (voucher.usage_limit) {
    const { count, error: countError } = await supabase
      .from('used_vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('voucher_code', `${voucherCode}%`);

    if (!countError && count >= voucher.usage_limit) {
      throw new Error(`Bạn đã sử dụng hết ${voucher.usage_limit} lượt cho voucher này`);
    }
  }

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
      is_used: false,
      // Save voucher details for display
      description: voucher.description,
      type: voucher.type,
      value: voucher.value,
      min_order: voucher.min_order,
      target_category: voucher.target_category,
      valid_until: voucher.valid_until,
      icon: voucher.icon,
      remaining_uses: voucher.usage_limit || 1  // Default 1 use if not set
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

// Get list of voucher codes that user has exhausted all uses for
// These vouchers should NOT be saveable again
export const getUserExhaustedVoucherCodes = async (userId) => {
  // Get all vouchers with usage_limit
  const { data: vouchers, error: voucherError } = await supabase
    .from('vouchers')
    .select('code, usage_limit')
    .eq('is_active', true)
    .not('usage_limit', 'is', null);

  if (voucherError || !vouchers) {
    console.error('Error fetching vouchers:', voucherError);
    return [];
  }

  // Get user's usage count for each voucher from used_vouchers
  const { data: usedVouchers, error: usedError } = await supabase
    .from('used_vouchers')
    .select('voucher_code')
    .eq('user_id', userId);

  if (usedError) {
    console.error('Error fetching used vouchers:', usedError);
    return [];
  }

  // Count usage per base code
  const usageCount = {};
  (usedVouchers || []).forEach(u => {
    const baseCode = u.voucher_code.split('_')[0];
    usageCount[baseCode] = (usageCount[baseCode] || 0) + 1;
  });

  // Find vouchers where user has used all their allowed uses
  const exhaustedCodes = vouchers
    .filter(v => usageCount[v.code] && usageCount[v.code] >= v.usage_limit)
    .map(v => v.code);

  return exhaustedCodes;
};

// Cleanup expired vouchers from all users' inventories
// AND cleanup vouchers that user has exhausted
export const cleanupExpiredVouchersFromInventory = async (userId = null) => {
  const now = new Date().toISOString();

  // 1. Delete expired vouchers from redeemed_vouchers
  // Join with vouchers table to check valid_until
  const { data: expiredVouchers, error: fetchError } = await supabase
    .from('redeemed_vouchers')
    .select(`
            id,
            original_code,
            valid_until,
            user_id
        `);

  if (fetchError) {
    console.error('Error fetching redeemed vouchers for cleanup:', fetchError);
    return;
  }

  // Filter expired ones
  const expiredIds = (expiredVouchers || [])
    .filter(v => v.valid_until && new Date(v.valid_until) < new Date(now))
    .map(v => v.id);

  if (expiredIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('redeemed_vouchers')
      .delete()
      .in('id', expiredIds);

    if (deleteError) {
      console.error('Error deleting expired vouchers:', deleteError);
    } else {
      console.log(`Cleaned up ${expiredIds.length} expired vouchers from inventories`);
    }
  }

  // 2. If userId provided, also cleanup vouchers that user has exhausted
  if (userId) {
    const exhaustedCodes = await getUserExhaustedVoucherCodes(userId);

    if (exhaustedCodes.length > 0) {
      const { error: deleteExhaustedError } = await supabase
        .from('redeemed_vouchers')
        .delete()
        .eq('user_id', userId)
        .in('original_code', exhaustedCodes);

      if (deleteExhaustedError) {
        console.error('Error deleting exhausted vouchers:', deleteExhaustedError);
      } else {
        console.log(`Cleaned up exhausted vouchers for user:`, exhaustedCodes);
      }
    }
  }
};