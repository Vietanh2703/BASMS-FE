import {useState, useEffect, useRef} from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import UserInfoModal from "../../../components/userInfoModal/userInfoModal.tsx";
import './dashboardAdmin.css';

const DashboardAdmin = () => {
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
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className={`sidebar ${isMenuOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon">B</div>
                        {isMenuOpen && <span className="logo-text">BASMS</span>}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        <li className="nav-item active">
                            <Link to="/admin/dashboard" className="nav-link">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/admin/customer-list" className="nav-link">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <a href="#" className="nav-link">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.007 3.007 0 0 0 17.12 7H16.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5H18v4h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zm1.5 1h-4c-1.1 0-2 .9-2 2v5.5h2V16h4v3.5h2V14.5c0-1.1-.9-2-2-2z"/>
                                </svg>
                                {isMenuOpen && <span>user_service_logs</span>}
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="#" className="nav-link">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                {isMenuOpen && <span>contract_service_logs</span>}
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="#" className="nav-link">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
                                {isMenuOpen && <span>shift_service_logs</span>}
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="#" className="nav-link">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H14V1h-4v1H5.5v2h13v-2zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/>
                                </svg>
                                {isMenuOpen && <span>attendance_service_logs</span>}
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="#" className="nav-link">
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                                {isMenuOpen && <span>feedback_service_logs</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`main-content ${isMenuOpen ? 'main-content-expanded' : 'main-content-collapsed'}`}>
                {/* Navbar */}
                <header className="nav-admin">
                    <div className="nav-admin-left">
                        <button className="menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="nav-admin-right">
                        <button className="notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="notification-badge">3</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                            <div className="user-info">
                                <span className="user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'Admin User'}
                                </span>
                                <span className="user-role">Quản trị viên</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-item" onClick={handleOpenUserInfo}>
                                        <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Thông tin người dùng
                                    </div>
                                    <div
                                        className={`dropdown-item logout-item ${isLoggingOut ? 'disabled' : ''}`}
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
                                        <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <h1 className="page-title">Dashboard</h1>
                        <p className="page-subtitle">Chào mừng đến hệ thống quản lý bảo vệ</p>
                    </div>

                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <div className="stat-icon stat-icon-blue">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.007 3.007 0 0 0 17.12 7H16.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5H18v4h2z"/>
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">24</div>
                                <div className="stat-label">Bảo vệ đang trực</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon stat-icon-green">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">8</div>
                                <div className="stat-label">Ca trực hôm nay</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon stat-icon-orange">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">156</div>
                                <div className="stat-label">Thiết bị hoạt động</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon stat-icon-red">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">3</div>
                                <div className="stat-label">Cảnh báo</div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {showLogoutModal && (
                <div className="modal-overlay" onClick={cancelLogout}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="modal-body">
                            <p>Bạn có chắc muốn đăng xuất?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="btn-confirm" onClick={confirmLogout}>
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

export default DashboardAdmin;
