import {useState, useEffect, useRef} from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import ManagerInfoModal from "../../components/managerInfoModal/managerInfoModal.tsx";
import './managerGuardList.css';

interface Guard {
    id: string;
    identityNumber: string;
    employeeCode: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    currentAddress: string;
    employmentStatus: string;
    hireDate: string;
    contractType: string;
    terminationDate: string | null;
    terminationReason: string | null;
    maxWeeklyHours: number;
    canWorkOvertime: boolean;
    canWorkWeekends: boolean;
    canWorkHolidays: boolean;
    currentAvailability: string;
    isActive: boolean;
    lastSyncedAt: string;
    syncStatus: string;
    userServiceVersion: number;
    createdAt: string;
    updatedAt: string;
}

interface PendingGuard {
    guardId: string;
    employeeCode: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatarUrl: string;
    dateOfBirth: string;
    gender: string;
    employmentStatus: string;
    hireDate: string;
    contractType: string;
    preferredShiftType: string | null;
    canWorkOvertime: boolean;
    canWorkWeekends: boolean;
    canWorkHolidays: boolean;
    currentAvailability: string;
    totalShiftsWorked: number;
    totalHoursWorked: number;
    attendanceRate: number | null;
    punctualityRate: number | null;
    noShowCount: number;
    violationCount: number;
    commendationCount: number;
    requestedAt: string;
    createdAt: string;
}

