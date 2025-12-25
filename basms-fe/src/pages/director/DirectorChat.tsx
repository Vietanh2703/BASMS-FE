import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../stores/useChatStore';
import { useSignalRChat, ConnectionState } from '../../hooks/useSignalRChat';
import NewConversationModal from '../../components/NewConversationModal';
import './DirectorChat.css';

const DirectorChat = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Zustand store
    const {
        conversations,
        selectedConversationId,
        messages,
        hasMore,
        oldestMessageId,
        selectConversation,
        typingUsers,
    } = useChatStore();

    // SignalR real-time chat
    const {
        connectionState,
        isConnected,
        error: signalRError,
        fetchMessages,
        sendMessage: sendMessageAPI,
        fetchConversations: fetchConversationsAPI,
        joinConversation,
        leaveConversation,
        sendTypingIndicator,
        stopTypingIndicator
    } = useSignalRChat();

    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Get selected conversation object
    const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;
    const currentMessages = selectedConversationId ? (messages[selectedConversationId] || []) : [];
    const currentHasMore = selectedConversationId ? (hasMore[selectedConversationId] || false) : false;
    const currentOldestMessageId = selectedConversationId ? (oldestMessageId[selectedConversationId] || null) : null;
    const currentTypingUsers = selectedConversationId ? (typingUsers[selectedConversationId] || new Set()) : new Set();

    // Get typing users names (filter out current user)
    const typingUsersArray = Array.from(currentTypingUsers).filter(userId => userId !== user?.userId);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };

        if (isProfileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

    // Fetch conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    // Join/leave conversation and fetch messages when conversation changes
    useEffect(() => {
        if (selectedConversationId && isConnected) {
            // Join new conversation
            joinConversation(selectedConversationId);
            loadMessages(selectedConversationId);

            // Leave on cleanup
            return () => {
                leaveConversation(selectedConversationId);
            };
        }
    }, [selectedConversationId, isConnected]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

    const loadConversations = async () => {
        await fetchConversationsAPI();
    };

    const scrollToBottom = (smooth = true) => {
        // Use setTimeout to ensure DOM is updated before scrolling
        setTimeout(() => {
            if (messagesContainerRef.current) {
                // Scroll the container directly to avoid scrolling the whole page
                messagesContainerRef.current.scrollTo({
                    top: messagesContainerRef.current.scrollHeight,
                    behavior: smooth ? 'smooth' : 'auto'
                });
            }
        }, 100);
    };

    const loadMessages = async (conversationId: string, beforeMessageId?: string) => {
        setLoading(true);
        await fetchMessages(conversationId, beforeMessageId);
        setLoading(false);

        // Auto-scroll to bottom when loading new messages (not when loading older messages)
        if (!beforeMessageId) {
            scrollToBottom(false); // Instant scroll for initial load
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation || sending) {
            return;
        }

        setSending(true);
        const content = messageInput.trim();
        setMessageInput(''); // Clear input immediately for better UX

        // Clear typing timeout
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        const result = await sendMessageAPI(selectedConversation.id, content);

        if (result.success) {
            // Scroll to bottom to show new message (message will be added via SignalR)
            scrollToBottom();

            // Refresh conversations to update preview
            await loadConversations();
        } else {
            // Restore message input if failed
            setMessageInput(content);
        }

        setSending(false);
    };

    // Handle typing indicator
    const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setMessageInput(value);

        // Send typing indicator if connected and has conversation selected
        if (isConnected && selectedConversationId && value.trim()) {
            sendTypingIndicator(selectedConversationId);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
            }

            // Auto-stop typing after 3 seconds
            typingTimeoutRef.current = window.setTimeout(() => {
                if (selectedConversationId) {
                    stopTypingIndicator(selectedConversationId);
                }
            }, 3000);
        } else if (selectedConversationId && !value.trim()) {
            // Stop typing if input is cleared
            stopTypingIndicator(selectedConversationId);
            if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
    };


    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const loadMoreMessages = () => {
        if (selectedConversationId && currentOldestMessageId && !loading) {
            loadMessages(selectedConversationId, currentOldestMessageId);
        }
    };

    const handleSelectConversation = (conversationId: string) => {
        selectConversation(conversationId);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleLogout = async () => {
        setShowLogoutModal(true);
        setIsProfileDropdownOpen(false);
    };

    const confirmLogout = async () => {
        setIsLoggingOut(true);
        setShowLogoutModal(false);
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const formatDateTime = (date: Date) => {
        const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const dayName = days[date.getDay()];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <div className="dir-chat-container">
            <aside className={`dir-chat-sidebar ${isMenuOpen ? 'dir-chat-sidebar-open' : 'dir-chat-sidebar-closed'}`}>
                <div className="dir-chat-sidebar-header">
                    <div className="dir-chat-sidebar-logo">
                        <div className="dir-chat-logo-icon">D</div>
                        {isMenuOpen && <span className="dir-chat-logo-text">Director</span>}
                    </div>
                </div>

                <nav className="dir-chat-sidebar-nav">
                    <ul className="dir-chat-nav-list">
                        <li className="dir-chat-nav-item">
                            <Link to="/director/dashboard" className="dir-chat-nav-link">
                                <svg className="dir-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="dir-chat-nav-item">
                            <Link to="/director/customer-list" className="dir-chat-nav-link">
                                <svg className="dir-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="dir-chat-nav-item">
                            <Link to="/director/employee-control" className="dir-chat-nav-link">
                                <svg className="dir-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="dir-chat-nav-item">
                            <Link to="/director/analytics" className="dir-chat-nav-link">
                                <svg className="dir-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="dir-chat-nav-item">
                            <Link to="/director/incidents" className="dir-chat-nav-link">
                                <svg className="dir-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z"/>
                                </svg>
                                {isMenuOpen && <span>Sự cố</span>}
                            </Link>
                        </li>
                        <li className="dir-chat-nav-item dir-chat-nav-active">
                            <Link to="/director/chat" className="dir-chat-nav-link">
                                <svg className="dir-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                </svg>
                                {isMenuOpen && <span>Trò chuyện</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`dir-chat-main-content ${isMenuOpen ? 'dir-chat-content-expanded' : 'dir-chat-content-collapsed'}`}>
                <header className="dir-chat-nav-header">
                    <div className="dir-chat-nav-left">
                        <button className="dir-chat-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="dir-chat-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="dir-chat-nav-right">
                        <button className="dir-chat-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="dir-chat-notification-badge">0</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="dir-chat-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="dir-chat-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="dir-chat-user-info">
                                <span className="dir-chat-user-name">{user?.fullName || 'Director'}</span>
                                <span className="dir-chat-user-role">Giám đốc điều hành</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="dir-chat-profile-dropdown">
                                    <div
                                        className={`dir-chat-dropdown-item dir-chat-logout-item ${isLoggingOut ? 'dir-chat-disabled' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isLoggingOut) {
                                                handleLogout();
                                            }
                                        }}
                                        style={{
                                            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                                            opacity: isLoggingOut ? 0.5 : 1
                                        }}
                                    >
                                        <svg className="dir-chat-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="dir-chat-main">
                    <div className="dir-chat-page-header">
                        <h1 className="dir-chat-page-title">Trò chuyện</h1>
                    </div>

                    <div className="dir-chat-content-wrapper">
                        <div className="dir-chat-conversations-panel">
                            <div className="dir-chat-conversations-header">
                                <h2>Cuộc trò chuyện</h2>
                                <button
                                    className="dir-chat-new-conversation-btn"
                                    onClick={() => setShowNewChatModal(true)}
                                    title="Tạo cuộc trò chuyện mới"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="dir-chat-conversations-list">
                                {conversations.length === 0 ? (
                                    <div className="dir-chat-empty-conversations">
                                        Chưa có cuộc trò chuyện nào
                                    </div>
                                ) : (
                                    conversations.map(conversation => (
                                        <div
                                            key={conversation.id}
                                            className={`dir-chat-conversation-item ${selectedConversationId === conversation.id ? 'dir-chat-conversation-active' : ''}`}
                                            onClick={() => handleSelectConversation(conversation.id)}
                                        >
                                            <div className="dir-chat-conversation-avatar">
                                                {conversation.conversationName?.charAt(0).toUpperCase() || 'C'}
                                            </div>
                                            <div className="dir-chat-conversation-info">
                                                <div className="dir-chat-conversation-name">
                                                    {conversation.conversationName || `Conversation ${conversation.id.substring(0, 8)}`}
                                                </div>
                                                <div className="dir-chat-conversation-preview">
                                                    {conversation.lastMessagePreview || 'No messages yet'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="dir-chat-messages-panel">
                            {selectedConversation ? (
                                <>
                                    <div className="dir-chat-messages-header">
                                        <div>
                                            <h2>{selectedConversation.conversationName || `Conversation ${selectedConversation.id.substring(0, 8)}`}</h2>
                                            <div style={{ fontSize: '0.75rem', color: connectionState === ConnectionState.Connected ? '#4ade80' : connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Reconnecting ? '#fbbf24' : '#ef4444' }}>
                                                {connectionState === ConnectionState.Connected && '🟢 Đã kết nối'}
                                                {connectionState === ConnectionState.Connecting && '🟡 Đang kết nối...'}
                                                {connectionState === ConnectionState.Reconnecting && '🟡 Đang kết nối lại...'}
                                                {connectionState === ConnectionState.Disconnected && '🔴 Mất kết nối'}
                                                {connectionState === ConnectionState.Failed && `🔴 Lỗi: ${signalRError || 'Không thể kết nối'}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dir-chat-messages-container" ref={messagesContainerRef}>
                                        {currentHasMore && (
                                            <button
                                                className="dir-chat-load-more"
                                                onClick={loadMoreMessages}
                                                disabled={loading}
                                            >
                                                {loading ? 'Đang tải...' : 'Tải thêm tin nhắn'}
                                            </button>
                                        )}
                                        {currentMessages.length === 0 ? (
                                            <div className="dir-chat-empty-messages">
                                                Chưa có tin nhắn nào
                                            </div>
                                        ) : (
                                            currentMessages.map(message => (
                                                <div
                                                    key={message.id}
                                                    className={`dir-chat-message ${message.senderId === user?.userId ? 'dir-chat-message-own' : 'dir-chat-message-other'}`}
                                                >
                                                    <div className="dir-chat-message-content">
                                                        <div className="dir-chat-message-sender">{message.senderName}</div>
                                                        <div className="dir-chat-message-text">{message.content}</div>
                                                        <div className="dir-chat-message-time">
                                                            {formatMessageTime(message.createdAt)}
                                                            {message.isEdited && <span className="dir-chat-message-edited"> (đã chỉnh sửa)</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    {typingUsersArray.length > 0 && (
                                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                                            {typingUsersArray.length === 1 ? 'Đang soạn tin nhắn...' : `${typingUsersArray.length} người đang soạn tin nhắn...`}
                                        </div>
                                    )}
                                    <div className="dir-chat-input-container">
                                        <textarea
                                            className="dir-chat-input"
                                            placeholder="Nhập tin nhắn..."
                                            value={messageInput}
                                            onChange={handleMessageInputChange}
                                            onKeyPress={handleKeyPress}
                                            rows={2}
                                            disabled={!isConnected}
                                        />
                                        <button
                                            className="dir-chat-send-btn"
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim() || sending || !isConnected}
                                        >
                                            {sending ? 'Đang gửi...' : 'Gửi'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="dir-chat-no-conversation">
                                    Chọn một cuộc trò chuyện để bắt đầu
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="dir-chat-modal-overlay" onClick={cancelLogout}>
                    <div className="dir-chat-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dir-chat-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="dir-chat-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="dir-chat-modal-footer">
                            <button className="dir-chat-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="dir-chat-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNewChatModal && (
                <NewConversationModal
                    isOpen={showNewChatModal}
                    onClose={() => setShowNewChatModal(false)}
                />
            )}
        </div>
    );
};

export default DirectorChat;
