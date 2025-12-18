
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Lock, Eye, EyeOff, Loader2, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/context/AuthContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { session, loading } = useAuth(); // Use global auth state

  // 'validating' | 'valid' | 'invalid' | 'success'
  const [status, setStatus] = useState('validating');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();
  const mounted = useRef(true);
  const isSuccessRef = useRef(false); // Track success to prevent race conditions

  // STRICT SECURITY: Sign out when leaving this page (unmount)
  useEffect(() => {
    return () => {
      // Force sign out when component unmounts (navigating away)
      supabase.auth.signOut();
    };
  }, []);

  // Effect: Monitor Session from AuthContext
  useEffect(() => {
    mounted.current = true;

    const checkSession = async () => {
      // 0. If we already succeeded, don't revert to invalid due to session loss
      if (isSuccessRef.current || status === 'success') return;

      // 1. If we already have a session, we are good.
      if (session) {
        setStatus('valid');
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // 2. If AuthContext is still loading, wait.
      if (loading) return;

      // 3. AuthContext loaded, but no session. Check for Hash Token.
      const hash = window.location.hash;
      const hasRecoveryToken = hash && hash.includes('type=recovery');

      if (hasRecoveryToken) {
        // Token detected! Do NOT set invalid yet. Wait for Supabase to digest it.
        console.log("Recovery token found. Waiting for session...");
        // We rely on AuthContext (or Supabase client) to fire onAuthStateChange -> SIGNED_IN
        // But we set a backup timeout just in case it fails silently.
        const timeout = setTimeout(() => {
          if (mounted.current && !session) {
            console.warn("Recovery token timeout.");
            setStatus('invalid');
            setErrorMessage("Không thể xác thực liên kết. Vui lòng thử lại.");
          }
        }, 5000); // Wait 5 seconds for auto-login
        return () => clearTimeout(timeout);
      }

      // 4. No session, not loading, and no token in URL -> Invalid access
      if (!hash && !session) {
        setStatus('invalid');
      }
      // 5. Hash exists but might be error or random garbage?
      else if (hash) {
        if (hash.includes('error=')) {
          setStatus('invalid');
          setErrorMessage("Liên kết lỗi hoặc đã hết hạn.");
        } else {
          // Unknown hash, give it a sec, then fail if no session appears
          setTimeout(() => {
            if (mounted.current && !session) setStatus('invalid');
          }, 3000);
        }
      }
    };

    checkSession();

    return () => {
      mounted.current = false;
    };
  }, [session, loading, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Mật khẩu yếu", description: "Mật khẩu phải có ít nhất 6 ký tự." });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Không khớp", description: "Mật khẩu xác nhận không trùng khớp." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Final session check before write
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Phiên làm việc đã hết hạn. Vui lòng yêu cầu liên kết mới.");
      }

      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      // 1. Success! immediately mark as success to prevent "session missing" UI
      isSuccessRef.current = true;
      setStatus('success');

      // 2. Immediately sign out the user to enforce new login
      await supabase.auth.signOut();

      // 3. Show UI success
      toast({ title: "Thành công!", description: "Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại." });

      // 4. Redirect to login
      setTimeout(() => navigate('/login'), 2000);

    } catch (error) {
      console.error('Reset password error:', error);

      let msg = error.message;
      if (msg.includes("Auth session missing") || msg.includes("session")) {
        setStatus('invalid'); // Show invalid UI to prompt for new link
        setErrorMessage("Phiên xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.");
      } else {
        toast({ variant: "destructive", title: "Lỗi cập nhật", description: msg });
      }
    } finally {
      if (mounted.current) setIsSubmitting(false);
    }
  };

  // RENDER: Loading State
  if (status === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4 font-body">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium animate-pulse">Đang xác thực liên kết...</p>
      </div>
    );
  }

  // RENDER: Invalid / Error State
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-body">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Liên kết không hợp lệ</h2>
          <p className="text-gray-600 mb-6">
            {errorMessage || "Liên kết đặt lại mật khẩu này đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu một liên kết mới."}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-11 rounded-xl bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-500"
            >
              Quay lại Đăng nhập
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/contact')}
              className="w-full rounded-xl text-gray-500"
            >
              Liên hệ hỗ trợ
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // RENDER: Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-body">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-green-100 text-center"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đổi mật khẩu thành công!</h2>
          <p className="text-gray-600 mb-6">
            Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full h-11 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800"
          >
            Đăng nhập ngay
          </Button>
        </motion.div>
      </div>
    );
  }

  // RENDER: Valid Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-body">
      <Helmet>
        <title>Đặt lại mật khẩu - Minimart ChipChip</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100 relative"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 rounded-full"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4 text-yellow-600 shadow-sm ring-4 ring-yellow-50/50">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="mt-2 text-3xl font-display font-bold text-gray-900">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Thiết lập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Mật khẩu mới</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  className="rounded-xl h-12 border-gray-200 bg-gray-50 focus:bg-white pl-10 transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Nhập ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Xác nhận mật khẩu</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  className="rounded-xl h-12 border-gray-200 bg-gray-50 focus:bg-white pl-10 transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận thay đổi"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
