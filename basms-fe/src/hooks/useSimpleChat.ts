import { useCallback } from 'react';
import { useChatStore } from '../stores/useChatStore';

/**
 * Simple HTTP-only chat - No polling, no WebSocket, no complexity
 * Messages refresh only when:
 * 1. User opens a conversation
 * 2. User sends a message
 * 3. User clicks refresh button
 */
export const useSimpleChat = () => {
    const { setMessages, setHasMore, setOldestMessageId, prependMessages } = useChatStore();

    // ============================================================
    // FETCH MESSAGES (Initial load or refresh)
    // ============================================================
    const fetchMessages = useCallback(async (conversationId: string, beforeMessageId?: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return { success: false };
            }

            const params = new URLSearchParams({
                limit: '50',
            });

            if (beforeMessageId) {
                params.append('beforeMessageId', beforeMessageId);
            }

            const response = await fetch(
                `${apiUrl}/chats/conversations/${conversationId}/messages?${params}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const result = await response.json();
            const fetchedMessages = result.data.messages || [];

            if (beforeMessageId) {
                // Prepend older messages (for "Load More")
                prependMessages(conversationId, fetchedMessages.reverse());
            } else {
                // Set initial messages
                setMessages(conversationId, fetchedMessages.reverse());
            }

            setHasMore(conversationId, result.data.hasMore || false);
            setOldestMessageId(conversationId, result.data.oldestMessageId || null);

            return { success: true };
        } catch (err) {
            console.error('Error fetching messages:', err);
            return { success: false, error: err };
        }
    }, [setMessages, prependMessages, setHasMore, setOldestMessageId]);

    // ============================================================
    // SEND MESSAGE
    // ============================================================
    const sendMessage = useCallback(async (conversationId: string, content: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return { success: false };
            }

            const response = await fetch(`${apiUrl}/chats/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId,
                    content: content.trim(),
                    replyToMessageId: null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const result = await response.json();

            if (result.success) {
                // Refresh messages to get the new message
                await fetchMessages(conversationId);
            }

            return { success: true, data: result.data };
        } catch (err) {
            console.error('Error sending message:', err);
            return { success: false, error: err };
        }
    }, [fetchMessages]);

    // ============================================================
    // FETCH CONVERSATIONS
    // ============================================================
    const fetchConversations = useCallback(async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return { success: false };
            }

            const response = await fetch(`${apiUrl}/chats/conversations/get-all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch conversations');
            }

            const result = await response.json();
            const { setConversations } = useChatStore.getState();
            setConversations(result.data || []);

            return { success: true, data: result.data };
        } catch (err) {
            console.error('Error fetching conversations:', err);
            return { success: false, error: err };
        }
    }, []);

    return {
        fetchMessages,
        sendMessage,
        fetchConversations,
    };
};
