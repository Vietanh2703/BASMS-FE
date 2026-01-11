import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { DashboardData } from './types';
import DashboardKPI from './components/DashboardKPI';
import ShiftsOverview from './components/ShiftsOverview';
import IncidentsOverview from './components/IncidentsOverview';
import OperationalMetrics from './components/OperationalMetrics';
import SystemAlerts from './components/SystemAlerts';
import dashboardService from '../../services/dashboardService';
import './dashboardDirector.css';

const DashboardDirector = () => {
    useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Dashboard data state
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await dashboardService.getDashboardData();
            setDashboardData(data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effects
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileDropdownOpen]);

    // Handlers
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
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

    // Use useCallback to memoize format functions and prevent unnecessary re-renders
    const formatDateTime = useCallback((date: Date) => {
        const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${days[date.getDay()]}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }, []);
    useCallback((value: number) => {
        return value >= 1000000000 ? `${(value / 1000000000).toFixed(1)} tỷ` : `${(value / 1000000).toFixed(1)} tr`;
    }, []);
    useCallback((value: number, showSign: boolean = true) => {
        const sign = value > 0 ? '+' : '';
        return showSign ? `${sign}${value}%` : `${value}%`;
    }, []);
    return (
        <div className="dd-container">
            {/* Sidebar */}
            <aside className={`dd-sidebar ${isMenuOpen ? 'dd-sidebar-open' : 'dd-sidebar-closed'}`}>
                <div className="dd-sidebar-header">
                    <div className="dd-sidebar-logo">
                        <div className="dd-logo-icon">D</div>
                        {isMenuOpen && <span className="dd-logo-text">Director</span>}
                    </div>
                </div>
                <nav className="dd-sidebar-nav">
                    <ul className="dd-nav-list">
                        <li className="dd-nav-item dd-nav-active">
                            <Link to="/director/dashboard" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="dd-nav-item">
                            <Link to="/director/customer-list" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="dd-nav-item">
                            <Link to="/director/employee-control" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="dd-nav-item">
                            <Link to="/director/incidents" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z"/>
                                </svg>
                                {isMenuOpen && <span>Sự cố</span>}
                            </Link>
                        </li>
                        <li className="dd-nav-item">
                            <Link to="/director/chat" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                </svg>
                                {isMenuOpen && <span>Trò chuyện</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`dd-main-content ${isMenuOpen ? 'dd-content-expanded' : 'dd-content-collapsed'}`}>
                <header className="dd-header">
                    <div className="dd-header-left">
                        <button className="dd-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="dd-datetime">{formatDateTime(currentTime)}</div>
                    </div>
                    <div className="dd-header-right">
                        <button className="dd-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="dd-notification-badge">5</span>
                        </button>
                        <div ref={profileRef} className="dd-user-profile" onClick={toggleProfileDropdown}>
                            <div className="dd-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="dd-user-info">
                                <span className="dd-user-name">{user?.fullName || 'Director'}</span>
                                <span className="dd-user-role">Giám đốc điều hành</span>
                            </div>
                            {isProfileDropdownOpen && (
                                <div className="dd-profile-dropdown">
                                    <div
                                        className={`dd-dropdown-item dd-logout-item ${isLoggingOut ? 'dd-disabled' : ''}`}
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
                                        <svg className="dd-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="dd-main">
                    <div className="dd-page-header">
                        <h1 className="dd-page-title">Director Dashboard</h1>
                        <p className="dd-page-subtitle">Tổng quan quản lý điều hành hệ thống BASMS</p>
                    </div>

                    {/* Dashboard Content */}
                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                            <div style={{ fontSize: '16px', fontWeight: 500 }}>Đang tải dữ liệu...</div>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '20px', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' }}>
                            {error}
                            <button
                                onClick={fetchDashboardData}
                                style={{ marginLeft: '12px', padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && dashboardData && (
                        <>
                            {/* KPI Cards */}
                            <DashboardKPI stats={dashboardData.kpi} />

                            {/* Shifts and Incidents Overview */}
                            <div className="dd-row-split">
                                <div className="dd-section-half">
                                    <ShiftsOverview stats={dashboardData.shifts} />
                                </div>
                                <div className="dd-section-half">
                                    <IncidentsOverview stats={dashboardData.incidents} />
                                </div>
                            </div>

                            {/* Operational Metrics */}
                            <OperationalMetrics metrics={dashboardData.operational} />

                            {/* System Alerts */}
                            <SystemAlerts alerts={dashboardData.alerts} />
                        </>
                    )}

                </main>
            </div>

            {showLogoutModal && (
                <div className="dd-modal-overlay" onClick={cancelLogout}>
                    <div className="dd-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dd-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="dd-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="dd-modal-footer">
                            <button className="dd-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="dd-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardDirector;
