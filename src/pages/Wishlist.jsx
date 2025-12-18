import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist, loading } = useWishlist();
    const { addToCart } = useCart();
    const { user } = useAuth();

    const handleMoveToCart = (item) => {
        if (!user) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để thêm vào giỏ hàng.",
                variant: "destructive"
            });
            return;
        }
        addToCart(item, 1);
        removeFromWishlist(item.product_id);
        toast({
            title: "Đã chuyển vào giỏ hàng",
            description: item.name
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30 dark:bg-black/20 py-8 lg:py-12">
            <Helmet>
                <title>Sản phẩm yêu thích - ChipChip Minimart</title>
            </Helmet>

            <div className="container-custom">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/products">
                        <Button variant="ghost" className="w-10 h-10 rounded-full bg-card dark:bg-slate-800 p-0 hover:bg-muted border border-border">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                            Sản phẩm yêu thích
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {wishlistItems.length} sản phẩm
                        </p>
                    </div>
                </div>

                {wishlistItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 bg-card dark:bg-slate-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800"
                    >
                        <div className="w-32 h-32 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                            <Heart className="w-12 h-12 text-red-200 dark:text-red-800" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-foreground mb-2">
                            Chưa có sản phẩm yêu thích
                        </h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-center mb-6">
                            Hãy thêm sản phẩm yêu thích để xem lại sau và mua sắm dễ dàng hơn.
                        </p>
                        <Link to="/products">
                            <Button className="rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold">
                                Khám phá sản phẩm
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {wishlistItems.map((item, index) => (
                                <motion.div
                                    key={item.id || item.product_id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, x: -50 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group bg-card dark:bg-slate-900 rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all overflow-hidden"
                                >
                                    {/* Image */}
                                    <Link to={`/product/${item.product_id || item.id}`}>
                                        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 p-6">
                                            <img
                                                src={item.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'}
                                                alt={item.name}
                                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-110"
                                                loading="lazy"
                                            />

                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    removeFromWishlist(item.product_id || item.id);
                                                }}
                                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-md"
                                            >
                                                <Heart className="w-5 h-5 fill-current" />
                                            </button>

                                            {/* Discount Badge */}
                                            {item.discount && item.discount > 0 && (
                                                <div className="absolute top-4 left-4 bg-yellow-400 rounded-lg px-2 py-1 flex items-center gap-1 shadow">
                                                    <span className="text-xs font-bold text-red-600">-{item.discount}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="p-5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                                            {item.category}
                                        </span>

                                        <Link to={`/product/${item.product_id || item.id}`}>
                                            <h3 className="font-bold text-foreground mt-2 mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                                {item.name}
                                            </h3>
                                        </Link>

                                        <div className="flex items-baseline gap-2 mb-4">
                                            {item.sale_price && item.price && item.sale_price < item.price && (
                                                <span className="text-sm text-gray-400 line-through">
                                                    {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                                                </span>
                                            )}
                                            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                {new Intl.NumberFormat('vi-VN').format(item.sale_price || item.price)}đ
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleMoveToCart(item)}
                                                className="flex-1 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold h-11"
                                            >
                                                <ShoppingBag className="w-4 h-4 mr-2" />
                                                Thêm vào giỏ
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeFromWishlist(item.product_id || item.id)}
                                                className="rounded-xl h-11 w-11 border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
