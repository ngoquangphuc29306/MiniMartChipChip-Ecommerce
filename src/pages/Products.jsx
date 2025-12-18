import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { getProducts, getCategories } from '@/services/productService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  ShoppingBag,
  Leaf,
  Coffee,
  Utensils,
  Milk,
  Package,
  Archive,
  Home,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Star
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";

// Category Color Map
const CATEGORY_COLORS = {
  'Rau củ quả': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  'Thịt, cá, hải sản': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  'Sữa & trứng': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  'Đồ ăn lạnh': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
  'Đồ ăn vặt': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  'Đồ uống': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  'Thực phẩm khô': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  'Thực phẩm đóng hộp': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
  'Gia vị': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  'Lương thực': { bg: 'bg-stone-100 dark:bg-stone-900/30', text: 'text-stone-700 dark:text-stone-400', border: 'border-stone-200 dark:border-stone-800' },
  'Sản phẩm gia dụng': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
};

const getCategoryColors = (category) => {
  return CATEGORY_COLORS[category] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' };
};

// Mapping category to icons
const getCategoryIcon = (category) => {
  const lower = category.toLowerCase();
  if (lower.includes('rau') || lower.includes('quả')) return <Leaf className="w-4 h-4" />;
  if (lower.includes('thịt') || lower.includes('cá') || lower.includes('hải sản')) return <Utensils className="w-4 h-4" />;
  if (lower.includes('sữa') || lower.includes('trứng')) return <Milk className="w-4 h-4" />;
  if (lower.includes('uống')) return <Coffee className="w-4 h-4" />;
  if (lower.includes('khô') || lower.includes('lương thực')) return <Package className="w-4 h-4" />;
  if (lower.includes('đóng hộp') || lower.includes('gia vị')) return <Archive className="w-4 h-4" />;
  if (lower.includes('gia dụng')) return <Home className="w-4 h-4" />;
  return <ShoppingBag className="w-4 h-4" />;
};

// Shimmer Skeleton Component
const ShimmerSkeleton = ({ className }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent animate-shimmer" />
  </div>
);

