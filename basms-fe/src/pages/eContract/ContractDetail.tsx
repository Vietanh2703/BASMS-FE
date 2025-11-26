import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './ContractDetail.css';

interface ContractDocument {
    fileUrl: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    documentId: string;
    urlExpiresAt: string;
}

interface ContractResponse {
    success: boolean;
    data: ContractDocument;
}

const ContractDetail = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [contractData, setContractData] = useState<ContractDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchContractData = async () => {
            if (!documentId) {
                setError('Thiếu thông tin document ID');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('eContractAccessToken');

                if (!token) {
                    navigate('/e-contract/login');
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/documents/${documentId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Không thể tải thông tin hợp đồng');
                }

                const result: ContractResponse = await response.json();

                if (!result.success || !result.data) {
                    throw new Error('Dữ liệu hợp đồng không hợp lệ');
                }

                setContractData(result.data);
                setDocumentUrl(result.data.fileUrl);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải hợp đồng');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContractData();
    }, [documentId, navigate]);

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

    const handleBackToList = () => {
        navigate('/e-contracts/list');
    };

    if (isLoading) {
        return (
            <div className="cd-loading-container">
                <div className="cd-loading-spinner"></div>
                <div className="cd-loading-text">Đang tải hợp đồng...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cd-error-container">
                <div className="cd-error-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <div className="cd-error-title">Có lỗi xảy ra</div>
                <div className="cd-error-message">{error}</div>
                <button className="cd-error-btn" onClick={handleBackToList}>
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="cd-container">
            <aside className={`cd-sidebar ${isMenuOpen ? 'cd-sidebar-open' : 'cd-sidebar-closed'}`}>
                <div className="cd-sidebar-header">
                    <div className="cd-sidebar-logo">
                        <div className="cd-logo-icon">E</div>
                        {isMenuOpen && <span className="cd-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="cd-sidebar-nav">
                    <ul className="cd-nav-list">
                        <li className="cd-nav-item">
                            <a href="/e-contracts/dashboard" className="cd-nav-link">
                                <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="cd-nav-item cd-nav-active">
                            <a href="/e-contracts/list" className="cd-nav-link">
                                <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                        <li className="cd-nav-item">
                            <a href="#" className="cd-nav-link">
                                <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`cd-main-content ${isMenuOpen ? 'cd-content-expanded' : 'cd-content-collapsed'}`}>
                <header className="cd-nav-header">
                    <div className="cd-nav-left">
                        <button className="cd-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="cd-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="cd-nav-right">
                        <button className="cd-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="cd-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="cd-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="cd-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="cd-user-info">
                                <span className="cd-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="cd-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="cd-profile-dropdown">
                                    <div
                                        className={`cd-dropdown-item cd-logout-item ${isLoggingOut ? 'cd-disabled' : ''}`}
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
                                        <svg className="cd-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="cd-main">
                    <div className="cd-page-header">
                        <div>
                            <h1 className="cd-page-title">Chi tiết hợp đồng</h1>
                            {contractData && (
                                <p className="cd-page-subtitle">{contractData.fileName}</p>
                            )}
                        </div>
                        <button className="cd-back-btn" onClick={handleBackToList}>
                            Quay lại danh sách
                        </button>
                    </div>

                    {contractData && (
                        <div className="cd-info-section">
                            <div className="cd-info-card">
                                <div className="cd-info-grid">
                                    <div className="cd-info-item">
                                        <span className="cd-info-label">Tên file:</span>
                                        <span className="cd-info-value">{contractData.fileName}</span>
                                    </div>
                                    <div className="cd-info-item">
                                        <span className="cd-info-label">Loại file:</span>
                                        <span className="cd-info-value">
                                            {contractData.contentType.includes('pdf') ? 'PDF' : 'Word Document'}
                                        </span>
                                    </div>
                                    <div className="cd-info-item">
                                        <span className="cd-info-label">Link hết hạn lúc:</span>
                                        <span className="cd-info-value">
                                            {new Date(contractData.urlExpiresAt).toLocaleString('vi-VN', {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="cd-document-section">
                        <div className="cd-document-container">
                            {documentUrl && contractData ? (
                                <iframe
                                    src={
                                        contractData.contentType === 'application/pdf'
                                            ? documentUrl
                                            : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`
                                    }
                                    className="cd-document-viewer"
                                    title="Contract Document"
                                />
                            ) : (
                                <div className="cd-no-document">
                                    <p>Không thể hiển thị nội dung hợp đồng</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="cd-modal-overlay" onClick={cancelLogout}>
                    <div className="cd-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="cd-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="cd-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="cd-modal-footer">
                            <button className="cd-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="cd-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractDetail;
