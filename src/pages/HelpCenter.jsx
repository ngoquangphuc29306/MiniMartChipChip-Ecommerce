import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Truck, CreditCard, RefreshCw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const HelpCenter = () => {
  const faqs = [
    {
      category: "Đặt hàng & Thanh toán",
      icon: ShoppingBag,
      items: [
        { q: "Làm thế nào để đặt hàng tại ChipChip?", a: "Bạn có thể đặt hàng dễ dàng qua website bằng cách chọn sản phẩm, thêm vào giỏ và tiến hành thanh toán. Ngoài ra, bạn cũng có thể gọi hotline 0708185432 để được hỗ trợ." },
        { q: "ChipChip chấp nhận phương thức thanh toán nào?", a: "Hiện tại chúng tôi hỗ trợ thanh toán tiền mặt khi nhận hàng (COD) và chuyển khoản ngân hàng." },
        { q: "Tôi có thể hủy đơn hàng không?", a: "Bạn có thể hủy đơn hàng khi đơn chưa chuyển sang trạng thái 'Đang giao'. Vui lòng liên hệ hotline hoặc chat với nhân viên để được hỗ trợ nhanh nhất." }
      ]
    },
    {
      category: "Vận chuyển & Giao nhận",
      icon: Truck,
      items: [
        { q: "Phí vận chuyển được tính như thế nào?", a: "Miễn phí vận chuyển cho đơn hàng từ 200.000đ trong nội thành Đà Nẵng. Các khu vực khác phí ship sẽ được tính dựa trên khoảng cách thực tế." },
        { q: "Thời gian giao hàng là bao lâu?", a: "Đơn hàng nội thành thường được giao trong 2-4 giờ. Đơn ngoại thành từ 1-2 ngày." }
      ]
    },
    {
      category: "Đổi trả & Hoàn tiền",
      icon: RefreshCw,
      items: [
        { q: "Chính sách đổi trả của ChipChip?", a: "Chúng tôi chấp nhận đổi trả trong vòng 24h đối với sản phẩm lỗi, hư hỏng do vận chuyển hoặc không đúng mô tả." },
        { q: "Quy trình hoàn tiền mất bao lâu?", a: "Sau khi xác nhận yêu cầu hoàn tiền hợp lệ, bạn sẽ nhận được tiền hoàn trong vòng 1-3 ngày làm việc." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet>
        <title>Trung tâm trợ giúp - ChipChip Minimart</title>
        <meta name="description" content="Giải đáp thắc mắc về mua sắm, thanh toán và giao hàng tại ChipChip Minimart." />
      </Helmet>

      {/* Header */}
      <div className="bg-yellow-400 dark:bg-yellow-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-900 mb-6">Xin chào, ChipChip có thể giúp gì cho bạn?</h1>
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              className="w-full py-4 px-6 pl-12 rounded-full shadow-lg border-none focus:ring-2 focus:ring-yellow-600 outline-none text-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {faqs.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{section.category}</h2>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {section.items.map((item, itemIdx) => (
                  <AccordionItem key={itemIdx} value={`item-${idx}-${itemIdx}`} className="border-b-gray-100 dark:border-b-slate-800">
                    <AccordionTrigger className="text-left font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-16 text-center bg-white dark:bg-slate-900 p-10 rounded-3xl border border-yellow-100 dark:border-slate-800 shadow-sm dark:shadow-slate-900/30">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Bạn vẫn chưa tìm thấy câu trả lời?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-yellow-900 bg-yellow-400 hover:bg-yellow-500 md:py-4 md:text-lg md:px-10 transition-colors">
              Liên hệ ngay
            </a>
            <a href="tel:0708185432" className="inline-flex items-center justify-center px-8 py-3 border border-yellow-200 dark:border-yellow-900 text-base font-medium rounded-full text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 md:py-4 md:text-lg md:px-10 transition-colors">
              Gọi 0708185432
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;