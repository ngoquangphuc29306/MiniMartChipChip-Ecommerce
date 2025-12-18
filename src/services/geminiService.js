import { supabase } from '@/lib/customSupabaseClient';
import { searchProducts } from './productService';

/**
 * Static Knowledge Base (Fallback)
 */
const KNOWLEDGE_BASE = [
  {
    keywords: ['giờ', 'mở cửa', 'đóng cửa', 'thời gian', 'hoạt động'],
    answer: 'Minimart ChipChip mở cửa từ 7:00 sáng đến 22:00 tối tất cả các ngày trong tuần (kể cả Chủ nhật và ngày lễ).'
  },
  {
    keywords: ['địa chỉ', 'ở đâu', 'vị trí', 'tới cửa hàng', 'bản đồ'],
    answer: 'Cửa hàng Minimart ChipChip tọa lạc tại đường Trưng Nữ Vương, TP. Đà Nẵng. Bạn có thể ghé thăm trực tiếp nhé!'
  },
  {
    keywords: ['hotline', 'số điện thoại', 'liên hệ', 'gọi'],
    answer: 'Hotline của chúng mình là 0708185432. Bạn có thể gọi để được hỗ trợ nhanh nhất nha.'
  },
  {
    keywords: ['đổi trả', 'hoàn tiền', 'trả hàng', 'lỗi'],
    answer: 'ChipChip hỗ trợ đổi trả trong vòng 24h đối với thực phẩm tươi sống và 3 ngày với hàng khô nếu có lỗi từ nhà sản xuất hoặc hư hỏng do vận chuyển. Bạn nhớ giữ lại hóa đơn nhé!'
  },
  {
    keywords: ['ship', 'giao hàng', 'vận chuyển', 'phí ship', 'bao lâu'],
    answer: 'Chúng mình giao hàng hỏa tốc trong 2h tại nội thành Đà Nẵng. Phí ship tùy thuộc vào khoảng cách, miễn phí ship cho đơn từ 300k trong bán kính 3km.'
  },
  {
    keywords: ['thanh toán', 'chuyển khoản', 'tiền mặt', 'thẻ', 'ví'],
    answer: 'Bạn có thể thanh toán bằng tiền mặt khi nhận hàng (COD), chuyển khoản ngân hàng, hoặc quét mã QR VNPAY/Momo nhé.'
  },
  {
    keywords: ['xin chào', 'hi', 'hello', 'chào'],
    answer: 'Chào bạn! Mình là trợ lý ảo của ChipChip. Mình có thể giúp gì cho bạn hôm nay? 😊'
  },
  {
    keywords: ['cảm ơn', 'thanks', 'cám ơn'],
    answer: 'Không có chi! Rất vui được hỗ trợ bạn. Chúc bạn mua sắm vui vẻ! ❤️'
  }
];

// Helper Functions
const calculateMatchScore = (message, keywords) => {
  const lowerMessage = message.toLowerCase();
  let score = 0;
  keywords.forEach(keyword => {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      score += 1;
    }
  });
  return score;
};

const getStaticResponse = async (message) => {
  const searchResults = await searchProducts(message);
  const hasProductResults = searchResults && searchResults.length > 0;

  let bestMatch = null;
  let maxScore = 0;

  KNOWLEDGE_BASE.forEach(item => {
    const score = calculateMatchScore(message, item.keywords);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  });

  if (bestMatch && maxScore > 0) {
    return {
      text: bestMatch.answer,
      products: hasProductResults ? searchResults.slice(0, 3) : []
    };
  }

  if (hasProductResults) {
    const productNames = searchResults.slice(0, 3).map(p => p.name).join(', ');
    return {
      text: `Mình tìm thấy một số sản phẩm liên quan đến "${message}" đây ạ: ${productNames}. Bạn xem thử nhé!`,
      products: searchResults
    };
  }

  return {
    text: "Xin lỗi, mình chưa hiểu ý bạn lắm. Bạn có thể hỏi mình về sản phẩm, giờ mở cửa, giao hàng, hoặc liên hệ hotline 0708185432 nhé! 😊",
    products: []
  };
};

