import { useEffect, useCallback, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useChatStore, type Message } from '../stores/useChatStore';

interface MessageDto {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    messageType: string;
    content: string | null;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    fileType: string | null;
    thumbnailUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    locationAddress: string | null;
    locationMapUrl: string | null;
    replyToMessageId: string | null;
    isEdited: boolean;
    editedAt: string | null;
    createdAt: string;
}

export const ConnectionState = {
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
    Connected: 'Connected',
    Reconnecting: 'Reconnecting',
    Failed: 'Failed'
} as const;

export type ConnectionState = typeof ConnectionState[keyof typeof ConnectionState];

/**
 * SignalR-based real-time chat hook
 * Manages WebSocket connection, message handling, and presence
 */
export const useSignalRChat = () => {
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
    const [error, setError] = useState<string | null>(null);

    const {
        addMessage,
        updateMessage,
        deleteMessage,
        setUserOnline,
        setUserOffline,
        setUserTyping,
        setUserStoppedTyping,
        updateConversationPreview,
        setMessages,
        setHasMore,
        setOldestMessageId,
        prependMessages
    } = useChatStore();

    // ============================================================
    // SIGNALR CONNECTION SETUP
    // ============================================================
    const connect = useCallback(async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                setError('No access token found');
                return false;
            }

            // Create SignalR connection
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`${apiUrl}/chathub`, {
                    accessTokenFactory: () => token,
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: retryContext => {
                        // Exponential backoff: 0s, 2s, 10s, 30s, then 60s
                        if (retryContext.previousRetryCount === 0) return 0;
                        if (retryContext.previousRetryCount === 1) return 2000;
                        if (retryContext.previousRetryCount === 2) return 10000;
                        if (retryContext.previousRetryCount === 3) return 30000;
                        return 60000;
                    }
                })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // ============================================================
            // EVENT HANDLERS - MESSAGES
            // ============================================================
            connection.on('ReceiveMessage', (messageDto: MessageDto) => {
                console.log('📩 ReceiveMessage:', messageDto);

                const message: Message = {
                    id: messageDto.id,
                    conversationId: messageDto.conversationId,
                    senderId: messageDto.senderId,
                    senderName: messageDto.senderName,
                    senderAvatarUrl: messageDto.senderAvatarUrl,
                    messageType: messageDto.messageType,
                    content: messageDto.content || '',
                    fileUrl: messageDto.fileUrl,
                    fileName: messageDto.fileName,
                    fileSize: messageDto.fileSize,
                    fileType: messageDto.fileType,
                    thumbnailUrl: messageDto.thumbnailUrl,
                    latitude: messageDto.latitude,
                    longitude: messageDto.longitude,
                    locationAddress: messageDto.locationAddress,
                    locationMapUrl: messageDto.locationMapUrl,
                    replyToMessageId: messageDto.replyToMessageId,
                    isEdited: messageDto.isEdited,
                    editedAt: messageDto.editedAt,
                    createdAt: messageDto.createdAt
                };

                // Add message to store
                addMessage(messageDto.conversationId, message);

                // Update conversation preview
                updateConversationPreview(
                    messageDto.conversationId,
                    messageDto.content || '[File]',
                    messageDto.senderName,
                    messageDto.createdAt
                );
            });

            connection.on('MessageEdited', (messageId: string, newContent: string, editedAt: string) => {
                console.log('✏️ MessageEdited:', { messageId, newContent, editedAt });

                // Find conversation that contains this message
                const state = useChatStore.getState();
                for (const [conversationId, messages] of Object.entries(state.messages)) {
                    if (messages.some(msg => msg.id === messageId)) {
                        updateMessage(conversationId, messageId, {
                            content: newContent,
                            isEdited: true,
                            editedAt: editedAt
                        });
                        break;
                    }
                }
            });

            connection.on('MessageDeleted', (messageId: string) => {
                console.log('🗑️ MessageDeleted:', messageId);

                // Find and delete message from appropriate conversation
                const state = useChatStore.getState();
                for (const [conversationId, messages] of Object.entries(state.messages)) {
                    if (messages.some(msg => msg.id === messageId)) {
                        deleteMessage(conversationId, messageId);
                        break;
                    }
                }
            });

            // ============================================================
            // EVENT HANDLERS - PRESENCE
            // ============================================================
            connection.on('UserOnline', (userId: string) => {
                console.log('🟢 UserOnline:', userId);
                setUserOnline(userId);
            });

            connection.on('UserOffline', (userId: string) => {
                console.log('🔴 UserOffline:', userId);
                setUserOffline(userId);
            });

            // ============================================================
            // EVENT HANDLERS - TYPING INDICATORS
            // ============================================================
            connection.on('UserIsTyping', (userId: string, conversationId: string) => {
                console.log('⌨️ UserIsTyping:', { userId, conversationId });
                setUserTyping(conversationId, userId);
            });

            connection.on('UserStoppedTyping', (userId: string, conversationId: string) => {
                console.log('⏹️ UserStoppedTyping:', { userId, conversationId });
                setUserStoppedTyping(conversationId, userId);
            });

            // ============================================================
            // CONNECTION STATE HANDLERS
            // ============================================================
            connection.onreconnecting((error) => {
                console.warn('🔄 SignalR reconnecting...', error);
                setConnectionState(ConnectionState.Reconnecting);
                setError(error?.message || 'Reconnecting...');
            });

            connection.onreconnected((connectionId) => {
                console.log('✅ SignalR reconnected:', connectionId);
                setConnectionState(ConnectionState.Connected);
                setError(null);
            });

            connection.onclose((error) => {
                console.error('❌ SignalR connection closed:', error);
                setConnectionState(ConnectionState.Disconnected);
                setError(error?.message || 'Connection closed');
            });

            // Start connection
            setConnectionState(ConnectionState.Connecting);
            await connection.start();

            console.log('✅ SignalR Connected:', connection.connectionId);
            setConnectionState(ConnectionState.Connected);
            setError(null);

            connectionRef.current = connection;
            return true;

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('❌ SignalR connection failed:', errorMessage);
            setConnectionState(ConnectionState.Failed);
            setError(errorMessage);
            return false;
        }
    }, [addMessage, updateMessage, deleteMessage, setUserOnline, setUserOffline, setUserTyping, setUserStoppedTyping, updateConversationPreview]);

    // ============================================================
    // DISCONNECT
    // ============================================================
    const disconnect = useCallback(async () => {
        if (connectionRef.current) {
            await connectionRef.current.stop();
            connectionRef.current = null;
            setConnectionState(ConnectionState.Disconnected);
            console.log('🔌 SignalR disconnected');
        }
    }, []);

    // ============================================================
    // JOIN/LEAVE CONVERSATION
    // ============================================================
    const joinConversation = useCallback(async (conversationId: string) => {
        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            try {
                await connectionRef.current.invoke('JoinConversation', conversationId);
                console.log('✅ Joined conversation:', conversationId);
            } catch (err) {
                console.error('❌ Failed to join conversation:', err);
            }
        }
    }, []);

    const leaveConversation = useCallback(async (conversationId: string) => {
        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            try {
                await connectionRef.current.invoke('LeaveConversation', conversationId);
                console.log('✅ Left conversation:', conversationId);
            } catch (err) {
                console.error('❌ Failed to leave conversation:', err);
            }
        }
    }, []);

    // ============================================================
    // TYPING INDICATORS
    // ============================================================
    const sendTypingIndicator = useCallback(async (conversationId: string) => {
        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            try {
                await connectionRef.current.invoke('SendTypingIndicator', conversationId);
            } catch (err) {
                console.error('❌ Failed to send typing indicator:', err);
            }
        }
    }, []);

    const stopTypingIndicator = useCallback(async (conversationId: string) => {
        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            try {
                await connectionRef.current.invoke('StopTypingIndicator', conversationId);
            } catch (err) {
                console.error('❌ Failed to stop typing indicator:', err);
            }
        }
    }, []);

    // ============================================================
    // FETCH MESSAGES (HTTP fallback for initial load)
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
    // SEND MESSAGE (HTTP API)
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

            // Stop typing indicator after sending
            await stopTypingIndicator(conversationId);

            // Message will be received via SignalR ReceiveMessage event
            return { success: true, data: result.data };
        } catch (err) {
            console.error('Error sending message:', err);
            return { success: false, error: err };
        }
    }, [stopTypingIndicator]);

    // ============================================================
    // FETCH CONVERSATIONS (HTTP API)
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

    // ============================================================
    // LIFECYCLE - Auto-connect on mount, disconnect on unmount
    // ============================================================
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        // Connection state
        connectionState,
        isConnected: connectionState === ConnectionState.Connected,
        error,

        // Connection methods
        connect,
        disconnect,

        // Conversation methods
        joinConversation,
        leaveConversation,

        // Typing indicators
        sendTypingIndicator,
        stopTypingIndicator,

        // HTTP methods (for initial loads and sending messages)
        fetchMessages,
        sendMessage,
        fetchConversations,
    };
};
