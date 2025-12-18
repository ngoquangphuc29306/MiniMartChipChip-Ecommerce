import { supabase } from '@/lib/customSupabaseClient';

export const getProducts = async ({ category, searchQuery, sortOrder = 'default' }) => {
  let query = supabase.from('products').select(`
    id, name, price, category, image, sale_price, discount
  `);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  // Sorting logic for price
  if (sortOrder === 'price-asc') {
    query = query.order('price', { ascending: true });
  } else if (sortOrder === 'price-desc') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  // Fetch average ratings for all products
  const productIds = data.map(p => p.id);

  let ratingsMap = {};
  if (productIds.length > 0) {
    const { data: reviews, error: reviewError } = await supabase
      .from('product_reviews')
      .select('product_id, rating');

    if (!reviewError && reviews) {
      // Calculate average rating per product
      const ratingData = {};
      reviews.forEach(r => {
        if (!ratingData[r.product_id]) {
          ratingData[r.product_id] = { sum: 0, count: 0 };
        }
        ratingData[r.product_id].sum += r.rating;
        ratingData[r.product_id].count += 1;
      });

      Object.keys(ratingData).forEach(pid => {
        ratingsMap[pid] = {
          avg_rating: ratingData[pid].sum / ratingData[pid].count,
          review_count: ratingData[pid].count
        };
      });
    }
  }

  // Calculate discount and add rating info
  return data.map(product => {
    if (!product.discount && product.sale_price && product.price && product.sale_price < product.price) {
      product.discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
    }

    // Add rating data
    const ratingInfo = ratingsMap[product.id] || { avg_rating: 0, review_count: 0 };
    product.avg_rating = ratingInfo.avg_rating;
    product.review_count = ratingInfo.review_count;

    return product;
  });
};

export const searchProducts = async (searchQuery) => {
  if (!searchQuery) return [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, sale_price, image, category, description')
      .ilike('name', `%${searchQuery}%`)
      .limit(15);

    if (error) {
      console.error('Error searching products:', error);
      return []; // Return empty array instead of throwing
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error in searchProducts:', error);
    return []; // Return empty array on any error
  }
};

export const getFeaturedProducts = async () => {
  const { data: products, error } = await supabase
    .from('products')
    .select(`
            id, name, price, category, image, sale_price, discount
        `)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }

  // Calculate discount if not present but sale_price exists
  return products.map(product => {
    if (!product.discount && product.sale_price && product.price && product.sale_price < product.price) {
      product.discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
    }
    return product;
  });
};

export const getProductById = async (id) => {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (productError) {
    console.error('Error fetching product:', productError);
    throw productError;
  }

  // Calculate discount if not present but sale_price exists
  if (!product.discount && product.sale_price && product.price && product.sale_price < product.price) {
    product.discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
  }

  return product;
};

export const getRelatedProducts = async (category, currentProductId) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, category, image, sale_price, discount')
    .eq('category', category)
    .neq('id', currentProductId)
    .limit(4);

  if (error) {
    console.error('Error fetching related products:', error);
    throw error;
  }

  // Calculate discount if not present but sale_price exists
  return data.map(product => {
    if (!product.discount && product.sale_price && product.price && product.sale_price < product.price) {
      product.discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
    }
    return product;
  });
};

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('category');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
  return uniqueCategories.sort();
};

// --- ADMIN CRUD FUNCTIONS ---

export const adminAddProduct = async (productData) => {
  // Remove null/undefined values that might cause issues
  const cleanData = Object.fromEntries(
    Object.entries(productData).filter(([_, v]) => v !== undefined && v !== null)
  );

  let { data, error } = await supabase
    .from('products')
    .insert([cleanData])
    .select()
    .single();

  // If error related to discount column, try without it
  if (error && (error.message?.includes('discount') || error.code === '42703')) {
    console.warn('Discount column may not exist, retrying without discount field');
    const { discount, ...dataWithoutDiscount } = cleanData;
    const retryData = Object.fromEntries(
      Object.entries(dataWithoutDiscount).filter(([_, v]) => v !== undefined && v !== null)
    );

    const retryResult = await supabase
      .from('products')
      .insert([retryData])
      .select()
      .single();

    if (retryResult.error) {
      console.error('Supabase insert error (retry):', retryResult.error);
      throw retryResult.error;
    }
    return retryResult.data;
  }

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }
  return data;
};

export const adminUpdateProduct = async (id, productData) => {
  // IMPORTANT: Keep null values for discount and sale_price to allow clearing them
  // Only remove undefined values, but keep null values
  const cleanData = {};

  Object.entries(productData).forEach(([key, value]) => {
    // Keep null values (they are needed to clear discount/sale_price)
    // Only skip undefined values
    if (value !== undefined) {
      cleanData[key] = value;
    }
  });

  console.log('Updating product with data:', cleanData); // Debug log

  let { data, error } = await supabase
    .from('products')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  // If error related to discount column, try without it
  if (error && (error.message?.includes('discount') || error.code === '42703')) {
    console.warn('Discount column may not exist, retrying without discount field');
    const { discount, sale_price, ...dataWithoutDiscount } = cleanData;
    const retryData = {};

    Object.entries(dataWithoutDiscount).forEach(([key, value]) => {
      if (value !== undefined) {
        retryData[key] = value;
      }
    });

    const retryResult = await supabase
      .from('products')
      .update(retryData)
      .eq('id', id)
      .select()
      .single();

    if (retryResult.error) {
      console.error('Supabase update error (retry):', retryResult.error);
      throw retryResult.error;
    }
    return retryResult.data;
  }

  if (error) {
    console.error('Supabase update error:', error);
    throw error;
  }
  return data;
};

export const adminDeleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const adminGetAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};