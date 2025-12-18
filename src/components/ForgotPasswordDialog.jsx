import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

const ForgotPasswordDialog = ({ isOpen, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Lỗi", description: "Vui lòng nhập email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Supabase Password Reset Logic
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, // UPDATED: Redirect to the dedicated reset page
      });

      if (error) throw error;

      setIsSent(true);
      toast({ title: "Đã gửi email", description: "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu." });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({ title: "Lỗi gửi yêu cầu", description: error.message || "Không thể gửi email đặt lại mật khẩu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a delay to ensure smooth transition
    setTimeout(() => {
      setIsSent(false);
      setEmail('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white p-0 overflow-hidden shadow-2xl border-0">
        <div className="bg-yellow-400 p-6 flex justify-center items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Mail className="w-8 h-8 text-yellow-900" />
            </div>
        </div>
        
        <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-center text-gray-800">Quên mật khẩu?</DialogTitle>
              <DialogDescription className="text-center text-gray-500">
                {!isSent 
                  ? "Đừng lo! Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu." 
                  : "Email đã được gửi thành công!"}
              </DialogDescription>
            </DialogHeader>

            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-100" 
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gửi liên kết xác nhận"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleClose}
                    className="w-full rounded-xl text-gray-500 hover:text-gray-900"
                  >
                    Hủy bỏ
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="flex flex-col items-center py-2 space-y-6">
                 <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100 w-full justify-center">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Kiểm tra email của bạn</span>
                 </div>
                 <p className="text-sm text-center text-gray-500 px-4">
                    Chúng tôi đã gửi một liên kết đến <strong>{email}</strong>. Hãy nhấp vào liên kết đó để tạo mật khẩu mới.
                 </p>
                 <Button 
                    onClick={handleClose} 
                    className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800"
                 >
                    Đã hiểu, đóng lại
                 </Button>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;