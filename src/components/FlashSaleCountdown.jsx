import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FlashSaleCountdown = () => {
  // Set target to end of current day or fixed duration for demo
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set a target time: 12 hours from now for demo purposes
    // In a real app, this would come from a backend configuration
    const targetDate = new Date();
    targetDate.setHours(24, 0, 0, 0); // End of today

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return { hours: 0, minutes: 0, seconds: 0 };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5 min-w-[32px] sm:min-w-[40px] flex items-center justify-center border border-white/30 shadow-inner">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="text-white font-mono font-bold text-sm sm:text-base leading-none"
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] font-medium text-white/80 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 py-3 relative overflow-hidden shadow-md">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute transform -rotate-45 -top-10 -left-10 w-40 h-40 bg-white blur-3xl"></div>
        <div className="absolute transform rotate-45 top-1/2 right-0 w-60 h-60 bg-yellow-300 blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Left Side: Title & Icon */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full animate-pulse">
              <Zap className="w-5 h-5 text-yellow-200 fill-yellow-200" />
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-lg leading-tight uppercase italic tracking-wide">
                Flash Sale <span className="text-yellow-200">50%</span>
              </h3>
              <p className="text-white/90 text-xs font-medium hidden sm:block">Săn deal giá sốc hôm nay!</p>
            </div>
          </div>

          {/* Middle: Timer */}
          <div className="flex items-center gap-2">
            <TimeUnit value={timeLeft.hours} label="Giờ" />
            <span className="text-white font-bold pb-4">:</span>
            <TimeUnit value={timeLeft.minutes} label="Phút" />
            <span className="text-white font-bold pb-4">:</span>
            <TimeUnit value={timeLeft.seconds} label="Giây" />
          </div>

          {/* Right: Action */}
          <Link to="/products?sort=discount" className="hidden md:flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-yellow-50 hover:scale-105 transition-all shadow-sm group">
            Xem ngay
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

        </div>
      </div>
    </div>
  );
};

export default FlashSaleCountdown;