// Enhanced Product Card Skeleton with Shimmer
const EnhancedProductCardSkeleton = ({ viewMode = 'grid' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 overflow-hidden ${viewMode === 'list' ? 'flex gap-4' : ''}`}>
    <ShimmerSkeleton className={`bg-gray-200 dark:bg-slate-800 ${viewMode === 'list' ? 'w-32 h-32 rounded-l-[2rem]' : 'aspect-square'}`} />
    <div className={`p-4 space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
      <ShimmerSkeleton className="h-3 w-16 bg-gray-200 dark:bg-slate-800 rounded-full" />
      <ShimmerSkeleton className="h-4 w-3/4 bg-gray-200 dark:bg-slate-800 rounded" />
      <ShimmerSkeleton className="h-4 w-1/2 bg-gray-200 dark:bg-slate-800 rounded" />
      <div className="flex gap-2">
        <ShimmerSkeleton className="h-8 flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  </div>
);

// List View Product Card
const ProductListCard = ({ product }) => {
  const colors = getCategoryColors(product.category);

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex gap-4 hover:shadow-lg transition-all">
        {/* Image */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gray-50 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Category Tag with Color */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {getCategoryIcon(product.category)}
              {product.category}
            </span>

            <h3 className="font-bold text-foreground mt-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            {product.avg_rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-500">{product.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({product.review_count || 0})</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              {product.sale_price && product.sale_price < product.price && (
                <span className="text-xs text-gray-400 line-through">
                  {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                </span>
              )}
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {new Intl.NumberFormat('vi-VN').format(product.sale_price || product.price)}đ
              </span>
            </div>

            {product.discount && product.discount > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                -{product.discount}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- SUB-COMPONENTS (Moved outside to prevent re-renders) ---
const FilterContent = ({ categories, selectedCategory, handleCategoryChange, priceRange, setPriceRange, ratingFilter, setRatingFilter }) => (
  <div className="space-y-8">
    {/* Categories with Colors */}
    <div>
      <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 text-lg mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-yellow-500" /> Danh mục
      </h3>
      <div className="space-y-1">
        <button
          onClick={() => handleCategoryChange('all')}
          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between group ${selectedCategory === 'all' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
        >
          <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Tất cả sản phẩm</span>
          {selectedCategory === 'all' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
        </button>
        {categories.map((cat) => {
          const colors = getCategoryColors(cat);
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between group ${selectedCategory === cat ? `${colors.bg} ${colors.text}` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
            >
              <span className="flex items-center gap-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                {getCategoryIcon(cat)} {cat}
              </span>
              {selectedCategory === cat && <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-').split(' ')[0]}`} />}
            </button>
          );
        })}
      </div>
    </div>

    <div className="h-px bg-gray-100 dark:bg-gray-800" />

    {/* Rating Filter */}
    <div>
      <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 text-lg mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" /> Đánh giá
      </h3>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${ratingFilter === rating
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{rating} sao</span>
            {ratingFilter === rating && <div className="w-2 h-2 rounded-full bg-yellow-500 ml-auto" />}
          </button>
        ))}
      </div>
    </div>

    <div className="h-px bg-gray-100 dark:bg-gray-800" />

    {/* Price Range */}
    <div>
      <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 text-lg mb-4">Khoảng giá</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Input
          type="number"
          placeholder="Từ"
          value={priceRange.min}
          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
          className="rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-yellow-400 dark:text-white"
        />
        <Input
          type="number"
          placeholder="Đến"
          value={priceRange.max}
          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
          className="rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-yellow-400 dark:text-white"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {[{ l: '< 50k', max: 50000 }, { l: '50k - 200k', min: 50000, max: 200000 }, { l: '> 200k', min: 200000 }].map((range, idx) => (
          <button
            key={idx}
            onClick={() => setPriceRange({ min: range.min || '', max: range.max || '' })}
            className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-400 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold transition-colors"
          >
            {range.l}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [ratingFilter, setRatingFilter] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [saleFilter, setSaleFilter] = useState(false); // Flash Sale filter

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'list' ? 12 : 9;

  // Data
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Initial Data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts({ category: 'all', searchQuery: '', sortOrder: 'default' })
        ]);
        setCategories(cats);
        setAllProducts(prods);
      } catch (error) {
        console.error("Failed to init products page", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Sync URL Params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    const searchFromUrl = searchParams.get('search') || '';
    const saleFromUrl = searchParams.get('sale') === 'true';

    setSelectedCategory(categoryFromUrl);
    setSearchTerm(searchFromUrl);
    setSaleFilter(saleFromUrl);
  }, [searchParams]);

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 0. Flash Sale Filter - Only show discounted products
    if (saleFilter) {
      result = result.filter(p =>
        (p.sale_price && p.sale_price < p.price) ||
        (p.discount && p.discount > 0)
      );
    }

    // 1. Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 2. Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerTerm));
    }

    // 3. Price Range
    if (priceRange.min !== '') {
      result = result.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      result = result.filter(p => p.price <= Number(priceRange.max));
    }

    // 4. Rating Filter - Show products with rating in range [X, X+1)
    if (ratingFilter > 0) {
      result = result.filter(p => {
        const avgRating = p.avg_rating || 0;
        const reviewCount = p.review_count || 0;
        // Only show products that have reviews AND rating in the selected range
        if (reviewCount === 0) return false;

        if (ratingFilter === 5) {
          // 5 stars = exactly 5.0
          return avgRating >= 5;
        } else {
          // X stars = rating from X to X+0.99
          return avgRating >= ratingFilter && avgRating < ratingFilter + 1;
        }
      });
    }

    // 5. Sorting
    if (sortOrder === 'price-asc') {
      result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    } else if (sortOrder === 'price-desc') {
      result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [allProducts, selectedCategory, searchTerm, priceRange, ratingFilter, sortOrder, saleFilter]);

  // --- HANDLERS ---
  const handleCategoryChange = (category) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setPriceRange({ min: '', max: '' });
    setRatingFilter(0);
    setSortOrder('default');
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-black/20 pb-20">
      <Helmet>
        <title>Sản phẩm - Minimart ChipChip</title>
      </Helmet>

      {/* Shimmer Animation Styles */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      {/* --- HERO BANNER --- */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 pt-8 pb-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1">Siêu thị Online</div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
                Tất cả sản phẩm
              </h1>
            </div>

            {/* Active Filters Summary (Chips) */}
            <div className="flex flex-wrap gap-2 items-center">
              {searchTerm && (
                <div className="inline-flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-100 dark:border-yellow-800">
                  Tìm: "{searchTerm}" <button onClick={() => { setSearchTerm(''); setSearchParams(prev => { prev.delete('search'); return prev; }) }}><X className="w-3 h-3" /></button>
                </div>
              )}
              {selectedCategory !== 'all' && (
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${getCategoryColors(selectedCategory).bg} ${getCategoryColors(selectedCategory).text} ${getCategoryColors(selectedCategory).border}`}>
                  {selectedCategory} <button onClick={() => handleCategoryChange('all')}><X className="w-3 h-3" /></button>
                </div>
              )}
              {ratingFilter > 0 && (
                <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-800">
                  {ratingFilter}+ ⭐ <button onClick={() => setRatingFilter(0)}><X className="w-3 h-3" /></button>
                </div>
              )}
              {(priceRange.min || priceRange.max) && (
                <div className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-bold border border-green-100 dark:border-green-800">
                  Giá: {priceRange.min ? `${priceRange.min / 1000}k` : '0'} - {priceRange.max ? `${priceRange.max / 1000}k` : '∞'} <button onClick={() => setPriceRange({ min: '', max: '' })}><X className="w-3 h-3" /></button>
                </div>
              )}

              {(searchTerm || selectedCategory !== 'all' || priceRange.min || priceRange.max || ratingFilter > 0) && (
                <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:underline px-2">Xóa tất cả</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* --- SIDEBAR (Desktop Only) --- */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl flex items-center gap-2 text-foreground">
                  <SlidersHorizontal className="w-5 h-5" /> Bộ lọc
                </h2>
              </div>
              <FilterContent
                categories={categories}
                selectedCategory={selectedCategory}
                handleCategoryChange={handleCategoryChange}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                ratingFilter={ratingFilter}
                setRatingFilter={setRatingFilter}
              />
            </div>
          </div>

          {/* --- MAIN CONTENT --- */}
          <div className="lg:col-span-3">
            {/* Toolbar (Mobile Filter, View Toggle & Sort) */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Mobile Filter Trigger */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-gray-200 dark:border-gray-700 h-10 gap-2 font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900">
                      <Filter className="w-4 h-4" /> Bộ lọc
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="rounded-r-[3rem] w-[320px] bg-white dark:bg-slate-900 border-r dark:border-slate-800 p-0 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 pr-4 mr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
                      <SheetHeader className="text-left mb-6">
                        <SheetTitle className="font-display text-2xl">Lọc sản phẩm</SheetTitle>
                        <SheetDescription>Tìm kiếm sản phẩm phù hợp với nhu cầu.</SheetDescription>
                      </SheetHeader>
                      <FilterContent
                        categories={categories}
                        selectedCategory={selectedCategory}
                        handleCategoryChange={handleCategoryChange}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        ratingFilter={ratingFilter}
                        setRatingFilter={setRatingFilter}
                      />
                      <SheetFooter className="mt-8 pb-Safe">
                        <SheetClose asChild>
                          <Button className="w-full bg-yellow-400 text-white font-bold rounded-xl h-12">Xem kết quả</Button>
                        </SheetClose>
                      </SheetFooter>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Xem dạng lưới"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Xem dạng danh sách"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 text-sm font-medium text-gray-500 text-right">
                {filteredProducts.length} sản phẩm
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 hidden sm:inline-block">Sắp xếp:</span>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[160px] h-10 rounded-xl border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 focus:ring-yellow-400">
                    <SelectValue placeholder="Mặc định" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Mới nhất</SelectItem>
                    <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                    <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid/List */}
            <div className="min-h-[600px]">
              {loading ? (
                <ProductGridSkeleton count={6} viewMode={viewMode} />
              ) : currentProducts.length > 0 ? (
                <>
                  <motion.div
                    layout
                    className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6' : 'space-y-4'}
                  >
                    <AnimatePresence mode="popLayout">
                      {currentProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          {viewMode === 'grid' ? (
                            <ProductCard product={product} />
                          ) : (
                            <ProductListCard product={product} />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center mt-12 space-y-4">
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 disabled:opacity-30"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <div className="flex items-center px-2 gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${currentPage === page
                                ? 'bg-yellow-400 text-white shadow-md shadow-yellow-200 dark:shadow-none'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 disabled:opacity-30"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">
                        Đang xem trang {currentPage} trên tổng số {totalPages}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
                  <div className="w-32 h-32 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-12 h-12 text-yellow-300 dark:text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="rounded-xl border-2 font-bold dark:border-gray-700">
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
