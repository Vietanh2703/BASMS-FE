import {useState, useEffect, useRef} from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import ManagerInfoModal from "../../components/managerInfoModal/managerInfoModal.tsx";
import './dashboardManager.css';

const DashboardManager = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showManagerInfoModal, setShowManagerInfoModal] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchPendingRequestsCount();
    }, []);

    const fetchPendingRequestsCount = async () => {
        try {
            // Try to get email from useAuth hook first
            const email = user?.email;
            if (!email) return;

            // Try to get accessToken from localStorage
            const userStr = localStorage.getItem('user');
            let accessToken = localStorage.getItem('accessToken');

            if (userStr && !accessToken) {
                try {
                    const userData = JSON.parse(userStr);
                    accessToken = userData.accessToken;
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }

            if (!accessToken) return;

            const managerResponse = await fetch(
                `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/managers/by-email`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        Email: email
                    })
                }
            );

            if (!managerResponse.ok) {
                console.error('Manager API error:', managerResponse.status);
                return;
            }

            const managerText = await managerResponse.text();
            let managerData;
            try {
                managerData = JSON.parse(managerText);
            } catch (e) {
                console.error('Failed to parse manager response');
                return;
            }

            const managerId = managerData.manager?.id;
            if (!managerId) return;

            const templatesResponse = await fetch(
                `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/shift-templates/pending/${managerId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (!templatesResponse.ok) {
                console.error('Templates API error:', templatesResponse.status);
                return;
            }

            const templatesText = await templatesResponse.text();
            let templatesData;
            try {
                templatesData = JSON.parse(templatesText);
            } catch (e) {
                console.error('Failed to parse templates response');
                return;
            }

            setPendingRequestsCount(templatesData.totalContracts || 0);
        } catch (error) {
            console.error('Error fetching pending requests count:', error);
        }
    };

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
        setShowManagerInfoModal(true);
        setIsProfileDropdownOpen(false);
    };

    return (
        <div className="manager-dashboard-wrapper">
            <aside className={`manager-sidebar ${isMenuOpen ? 'manager-sidebar-open' : 'manager-sidebar-closed'}`}>
                <div className="manager-sidebar-header">
                    <div className="manager-sidebar-logo">
                        <div className="manager-logo-icon">B</div>
                        {isMenuOpen && <span className="manager-logo-text">BASMS</span>}
                    </div>
                </div>

                <nav className="manager-sidebar-nav">
                    <ul className="manager-nav-list">
                        <li className="manager-nav-item manager-nav-active">
                            <a href="#" className="manager-nav-link">
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="manager-nav-item">
                            <a href="/manager/guard-list" className="manager-nav-link">
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân viên</span>}
                            </a>
                        </li>
                        <li className="manager-nav-item">
                            <a href="/manager/request" className="manager-nav-link">
                                <div className="manager-nav-icon-wrapper">
                                    <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                    </svg>
                                    {pendingRequestsCount > 0 && (
                                        <span className="manager-nav-badge">{pendingRequestsCount}</span>
                                    )}
                                </div>
                                {isMenuOpen && <span>Yêu cầu phân công</span>}
                            </a>
                        </li>
                        <li className="manager-nav-item">
                            <a href="/manager/shift-assignment" className="manager-nav-link">
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                                {isMenuOpen && <span>Phân công ca làm</span>}
                            </a>
                        </li>
                        <li className="manager-nav-item">
                            <a href="#" className="manager-nav-link">
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý ca trực</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`manager-main-content ${isMenuOpen ? 'manager-content-expanded' : 'manager-content-collapsed'}`}>
                <header className="manager-nav-header">
                    <div className="manager-nav-left">
                        <button className="manager-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="manager-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="manager-nav-right">
                        <button className="manager-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="manager-notification-badge">5</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="manager-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="manager-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'M'}</span>
                            </div>
                            <div className="manager-user-info">
                                <span className="manager-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'Manager User'}
                                </span>
                                <span className="manager-user-role">Quản lý</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="manager-profile-dropdown">
                                    <div className="manager-dropdown-item" onClick={handleOpenUserInfo}>
                                        <svg className="manager-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Thông tin người dùng
                                    </div>
                                    <div
                                        className={`manager-dropdown-item manager-logout-item ${isLoggingOut ? 'manager-disabled' : ''}`}
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
                                        <svg className="manager-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="manager-dashboard-main">
                    <div className="manager-dashboard-header">
                        <h1 className="manager-page-title">Dashboard</h1>
                        <p className="manager-page-subtitle">Chào mừng đến hệ thống quản lý bảo vệ</p>
                    </div>

                    <div className="manager-dashboard-stats">
                        <div className="manager-stat-card">
                            <div className="manager-stat-icon manager-stat-blue">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.007 3.007 0 0 0 17.12 7H16.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5H18v4h2z"/>
                                </svg>
                            </div>
                            <div className="manager-stat-content">
                                <div className="manager-stat-number">32</div>
                                <div className="manager-stat-label">Nhân viên</div>
                            </div>
                        </div>

                        <div className="manager-stat-card">
                            <div className="manager-stat-icon manager-stat-green">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div className="manager-stat-content">
                                <div className="manager-stat-number">10</div>
                                <div className="manager-stat-label">Ca trực hôm nay</div>
                            </div>
                        </div>

                        <div className="manager-stat-card">
                            <div className="manager-stat-icon manager-stat-orange">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
                            </div>
                            <div className="manager-stat-content">
                                <div className="manager-stat-number">18</div>
                                <div className="manager-stat-label">Yêu cầu chờ duyệt</div>
                            </div>
                        </div>

                        <div className="manager-stat-card">
                            <div className="manager-stat-icon manager-stat-red">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                </svg>
                            </div>
                            <div className="manager-stat-content">
                                <div className="manager-stat-number">4</div>
                                <div className="manager-stat-label">Cảnh báo</div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="manager-modal-overlay" onClick={cancelLogout}>
                    <div className="manager-modal-content" onClick={handleOpenUserInfo}>
                        <div className="manager-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="manager-modal-body">
                            <p>Bạn có chắc muốn đăng xuất?</p>
                        </div>
                        <div className="manager-modal-footer">
                            <button className="manager-btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="manager-btn-confirm" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USER INFO MODAL */}
            <ManagerInfoModal
                isOpen={showManagerInfoModal}
                onClose={() => setShowManagerInfoModal(false)}
                managerId={user?.userId || ''}
            />
        </div>
    );
};

export default DashboardManager;
