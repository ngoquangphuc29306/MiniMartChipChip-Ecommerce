import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, BookOpen, PhoneCall, MapPin, Mail, Truck } from 'lucide-react';

const Support = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet>
        <title>Hỗ trợ - ChipChip Minimart</title>
      </Helmet>

      <div className="bg-yellow-400 dark:bg-yellow-500 py-16 text-center text-yellow-900">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Hỗ trợ khách hàng</h1>
          <p className="text-xl max-w-2xl mx-auto">Chúng tôi luôn ở đây để lắng nghe và hỗ trợ bạn mọi lúc, mọi nơi.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-10">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Trung tâm trợ giúp */}
          <Link to="/help" className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg dark:shadow-slate-900/50 hover:shadow-xl transition-shadow border border-gray-100 dark:border-slate-800 group">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Trung tâm trợ giúp</h3>
            <p className="text-gray-600 dark:text-gray-400">Tìm câu trả lời cho các câu hỏi thường gặp về mua sắm và đơn hàng.</p>
          </Link>

          {/* Card 2: Chính sách (Updated to link to Support hub for policies) */}
          <Link to="/support#policies" className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg dark:shadow-slate-900/50 hover:shadow-xl transition-shadow border border-gray-100 dark:border-slate-800 group">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chính sách</h3>
            <p className="text-gray-600 dark:text-gray-400">Xem chi tiết về quy định vận chuyển, đổi trả và bảo mật.</p>
          </Link>

          {/* Card 3: Liên hệ trực tiếp */}
          <Link to="/contact" className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg dark:shadow-slate-900/50 hover:shadow-xl transition-shadow border border-gray-100 dark:border-slate-800 group">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Liên hệ trực tiếp</h3>
            <p className="text-gray-600 dark:text-gray-400">Gửi tin nhắn hoặc gọi điện trực tiếp cho đội ngũ CSKH.</p>
          </Link>
        </div>

        {/* Contact Info Section */}
        <div className="mt-16 bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-slate-900/30 border border-yellow-100 dark:border-slate-800 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Thông tin liên hệ</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">Địa chỉ</h4>
                    <p className="text-gray-600 dark:text-gray-400">Trưng Nữ Vương, Đà Nẵng, Việt Nam</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <PhoneCall className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">Hotline</h4>
                    <p className="text-gray-600 dark:text-gray-400">0708185432 (8:00 - 22:00)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">Email</h4>
                    <p className="text-gray-600 dark:text-gray-400">chipchiptaphoa@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-full min-h-[300px] bg-gray-200 dark:bg-slate-800">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.110435404464!2d108.21799931485834!3d16.05975898888686!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792252a13%3A0x1df2525543051476!2zVHLGsG5nIE7hu68gVsawxqFuZywgxJDDoCBO4bq1bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1629780000000!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="Google Maps"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Policies Section (New Section) */}
        <div id="policies" className="mt-16 bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-slate-900/30 border border-yellow-100 dark:border-slate-800 p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Các chính sách của ChipChip</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/shipping-policy" className="block p-6 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors group">
              <Truck className="w-7 h-7 text-yellow-600 dark:text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">Chính sách vận chuyển</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Tìm hiểu về phí, thời gian và phạm vi giao hàng.</p>
            </Link>
            <Link to="/return-policy" className="block p-6 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors group">
              <BookOpen className="w-7 h-7 text-yellow-600 dark:text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">Chính sách đổi trả</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Thông tin chi tiết về điều kiện và quy trình đổi trả sản phẩm.</p>
            </Link>
            <Link to="/privacy-policy" className="block p-6 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors group">
              <MessageCircle className="w-7 h-7 text-yellow-600 dark:text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">Bảo mật thông tin</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Cam kết bảo vệ dữ liệu cá nhân của khách hàng.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;