import { supabase } from '@/lib/customSupabaseClient';

export const getCartItems = async () => {
  // Use getSession instead of getUser to avoid 403 errors
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];
  const user = session.user;

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
            *,
            products (
                id, name, price, sale_price, image, description, category
            )
        `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }); // Ensure stable order

  if (error) {
    console.error('Error fetching cart items:', error);
    throw error;
  }

  // Transform data to match context structure
  return data.map(item => ({
    ...item.products,
    quantity: item.quantity,
    cart_item_id: item.id // Primary key of the cart_item
  }));
};

export const addToCart = async (productId, quantity) => {
  // Use getSession instead of getUser to avoid 403 errors
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User not logged in');
  const user = session.user;

  // Check if item already exists
  const { data: existingItem, error: fetchError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existingItem) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);
    if (error) throw error;
    return data;
  } else {
    // Insert new item
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{ user_id: user.id, product_id: productId, quantity: quantity }]);
    if (error) throw error;
    return data;
  }
};

export const updateCartQuantity = async (cartItemId, quantity) => {
  // Use getSession instead of getUser to avoid 403 errors
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User not logged in');
  const user = session.user;

  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  // Update by cart_item_id (PK) to be precise
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .eq('user_id', user.id); // Safety check for ownership

  if (error) throw error;
  return data;
};

export const removeFromCart = async (cartItemId) => {
  // Use getSession instead of getUser to avoid 403 errors
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User not logged in');
  const user = session.user;

  // Delete by cart_item_id (PK)
  const { data, error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', user.id); // Safety check for ownership

  if (error) throw error;
  return data;
};

export const clearCart = async () => {
  // Use getSession instead of getUser to avoid 403 errors
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User not logged in');
  const user = session.user;

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
};