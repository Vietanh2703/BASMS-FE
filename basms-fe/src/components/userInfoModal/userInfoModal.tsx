import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleName } from '../../constants/roles';
import './userInfoModal.css';

interface UserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    if (!isOpen || !user) return null;

    // Format dates nếu cần
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            {/* Overlay */}
            <div className="modal-overlay" onClick={onClose}></div>

            {/* Modal */}
            <div className="user-info-modal">
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Thông tin người dùng</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Avatar Section */}
                    <div className="user-avatar-section">
                        <div className="user-avatar">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </div>
                        <h3 className="user-name">{user.fullName || 'Không có tên'}</h3>
                        <span className="user-role-badge">
                            {getRoleName(user.roleId)}
                        </span>
                    </div>

                    {/* Info Grid */}
                    <div className="user-info-grid">
                        <div className="info-item">
                            <label className="info-label">
                                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                Họ và tên
                            </label>
                            <span className="info-value">{user.fullName || 'N/A'}</span>
                        </div>

                        <div className="info-item">
                            <label className="info-label">
                                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                                Email
                            </label>
                            <span className="info-value">{user.email}</span>
                        </div>

                        <div className="info-item">
                            <label className="info-label">
                                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                Vai trò
                            </label>
                            <span className="info-value">{getRoleName(user.roleId)}</span>
                        </div>

                        <div className="info-item">
                            <label className="info-label">
                                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                </svg>
                                User ID
                            </label>
                            <span className="info-value info-value-code">{user.userId}</span>
                        </div>

                        <div className="info-item">
                            <label className="info-label">
                                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                                </svg>
                                Role ID
                            </label>
                            <span className="info-value info-value-code">{user.roleId}</span>
                        </div>

                        {/* Thêm thông tin token expiry nếu có */}
                        <div className="info-item full-width">
                            <label className="info-label">
                                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                </svg>
                                Phiên đăng nhập
                            </label>
                            <span className="info-value">
                                Hết hạn: {formatDate(localStorage.getItem('accessTokenExpiry') || undefined)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </>
    );
};

export default UserInfoModal;