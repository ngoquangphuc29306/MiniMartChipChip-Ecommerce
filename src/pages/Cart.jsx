
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, ShieldCheck, Loader2, MapPin, Phone, User, CheckCircle2, Banknote, Truck, Check, ChevronRight, Ticket, Coins, X, Copy, Sparkles, AlertCircle, ChevronDown, Contact, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createOrder } from '@/services/orderService';
import { updateProfile } from '@/services/profileService';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchProvinces, fetchDistrictsAndWards, filterWardsByDistrict } from '@/services/locationService';
import { triggerConfetti } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { getPublicVouchers, getVoucherByCode, validateVoucher, calculateDiscount } from '@/services/userService';
import { getRelatedProducts } from '@/services/productService';
import { getUserTier, calculateTierDiscount, checkFreeShipping, getTierColors, addPointsForOrder } from '@/services/loyaltyService';
import MockPaymentModal from '@/components/WelcomeMessage';

// Progress Steps Component
const CheckoutProgress = ({ step }) => {
  const steps = [
    { id: 1, label: 'Giỏ hàng', icon: ShoppingBag },
    { id: 2, label: 'Thanh toán', icon: CreditCard },
    { id: 3, label: 'Hoàn tất', icon: CheckCircle2 },
  ];

  return (
    <div className="flex justify-center mb-10">
      <div className="flex items-center w-full max-w-lg relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -z-10 -translate-y-1/2 rounded-full"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-yellow-400 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((s, i) => {
          const isActive = step >= s.id;
          const isCurrent = step === s.id;

          return (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-2 relative">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${isActive ? 'bg-yellow-400 border-white dark:border-slate-900 shadow-lg shadow-yellow-400/40 text-white' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600'}`}
              >
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold transition-colors ${isCurrent ? 'text-yellow-600 dark:text-yellow-400' : isActive ? 'text-gray-800 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// Vouchers are now fetched from database

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, loading, clearCart } = useCart();
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();

  // State
  const [currentStep, setCurrentStep] = useState(1); // 1: Cart, 2: Checkout, 3: Success
  const [isProcessing, setIsProcessing] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lastOrderDetails, setLastOrderDetails] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '', // This will serve as "Specific Address" (Street, House No.)
    note: '',
    paymentMethod: 'cod'
  });

  // --- LOCATION STATES ---
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  // We need to store raw ward data for the current province to filter by district later
  const [rawProvinceWards, setRawProvinceWards] = useState([]);

  // Loading States
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState({
    province: null,
    district: null,
    ward: null
  });

  // --- SAVED ADDRESSES ---
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // --- PAYMENT MODAL ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // --- RECOMMENDED PRODUCTS ---
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Fetch recommended products based on cart items
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (cartItems.length === 0) {
        setRecommendedProducts([]);
        return;
      }

      // Get unique categories from cart
      const categories = [...new Set(cartItems.map(item => item.category).filter(Boolean))];
      const cartItemIds = cartItems.map(item => item.id);

      try {
        // Fetch related products for the first category
        if (categories.length > 0) {
          const related = await getRelatedProducts(categories[0], cartItemIds[0]);
          // Filter out items already in cart
          const filtered = related.filter(p => !cartItemIds.includes(p.id));
          setRecommendedProducts(filtered.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [cartItems]);

  // Parse saved addresses from profile
  useEffect(() => {
    if (profile?.address) {
      try {
        if (typeof profile.address === 'string' && profile.address.startsWith('[')) {
          const parsed = JSON.parse(profile.address);
          if (Array.isArray(parsed)) {
            setSavedAddresses(parsed);
          }
        }
      } catch (e) {
        console.error('Error parsing saved addresses:', e);
        setSavedAddresses([]);
      }
    }
  }, [profile?.address]);

  // Handle selecting a saved address
  const handleSelectSavedAddress = (addr) => {
    setCheckoutForm(prev => ({
      ...prev,
      name: addr.full_name || prev.name,
      phone: addr.phone || prev.phone,
      address: addr.address || ''
    }));
    // Reset location dropdowns since saved addresses don't include province/district/ward codes
    setSelectedLocation({ province: null, district: null, ward: null });
    setIsAddressDialogOpen(false);
    toast({
      title: "Đã chọn địa chỉ",
      description: "Thông tin địa chỉ đã được điền vào form."
    });
  };

  // Prefill info
  useEffect(() => {
    if (profile) {
      let address = '';
      try {
        if (profile.address && typeof profile.address === 'string' && profile.address.startsWith('[')) {
          const addrList = JSON.parse(profile.address);
          if (addrList.length > 0) address = addrList[0].address;
        } else {
          address = profile.address || '';
        }
      } catch (e) {
        address = profile.address || '';
      }

      setCheckoutForm(prev => ({
        ...prev,
        name: profile.full_name || '',
        phone: profile.phone || '',
        address: address
      }));
    }
  }, [profile]);

  // --- FETCH LOCATIONS ---
  // 1. Fetch Provinces
  useEffect(() => {
    const loadProvinces = async () => {
      console.log("Cart: Loading Provinces...");
      const list = await fetchProvinces();
      setProvinces(list);
      console.log("Cart: Provinces loaded", list.length);
    };
    loadProvinces();
  }, []);

  // 2. Fetch Districts when Province changes
  useEffect(() => {
    if (!selectedLocation.province) {
      setDistricts([]);
      setWards([]);
      setRawProvinceWards([]);
      setSelectedLocation(prev => ({ ...prev, district: null, ward: null }));
      return;
    }

    const loadDistrictsAndWards = async () => {
      setIsLoadingDistricts(true);
      try {
        const provinceCode = selectedLocation.province.code;
        console.log("Cart: Province selected:", provinceCode, selectedLocation.province.name);

        const { districts: newDistricts, wards: newWards } = await fetchDistrictsAndWards(provinceCode);

        setDistricts(newDistricts);
        setRawProvinceWards(newWards);
        // Reset dependent fields
        setWards([]);
        setSelectedLocation(prev => ({ ...prev, district: null, ward: null }));
      } catch (error) {
        console.error("Cart: Error loading districts/wards:", error);
        setDistricts([]);
        setRawProvinceWards([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    loadDistrictsAndWards();
  }, [selectedLocation.province]);

  // 3. Filter Wards when District changes
  useEffect(() => {
    if (!selectedLocation.district) {
      setWards([]);
      setSelectedLocation(prev => ({ ...prev, ward: null }));
      return;
    }

    const districtCode = selectedLocation.district.code;
    const filteredWards = filterWardsByDistrict(rawProvinceWards, districtCode);
    setWards(filteredWards);

    // When district changes, ward selection becomes invalid, so we reset it if it's not in the new list (usually it won't be)
    setSelectedLocation(prev => ({ ...prev, ward: null }));

  }, [selectedLocation.district, rawProvinceWards]);

  const subtotal = getTotalPrice();

  // --- LOYALTY TIER BENEFITS ---
  const [userTier, setUserTier] = useState(null);
  const [tierDiscount, setTierDiscount] = useState(0);
  const [tierFreeShipping, setTierFreeShipping] = useState({ isFreeShipping: false, threshold: null, amountToFreeShip: null });

  // Fetch user tier on mount
  useEffect(() => {
    const loadTier = async () => {
      if (profile?.total_points || profile?.points) {
        const tier = await getUserTier(profile?.total_points || profile?.points || 0);
        setUserTier(tier);
      }
    };
    loadTier();
  }, [profile]);

  // Calculate tier discount and free shipping
  useEffect(() => {
    if (userTier) {
      const discount = calculateTierDiscount(subtotal, userTier);
      setTierDiscount(discount);

      const freeShipCheck = checkFreeShipping(subtotal, userTier);
      setTierFreeShipping(freeShipCheck);
    }
  }, [userTier, subtotal]);

  // Determine shipping fee based on tier benefits
  const DEFAULT_FREE_SHIP_THRESHOLD = 300000;
  const FREE_SHIP_THRESHOLD = (userTier && userTier.free_shipping_threshold !== null)
    ? userTier.free_shipping_threshold
    : DEFAULT_FREE_SHIP_THRESHOLD;
  const shippingFee = tierFreeShipping.isFreeShipping ? 0 : (subtotal >= DEFAULT_FREE_SHIP_THRESHOLD ? 0 : 20000);

  // Calculate totals
  useEffect(() => {
    if (appliedVoucher) {
      let discount = 0;

      if (appliedVoucher.type === 'percent') {
        // Percent discount
        discount = Math.floor((subtotal * appliedVoucher.value) / 100);
        // Apply max_discount cap if exists
        if (appliedVoucher.max_discount || appliedVoucher.max) {
          discount = Math.min(discount, appliedVoucher.max_discount || appliedVoucher.max);
        }
      } else if (appliedVoucher.type === 'freeship') {
        // Freeship - reduce shipping fee up to voucher value
        discount = Math.min(appliedVoucher.value, shippingFee);
      } else if (appliedVoucher.type === 'fixed') {
        // Fixed amount discount
        discount = appliedVoucher.value;
      }

      // Check min order requirement
      if (appliedVoucher.minOrder && subtotal < appliedVoucher.minOrder) {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        toast({ title: "Voucher bị hủy", description: `Đơn hàng chưa đạt tối thiểu ${new Intl.NumberFormat('vi-VN').format(appliedVoucher.minOrder)}đ`, variant: "destructive" });
      } else {
        console.log('Applied discount:', discount, 'Type:', appliedVoucher.type, 'Value:', appliedVoucher.value);
        setDiscountAmount(discount);
      }
    } else {
      setDiscountAmount(0);
    }
  }, [subtotal, appliedVoucher, shippingFee, voucherCode]);

  // Final total includes tier discount + voucher discount
  const totalDiscount = tierDiscount + discountAmount;
  const total = Math.max(0, subtotal + shippingFee - totalDiscount);
  const progressPercentage = Math.min((subtotal / (FREE_SHIP_THRESHOLD || DEFAULT_FREE_SHIP_THRESHOLD)) * 100, 100);
  const remainingForFreeShip = Math.max(0, (FREE_SHIP_THRESHOLD || DEFAULT_FREE_SHIP_THRESHOLD) - subtotal);
  const earnablePoints = Math.floor(subtotal / 10000);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyVoucher = async () => {
    const code = voucherCode.toUpperCase().trim();
    if (!code) {
      toast({ title: "Lỗi", description: "Vui lòng nhập mã voucher.", variant: "destructive" });
      return;
    }

    // Check if it's a user-redeemed voucher (has suffix like GIAM30K_ABC123)
    let baseCode = code;
    let redeemedVoucherData = null;

    if (code.includes('_')) {
      baseCode = code.split('_')[0];

      // Check if voucher exists in user's inventory
      if (user) {
        const { data: redeemedVoucher, error } = await supabase
          .from('redeemed_vouchers')
          .select('*')
          .eq('user_id', user.id)
          .eq('voucher_code', code)
          .eq('is_used', false)
          .maybeSingle();

        if (redeemedVoucher && !error) {
          redeemedVoucherData = redeemedVoucher;
        } else {
          toast({ title: "Lỗi", description: "Mã voucher không tồn tại trong kho của bạn hoặc đã được sử dụng.", variant: "destructive" });
          return;
        }
      } else {
        toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để sử dụng mã voucher cá nhân.", variant: "destructive" });
        return;
      }
    }

    // If voucher is from inventory, use saved data (works even if original voucher was deleted)
    if (redeemedVoucherData) {
      // Validate min_order from saved voucher data
      if (redeemedVoucherData.min_order && subtotal < redeemedVoucherData.min_order) {
        toast({
          title: "Lỗi",
          description: `Đơn hàng cần tối thiểu ${new Intl.NumberFormat('vi-VN').format(redeemedVoucherData.min_order)}đ.`,
          variant: "destructive"
        });
        return;
      }

      // Validate target_category from saved voucher data - ALL items must match
      if (redeemedVoucherData.target_category) {
        const allMatch = cartItems.every(item => item.category === redeemedVoucherData.target_category);
        if (!allMatch) {
          toast({
            title: "Lỗi",
            description: `Voucher chỉ áp dụng khi tất cả sản phẩm thuộc danh mục "${redeemedVoucherData.target_category}". Vui lòng xóa sản phẩm khác danh mục.`,
            variant: "destructive"
          });
          return;
        }
      }

      // Use saved voucher data
      console.log('Applying voucher from inventory:', redeemedVoucherData);
      const voucherToApply = {
        code: redeemedVoucherData.original_code || baseCode,
        type: redeemedVoucherData.type,
        value: redeemedVoucherData.value,
        min_order: redeemedVoucherData.min_order,
        max_discount: redeemedVoucherData.max_discount,
        description: redeemedVoucherData.description,
        minOrder: redeemedVoucherData.min_order,
        max: redeemedVoucherData.max_discount,
        desc: redeemedVoucherData.description
      };
      console.log('Setting appliedVoucher to:', voucherToApply);
      setAppliedVoucher(voucherToApply);
      triggerConfetti();
      toast({ title: "Thành công", description: "Đã áp dụng mã giảm giá!", className: "bg-green-100 text-green-800" });
      return;
    }

    // Validate voucher from database (for public vouchers not from inventory)
    const result = await validateVoucher(baseCode, user?.id, cartItems, subtotal);

    if (!result.valid) {
      toast({ title: "Lỗi", description: result.error, variant: "destructive" });
      return;
    }

    // Set applied voucher with compatible format
    setAppliedVoucher({
      ...result.voucher,
      minOrder: result.voucher.min_order,
      max: result.voucher.max_discount,
      desc: result.voucher.description
    });
    triggerConfetti();
    toast({ title: "Thành công", description: "Đã áp dụng mã giảm giá!", className: "bg-green-100 text-green-800" });
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      toast({ title: "Yêu cầu đăng nhập", description: "Bạn cần đăng nhập để thanh toán.", variant: "destructive" });
      navigate('/login');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    // Validate inputs
    if (!checkoutForm.name || !checkoutForm.phone) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền họ tên và số điện thoại.", variant: "destructive" });
      return;
    }

    // Construct Address
    // If user selected dropdowns, use the structured format. 
    // If not, fallback to the text input assuming it's a pre-saved full address.
    let finalAddress = checkoutForm.address;

    // Check if dropdowns are active
    const hasDropdownSelection = selectedLocation.province && selectedLocation.district && selectedLocation.ward;

    if (hasDropdownSelection) {
      if (!checkoutForm.address) {
        toast({ title: "Thiếu thông tin", description: "Vui lòng nhập số nhà, tên đường.", variant: "destructive" });
        return;
      }
      // Use "name" property from new API structure
      finalAddress = `${checkoutForm.address}, ${selectedLocation.ward.name}, ${selectedLocation.district.name}, ${selectedLocation.province.name}`;
    } else if (!checkoutForm.address) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập địa chỉ giao hàng.", variant: "destructive" });
      return;
    }

    // For online payments (VNPay/MoMo), open payment modal first
    if (checkoutForm.paymentMethod === 'vnpay' || checkoutForm.paymentMethod === 'momo') {
      // Store the final address temporarily for use after payment success
      window.tempOrderData = {
        checkoutForm: { ...checkoutForm, address: finalAddress },
        cartItems: [...cartItems],
        total,
        voucherCode: appliedVoucher ? voucherCode : null
      };
      setIsPaymentModalOpen(true);
      return;
    }

    // For COD, create order directly
    await processOrderCreation({ ...checkoutForm, address: finalAddress });
  };

  // Helper function to process order creation (used by both COD and after online payment)
  const processOrderCreation = async (orderPayload) => {
    setIsProcessing(true);
    try {
      const order = await createOrder(cartItems, total, orderPayload, appliedVoucher ? voucherCode : null);

      if (user) {
        // Use addPointsForOrder to update BOTH points and total_points
        const result = await addPointsForOrder(user.id, subtotal);
        if (result.pointsEarned > 0) {
          await fetchProfile(user.id);
        }
      }

      setLastOrderDetails({
        orderId: order.id,
        items: [...cartItems],
        total, shippingFee, subtotal, discountAmount,
        earnedPoints: Math.floor(subtotal / 10000),
        customer: orderPayload,
        paymentMethod: checkoutForm.paymentMethod
      });

      await clearCart();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error("Checkout error:", error);
      toast({ title: "Thanh toán thất bại", description: "Đã có lỗi xảy ra.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment modal success
  const handlePaymentSuccess = async () => {
    setIsPaymentModalOpen(false);
    if (window.tempOrderData) {
      await processOrderCreation(window.tempOrderData.checkoutForm);
      delete window.tempOrderData;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div></div>
  }

  // --- VIEW: THANK YOU (STEP 3) ---
  if (currentStep === 3 && lastOrderDetails) {
    return (
      <div className="min-h-screen bg-background py-12">
        <Helmet><title>Đặt hàng thành công</title></Helmet>
        <div className="container-custom max-w-2xl">
          <CheckoutProgress step={3} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-yellow-100 dark:border-yellow-900/30 overflow-hidden p-8 text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" strokeWidth={4} />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Đặt hàng thành công!</h1>
            <p className="text-muted-foreground mb-8">Mã đơn hàng: <span className="font-bold font-mono text-foreground">#{lastOrderDetails.orderId.substring(0, 8).toUpperCase()}</span></p>

            {/* Points Badge */}
            {lastOrderDetails.earnedPoints > 0 && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-6 py-3 rounded-2xl text-yellow-800 dark:text-yellow-400 font-bold shadow-sm mb-8">
                <Coins className="w-5 h-5 fill-yellow-500 text-yellow-600 dark:text-yellow-400" />
                +{lastOrderDetails.earnedPoints} điểm tích lũy
              </div>
            )}

            <div className="space-y-4">
              <Button size="lg" className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold shadow-colored" onClick={() => navigate('/products')}>
                Tiếp tục mua sắm
              </Button>
              <Button variant="ghost" className="w-full text-foreground hover:bg-muted" onClick={() => navigate('/account')}>Xem đơn hàng của tôi</Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- VIEW: EMPTY ---
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-background">
        <div className="w-48 h-48 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center shadow-inner mb-8">
          <ShoppingBag className="w-20 h-20 text-yellow-200 dark:text-yellow-700" />
        </div>
        <h2 className="text-3xl font-display text-foreground mb-3">Giỏ hàng đang trống</h2>
        <Link to="/products"><Button size="lg" className="rounded-full h-14 px-10 bg-yellow-400 hover:bg-yellow-500 text-white shadow-colored font-bold text-lg">Tiếp tục mua sắm</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <Helmet><title>Giỏ hàng - ChipChip Minimart</title></Helmet>
      <div className="container-custom">

        <CheckoutProgress step={currentStep} />

        <div className="flex items-center gap-4 mb-8">
          {currentStep === 2 && (
            <Button variant="ghost" onClick={() => setCurrentStep(1)} className="w-10 h-10 rounded-full bg-card dark:bg-slate-800 p-0 hover:bg-muted border border-border">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-3xl font-display font-bold text-foreground">
            {currentStep === 1 ? 'Giỏ hàng của bạn' : 'Thông tin thanh toán'}
          </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                  {/* Free Ship Upsell */}
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      {tierFreeShipping.isFreeShipping ? (
                        <p className="text-green-700 dark:text-green-400 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          {userTier?.icon} Ưu đãi {userTier?.name?.replace('Thành viên ', '')}: Miễn phí vận chuyển!
                        </p>
                      ) : remainingForFreeShip > 0 ? (
                        <>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Mua thêm <span className="font-bold text-blue-600 dark:text-blue-400">{new Intl.NumberFormat('vi-VN').format(remainingForFreeShip)}đ</span> để được <span className="font-bold text-green-600 dark:text-green-400">Freeship</span>
                            {userTier && userTier.free_shipping_threshold !== null && userTier.free_shipping_threshold < DEFAULT_FREE_SHIP_THRESHOLD && (
                              <span className="ml-1 text-purple-600 dark:text-purple-400">({userTier.icon} ngưỡng {userTier.name.replace('Thành viên ', '')}: {(userTier.free_shipping_threshold / 1000).toFixed(0)}k)</span>
                            )}
                          </p>
                          <div className="w-full bg-white dark:bg-slate-700 rounded-full h-3">
                            <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                          </div>
                        </>
                      ) : (
                        <p className="text-green-700 dark:text-green-400 font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Đơn hàng đã được miễn phí vận chuyển!</p>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="bg-card dark:bg-slate-900 rounded-[2rem] shadow-sm border border-border overflow-hidden p-6 md:p-8 space-y-6">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-dashed border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-2xl p-2 border border-gray-100 dark:border-gray-800 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <Link to={`/product/${item.id}`} className="text-lg font-bold text-foreground hover:text-yellow-600 transition-colors line-clamp-1">{item.name}</Link>
                          <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
                          <p className="text-yellow-600 dark:text-yellow-400 font-bold mt-1 sm:hidden">{new Intl.NumberFormat('vi-VN').format(item.sale_price || item.price)}đ</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="font-bold text-foreground hidden sm:block">{new Intl.NumberFormat('vi-VN').format(item.sale_price || item.price)}đ</p>
                          <div className="flex items-center bg-gray-50 dark:bg-slate-800 rounded-xl h-10 border border-border">
                            <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} className="w-10 h-full flex items-center justify-center hover:text-yellow-600 dark:text-gray-300"><Minus className="w-4 h-4" /></button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                if (val >= 1) {
                                  updateQuantity(item.cart_item_id, val);
                                }
                              }}
                              className="w-12 text-center font-bold text-sm text-foreground bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} className="w-10 h-full flex items-center justify-center hover:text-yellow-600 dark:text-gray-300"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.cart_item_id)} className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 flex items-center justify-center transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Products */}
                  {recommendedProducts.length > 0 && (
                    <div className="bg-card dark:bg-slate-900 rounded-[2rem] shadow-sm border border-border overflow-hidden p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">Có thể bạn cũng thích</h3>
                          <p className="text-xs text-muted-foreground">Sản phẩm cùng danh mục</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {recommendedProducts.map(product => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            className="group bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-md transition-all"
                          >
                            <div className="aspect-square bg-white dark:bg-slate-700 rounded-xl mb-3 p-2 overflow-hidden">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <p className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-yellow-600 transition-colors mb-1">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">
                                {new Intl.NumberFormat('vi-VN').format(product.sale_price || product.price)}đ
                              </span>
                              {product.discount > 0 && (
                                <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">
                                  -{product.discount}%
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  {/* Form */}
                  <div className="bg-card dark:bg-slate-900 rounded-[2rem] shadow-sm border border-yellow-100 dark:border-yellow-900/30 p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><MapPin className="w-5 h-5 text-yellow-500" /> Địa chỉ nhận hàng</h3>

                      {/* Saved Address Dialog */}
                      {savedAddresses.length > 0 && (
                        <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                              <Contact className="w-4 h-4" />
                              Chọn địa chỉ đã lưu
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-card dark:bg-slate-900 border-border">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-foreground">
                                <Home className="w-5 h-5 text-yellow-500" />
                                Địa chỉ đã lưu
                              </DialogTitle>
                              <DialogDescription className="text-muted-foreground">
                                Chọn một địa chỉ để tự động điền vào form thanh toán.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
                              {savedAddresses.map((addr, index) => (
                                <button
                                  key={addr.id || index}
                                  onClick={() => handleSelectSavedAddress(addr)}
                                  className="w-full text-left p-4 rounded-xl border border-border bg-gray-50 dark:bg-slate-800 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all group"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                                      <MapPin className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors">
                                        {addr.full_name || 'Không có tên'}
                                      </p>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Phone className="w-3 h-3" /> {addr.phone || 'Không có SĐT'}
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {addr.address || 'Không có địa chỉ chi tiết'}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-yellow-500 transition-colors flex-shrink-0" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <Input name="name" value={checkoutForm.name} onChange={handleInputChange} placeholder="Họ tên" className="h-12 rounded-xl bg-gray-50 dark:bg-slate-800 border-border text-foreground" />
                      <Input name="phone" value={checkoutForm.phone} onChange={handleInputChange} placeholder="Số điện thoại" className="h-12 rounded-xl bg-gray-50 dark:bg-slate-800 border-border text-foreground" />
                    </div>

                    {/* ADDRESS DROPDOWNS */}
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      {/* Province Select */}
                      <div className="relative">
                        <select
                          className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-800 border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer text-foreground"
                          value={selectedLocation.province?.code || ''}
                          onChange={(e) => {
                            const prov = provinces.find(p => p.code === e.target.value);
                            setSelectedLocation(prev => ({ ...prev, province: prov || null, district: null, ward: null }));
                          }}
                        >
                          <option value="">Tỉnh/Thành phố</option>
                          {provinces.map(p => (
                            <option key={p.code} value={p.code}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      {/* District Select */}
                      <div className="relative">
                        <select
                          className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-800 border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer disabled:opacity-50 text-foreground"
                          value={selectedLocation.district?.code || ''}
                          onChange={(e) => {
                            const dist = districts.find(d => d.code === e.target.value);
                            setSelectedLocation(prev => ({ ...prev, district: dist || null, ward: null }));
                          }}
                          disabled={!selectedLocation.province}
                        >
                          <option value="">
                            {!selectedLocation.province
                              ? "Chọn tỉnh trước"
                              : isLoadingDistricts
                                ? "Đang tải..."
                                : districts.length === 0
                                  ? "Không có dữ liệu"
                                  : "Quận/Huyện"}
                          </option>
                          {districts.map(d => (
                            <option key={d.code} value={d.code}>{d.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        {isLoadingDistricts && <div className="absolute right-8 top-1/2 -translate-y-1/2"><Loader2 className="w-4 h-4 animate-spin text-yellow-500" /></div>}
                      </div>

                      {/* Ward Select */}
                      <div className="relative">
                        <select
                          className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-800 border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer disabled:opacity-50 text-foreground"
                          value={selectedLocation.ward?.code || ''}
                          onChange={(e) => {
                            const ward = wards.find(w => w.code === e.target.value);
                            setSelectedLocation(prev => ({ ...prev, ward: ward || null }));
                          }}
                          disabled={!selectedLocation.district}
                        >
                          <option value="">
                            {!selectedLocation.district
                              ? "Chọn huyện trước"
                              : wards.length === 0
                                ? "Không có dữ liệu"
                                : "Phường/Xã"}
                          </option>
                          {wards.map(w => (
                            <option key={w.code} value={w.code}>{w.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <Input
                      name="address"
                      value={checkoutForm.address}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường (Cụ thể)"
                      className="h-12 rounded-xl bg-gray-50 dark:bg-slate-800 border-border mb-4 text-foreground"
                    />

                    <Textarea name="note" value={checkoutForm.note} onChange={handleInputChange} placeholder="Ghi chú (tùy chọn)..." className="rounded-xl bg-gray-50 dark:bg-slate-800 border-border text-foreground" />
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-card dark:bg-slate-900 rounded-[2rem] shadow-sm border border-yellow-100 dark:border-yellow-900/30 p-8">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-yellow-500" /> Phương thức thanh toán</h3>
                    <div className="space-y-3">
                      {/* COD */}
                      <label
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${checkoutForm.paymentMethod === 'cod' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-border hover:border-yellow-200'}`}
                        onClick={() => setCheckoutForm(p => ({ ...p, paymentMethod: 'cod' }))}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${checkoutForm.paymentMethod === 'cod' ? 'border-yellow-500' : 'border-gray-300 dark:border-gray-600'}`}>
                          {checkoutForm.paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-4">
                          <Banknote className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">Tiền mặt (COD)</p>
                          <p className="text-sm text-muted-foreground">Thanh toán khi nhận hàng</p>
                        </div>
                      </label>

                      {/* VNPay */}
                      <label
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${checkoutForm.paymentMethod === 'vnpay' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-blue-200'}`}
                        onClick={() => setCheckoutForm(p => ({ ...p, paymentMethod: 'vnpay' }))}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${checkoutForm.paymentMethod === 'vnpay' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                          {checkoutForm.paymentMethod === 'vnpay' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 overflow-hidden bg-white p-1">
                          <img src="https://cdn.brandfetch.io/vnlife.vn/w/512/h/512?c=1idiRamKWOLozA0BjjR" alt="VNPAY" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">VNPAY</p>
                          <p className="text-sm text-muted-foreground">Thẻ ATM, Visa, MasterCard, QR</p>
                        </div>
                      </label>

                      {/* MoMo */}
                      <label
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${checkoutForm.paymentMethod === 'momo' ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20' : 'border-border hover:border-pink-200'}`}
                        onClick={() => setCheckoutForm(p => ({ ...p, paymentMethod: 'momo' }))}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${checkoutForm.paymentMethod === 'momo' ? 'border-pink-500' : 'border-gray-300 dark:border-gray-600'}`}>
                          {checkoutForm.paymentMethod === 'momo' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />}
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 overflow-hidden bg-white p-1">
                          <img src="https://cdn.brandfetch.io/momo.vn/w/512/h/512?c=1idiRamKWOLozA0BjjR" alt="MoMo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">Ví MoMo</p>
                          <p className="text-sm text-muted-foreground">Quét mã QR để thanh toán</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* RIGHT (Summary) */}
          <div className="lg:col-span-4">
            <div className="bg-card dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-yellow-100/40 dark:shadow-none border border-yellow-100 dark:border-yellow-900/30 p-6 md:p-8 sticky top-24">
              <h2 className="text-xl font-display text-foreground mb-6">Tổng đơn hàng</h2>

              {/* Voucher Input */}
              <div className="mb-6 bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                {appliedVoucher ? (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                      <Ticket className="w-4 h-4" /> <span>{voucherCode}</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }} className="h-6 w-6 text-red-400"><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Mã giảm giá" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} className="h-10 rounded-xl bg-white dark:bg-slate-900 border-border text-foreground" />
                    <Button onClick={handleApplyVoucher} className="rounded-xl bg-gray-800 dark:bg-white text-white dark:text-gray-900 h-10 font-bold">Áp dụng</Button>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between"><span>Tạm tính</span><span className="font-bold text-foreground">{subtotal.toLocaleString('vi-VN')}đ</span></div>
                <div className="flex justify-between"><span>Phí ship</span><span className={`font-bold ${shippingFee === 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}đ`}</span></div>

                {/* Tier Discount */}
                {tierDiscount > 0 && userTier && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span className="flex items-center gap-1">
                      <span>{userTier.icon}</span> Ưu đãi {userTier.name.replace('Thành viên ', '')} (-{userTier.discount_percent}%)
                    </span>
                    <span className="font-bold">-{tierDiscount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                {/* Voucher Discount */}
                {discountAmount > 0 && <div className="flex justify-between text-green-600 dark:text-green-400"><span>Giảm giá voucher</span><span className="font-bold">-{discountAmount.toLocaleString('vi-VN')}đ</span></div>}

                {/* NEW: Points Display */}
                <div className="flex justify-between text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-lg">
                  <span className="flex items-center gap-1 font-medium"><Sparkles className="w-3.5 h-3.5" /> Điểm tích lũy</span>
                  <span className="font-bold">+{earnablePoints}</span>
                </div>

                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 mt-2 flex justify-between items-end">
                  <span className="font-bold text-foreground text-lg">Tổng cộng</span>
                  <span className="text-3xl font-display text-yellow-500">{total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <Button
                onClick={currentStep === 1 ? handleProceedToCheckout : handlePlaceOrder}
                disabled={isProcessing}
                className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-white text-lg font-bold shadow-colored btn-hover-effect"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : currentStep === 1 ? 'Thanh toán ngay' : 'Xác nhận đặt hàng'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Payment Modal */}
      <MockPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        amount={total}
        paymentMethod={checkoutForm.paymentMethod}
        orderId={lastOrderDetails?.orderId}
      />
    </div>
  );
};

export default Cart;
