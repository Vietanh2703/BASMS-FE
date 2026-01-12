import {useState, useEffect, useRef} from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import UserInfoModal from "../../components/userInfoModal/userInfoModal.tsx";
import './systemManagement.css';

const SystemManagement = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showUserInfoModal, setShowUserInfoModal] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, [])

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
        <div className="sys-mgmt-container">
            {/* Sidebar */}
            <aside className={`sys-mgmt-sidebar ${isMenuOpen ? 'sys-mgmt-sidebar-open' : 'sys-mgmt-sidebar-closed'}`}>
                <div className="sys-mgmt-sidebar-header">
                    <div className="sys-mgmt-sidebar-logo">
                        <div className="sys-mgmt-logo-icon">B</div>
                        {isMenuOpen && <span className="sys-mgmt-logo-text">BASMS</span>}
                    </div>
                </div>

                <nav className="sys-mgmt-sidebar-nav">
                    <ul className="sys-mgmt-nav-list">
                        <li className="sys-mgmt-nav-item">
                            <Link to="/admin/dashboard" className="sys-mgmt-nav-link">
                                <svg className="sys-mgmt-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="sys-mgmt-nav-item">
                            <Link to="/admin/customer-list" className="sys-mgmt-nav-link">
                                <svg className="sys-mgmt-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="sys-mgmt-nav-item sys-mgmt-active">
                            <Link to="/admin/system-management" className="sys-mgmt-nav-link">
                                <svg className="sys-mgmt-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                                </svg>
                                {isMenuOpen && <span>Quản trị hệ thống</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`sys-mgmt-main-content ${isMenuOpen ? 'sys-mgmt-main-content-expanded' : 'sys-mgmt-main-content-collapsed'}`}>
                {/* Navbar */}
                <header className="sys-mgmt-nav-admin">
                    <div className="sys-mgmt-nav-admin-left">
                        <button className="sys-mgmt-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="sys-mgmt-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="sys-mgmt-nav-admin-right">
                        <button className="sys-mgmt-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="sys-mgmt-notification-badge">3</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="sys-mgmt-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="sys-mgmt-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                            <div className="sys-mgmt-user-info">
                                <span className="sys-mgmt-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'Admin User'}
                                </span>
                                <span className="sys-mgmt-user-role">Quản trị viên</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="sys-mgmt-profile-dropdown">
                                    <div className="sys-mgmt-dropdown-item" onClick={handleOpenUserInfo}>
                                        <svg className="sys-mgmt-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Thông tin người dùng
                                    </div>
                                    <div
                                        className={`sys-mgmt-dropdown-item sys-mgmt-logout-item ${isLoggingOut ? 'sys-mgmt-disabled' : ''}`}
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
                                        <svg className="sys-mgmt-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* System Management Content */}
                <main className="sys-mgmt-dashboard-main">
                    <div className="sys-mgmt-dashboard-header">
                        <h1 className="sys-mgmt-page-title">Quản trị hệ thống</h1>
                        <p className="sys-mgmt-page-subtitle">Cấu hình và quản lý hệ thống</p>
                    </div>

                    {/* Nội dung sẽ được bổ sung sau */}
                </main>
            </div>
            {showLogoutModal && (
                <div className="sys-mgmt-modal-overlay" onClick={cancelLogout}>
                    <div className="sys-mgmt-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="sys-mgmt-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="sys-mgmt-modal-body">
                            <p>Bạn có chắc muốn đăng xuất?</p>
                        </div>
                        <div className="sys-mgmt-modal-footer">
                            <button className="sys-mgmt-btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="sys-mgmt-btn-confirm" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USER INFO MODAL */}
            <UserInfoModal
                isOpen={showUserInfoModal}
                onClose={() => setShowUserInfoModal(false)}
            />

        </div>
    );
};

export default SystemManagement;
