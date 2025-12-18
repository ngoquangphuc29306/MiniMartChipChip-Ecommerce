import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as cartService from '@/services/cartService';
import { toast } from '@/components/ui/use-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await cartService.getCartItems();
      setCartItems(items);
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tải giỏ hàng.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, quantity) => {
    if (!user) {
      toast({ title: "Yêu cầu đăng nhập", description: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ.", variant: "destructive" });
      return;
    }
    if (!quantity || quantity <= 0) {
      quantity = 1;
    }
    try {
      await cartService.addToCart(product.id, quantity);
      await fetchCart(); // Refresh cart
      toast({ title: "Thành công", description: `${product.name} đã được thêm vào giỏ hàng.` });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể thêm sản phẩm vào giỏ.", variant: "destructive" });
    }
  };

  // Updated to use optimistic updates (no loading)
  const updateQuantity = async (cartItemId, quantity) => {
    // If quantity is 0 or less, remove the item
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    // Optimistic update - update UI immediately
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cart_item_id === cartItemId
          ? { ...item, quantity: quantity }
          : item
      )
    );

    // Then sync with server in background
    try {
      await cartService.updateCartQuantity(cartItemId, quantity);
    } catch (error) {
      // Revert on error
      await fetchCart();
      toast({ title: "Lỗi", description: "Không thể cập nhật số lượng.", variant: "destructive" });
    }
  };

  // Updated to use cartItemId
  const removeFromCart = async (cartItemId) => {
    try {
      await cartService.removeFromCart(cartItemId);
      await fetchCart();
      toast({ title: "Đã xóa", description: `Sản phẩm đã được xóa khỏi giỏ hàng.` });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa sản phẩm.", variant: "destructive" });
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await fetchCart();
    } catch (error) {
      console.error("Failed to clear cart", error);
      toast({ title: "Lỗi", description: "Không thể làm trống giỏ hàng.", variant: "destructive" });
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.sale_price || item.price) * item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};