import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

// Default testimonials - can be fetched from database
const DEFAULT_TESTIMONIALS = [
  {
    id: 1,
    name: 'Nguyễn Thị Mai',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    role: 'Khách hàng thường xuyên',
    rating: 5,
    text: 'ChipChip là lựa chọn số 1 của tôi khi cần mua thực phẩm tươi sống. Giao hàng nhanh, sản phẩm luôn tươi ngon và giá cả hợp lý. Rất hài lòng!',
    date: '2 tuần trước'
  },
  {
    id: 2,
    name: 'Trần Văn Hùng',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: 'Đầu bếp gia đình',
    rating: 5,
    text: 'Tôi rất thích tính năng gợi ý công thức nấu ăn. Chatbot AI hỗ trợ rất tốt, giúp tôi chọn được nguyên liệu phù hợp cho từng món.',
    date: '1 tuần trước'
  },
  {
    id: 3,
    name: 'Lê Thị Hương',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    role: 'Mẹ bỉm sữa',
    rating: 5,
    text: 'Mua sắm online tiện lợi quá, không cần ra ngoài mà vẫn có thực phẩm tươi cho cả gia đình. Đóng gói cẩn thận, shipper thân thiện.',
    date: '3 ngày trước'
  },
  {
    id: 4,
    name: 'Phạm Minh Đức',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    role: 'Nhân viên văn phòng',
    rating: 4,
    text: 'Giao hàng trong 2 tiếng thật sự tiện lợi. Voucher giảm giá cũng nhiều. Sẽ tiếp tục ủng hộ ChipChip.',
    date: '5 ngày trước'
  }
];

const TestimonialsSection = ({ testimonials = DEFAULT_TESTIMONIALS, autoPlay = true, interval = 6000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const itemsPerPage = {
    mobile: 1,
    desktop: 2
  };

  useEffect(() => {
    if (!autoPlay || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, testimonials.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Get visible testimonials for desktop (2 at a time)
  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = 0; i < 2; i++) {
      const index = (currentIndex + i) % testimonials.length;
      result.push(testimonials[index]);
    }
    return result;
  };

  return (
    <section
      className="py-16 md:py-24 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-widest text-xs">
            Đánh giá từ khách hàng
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-2">
            Khách hàng nói gì
          </h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Hàng nghìn khách hàng tin tưởng lựa chọn ChipChip cho bữa ăn gia đình
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-slate-700 transition-colors border border-gray-100 dark:border-gray-700"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-slate-700 transition-colors border border-gray-100 dark:border-gray-700"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Cards Container */}
          <div className="overflow-hidden px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {getVisibleTestimonials().map((testimonial, idx) => (
                  <div
                    key={testimonial.id}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-lg border border-white/50 dark:border-gray-800 relative overflow-hidden group hover:shadow-xl transition-shadow"
                  >
                    {/* Quote Icon */}
                    <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Quote className="w-16 h-16 text-yellow-400" />
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < testimonial.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 dark:text-gray-700'
                            }`}
                        />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 relative z-10">
                      "{testimonial.text}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-100 dark:border-yellow-900"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-bold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">{testimonial.date}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 rounded-full ${index === currentIndex
                  ? 'w-8 h-2 bg-yellow-400'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
