import { supabase } from '@/lib/customSupabaseClient';

// =============================================
// CHAT SERVICE - Hybrid AI + Human Support
// =============================================

/**
 * Get or create a conversation for the current session
 */
export const getOrCreateConversation = async (sessionId, userId = null, userInfo = {}) => {
    try {
        // Check if conversation exists
        let query = supabase
            .from('chat_conversations')
            .select('*')
            .eq('session_id', sessionId)
            .neq('status', 'closed')
            .order('created_at', { ascending: false })
            .limit(1);

        const { data: existing, error: fetchError } = await query;

        if (fetchError) {
            console.warn('Chat fetch error (table may not exist):', fetchError.message);
            return null;
        }

        if (existing && existing.length > 0) {
            return existing[0];
        }

        // Create new conversation
        const { data: newConvo, error: createError } = await supabase
            .from('chat_conversations')
            .insert({
                session_id: sessionId,
                user_id: userId,
                user_name: userInfo.name || null,
                user_email: userInfo.email || null,
                user_phone: userInfo.phone || null,
                status: 'ai'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating conversation:', createError);
            return null;
        }

        return newConvo;
    } catch (error) {
        console.error('getOrCreateConversation error:', error);
        return null;
    }
};

/**
 * Send a message in a conversation
 */
export const sendChatMessage = async (conversationId, message, senderType, senderId = null, senderName = null, metadata = {}) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                message,
                sender_type: senderType, // 'user', 'ai', 'admin'
                sender_id: senderId,
                sender_name: senderName,
                metadata
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error };
    }
};

/**
 * Get messages for a conversation
 */
export const getConversationMessages = async (conversationId, limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
};

/**
 * Request human support - updates conversation status
 */
export const requestHumanSupport = async (conversationId) => {
    try {
        const { data, error } = await supabase
            .from('chat_conversations')
            .update({ status: 'waiting', updated_at: new Date().toISOString() })
            .eq('id', conversationId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error requesting human support:', error);
        return { success: false, error };
    }
};

/**
 * Admin: Get all conversations (for support dashboard)
 */
export const adminGetConversations = async (status = null) => {
    try {
        let query = supabase
            .from('chat_conversations')
            .select('*')
            .order('last_message_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching admin conversations:', error);
        return [];
    }
};

/**
 * Admin: Assign conversation to self
 */
export const adminAssignConversation = async (conversationId, adminId) => {
    try {
        const { data, error } = await supabase
            .from('chat_conversations')
            .update({
                status: 'active',
                assigned_admin: adminId,
                updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error assigning conversation:', error);
        return { success: false, error };
    }
};

/**
 * Admin: Close conversation
 */
export const adminCloseConversation = async (conversationId) => {
    try {
        const { data, error } = await supabase
            .from('chat_conversations')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error closing conversation:', error);
        return { success: false, error };
    }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId, senderType) => {
    try {
        const { error } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_type', senderType);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return { success: false, error };
    }
};

/**
 * Subscribe to new messages in a conversation (Realtime)
 */
export const subscribeToMessages = (conversationId, callback) => {
    const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return channel;
};

/**
 * Subscribe to conversation status changes
 */
export const subscribeToConversation = (conversationId, callback) => {
    const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'chat_conversations',
                filter: `id=eq.${conversationId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return channel;
};

/**
 * Admin: Subscribe to all waiting conversations
 */
export const subscribeToWaitingConversations = (callback) => {
    const channel = supabase
        .channel('waiting_conversations')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chat_conversations'
            },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();

    return channel;
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribeChannel = (channel) => {
    if (channel) {
        supabase.removeChannel(channel);
    }
};

/**
 * Get unread message count for admin
 */
export const getUnreadCount = async () => {
    try {
        const { count, error } = await supabase
            .from('chat_conversations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'waiting');

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};