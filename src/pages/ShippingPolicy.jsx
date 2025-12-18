import React from 'react';
import { Helmet } from 'react-helmet';
import { Truck, MapPin, Clock, Wallet } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12">
      <Helmet>
        <title>Chính sách vận chuyển - ChipChip Minimart</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chính sách vận chuyển</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">Cập nhật lần cuối: 22/11/2025</p>

        <div className="prose prose-lg prose-yellow dark:prose-invert max-w-none">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-800/30 mb-8 not-prose">
            <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-2">
              <Truck className="w-5 h-5" /> Cam kết giao hàng
            </h3>
            <p className="text-yellow-900/80 dark:text-yellow-100/80">
              ChipChip cam kết giao hàng nhanh chóng để đảm bảo độ tươi ngon của thực phẩm. Đội ngũ shipper chuyên nghiệp của chúng tôi luôn sẵn sàng phục vụ bạn.
            </p>
          </div>

          <h3 className="text-gray-900 dark:text-gray-100">1. Phạm vi giao hàng</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Hiện tại, ChipChip Minimart phục vụ giao hàng chủ yếu tại khu vực <strong className="text-gray-900 dark:text-gray-100">TP. Đà Nẵng</strong>.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong className="text-gray-900 dark:text-gray-100">Khu vực nội thành:</strong> Hải Châu, Thanh Khê, Sơn Trà, Ngũ Hành Sơn, Cẩm Lệ.</li>
            <li><strong className="text-gray-900 dark:text-gray-100">Khu vực ngoại thành:</strong> Hòa Vang, Liên Chiểu (thời gian giao có thể lâu hơn).</li>
          </ul>

          <h3 className="text-gray-900 dark:text-gray-100">2. Thời gian giao hàng</h3>
          <div className="grid md:grid-cols-2 gap-6 my-6 not-prose">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-blue-500 dark:text-blue-400 w-5 h-5" />
                <span className="font-bold text-gray-900 dark:text-gray-100">Giao nhanh 2H</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Áp dụng cho đơn hàng đặt từ 8:00 - 18:00 tại các quận nội thành.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-orange-500 dark:text-orange-400 w-5 h-5" />
                <span className="font-bold text-gray-900 dark:text-gray-100">Giao trong ngày</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đơn hàng đặt sau 18:00 sẽ được giao vào sáng ngày hôm sau.</p>
            </div>
          </div>

          <h3 className="text-gray-900 dark:text-gray-100">3. Phí vận chuyển</h3>
          <p className="text-gray-700 dark:text-gray-300">Chi phí vận chuyển được tính dựa trên giá trị đơn hàng và khoảng cách:</p>
          <div className="overflow-x-auto not-prose">
            <table className="min-w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Giá trị đơn hàng</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Khu vực nội thành</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Khu vực ngoại thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Dưới 200.000đ</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">15.000đ - 20.000đ</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">25.000đ - 35.000đ</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-yellow-600 dark:text-yellow-400">Trên 300.000đ</td>
                  <td className="py-3 px-4 font-bold text-green-600 dark:text-green-400">Miễn phí</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">15.000đ</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-yellow-600 dark:text-yellow-400">Trên 500.000đ</td>
                  <td className="py-3 px-4 font-bold text-green-600 dark:text-green-400">Miễn phí</td>
                  <td className="py-3 px-4 font-bold text-green-600 dark:text-green-400">Miễn phí</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-gray-900 dark:text-gray-100">4. Kiểm tra hàng hóa</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Khách hàng được quyền kiểm tra số lượng và chất lượng sản phẩm ngay khi nhận hàng. Nếu phát hiện lỗi hoặc thiếu sót, vui lòng thông báo ngay cho nhân viên giao hàng hoặc liên hệ hotline <strong className="text-gray-900 dark:text-gray-100">0708185432</strong> để được xử lý đổi trả ngay lập tức.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;