const ManagerGuardList = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showManagerInfoModal, setShowManagerInfoModal] = useState(false);
    const [guards, setGuards] = useState<Guard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [managerId, setManagerId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingGuards, setPendingGuards] = useState<PendingGuard[]>([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [confirmingGuardId, setConfirmingGuardId] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState<number>(0);

    const profileRef = useRef<HTMLDivElement>(null);

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
        fetchGuards();
    }, []);

    useEffect(() => {
        if (managerId) {
            fetchPendingCount();
        }
    }, [managerId]);

    const fetchGuards = async () => {
        try {
            setLoading(true);
            setError(null);
            const email = user?.email;

            if (!email) {
                setError('Kh�ng t�m th�y th�ng tin ng��i d�ng');
                setLoading(false);
                return;
            }

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
            if (!accessToken) {
                setError('Kh�ng t�m th�y access token');
                setLoading(false);
                return;
            }

            const managerUrl = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/managers/by-email`;

            const managerResponse = await fetch(managerUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Email: email
                })
            });

            if (!managerResponse.ok) {
                const errorText = await managerResponse.text();
                console.error('Manager API error:', managerResponse.status, errorText);
                throw new Error(`L�i khi t�i th�ng tin qu�n l� (${managerResponse.status})`);
            }

            const managerText = await managerResponse.text();
            let managerData;
            try {
                managerData = JSON.parse(managerText);
            } catch (e) {
                console.error('Failed to parse manager response:', managerText.substring(0, 200));
                throw new Error(`API trả về dữ liệu không hợp lệ. URL: ${managerUrl}`);
            }

            const fetchedManagerId = managerData.manager?.id;

            if (!fetchedManagerId) {
                throw new Error('Không tìm thấy manager ID trong response');
            }

            setManagerId(fetchedManagerId);

            const guardsUrl = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/guards/joined/${fetchedManagerId}`;

            const guardsResponse = await fetch(guardsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!guardsResponse.ok) {
                const errorText = await guardsResponse.text();
                console.error('Guards API error:', guardsResponse.status, errorText);
                throw new Error(`Lỗi khi tải danh sách bảo vệ (${guardsResponse.status})`);
            }

            const guardsText = await guardsResponse.text();
            let guardsData;
            try {
                guardsData = JSON.parse(guardsText);
            } catch (e) {
                console.error('Failed to parse guards response:', guardsText.substring(0, 200));
                throw new Error('API trả về dữ liệu không hợp lệ');
            }

            setGuards(guardsData.guards || []);
        } catch (err) {
            console.error('Error fetching guards:', err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingCount = async () => {
        if (!managerId) return;

        try {
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

            if (!accessToken) {
                return;
            }

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/managers/${managerId}/guard-join-requests`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setPendingCount(data.pendingRequests?.length || 0);
        } catch (err) {
            // Silently fail - pending count is not critical
        }
    };

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

    const filteredGuards = guards.filter(guard => {
        const searchLower = searchTerm.toLowerCase();
        return (
            guard.fullName.toLowerCase().includes(searchLower) ||
            guard.email.toLowerCase().includes(searchLower) ||
            guard.employeeCode.toLowerCase().includes(searchLower) ||
            guard.phoneNumber.includes(searchTerm)
        );
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'mgr-guard-status-active';
            case 'ON_LEAVE':
                return 'mgr-guard-status-leave';
            case 'TERMINATED':
                return 'mgr-guard-status-terminated';
            default:
                return '';
        }
    };

    const getAvailabilityColor = (availability: string) => {
        switch (availability) {
            case 'AVAILABLE':
                return 'mgr-guard-availability-available';
            case 'ON_SHIFT':
                return 'mgr-guard-availability-on-shift';
            case 'OFF_DUTY':
                return 'mgr-guard-availability-off-duty';
            default:
                return '';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleOpenPendingModal = async () => {
        setShowPendingModal(true);
        await fetchPendingRequests();
    };

    const handleClosePendingModal = () => {
        setShowPendingModal(false);
    };

    const fetchPendingRequests = async () => {
        if (!managerId) return;

        try {
            setLoadingPending(true);
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

            if (!accessToken) {
                console.error('No access token found');
                return;
            }

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/managers/${managerId}/guard-join-requests`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch pending requests: ${response.status}`);
            }

            const data = await response.json();
            setPendingGuards(data.pendingRequests || []);
        } catch (err) {
            console.error('Error fetching pending requests:', err);
        } finally {
            setLoadingPending(false);
        }
    };

    const handleConfirmGuard = async (guardId: string) => {
        try {
            setConfirmingGuardId(guardId);
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

            if (!accessToken) {
                console.error('No access token found');
                return;
            }

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/guards/${guardId}/confirm-join`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to confirm guard: ${response.status}`);
            }

            setPendingGuards(prev => prev.filter(g => g.guardId !== guardId));
            await fetchGuards();
            await fetchPendingCount();
        } catch (err) {
            console.error('Error confirming guard:', err);
        } finally {
            setConfirmingGuardId(null);
        }
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
                        <li className="manager-nav-item">
                            <a href="/manager/dashboard" className="manager-nav-link">
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="manager-nav-item manager-nav-active">
                            <a href="/manager/guard-list" className="manager-nav-link">
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân viên</span>}
                            </a>
                        </li>
                        <li className="manager-nav-item">
                            <a href="/manager/request" className="manager-nav-link">
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
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
                        <div>
                            <h1 className="manager-page-title">Quản lý nhân viên bảo vệ</h1>
                            <p className="manager-page-subtitle">Danh sách nhân viên bảo vệ đang quản lý</p>
                        </div>
                        <button className="mgr-guard-pending-btn" onClick={handleOpenPendingModal}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Xác nhận bảo vệ
                            {pendingCount > 0 && (
                                <span className="mgr-guard-badge">{pendingCount}</span>
                            )}
                        </button>
                    </div>

                    <div className="mgr-guard-controls">
                        <div className="mgr-guard-search">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, email, mã nhân viên hoặc số điện thoại..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="mgr-guard-stats">
                            <div className="mgr-guard-stat-item">
                                <span className="mgr-guard-stat-label">Tổng số:</span>
                                <span className="mgr-guard-stat-value">{guards.length}</span>
                            </div>
                            <div className="mgr-guard-stat-item">
                                <span className="mgr-guard-stat-label">Kết quả:</span>
                                <span className="mgr-guard-stat-value">{filteredGuards.length}</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="mgr-guard-loading">
                            <div className="mgr-guard-spinner"></div>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <div className="mgr-guard-error">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                            </svg>
                            <p>{error}</p>
                        </div>
                    ) : filteredGuards.length === 0 ? (
                        <div className="mgr-guard-empty">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                            <p>{searchTerm ? 'Không tìm thấy nhânn viên bảo vệ nào' : 'Chưa có nhân viên bảo vệ nào'}</p>
                        </div>
                    ) : (
                        <div className="mgr-guard-list">
                            {filteredGuards.map(guard => (
                                <div key={guard.id} className="mgr-guard-card">
                                    <div className="mgr-guard-card-header">
                                        <div className="mgr-guard-avatar">
                                            {guard.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="mgr-guard-basic-info">
                                            <h3 className="mgr-guard-name">{guard.fullName}</h3>
                                            <p className="mgr-guard-code">{guard.employeeCode}</p>
                                        </div>
                                        <div className="mgr-guard-status-badges">
                                            <span className={`mgr-guard-status ${getStatusColor(guard.employmentStatus)}`}>
                                                {guard.employmentStatus}
                                            </span>
                                            <span className={`mgr-guard-availability ${getAvailabilityColor(guard.currentAvailability)}`}>
                                                {guard.currentAvailability}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mgr-guard-card-body">
                                        <div className="mgr-guard-info-grid">
                                            <div className="mgr-guard-info-item">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                                </svg>
                                                <div>
                                                    <span className="mgr-guard-info-label">Email</span>
                                                    <span className="mgr-guard-info-value">{guard.email}</span>
                                                </div>
                                            </div>
                                            <div className="mgr-guard-info-item">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                                </svg>
                                                <div>
                                                    <span className="mgr-guard-info-label">Số điện thoại</span>
                                                    <span className="mgr-guard-info-value">{guard.phoneNumber}</span>
                                                </div>
                                            </div>
                                            <div className="mgr-guard-info-item">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                </svg>
                                                <div>
                                                    <span className="mgr-guard-info-label">Địa chỉ</span>
                                                    <span className="mgr-guard-info-value">{guard.currentAddress}</span>
                                                </div>
                                            </div>
                                            <div className="mgr-guard-info-item">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                                                </svg>
                                                <div>
                                                    <span className="mgr-guard-info-label">Ngày sinh</span>
                                                    <span className="mgr-guard-info-value">{formatDate(guard.dateOfBirth)}</span>
                                                </div>
                                            </div>
                                            <div className="mgr-guard-info-item">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                                </svg>
                                            </div>
                                            <div className="mgr-guard-info-item">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                                </svg>
                                                <div>
                                                    <span className="mgr-guard-info-label">Ngày tuyển vào</span>
                                                    <span className="mgr-guard-info-value">{formatDate(guard.hireDate)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mgr-guard-capabilities">
                                            <h4>Khả năng làm việc</h4>
                                            <div className="mgr-guard-capability-list">
                                                <div className={`mgr-guard-capability ${guard.canWorkOvertime ? 'active' : 'inactive'}`}>
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                        <path d={guard.canWorkOvertime ? "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" : "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"}/>
                                                    </svg>
                                                    <span>Làm thêm giờ</span>
                                                </div>
                                                <div className={`mgr-guard-capability ${guard.canWorkWeekends ? 'active' : 'inactive'}`}>
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                        <path d={guard.canWorkWeekends ? "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" : "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"}/>
                                                    </svg>
                                                    <span>Làm cuối tuần</span>
                                                </div>
                                                <div className={`mgr-guard-capability ${guard.canWorkHolidays ? 'active' : 'inactive'}`}>
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                        <path d={guard.canWorkHolidays ? "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" : "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"}/>
                                                    </svg>
                                                    <span>Làm ngày lễ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {showLogoutModal && (
                <div className="manager-modal-overlay" onClick={cancelLogout}>
                    <div className="manager-modal-content" onClick={(e) => e.stopPropagation()}>
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

            {showPendingModal && (
                <div className="mgr-guard-modal-overlay" onClick={handleClosePendingModal}>
                    <div className="mgr-guard-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-guard-modal-header">
                            <h3>Yêu cầu tham gia từ bảo vệ</h3>
                            <button className="mgr-guard-modal-close" onClick={handleClosePendingModal}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        <div className="mgr-guard-modal-body">
                            {loadingPending ? (
                                <div className="mgr-guard-pending-loading">
                                    <div className="mgr-guard-spinner"></div>
                                    <p>Đang tải danh sách...</p>
                                </div>
                            ) : pendingGuards.length === 0 ? (
                                <div className="mgr-guard-pending-empty">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                    </svg>
                                    <p>Không có yêu cầu nào</p>
                                </div>
                            ) : (
                                <div className="mgr-guard-pending-list">
                                    {pendingGuards.map(guard => (
                                        <div key={guard.guardId} className="mgr-guard-pending-card">
                                            <div className="mgr-guard-pending-header">
                                                <div className="mgr-guard-pending-avatar">
                                                    {guard.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="mgr-guard-pending-info">
                                                    <h4>{guard.fullName}</h4>
                                                    <p>{guard.employeeCode}</p>
                                                </div>
                                            </div>
                                            <div className="mgr-guard-pending-details">
                                                <div className="mgr-guard-pending-row">
                                                    <span className="mgr-guard-pending-label">Email:</span>
                                                    <span className="mgr-guard-pending-value">{guard.email}</span>
                                                </div>
                                                <div className="mgr-guard-pending-row">
                                                    <span className="mgr-guard-pending-label">Số điện thoại:</span>
                                                    <span className="mgr-guard-pending-value">{guard.phoneNumber}</span>
                                                </div>
                                                <div className="mgr-guard-pending-row">
                                                    <span className="mgr-guard-pending-label">Giới tính:</span>
                                                    <span className="mgr-guard-pending-value">{guard.gender}</span>
                                                </div>
                                                <div className="mgr-guard-pending-row">
                                                    <span className="mgr-guard-pending-label">Ngày yêu cầu:</span>
                                                    <span className="mgr-guard-pending-value">{formatDate(guard.requestedAt)}</span>
                                                </div>
                                                <div className="mgr-guard-pending-capabilities">
                                                    <div className={`mgr-guard-pending-capability ${guard.canWorkOvertime ? 'active' : 'inactive'}`}>
                                                        Làm thêm giờ
                                                    </div>
                                                    <div className={`mgr-guard-pending-capability ${guard.canWorkWeekends ? 'active' : 'inactive'}`}>
                                                        Làm cuối tuần
                                                    </div>
                                                    <div className={`mgr-guard-pending-capability ${guard.canWorkHolidays ? 'active' : 'inactive'}`}>
                                                        Làm ngày lễ
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="mgr-guard-pending-confirm-btn"
                                                onClick={() => handleConfirmGuard(guard.guardId)}
                                                disabled={confirmingGuardId === guard.guardId}
                                            >
                                                {confirmingGuardId === guard.guardId ? 'Đang xử lý...' : 'Xác nhận'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ManagerInfoModal
                isOpen={showManagerInfoModal}
                onClose={() => setShowManagerInfoModal(false)}
                managerId={managerId}
            />
        </div>
    );
};

export default ManagerGuardList;
