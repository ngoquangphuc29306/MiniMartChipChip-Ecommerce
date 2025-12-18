import React, { useState, useEffect, memo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Leaf, Ticket, Bookmark, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { getFeaturedProducts, getCategories } from '@/services/productService';
import { getPublicVouchers, saveVoucherToInventory, getUserSavedVoucherCodes, getUserExhaustedVoucherCodes, cleanupExpiredVouchersFromInventory } from '@/services/userService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

// New Components
import HeroCarousel from '@/components/HeroCarousel';
import TestimonialsSection from '@/components/TestimonialsSection';

// Mapping category names to specific icons
const CATEGORY_IMAGES = {
    'Đồ ăn lạnh': 'https://sv2.anhsieuviet.com/2025/11/24/do_an_lanh.png',
    'Đồ ăn vặt': 'https://sv2.anhsieuviet.com/2025/11/24/do_an_vat.png',
    'Đồ uống': 'https://sv2.anhsieuviet.com/2025/11/24/do_uong.png',
    'Thực phẩm khô': 'https://sv2.anhsieuviet.com/2025/11/24/thuc_pham_kho.png',
    'Thực phẩm đóng hộp': 'https://sv2.anhsieuviet.com/2025/11/24/thuc_pham_dong_hop.png',
    'Gia vị': 'https://sv2.anhsieuviet.com/2025/11/24/gia_vi.png',
    'Lương thực': 'https://sv2.anhsieuviet.com/2025/11/24/luong_thuc.png',
    'Sản phẩm gia dụng': 'https://sv2.anhsieuviet.com/2025/11/24/san_pham_gia_dung.png',
};

const DEFAULT_CATEGORY_IMAGE = 'https://cdn-icons-png.flaticon.com/128/3756/3756577.png';

// Memoized Category Card to prevent re-renders
const CategoryCard = memo(({ category }) => (
    <Link to={`/products?category=${category}`} className="flex flex-col items-center gap-3 group min-w-[100px] max-w-[120px]">
        <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 border border-yellow-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:bg-yellow-50 dark:group-hover:bg-slate-700 transition-all duration-300 gpu-accelerated">
            <picture>
                <source srcSet={`${CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGE}?format=webp`} type="image/webp" />
                <img
                    src={CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGE}
                    alt={category}
                    className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110 will-change-transform"
                    loading="lazy"
                    decoding="async"
                    width="48"
                    height="48"
                />
            </picture>
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 text-center capitalize leading-tight px-1">{category}</span>
    </Link>
));

const Home = () => {
    const { user } = useAuth();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [publicVouchers, setPublicVouchers] = useState([]);
    const [savedVoucherCodes, setSavedVoucherCodes] = useState([]);
    const [exhaustedVoucherCodes, setExhaustedVoucherCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingCode, setSavingCode] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [products, cats, vouchers] = await Promise.all([
                    getFeaturedProducts(),
                    getCategories(),
                    getPublicVouchers()
                ]);
                setFeaturedProducts(products);
                setCategories(cats);
                setPublicVouchers(vouchers || []);
            } catch (error) {
                console.error("Failed to load home data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch saved voucher codes and exhausted codes when user is logged in
    useEffect(() => {
        if (user) {
            cleanupExpiredVouchersFromInventory(user.id);
            getUserSavedVoucherCodes(user.id).then(codes => setSavedVoucherCodes(codes));
            getUserExhaustedVoucherCodes(user.id).then(codes => setExhaustedVoucherCodes(codes));
        }
    }, [user]);

    const handleSaveVoucher = async (code) => {
        if (!user) {
            toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để lưu voucher.", variant: "destructive" });
            return;
        }

        if (savedVoucherCodes.includes(code)) {
            toast({ title: "Đã lưu", description: "Voucher này đã có trong kho của bạn." });
            return;
        }

        if (exhaustedVoucherCodes.includes(code)) {
            toast({ title: "Không thể lưu", description: "Bạn đã sử dụng hết lượt cho voucher này.", variant: "destructive" });
            return;
        }

        setSavingCode(code);
        try {
            await saveVoucherToInventory(user.id, code);
            setSavedVoucherCodes(prev => [...prev, code]);
            toast({ title: "Đã lưu!", description: "Voucher đã được thêm vào kho của bạn." });
        } catch (e) {
            toast({ title: "Lỗi", description: e.message || "Không thể lưu voucher. Vui lòng thử lại.", variant: "destructive" });
        } finally {
            setSavingCode(null);
        }
    };

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <Helmet>
                <title>Trang chủ - Minimart ChipChip</title>
            </Helmet>

            {/* Hero Carousel */}
            <HeroCarousel />

            {/* Categories */}
            <section className="py-12 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <div className="container-custom">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-10 text-foreground">Danh mục sản phẩm</h2>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-10">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <div key={i} className="w-20 h-20 bg-muted rounded-full animate-pulse" />)
                        ) : (
                            categories.map(cat => <CategoryCard key={cat} category={cat} />)
                        )}
                    </div>
                </div>
            </section>

            {/* Public Vouchers */}
            {publicVouchers.length > 0 && (
                <section className="py-12 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
                    <div className="container-custom">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center">
                                <Ticket className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Ưu đãi đang chờ bạn</h2>
                                <p className="text-sm text-gray-500">Sử dụng ngay tại giỏ hàng</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {publicVouchers.slice(0, 6).map(v => (
                                <div key={v.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-yellow-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-lg transition-all relative overflow-hidden group">
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-50 dark:bg-slate-900 rounded-full"></div>
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-50 dark:bg-slate-900 rounded-full"></div>
                                    <div className="text-4xl">{v.icon || '🎁'}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-foreground">{v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(v.value)}đ`}</p>
                                        <p className="text-sm text-gray-500 line-clamp-1">{v.description}</p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                            {v.min_order && <span className="text-xs text-gray-400">Đơn từ {new Intl.NumberFormat('vi-VN').format(v.min_order)}đ</span>}
                                            {v.target_category && <span className="text-xs text-blue-500 font-medium">📦 {v.target_category}</span>}
                                            {v.valid_until && <span className="text-xs text-orange-500">⏰ HSD: {new Date(v.valid_until).toLocaleDateString('vi-VN')}</span>}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={savedVoucherCodes.includes(v.code) || exhaustedVoucherCodes.includes(v.code) ? "ghost" : "outline"}
                                        className={`rounded-xl font-bold flex-shrink-0 ${exhaustedVoucherCodes.includes(v.code)
                                            ? 'text-red-400 cursor-not-allowed'
                                            : savedVoucherCodes.includes(v.code)
                                                ? 'text-gray-400 cursor-default'
                                                : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50'
                                            }`}
                                        onClick={() => handleSaveVoucher(v.code)}
                                        disabled={savedVoucherCodes.includes(v.code) || exhaustedVoucherCodes.includes(v.code) || savingCode === v.code}
                                    >
                                        {savingCode === v.code
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : exhaustedVoucherCodes.includes(v.code)
                                                ? <>Hết lượt</>
                                                : savedVoucherCodes.includes(v.code)
                                                    ? <><Check className="w-4 h-4 mr-1" /> Đã lưu</>
                                                    : <><Bookmark className="w-4 h-4 mr-1" /> Lưu</>
                                        }
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Products */}
            <section className="py-16 md:py-24">
                <div className="container-custom">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <span className="text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-widest text-xs">Sản phẩm nổi bật</span>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-2">Món ngon mỗi ngày</h2>
                        </div>
                        <Link to="/products">
                            <Button variant="ghost" className="hidden md:flex text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-bold">
                                Xem tất cả <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {loading ? (
                            [1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)
                        ) : (
                            featuredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        )}
                    </div>

                    <div className="mt-10 text-center md:hidden">
                        <Link to="/products">
                            <Button className="w-full rounded-xl bg-card border-2 border-yellow-400 text-yellow-600 font-bold h-12">
                                Xem tất cả sản phẩm
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <TestimonialsSection />

            {/* Banner Promo */}
            <section className="py-10">
                <div className="container-custom">
                    <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-600 dark:to-orange-700 shadow-2xl shadow-orange-200/50 dark:shadow-none px-6 py-12 md:px-16 md:py-20 flex items-center justify-between">
                        <div className="relative z-10 max-w-lg text-white space-y-4">
                            <h2 className="text-3xl md:text-5xl font-display font-bold">Ưu đãi thành viên</h2>
                            <p className="text-yellow-50 text-lg font-medium">Đăng ký ngay để nhận voucher giảm giá và tích điểm đổi quà hấp dẫn!</p>
                            <div className="pt-4">
                                <Link to="/register">
                                    <Button className="bg-white text-orange-600 hover:bg-yellow-50 rounded-xl h-12 px-8 font-bold shadow-lg border-0">
                                        Đăng ký ngay
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="absolute right-0 bottom-0 w-1/2 h-full hidden md:block">
                            <img
                                src="https://bizweb.dktcdn.net/100/517/390/collections/sale-2.png?v=1751516458907"
                                className="w-full h-full object-contain object-bottom opacity-95 gpu-accelerated animate-float"
                                alt="Basket of Fresh Groceries"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
