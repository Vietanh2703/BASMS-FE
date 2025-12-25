import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type {
    ContractStats,
    ReportStats,
    ChartDataItem
} from './types';
import './dashboardDirector.css';

// Move all mock data outside component to prevent re-creation on every render
const DashboardDirector = () => {
    useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days' | '90days' | 'year'>('30days');
    const profileRef = useRef<HTMLDivElement>(null);

    // API Endpoints - Replace these with your actual API URLs
// Mock Data - Replace with API calls
    const [contractStats] = useState<ContractStats>({
        signed: 756,
        pending: 67,
        expired: 33,
        managerLabor: 45,
        guardLabor: 745,
        guardService: 66,
        avgApprovalTime: 1.8,
        successRate: 92,
        expiringContracts: 23
    });

    const [reportStats] = useState<ReportStats>({
        total: 234,
        processed: 198,
        pending: 36,
        security: 45,
        patrol: 120,
        equipment: 38,
        performance: 31,
        critical: 3,
        urgent: 12
    });
// Use useMemo for computed values that depend on stats
    useMemo<ChartDataItem[]>(() => [
        { name: 'Đã ký', value: contractStats.signed, color: '#10b981' },
        { name: 'Chờ ký', value: contractStats.pending, color: '#f59e0b' },
        { name: 'Quá hạn', value: contractStats.expired, color: '#ef4444' }
    ], [contractStats.signed, contractStats.pending, contractStats.expired]);
    useMemo<ChartDataItem[]>(() => [
        { name: 'Sự cố an ninh', value: reportStats.security, color: '#ef4444' },
        { name: 'Tuần tra định kỳ', value: reportStats.patrol, color: '#10b981' },
        { name: 'Thiết bị/Kỹ thuật', value: reportStats.equipment, color: '#f59e0b' },
        { name: 'Hiệu suất nhân sự', value: reportStats.performance, color: '#3b82f6' }
    ], [reportStats.security, reportStats.patrol, reportStats.equipment, reportStats.performance]);
// Effects
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

                    {/* Time Filter */}
                    <div className="dd-filter-bar">
                        <div className="dd-filter-group">
                            {(['today', '7days', '30days', '90days', 'year'] as const).map(filter => (
                                <button
                                    key={filter}
                                    className={`dd-filter-btn ${timeFilter === filter ? 'dd-filter-active' : ''}`}
                                    onClick={() => setTimeFilter(filter)}
                                >
                                    {filter === 'today' ? 'Hôm nay' : filter === '7days' ? '7 ngày' : filter === '30days' ? '30 ngày' : filter === '90days' ? '90 ngày' : 'Năm'}
                                </button>
                            ))}
                        </div>
                        <div className="dd-filter-actions">
                            <button className="dd-export-btn">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>



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
