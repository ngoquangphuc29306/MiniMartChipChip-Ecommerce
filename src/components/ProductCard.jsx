import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Eye, Star, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { getReviewStats } from '@/services/reviewService';
import { motion } from 'framer-motion';

// Skeleton Component
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-card dark:bg-slate-900 rounded-[2rem] border border-border shadow-sm h-full flex flex-col overflow-hidden p-4">
      <div className="relative aspect-[4/3] bg-muted rounded-3xl animate-pulse mb-4" />
      <div className="flex-grow flex flex-col space-y-3">
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
        <div className="mt-auto pt-3 flex items-end justify-between border-t border-dashed border-border">
          <div className="flex flex-col gap-1">
            <div className="h-3 w-10 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// Quick View Modal Content
const ProductQuickView = ({ product, onAddToCart }) => (
  <div className="grid md:grid-cols-2 gap-8 p-2">
    <div className="bg-yellow-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center p-6">
      <picture>
        <source srcSet={`${product.image}?format=webp`} type="image/webp" />
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
          loading="lazy"
          decoding="async"
          width="400"
          height="400"
        />
      </picture>
    </div>
    <div className="flex flex-col justify-center">
      <div className="mb-4">
        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-lg uppercase tracking-wide">{product.category}</span>
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mt-2 mb-1">{product.name}</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed line-clamp-3">{product.description || "Sản phẩm tươi ngon chất lượng cao từ ChipChip Minimart."}</p>
      <div className="mt-auto">
        <div className="flex items-baseline gap-2 mb-4 flex-wrap">
          {product.sale_price && product.price && product.sale_price < product.price && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-400 line-through font-medium">
                {new Intl.NumberFormat('vi-VN').format(product.price)}đ
              </span>
              {product.discount && product.discount > 0 && (
                <div className="bg-yellow-400 rounded-lg px-2 py-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-red-600 fill-red-600" />
                  <span className="text-xs font-bold text-red-600">-{product.discount}%</span>
                </div>
              )}
            </div>
          )}
          <span className="text-3xl font-display font-bold text-orange-600 dark:text-orange-400">
            {new Intl.NumberFormat('vi-VN').format(product.sale_price || product.price)}đ
          </span>
        </div>
        <div className="flex gap-3">
          <Button onClick={onAddToCart} className="flex-1 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold h-12 shadow-lg shadow-yellow-400/30">
            Thêm vào giỏ
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-2xl h-12 px-6 border-2 dark:border-gray-700">
              Đóng
            </Button>
          </DialogClose>
        </div>
      </div>
    </div>
  </div>
);

const ProductCard = memo(({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState({ avg: 0, count: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const inWishlist = isInWishlist(product.id);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await getReviewStats(product.id);
        if (isMounted) {
          setStats({ avg: data.avg_rating, count: data.review_count });
        }
      } catch (err) {
        // Silent error
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, [product.id]);

  const handleAddToCart = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập để mua sắm.",
        variant: "destructive"
      });
      return;
    }

    addToCart(product, 1);
  };

  const handleToggleWishlist = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <motion.div
      className="group relative bg-card dark:bg-slate-900 rounded-[2rem] border border-border shadow-sm hover:shadow-2xl hover:shadow-yellow-100/50 dark:hover:shadow-none transition-all duration-300 h-full flex flex-col overflow-hidden hover:border-yellow-200 dark:hover:border-yellow-900/50 z-0 gpu-accelerated"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        y: isHovered ? -8 : 0,
        scale: isHovered ? 1.02 : 1
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Wishlist Button */}
      <motion.button
        onClick={handleToggleWishlist}
        className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${inWishlist
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700'
          }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHovered || inWishlist ? 1 : 0,
          scale: isHovered || inWishlist ? 1 : 0.8
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
        aria-label={inWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
      >
        <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
      </motion.button>

      {/* Quick View Trigger - Desktop Only */}
      <motion.div
        className="hidden md:block absolute top-16 right-4 z-20"
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : 20
        }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Xem nhanh"
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-md text-gray-600 dark:text-gray-300 hover:text-yellow-600 hover:bg-white dark:hover:bg-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl rounded-[2.5rem] border-none p-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
            <ProductQuickView product={product} onAddToCart={handleAddToCart} />
          </DialogContent>
        </Dialog>
      </motion.div>

      <Link to={`/product/${product.id}`} className="flex flex-col h-full" aria-label={`Xem chi tiết ${product.name}`}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 overflow-hidden p-6 rounded-t-[2rem]">
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? 2 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full h-full"
          >
            <picture>
              <source
                srcSet={`${product.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'}?format=webp`}
                type="image/webp"
              />
              <img
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-sm will-change-transform"
                alt={product.name}
                src={product.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'}
                loading="lazy"
                decoding="async"
                width="300"
                height="300"
              />
            </picture>
          </motion.div>

          {/* Badge */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/20 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/20">{product.category}</span>
            {product.discount && product.discount > 0 && (
              <motion.div
                className="bg-yellow-400 rounded-lg px-2 py-1 flex items-center gap-1 shadow-lg"
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Zap className="w-3 h-3 text-red-600 fill-red-600" />
                <span className="text-xs font-bold text-red-600">-{product.discount}%</span>
              </motion.div>
            )}
          </div>

          {/* Slide-up Button Overlay */}
          <motion.div
            className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white/90 via-white/60 to-transparent dark:from-slate-900/90 dark:via-slate-900/60 pt-8"
            initial={{ y: "100%" }}
            animate={{ y: isHovered ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Button
              className="w-full rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white shadow-lg font-bold h-11"
              onClick={handleAddToCart}
              aria-label={`Thêm ${product.name} vào giỏ`}
            >
              <Plus className="w-5 h-5 mr-1" /> Thêm nhanh
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-5 flex-grow flex flex-col bg-card dark:bg-slate-900 relative z-10">

          {/* Dynamic Rating */}
          <div className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{stats.avg > 0 ? stats.avg.toFixed(1) : 'New'}</span>
            {stats.count > 0 && <span className="text-xs text-gray-400">({stats.count})</span>}
          </div>

          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-yellow-600 transition-colors text-base leading-tight">
            {product.name}
          </h3>

          <div className="mt-auto pt-4 flex items-end justify-between border-t border-dashed border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-1">
              {product.sale_price && product.price && product.sale_price < product.price && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold line-through">
                    {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                  </span>
                  {product.discount && product.discount > 0 && (
                    <div className="bg-yellow-400 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-red-600 fill-red-600" />
                      <span className="text-[10px] font-bold text-red-600">-{product.discount}%</span>
                    </div>
                  )}
                </div>
              )}
              <span className="text-lg font-display font-bold text-orange-600 dark:text-orange-400">
                {new Intl.NumberFormat('vi-VN').format(product.sale_price || product.price)}đ
              </span>
            </div>
            <motion.div
              className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 shadow-sm"
              animate={{
                backgroundColor: isHovered ? '#facc15' : '#f9fafb',
                color: isHovered ? '#ffffff' : '#9ca3af',
                boxShadow: isHovered ? '0 10px 25px -5px rgba(250, 204, 21, 0.4)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
              transition={{ duration: 0.3 }}
            >
              <ShoppingBag className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

export default ProductCard;
