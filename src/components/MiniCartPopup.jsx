import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, X, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const MiniCartPopup = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = getTotalPrice();
  const displayItems = cartItems.slice(0, 3);
  const remainingCount = Math.max(0, cartItems.length - 3);

  const handleCheckout = () => {
    onClose();
    if (user) {
      navigate('/cart?step=checkout');
    } else {
      navigate('/login?redirect=/cart');
    }
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-yellow-500" />
                Giỏ hàng ({cartItems.length})
              </h3>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Content */}
            {cartItems.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Giỏ hàng trống</p>
                <Button
                  onClick={() => { onClose(); navigate('/products'); }}
                  className="w-full rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold"
                >
                  Mua sắm ngay
                </Button>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="max-h-64 overflow-y-auto p-3 space-y-2">
                  {displayItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-lg p-1 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                            {new Intl.NumberFormat('vi-VN').format(item.sale_price || item.price)}đ
                          </span>
                          <span className="text-gray-400">x{item.quantity}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.cart_item_id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {remainingCount > 0 && (
                    <p className="text-xs text-center text-gray-400 py-2">
                      + {remainingCount} sản phẩm khác
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tổng cộng:</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {new Intl.NumberFormat('vi-VN').format(total)}đ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleViewCart}
                      className="rounded-xl font-bold border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Xem giỏ hàng
                    </Button>
                    <Button
                      onClick={handleCheckout}
                      className="rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold"
                    >
                      Thanh toán
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MiniCartPopup;
