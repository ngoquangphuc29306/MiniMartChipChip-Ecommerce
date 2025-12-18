
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

const ChangePasswordDialog = ({ isOpen, onOpenChange }) => {
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic Frontend validation
    if (!passwords.oldPassword) {
        toast({ title: "Thiếu thông tin", description: "Vui lòng nhập mật khẩu hiện tại.", variant: "destructive" });
        return;
    }

    if (passwords.newPassword.length < 6) {
        toast({ title: "Mật khẩu yếu", description: "Mật khẩu mới phải có ít nhất 6 ký tự.", variant: "destructive" });
        return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp.", variant: "destructive" });
      return;
    }

    // 2. Validate New Password is different from Old Password
    if (passwords.oldPassword === passwords.newPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu mới không được trùng với mật khẩu cũ.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      // 3. Get current session to get email
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user || !session.user.email) {
         throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const email = session.user.email;

      // 4. Verify Old Password by attempting to Sign In
      // This is the standard way to verify 'current password' in Supabase without a dedicated API
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: passwords.oldPassword,
      });

      if (signInError) {
        // Map Supabase error to user friendly message
        if (signInError.message.includes("Invalid login credentials")) {
             throw new Error("Mật khẩu hiện tại không chính xác.");
        }
        throw signInError;
      }

      // 5. If verified, proceed to update password
      const { error: updateError } = await supabase.auth.updateUser({ password: passwords.newPassword });

      if (updateError) throw updateError;

      toast({ title: "Thành công", description: "Mật khẩu đã được thay đổi." });
      onOpenChange(false);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' }); // Clear fields
    } catch (error) {
      console.error("Change password error:", error);
      toast({ title: "Lỗi", description: error.message || "Không thể đổi mật khẩu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white border-0 shadow-2xl overflow-hidden p-0">
        <div className="bg-gray-900 p-6 flex justify-center items-center">
             <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                <Lock className="w-8 h-8 text-white" />
            </div>
        </div>

        <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-center text-gray-800">Đổi mật khẩu</DialogTitle>
              <DialogDescription className="text-center text-gray-500">
                Nhập mật khẩu hiện tại và mật khẩu mới của bạn.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Old Password Field */}
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mật khẩu hiện tại</label>
                <div className="relative">
                    <Input
                        type={showOldPassword ? "text" : "password"}
                        name="oldPassword"
                        value={passwords.oldPassword}
                        onChange={handleChange}
                        className="h-12 rounded-xl bg-gray-50 border-gray-200 pr-10"
                        placeholder="••••••••"
                        disabled={loading}
                        required 
                    />
                     <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mật khẩu mới</label>
                <div className="relative">
                    <Input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handleChange}
                        className="h-12 rounded-xl bg-gray-50 border-gray-200 pr-10"
                        placeholder="••••••••"
                        disabled={loading}
                        required
                    />
                     <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
              </div>
              
              {/* Confirm New Password Field */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Xác nhận mật khẩu</label>
                 <Input
                    type={showNewPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
              </div>

              <DialogFooter className="flex-col sm:flex-col gap-2 mt-6">
                <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-100"
                    disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận đổi mật khẩu"}
                </Button>
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => onOpenChange(false)}
                    className="w-full rounded-xl"
                >
                    Hủy bỏ
                </Button>
              </DialogFooter>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
