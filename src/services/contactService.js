
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Lưu tin nhắn liên hệ vào database và gửi email thông báo qua Resend (Supabase Edge Function)
 */
export const saveContactMessage = async (messageData) => {
  try {
    // 1. Lưu vào database
    // LƯU Ý QUAN TRỌNG: Không sử dụng .select() ở đây.
    // Chính sách RLS (Row Level Security) hiện tại chỉ cho phép Admin xem (SELECT) tin nhắn.
    // Người dùng thường (anon) có quyền gửi (INSERT) nhưng không có quyền xem lại ngay lập tức.
    // Nếu dùng .select(), Supabase sẽ trả về lỗi "new row violates row-level security policy".
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([messageData]);

    if (dbError) {
      console.error('Lỗi khi lưu tin nhắn vào database:', dbError);
      throw new Error('Không thể lưu tin nhắn. Vui lòng thử lại sau.');
    }

    // 2. Gọi Supabase Edge Function để gửi email qua Resend
    // Chạy bất đồng bộ, chờ kết quả để log lỗi nếu có, nhưng không làm gián đoạn trải nghiệm người dùng
    // nếu việc lưu DB đã thành công.
    console.log('Đang gửi yêu cầu gửi email...');
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-contact-email', {
      body: JSON.stringify(messageData)
    });

    if (emailError) {
      console.error('Lỗi khi gửi email (Edge Function):', emailError);
      // Không throw error ở đây vì tin nhắn đã được lưu vào DB thành công.
      // Chúng ta chỉ log lỗi để debug.
    } else {
      console.log('Email sent successfully:', emailData);
    }

    return { success: true };

  } catch (error) {
    console.error('saveContactMessage error:', error);
    throw error;
  }
};