/**
 * Lấy Gemini API Key từ Supabase Database
 */
const getGeminiApiKeyFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .maybeSingle();

    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error('Supabase query error:', error);
    return null;
  }
};

/**
 * Gọi Gemini API trực tiếp
 */
const callGeminiAPI = async (message, history, apiKey, productContext = '') => {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `Bạn là trợ lý ảo thân thiện của Minimart ChipChip tại Đà Nẵng.

Nhiệm vụ của bạn:
1. Hỗ trợ thông tin cửa hàng (giờ mở cửa, địa chỉ, hotline, giao hàng…)
2. Tư vấn ẩm thực: gợi ý món ăn, phương pháp chế biến, thực đơn cho từng nhu cầu.
3. Tư vấn sức khỏe nhẹ: thực phẩm tốt cho dạ dày, ăn kiêng, tăng cơ, eat-clean… (Không đưa lời khuyên y tế chuyên sâu).
4. Gợi ý sản phẩm có sẵn trong Minimart nếu phù hợp với món ăn mà khách hỏi.
5. Luôn trả lời vui vẻ, thân thiện, xưng "mình" và "bạn", thêm emoji tự nhiên.

Thông tin cửa hàng:
- Địa chỉ: Trưng Nữ Vương, Đà Nẵng
- Hotline: 0708185432
- Giờ mở cửa: 7:00 - 22:00
- Giao hàng: 2h nội thành, miễn phí đơn 300k trong 3km.

Sản phẩm liên quan tìm được:
${productContext}

Hãy trả lời câu hỏi sau một cách tự nhiên, hữu ích và dễ hiểu.`;

  const formattedHistory = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const payload = {
    contents: [
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nKhách hàng hỏi: ${message}` }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, AI không phản hồi.";
};

/**
 * Lưu lịch sử chat vào Supabase (Tùy chọn)
 */
const saveChatHistory = async (userId, message, response, products = []) => {
  if (!userId) return; // Không lưu nếu user chưa đăng nhập

  try {
    const { error } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        user_message: message,
        bot_response: response,
        products: products
      });

    if (error) {
      console.error('Error saving chat history:', error);
    }
  } catch (error) {
    console.error('Error saving to Supabase:', error);
  }
};

/**
 * Hàm chính - Gửi tin nhắn đến chatbot
 */
export const sendMessageToGemini = async (message, history = [], userId = null) => {
  try {
    console.log('🤖 Processing message:', message);

    // 1. Tìm sản phẩm liên quan
    const searchResults = await searchProducts(message);
    const productContext = searchResults && searchResults.length > 0
      ? searchResults.slice(0, 5).map(p =>
        `- ${p.name}: ${p.price?.toLocaleString()}đ (${p.category || 'Khác'})`
      ).join('\n')
      : "Không tìm thấy sản phẩm cụ thể.";

    let responseText;
    let products = searchResults || [];

    // 2. Lấy API Key từ Supabase
    const apiKey = await getGeminiApiKeyFromSupabase();

    if (apiKey) {
      try {
        console.log('✅ Using Gemini API from Supabase...');
        responseText = await callGeminiAPI(message, history, apiKey, productContext);
      } catch (apiError) {
        console.error('❌ Gemini API failed, using fallback:', apiError.message);
        const staticResponse = await getStaticResponse(message);
        responseText = staticResponse.text;
        products = staticResponse.products;
      }
    } else {
      console.log('⚠️ No API key found, using static fallback');
      const staticResponse = await getStaticResponse(message);
      responseText = staticResponse.text;
      products = staticResponse.products;
    }

    // 3. Lưu lịch sử chat (nếu có userId)
    if (userId) {
      await saveChatHistory(userId, message, responseText, products.slice(0, 3));
    }

    return {
      text: responseText,
      products: products
    };

  } catch (error) {
    console.error('💥 General Chatbot Error:', error);
    return {
      text: "Hệ thống đang bận một chút, bạn thử lại sau nhé! 😅",
      products: []
    };
  }
};

/**
 * Lấy lịch sử chat của user (Tùy chọn)
 */
export const getChatHistory = async (userId, limit = 50) => {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
};