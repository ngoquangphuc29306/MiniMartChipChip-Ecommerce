import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatBot from '@/components/ChatBot';
import FlashSaleCountdown from '@/components/FlashSaleCountdown';
import WelcomePromoBanner from '@/components/WelcomePromoBanner';
import BottomNavigation from '@/components/BottomNavigation';

const Layout = ({ children }) => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <div className="min-h-screen flex flex-col">
            {/* Promo components always loaded, control visibility inside or conditionally here */}
            <WelcomePromoBanner />

            <Header />

            {/* Show Flash Sale Countdown only on Home Page */}
            {isHomePage && <FlashSaleCountdown />}

            <main className="flex-grow pb-16 md:pb-0">
                {children}
            </main>

            <ChatBot />
            <Footer />

            {/* Mobile Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
};

export default Layout;