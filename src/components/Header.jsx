import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Coins, Sparkles, Sun, Moon, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useWishlist } from '@/context/WishlistContext';
import { useDebounce } from '@/hooks/useDebounce';
import { searchProducts } from '@/services/productService';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MiniCartPopup from '@/components/MiniCartPopup';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const cartControls = useAnimation();

  const isResetPasswordPage = location.pathname === '/reset-password';
  const showUserUI = user && !isResetPasswordPage;

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchQuery.length > 1) {
        try {
          const results = await searchProducts(debouncedSearchQuery);
          setSuggestions(results);
          setIsSuggestionsOpen(true);
        } catch (error) {
          console.error("Failed to fetch search suggestions", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (cartItems.length > 0) {
      cartControls.start({
        rotate: [0, -15, 15, -15, 15, 0],
        scale: [1, 1.3, 1],
        transition: { duration: 0.6, type: "spring" }
      });
    }
  }, [cartItems, cartControls]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  if (isResetPasswordPage) {
    return null;
  }

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setIsMenuOpen(false);
      setIsSuggestionsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = () => {
    setIsSuggestionsOpen(false);
    setSearchQuery('');
    setIsMenuOpen(false);
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const navLinks = [
    { to: "/", text: "Trang chủ" },
    { to: "/products", text: "Sản phẩm" },
    { to: "/contact", text: "Liên hệ" },
  ];

  return (
    <header className={`glass-nav sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'py-2 shadow-lg shadow-yellow-100/20 dark:shadow-none' : 'py-4'}`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="Trang chủ ChipChip">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[1.2rem] flex items-center justify-center shadow-colored group-hover:rotate-12 transition-transform duration-300 border-2 border-white/20">
              <img src="https://horizons-cdn.hostinger.com/9ee84389-1925-41dd-a3e7-6d8a37fcb695/b9b4d3e3ba41b2e5db3158624a392a6e.png" alt="Logo" className="w-full h-full object-cover rounded-[1rem]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-display font-bold tracking-tight text-gray-800 dark:text-gray-100 leading-none group-hover:text-yellow-600 transition-colors">
                ChipChip
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-yellow-600 uppercase">Minimart</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/50 dark:bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/60 dark:border-white/10 shadow-sm">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-6 py-2.5 rounded-full text-sm font-bold font-body transition-all duration-300 relative overflow-hidden ${location.pathname === link.to
                  ? 'text-white shadow-md shadow-yellow-400/40'
                  : 'text-gray-600 dark:text-gray-300 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                  }`}
              >
                {location.pathname === link.to && (
                  <motion.div layoutId="nav-pill" className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 z-[-1]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                <span className="relative z-10">{link.text}</span>
              </Link>
            ))}
          </nav>

          {/* Icons & Search */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all border border-transparent hover:border-yellow-200 dark:hover:border-yellow-800"
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </motion.div>
            </Button>

            {/* Desktop Search */}
            <div ref={searchRef} className="hidden md:block relative z-50">
              <form onSubmit={handleSearchSubmit} className="relative group">
                <input
                  type="text"
                  placeholder="Tìm món ngon..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setIsSuggestionsOpen(true) }}
                  className="w-48 focus:w-72 pl-11 pr-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 border border-transparent focus:border-yellow-300 rounded-full text-sm font-medium outline-none transition-all duration-300 placeholder:text-gray-400 focus:shadow-lg focus:shadow-yellow-100/50 dark:focus:shadow-none text-gray-700 dark:text-gray-200"
                  aria-label="Tìm kiếm sản phẩm"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-yellow-500 transition-colors" />
              </form>

              <AnimatePresence>
                {isSuggestionsOpen && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-4 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-yellow-900/10 border border-white/50 dark:border-gray-700 overflow-hidden p-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-600 px-4 py-3 uppercase tracking-wider bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl mb-1">
                      <Sparkles className="w-3 h-3" /> Gợi ý cho bạn
                    </div>
                    <ul className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                      {suggestions.map(product => (
                        <li key={product.id}>
                          <Link to={`/product/${product.id}`} onClick={handleSuggestionClick} className="flex items-center gap-3 p-3 hover:bg-yellow-50 dark:hover:bg-gray-800 rounded-2xl transition-colors group">
                            <div className="w-12 h-12 bg-white rounded-xl p-1 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                              <img src={product.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'} alt={product.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-700 dark:text-gray-200 text-sm group-hover:text-yellow-700 truncate transition-colors">{product.name}</p>
                              <p className="text-yellow-600 text-xs font-bold mt-0.5">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              {/* Wishlist */}
              <Link to="/wishlist" aria-label="Yêu thích" className="hidden sm:block">
                <Button variant="ghost" size="icon" aria-label="Yêu thích" className="relative w-11 h-11 rounded-full bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-500 border border-gray-100 dark:border-gray-700 hover:border-red-200 transition-all shadow-sm">
                  <Heart className="w-5 h-5" />
                  <AnimatePresence>
                    {wishlistCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                      >
                        {wishlistCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </Link>

              {/* Cart with Mini Popup */}
              <div
                className="relative hidden sm:block"
                onMouseEnter={() => setIsMiniCartOpen(true)}
                onMouseLeave={() => setIsMiniCartOpen(false)}
              >
                <Link to="/cart" aria-label="Giỏ hàng">
                  <Button variant="ghost" size="icon" aria-label="Giỏ hàng" className="relative w-11 h-11 rounded-full bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-yellow-600 border border-gray-100 dark:border-gray-700 hover:border-yellow-200 transition-all shadow-sm group">
                    <motion.div animate={cartControls}>
                      <ShoppingCart className="w-5 h-5 group-hover:fill-yellow-100" />
                    </motion.div>
                    <AnimatePresence>
                      {cartItemCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          key={cartItemCount}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm"
                        >
                          {cartItemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </Link>
                <MiniCartPopup isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
              </div>

              {/* Cart - Mobile only */}
              <Link to="/cart" aria-label="Giỏ hàng" className="sm:hidden">
                <Button variant="ghost" size="icon" aria-label="Giỏ hàng" className="relative w-11 h-11 rounded-full bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-yellow-600 border border-gray-100 dark:border-gray-700 hover:border-yellow-200 transition-all shadow-sm group">
                  <motion.div animate={cartControls}>
                    <ShoppingCart className="w-5 h-5 group-hover:fill-yellow-100" />
                  </motion.div>
                  <AnimatePresence>
                    {cartItemCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        key={cartItemCount}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm"
                      >
                        {cartItemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </Link>

              {showUserUI ? (
                <Link to="/account" className="flex items-center gap-2 pl-1 pr-1 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all group" aria-label="Tài khoản">
                  <div className="hidden sm:flex flex-col items-end mr-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 line-clamp-1 max-w-[100px] group-hover:text-yellow-600 transition-colors">{profile?.full_name || 'Chào bạn'}</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                      <Coins className="w-3 h-3 fill-yellow-400" />
                      <span>{profile?.points || 0}</span>
                    </div>
                  </div>
                  {/* Avatar or fallback icon */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 border-2 border-white dark:border-gray-700 shadow-sm flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
                    )}
                  </div>
                </Link>
              ) : (
                <Link to="/login" aria-label="Đăng nhập">
                  <Button variant="ghost" size="icon" aria-label="Đăng nhập" className="w-11 h-11 rounded-full bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-yellow-600 border border-gray-100 dark:border-gray-700 hover:border-yellow-200 transition-all shadow-sm">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              )}

              <Button variant="ghost" size="icon" aria-label="Menu" className="lg:hidden w-11 h-11 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 shadow-sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 overflow-hidden absolute w-full shadow-xl rounded-b-[2rem]"
          >
            <div className="container-custom py-6 space-y-6">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Tìm món ngon..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-black focus:border-yellow-400 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/20 font-medium transition-all dark:text-white"
                  aria-label="Tìm kiếm sản phẩm (mobile)"
                />
                <button type="submit" aria-label="Gửi tìm kiếm" className="absolute right-5 top-1/2 -translate-y-1/2 text-yellow-500 p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Search className="w-5 h-5" />
                </button>
              </form>

              <nav className="flex flex-col gap-2">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-lg font-display font-bold py-4 px-6 rounded-2xl flex items-center justify-between transition-all ${location.pathname === link.to
                      ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.text}
                    {location.pathname === link.to && <Sparkles className="w-5 h-5 text-white/80" />}
                  </Link>
                ))}

                {/* Wishlist Link - Mobile */}
                <Link
                  to="/wishlist"
                  className="text-lg font-display font-bold py-4 px-6 rounded-2xl flex items-center justify-between text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-5 h-5" /> Yêu thích
                  </span>
                  {wishlistCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{wishlistCount}</span>
                  )}
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
