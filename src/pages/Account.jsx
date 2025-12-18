import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, MapPin, LogOut, Settings, Edit, Trash2, PlusCircle, Gift, Ticket, Copy, Check, Clock, Sparkles, Star, TrendingUp, Users, ShoppingBag, AlertCircle, Search, Save, X, Eye, Banknote, Download, ChevronLeft, ChevronRight, Filter, Calendar, FileSpreadsheet, Lock, Phone, Bell, FileText, BarChart3, Award, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Home, LogIn, Mail, CreditCard, Coins, MessageCircle, Send, Camera } from 'lucide-react';
import OrderTracking from '@/components/OrderTracking';
import LoyaltyBadge, { AllTiersDisplay } from '@/components/LoyaltyBadge';
import { getLoyaltyTiers, adminCreateTier, adminUpdateTier, adminDeleteTier, clearTierCache, getUserTier, getTierColors } from '@/services/loyaltyService';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { RevenueAreaChart, OrderStatusPieChart } from '@/components/RechartsComponents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Services
import { getOrders, getAllOrders, updateOrderStatus, getDashboardStats, refundOrderOnCancel } from '@/services/orderService';
import { updateProfile, adminGetAllProfiles, adminUpdateProfile } from '@/services/profileService';
import { adminGetAllProducts, adminAddProduct, adminUpdateProduct, adminDeleteProduct, getCategories } from '@/services/productService';
import { getAllVouchers, createVoucher, updateVoucher, deleteVoucher, getRedeemableVouchers } from '@/services/userService';
import { adminGetConversations, getConversationMessages, sendChatMessage, adminAssignConversation, adminCloseConversation, subscribeToMessages, subscribeToWaitingConversations, unsubscribeChannel } from '@/services/chatService';
import { supabase } from '@/lib/customSupabaseClient';
import { exportOrderToPDF, exportOrdersToExcel, exportRevenueToExcel } from '@/services/openAIService';

