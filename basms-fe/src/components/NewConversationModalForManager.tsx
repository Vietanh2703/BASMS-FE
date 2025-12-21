import { useState, useEffect } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { useAuth } from '../hooks/useAuth';
import './NewConversationModal.css';

interface User {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    roleId: string;
    roleName: string;
    isActive: boolean;
}

interface NewConversationModalForManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewConversationModalForManager = ({ isOpen, onClose }: NewConversationModalForManagerProps) => {
    const { user } = useAuth();
    const { addConversation, selectConversation } = useChatStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setError('Không tìm thấy token đăng nhập');
                return;
            }

            const response = await fetch(`${apiUrl}/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Không thể lấy danh sách người dùng');
            }

            const result = await response.json();
            const allUsers = result.users || [];

            // Filter to only show Guards and Guard Leaders
            // roleId: ddbd5fad-ba6e-11f0-bcac-00155dca8f48 (Guard)
            // roleId: ddbd6230-ba6e-11f0-bcac-00155dca8f48 (Guard Leader)
            const GUARD_ROLE_ID = 'ddbd5fad-ba6e-11f0-bcac-00155dca8f48';
            const GUARD_LEADER_ROLE_ID = 'ddbd6230-ba6e-11f0-bcac-00155dca8f48';

            const filteredUsers = allUsers.filter(
                (u: User) =>
                    u.id !== user?.userId &&
                    u.isActive &&
                    (u.roleId === GUARD_ROLE_ID || u.roleId === GUARD_LEADER_ROLE_ID)
            );

            setUsers(filteredUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Đã xảy ra lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const createConversation = async () => {
        if (!selectedUser || creating) {
            return;
        }

        try {
            setCreating(true);
            setError(null);

            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setError('Không tìm thấy token đăng nhập');
                return;
            }

            if (!user?.userId) {
                setError('Không tìm thấy thông tin người dùng');
                return;
            }

            const response = await fetch(`${apiUrl}/chats/conversations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationType: 'DIRECT',
                    participantIds: [user.userId, selectedUser.id],
                    participants: [
                        {
                            userId: user.userId,
                            userName: user.fullName || 'Unknown User',
                            userAvatarUrl: null,
                            userRole: 'MANAGER'
                        },
                        {
                            userId: selectedUser.id,
                            userName: selectedUser.fullName,
                            userAvatarUrl: selectedUser.avatarUrl,
                            userRole: selectedUser.roleName.toUpperCase()
                        }
                    ]
                }),
            });

            if (!response.ok) {
                throw new Error('Không thể tạo cuộc trò chuyện');
            }

            const result = await response.json();

            if (result.success && result.data.conversation) {
                const conversation = result.data.conversation;

                // Add or update conversation in store
                if (result.data.isExisting) {
                    // Conversation already exists, just select it
                    console.log('Conversation already exists, selecting it');
                } else {
                    // New conversation created, add to store
                    addConversation(conversation);
                }

                // Select the conversation
                selectConversation(conversation.id);

                // Close modal
                onClose();

                // Reset state
                setSearchTerm('');
                setSelectedUser(null);
            } else {
                setError(result.error || 'Không thể tạo cuộc trò chuyện');
            }
        } catch (err) {
            console.error('Error creating conversation:', err);
            setError('Đã xảy ra lỗi khi tạo cuộc trò chuyện');
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedUser(null);
        setError(null);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const filteredUsers = users.filter((u) =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="new-conversation-modal-overlay" onClick={handleClose}>
            <div className="new-conversation-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="new-conversation-modal-header">
                    <h2>Tạo cuộc trò chuyện mới</h2>
                    <button className="new-conversation-close-btn" onClick={handleClose}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <div className="new-conversation-modal-body">
                    <div className="new-conversation-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm bảo vệ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="new-conversation-search-input"
                        />
                    </div>

                    {error && (
                        <div className="new-conversation-error">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="new-conversation-loading">
                            Đang tải danh sách bảo vệ...
                        </div>
                    ) : (
                        <div className="new-conversation-user-list">
                            {filteredUsers.length === 0 ? (
                                <div className="new-conversation-empty">
                                    {searchTerm ? 'Không tìm thấy bảo vệ nào' : 'Không có bảo vệ nào'}
                                </div>
                            ) : (
                                filteredUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className={`new-conversation-user-item ${selectedUser?.id === u.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedUser(u)}
                                    >
                                        <div className="new-conversation-user-avatar">
                                            {u.avatarUrl ? (
                                                <img src={u.avatarUrl} alt={u.fullName} />
                                            ) : (
                                                <span>{u.fullName.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="new-conversation-user-info">
                                            <div className="new-conversation-user-name">{u.fullName}</div>
                                            <div className="new-conversation-user-role">{u.roleName}</div>
                                        </div>
                                        {selectedUser?.id === u.id && (
                                            <div className="new-conversation-check-icon">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="new-conversation-modal-footer">
                    <button className="new-conversation-cancel-btn" onClick={handleClose}>
                        Hủy
                    </button>
                    <button
                        className="new-conversation-create-btn"
                        onClick={createConversation}
                        disabled={!selectedUser || creating}
                    >
                        {creating ? 'Đang tạo...' : 'Bắt đầu chat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewConversationModalForManager;
