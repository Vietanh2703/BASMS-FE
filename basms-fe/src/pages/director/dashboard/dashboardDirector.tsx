import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import UserInfoModal from "../../../components/userInfoModal/userInfoModal.tsx";
import './dashboardDirector.css';

const DashboardDirector = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showUserInfoModal, setShowUserInfoModal] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Close dropdown when clicking outside
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

    const handleOpenUserInfo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowUserInfoModal(true);
        setIsProfileDropdownOpen(false);
    };

    return (
        <div className="director-dashboard-container">
            <aside className={`director-sidebar ${isMenuOpen ? 'director-sidebar-open' : 'director-sidebar-closed'}`}>
                <div className="director-sidebar-header">
                    <div className="director-sidebar-logo">
                        <div className="director-logo-icon">B</div>
                        {isMenuOpen && <span className="director-logo-text">BASMS</span>}
                    </div>
                </div>

                <nav className="director-sidebar-nav">
                    <ul className="director-nav-list">
                        <li className="director-nav-item director-nav-active">
                            <a href="#" className="director-nav-link">
                                <svg className="director-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="director-nav-item">
                            <a href="#" className="director-nav-link">
                                <svg className="director-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.007 3.007 0 0 0 17.12 7H16.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5H18v4h2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`director-main-content ${isMenuOpen ? 'director-content-expanded' : 'director-content-collapsed'}`}>
                <header className="director-nav-header">
                    <div className="director-nav-left">
                        <button className="director-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="director-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="director-nav-right">
                        <button className="director-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="director-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="director-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="director-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="director-user-info">
                                <span className="director-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'Director User'}
                                </span>
                                <span className="director-user-role">Giám đốc</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="director-profile-dropdown">
                                    <div className="director-dropdown-item" onClick={handleOpenUserInfo}>
                                        <svg className="director-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Thông tin người dùng
                                    </div>
                                    <div
                                        className={`director-dropdown-item director-logout-item ${isLoggingOut ? 'director-disabled' : ''}`}
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
                                        <svg className="director-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="director-dashboard-main">
                    <div className="director-dashboard-header">
                        <h1 className="director-page-title">Dashboard</h1>
                        <p className="director-page-subtitle">Chào mừng đến hệ thống quản lý bảo vệ</p>
                    </div>

                    <div className="director-dashboard-stats">
                        <div className="director-stat-card">
                            <div className="director-stat-icon director-stat-blue">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.007 3.007 0 0 0 17.12 7H16.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5H18v4h2z"/>
                                </svg>
                            </div>
                            <div className="director-stat-content">
                                <div className="director-stat-number">45</div>
                                <div className="director-stat-label">Tổng nhân viên</div>
                            </div>
                        </div>

                        <div className="director-stat-card">
                            <div className="director-stat-icon director-stat-green">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div className="director-stat-content">
                                <div className="director-stat-number">12</div>
                                <div className="director-stat-label">Dự án đang chạy</div>
                            </div>
                        </div>

                        <div className="director-stat-card">
                            <div className="director-stat-icon director-stat-orange">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
                            </div>
                            <div className="director-stat-content">
                                <div className="director-stat-number">28</div>
                                <div className="director-stat-label">Báo cáo chờ duyệt</div>
                            </div>
                        </div>

                        <div className="director-stat-card">
                            <div className="director-stat-icon director-stat-red">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                </svg>
                            </div>
                            <div className="director-stat-content">
                                <div className="director-stat-number">2</div>
                                <div className="director-stat-label">Vấn đề cần xử lý</div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="director-modal-overlay" onClick={cancelLogout}>
                    <div className="director-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="director-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="director-modal-body">
                            <p>Bạn có chắc muốn đăng xuất?</p>
                        </div>
                        <div className="director-modal-footer">
                            <button className="director-btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="director-btn-confirm" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <UserInfoModal
                isOpen={showUserInfoModal}
                onClose={() => setShowUserInfoModal(false)}
            />
        </div>
    );
};

export default DashboardDirector;
