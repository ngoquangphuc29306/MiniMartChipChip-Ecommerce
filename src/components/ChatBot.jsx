import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mic, MicOff, Sparkles, RefreshCw, Star, ShoppingBag, UserCircle, Bot, Loader2 } from 'lucide-react';
import { useChatBot } from '@/context/ChatBotContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// --- Helper Components ---

// Simple Markdown Renderer
const MarkdownText = ({ text }) => {
  if (!text) return null;

  // Split by double newlines for paragraphs
  const paragraphs = text.split('\n\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((para, i) => {
        // Check for bullet points
        if (para.trim().startsWith('- ') || para.trim().startsWith('* ')) {
          const items = para.split('\n').filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
          return (
            <ul key={i} className="list-disc list-inside space-y-1 ml-1">
              {items.map((item, j) => {
                const content = item.replace(/^[-*]\s/, '');
                return <li key={j} dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
              })}
            </ul>
          );
        }
        // Regular paragraph with bolding
        return <p key={i} dangerouslySetInnerHTML={{ __html: para.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
      })}
    </div>
  );
};

// Mini Product Card for Chat
const ChatProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="flex-shrink-0 w-40 sm:w-48 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col snap-start hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-gray-50 p-2">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1559223669-e0065fa7f142?w=200'}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply"
        />
      </div>
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        <h4 className="font-bold text-xs text-gray-800 line-clamp-2 mb-1" title={product.name}>{product.name}</h4>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-yellow-600">
            {new Intl.NumberFormat('vi-VN').format(product.sale_price || product.price)}đ
          </span>
          <button
            onClick={() => addToCart(product)}
            className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white hover:bg-yellow-500 shadow-sm transition-colors"
            title="Thêm vào giỏ"
          >
            <ShoppingBag className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatBot = () => {
  const { isOpen, toggleChat, messages, sendMessage, isLoading, rateResponse, clearHistory, chatMode, requestHuman } = useChatBot();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getModeLabel = () => {
    switch (chatMode) {
      case 'waiting': return '⏳ Đang chờ nhân viên...';
      case 'human': return '👤 Đang chat với nhân viên';
      default: return '🤖 AI đang hỗ trợ';
    }
  };

  const getModeColor = () => {
    switch (chatMode) {
      case 'waiting': return 'bg-yellow-500';
      case 'human': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  // Voice Recognition Logic
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech error", event);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.start();
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={toggleChat}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-stone-800 text-white rotate-90" : "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-orange-500/30"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </motion.button>

      {/* Main Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[95vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-yellow-100 dark:border-yellow-900/30 flex flex-col overflow-hidden font-sans ring-1 ring-black/5"
          >
            {/* Login Required Screen */}
            {!user ? (
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 p-4 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-md z-10">
                    <img
                      src="https://horizons-cdn.hostinger.com/9ee84389-1925-41dd-a3e7-6d8a37fcb695/b9b4d3e3ba41b2e5db3158624a392a6e.png"
                      alt="Bot"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="z-10 flex-1">
                    <h3 className="font-bold text-stone-900 text-lg leading-none">ChipChip AI</h3>
                    <p className="text-xs text-stone-800 font-medium opacity-90">Hỗ trợ 24/7</p>
                  </div>
                </div>

                {/* Login Message */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50 dark:bg-slate-800">
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
                    <UserCircle className="w-10 h-10 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Đăng nhập để sử dụng</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Vui lòng đăng nhập để trò chuyện với AI hoặc nhân viên hỗ trợ của ChipChip.
                  </p>
                  <Button
                    onClick={() => { toggleChat(); navigate('/login'); }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl px-8"
                  >
                    Đăng nhập ngay
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Chưa có tài khoản? <button onClick={() => { toggleChat(); navigate('/register'); }} className="text-yellow-600 font-bold hover:underline">Đăng ký</button>
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 p-4 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                  <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-md z-10">
                    <img
                      src="https://horizons-cdn.hostinger.com/9ee84389-1925-41dd-a3e7-6d8a37fcb695/b9b4d3e3ba41b2e5db3158624a392a6e.png"
                      alt="Bot"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="z-10 flex-1">
                    <h3 className="font-bold text-stone-900 text-lg leading-none">
                      {chatMode === 'human' ? 'Hỗ trợ trực tuyến' : 'ChipChip AI'}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`w-2 h-2 ${getModeColor()} rounded-full animate-pulse`}></span>
                      <p className="text-xs text-stone-800 font-medium opacity-90">{getModeLabel()}</p>
                    </div>
                  </div>

                  {/* Human Support Button - Only show in AI mode */}
                  {chatMode === 'ai' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-stone-800 hover:bg-white/30 z-10 text-xs font-bold gap-1"
                      onClick={requestHuman}
                      disabled={isLoading}
                    >
                      <UserCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Gặp NV</span>
                    </Button>
                  )}

                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 z-10 h-8 w-8" onClick={clearHistory} title="Làm mới">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 scroll-smooth">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* System Message */}
                      {msg.isSystemMessage && (
                        <div className="w-full text-center py-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{msg.text}</span>
                        </div>
                      )}

                      {/* Regular Message Bubble */}
                      {!msg.isSystemMessage && (
                        <>
                          {/* Sender indicator for human chat */}
                          {msg.senderType === 'admin' && (
                            <div className="flex items-center gap-1 mb-1 text-xs text-blue-600">
                              <UserCircle className="w-3 h-3" />
                              <span>{msg.senderName || 'Nhân viên hỗ trợ'}</span>
                            </div>
                          )}
                          {msg.senderType === 'ai' && msg.role === 'assistant' && (
                            <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                              <Bot className="w-3 h-3" />
                              <span>AI Assistant</span>
                            </div>
                          )}

                          <div
                            className={cn(
                              "max-w-[85%] p-3 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group",
                              msg.role === 'user'
                                ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white rounded-tr-none"
                                : msg.senderType === 'admin'
                                  ? "bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none"
                                  : "bg-white text-stone-700 border border-gray-100 rounded-tl-none"
                            )}
                          >
                            <MarkdownText text={msg.text} />

                            {/* Rating UI for Bot */}
                            {msg.role === 'assistant' && !msg.isError && (
                              <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button key={star} onClick={() => rateResponse(msg.id, star)} className="hover:scale-125 transition-transform">
                                    <Star className={cn("w-3 h-3", msg.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Products Carousel */}
                          {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="w-full mt-3 overflow-x-auto pb-2 flex gap-3 no-scrollbar snap-x px-1"
                            >
                              {msg.products.map(product => (
                                <ChatProductCard key={product.id} product={product} />
                              ))}
                            </motion.div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                        <span className="text-xs text-gray-400 font-medium">{chatMode === 'human' ? 'Đang soạn tin...' : 'ChipChip AI đang soạn tin...'}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-gray-100">
                  <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-stone-50 p-2 rounded-[1.5rem] border border-gray-200 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-100 transition-all shadow-inner">

                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Hỏi về sản phẩm, món ăn..."
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-stone-800 placeholder:text-gray-400 resize-none max-h-24 min-h-[44px]"
                      rows={1}
                    />

                    <div className="flex items-center gap-1 pb-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={toggleListening}
                        className={cn(
                          "w-8 h-8 rounded-full transition-colors",
                          isListening ? "bg-red-100 text-red-500 animate-pulse" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                        title="Nhập bằng giọng nói"
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>

                      <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="w-9 h-9 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </Button>
                    </div>
                  </form>
                  <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">Được hỗ trợ bởi Google Gemini AI</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;