import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../stores/useChatStore';

/**
 * HTTP Polling alternative to SignalR
 * Polls for new messages every 3 seconds
 * Simple, reliable, no CORS/WebSocket issues
 */
export const usePollingChat = () => {
    const [isConnected, setIsConnected] = useState(false);
    const { selectedConversationId, messages } = useChatStore();
    const { addMessage, updateConversationPreview } = useChatStore();
    const intervalRef = useRef<number | null>(null);

    // ============================================================
    // POLL FOR NEW MESSAGES
    // ============================================================
    const pollMessages = async (conversationId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token || !apiUrl) return;

            // Get current messages for this conversation
            const currentMessages = messages[conversationId] || [];

            // Get last message timestamp
            const lastMessageTime = currentMessages.length > 0
                ? currentMessages[currentMessages.length - 1].createdAt
                : null;

            // Fetch latest messages
            const response = await fetch(
                `${apiUrl}/chats/conversations/${conversationId}/messages?limit=50`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) return;

            const result = await response.json();
            const fetchedMessages = (result.data.messages || []).reverse();

            // Find new messages (messages after lastMessageTime)
            const newMessages = lastMessageTime
                ? fetchedMessages.filter((msg: any) => msg.createdAt > lastMessageTime)
                : [];

            // Add new messages to store
            newMessages.forEach((msg: any) => {
                console.log('Polling: New message received', msg);
                addMessage(conversationId, msg);

                // Update conversation preview
                const preview = msg.content?.substring(0, 150) || '';
                updateConversationPreview(
                    conversationId,
                    preview,
                    msg.senderName,
                    msg.createdAt
                );
            });

        } catch (err) {
            console.error('Polling error:', err);
        }
    };

    // ============================================================
    // START/STOP POLLING BASED ON SELECTED CONVERSATION
    // ============================================================
    useEffect(() => {
        if (!selectedConversationId) {
            setIsConnected(false);
            return;
        }

        setIsConnected(true);

        // Poll immediately on conversation change
        pollMessages(selectedConversationId);

        // Then poll every 3 seconds
        intervalRef.current = setInterval(() => {
            if (selectedConversationId) {
                pollMessages(selectedConversationId);
            }
        }, 3000); // Poll every 3 seconds

        console.log(`Polling: Started for conversation ${selectedConversationId}`);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            console.log(`Polling: Stopped for conversation ${selectedConversationId}`);
        };
    }, [selectedConversationId]);

    // ============================================================
    // DUMMY METHODS (for compatibility with SignalR interface)
    // ============================================================
    const joinConversation = async (_conversationId: string) => {
        // No-op for polling (auto-polls selected conversation)
        return Promise.resolve();
    };

    const leaveConversation = async (_conversationId: string) => {
        // No-op for polling
        return Promise.resolve();
    };

    const sendTypingIndicator = async (_conversationId: string) => {
        // Not implemented for polling
        return Promise.resolve();
    };

    const stopTypingIndicator = async (_conversationId: string) => {
        // Not implemented for polling
        return Promise.resolve();
    };

    return {
        connection: null,
        isConnected,
        joinConversation,
        leaveConversation,
        sendTypingIndicator,
        stopTypingIndicator
    };
};