// --- ADMIN DASHBOARD COMPONENTS ---

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">
        Trang {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Admin Product Form
const AdminProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState(product || {
    name: '', price: '', sale_price: '', discount: '', category: 'Rau củ quả', description: '', image: '', unit: 'kg'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // Auto-calculate logic (same as before)
    if (name === 'discount') {
        const discountValue = value ? String(value).trim() : '';
        if (discountValue && formData.price) {
            const discountPercent = Number(discountValue);
            if (discountPercent > 0 && discountPercent <= 100) {
                const calculatedSalePrice = Math.round(Number(formData.price) * (1 - discountPercent / 100));
                newFormData.sale_price = calculatedSalePrice;
            } else {
                newFormData.sale_price = ''; newFormData.discount = '';
            }
        } else {
            newFormData.sale_price = ''; newFormData.discount = '';
        }
    }
    // Auto-calculate discount when price changes
    if (name === 'price' && formData.discount && value) {
        const discountValue = String(formData.discount).trim();
        if (discountValue) {
            const discountPercent = Number(discountValue);
            if (discountPercent > 0 && discountPercent <= 100) {
                const calculatedSalePrice = Math.round(Number(value) * (1 - discountPercent / 100));
                newFormData.sale_price = calculatedSalePrice;
            }
        }
    }
    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Tên sản phẩm</label>
          <Input name="name" value={formData.name} onChange={handleChange} required placeholder="VD: Cà chua" className="rounded-xl border-gray-200" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Danh mục</label>
          <select name="category" value={formData.category} onChange={handleChange} className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
            {['Rau củ quả', 'Thịt, cá, hải sản', 'Sữa & trứng', 'Đồ ăn lạnh', 'Đồ ăn vặt', 'Đồ uống', 'Thực phẩm khô', 'Thực phẩm đóng hộp', 'Gia vị', 'Lương thực', 'Sản phẩm gia dụng'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Giá gốc (VNĐ)</label>
          <Input type="number" name="price" value={formData.price} onChange={handleChange} required className="rounded-xl border-gray-200" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Đơn vị</label>
          <Input name="unit" value={formData.unit} onChange={handleChange} placeholder="kg, cái, hộp..." className="rounded-xl border-gray-200" />
        </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Giảm giá (%)</label>
           <Input type="number" name="discount" value={formData.discount || ''} onChange={handleChange} placeholder="VD: 16" min="0" max="100" className="rounded-xl border-gray-200" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Giá sale (Tự động)</label>
          <Input type="number" name="sale_price" value={formData.sale_price || ''} readOnly className="rounded-xl border-gray-200 bg-gray-50 text-gray-500" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Link Ảnh</label>
        <Input name="image" value={formData.image} onChange={handleChange} placeholder="https://..." className="rounded-xl border-gray-200" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Mô tả</label>
        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả chi tiết..." className="rounded-xl border-gray-200 min-h-[80px]" />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">Hủy</Button>
        <Button type="submit" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold rounded-xl">{product ? 'Cập nhật' : 'Thêm mới'}</Button>
      </DialogFooter>
    </form>
  );
};

// Customer Detail Form
const CustomerDetailForm = ({ customer, orders, onSave, onCancel }) => {
  // Use state to store tier info
  const [tierInfo, setTierInfo] = useState(null);

  // Load tier info
  useEffect(() => {
    const loadTier = async () => {
      // Calculate from total points
      const points = customer.total_points || 0;
      const tier = await getUserTier(points);
      setTierInfo(tier);
    };
    loadTier();
  }, [customer]);

  // Calculate stats - Modified to only count COMPLETED orders for total spent
  const customerOrders = orders.filter(o => o.user_id === customer.id && o.status !== 'Cancelled');
  const completedOrders = customerOrders.filter(o => o.status === 'Completed');
  const totalSpent = completedOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
  const orderCount = customerOrders.length;

    // Helper to extract the main address string from the JSON array
    const extractMainAddress = (addressJsonString) => {
      try {
        const parsed = JSON.parse(addressJsonString);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].address) {
          return parsed[0].address;
        }
      } catch (e) {
        // If it's not valid JSON, assume it's a plain address string
        return addressJsonString;
      }
      return ''; // Default empty
    };

    const [formData, setFormData] = useState({
    full_name: customer.full_name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: extractMainAddress(customer.address || ''),
    points: customer.points || 0,
    total_points: customer.total_points || 0
  });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // For saving, we should construct the address back into the JSON format
    let addressToSave = formData.address;
    try {
      const originalAddressParsed = JSON.parse(customer.address || '[]');
      if (Array.isArray(originalAddressParsed) && originalAddressParsed.length > 0) {
        // Update the 'address' property of the first object
        originalAddressParsed[0].address = formData.address;
        addressToSave = JSON.stringify(originalAddressParsed);
      } else if (formData.address) {
        addressToSave = JSON.stringify([{ id: Date.now().toString(), full_name: formData.full_name, phone: formData.phone, address: formData.address }]);
      } else {
        addressToSave = '';
      }
    } catch (e) {
      if (formData.address) {
        addressToSave = JSON.stringify([{ id: Date.now().toString(), full_name: formData.full_name, phone: formData.phone, address: formData.address }]);
      } else {
        addressToSave = '';
      }
    }

    // Convert points to numbers (separate fields for available and accumulated)
    const dataToSave = {
      ...formData,
      address: addressToSave,
      points: Number(formData.points) || 0,  // Điểm khả dụng
      total_points: Number(formData.total_points) || 0  // Điểm tích lũy (tính hạng)
    };

    onSave(customer.id, dataToSave);
  };

  const tierColor = tierInfo ? getTierColors(tierInfo.slug) : { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Stats Cards */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col items-center justify-center text-center">
          <p className="text-xs uppercase font-bold text-blue-500 mb-1">Đơn hàng</p>
          <p className="text-2xl font-bold text-foreground">{orderCount}</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 flex flex-col items-center justify-center text-center">
          <p className="text-xs uppercase font-bold text-green-500 mb-1">Tổng chi tiêu</p>
          <p className="text-lg font-bold text-foreground">{new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(totalSpent)}đ</p>
        </div>
      </div>

      {/* Tier Info Section */}
      {tierInfo && (
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${tierColor.bg} ${tierColor.border} bg-opacity-30`}>
          <div className="text-3xl">{tierInfo.icon}</div>
          <div>
            <p className="text-xs uppercase font-bold opacity-70">Hạng thành viên</p>
            <h3 className={`font-bold ${tierColor.text}`}>{tierInfo.name}</h3>
            <p className="text-xs mt-1 opacity-80">Điểm tích lũy: <b>{customer.total_points || 0}</b></p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Họ tên</label>
          <Input name="full_name" value={formData.full_name} onChange={handleChange} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Số điện thoại</label>
          <Input name="phone" value={formData.phone} onChange={handleChange} className="rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
          <Input name="email" value={formData.email} disabled className="rounded-xl bg-muted/50" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Điểm khả dụng</label>
          <Input type="number" name="points" value={formData.points} onChange={handleChange} className="rounded-xl font-bold text-yellow-600" />
          <p className="text-[10px] text-muted-foreground">Dùng để đổi voucher</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Điểm tích lũy</label>
          <Input type="number" name="total_points" value={formData.total_points} onChange={handleChange} className="rounded-xl font-bold text-purple-600" />
          <p className="text-[10px] text-muted-foreground">Dùng để tính hạng TV</p>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Địa chỉ</label>
        <Textarea name="address" value={formData.address} onChange={handleChange} className="rounded-xl min-h-[80px]" />
      </div>

      <DialogFooter className="mt-6">
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">Đóng</Button>
        <Button type="submit" className="bg-yellow-400 text-yellow-900 font-bold rounded-xl">Lưu thay đổi</Button>
      </DialogFooter>
    </form>
  );
};

// Admin Voucher Form
const AdminVoucherForm = ({ voucher, categories, customers, onSave, onCancel }) => {
  const [formData, setFormData] = useState(voucher || {
    code: '', type: 'fixed', value: '', max_discount: '', min_order: '',
    description: '', valid_from: '', valid_until: '', usage_limit: '',
    target_user_id: '', target_category: '', is_public: true, points_cost: '', icon: '🎁'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert empty strings to null for optional fields
    const data = {
      ...formData,
      value: Number(formData.value) || 0,
      max_discount: formData.max_discount ? Number(formData.max_discount) : null,
      min_order: formData.min_order ? Number(formData.min_order) : null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      points_cost: formData.points_cost ? Number(formData.points_cost) : 0,
      target_user_id: formData.target_user_id || null,
      target_category: formData.target_category || null,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
    };
    onSave(data);
  };

  const iconOptions = ['🎁', '🚚', '💵', '💎', '⚡', '🔥', '👋', '🎉', '🌟', '🛒'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Mã voucher *</label>
          <Input name="code" value={formData.code} onChange={handleChange} required placeholder="VD: GIAM50K" className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Loại giảm giá *</label>
          <select name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm">
            <option value="fixed">Tiền cố định (đ)</option>
            <option value="percent">Phần trăm (%)</option>
            <option value="freeship">Miễn phí ship</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Giá trị *</label>
          <Input type="number" name="value" value={formData.value} onChange={handleChange} required placeholder={formData.type === 'percent' ? '10' : '50000'} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Giảm tối đa</label>
          <Input type="number" name="max_discount" value={formData.max_discount} onChange={handleChange} placeholder="50000" className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Đơn tối thiểu</label>
          <Input type="number" name="min_order" value={formData.min_order} onChange={handleChange} placeholder="100000" className="rounded-xl" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Mô tả</label>
        <Input name="description" value={formData.description} onChange={handleChange} placeholder="VD: Giảm 50k cho đơn từ 200k" className="rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Ngày bắt đầu</label>
          <Input type="datetime-local" name="valid_from" value={formData.valid_from} onChange={handleChange} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Ngày hết hạn</label>
          <Input type="datetime-local" name="valid_until" value={formData.valid_until} onChange={handleChange} className="rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Giới hạn sử dụng</label>
          <Input type="number" name="usage_limit" value={formData.usage_limit} onChange={handleChange} placeholder="Không giới hạn" className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Icon</label>
          <div className="flex gap-1 flex-wrap">
            {iconOptions.map(ic => (
              <button key={ic} type="button" onClick={() => setFormData(p => ({ ...p, icon: ic }))} className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center ${formData.icon === ic ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-gray-50 hover:bg-gray-100'}`}>{ic}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">User cụ thể</label>
          <select name="target_user_id" value={formData.target_user_id} onChange={handleChange} className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm">
            <option value="">Tất cả user</option>
            {customers?.map(c => (
              <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Danh mục cụ thể</label>
          <select name="target_category" value={formData.target_category} onChange={handleChange} className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm">
            <option value="">Tất cả danh mục</option>
            {categories?.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_public" checked={formData.is_public} onChange={handleChange} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium">Công khai (hiện trên Home)</span>
        </label>
        {!formData.is_public && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Điểm đổi:</label>
            <Input type="number" name="points_cost" value={formData.points_cost} onChange={handleChange} placeholder="0" className="rounded-xl w-24 h-8" />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">Hủy</Button>
        <Button type="submit" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold rounded-xl">{voucher ? 'Cập nhật' : 'Thêm mới'}</Button>
      </DialogFooter>
    </form>
  );
};

// --- MAIN ACCOUNT PAGE ---
const Account = () => {
  const { user, profile, signOut, loading, fetchProfile, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Refs
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const chatSubscriptionRef = useRef(null);

  // --- USER STATES ---
  const [userOrders, setUserOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [myVouchers, setMyVouchers] = useState([]);
  const [redeemedCode, setRedeemedCode] = useState(null);
  const [usedVoucherCount, setUsedVoucherCount] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', phone: '', avatar_url: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [redeemingId, setRedeemingId] = useState(null);
  const avatarInputRef = useRef(null);
  
  // -- USER ORDER DETAIL --
  const [isUserOrderDetailOpen, setIsUserOrderDetailOpen] = useState(false);
  const [selectedUserOrder, setSelectedUserOrder] = useState(null);


  // --- ADMIN STATES ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminStats, setAdminStats] = useState({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0, productCount: 0, userCount: 0 });
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminCustomers, setAdminCustomers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear());
  const [revenueViewMode, setRevenueViewMode] = useState('monthly'); // 'monthly' or 'weekly'
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  
  // -- NEW ORDER DETAIL STATES --
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [detailProductPage, setDetailProductPage] = useState(1);
  const DETAIL_ITEMS_PER_PAGE = 4;
  
  // -- CUSTOMER DETAIL STATES --
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // -- NOTIFICATIONS --
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Admin Search & Filter
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  
  // Product Filter States
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productCategories, setProductCategories] = useState([]);

  
    // Pagination States
  const [orderPage, setOrderPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [voucherPage, setVoucherPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const PRODUCTS_PER_PAGE = 10;
  const VOUCHERS_PER_PAGE = 8;

  // Voucher States
  const [adminVouchers, setAdminVouchers] = useState([]);
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [redeemableVouchers, setRedeemableVouchers] = useState([]);

  // Tier States
  const [adminTiers, setAdminTiers] = useState([]);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierFormData, setTierFormData] = useState({ name: '', slug: '', min_points: 0, discount_percent: 0, free_shipping_threshold: null, icon: '🎖️', badge_color: 'gray', benefits: [] });

  // Chat States
  const [adminConversations, setAdminConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // --- ADMIN EFFECTS ---
  useEffect(() => {
    if (user && isAdmin) {
      const fetchAdminData = async () => {
        setIsAdminLoading(true);
        try {
          // Parallel Fetching
          const [stats, allOrders, allProducts, allProfiles, categories, allVouchers, tiers] = await Promise.all([
            getDashboardStats(),
            getAllOrders(),
            adminGetAllProducts(),
            adminGetAllProfiles(),
            getCategories(),
            getAllVouchers(),
            getLoyaltyTiers()
          ]);
          
          if (stats) setAdminStats(prev => ({ ...prev, ...stats }));
          setAdminOrders(allOrders || []);
          setAdminProducts(allProducts || []);
          setAdminCustomers(allProfiles || []);
          setProductCategories(categories || []);
          setAdminVouchers(allVouchers || []);
          setAdminTiers(tiers || []);

          // Extract years for filter
          const years = new Set(allOrders.map(o => new Date(o.created_at).getFullYear()));
          setAvailableYears([...years].sort((a, b) => b - a));

        } catch (error) {
          console.error("Admin data fetch error:", error);
          toast({ title: "Lỗi tải dữ liệu", description: "Vui lòng thử lại sau.", variant: "destructive" });
        } finally {
          setIsAdminLoading(false);
        }
      };
      fetchAdminData();
    }
  }, [user, isAdmin, refreshTrigger]);

  // Handle click outside notification dropdown & search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Show search dropdown when typing
  useEffect(() => {
    if (globalSearchQuery.length > 0) {
        setIsSearchDropdownOpen(true);
    } else {
        setIsSearchDropdownOpen(false);
    }
  }, [globalSearchQuery]);


  // Calculate Monthly & Weekly Revenue (Completed Only)
  useEffect(() => {
    if (adminOrders.length === 0) return;

    // Monthly revenue
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'][i],
      revenue: 0
    }));

    // Weekly revenue (last 12 weeks)
    const weeks = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weeks.push({
        week: 12 - i,
        name: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        startDate: weekStart,
        endDate: weekEnd,
        revenue: 0
      });
    }

    adminOrders.forEach(order => {
      if (order.status === 'Completed') {
        const d = new Date(order.created_at);

        // Monthly
        if (d.getFullYear() === revenueYear) {
          months[d.getMonth()].revenue += Number(order.total_price);
        }

        // Weekly (check if order falls within any of the 12 weeks)
        weeks.forEach(week => {
          if (d >= week.startDate && d <= week.endDate) {
            week.revenue += Number(order.total_price);
          }
        });
      }
    });

    setMonthlyRevenue(months);
    setWeeklyRevenue(weeks.map(w => ({ week: w.week, name: w.name, revenue: w.revenue })));
  }, [adminOrders, revenueYear]);

  // Reset detail page when opening modal
  useEffect(() => {
    if (isOrderDetailOpen) {
      setDetailProductPage(1);
    }
  }, [isOrderDetailOpen, selectedOrder]);


  // Top Selling Products
  const topSellingProducts = useMemo(() => {
     if (adminOrders.length === 0) return [];
    const productSales = {};
    adminOrders.forEach(order => {
      if (order.status === 'Completed' && order.order_items) {
        order.order_items.forEach(item => {
           if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              id: item.product_id,
              name: item.products?.name || 'Unknown',
              image: item.products?.image || '',
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.product_id].quantity += item.quantity;
          productSales[item.product_id].revenue += item.price * item.quantity;
        });
      }
    });
    return Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [adminOrders]);

  // Top Customers (New)
  const topCustomers = useMemo(() => {
    if (adminOrders.length === 0) return [];
    const stats = {};
    
    adminOrders.forEach(order => {
        if (order.status === 'Completed') {
            const userId = order.user_id;
            if (!stats[userId]) {
                const name = order.profiles?.full_name || order.profiles?.email || 'Unknown User';
                stats[userId] = {
                    id: userId,
                    name: name,
                    spent: 0,
                    count: 0
                };
            }
            stats[userId].spent += Number(order.total_price);
            stats[userId].count += 1;
        }
    });

    return Object.values(stats)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);
  }, [adminOrders]);


    // Order Status Distribution (For Recharts)
  const orderStatusDistribution = useMemo(() => {
    const counts = { Pending: 0, Shipping: 0, Completed: 0, Cancelled: 0 };
    adminOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++ });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [adminOrders]);
  
  // --- NOTIFICATIONS DATA ---
  const recentOrderNotifications = useMemo(() => {
    return adminOrders.slice(0, 5).map(order => ({
      id: order.id,
      customer: order.full_name || order.profiles?.full_name || 'Khách vãng lai',
      status: order.status,
      time: new Date(order.created_at),
      amount: order.total_price
    }));
  }, [adminOrders]);
  
  // --- GLOBAL SEARCH RESULTS ---
  const globalSearchResults = useMemo(() => {
      if (!globalSearchQuery) return { orders: [], products: [], customers: [] };
      const q = globalSearchQuery.toLowerCase();
      
      const orders = adminOrders.filter(o => 
          o.id.toLowerCase().includes(q) || 
          (o.full_name || '').toLowerCase().includes(q) ||
          (o.profiles?.full_name || '').toLowerCase().includes(q)
      ).slice(0, 3);

      const products = adminProducts.filter(p => 
          p.name.toLowerCase().includes(q)
      ).slice(0, 3);

      const customers = adminCustomers.filter(c => 
          (c.full_name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q)
      ).slice(0, 3);

      return { orders, products, customers };
  }, [globalSearchQuery, adminOrders, adminProducts, adminCustomers]);


  // --- USER EFFECTS ---
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !isAdmin) {
      getOrders().then(data => setUserOrders(data || []));
      const fetchVoucherCount = async () => {
        const { count } = await supabase.from('used_vouchers').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        setUsedVoucherCount(count || 0);
      };
      const fetchMyVouchers = async () => {
        const { data } = await supabase.from('redeemed_vouchers').select('*').eq('user_id', user.id).eq('is_used', false).order('redeemed_at', { ascending: false });
        if (data && data.length > 0) {
          // For vouchers without embedded details, fetch from vouchers table
          const needsUpdate = data.filter(v => !v.type || !v.value);
          if (needsUpdate.length > 0) {
            const codes = [...new Set(needsUpdate.map(v => v.original_code || v.voucher_code.split('_')[0]))];
            const { data: vouchersData } = await supabase.from('vouchers').select('*').in('code', codes);
            const voucherMap = {};
            (vouchersData || []).forEach(v => { voucherMap[v.code] = v; });
            const enriched = data.map(v => {
              if (!v.type || !v.value) {
                const baseCode = v.original_code || v.voucher_code.split('_')[0];
                const source = voucherMap[baseCode];
                if (source) {
                  return { ...v, type: source.type, value: source.value, description: source.description, min_order: source.min_order, target_category: source.target_category, valid_until: source.valid_until, icon: source.icon };
                }
              }
              return v;
            });
            setMyVouchers(enriched);
          } else {
            setMyVouchers(data);
          }
        } else {
          setMyVouchers([]);
        }
      };
      // Fetch redeemable vouchers from database
      getRedeemableVouchers().then(data => setRedeemableVouchers(data || []));
      fetchVoucherCount();
      fetchMyVouchers();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (profile?.address) {
      try {
        const parsed = JSON.parse(profile.address);
        setAddresses(Array.isArray(parsed) ? parsed : []);
      } catch (e) { setAddresses([]); }
    }
  }, [profile]);


  // --- HANDLERS ---
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // -- ADMIN HANDLERS --
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({ title: "Cập nhật thành công", description: `Đơn hàng #${orderId.slice(0, 8)} -> ${newStatus}` });

      // Update local state for immediate feedback
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }

      setRefreshTrigger(p => p + 1);
    } catch (e) { toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" }); }
  };

  const handleProductSave = async (data) => {
    try {
        // Prepare data (handling discounts and nulls same as before)
        const cleanData = { ...data, price: Number(data.price), discount: data.discount ? Number(data.discount) : null, sale_price: data.sale_price ? Number(data.sale_price) : null };
        if (editingProduct) await adminUpdateProduct(editingProduct.id, cleanData);
        else await adminAddProduct(cleanData);
        
        toast({ title: "Thành công", description: editingProduct ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm mới" });
        setIsProductDialogOpen(false);
        setRefreshTrigger(p => p+1);
    } catch (e) {
        toast({ title: "Lỗi", description: "Không thể lưu sản phẩm", variant: "destructive" });
    }
  };
  
  const handleCustomerSave = async (id, data) => {
      try {
          await adminUpdateProfile(id, data);
          toast({ title: "Thành công", description: "Đã cập nhật thông tin khách hàng" });
          setIsCustomerDetailOpen(false);
          setRefreshTrigger(p => p + 1);
      } catch (e) {
          toast({ title: "Lỗi", description: "Không thể cập nhật khách hàng", variant: "destructive" });
      }
  };

  const handleProductDelete = async (id) => {
      if(!window.confirm("Bạn có chắc chắn muốn xóa?")) return;
      try {
          await adminDeleteProduct(id);
          toast({ title: "Đã xóa", description: "Sản phẩm đã được xóa" });
          setRefreshTrigger(p => p+1);
      } catch (e) {
          toast({ title: "Lỗi", description: "Không thể xóa sản phẩm", variant: "destructive" });
      }
  };
  
  // -- Filter Handlers --
  const handleProductCategoryChange = (value) => {
    setProductCategoryFilter(value);
    setProductPage(1);
  }

  // -- Voucher Handlers --
  const handleVoucherSave = async (data) => {
    try {
      if (editingVoucher) {
        await updateVoucher(editingVoucher.id, data);
        toast({ title: "Thành công", description: "Đã cập nhật voucher" });
      } else {
        await createVoucher(data);
        toast({ title: "Thành công", description: "Đã tạo voucher mới" });
      }
      setIsVoucherDialogOpen(false);
      setEditingVoucher(null);
      setRefreshTrigger(p => p + 1);
    } catch (e) {
      toast({ title: "Lỗi", description: e.message || "Không thể lưu voucher", variant: "destructive" });
    }
  };

  const handleVoucherDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa voucher này?")) return;
    try {
      await deleteVoucher(id);
      toast({ title: "Đã xóa", description: "Voucher đã được xóa" });
      setRefreshTrigger(p => p + 1);
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể xóa voucher", variant: "destructive" });
    }
  };

  // --- AVATAR UPLOAD HANDLER ---
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Lỗi", description: "Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP)", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Ảnh quá lớn. Tối đa 2MB.", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Delete old avatar if exists (cleanup)
      if (profile?.avatar_url) {
        try {
          // Extract file path from URL
          const oldUrl = new URL(profile.avatar_url);
          const pathMatch = oldUrl.pathname.match(/\/avatars\/(.+)$/);
          if (pathMatch && pathMatch[1]) {
            const oldFilePath = decodeURIComponent(pathMatch[1]);
            await supabase.storage.from('avatars').remove([oldFilePath]);
            console.log('Deleted old avatar:', oldFilePath);
          }
        } catch (deleteError) {
          // Ignore delete errors, continue with upload
          console.warn('Could not delete old avatar:', deleteError);
        }
      }

      // Generate unique filename (use fixed name for easy cleanup)
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage (upsert to overwrite if same name)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message?.includes('bucket') || uploadError.statusCode === 400) {
          toast({
            title: "Cần tạo Storage Bucket",
            description: "Vui lòng tạo bucket 'avatars' trong Supabase Storage.",
            variant: "destructive"
          });
          return;
        }
        throw uploadError;
      }

      // Get public URL with cache-busting timestamp
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add timestamp to force browser refresh
      const avatarUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: avatarUrlWithCacheBust });
      await fetchProfile(user.id);

      toast({ title: "Thành công", description: "Đã cập nhật ảnh đại diện!" });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({ title: "Lỗi", description: "Không thể tải lên ảnh. Vui lòng thử lại.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };
   // --- USER HANDLERS ---
  const handleSaveAddress = async (data) => {
    const newAddresses = editingAddress 
        ? addresses.map(a => a.id === editingAddress.id ? {...a, ...data} : a)
        : [...addresses, {id: Date.now().toString(), ...data}];
    await updateProfile({ address: JSON.stringify(newAddresses) });
    await fetchProfile(user.id);
    setIsAddressDialogOpen(false); setEditingAddress(null);
  };
  
  const handleDeleteAddress = async (id) => {
    const newAddresses = addresses.filter(a => a.id !== id);
    await updateProfile({ address: JSON.stringify(newAddresses) });
    await fetchProfile(user.id);
  };

  const handleUserCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      console.log('=== USER CANCEL ORDER ===');
      console.log('Order ID:', orderId);

      await updateOrderStatus(orderId, 'Cancelled');
      console.log('Order status updated to Cancelled');

      // Refund voucher and points
      console.log('Calling refundOrderOnCancel...');
      const refundResult = await refundOrderOnCancel(orderId);
      console.log('Refund result:', refundResult);

      let description = "Đơn hàng của bạn đã được hủy thành công.";
      if (refundResult.success) {
        if (refundResult.voucherRefunded) description += " Voucher đã được hoàn lại vào kho.";
        if (refundResult.pointsDeducted > 0) description += ` Đã trừ ${refundResult.pointsDeducted} điểm.`;
      }
      toast({ title: "Đã hủy đơn hàng", description });

      setUserOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));

      // Refresh profile to show updated points
      if (user) await fetchProfile(user.id);
    } catch (e) {
      console.error('Cancel order error:', e);
      toast({ title: "Lỗi", description: "Không thể hủy đơn hàng.", variant: "destructive" });
    }
  };

  const handleBuyAgain = (order) => {
      if (!order.order_items || order.order_items.length === 0) {
          toast({ title: "Lỗi", description: "Không tìm thấy thông tin sản phẩm", variant: "destructive" });
          return;
      }
      
      order.order_items.forEach(item => {
          const productToAdd = {
              id: item.product_id,
              name: item.products?.name,
              image: item.products?.image,
              price: item.price
          };
          addToCart(productToAdd, item.quantity);
      });
      toast({ title: "Đã thêm vào giỏ", description: "Các sản phẩm đã được thêm vào giỏ hàng của bạn." });
      navigate('/cart');
  };

  const handleRedeemReward = async (reward) => {
    if(!profile) return;
    const currentPoints = profile.points || 0;
    
    if (currentPoints < reward.cost) {
        toast({ title: "Không đủ điểm", description: `Bạn còn thiếu ${reward.cost - currentPoints} điểm nữa.`, variant: "destructive" });
        return;
    }
    
    if(!window.confirm(`Bạn có chắc muốn đổi ${reward.cost} điểm lấy "${reward.name}"?`)) return;

    setRedeemingId(reward.id);
    try {
        // Generate a random code suffix
        const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const voucherCode = `${reward.code}_${codeSuffix}`;

        // 1. Deduct points
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ points: currentPoints - reward.cost })
            .eq('id', user.id);
            
        if(updateError) throw updateError;
        
        // 2. Add voucher
        const { data: voucher, error: insertError } = await supabase
            .from('redeemed_vouchers')
            .insert([{
                user_id: user.id,
                voucher_code: voucherCode,
                redeemed_at: new Date().toISOString(),
                is_used: false
            }])
            .select()
            .single();
            
        if(insertError) throw insertError;
        
        // 3. Update local state
        await fetchProfile(user.id);
        setMyVouchers([voucher, ...myVouchers]);
        
        toast({ title: "Đổi quà thành công", description: "Voucher đã được thêm vào kho của bạn." });
        
    } catch (e) {
        console.error(e);
        toast({ title: "Lỗi", description: "Không thể đổi quà. Vui lòng thử lại.", variant: "destructive" });
    } finally {
        setRedeemingId(null);
    }
  };

  // Helper Form
  const AddressForm = ({ address, onSave, onCancel }) => {
    const [formData, setFormData] = useState(address || { full_name: '', phone: '', address: '' });
    return (
      <div className="space-y-3">
        <Input placeholder="Họ tên" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="rounded-xl" />
        <Input placeholder="Số điện thoại" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl" />
        <Textarea placeholder="Địa chỉ chi tiết" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl" />
        <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onCancel} className="rounded-xl">Hủy</Button>
            <Button onClick={() => onSave(formData)} className="bg-yellow-400 text-yellow-900 font-bold rounded-xl">Lưu</Button>
        </div>
      </div>
    );
  };

  // --- FILTERED DATA (ADMIN) ---
  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.toLowerCase(); // Only use local filter
    
    return adminOrders.filter(order => {
      const matchSearch = 
        order.id.toLowerCase().includes(q) ||
        (order.full_name && order.full_name.toLowerCase().includes(q)) || 
        (order.phone && order.phone.includes(q)) || 
        (order.address && order.address.toLowerCase().includes(q)) || 
        // Fallback to profile data
        order.profiles?.full_name?.toLowerCase().includes(q) ||
        order.profiles?.email?.toLowerCase().includes(q) ||
        order.profiles?.phone?.includes(q) ||
        (order.profiles?.address && order.profiles.address.toLowerCase().includes(q));
      
      const matchStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [adminOrders, orderSearchQuery, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
     // Only use local filter (category) - product search is typically handled by global search in this new design or we could add a local search bar if needed.
     // But previous code had no local product search bar, just the global one.
     // The prompt says "Change the search functionality to display results in a dropdown list below the search input (not filter the current page)".
     // This implies the page content is unfiltered by the global search.
     return adminProducts.filter(product => {
         const matchCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
         return matchCategory;
     });
  }, [adminProducts, productCategoryFilter]);

  // Customers table - no local search required by prompt, but typically good to have.
  // I will assume it just lists all, paginated.
  const filteredCustomers = useMemo(() => {
    return adminCustomers;
  }, [adminCustomers]);

  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ITEMS_PER_PAGE, orderPage * ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice((customerPage - 1) * ITEMS_PER_PAGE, customerPage * ITEMS_PER_PAGE);

  // --- ORDER DETAIL MODAL HELPERS ---
  const getDetailPaginatedItems = () => {
    if (!selectedOrder || !selectedOrder.order_items) return [];
    return selectedOrder.order_items.slice(
      (detailProductPage - 1) * DETAIL_ITEMS_PER_PAGE,
      detailProductPage * DETAIL_ITEMS_PER_PAGE
    );
  };

  const getTotalDetailPages = () => {
    if (!selectedOrder || !selectedOrder.order_items) return 1;
    return Math.ceil(selectedOrder.order_items.length / DETAIL_ITEMS_PER_PAGE);
  };

  
  // Format relative time (e.g. "2 hours ago")
  const formatRelativeTime = (date) => {
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Vừa xong';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };


  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black z-[200] relative"><Loader2 className="w-8 h-8 text-yellow-500 animate-spin" /></div>;
  }

  // --- RENDER ADMIN OVERLAY ---
  if (isAdmin) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex overflow-hidden font-body">
        <Helmet><title>Admin Dashboard - ChipChip</title></Helmet>

        {/* SIDEBAR */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="hidden md:flex flex-col bg-card border-r border-border h-full shadow-lg z-20 relative transition-all duration-300 ease-in-out"
        >
          {/* Logo Area */}
          <div className="h-20 flex items-center justify-center border-b border-border px-4">
             <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className="w-10 h-10 min-w-[2.5rem] bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-200 dark:shadow-none">
                    <img src="https://horizons-cdn.hostinger.com/9ee84389-1925-41dd-a3e7-6d8a37fcb695/b9b4d3e3ba41b2e5db3158624a392a6e.png" alt="Logo" className="w-full h-full object-cover rounded-xl" />
                </div>
                {isSidebarOpen && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.1}}>
                        <h1 className="font-display font-bold text-xl text-gray-800 dark:text-gray-100 leading-none">ChipChip</h1>
                        <p className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-400 tracking-wider">Admin Panel</p>
                    </motion.div>
                )}
             </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {[
              { id: 'dashboard', label: 'Tổng quan', icon: Home },
              { id: 'orders', label: 'Đơn hàng', icon: Package },
              { id: 'products', label: 'Sản phẩm', icon: ShoppingBag },
              { id: 'customers', label: 'Khách hàng', icon: Users },
              { id: 'vouchers', label: 'Voucher', icon: Ticket },
              { id: 'tiers', label: 'Hạng TV', icon: Award },
              { id: 'support', label: 'Hỗ trợ', icon: MessageCircle },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${activeTab === item.id 
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 font-bold shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'}`}
              >
                {activeTab === item.id && <motion.div layoutId="active-nav" className="absolute left-0 w-1 h-6 bg-yellow-400 rounded-r-full" />}
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="p-3 border-t border-border space-y-2">
             <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all">
                <ArrowUpRight className="w-5 h-5" />
                {isSidebarOpen && <span>Về cửa hàng</span>}
             </button>
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <LogOut className="w-5 h-5" />
                {isSidebarOpen && <span>Đăng xuất</span>}
             </button>
          </div>
          
          {/* Toggle Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="absolute -right-3 top-24 bg-card border border-border rounded-full p-1 shadow-md text-gray-400 hover:text-yellow-500 z-50"
          >
             {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </motion.aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-muted/50 relative">
          
           {/* Header */}
          <header className="h-20 px-8 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-display font-bold text-foreground capitalize">{activeTab === 'dashboard' ? 'Tổng quan' : activeTab === 'orders' ? 'Quản lý đơn hàng' : activeTab === 'products' ? 'Quản lý sản phẩm' : activeTab === 'vouchers' ? 'Quản lý Voucher' : activeTab === 'tiers' ? 'Hạng thành viên' : activeTab === 'support' ? 'Hỗ trợ khách hàng' : 'Khách hàng'}</h2>
              {isAdminLoading && <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />}
            </div>

              <div className="flex items-center gap-4">
                  {/* Global Search with Dropdown */}
                  <div className="relative hidden md:block group" ref={searchRef}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm w-72 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-yellow-400/50 transition-all outline-none dark:text-white" 
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        onFocus={() => globalSearchQuery && setIsSearchDropdownOpen(true)}
                      />
                      
                      {/* Search Dropdown Results */}
                      <AnimatePresence>
                          {isSearchDropdownOpen && globalSearchQuery && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 right-0 top-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 overflow-hidden"
                              >
                                  {/* Orders Section */}
                      {globalSearchResults.orders.length > 0 && (
                        <div className="px-2 py-1">
                          <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn hàng</p>
                          {globalSearchResults.orders.map(o => (
                            <div
                              key={o.id}
                              className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between group/item"
                              onClick={() => { setSelectedOrder(o); setIsOrderDetailOpen(true); setIsSearchDropdownOpen(false); }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-700 dark:text-yellow-400"><Package className="w-4 h-4" /></div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">#{o.id.slice(0, 6)}</p>
                                  <p className="text-[10px] text-gray-500">{o.full_name || o.profiles?.full_name}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover/item:text-yellow-500" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Products Section */}
                      {globalSearchResults.products.length > 0 && (
                        <div className="px-2 py-1">
                          <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Sản phẩm</p>
                          {globalSearchResults.products.map(p => (
                            <div
                              key={p.id}
                              className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between group/item"
                              onClick={() => { setEditingProduct(p); setIsProductDialogOpen(true); setIsSearchDropdownOpen(false); }}
                            >
                              <div className="flex items-center gap-3">
                                <img src={p.image || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{p.name}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover/item:text-yellow-500" />
                            </div>
                          ))}
                        </div>
                      )}

                                  {/* Customers Section */}
                                  {globalSearchResults.customers.length > 0 && (
                                      <div className="px-2 py-1">
                                          <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Khách hàng</p>
                                          {globalSearchResults.customers.map(c => (
                                              <div 
                                                key={c.id} 
                                                className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between group/item"
                                                onClick={() => { setSelectedCustomer(c); setIsCustomerDetailOpen(true); setIsSearchDropdownOpen(false); }}
                                              >
                                                  <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">{(c.full_name || 'U')[0]}</div>
                                                      <div>
                                                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{c.full_name}</p>
                                                          <p className="text-[10px] text-gray-500">{c.phone || c.email}</p>
                                                      </div>
                                                  </div>
                                                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover/item:text-yellow-500" />
                                              </div>
                                          ))}
                                      </div>
                                  )}

                                  {/* No Results */}
                                  {globalSearchResults.orders.length === 0 && globalSearchResults.products.length === 0 && globalSearchResults.customers.length === 0 && (
                                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                          Không tìm thấy kết quả phù hợp
                                      </div>
                                  )}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>

                  <div className="w-px h-8 bg-border mx-2 hidden md:block"></div>
                  <div className="flex items-center gap-3">
                     <div className="relative" ref={notificationRef}>
                         <button 
                            className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-gray-500 hover:text-yellow-600 hover:shadow-md transition-all"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                         >
                            <Bell className="w-5 h-5" />
                            {recentOrderNotifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
                         </button>
                         
                         {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 z-50 origin-top-right"
                      >
                        <h4 className="font-bold text-gray-800 dark:text-white mb-3 text-sm">Đơn hàng mới nhất</h4>
                        <div className="space-y-3">
                          {recentOrderNotifications.map(notif => (
                            <div key={notif.id} className="flex gap-3 items-start p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" onClick={() => {
                              const order = adminOrders.find(o => o.id === notif.id);
                              if (order) { setSelectedOrder(order); setIsOrderDetailOpen(true); setIsNotificationsOpen(false); }
                            }}>
                              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">Đơn hàng #{notif.id.slice(0, 6)}</p>
                                <p className="text-[10px] text-gray-500">từ {notif.customer} - {new Intl.NumberFormat('vi-VN').format(notif.amount)}đ</p>
                                <p className="text-[10px] text-blue-500 font-medium mt-0.5">{formatRelativeTime(notif.time)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-bold shadow-lg">
                  A
                </div>
              </div>
            </div>
          </header>

           {/* Content Scroll Area */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24">
              
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
                   {/* Stats Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { title: 'Tổng doanh thu', value: new Intl.NumberFormat('vi-VN').format(adminStats.totalRevenue) + 'đ', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                        { title: 'Tổng đơn hàng', value: adminStats.totalOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { title: 'Đang xử lý', value: adminStats.pendingOrders, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                        { title: 'Khách hàng', value: adminStats.userCount, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                      ].map((stat, idx) => (
                        <div key={idx} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 group">
                           <div className="flex justify-between items-start mb-4">
                              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                 <stat.icon className="w-6 h-6" />
                              </div>
                              <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-full">Tháng này</span>
                           </div>
                           <h3 className="text-2xl font-display font-bold text-foreground">{stat.value}</h3>
                           <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                        </div>
                      ))}
                   </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-border shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-violet-500" />
                        Doanh thu {revenueViewMode === 'weekly' ? '(12 tuần gần nhất)' : '(Hoàn thành)'}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex bg-muted rounded-xl p-1">
                          <button
                            onClick={() => setRevenueViewMode('weekly')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${revenueViewMode === 'weekly'
                              ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                              }`}
                          >
                            Tuần
                          </button>
                          <button
                            onClick={() => setRevenueViewMode('monthly')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${revenueViewMode === 'monthly'
                              ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                              }`}
                          >
                            Tháng
                          </button>
                        </div>
                        {/* Year Selector - only for monthly view */}
                        {revenueViewMode === 'monthly' && (
                          <Select value={String(revenueYear)} onValueChange={(v) => setRevenueYear(Number(v))}>
                            <SelectTrigger className="w-28 rounded-xl bg-muted border-none h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {availableYears.map(y => <SelectItem key={y} value={String(y)}>Năm {y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-9 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/30"
                          onClick={() => exportRevenueToExcel(monthlyRevenue, weeklyRevenue, adminOrders, revenueYear)}
                        >
                          <Download className="w-3 h-3 mr-1" /> Xuất báo cáo
                        </Button>
                      </div>
                    </div>
                    <div className="h-64">
                      <RevenueAreaChart
                        data={revenueViewMode === 'weekly' ? weeklyRevenue : monthlyRevenue}
                        viewMode={revenueViewMode}
                      />
                    </div>
                  </div>
                  
                      {/* Donut Chart (Status) */}
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-500" /> Trạng thái đơn</h3>
                        <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
                          <div className="w-full h-full">
                            <OrderStatusPieChart data={orderStatusDistribution} />
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
                            <span className="block text-3xl font-display font-bold text-foreground">{adminOrders.length}</span>
                            <span className="text-xs text-gray-400 uppercase font-bold">Tổng đơn</span>
                          </div>
                        </div>
                      </div>
                   </div>

                   {/* Top Products & Top Customers */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Top sản phẩm bán chạy</h3>
                          <div className="space-y-4">
                             {topSellingProducts.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i===0?'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': i===1?'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300': i===2?'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400':'bg-gray-50 dark:bg-slate-800 text-gray-400'}`}>#{i+1}</div>
                                   <img src={p.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'} className="w-12 h-12 rounded-xl object-cover border border-border" alt="" />
                                   <div className="flex-1 min-w-0">
                                      <p className="font-bold text-foreground truncate">{p.name}</p>
                                      <p className="text-xs text-gray-500">{p.quantity} đã bán</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="font-bold text-green-600 text-sm">{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(p.revenue)}đ</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                      </div>
                      
                      {/* Top Customers */}
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                              <Users className="w-5 h-5 text-blue-500" /> Top khách hàng
                          </h3>
                          <div className="space-y-4">
                               {topCustomers.map((c, i) => (
                                  <div key={c.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i===0?'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': i===1?'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300': i===2?'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400':'bg-gray-50 dark:bg-slate-800 text-gray-400'}`}>#{i+1}</div>
                                     
                                     <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                        {c.name.charAt(0).toUpperCase()}
                                     </div>
                                     
                                     <div className="flex-1 min-w-0">
                                        <p className="font-bold text-foreground truncate">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.count} đơn hàng</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="font-bold text-blue-600 text-sm">{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(c.spent)}đ</p>
                                     </div>
                                  </div>
                               ))}
                               {topCustomers.length === 0 && <div className="text-center text-gray-400 py-4">Chưa có dữ liệu</div>}
                          </div>
                      </div>
                   </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Tìm mã đơn, tên, sđt, địa chỉ..." className="pl-9 bg-muted border-border rounded-xl" value={orderSearchQuery} onChange={e => setOrderSearchQuery(e.target.value)} />
                    </div>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-40 rounded-xl bg-muted border-border"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="Pending">Chờ xử lý</SelectItem>
                        <SelectItem value="Shipping">Đang giao</SelectItem>
                        <SelectItem value="Completed">Hoàn thành</SelectItem>
                        <SelectItem value="Cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                    variant="outline"
                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                    onClick={() => exportOrdersToExcel(filteredOrders, 'DanhSachDonHang')}
                  >
                    <Download className="w-4 h-4 mr-2" /> Xuất Excel
                  </Button>
                  </div>

                  <div className="space-y-3">
                    {paginatedOrders.map(order => (
                      <div key={order.id} className="group bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'Completed' ? 'bg-green-500' : order.status === 'Pending' ? 'bg-yellow-500' : order.status === 'Shipping' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                          
                          <div className="md:w-20 pl-4">
                             <span className="font-mono font-bold text-gray-500 text-xs">#{order.id.slice(0,6)}</span>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-gray-500">
                                   <User className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="font-bold text-foreground text-sm">{order.full_name || order.profiles?.full_name || 'Khách vãng lai'}</p>
                                   <p className="text-xs text-gray-500 line-clamp-1">{order.address || (order.profiles?.address ? JSON.parse(order.profiles.address)[0]?.address || 'Chưa có địa chỉ' : 'Chưa có địa chỉ')}</p>
                                </div>
                             </div>
                             
                             <div className="flex flex-col justify-center">
                                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                                <p className="font-bold text-foreground">{new Intl.NumberFormat('vi-VN').format(order.total_price)}đ</p>
                             </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2 md:mt-0 md:ml-auto">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
                                onClick={() => { setSelectedOrder(order); setIsOrderDetailOpen(true); }}
                             >
                                <Eye className="w-4 h-4" />
                             </Button>
                             <Select value={order.status} onValueChange={(v) => handleOrderStatusUpdate(order.id, v)}>
                                <SelectTrigger className={`h-9 w-32 rounded-lg border-none font-bold text-xs ${order.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : order.status === 'Shipping' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Chờ xử lý</SelectItem>
                                  <SelectItem value="Shipping">Đang giao</SelectItem>
                                  <SelectItem value="Completed">Hoàn thành</SelectItem>
                                  <SelectItem value="Cancelled">Đã hủy</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                      </div>
                    ))}
                    {paginatedOrders.length === 0 && <div className="text-center py-10 text-gray-400">Không tìm thấy đơn hàng nào.</div>}
                  </div>
                  
                  <Pagination currentPage={orderPage} totalPages={Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)} onPageChange={setOrderPage} />
                </div>
              )}

              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex flex-wrap justify-between items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border">
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {filteredProducts.length} sản phẩm
                        <Select value={productCategoryFilter} onValueChange={handleProductCategoryChange}>
                           <SelectTrigger className="w-48 rounded-xl bg-muted border-none h-9 text-xs"><SelectValue placeholder="Tất cả danh mục" /></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">Tất cả danh mục</SelectItem>
                              {productCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                      </div>
                      
                      <Button onClick={() => { setEditingProduct(null); setIsProductDialogOpen(true); }} className="bg-yellow-400 text-yellow-900 font-bold rounded-xl shadow-md shadow-yellow-200 dark:shadow-none">
                         <PlusCircle className="w-4 h-4 mr-2" /> Thêm mới
                      </Button>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {paginatedProducts.map(product => (
                        <div key={product.id} className="bg-card rounded-3xl p-4 border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                           <div className="aspect-square bg-gray-50 dark:bg-slate-800 rounded-2xl mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                              <img src={product.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                 <Button size="icon" variant="secondary" className="rounded-full w-9 h-9 bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:text-blue-600" onClick={() => { setEditingProduct(product); setIsProductDialogOpen(true); }}>
                                    <Edit className="w-4 h-4" />
                                 </Button>
                                 <Button size="icon" variant="secondary" className="rounded-full w-9 h-9 bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:text-red-600" onClick={() => handleProductDelete(product.id)}>
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </div>
                           </div>
                           <h4 className="font-bold text-foreground text-sm line-clamp-1" title={product.name}>{product.name}</h4>
                           <div className="flex justify-between items-end mt-1">
                              <div>
                                <p className="text-xs text-gray-400">{product.category}</p>
                                <p className="font-bold text-green-600">{new Intl.NumberFormat('vi-VN').format(product.sale_price || product.price)}đ</p>
                              </div>
                              {product.discount > 0 && <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 px-1.5 py-0.5 rounded-md">-{product.discount}%</span>}
                           </div>
                        </div>
                      ))}
                   </div>
                   <Pagination currentPage={productPage} totalPages={Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)} onPageChange={setProductPage} />
                </div>
              )}

            {/* CUSTOMERS TAB */}
            {activeTab === 'customers' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-border">
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Khách hàng</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Liên hệ</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Điểm tích lũy</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedCustomers.map(cust => (
                        <tr key={cust.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 text-white flex items-center justify-center font-bold text-sm">
                                {cust.avatar_url ? (
                                  <img src={cust.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  (cust.full_name || 'U')[0].toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-sm">{cust.full_name || 'No Name'}</p>
                                <p className="text-xs text-gray-400">ID: {cust.id.slice(0, 6)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">{cust.email}</p>
                            <p className="text-xs text-gray-400">{cust.phone || '---'}</p>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                              {cust.points || 0} pts
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              onClick={() => { setSelectedCustomer(cust); setIsCustomerDetailOpen(true); }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={customerPage} totalPages={Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)} onPageChange={setCustomerPage} />
              </div>
            )}
            {/* VOUCHER TAB */}
            {activeTab === 'vouchers' && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold font-display text-foreground">Quản lý Voucher</h2>
                    <p className="text-sm text-gray-500">{adminVouchers.length} voucher</p>
                  </div>
                  <Button onClick={() => { setEditingVoucher(null); setIsVoucherDialogOpen(true); }} className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold rounded-xl">
                    <PlusCircle className="w-4 h-4 mr-2" /> Thêm voucher
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <th className="p-4 font-bold">Mã</th>
                        <th className="p-4 font-bold">Loại</th>
                        <th className="p-4 font-bold">Giá trị</th>
                        <th className="p-4 font-bold">Mô tả</th>
                        <th className="p-4 font-bold">Đã dùng</th>
                        <th className="p-4 font-bold">Hết hạn</th>
                        <th className="p-4 font-bold">Trạng thái</th>
                        <th className="p-4 font-bold text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminVouchers.slice((voucherPage - 1) * VOUCHERS_PER_PAGE, voucherPage * VOUCHERS_PER_PAGE).map(v => (
                        <tr key={v.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{v.icon || '🎁'}</span>
                              <span className="font-bold text-foreground">{v.code}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${v.type === 'percent' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                              {v.type === 'percent' ? '%' : 'đ'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-foreground">
                            {v.type === 'percent' ? `${v.value}%` : `${new Intl.NumberFormat('vi-VN').format(v.value)}đ`}
                            {v.max_discount && <span className="text-xs text-gray-400 block">max {new Intl.NumberFormat('vi-VN').format(v.max_discount)}đ</span>}
                          </td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{v.description}</td>
                          <td className="p-4">
                            <span className="text-sm font-medium text-foreground">{v.used_count || 0}</span>
                            {v.usage_limit && <span className="text-gray-400">/{v.usage_limit}</span>}
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {v.valid_until ? new Date(v.valid_until).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${v.is_public ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {v.is_public ? 'Công khai' : `${v.points_cost || 0} pts`}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => { setEditingVoucher(v); setIsVoucherDialogOpen(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleVoucherDelete(v.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={voucherPage} totalPages={Math.ceil(adminVouchers.length / VOUCHERS_PER_PAGE)} onPageChange={setVoucherPage} />
              </div>
            )}

            {/* TIERS TAB */}
            {activeTab === 'tiers' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-border">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Quản lý hạng thành viên
                  </div>
                  <Button onClick={() => { setEditingTier(null); setTierFormData({ name: '', slug: '', min_points: 0, discount_percent: 0, free_shipping_threshold: null, icon: '🎖️', badge_color: 'gray', benefits: [] }); setIsTierDialogOpen(true); }} className="bg-yellow-400 text-yellow-900 font-bold rounded-xl shadow-md">
                    <PlusCircle className="w-4 h-4 mr-2" /> Thêm hạng
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {adminTiers.map(tier => (
                    <div key={tier.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-lg transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{tier.icon}</span>
                        <div>
                          <h3 className="font-bold text-foreground">{tier.name}</h3>
                          <p className="text-xs text-gray-500">Slug: {tier.slug}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Điểm tối thiểu:</span>
                          <span className="font-bold text-foreground">{tier.min_points.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">% Giảm giá:</span>
                          <span className="font-bold text-green-600">{tier.discount_percent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Free ship từ:</span>
                          <span className="font-bold text-blue-600">
                            {tier.free_shipping_threshold === null ? '—' : tier.free_shipping_threshold === 0 ? 'Mọi đơn' : `${(tier.free_shipping_threshold / 1000).toFixed(0)}k`}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => { setEditingTier(tier); setTierFormData({ name: tier.name, slug: tier.slug, min_points: tier.min_points, discount_percent: tier.discount_percent, free_shipping_threshold: tier.free_shipping_threshold, icon: tier.icon, badge_color: tier.badge_color, benefits: tier.benefits || [] }); setIsTierDialogOpen(true); }}>
                          <Edit className="w-4 h-4 mr-1" /> Sửa
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 rounded-xl" onClick={async () => { if (window.confirm('Xác nhận xóa hạng này?')) { await adminDeleteTier(tier.id); const tiers = await getLoyaltyTiers(); clearTierCache(); setAdminTiers(await getLoyaltyTiers()); toast({ title: 'Đã xóa hạng thành viên' }); } }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {adminTiers.length === 0 && (
                  <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có hạng thành viên nào.</p>
                    <p className="text-sm text-gray-400">Chạy SQL migration để tạo các hạng mặc định.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUPPORT TAB CONTENT */}
            {activeTab === 'support' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                {/* Conversation List */}
                <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Cuộc trò chuyện</h3>
                    <Button variant="ghost" size="icon" onClick={async () => setAdminConversations(await adminGetConversations())} className="h-8 w-8">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {adminConversations.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Chưa có cuộc trò chuyện nào</p>
                        <p className="text-sm">Khi khách hàng cần hỗ trợ, cuộc trò chuyện sẽ hiển thị ở đây.</p>
                      </div>
                    ) : (
                      adminConversations.map(conv => (
                        <button
                          key={conv.id}
                          onClick={async () => {
                            setSelectedConversation(conv);
                            setConversationMessages(await getConversationMessages(conv.id));
                            // Subscribe to new messages
                            if (chatSubscriptionRef.current) unsubscribeChannel(chatSubscriptionRef.current);
                            chatSubscriptionRef.current = subscribeToMessages(conv.id, (newMsg) => {
                              setConversationMessages(prev => {
                                if (prev.some(msg => msg.id === newMsg.id)) return prev;
                                return [...prev, newMsg];
                              });
                            });
                          }}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conv.status === 'waiting' ? 'bg-yellow-100 text-yellow-600' :
                              conv.status === 'active' ? 'bg-green-100 text-green-600' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                              <MessageCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground truncate">
                                  {conv.user_email?.split('@')[0] || conv.session_id.slice(0, 8)}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${conv.status === 'waiting' ? 'bg-yellow-200 text-yellow-800' :
                                  conv.status === 'active' ? 'bg-green-200 text-green-800' :
                                    conv.status === 'closed' ? 'bg-gray-200 text-gray-600' :
                                      'bg-blue-200 text-blue-800'
                                  }`}>
                                  {conv.status === 'waiting' ? 'Chờ' : conv.status === 'active' ? 'Đang hỗ trợ' : conv.status === 'closed' ? 'Đã đóng' : 'AI'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(conv.last_message_at || conv.created_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Panel */}
                <div className="lg:col-span-2 bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
                  {!selectedConversation ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="font-medium">Chọn cuộc trò chuyện để bắt đầu hỗ trợ</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{selectedConversation.user_email || selectedConversation.session_id.slice(0, 12)}</h3>
                            <p className="text-xs text-gray-500">{selectedConversation.user_phone || 'Khách vãng lai'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {selectedConversation.status === 'waiting' && (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-xl" onClick={async () => {
                              await adminAssignConversation(selectedConversation.id, user.id);
                              setSelectedConversation({ ...selectedConversation, status: 'active' });
                              toast({ title: 'Đã nhận hỗ trợ' });
                            }}>
                              Nhận hỗ trợ
                            </Button>
                          )}
                          {selectedConversation.status === 'active' && (
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={async () => {
                              await adminCloseConversation(selectedConversation.id);
                              setSelectedConversation({ ...selectedConversation, status: 'closed' });
                              toast({ title: 'Đã đóng cuộc trò chuyện' });
                            }}>
                              Đóng chat
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                        {conversationMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${msg.sender_type === 'user' ? 'bg-white border border-gray-100 rounded-tl-none' :
                              msg.sender_type === 'ai' ? 'bg-blue-50 text-blue-900 rounded-tr-none' :
                                'bg-gradient-to-br from-yellow-400 to-orange-400 text-white rounded-tr-none'
                              }`}>
                              <div className="text-xs font-bold mb-1 opacity-70">
                                {msg.sender_type === 'user' ? 'Khách hàng' : msg.sender_type === 'ai' ? 'AI Bot' : 'Bạn'}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <div className="text-[10px] mt-1 opacity-50">{new Date(msg.created_at).toLocaleTimeString('vi-VN')}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input */}
                      {selectedConversation.status === 'active' && (
                        <div className="p-4 border-t border-border">
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!adminChatInput.trim() || isSendingMessage) return;
                            setIsSendingMessage(true);
                            const result = await sendChatMessage(selectedConversation.id, adminChatInput, 'admin', user.id, profile?.full_name || 'Admin');
                            if (result.success) {
                              setConversationMessages(prev => {
                                if (prev.some(msg => msg.id === result.data.id)) return prev;
                                return [...prev, result.data];
                              });
                              setAdminChatInput('');
                            }
                            setIsSendingMessage(false);
                          }} className="flex gap-2">
                            <Input
                              value={adminChatInput}
                              onChange={e => setAdminChatInput(e.target.value)}
                              placeholder="Nhập tin nhắn..."
                              className="flex-1 rounded-xl"
                            />
                            <Button type="submit" disabled={isSendingMessage} className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 rounded-xl">
                              {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                          </form>
                        </div>
                      )}

                      {selectedConversation.status === 'closed' && (
                        <div className="p-4 text-center text-gray-400 text-sm border-t border-border">
                          Cuộc trò chuyện đã đóng
                        </div>
                      )}

                      {selectedConversation.status === 'waiting' && (
                        <div className="p-4 text-center text-yellow-600 text-sm border-t border-border bg-yellow-50">
                          Nhấn "Nhận hỗ trợ" để bắt đầu chat với khách hàng
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
           </div>

           {/* PRODUCT DIALOG (GLOBAL FOR ADMIN) */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl bg-card dark:bg-slate-900">
                <DialogHeader>
                  <DialogTitle className="text-xl font-display text-foreground">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
                </DialogHeader>
                <AdminProductForm product={editingProduct} onSave={handleProductSave} onCancel={() => setIsProductDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            {/* CUSTOMER DETAIL DIALOG */}
            <Dialog open={isCustomerDetailOpen} onOpenChange={setIsCustomerDetailOpen}>
              <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl bg-card dark:bg-slate-900">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display text-foreground">Thông tin khách hàng</DialogTitle>
                </DialogHeader>
                {selectedCustomer && (
                    <CustomerDetailForm 
                        customer={selectedCustomer} 
                        orders={adminOrders} 
                        onSave={handleCustomerSave} 
                        onCancel={() => setIsCustomerDetailOpen(false)} 
                    />
                )}
              </DialogContent>
          </Dialog>
            
          {/* VOUCHER DIALOG */}
          <Dialog open={isVoucherDialogOpen} onOpenChange={setIsVoucherDialogOpen}>
            <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl bg-card dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-display text-foreground">{editingVoucher ? 'Sửa voucher' : 'Thêm voucher mới'}</DialogTitle>
              </DialogHeader>
              <AdminVoucherForm
                voucher={editingVoucher}
                categories={productCategories}
                customers={adminCustomers}
                onSave={handleVoucherSave}
                onCancel={() => setIsVoucherDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
            {/* TIER DIALOG */}
          <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
            <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl bg-card dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-display text-foreground">{editingTier ? 'Sửa hạng thành viên' : 'Thêm hạng mới'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500 mb-1 block">Tên hạng</label>
                    <Input value={tierFormData.name} onChange={e => setTierFormData(p => ({ ...p, name: e.target.value }))} placeholder="VD: Thành viên Vàng" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 mb-1 block">Slug (mã)</label>
                    <Input value={tierFormData.slug} onChange={e => setTierFormData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="VD: gold" className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500 mb-1 block">Icon</label>
                    <Input value={tierFormData.icon} onChange={e => setTierFormData(p => ({ ...p, icon: e.target.value }))} placeholder="🎖️" className="rounded-xl text-2xl text-center" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 mb-1 block">Điểm tối thiểu</label>
                    <Input type="number" value={tierFormData.min_points} onChange={e => setTierFormData(p => ({ ...p, min_points: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 mb-1 block">% Giảm giá</label>
                    <Input type="number" value={tierFormData.discount_percent} onChange={e => setTierFormData(p => ({ ...p, discount_percent: parseFloat(e.target.value) || 0 }))} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-1 block">Free ship từ (đ) - để trống = không có, 0 = mọi đơn</label>
                  <Input type="number" value={tierFormData.free_shipping_threshold ?? ''} onChange={e => setTierFormData(p => ({ ...p, free_shipping_threshold: e.target.value === '' ? null : parseInt(e.target.value) }))} placeholder="VD: 200000" className="rounded-xl" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsTierDialogOpen(false)} className="flex-1 rounded-xl">Hủy</Button>
                  <Button className="flex-1 rounded-xl bg-yellow-400 text-yellow-900 font-bold" onClick={async () => {
                    if (!tierFormData.name || !tierFormData.slug) {
                      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên và slug', variant: 'destructive' });
                      return;
                    }
                    let result;
                    if (editingTier) {
                      result = await adminUpdateTier(editingTier.id, tierFormData);
                    } else {
                      result = await adminCreateTier(tierFormData);
                    }
                    if (result.success) {
                      toast({ title: editingTier ? 'Đã cập nhật' : 'Đã thêm hạng mới' });
                      clearTierCache();
                      setAdminTiers(await getLoyaltyTiers());
                      setIsTierDialogOpen(false);
                    } else {
                      toast({ title: 'Lỗi', description: result.error?.message || 'Không thể lưu', variant: 'destructive' });
                    }
                  }}>
                    {editingTier ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            {/* ORDER DETAIL MODAL */}
            {selectedOrder && (
              <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
                  <DialogContent className="max-w-2xl bg-card rounded-3xl p-6 border-none shadow-2xl">
                     {/* Header */}
                     <div className="flex justify-between items-center pb-4 mb-2">
                         <div className="flex items-center gap-2">
                             <h2 className="text-xl font-bold font-display text-foreground">Chi tiết</h2>
                             <span className="text-xl font-bold font-mono text-yellow-500">#{selectedOrder.id.slice(0,8)}</span>
                         </div>
                     </div>

                     <div className="space-y-4">
                        {/* Customer & Status Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="border border-border bg-muted/50 p-4 rounded-2xl">
                                 <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Khách hàng</h3>
                                 <p className="font-bold text-foreground text-lg">{selectedOrder.full_name || selectedOrder.profiles?.full_name || 'Khách vãng lai'}</p>
                                 <p className="text-gray-500 font-medium">{selectedOrder.phone || selectedOrder.profiles?.phone || 'Chưa có SĐT'}</p>
                             </div>
                             <div className="border border-border bg-muted/50 p-4 rounded-2xl flex flex-col">
                                 <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Trạng thái</h3>
                                 <Select value={selectedOrder.status} onValueChange={(v) => handleOrderStatusUpdate(selectedOrder.id, v)}>
                                    <SelectTrigger className="w-full rounded-xl bg-card border-border mt-auto">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Chờ xử lý</SelectItem>
                                        <SelectItem value="Shipping">Đang giao</SelectItem>
                                        <SelectItem value="Completed">Hoàn thành</SelectItem>
                                        <SelectItem value="Cancelled">Đã hủy</SelectItem>
                                    </SelectContent>
                                 </Select>
                             </div>
                        </div>

                        {/* Address Row */}
                        <div className="border border-border bg-muted/50 p-4 rounded-2xl">
                             <h3 className="text-xs font-bold text-blue-600 uppercase mb-2 tracking-wide underline decoration-2 decoration-blue-200 underline-offset-4">Địa chỉ</h3>
                             <p className="text-gray-700 dark:text-gray-300 font-medium">
                                 {selectedOrder.address 
                                    ? selectedOrder.address 
                                    : (selectedOrder.profiles?.address 
                                        ? (JSON.parse(selectedOrder.profiles.address)[0]?.address || 'Chưa cập nhật địa chỉ') 
                                        : 'Chưa cập nhật địa chỉ')}
                             </p>
                        </div>
                        {/* Customer Note */}
                        {selectedOrder.note && (
                            <div className="border border-border bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl">
                                <h3 className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase mb-2 tracking-wide flex items-center gap-1">
                                    <span>📝</span> Ghi chú từ khách hàng
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 font-medium italic">
                                    "{selectedOrder.note}"
                                </p>
                            </div>
                        )}

                         {/* Voucher Info */}
                          {selectedOrder.voucher_code && (
                            <div className="border border-border bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl">
                              <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2 tracking-wide flex items-center gap-1">
                                <Ticket className="w-3 h-3" /> Voucher đã sử dụng
                              </h3>
                              <p className="font-mono font-bold text-purple-700 dark:text-purple-300 text-lg">
                                {selectedOrder.voucher_code.split('_')[0]}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Mã đầy đủ: {selectedOrder.voucher_code}
                              </p>
                            </div>
                          )}

                          {/* Payment Method */}
                          <div className="border border-border bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl">
                            <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-2 tracking-wide flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> Phương thức thanh toán
                            </h3>
                            <p className="font-bold text-green-700 dark:text-green-300 text-lg flex items-center gap-2">
                              {selectedOrder.payment_method === 'vnpay' && (
                                <><span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">VNPAY</span> Thanh toán qua VNPAY</>
                              )}
                              {selectedOrder.payment_method === 'momo' && (
                                <><span className="px-2 py-1 bg-pink-500 text-white text-xs rounded">MoMo</span> Thanh toán qua Ví MoMo</>
                              )}
                              {(!selectedOrder.payment_method || selectedOrder.payment_method === 'cod') && (
                                <><span className="px-2 py-1 bg-yellow-500 text-yellow-900 text-xs rounded">COD</span> Thanh toán khi nhận hàng</>
                              )}
                            </p>
                          </div>

                        {/* Products Section */}
                        <div className="pt-2">
                             <div className="flex items-center justify-between mb-4">
                                 <h3 className="font-bold text-foreground">Sản phẩm ({selectedOrder.order_items?.length || 0})</h3>
                                 <div className="flex items-center gap-1">
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6" 
                                        onClick={() => setDetailProductPage(p => Math.max(1, p - 1))}
                                        disabled={detailProductPage === 1}
                                     >
                                         <ChevronLeft className="w-3 h-3" />
                                     </Button>
                                     <span className="text-xs font-bold text-gray-500 w-8 text-center">{detailProductPage}</span>
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => setDetailProductPage(p => Math.min(getTotalDetailPages(), p + 1))}
                                        disabled={detailProductPage >= getTotalDetailPages()}
                                     >
                                         <ChevronRight className="w-3 h-3" />
                                     </Button>
                                 </div>
                             </div>
                             
                             <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                 {getDetailPaginatedItems().map((item, idx) => (
                                     <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                         <div className="flex items-center gap-4">
                                             <img 
                                                src={item.products?.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142'} 
                                                alt={item.products?.name} 
                                                className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                                             />
                                             <div>
                                                 <p className="font-bold text-sm text-foreground line-clamp-1">{item.products?.name}</p>
                                                 <p className="text-xs text-gray-500">x{item.quantity}</p>
                                             </div>
                                         </div>
                                         <span className="font-bold text-sm text-foreground">{new Intl.NumberFormat('vi-VN').format(item.price)}đ</span>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        {/* Footer Total */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground text-lg">Tổng cộng</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                        onClick={() => exportOrderToPDF(selectedOrder)}
                      >
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    </div>
                    <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400 font-display">{new Intl.NumberFormat('vi-VN').format(selectedOrder.total_price)}đ</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            )}

        </main>
      </div>
    );
  }

  // --- RENDER NORMAL USER PROFILE (Fallback to original design or similar) ---
  return (
    <div className="bg-background min-h-screen pb-20">
      <Helmet>
        <title>Tài khoản - Minimart ChipChip</title>
      </Helmet>

      {/* Header Profile Section */}
      <div className="bg-gradient-to-b from-yellow-100/50 to-transparent dark:from-yellow-900/10 pb-12 pt-10 md:pt-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-card p-1.5 shadow-xl shadow-yellow-100 dark:shadow-none ring-4 ring-card overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-white text-4xl font-display font-bold">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                  </div>
                )}
              </div>
              {/* Upload overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingAvatar ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>
              {/* Hidden input - reuse the same ref */}
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">
                {profile?.full_name || user?.email}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-gray-500 font-medium text-sm">
                <LoyaltyBadge
                  totalPoints={profile?.total_points || 0}
                  points={profile?.points || 0}
                  showProgress={false}
                  compact={true}
                />
              </div>
            </div>
            
            <div className="hidden md:block w-80 h-48 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="flex justify-between items-start mb-8">
                   <span className="font-display font-bold italic text-yellow-400 text-xl">ChipChip Member</span>
                   <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="mt-auto">
                   <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Điểm tích lũy</p>
                   <p className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">{new Intl.NumberFormat('en-US').format(Number(profile?.points) || 0)}</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="container-custom -mt-6">
         <Tabs defaultValue="orders" className="space-y-8">
            <TabsList className="flex w-full bg-white/80 dark:bg-black/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-border h-auto gap-1 sticky top-20 z-30">
               {[
                 { id: 'orders', label: 'Đơn hàng', icon: Package },
              { id: 'tier', label: 'Hạng TV', icon: Award },
              { id: 'loyalty', label: 'Đổi quà', icon: Gift },
              { id: 'profile', label: 'Hồ sơ', icon: User },
              { id: 'addresses', label: 'Địa chỉ', icon: MapPin },
              { id: 'settings', label: 'Cài đặt', icon: Settings }
               ].map(tab => (
                 <TabsTrigger key={tab.id} value={tab.id} className="flex-1 py-3 rounded-xl font-bold data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900 data-[state=active]:shadow-md transition-all">
                    <tab.icon className="w-4 h-4 mr-2" /> <span className="hidden md:inline">{tab.label}</span>
                 </TabsTrigger>
               ))}
            </TabsList>

          {/* Content for Users (Simplified from original for brevity but keeping core functionality) */}
          <TabsContent value="orders">
            <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border">
              <h2 className="text-2xl font-bold font-display mb-6 text-foreground">Lịch sử đơn hàng</h2>
              <div className="space-y-4">
                {userOrders.length > 0 ? userOrders.map(order => (
                  <div key={order.id} className="border border-border rounded-2xl p-4 hover:shadow-md transition-all bg-card">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="font-bold text-foreground mr-2">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{order.status === 'Pending' ? 'Chờ xử lý' : order.status === 'Shipping' ? 'Đang giao' : order.status === 'Completed' ? 'Hoàn thành' : 'Đã hủy'}</span>
                    </div>
                    <div className="font-bold text-lg text-yellow-600 dark:text-yellow-400 mb-4">{new Intl.NumberFormat('vi-VN').format(order.total_price)}đ</div>

                    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => { setSelectedUserOrder(order); setIsUserOrderDetailOpen(true); }}>
                        Chi tiết
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => handleBuyAgain(order)}>
                        Mua lại
                      </Button>
                      {order.status === 'Pending' && (
                        <Button variant="ghost" size="sm" className="rounded-lg text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleUserCancelOrder(order.id)}>
                          Hủy đơn
                        </Button>
                      )}
                    </div>
                  </div>
                )) : <div className="text-center py-10 text-gray-400">Bạn chưa có đơn hàng nào.</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="bg-card rounded-[2rem] p-8 shadow-sm border border-border grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold font-display mb-6 text-foreground">Thông tin cá nhân</h2>

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-200 dark:border-yellow-800 shadow-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    {/* Upload overlay */}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Nhấn để đổi ảnh đại diện</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Họ tên</p>
                    <p className="font-bold text-foreground">{profile?.full_name || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email</p>
                    <p className="font-bold text-foreground">{user.email}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Số điện thoại</p>
                    <p className="font-bold text-foreground">{profile?.phone || 'Chưa cập nhật'}</p>
                  </div>
                  <Button onClick={() => { setEditProfileData({ full_name: profile?.full_name || '', phone: profile?.phone || '' }); setIsEditProfileOpen(true); }} className="w-full bg-yellow-400 text-yellow-900 font-bold rounded-xl mt-4">Cập nhật hồ sơ</Button>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-orange-100 dark:border-orange-800">
                  <Package className="w-10 h-10 text-orange-500 mb-2" />
                  <p className="text-3xl font-bold text-foreground">{userOrders.length}</p>
                  <p className="text-sm text-gray-500">Đơn hàng đã đặt</p>
                </div>
                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-green-100 dark:border-green-800">
                  <Ticket className="w-10 h-10 text-green-500 mb-2" />
                  <p className="text-3xl font-bold text-foreground">{usedVoucherCount}</p>
                  <p className="text-sm text-gray-500">Voucher đã dùng</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* NEW: Separate Tier Tab */}
          <TabsContent value="tier">
            <div className="bg-card rounded-[2rem] p-8 shadow-sm border border-border space-y-8">
              {/* Tier Status */}
              <div>
                <h2 className="text-2xl font-bold font-display mb-6 text-foreground flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" /> Hạng thành viên của bạn
                </h2>
                <LoyaltyBadge
                  totalPoints={profile?.total_points || profile?.points || 0}
                  points={profile?.points || 0}
                  showProgress={true}
                />
              </div>

              {/* All Tiers */}
              <div>
                <h3 className="text-lg font-bold font-display mb-4 text-foreground">Các hạng thành viên</h3>
                <AllTiersDisplay totalPoints={profile?.total_points || 0} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="loyalty">
            {/* Redeem Points Only */}
            <div className="bg-card rounded-[2rem] p-8 shadow-sm border border-border space-y-8">
              {/* Current Points Display */}
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-yellow-900">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Điểm khả dụng</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{(profile?.points || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Redeem Section */}
              <div>
                <h2 className="text-2xl font-bold font-display mb-6 text-foreground">Đổi điểm lấy quà</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {redeemableVouchers.length > 0 ? redeemableVouchers.map(r => (
                    <div key={r.id} className="border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
                      <div className="text-center">
                        <div className="text-4xl mb-3">{r.icon || '🎁'}</div>
                        <h3 className="font-bold text-lg mb-1 text-foreground">{r.type === 'percent' ? `Giảm ${r.value}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(r.value)}đ`}</h3>
                        <p className="text-sm text-gray-500 mb-2">{r.description}</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mb-4 text-xs">
                        {r.min_order && <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-gray-500">Đơn từ {new Intl.NumberFormat('vi-VN').format(r.min_order)}đ</span>}
                        {r.target_category && <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg text-blue-600 dark:text-blue-400">📦 {r.target_category}</span>}
                        {r.valid_until && <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-lg text-orange-600 dark:text-orange-400">⏰ {new Date(r.valid_until).toLocaleDateString('vi-VN')}</span>}
                      </div>
                      <Button
                        className="w-full bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50"
                        disabled={(profile?.points || 0) < r.points_cost || redeemingId === r.id}
                        onClick={() => handleRedeemReward({ ...r, cost: r.points_cost, name: r.code })}
                      >
                        {redeemingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : `Đổi với ${r.points_cost} điểm`}
                      </Button>
                    </div>
                  )) : (
                    <div className="col-span-3 text-center py-8 text-gray-400">Chưa có voucher nào có thể đổi điểm.</div>
                  )}
                </div>
                {/* NEW: My Vouchers Section */}
                <div className="mt-10 border-t border-border pt-8">
                  <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2 text-foreground">
                    <Ticket className="w-5 h-5 text-yellow-500" /> Kho Voucher của bạn
                  </h3>
                  {myVouchers.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {myVouchers.map(v => (
                        <div key={v.id} className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800 rounded-xl p-4 relative overflow-hidden">
                          {/* Decorative circles */}
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-black rounded-full border-r border-yellow-100 dark:border-yellow-800"></div>
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-black rounded-full border-l border-yellow-100 dark:border-yellow-800"></div>

                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{v.icon || '🎁'}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 dark:text-gray-100">
                                {v.type === 'percent' ? `Giảm ${v.value}%` : v.value ? `Giảm ${new Intl.NumberFormat('vi-VN').format(v.value)}đ` : v.voucher_code}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{v.description || 'Voucher ưu đãi'}</p>
                              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                {v.remaining_uses && <span className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-600 dark:text-purple-400 font-bold">🔄 Còn {v.remaining_uses} lần dùng</span>}
                                {v.min_order && <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-gray-500">Đơn từ {new Intl.NumberFormat('vi-VN').format(v.min_order)}đ</span>}
                                {v.target_category && <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">📦 {v.target_category}</span>}
                                {v.valid_until && <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded text-orange-600 dark:text-orange-400">⏰ {new Date(v.valid_until).toLocaleDateString('vi-VN')}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-yellow-100 dark:border-yellow-800">
                            <p className="text-xs text-gray-500">Mã: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{v.voucher_code}</span></p>
                            <Button size="sm" variant="outline" className="bg-white dark:bg-slate-800 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30" onClick={() => {
                              navigator.clipboard.writeText(v.voucher_code);
                              toast({ title: "Đã sao chép", description: "Mã voucher đã được lưu vào clipboard" });
                            }}>
                              <Copy className="w-3 h-3 mr-1" /> Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 border-dashed">
                      <p className="text-gray-400 text-sm">Bạn chưa có voucher nào. Hãy đổi điểm ngay!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="addresses">
            <div className="bg-card rounded-[2rem] p-8 shadow-sm border border-border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-display text-foreground">Sổ địa chỉ</h2>
                <Button onClick={() => { setEditingAddress(null); setIsAddressDialogOpen(true); }} className="bg-yellow-400 text-yellow-900 font-bold rounded-xl"><PlusCircle className="w-4 h-4 mr-2" /> Thêm mới</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {addresses.map(a => (
                  <div key={a.id} className="border border-border bg-muted/50 rounded-2xl p-4 relative group">
                    <div className="font-bold text-foreground mb-1">{a.full_name}</div>
                    <div className="text-sm text-muted-foreground mb-1">{a.phone}</div>
                    <div className="text-sm text-gray-500">{a.address}</div>
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => { setEditingAddress(a); setIsAddressDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDeleteAddress(a.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {addresses.length === 0 && <div className="col-span-2 text-center py-8 text-gray-400">Chưa có địa chỉ nào.</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-card rounded-[2rem] p-8 shadow-sm border border-border max-w-xl mx-auto">
              <h2 className="text-2xl font-bold font-display mb-6 text-center text-foreground">Cài đặt tài khoản</h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-border text-foreground hover:bg-muted" onClick={() => setIsChangePasswordOpen(true)}>
                  <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Đổi mật khẩu</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-border text-foreground hover:bg-muted" onClick={() => setIsForgotPasswordOpen(true)}>
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> Quên mật khẩu</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="destructive" className="w-full h-12 rounded-xl mt-6 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/40 shadow-none" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* DIALOGS FOR USERS */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
         <DialogContent className="rounded-2xl bg-card border-none">
             <DialogHeader><DialogTitle className="text-foreground">Cập nhật hồ sơ</DialogTitle></DialogHeader>
             <div className="space-y-4 py-4">
                <Input placeholder="Họ tên" value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} className="rounded-xl bg-muted border-border text-foreground"/>
                <Input placeholder="Số điện thoại" value={editProfileData.phone} onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} className="rounded-xl bg-muted border-border text-foreground"/>
                <Button onClick={async () => {
                   setIsUpdatingProfile(true);
                   await updateProfile({full_name: editProfileData.full_name, phone: editProfileData.phone});
                   await fetchProfile(user.id);
                   setIsUpdatingProfile(false); setIsEditProfileOpen(false);
                }} className="w-full bg-yellow-400 text-yellow-900 font-bold rounded-xl">{isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
             </div>
         </DialogContent>
      </Dialog>
      
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
         <DialogContent className="rounded-2xl bg-card border-none">
             <DialogHeader><DialogTitle className="text-foreground">{editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle></DialogHeader>
             <AddressForm address={editingAddress} onSave={handleSaveAddress} onCancel={() => setIsAddressDialogOpen(false)} />
         </DialogContent>
      </Dialog>

      {/* User Order Detail Dialog */}
      <Dialog open={isUserOrderDetailOpen} onOpenChange={setIsUserOrderDetailOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-card border-none">
          <DialogHeader>
            <DialogTitle className="text-foreground">Chi tiết đơn hàng #{selectedUserOrder?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selectedUserOrder && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ngày đặt:</span>
                <span className="font-medium text-foreground">{new Date(selectedUserOrder.created_at).toLocaleString('vi-VN')}</span>
              </div>

              {/* Order Tracking Timeline */}
              <div className="border-t border-b border-border py-4 my-2">
                <OrderTracking
                  order={selectedUserOrder}
                  trackingHistory={selectedUserOrder.tracking_history || []}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Người nhận:</span>
                <span className="font-medium text-foreground">{selectedUserOrder.full_name || '---'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="font-medium text-foreground">{selectedUserOrder.phone || '---'}</span>
              </div>
              <div className="text-sm border-t border-b border-border py-2 my-2">
                <span className="text-gray-500 block mb-1">Địa chỉ:</span>
                <span className="font-medium text-foreground">{selectedUserOrder.address}</span>
              </div>
              {/* Payment Method */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Thanh toán:</span>
                <span className={`font-bold flex items-center gap-1 ${selectedUserOrder.payment_method === 'vnpay' ? 'text-blue-600' : selectedUserOrder.payment_method === 'momo' ? 'text-pink-600' : 'text-green-600'}`}>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${selectedUserOrder.payment_method === 'vnpay' ? 'bg-blue-100 dark:bg-blue-900/30' : selectedUserOrder.payment_method === 'momo' ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    {selectedUserOrder.payment_method === 'vnpay' ? 'VNPAY' : selectedUserOrder.payment_method === 'momo' ? 'MoMo' : 'COD'}
                  </span>
                  {selectedUserOrder.payment_method === 'vnpay' && 'Thanh toán online'}
                  {selectedUserOrder.payment_method === 'momo' && 'Ví MoMo'}
                  {(!selectedUserOrder.payment_method || selectedUserOrder.payment_method === 'cod') && 'Khi nhận hàng'}
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {selectedUserOrder.order_items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <img src={item.products?.image} alt="" className="w-10 h-10 rounded border border-border object-cover bg-muted" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground line-clamp-1">{item.products?.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-foreground">{new Intl.NumberFormat('vi-VN').format(item.price)}đ</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-bold text-foreground">Tổng tiền</span>
                <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{new Intl.NumberFormat('vi-VN').format(selectedUserOrder.total_price)}đ</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        
        {/* NEW DIALOGS */}
        <ForgotPasswordDialog isOpen={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
        <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />

    </div>
  );
};

export default Account;