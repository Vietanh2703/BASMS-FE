import React, { useState, useEffect } from 'react';
import { getManagerById, type ManagerData } from '../../services/managerService';
import '../userInfoModal/userInfoModal.css';

interface ManagerInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    managerId: string;
}

const ManagerInfoModal: React.FC<ManagerInfoModalProps> = ({ isOpen, onClose, managerId }) => {
    const [manager, setManager] = useState<ManagerData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && managerId) {
            fetchManagerData();
        }
    }, [isOpen, managerId]);

    const fetchManagerData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getManagerById(managerId);
            setManager(data);
        } catch (err) {
            setError('Không thể tải thông tin quản lý');
            console.error('Error fetching manager data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString?: string) => {
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
            <div className="modal-overlay" onClick={onClose}></div>

            <div className="user-info-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Thông tin quản lý</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                            Đang tải thông tin...
                        </div>
                    )}

                    {error && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}

                    {!loading && !error && manager && (
                        <>
                            <div className="user-avatar-section">
                                {manager.avatarUrl ? (
                                    <img
                                        src={manager.avatarUrl}
                                        alt={manager.fullName}
                                        className="user-avatar"
                                        style={{ width: '64px', height: '64px', borderRadius: '50%' }}
                                    />
                                ) : (
                                    <div className="user-avatar">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                    </div>
                                )}
                                <h3 className="user-name">{manager.fullName}</h3>
                                <span className="user-role-badge">{manager.role}</span>
                            </div>

                            <div className="user-info-grid">
                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Mã nhân viên
                                    </label>
                                    <span className="info-value info-value-code">{manager.employeeCode}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                        </svg>
                                        CMND/CCCD
                                    </label>
                                    <span className="info-value">{manager.identityNumber}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                        </svg>
                                        Email
                                    </label>
                                    <span className="info-value">{manager.email}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                        </svg>
                                        Số điện thoại
                                    </label>
                                    <span className="info-value">{manager.phoneNumber}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                        </svg>
                                        Ngày sinh
                                    </label>
                                    <span className="info-value">{formatDate(manager.dateOfBirth)}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Giới tính
                                    </label>
                                    <span className="info-value">{manager.gender}</span>
                                </div>

                                <div className="info-item full-width">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                        </svg>
                                        Địa chỉ
                                    </label>
                                    <span className="info-value">{manager.currentAddress}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                        </svg>
                                        Cấp quản lý
                                    </label>
                                    <span className="info-value">Cấp {manager.managerLevel}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                        Trạng thái
                                    </label>
                                    <span className="info-value">{manager.employmentStatus}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                        </svg>
                                        Số đội quản lý
                                    </label>
                                    <span className="info-value">{manager.totalTeamsManaged}</span>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Số bảo vệ giám sát
                                    </label>
                                    <span className="info-value">{manager.totalGuardsSupervised}</span>
                                </div>

                                <div className="info-item full-width">
                                    <label className="info-label">
                                        <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                        </svg>
                                        Đồng bộ lần cuối
                                    </label>
                                    <span className="info-value">{formatDateTime(manager.lastSyncedAt)}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </>
    );
};

export default ManagerInfoModal;
