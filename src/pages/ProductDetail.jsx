import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShoppingCart, Minus, Plus, Check, Truck, ShieldCheck, Home, Zap } from 'lucide-react';
import { getProductById, getRelatedProducts } from '@/services/productService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import StarRating from "@/components/StarRating";
import ReviewsSection from '@/components/ReviewsSection';
import { getReviewStats } from '@/services/reviewService';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });
  const [relatedProducts, setRelatedProducts] = useState([]);

  const { toast } = useToast();
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoadingProduct(true);
      try {
        const prod = await getProductById(id);
        setProduct(prod);

        // Fetch other data in parallel to avoid waterfall if possible, or sequentially if dependent
        const stats = await getReviewStats(id);
        setReviewStats(stats);

        if (prod) {
          const related = await getRelatedProducts(prod.category, id);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Failed to fetch product details", error);
      } finally {
        setLoadingProduct(false);
      }
    };

    if (id) {
      fetchData();
      window.scrollTo(0, 0);
    }
  }, [id]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập để mua sắm.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    addToCart(product, quantity);
  };

  if (loadingProduct) {
    return <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950"><div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div></div>
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950 text-foreground dark:text-gray-200">Sản phẩm không tồn tại.</div>;
  }

  return (
    <div className="min-h-screen pb-32 lg:pb-20 bg-background dark:bg-slate-950 transition-colors duration-300">
      <Helmet>
        <title>{`${product.name} - ChipChip Minimart`}</title>
        <meta name="description" content={product.description} />
      </Helmet>

      {/* Breadcrumb Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur border-b border-white/50 dark:border-slate-800">
        <div className="container-custom py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-yellow-600 dark:hover:text-yellow-400 flex items-center gap-1 font-medium"><Home className="w-3.5 h-3.5" /> Trang chủ</Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <Link to="/products" className="hover:text-yellow-600 dark:hover:text-yellow-400 font-medium">Sản phẩm</Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-900 dark:text-gray-200 font-bold truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 bg-white dark:bg-slate-900 p-6 md:p-10 lg:p-12 rounded-[3rem] shadow-sm border border-white/60 dark:border-slate-800">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-slate-700 flex items-center justify-center p-8 shadow-inner">
              <picture>
                <source srcSet={`${product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e'}?format=webp`} type="image/webp" />
                <motion.img
                  key={product.image}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-lg will-change-transform"
                  src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e'}
                  alt={product.name}
                  width="600"
                  height="600"
                />
              </picture>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col justify-center"
          >
            <span className="text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider text-xs mb-4 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-1.5 rounded-full w-fit shadow-sm">{product.category}</span>
            <h1 className="text-3xl md:text-5xl font-display text-gray-900 dark:text-gray-100 mb-4 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-4 mb-8">
              <StarRating rating={reviewStats.avg} className="gap-1" />
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{reviewStats.count} đánh giá</span>
            </div>

            <div className="mb-8">
              {product.sale_price && product.price && product.sale_price < product.price && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg text-gray-400 dark:text-gray-500 line-through font-medium">
                    {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                  </span>
                  {product.discount && product.discount > 0 && (
                    <div className="bg-yellow-400 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-md">
                      <Zap className="w-4 h-4 text-red-600 fill-red-600" />
                      <span className="text-sm font-bold text-red-600">-{product.discount}%</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-end gap-3">
                <span className="text-5xl lg:text-6xl font-display text-orange-600 dark:text-orange-400 tracking-tight">
                  {new Intl.NumberFormat('vi-VN').format(product.sale_price || product.price)}đ
                </span>
                {product.unit && <span className="text-xl text-gray-400 dark:text-gray-500 font-medium mb-3">/ {product.unit}</span>}
              </div>
            </div>

            <div className="prose prose-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
              <p>{product.description || "Sản phẩm tươi ngon, được tuyển chọn kỹ lưỡng từ những nhà cung cấp uy tín nhất. Đảm bảo vệ sinh an toàn thực phẩm, mang lại bữa ăn ngon miệng cho gia đình bạn."}</p>
            </div>

            {/* Action Box - Desktop */}
            <div className="hidden md:block bg-yellow-50/50 dark:bg-yellow-900/10 p-8 rounded-[2rem] border border-yellow-100 dark:border-yellow-900/20 mb-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center border border-white dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl h-16 w-full sm:w-auto shadow-sm">
                  <button onClick={() => handleQuantityChange(-1)} className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-bold text-xl text-gray-800 dark:text-gray-200">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)} className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <Button
                  size="lg"
                  className="flex-1 h-16 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-white dark:text-yellow-950 text-lg font-bold shadow-xl shadow-yellow-400/30 btn-hover-effect"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 w-6 h-6" />
                  Thêm vào giỏ hàng
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Check, text: "100% Tự nhiên", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
                { icon: Truck, text: "Giao trong 2h", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
                { icon: ShieldCheck, text: "Đổi trả miễn phí", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
              ].map((item, idx) => (
                <div key={idx} className={`flex flex-col items-center text-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700`}>
                  <div className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="mt-10">
          <ReviewsSection productId={product.id} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-10 w-2 bg-yellow-400 rounded-full"></div>
              <h2 className="text-3xl font-display text-gray-900 dark:text-gray-100">Có thể bạn sẽ thích</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {relatedProducts.map((relatedProduct, idx) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ProductCard product={relatedProduct} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-none z-40 md:hidden flex items-center gap-4 pb-6">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng tiền:</span>
          <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price * quantity)}
          </span>
        </div>
        <div className="flex-1 flex gap-3 h-12">
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl px-2 w-24 justify-between">
            <button onClick={() => handleQuantityChange(-1)} className="w-8 h-full flex items-center justify-center text-gray-900 dark:text-gray-100"><Minus className="w-4 h-4" /></button>
            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{quantity}</span>
            <button onClick={() => handleQuantityChange(1)} className="w-8 h-full flex items-center justify-center text-gray-900 dark:text-gray-100"><Plus className="w-4 h-4" /></button>
          </div>
          <Button onClick={handleAddToCart} className="flex-1 rounded-xl bg-yellow-400 text-white dark:text-yellow-950 font-bold shadow-lg shadow-yellow-400/30">
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;