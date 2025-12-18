import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
	const context = useContext(WishlistContext);
	if (!context) {
		throw new Error('useWishlist must be used within a WishlistProvider');
	}
	return context;
};

export const WishlistProvider = ({ children }) => {
	const { user } = useAuth();
	const [wishlistItems, setWishlistItems] = useState([]);
	const [loading, setLoading] = useState(false);

	// Load wishlist from Supabase for logged-in users only
	useEffect(() => {
		const loadWishlist = async () => {
			if (user) {
				// Fetch from Supabase
				setLoading(true);
				try {
					const { data, error } = await supabase
						.from('wishlists')
						.select(`
              id,
              product_id,
              created_at,
              products (
                id,
                name,
                price,
                sale_price,
                image,
                category,
                discount
              )
            `)
						.eq('user_id', user.id)
						.order('created_at', { ascending: false });

					if (error) {
						console.error('Error fetching wishlist:', error);
					} else {
						// Transform data to include product details
						const items = (data || []).map(item => ({
							id: item.id,
							product_id: item.product_id,
							created_at: item.created_at,
							...item.products
						}));
						setWishlistItems(items);
					}
				} catch (err) {
					console.error('Wishlist load error:', err);
				} finally {
					setLoading(false);
				}
			} else {
				// Clear wishlist on logout
				setWishlistItems([]);
				localStorage.removeItem('wishlist_items');
			}
		};

		loadWishlist();
	}, [user]);

	// Sync to localStorage whenever wishlist changes
	useEffect(() => {
		localStorage.setItem('wishlist_items', JSON.stringify(wishlistItems));
	}, [wishlistItems]);

	const addToWishlist = async (product) => {
		// Require login
		if (!user) {
			toast({
				title: "Cần đăng nhập",
				description: "Vui lòng đăng nhập để lưu sản phẩm yêu thích.",
				variant: "destructive"
			});
			return;
		}

		// Check if already in wishlist
		if (isInWishlist(product.id)) {
			toast({
				title: "Đã có trong yêu thích",
				description: "Sản phẩm này đã có trong danh sách yêu thích của bạn."
			});
			return;
		}

		const newItem = {
			id: `local_${Date.now()}`,
			product_id: product.id,
			created_at: new Date().toISOString(),
			...product
		};

		// Optimistic update
    setWishlistItems(prev => [newItem, ...prev]);

    if (user) {
      try {
        const { data, error } = await supabase
          .from('wishlists')
          .upsert({
            user_id: user.id,
            product_id: product.id
          }, { onConflict: 'user_id,product_id' })
          .select('id')
          .single();

        if (error) {
          console.error('Error adding to wishlist:', error);
          // Keep the local item even if Supabase fails
        } else if (data) {
          // Update with real ID from database
          setWishlistItems(prev =>
            prev.map(item =>
              item.product_id === product.id ? { ...item, id: data.id } : item
            )
          );
        }
      } catch (err) {
        console.error('Wishlist add error:', err);
      }
    }

    toast({
      title: "Đã thêm vào yêu thích ❤️",
      description: product.name
    });
  };

  const removeFromWishlist = async (productId) => {
    const item = wishlistItems.find(i => i.product_id === productId || i.id === productId);

		// Optimistic update
		setWishlistItems(prev => prev.filter(i => i.product_id !== productId && i.id !== productId));

		if (user && item && !item.id.toString().startsWith('local_')) {
			try {
				await supabase
					.from('wishlists')
					.delete()
					.eq('id', item.id);
			} catch (err) {
				console.error('Wishlist remove error:', err);
			}
		}

		toast({
			title: "Đã xóa khỏi yêu thích",
			variant: "default"
		});
	};

	const toggleWishlist = (product) => {
		if (isInWishlist(product.id)) {
			removeFromWishlist(product.id);
		} else {
			addToWishlist(product);
		}
	};

	const isInWishlist = (productId) => {
		return wishlistItems.some(item => item.product_id === productId || item.id === productId);
	};

	const clearWishlist = async () => {
		setWishlistItems([]);
		localStorage.removeItem('wishlist_items');

		if (user) {
			try {
				await supabase
					.from('wishlists')
					.delete()
					.eq('user_id', user.id);
			} catch (err) {
				console.error('Clear wishlist error:', err);
			}
		}
	};

	const getWishlistCount = () => wishlistItems.length;

	return (
		<WishlistContext.Provider value={{
			wishlistItems,
			loading,
			addToWishlist,
			removeFromWishlist,
			toggleWishlist,
			isInWishlist,
			clearWishlist,
			getWishlistCount
		}}>
			{children}
		</WishlistContext.Provider>
	);
};

export default WishlistContext;