import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../stores/useChatStore';
import { useSignalR } from '../../hooks/useSignalR';
import NewConversationModalForManager from '../../components/NewConversationModalForManager';
import './ManagerChat.css';

const ManagerChat = () => {
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
        setConversations,
        selectConversation,
        setMessages,
        prependMessages,
        setHasMore,
        setOldestMessageId
    } = useChatStore();

    // SignalR connection
    const { isConnected, joinConversation, leaveConversation } = useSignalR();

    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Get selected conversation object
    const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;
    const currentMessages = selectedConversationId ? (messages[selectedConversationId] || []) : [];
    const currentHasMore = selectedConversationId ? (hasMore[selectedConversationId] || false) : false;
    const currentOldestMessageId = selectedConversationId ? (oldestMessageId[selectedConversationId] || null) : null;

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
        fetchConversations();
    }, []);

    // Join/Leave conversation via SignalR when selected conversation changes
    useEffect(() => {
        let isActive = true;

        const handleConversationChange = async () => {
            if (selectedConversationId && isConnected) {
                // ✅ FIX: Await joinConversation to ensure user is in group before sending messages
                await joinConversation(selectedConversationId);

                // Only fetch messages if component is still mounted and conversation hasn't changed
                if (isActive && !messages[selectedConversationId]) {
                    fetchMessages(selectedConversationId);
                }
            }
        };

        handleConversationChange();

        return () => {
            isActive = false;
            if (selectedConversationId) {
                leaveConversation(selectedConversationId);
            }
        };
    }, [selectedConversationId, isConnected]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

    const fetchConversations = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return;
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
            setConversations(result.data || []);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const fetchMessages = async (conversationId: string, beforeMessageId?: string) => {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return;
            }

            const params = new URLSearchParams({
                limit: '50',
            });

            if (beforeMessageId) {
                params.append('beforeMessageId', beforeMessageId);
            }

            const response = await fetch(`${apiUrl}/chats/conversations/${conversationId}/messages?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const result = await response.json();
            const fetchedMessages = result.data.messages || [];

            if (beforeMessageId) {
                // Prepend older messages
                prependMessages(conversationId, fetchedMessages.reverse());
            } else {
                // Set initial messages
                setMessages(conversationId, fetchedMessages.reverse());
            }

            setHasMore(conversationId, result.data.hasMore || false);
            setOldestMessageId(conversationId, result.data.oldestMessageId || null);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation || sending) {
            return;
        }

        try {
            setSending(true);
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return;
            }

            const response = await fetch(`${apiUrl}/chats/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId: selectedConversation.id,
                    content: messageInput.trim(),
                    replyToMessageId: null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const result = await response.json();

            if (result.success) {
                // ✅ Message will be added automatically via SignalR ReceiveMessage event
                // No need to add it here (prevents duplicate messages)
                setMessageInput('');

                // Refresh conversations to update preview
                fetchConversations();
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMoreMessages = () => {
        if (selectedConversationId && currentOldestMessageId && !loading) {
            fetchMessages(selectedConversationId, currentOldestMessageId);
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
        <div className="mgr-chat-wrapper">
            <aside className={`mgr-chat-sidebar ${isMenuOpen ? 'mgr-chat-sidebar-open' : 'mgr-chat-sidebar-closed'}`}>
                <div className="mgr-chat-sidebar-header">
                    <div className="mgr-chat-sidebar-logo">
                        <div className="mgr-chat-logo-icon">B</div>
                        {isMenuOpen && <span className="mgr-chat-logo-text">BASMS</span>}
                    </div>
                </div>

                <nav className="mgr-chat-sidebar-nav">
                    <ul className="mgr-chat-nav-list">
                        <li className="mgr-chat-nav-item">
                            <a href="/manager/dashboard" className="mgr-chat-nav-link">
                                <svg className="mgr-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="mgr-chat-nav-item">
                            <a href="/manager/guard-list" className="mgr-chat-nav-link">
                                <svg className="mgr-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân viên</span>}
                            </a>
                        </li>
                        <li className="mgr-chat-nav-item">
                            <a href="/manager/request" className="mgr-chat-nav-link">
                                <svg className="mgr-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
                                {isMenuOpen && <span>Yêu cầu phân công</span>}
                            </a>
                        </li>
                        <li className="mgr-chat-nav-item">
                            <a href="/manager/shift-assignment" className="mgr-chat-nav-link">
                                <svg className="mgr-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                                {isMenuOpen && <span>Phân công ca làm</span>}
                            </a>
                        </li>
                        <li className="mgr-chat-nav-item mgr-chat-nav-active">
                            <a href="/manager/chat" className="mgr-chat-nav-link">
                                <svg className="mgr-chat-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                </svg>
                                {isMenuOpen && <span>Trò chuyện</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`mgr-chat-main-content ${isMenuOpen ? 'mgr-chat-content-expanded' : 'mgr-chat-content-collapsed'}`}>
                <header className="mgr-chat-nav-header">
                    <div className="mgr-chat-nav-left">
                        <button className="mgr-chat-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="mgr-chat-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="mgr-chat-nav-right">
                        {isConnected && (
                            <div className="mgr-chat-connection-status">
                                <span className="mgr-chat-connection-dot"></span>
                                <span className="mgr-chat-connection-text">Đang kết nối</span>
                            </div>
                        )}

                        <button className="mgr-chat-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="mgr-chat-notification-badge">0</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="mgr-chat-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="mgr-chat-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'M'}</span>
                            </div>
                            <div className="mgr-chat-user-info">
                                <span className="mgr-chat-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'Manager User'}
                                </span>
                                <span className="mgr-chat-user-role">Quản lý</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="mgr-chat-profile-dropdown">
                                    <div
                                        className={`mgr-chat-dropdown-item mgr-chat-logout-item ${isLoggingOut ? 'mgr-chat-disabled' : ''}`}
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
                                        <svg className="mgr-chat-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mgr-chat-main">
                    <div className="mgr-chat-page-header">
                        <h1 className="mgr-chat-page-title">Trò chuyện</h1>
                    </div>

                    <div className="mgr-chat-content-wrapper">
                        <div className="mgr-chat-conversations-panel">
                            <div className="mgr-chat-conversations-header">
                                <h2>Cuộc trò chuyện</h2>
                                <button
                                    className="mgr-chat-new-conversation-btn"
                                    onClick={() => setShowNewChatModal(true)}
                                    title="Tạo cuộc trò chuyện mới"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="mgr-chat-conversations-list">
                                {conversations.length === 0 ? (
                                    <div className="mgr-chat-empty-conversations">
                                        Chưa có cuộc trò chuyện nào
                                    </div>
                                ) : (
                                    conversations.map(conversation => (
                                        <div
                                            key={conversation.id}
                                            className={`mgr-chat-conversation-item ${selectedConversationId === conversation.id ? 'mgr-chat-conversation-active' : ''}`}
                                            onClick={() => handleSelectConversation(conversation.id)}
                                        >
                                            <div className="mgr-chat-conversation-avatar">
                                                {conversation.conversationName?.charAt(0).toUpperCase() || 'C'}
                                            </div>
                                            <div className="mgr-chat-conversation-info">
                                                <div className="mgr-chat-conversation-name">
                                                    {conversation.conversationName || `Conversation ${conversation.id.substring(0, 8)}`}
                                                </div>
                                                <div className="mgr-chat-conversation-preview">
                                                    {conversation.lastMessagePreview || 'No messages yet'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mgr-chat-messages-panel">
                            {selectedConversation ? (
                                <>
                                    <div className="mgr-chat-messages-header">
                                        <h2>{selectedConversation.conversationName || `Conversation ${selectedConversation.id.substring(0, 8)}`}</h2>
                                    </div>
                                    <div className="mgr-chat-messages-container" ref={messagesContainerRef}>
                                        {currentHasMore && (
                                            <button
                                                className="mgr-chat-load-more"
                                                onClick={loadMoreMessages}
                                                disabled={loading}
                                            >
                                                {loading ? 'Đang tải...' : 'Tải thêm tin nhắn'}
                                            </button>
                                        )}
                                        {currentMessages.length === 0 ? (
                                            <div className="mgr-chat-empty-messages">
                                                Chưa có tin nhắn nào
                                            </div>
                                        ) : (
                                            currentMessages.map(message => (
                                                <div
                                                    key={message.id}
                                                    className={`mgr-chat-message ${message.senderId === user?.userId ? 'mgr-chat-message-own' : 'mgr-chat-message-other'}`}
                                                >
                                                    <div className="mgr-chat-message-content">
                                                        <div className="mgr-chat-message-sender">{message.senderName}</div>
                                                        <div className="mgr-chat-message-text">{message.content}</div>
                                                        <div className="mgr-chat-message-time">
                                                            {formatMessageTime(message.createdAt)}
                                                            {message.isEdited && <span className="mgr-chat-message-edited"> (đã chỉnh sửa)</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="mgr-chat-input-container">
                                        <textarea
                                            className="mgr-chat-input"
                                            placeholder="Nhập tin nhắn..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            rows={2}
                                        />
                                        <button
                                            className="mgr-chat-send-btn"
                                            onClick={sendMessage}
                                            disabled={!messageInput.trim() || sending}
                                        >
                                            {sending ? 'Đang gửi...' : 'Gửi'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="mgr-chat-no-conversation">
                                    Chọn một cuộc trò chuyện để bắt đầu
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="mgr-chat-modal-overlay" onClick={cancelLogout}>
                    <div className="mgr-chat-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-chat-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="mgr-chat-modal-body">
                            <p>Bạn có chắc muốn đăng xuất?</p>
                        </div>
                        <div className="mgr-chat-modal-footer">
                            <button className="mgr-chat-btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="mgr-chat-btn-confirm" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNewChatModal && (
                <NewConversationModalForManager
                    isOpen={showNewChatModal}
                    onClose={() => setShowNewChatModal(false)}
                />
            )}
        </div>
    );
};

export default ManagerChat;
