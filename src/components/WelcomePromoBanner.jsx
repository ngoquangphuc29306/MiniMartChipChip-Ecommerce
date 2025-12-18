import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const WelcomePromoBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const VOUCHER_CODE = "CHIPCHIP10";
  const { user } = useAuth();
  const voucherSavedRef = useRef(false); // Prevent duplicate saves

  // Save voucher to user's storage in Supabase
  const saveVoucherToUser = async (userId) => {
    if (voucherSavedRef.current) return; // Already saved this session
    voucherSavedRef.current = true;

    try {
      // Check if user already has this voucher
      const { data: existing } = await supabase
        .from('redeemed_vouchers')
        .select('id')
        .eq('user_id', userId)
        .eq('voucher_code', VOUCHER_CODE)
        .maybeSingle();

      if (existing) {
        console.log('Voucher already exists for user');
        return;
      }

      // Insert voucher
      const { error } = await supabase
        .from('redeemed_vouchers')
        .insert({
          user_id: userId,
          voucher_code: VOUCHER_CODE,
          redeemed_at: new Date().toISOString(),
          is_used: false
        });

      if (error) {
        console.error('Error saving voucher:', error);
      } else {
        console.log('Welcome voucher saved to user storage');
      }
    } catch (err) {
      console.error('Failed to save voucher:', err);
    }
  };

  useEffect(() => {
    // Flag to prevent multiple triggers
    let triggered = false;

    const checkAndShow = () => {
      if (triggered) return;

      const shouldShowBanner = localStorage.getItem('showWelcomeBanner');

      // User must be logged in AND have the first-registration flag
      if (user && shouldShowBanner === 'true') {
        triggered = true;
        console.log('[WelcomeBanner] Showing banner immediately!');
        setIsOpen(true);
        triggerConfetti();
        saveVoucherToUser(user.id);
      }
    };

    // Check immediately
    checkAndShow();

    // Also set up a short interval to catch the moment conditions are met
    const interval = setInterval(checkAndShow, 100);

    // Cleanup after 3 seconds (don't keep checking forever)
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user]);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleClose = () => {
    setIsOpen(false);
    // Remove the flag so it won't show again
    localStorage.removeItem('showWelcomeBanner');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(VOUCHER_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-3xl border-none shadow-2xl">
        <div className="relative">
          {/* Decorative Header Image */}
          <div className="h-32 bg-gradient-to-br from-yellow-400 to-orange-500 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="z-10 bg-white p-3 rounded-2xl shadow-lg"
            >
              <PartyPopper className="w-10 h-10 text-orange-500" />
            </motion.div>
          </div>

          <div className="p-6 text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold text-gray-800 mb-2">
                Chào mừng bạn mới! 👋
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-base mb-6">
                Minimart ChipChip tặng bạn món quà làm quen. Nhập mã dưới đây để được giảm ngay <span className="font-bold text-orange-500">10%</span> cho đơn hàng đầu tiên nhé!
              </DialogDescription>
            </DialogHeader>

            {/* Voucher Box */}
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 mb-6 flex items-center justify-between gap-3 group hover:border-orange-300 transition-colors">
              <div className="text-left">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Mã giảm giá</p>
                <p className="font-mono font-bold text-lg text-gray-800">{VOUCHER_CODE}</p>
              </div>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className={`transition-all duration-300 ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'hover:bg-white hover:border-orange-200 hover:text-orange-600'}`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Sao chép
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-200 btn-hover-effect"
            >
              Mua sắm ngay thôi!
            </Button>

            <p className="text-xs text-gray-400 mt-4">
              *Áp dụng cho đơn hàng từ 100k. Hạn sử dụng 30 ngày.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePromoBanner;