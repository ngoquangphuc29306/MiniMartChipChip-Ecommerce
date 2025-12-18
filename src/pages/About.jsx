import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Truck, Users } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Về chúng tôi - Minimart ChipChip</title>
        <meta name="description" content="Câu chuyện về ChipChip Minimart - Nơi cung cấp thực phẩm tươi sạch và an toàn cho gia đình bạn." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative bg-yellow-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 font-display"
          >
            Về ChipChip Minimart
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Hành trình mang thực phẩm tươi ngon, an toàn từ nông trại đến bàn ăn của mọi gia đình Việt.
          </motion.p>
        </div>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
                alt="Fresh vegetables"
                className="rounded-[2rem] shadow-2xl"
                loading="lazy"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Câu chuyện của chúng tôi</h2>
              <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                <p>
                  ChipChip Minimart được thành lập với một niềm tin đơn giản nhưng mạnh mẽ: Mọi gia đình đều xứng đáng được thưởng thức những bữa ăn ngon từ nguyên liệu tươi sạch nhất.
                </p>
                <p>
                  Tọa lạc tại Trưng Nữ Vương, Đà Nẵng, chúng tôi bắt đầu như một cửa hàng nhỏ với mong muốn phục vụ cộng đồng địa phương. Qua thời gian, nhờ sự tin yêu của khách hàng, ChipChip đã phát triển thành một điểm đến tin cậy cho hàng ngàn bà nội trợ.
                </p>
                <p>
                  Chúng tôi cam kết chỉ cung cấp những sản phẩm có nguồn gốc rõ ràng, được kiểm định chất lượng nghiêm ngặt. Tại ChipChip, "Tươi ngon" không chỉ là khẩu hiệu, đó là lời hứa danh dự.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-yellow-50/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Giá trị cốt lõi</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Heart, title: "Tận tâm", desc: "Phục vụ khách hàng bằng cả trái tim và sự chân thành." },
              { icon: ShieldCheck, title: "Chất lượng", desc: "Cam kết sản phẩm an toàn, nguồn gốc minh bạch." },
              { icon: Truck, title: "Tốc độ", desc: "Giao hàng nhanh chóng để giữ trọn độ tươi ngon." },
              { icon: Users, title: "Cộng đồng", desc: "Đồng hành cùng nông dân và người tiêu dùng Việt." }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-yellow-100 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;