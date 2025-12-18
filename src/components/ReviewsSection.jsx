import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Edit2, Trash2, User, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StarRating from '@/components/StarRating';
import { getReviewsByProductId, addReview, updateReview, deleteReview } from '@/services/reviewService';

const ReviewsSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avg: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingReview, setEditingReview] = useState(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getReviewsByProductId(productId);
      setReviews(data);
      calculateStats(data);
    } catch (error) {
      console.error(error);
      // Don't show toast on load error to avoid spamming if just empty
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!data.length) {
      setStats({ avg: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
      return;
    }

    const sum = data.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / data.length).toFixed(1);
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    data.forEach(r => {
      if (distribution[r.rating] !== undefined) distribution[r.rating]++;
    });

    setStats({ avg: Number(avg), count: data.length, distribution });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (editingReview) {
        const updated = await updateReview(editingReview.id, { rating, comment });
        setReviews(reviews.map(r => r.id === updated.id ? updated : r));
        toast({ title: "Thành công", description: "Đánh giá của bạn đã được cập nhật." });
      } else {
        const newReview = await addReview({
          product_id: productId,
          user_id: user.id,
          rating,
          comment
        });
        setReviews([newReview, ...reviews]);
        toast({ title: "Thành công", description: "Cảm ơn bạn đã đánh giá!" });
      }
      
      // Re-fetch to ensure everything is synced
      fetchReviews(); 
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (reviewId) => {
    setReviewToDelete(reviewId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteReview(reviewToDelete);
      const newReviews = reviews.filter(r => r.id !== reviewToDelete);
      setReviews(newReviews);
      calculateStats(newReviews);
      toast({ title: "Đã xóa", description: "Đánh giá đã được xóa." });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa đánh giá.", variant: "destructive" });
    } finally {
      setDeleteConfirmOpen(false);
      setReviewToDelete(null);
    }
  };

  const openEdit = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || '');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingReview(null);
    setRating(5);
    setComment('');
  };

  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold text-gray-900">Đánh giá & Nhận xét</h2>
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button 
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để viết đánh giá.", variant: "destructive" });
                }
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-400/30"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" /> Viết đánh giá
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/95 backdrop-blur-xl border-white/50 rounded-[2rem] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{editingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá sản phẩm'}</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Bạn thấy sản phẩm thế nào?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-all hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
                <p className="text-yellow-600 font-bold text-lg">{rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Tệ' : 'Rất tệ'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nhận xét của bạn</label>
                <Textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..." 
                  className="min-h-[120px] rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">Hủy</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl">
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Stats Column */}
        <div className="lg:col-span-1">
           <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/60 shadow-sm sticky top-24">
              <div className="text-center mb-6">
                 <div className="text-6xl font-display font-bold text-gray-900 mb-2">{stats.avg}<span className="text-2xl text-gray-400">/5</span></div>
                 <StarRating rating={stats.avg} className="justify-center mb-2" />
                 <p className="text-gray-500 font-medium">{stats.count} đánh giá</p>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                   const count = stats.distribution[star];
                   const percent = stats.count ? (count / stats.count) * 100 : 0;
                   return (
                     <div key={star} className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 w-12 font-bold text-gray-600"><Star className="w-3 h-3 fill-gray-400 text-gray-400" /> {star}</div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                        <div className="w-8 text-right text-gray-400 text-xs">{count}</div>
                     </div>
                   );
                })}
              </div>
           </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
           {isLoading ? (
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 animate-pulse">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                     <div className="space-y-2">
                       <div className="h-4 w-32 bg-gray-200 rounded"></div>
                       <div className="h-3 w-24 bg-gray-200 rounded"></div>
                     </div>
                   </div>
                   <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                   <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                 </div>
               ))}
             </div>
           ) : reviews.length === 0 ? (
              <div className="bg-gray-50 rounded-[2rem] p-10 text-center border-2 border-dashed border-gray-200">
                 <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                    <MessageSquarePlus className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đánh giá nào</h3>
                 <p className="text-gray-500">Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm này nhé!</p>
              </div>
           ) : (
              <AnimatePresence>
                 {reviews.map((review) => (
                    <motion.div 
                       key={review.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100"
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                {review.profiles?.full_name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                             </div>
                             <div>
                                <p className="font-bold text-gray-900">{review.profiles?.full_name || 'Người dùng ẩn danh'}</p>
                                <div className="flex items-center gap-2">
                                   <StarRating rating={review.rating} className="gap-0.5" />
                                   <span className="text-xs text-gray-400 font-medium">• {new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                             </div>
                          </div>
                          
                          {user && user.id === review.user_id && (
                             <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full" onClick={() => openEdit(review)}>
                                   <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDeleteClick(review.id)}>
                                   <Trash2 className="w-4 h-4" />
                                </Button>
                             </div>
                          )}
                       </div>
                       <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                    </motion.div>
                 ))}
              </AnimatePresence>
           )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogTitle className="font-display text-xl">Xóa đánh giá?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Đánh giá của bạn sẽ bị xóa vĩnh viễn.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">Xóa</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewsSection;