import { useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useChatStore, type Message } from '../stores/useChatStore';

export const useSignalR = () => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const {
        addMessage,
        updateConversationPreview,
        updateMessage,
        deleteMessage,
        setUserOnline,
        setUserOffline,
        setUserTyping,
        setUserStoppedTyping
    } = useChatStore();

    // ============================================================
    // USE REFS TO AVOID RE-CREATING CONNECTION
    // ============================================================
    const addMessageRef = useRef(addMessage);
    const updateConversationPreviewRef = useRef(updateConversationPreview);
    const updateMessageRef = useRef(updateMessage);
    const deleteMessageRef = useRef(deleteMessage);
    const setUserOnlineRef = useRef(setUserOnline);
    const setUserOfflineRef = useRef(setUserOffline);
    const setUserTypingRef = useRef(setUserTyping);
    const setUserStoppedTypingRef = useRef(setUserStoppedTyping);

    // Update refs when store functions change
    useEffect(() => {
        addMessageRef.current = addMessage;
        updateConversationPreviewRef.current = updateConversationPreview;
        updateMessageRef.current = updateMessage;
        deleteMessageRef.current = deleteMessage;
        setUserOnlineRef.current = setUserOnline;
        setUserOfflineRef.current = setUserOffline;
        setUserTypingRef.current = setUserTyping;
        setUserStoppedTypingRef.current = setUserStoppedTyping;
    }, [addMessage, updateConversationPreview, updateMessage, deleteMessage, setUserOnline, setUserOffline, setUserTyping, setUserStoppedTyping]);

    // ============================================================
    // CREATE CONNECTION ONLY ONCE
    // ============================================================
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        if (!token || !apiUrl) {
            console.warn('No access token or API URL found for SignalR connection');
            return;
        }

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/chathub`, {
                accessTokenFactory: () => token,
                skipNegotiation: true,  // ✅ Skip negotiate to avoid CORS issues
                transport: signalR.HttpTransportType.WebSockets  // ✅ Force WebSocket
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // Exponential backoff: 0s, 2s, 10s, 30s, then 30s for subsequent retries
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount === 1) return 2000;
                    if (retryContext.previousRetryCount === 2) return 10000;
                    return 30000;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // ============================================================
        // EVENT LISTENERS - Use refs to access latest store functions
        // ============================================================

        // Receive new message
        newConnection.on('ReceiveMessage', (message: Message) => {
            console.log('SignalR: ReceiveMessage', message);

            // Use ref to call latest version of addMessage
            addMessageRef.current(message.conversationId, message);

            // Update conversation preview
            const preview = message.content?.substring(0, 150) || '';
            updateConversationPreviewRef.current(
                message.conversationId,
                preview,
                message.senderName,
                message.createdAt
            );
        });

        // Message edited
        newConnection.on('MessageEdited', (messageId: string, conversationId: string, newContent: string, editedAt: string) => {
            console.log('SignalR: MessageEdited', { messageId, conversationId, newContent });

            updateMessageRef.current(conversationId, messageId, {
                content: newContent,
                isEdited: true,
                editedAt: editedAt
            });
        });

        // Message deleted
        newConnection.on('MessageDeleted', (messageId: string, conversationId: string) => {
            console.log('SignalR: MessageDeleted', { messageId, conversationId });

            deleteMessageRef.current(conversationId, messageId);
        });

        // User online/offline status
        newConnection.on('UserOnline', (userId: string) => {
            console.log('SignalR: UserOnline', userId);
            setUserOnlineRef.current(userId);
        });

        newConnection.on('UserOffline', (userId: string, lastSeen: string) => {
            console.log('SignalR: UserOffline', { userId, lastSeen });
            setUserOfflineRef.current(userId);
        });

        // Typing indicators
        newConnection.on('UserIsTyping', (userId: string, conversationId: string) => {
            console.log('SignalR: UserIsTyping', { userId, conversationId });
            setUserTypingRef.current(conversationId, userId);
        });

        newConnection.on('UserStoppedTyping', (userId: string, conversationId: string) => {
            console.log('SignalR: UserStoppedTyping', { userId, conversationId });
            setUserStoppedTypingRef.current(conversationId, userId);
        });

        // Connection state changes
        newConnection.onreconnecting((error) => {
            console.warn('SignalR: Reconnecting...', error);
            setIsConnected(false);
        });

        newConnection.onreconnected((connectionId) => {
            console.log('SignalR: Reconnected', connectionId);
            setIsConnected(true);
        });

        newConnection.onclose((error) => {
            console.error('SignalR: Connection closed', error);
            setIsConnected(false);
        });

        // ============================================================
        // START CONNECTION
        // ============================================================
        newConnection.start()
            .then(() => {
                console.log('SignalR: Connected successfully');
                setIsConnected(true);
                setConnection(newConnection);
            })
            .catch((err) => {
                console.error('SignalR: Connection error', err);
                setIsConnected(false);
            });

        // Cleanup on unmount
        return () => {
            if (newConnection.state === signalR.HubConnectionState.Connected) {
                newConnection.stop()
                    .then(() => console.log('SignalR: Disconnected'))
                    .catch((err) => console.error('SignalR: Error during disconnect', err));
            }
        };
    }, []); // ← EMPTY DEPENDENCIES - Connection only created once!

    // ============================================================
    // METHODS
    // ============================================================

    const joinConversation = useCallback(async (conversationId: string) => {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            try {
                await connection.invoke('JoinConversation', conversationId);
                console.log(`SignalR: Joined conversation ${conversationId}`);
            } catch (err) {
                console.error(`SignalR: Error joining conversation ${conversationId}`, err);
            }
        } else {
            console.warn('SignalR: Cannot join conversation - not connected');
        }
    }, [connection]);

    const leaveConversation = useCallback(async (conversationId: string) => {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            try {
                await connection.invoke('LeaveConversation', conversationId);
                console.log(`SignalR: Left conversation ${conversationId}`);
            } catch (err) {
                console.error(`SignalR: Error leaving conversation ${conversationId}`, err);
            }
        }
    }, [connection]);

    const sendTypingIndicator = useCallback(async (conversationId: string) => {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            try {
                await connection.invoke('SendTypingIndicator', conversationId);
            } catch (err) {
                console.error('SignalR: Error sending typing indicator', err);
            }
        }
    }, [connection]);

    const stopTypingIndicator = useCallback(async (conversationId: string) => {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            try {
                await connection.invoke('StopTypingIndicator', conversationId);
            } catch (err) {
                console.error('SignalR: Error stopping typing indicator', err);
            }
        }
    }, [connection]);

    return {
        connection,
        isConnected,
        joinConversation,
        leaveConversation,
        sendTypingIndicator,
        stopTypingIndicator
    };
};
