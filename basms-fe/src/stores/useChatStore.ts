import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    messageType: string;
    content: string;
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

export interface Conversation {
    id: string;
    conversationType: string;
    conversationName: string | null;
    shiftId: string | null;
    incidentId: string | null;
    teamId: string | null;
    contractId: string | null;
    isActive: boolean;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    lastMessageSenderId: string | null;
    lastMessageSenderName: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string | null;
}

interface ChatStore {
    // State
    conversations: Conversation[];
    selectedConversationId: string | null;
    messages: Record<string, Message[]>; // conversationId -> messages array
    hasMore: Record<string, boolean>; // conversationId -> hasMore flag
    oldestMessageId: Record<string, string | null>; // conversationId -> oldestMessageId
    onlineUsers: Set<string>; // userId set for online users
    typingUsers: Record<string, Set<string>>; // conversationId -> Set of userId who are typing

    // Actions
    setConversations: (conversations: Conversation[]) => void;
    addConversation: (conversation: Conversation) => void;
    updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
    selectConversation: (conversationId: string | null) => void;

    setMessages: (conversationId: string, messages: Message[]) => void;
    addMessage: (conversationId: string, message: Message) => void;
    prependMessages: (conversationId: string, messages: Message[]) => void;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (conversationId: string, messageId: string) => void;

    setHasMore: (conversationId: string, hasMore: boolean) => void;
    setOldestMessageId: (conversationId: string, messageId: string | null) => void;

    updateConversationPreview: (conversationId: string, preview: string, senderName: string, timestamp: string) => void;

    // Online status
    setUserOnline: (userId: string) => void;
    setUserOffline: (userId: string) => void;

    // Typing indicators
    setUserTyping: (conversationId: string, userId: string) => void;
    setUserStoppedTyping: (conversationId: string, userId: string) => void;

    clearStore: () => void;
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set, _get) => ({
            conversations: [],
            selectedConversationId: null,
            messages: {},
            hasMore: {},
            oldestMessageId: {},
            onlineUsers: new Set(),
            typingUsers: {},

            setConversations: (conversations) => set({ conversations }),

            addConversation: (conversation) => set((state) => ({
                conversations: [conversation, ...state.conversations]
            })),

            updateConversation: (conversationId, updates) => set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === conversationId ? { ...conv, ...updates } : conv
                )
            })),

            selectConversation: (conversationId) => set({ selectedConversationId: conversationId }),

            setMessages: (conversationId, messages) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: messages
                }
            })),

            addMessage: (conversationId, message) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: [...(state.messages[conversationId] || []), message]
                }
            })),

            prependMessages: (conversationId, messages) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: [...messages, ...(state.messages[conversationId] || [])]
                }
            })),

            updateMessage: (conversationId, messageId, updates) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).map((msg) =>
                        msg.id === messageId ? { ...msg, ...updates } : msg
                    )
                }
            })),

            deleteMessage: (conversationId, messageId) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).filter(
                        (msg) => msg.id !== messageId
                    )
                }
            })),

            setHasMore: (conversationId, hasMore) => set((state) => ({
                hasMore: {
                    ...state.hasMore,
                    [conversationId]: hasMore
                }
            })),

            setOldestMessageId: (conversationId, messageId) => set((state) => ({
                oldestMessageId: {
                    ...state.oldestMessageId,
                    [conversationId]: messageId
                }
            })),

            updateConversationPreview: (conversationId, preview, senderName, timestamp) => set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === conversationId
                        ? {
                            ...conv,
                            lastMessagePreview: preview,
                            lastMessageSenderName: senderName,
                            lastMessageAt: timestamp
                        }
                        : conv
                )
            })),

            setUserOnline: (userId) => set((state) => {
                const newOnlineUsers = new Set(state.onlineUsers);
                newOnlineUsers.add(userId);
                return { onlineUsers: newOnlineUsers };
            }),

            setUserOffline: (userId) => set((state) => {
                const newOnlineUsers = new Set(state.onlineUsers);
                newOnlineUsers.delete(userId);
                return { onlineUsers: newOnlineUsers };
            }),

            setUserTyping: (conversationId, userId) => set((state) => {
                const newTypingUsers = { ...state.typingUsers };
                if (!newTypingUsers[conversationId]) {
                    newTypingUsers[conversationId] = new Set();
                }
                newTypingUsers[conversationId] = new Set(newTypingUsers[conversationId]);
                newTypingUsers[conversationId].add(userId);
                return { typingUsers: newTypingUsers };
            }),

            setUserStoppedTyping: (conversationId, userId) => set((state) => {
                const newTypingUsers = { ...state.typingUsers };
                if (newTypingUsers[conversationId]) {
                    newTypingUsers[conversationId] = new Set(newTypingUsers[conversationId]);
                    newTypingUsers[conversationId].delete(userId);
                    if (newTypingUsers[conversationId].size === 0) {
                        delete newTypingUsers[conversationId];
                    }
                }
                return { typingUsers: newTypingUsers };
            }),

            clearStore: () => set({
                conversations: [],
                selectedConversationId: null,
                messages: {},
                hasMore: {},
                oldestMessageId: {},
                onlineUsers: new Set(),
                typingUsers: {}
            })
        }),
        {
            name: 'chat-storage',
            partialize: (state) => ({
                conversations: state.conversations,
                selectedConversationId: state.selectedConversationId,
                messages: state.messages,
                hasMore: state.hasMore,
                oldestMessageId: state.oldestMessageId
            })
        }
    )
);
