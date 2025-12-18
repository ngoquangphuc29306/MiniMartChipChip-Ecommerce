import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';

const TikTokIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M41 16.5c-3 0-6.1-1-8.6-2.8v14.4c0 7.6-6.2 13.8-13.8 13.8S4.8 35.7 4.8 28.1c0-7.6 6.2-13.8 13.8-13.8 1 0 2 .1 3 .4v6.3c-.9-.3-1.9-.5-3-.5-4.1 0-7.4 3.3-7.4 7.4 0 4.1 3.3 7.4 7.4 7.4s7.4-3.3 7.4-7.4V6.2h6.2c0 .9.1 1.8.3 2.6 1.2 4.1 5 7.1 9.5 7.2V16.5z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-[#1C1C1C] text-gray-300 py-12 md:py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Logo and About Us text */}
        <div>
          <Link to="/" className="flex items-center gap-3 mb-4" aria-label="Trang chủ ChipChip">
            <div className="w-11 h-11 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/40">
              <img
                src="https://horizons-cdn.hostinger.com/9ee84389-1925-41dd-a3e7-6d8a37fcb695/b9b4d3e3ba41b2e5db3158624a392a6e.png"
                alt="ChipChip logo"
                className="w-full h-full object-cover rounded-2xl"
                loading="lazy"
                width="44"
                height="44"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">ChipChip</h1>
          </Link>
          <p className="text-sm leading-relaxed mb-4">
            Hệ thống siêu thị mini trực tuyến uy tín.<br />
            Cam kết thực phẩm sạch, tươi ngon và an<br />
            toàn cho sức khỏe gia đình bạn.
          </p>
          <div className="flex space-x-3 mt-6">
            <a href="https://www.facebook.com/profile.php?id=61583829535822" target="_blank" rel="noopener noreferrer" className="bg-gray-700 p-2 rounded-full text-white hover:text-yellow-400 transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/chipchipminimart?igsh=MTRqd2NyN3g2ZnlhNQ%3D%3D" target="_blank" rel="noopener noreferrer" className="bg-gray-700 p-2 rounded-full text-white hover:text-yellow-400 transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className="bg-gray-700 p-2 rounded-full text-white hover:text-yellow-400 transition-colors" aria-label="TikTok">
              <TikTokIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Column 2: Khám phá (Discover) */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Khám phá</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-yellow-400 transition-colors">Trang chủ</Link></li>
            <li><Link to="/products" className="hover:text-yellow-400 transition-colors">Sản phẩm</Link></li>
            <li><Link to="/about" className="hover:text-yellow-400 transition-colors">Về chúng tôi</Link></li>
            <li><Link to="/contact" className="hover:text-yellow-400 transition-colors">Liên hệ</Link></li>
          </ul>
        </div>

        {/* Column 3: Hỗ trợ (Support) */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Hỗ trợ</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/help" className="hover:text-yellow-400 transition-colors">Trung tâm trợ giúp</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-yellow-400 transition-colors">Chính sách vận chuyển</Link></li>
            <li><Link to="/return-policy" className="hover:text-yellow-400 transition-colors">Chính sách đổi trả</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-yellow-400 transition-colors">Bảo mật thông tin</Link></li>
          </ul>
        </div>

        {/* Column 4: Liên hệ (Contact) */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Liên hệ</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center">
              <MapPin className="w-4 h-4 mr-3 text-yellow-400 flex-shrink-0" />
              <span>Trưng Nữ Vương, Đà Nẵng, Việt Nam</span>
            </li>
            <li className="flex items-center">
              <Phone className="w-4 h-4 mr-3 text-yellow-400 flex-shrink-0" />
              <span>0708185432</span>
            </li>
            <li className="flex items-center">
              <Mail className="w-4 h-4 mr-3 text-yellow-400 flex-shrink-0" />
              <span>chipchiptaphoa@gmail.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-10 pt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Minimart ChipChip. All rights reserved. Thiết kế bởi Ngô Quang Phúc.</p>
      </div>
    </footer>
  );
};

export default Footer;