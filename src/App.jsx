
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProductProvider } from '@/context/ProductContext';
import { ChatBotProvider } from '@/context/ChatBotContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { WishlistProvider } from '@/context/WishlistContext';

// Lazy load pages for Code Splitting
const Home = React.lazy(() => import('@/pages/Home'));
const Products = React.lazy(() => import('@/pages/Products'));
const ProductDetail = React.lazy(() => import('@/pages/ProductDetail'));
const Cart = React.lazy(() => import('@/pages/Cart'));
const Account = React.lazy(() => import('@/pages/Account'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));
const About = React.lazy(() => import('@/pages/About'));
const HelpCenter = React.lazy(() => import('@/pages/HelpCenter'));
const Support = React.lazy(() => import('@/pages/Support'));
const ShippingPolicy = React.lazy(() => import('@/pages/ShippingPolicy'));
const ReturnPolicy = React.lazy(() => import('@/pages/ReturnPolicy'));
const PrivacyPolicy = React.lazy(() => import('@/pages/PrivacyPolicy'));
const Wishlist = React.lazy(() => import('@/pages/Wishlist'));

// ⭐ Scroll to top khi đổi route
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

// Loading Fallback Component
const PageLoader = () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                <AuthProvider>
                    <WishlistProvider>
                        <ProductProvider>
                            <CartProvider>
                                <ChatBotProvider>
                                    <Router>

                                        {/* ⭐ Đặt ScrollToTop ngay sau Router */}
                                        <ScrollToTop />

                                        <Helmet>
                                            <title>Minimart ChipChip - Siêu thị mini trực tuyến</title>
                                            <meta
                                                name="description"
                                                content="Minimart ChipChip - Mua sắm thực phẩm tươi sống, đồ gia dụng chất lượng cao với giá tốt nhất"
                                            />
                                        </Helmet>

                                        <Layout>
                                            <Suspense fallback={<PageLoader />}>
                                                <Routes>
                                                    <Route path="/" element={<Home />} />
                                                    <Route path="/products" element={<Products />} />
                                                    <Route path="/product/:id" element={<ProductDetail />} />
                                                    <Route path="/cart" element={<Cart />} />
                                                    <Route path="/account" element={<Account />} />
                                                    <Route path="/contact" element={<Contact />} />
                                                    <Route path="/login" element={<Login />} />
                                                    <Route path="/register" element={<Register />} />
                                                    <Route path="/reset-password" element={<ResetPassword />} />
                                                    <Route path="/wishlist" element={<Wishlist />} />

                                                    {/* New Pages */}
                                                    <Route path="/about" element={<About />} />
                                                    <Route path="/help" element={<HelpCenter />} />
                                                    <Route path="/support" element={<Support />} />
                                                    <Route path="/shipping-policy" element={<ShippingPolicy />} />
                                                    <Route path="/return-policy" element={<ReturnPolicy />} />
                                                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                                </Routes>
                                            </Suspense>
                                        </Layout>

                                        <Toaster />
                                    </Router>
                                </ChatBotProvider>
                            </CartProvider>
                        </ProductProvider>
                    </WishlistProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;

