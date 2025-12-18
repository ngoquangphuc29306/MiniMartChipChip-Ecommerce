import { supabase } from '@/lib/customSupabaseClient';

export const getReviewsByProductId = async (productId) => {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id,
      profiles ( full_name )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
  return data;
};

export const addReview = async (reviewData) => {
  // Check if user already reviewed
  const { data: existing, error: checkError } = await supabase
    .from('product_reviews')
    .select('id')
    .eq('product_id', reviewData.product_id)
    .eq('user_id', reviewData.user_id)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing review:', checkError);
  }

  if (existing) {
    throw new Error('Bạn đã đánh giá sản phẩm này rồi.');
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .insert([reviewData])
    .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        profiles ( full_name )
    `)
    .single();

  if (error) {
    console.error('Error adding review:', error);
    throw new Error(error.message || 'Không thể gửi đánh giá.');
  }

  return data;
};

export const updateReview = async (reviewId, updates) => {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', reviewId)
    .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        profiles ( full_name )
    `)
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw error;
  }
  return data;
};

export const deleteReview = async (reviewId) => {
  const { error } = await supabase
    .from('product_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const getReviewStats = async (productId) => {
  const { data, error } = await supabase
    .rpc('get_product_review_stats', { p_id: productId });

  if (error) {
    console.error('Error fetching review stats:', error);
    return { avg_rating: 0, review_count: 0 };
  }

  return data && data.length > 0
    ? { avg_rating: Number(data[0].avg_rating), review_count: Number(data[0].review_count) }
    : { avg_rating: 0, review_count: 0 };
};