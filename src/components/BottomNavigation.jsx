import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

const BottomNavigation = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const { user } = useAuth();

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const navItems = [
    { to: '/', icon: Home, label: 'Trang chủ' },
    { to: '/products', icon: Search, label: 'Tìm kiếm' },
    { to: '/cart', icon: ShoppingCart, label: 'Giỏ hàng', badge: cartItemCount },
    { to: '/wishlist', icon: Heart, label: 'Yêu thích', badge: wishlistCount },
    { to: user ? '/account' : '/login', icon: User, label: 'Tài khoản' },
  ];

  // Hide on certain pages
  const hiddenPaths = ['/login', '/register', '/reset-password'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <div className="relative">
                <motion.div
                  className={`p-2 rounded-xl transition-colors ${isActive
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : ''
                    }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${isActive
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-400 dark:text-gray-500'
                      }`}
                    fill={isActive && item.icon === Heart ? 'currentColor' : 'none'}
                  />
                </motion.div>

                {/* Badge */}
                {item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </motion.span>
                )}
              </div>

              <span
                className={`text-[10px] font-medium mt-0.5 transition-colors ${isActive
                  ? 'text-yellow-600 dark:text-yellow-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500'
                  }`}
              >
                {item.label}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -bottom-0 w-1 h-1 bg-yellow-500 rounded-full"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
