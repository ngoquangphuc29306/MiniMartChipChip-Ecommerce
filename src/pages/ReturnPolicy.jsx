import React from 'react';
import { Helmet } from 'react-helmet';
import { RefreshCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ReturnPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12">
      <Helmet>
        <title>Chính sách đổi trả - ChipChip Minimart</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chính sách đổi trả & Hoàn tiền</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">Cập nhật lần cuối: 22/11/2024</p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">Thời gian đổi trả</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Trong vòng 24h đối với thực phẩm tươi sống và 3 ngày với hàng khô.</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800/30">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">Điều kiện</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Sản phẩm còn nguyên bao bì (đối với hàng đóng gói), lỗi do nhà cung cấp.</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-100 dark:border-orange-800/30">
            <RefreshCcw className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-4" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">Phí đổi trả</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Miễn phí 100% nếu lỗi từ phía ChipChip hoặc sản phẩm không đạt chuẩn.</p>
          </div>
        </div>

        <div className="prose prose-lg prose-yellow dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <h3 className="text-gray-900 dark:text-gray-100">1. Trường hợp được chấp nhận đổi trả</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Sản phẩm bị hư hỏng, dập nát, ôi thiu trong quá trình vận chuyển.</li>
            <li>Sản phẩm hết hạn sử dụng.</li>
            <li>Giao sai sản phẩm, sai số lượng so với đơn đặt hàng.</li>
            <li>Sản phẩm có lỗi từ nhà sản xuất (bao bì rách, hở, biến dạng...).</li>
          </ul>

          <h3 className="text-gray-900 dark:text-gray-100">2. Điều kiện đổi trả</h3>
          <p>Để đảm bảo quyền lợi, quý khách vui lòng lưu ý:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-gray-900 dark:text-gray-100">Thực phẩm tươi sống (Rau, củ, quả, thịt, cá...):</strong> Vui lòng kiểm tra và phản hồi ngay khi nhận hàng hoặc tối đa trong vòng 24h và bảo quản đúng quy định.</li>
            <li><strong className="text-gray-900 dark:text-gray-100">Hàng khô, gia vị, đồ đóng hộp:</strong> Đổi trả trong vòng 3 ngày kể từ ngày nhận, sản phẩm phải còn nguyên tem mác, chưa qua sử dụng.</li>
          </ul>

          <h3 className="text-gray-900 dark:text-gray-100">3. Quy trình đổi trả</h3>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Bước 1:</strong> Liên hệ với ChipChip qua Hotline <strong className="text-gray-900 dark:text-gray-100">0708185432</strong> hoặc nhắn tin qua Fanpage/Zalo kèm hình ảnh/video tình trạng sản phẩm.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Bước 2:</strong> Nhân viên CSKH sẽ xác nhận thông tin và tình trạng lỗi.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Bước 3:</strong> ChipChip sẽ cử nhân viên đến thu hồi sản phẩm lỗi và giao sản phẩm mới (hoặc hoàn tiền) trong vòng 24h làm việc tiếp theo.
            </li>
          </ol>

          <h3 className="text-gray-900 dark:text-gray-100">4. Phương thức hoàn tiền</h3>
          <p>
            Nếu quý khách không muốn đổi sản phẩm khác, chúng tôi sẽ hoàn tiền theo phương thức quý khách đã thanh toán hoặc chuyển khoản qua ngân hàng. Thời gian hoàn tiền từ 1-3 ngày làm việc.
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-800/30 mt-8 not-prose">
            <h4 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Lưu ý quan trọng</h4>
            <p className="text-red-700 dark:text-red-300 text-sm mt-2 mb-0">ChipChip có quyền từ chối đổi trả nếu sản phẩm bị hư hỏng do lỗi bảo quản của khách hàng (ví dụ: để thịt tươi ở nhiệt độ thường quá lâu, rau củ không bỏ tủ lạnh...).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;