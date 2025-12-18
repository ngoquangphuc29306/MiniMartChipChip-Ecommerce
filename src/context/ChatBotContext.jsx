import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageToGemini } from '@/services/geminiService';
import {
    getOrCreateConversation,
    sendChatMessage,
    getConversationMessages,
    requestHumanSupport,
    subscribeToMessages,
    subscribeToConversation,
    unsubscribeChannel
} from '@/services/chatService';

const ChatBotContext = createContext();

export const useChatBot = () => useContext(ChatBotContext);

export const ChatBotProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Hybrid Chat Mode: 'ai' | 'waiting' | 'human'
    const [chatMode, setChatMode] = useState('ai');
    const [conversation, setConversation] = useState(null);

    // Realtime subscriptions
    const messageSubscription = useRef(null);
    const conversationSubscription = useRef(null);

    // Persistent Session ID
    const [sessionId] = useState(() => {
        const stored = localStorage.getItem('chat_session_id');
        if (stored) return stored;
        const newId = uuidv4();
        localStorage.setItem('chat_session_id', newId);
        return newId;
    });

    // Load history from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`chat_history_${sessionId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.messages || []);
                setChatMode(parsed.chatMode || 'ai');
            } catch (e) {
                console.error("Failed to parse chat history", e);
                initializeChat();
            }
        } else {
            initializeChat();
        }
    }, [sessionId]);

    // Listen for auth state changes - reset chat on logout
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                // Clear realtime subscriptions
                if (messageSubscription.current) {
                    unsubscribeChannel(messageSubscription.current);
                    messageSubscription.current = null;
                }
                if (conversationSubscription.current) {
                    unsubscribeChannel(conversationSubscription.current);
                    conversationSubscription.current = null;
                }
                // Reset states but KEEP history
                setChatMode('ai');
                setConversation(null);

                // We DO NOT clear messages or localStorage anymore per user request
                // The chat history will persist for the anonymous user
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [sessionId]);

    const initializeChat = () => {
        setMessages([{
            id: uuidv4(),
            role: 'assistant',
            senderType: 'ai',
            text: 'Xin chào! 👋 Mình là trợ lý ảo AI của ChipChip. Mình có thể giúp bạn tìm sản phẩm, gợi ý món ăn và giải đáp thắc mắc.\n\nNếu cần hỗ trợ từ nhân viên, hãy nhấn nút "Gặp nhân viên" nhé!',
            products: [],
            rating: null
        }]);
    };

    // Save to local storage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            const trimmed = messages.slice(-50);
            localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify({
                messages: trimmed,
                chatMode
            }));
        }
    }, [messages, sessionId, chatMode]);

    // Setup realtime subscription when in human mode
    useEffect(() => {
        if (chatMode === 'human' || chatMode === 'waiting') {
            setupRealtimeSubscription();
        }

        return () => {
            cleanupSubscriptions();
        };
    }, [chatMode, conversation?.id]);

    const setupRealtimeSubscription = async () => {
        if (!conversation?.id) return;

        // Subscribe to new messages
        messageSubscription.current = subscribeToMessages(conversation.id, (newMessage) => {
            // Only add if not from current user
            if (newMessage.sender_type !== 'user') {
                setMessages(prev => {
                    // Check if message already exists
                    if (prev.some(m => m.dbId === newMessage.id)) return prev;

                    return [...prev, {
                        id: uuidv4(),
                        dbId: newMessage.id,
                        role: 'assistant',
                        senderType: newMessage.sender_type,
                        senderName: newMessage.sender_name,
                        text: newMessage.message,
                        products: newMessage.metadata?.products || [],
                        timestamp: newMessage.created_at
                    }];
                });
            }
        });

        // Subscribe to conversation status changes
        conversationSubscription.current = subscribeToConversation(conversation.id, (updatedConvo) => {
            setConversation(updatedConvo);
            if (updatedConvo.status === 'active') {
                setChatMode('human');
                // Notify user that human joined
                setMessages(prev => [...prev, {
                    id: uuidv4(),
                    role: 'system',
                    senderType: 'system',
                    text: '👤 Nhân viên hỗ trợ đã tham gia cuộc trò chuyện!',
                    isSystemMessage: true
                }]);
            } else if (updatedConvo.status === 'closed') {
                setChatMode('ai');
                setMessages(prev => [...prev, {
                    id: uuidv4(),
                    role: 'system',
                    senderType: 'system',
                    text: '✅ Cuộc trò chuyện đã được đóng. Bạn có thể tiếp tục chat với AI.',
                    isSystemMessage: true
                }]);
            }
        });
    };

    const cleanupSubscriptions = () => {
        if (messageSubscription.current) {
            unsubscribeChannel(messageSubscription.current);
            messageSubscription.current = null;
        }
        if (conversationSubscription.current) {
            unsubscribeChannel(conversationSubscription.current);
            conversationSubscription.current = null;
        }
    };

    const toggleChat = () => setIsOpen(!isOpen);

    const clearHistory = () => {
        cleanupSubscriptions();
        setChatMode('ai');
        setConversation(null);
        initializeChat();
        localStorage.removeItem(`chat_history_${sessionId}`);
    };

    const rateResponse = async (messageId, rating) => {
        setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, rating } : msg
        ));
    };

    // Request human support
    const requestHuman = async () => {
        setIsLoading(true);

        try {
            // Get user info if available
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;
            const userEmail = session?.user?.email || null;

            // Create or get conversation
            let convo = conversation;
            if (!convo) {
                convo = await getOrCreateConversation(sessionId, userId, { email: userEmail });
                setConversation(convo);
            }

            if (convo) {
                // Update status to waiting
                await requestHumanSupport(convo.id);
                setChatMode('waiting');

                // Add system message
                setMessages(prev => [...prev, {
                    id: uuidv4(),
                    role: 'system',
                    senderType: 'system',
                    text: '⏳ Đang chờ nhân viên hỗ trợ... Vui lòng đợi trong giây lát.',
                    isSystemMessage: true
                }]);

                // Save current messages to DB
                for (const msg of messages.filter(m => m.role !== 'system')) {
                    await sendChatMessage(
                        convo.id,
                        msg.text,
                        msg.role === 'user' ? 'user' : 'ai',
                        null,
                        null,
                        { products: msg.products }
                    );
                }
            }
        } catch (error) {
            console.error('Error requesting human support:', error);
            setMessages(prev => [...prev, {
                id: uuidv4(),
                role: 'assistant',
                senderType: 'ai',
                text: 'Xin lỗi, không thể kết nối với nhân viên hỗ trợ lúc này. Vui lòng thử lại sau.',
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Send message (handles both AI and human modes)
    const sendMessage = async (userText) => {
        if (!userText.trim()) return;

        const userMsgId = uuidv4();
        const userMsgObj = {
            id: userMsgId,
            role: 'user',
            senderType: 'user',
            text: userText
        };

        const newMessages = [...messages, userMsgObj];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // If in human/waiting mode, send to realtime chat
            if (chatMode === 'human' || chatMode === 'waiting') {
                if (conversation?.id) {
                    const { data: { session } } = await supabase.auth.getSession();
                    await sendChatMessage(
                        conversation.id,
                        userText,
                        'user',
                        session?.user?.id,
                        session?.user?.email?.split('@')[0]
                    );
                }
                setIsLoading(false);
                return;
            }

            // AI Mode - use Gemini
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            const apiHistory = newMessages
                .filter(m => m.role !== 'system' && (m.role !== 'user' || m.text.trim()))
                .map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : m.role,
                    text: m.text
                }));

            const response = await sendMessageToGemini(userText, apiHistory, userId);

            const botMsgId = uuidv4();
            const botMsgObj = {
                id: botMsgId,
                role: 'assistant',
                senderType: 'ai',
                text: response.text,
                products: response.products || [],
                rating: null
            };

            setMessages(prev => [...prev, botMsgObj]);

            // Save to DB if user is logged in
            if (userId) {
                const { data, error: insertError } = await supabase.from('chat_history').insert({
                    user_id: userId,
                    user_message: userText,
                    bot_response: response.text,
                    products: response.products
                }).select('id').single();

                if (!insertError && data) {
                    setMessages(prev => prev.map(m =>
                        m.id === botMsgId ? { ...m, dbId: data.id } : m
                    ));
                }
            }

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: uuidv4(),
                role: 'assistant',
                senderType: 'ai',
                text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ChatBotContext.Provider value={{
            isOpen,
            toggleChat,
            messages,
            sendMessage,
            isLoading,
            rateResponse,
            clearHistory,
            // Hybrid chat
            chatMode,
            requestHuman,
            conversation
        }}>
            {children}
        </ChatBotContext.Provider>
    );
};