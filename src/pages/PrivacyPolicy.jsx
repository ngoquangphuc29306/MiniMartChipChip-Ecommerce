import React from 'react';
import { Helmet } from 'react-helmet';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12">
      <Helmet>
        <title>Chính sách bảo mật - ChipChip Minimart</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">Chính sách bảo mật thông tin</h1>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-8 rounded-2xl mb-10 border border-yellow-100 dark:border-yellow-800/30">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-100">ChipChip Minimart</strong> cam kết bảo mật tuyệt đối thông tin cá nhân của quý khách hàng. Chúng tôi hiểu rằng sự riêng tư của bạn là vô cùng quan trọng, và chính sách dưới đây mô tả cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.
          </p>
        </div>

        <div className="space-y-12">
          <section className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">1. Thu thập thông tin</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, đặt hàng hoặc đăng ký nhận bản tin. Thông tin bao gồm:</p>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                <li>Họ và tên</li>
                <li>Địa chỉ giao hàng</li>
                <li>Số điện thoại liên hệ</li>
                <li>Địa chỉ Email</li>
              </ul>
            </div>
          </section>

          <section className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                <Eye className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">2. Sử dụng thông tin</h2>
              <p className="text-gray-600 dark:text-gray-400">Thông tin của bạn được sử dụng để:</p>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                <li>Xử lý đơn hàng và giao hàng đến địa chỉ của bạn.</li>
                <li>Gửi thông báo về trạng thái đơn hàng.</li>
                <li>Gửi các chương trình khuyến mãi, ưu đãi (nếu bạn đăng ký nhận tin).</li>
                <li>Hỗ trợ và giải đáp thắc mắc của khách hàng.</li>
              </ul>
            </div>
          </section>

          <section className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">3. Bảo mật thông tin</h2>
              <p className="text-gray-600 dark:text-gray-400">
                ChipChip áp dụng các biện pháp kỹ thuật và an ninh phù hợp để ngăn chặn truy cập trái phép, mất mát hoặc thiệt hại dữ liệu. Chúng tôi không bán, trao đổi hay chia sẻ thông tin cá nhân của khách hàng cho bên thứ ba, trừ trường hợp có yêu cầu từ cơ quan pháp luật.
              </p>
            </div>
          </section>

          <section className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">4. Quyền lợi khách hàng</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình bất cứ lúc nào bằng cách đăng nhập vào tài khoản hoặc liên hệ với chúng tôi qua email: <strong className="text-gray-900 dark:text-gray-100">chipchiptaphoa@gmail.com</strong>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;