import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { saveContactMessage } from '@/services/contactService';

// TikTok Icon SVG
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

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveContactMessage(formData);
      toast({ title: "Gửi tin nhắn thành công!", description: "Chúng tôi sẽ phản hồi bạn sớm nhất." });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể gửi tin nhắn.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="bg-yellow-50/50 dark:bg-slate-950 min-h-screen">
      <Helmet>
        <title>Liên hệ - Minimart ChipChip</title>
      </Helmet>

      <div className="bg-yellow-100/70 dark:bg-slate-900 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-yellow-900 dark:text-yellow-400 mb-2">Liên hệ với chúng tôi</h1>
          <p className="text-gray-600 dark:text-gray-400">Chúng tôi luôn sẵn lòng lắng nghe bạn.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start mb-16">

          {/* FORM */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/20 p-8 h-full border border-transparent dark:border-slate-800">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Gửi tin nhắn cho chúng tôi</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {[
                  { name: 'name', type: 'text', placeholder: 'Họ và tên của bạn' },
                  { name: 'email', type: 'email', placeholder: 'email@example.com' },
                  { name: 'subject', type: 'text', placeholder: 'Tiêu đề tin nhắn' }
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                      {field.name === 'subject' ? 'Tiêu đề' : field.name}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội dung</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required rows={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Nội dung tin nhắn..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-lg py-6 shadow-md rounded-lg"
                >
                  {loading ? 'Đang gửi...' : <><Send className="mr-2 w-5 h-5" /> Gửi tin nhắn</>}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* CONTACT INFO */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/20 p-8 h-full border border-transparent dark:border-slate-800">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Thông tin liên hệ</h2>

              <div className="space-y-8">
                {[
                  { icon: MapPin, title: 'Địa chỉ', content: 'Trưng Nữ Vương, Đà Nẵng, Việt Nam' },
                  { icon: Phone, title: 'Số điện thoại', content: '0708185432' },
                  { icon: Mail, title: 'Email', content: 'chipchiptaphoa@gmail.com' }
                ].map(item => (
                  <div key={item.title} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 text-lg">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-base">{item.content}</p>
                    </div>
                  </div>
                ))}

                {/* SOCIAL MEDIA */}
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Kết nối với ChipChip</h3>
                  <div className="flex items-center gap-5 text-gray-600 dark:text-gray-400">
                    <a href="https://www.facebook.com/profile.php?id=61583829535822" target="_blank" rel="noreferrer" className="hover:text-yellow-600 dark:hover:text-yellow-400 transition transform hover:scale-110">
                      <Facebook className="w-9 h-9" />
                    </a>
                    <a href="https://www.instagram.com/chipchipminimart?igsh=MTRqd2NyN3g2ZnlhNQ%3D%3D" target="_blank" rel="noreferrer" className="hover:text-yellow-600 dark:hover:text-yellow-400 transition transform hover:scale-110">
                      <Instagram className="w-9 h-9" />
                    </a>
                    <a href="https://tiktok.com/" target="_blank" rel="noreferrer" className="hover:text-yellow-600 dark:hover:text-yellow-400 transition transform hover:scale-110">
                      <TikTokIcon className="w-9 h-9" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* MAP SECTION */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-yellow-200 dark:border-slate-800 h-[400px] bg-white dark:bg-slate-900">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.110435404464!2d108.21799931485834!3d16.05975898888686!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792252a13%3A0x1df2525543051476!2zVHLGsG5nIE7hu68gVsawxqFuZywgxJDDoCBO4bq1bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1629780000000!5m2!1svi!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="ChipChip Minimart Location"
          ></iframe>
        </div>

      </div>
    </div>
  );
};

export default Contact;