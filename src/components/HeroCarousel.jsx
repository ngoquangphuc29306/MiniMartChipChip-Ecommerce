import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Default slides - can be overridden via props or fetched from database
const DEFAULT_SLIDES = [
    {
        id: 1,
        title: 'Thực phẩm Tươi & Sạch',
        subtitle: 'Cho Gia Đình Bạn',
        description: 'Cam kết 100% thực phẩm tươi sống, nguồn gốc rõ ràng, giao hàng trong 2 giờ.',
        buttonText: 'Khám phá ngay',
        buttonLink: '/products',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
        bgGradient: 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20',
        accentColor: 'text-green-600 dark:text-green-400'
    },
    {
        id: 2,
        title: 'Flash Sale Cuối Tuần',
        subtitle: 'Giảm đến 50%',
        description: 'Ưu đãi cực sốc cho các sản phẩm tươi sống và đồ gia dụng. Nhanh tay kẻo lỡ!',
        buttonText: 'Xem ưu đãi',
        buttonLink: '/products?sale=true',
        image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1000&auto=format&fit=crop',
        bgGradient: 'from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20',
        accentColor: 'text-orange-600 dark:text-orange-400'
    },
    {
        id: 3,
        title: 'Sản Phẩm Mới',
        subtitle: 'Vừa cập nhật',
        description: 'Khám phá các sản phẩm mới nhất vừa về kho. Đa dạng mặt hàng, giá cả phải chăng.',
        buttonText: 'Xem ngay',
        buttonLink: '/products',
        image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1000&auto=format&fit=crop',
        bgGradient: 'from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20',
        accentColor: 'text-amber-600 dark:text-amber-400'
    }
];

const HeroCarousel = ({ slides = DEFAULT_SLIDES, autoPlayInterval = 5000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const slideCount = slides.length;

    const goToSlide = useCallback((index) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    }, [currentIndex]);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, [slideCount]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
    }, [slideCount]);

    // Auto-play
    useEffect(() => {
        if (isPaused || slideCount <= 1) return;

        const timer = setInterval(nextSlide, autoPlayInterval);
        return () => clearInterval(timer);
    }, [isPaused, nextSlide, autoPlayInterval, slideCount]);

    const currentSlide = slides[currentIndex];

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <section
            className="relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className={`relative min-h-[500px] md:min-h-[600px] bg-gradient-to-br ${currentSlide.bgGradient} transition-colors duration-500`}>
                <div className="container-custom relative z-10 py-12 md:py-20">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                        {/* Text Content */}
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentIndex + '-text'}
                                custom={direction}
                                variants={{
                                    enter: { opacity: 0, y: 20 },
                                    center: { opacity: 1, y: 0 },
                                    exit: { opacity: 0, y: -20 }
                                }}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4 }}
                                className="text-center md:text-left space-y-6"
                            >
                                <div className={`inline-flex items-center gap-2 ${currentSlide.accentColor} bg-white/60 dark:bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold shadow-sm`}>
                                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                    <span>{currentSlide.subtitle}</span>
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
                                    {currentSlide.title}
                                </h1>

                                <p className="text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
                                    {currentSlide.description}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                    <Link to={currentSlide.buttonLink}>
                                        <Button size="lg" className="h-14 px-8 rounded-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold shadow-lg shadow-yellow-400/30 text-lg">
                                            {currentSlide.buttonText} <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Image */}
                        <div className="relative">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentIndex + '-image'}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.3 }
                                    }}
                                    className="relative z-10"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 to-orange-100/30 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-[3rem] filter blur-3xl"></div>
                                    <picture>
                                        <source srcSet={`${currentSlide.image}&format=webp`} type="image/webp" />
                                        <img
                                            src={currentSlide.image}
                                            alt={currentSlide.title}
                                            className="w-full h-auto object-contain drop-shadow-2xl rounded-[2.5rem] relative z-10 max-h-[500px]"
                                            loading={currentIndex === 0 ? "eager" : "lazy"}
                                            fetchpriority={currentIndex === 0 ? "high" : "auto"}
                                        />
                                    </picture>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows */}
                {slideCount > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Dots Pagination */}
                {slideCount > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`transition-all duration-300 rounded-full ${index === currentIndex
                                    ? 'w-8 h-3 bg-yellow-400'
                                    : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Progress Bar */}
                {slideCount > 1 && !isPaused && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 dark:bg-gray-700/50">
                        <motion.div
                            className="h-full bg-yellow-400"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
                            key={currentIndex}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default HeroCarousel;
