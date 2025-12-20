import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import './EmployeeControl.css';

interface Manager {
    id: string;
    identityNumber: string;
    employeeCode: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phoneNumber: string;
    currentAddress: string;
    gender: string;
    dateOfBirth: string;
    role: string;
    position: string | null;
    department: string | null;
    managerLevel: number;
    reportsToManagerId: string | null;
    employmentStatus: string;
    canCreateShifts: boolean;
    canApproveShifts: boolean;
    canAssignGuards: boolean;
    canApproveOvertime: boolean;
    canManageTeams: boolean;
    totalTeamsManaged: number;
    totalGuardsSupervised: number;
    totalShiftsCreated: number;
    isActive: boolean;
    lastSyncedAt: string;
    syncStatus: string;
    createdAt: string;
}

interface Guard {
    id: string;
    identityNumber: string;
    employeeCode: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    currentAddress: string;
    employmentStatus: string;
    hireDate: string;
    contractType: string | null;
    maxWeeklyHours: number;
    canWorkOvertime: boolean;
    canWorkWeekends: boolean;
    canWorkHolidays: boolean;
    currentAvailability: string;
    directManagerId: string | null;
    isActive: boolean;
    lastSyncedAt: string;
    syncStatus: string;
    createdAt: string;
}

interface ManagersResponse {
    managers: Manager[];
}

interface GuardsResponse {
    guards: Guard[];
}

const EmployeeControl = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<'managers' | 'guards'>('managers');

    const [managers, setManagers] = useState<Manager[]>([]);
    const [guards, setGuards] = useState<Guard[]>([]);
    const [assignedGuards, setAssignedGuards] = useState<Guard[]>([]);
    const [unassignedGuards, setUnassignedGuards] = useState<Guard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
    const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarFailedOpen, setSnackbarFailedOpen] = useState(false);
    const [snackbarFailedMessage, setSnackbarFailedMessage] = useState('');

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
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const shiftsUrl = import.meta.env.VITE_API_SHIFTS_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    console.error('No access token found');
                    setError('Khong tim thay token xac thuc. Vui long dang nhap lai.');
                    setIsLoading(false);
                    return;
                }

                const managersResponse = await fetch(`${shiftsUrl}/shifts/managers`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!managersResponse.ok) {
                    throw new Error('Failed to fetch managers');
                }

                const managersData: ManagersResponse = await managersResponse.json();
                setManagers(managersData.managers);

                const guardsResponse = await fetch(`${shiftsUrl}/shifts/guards`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!guardsResponse.ok) {
                    throw new Error('Failed to fetch guards');
                }

                const guardsData: GuardsResponse = await guardsResponse.json();
                setGuards(guardsData.guards);

                const assigned = guardsData.guards.filter(guard => guard.directManagerId !== null);
                const unassigned = guardsData.guards.filter(guard => guard.directManagerId === null);
                setAssignedGuards(assigned);
                setUnassignedGuards(unassigned);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Không thể tải danh sách nhân sự. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

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

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Chưa có';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleAssignGuard = async (guard: Guard, manager: Manager) => {
        setIsAssigning(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            const shiftsUrl = import.meta.env.VITE_API_SHIFTS_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setSnackbarFailedMessage('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                setSnackbarFailedOpen(true);
                setIsAssigning(false);
                return;
            }

            // Check manager's guard count limit before assigning
            const checkResponse = await fetch(`${baseUrl}/shifts/managers/${manager.id}/check-guard-count`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!checkResponse.ok) {
                throw new Error('Failed to check manager guard count');
            }

            const checkData = await checkResponse.json();

            if (checkData.success && checkData.data.isOverLimit) {
                setSnackbarFailedMessage('Số lượng bảo vệ của quản lý này đã đến giới hạn. Vui lòng phân công cho quản lý khác');
                setSnackbarFailedOpen(true);
                setIsAssigning(false);
                return;
            }

            // Proceed with assigning if not over limit
            const response = await fetch(`${shiftsUrl}/shifts/guards/request-join-manager`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    GuardId: guard.id,
                    ManagerId: manager.id,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to assign guard to manager');
            }

            setSnackbarMessage(`Đã phân công ${guard.fullName} cho ${manager.fullName}`);
            setSnackbarOpen(true);

            const updatedGuard = { ...guard, directManagerId: manager.id };
            setAssignedGuards([...assignedGuards, updatedGuard]);
            setUnassignedGuards(unassignedGuards.filter(g => g.id !== guard.id));
            setGuards(guards.map(g => g.id === guard.id ? updatedGuard : g));

            setSelectedGuard(null);
            setSelectedManager(null);
        } catch (err) {
            console.error('Error assigning guard:', err);
            setSnackbarFailedMessage('Không thể phân công bảo vệ. Vui lòng thử lại sau.');
            setSnackbarFailedOpen(true);
        } finally {
            setIsAssigning(false);
        }
    };

    const getManagerById = (managerId: string | null) => {
        if (!managerId) return null;
        return managers.find(m => m.id === managerId);
    };

    const filteredManagers = managers.filter(manager => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            manager.fullName.toLowerCase().includes(searchLower) ||
            manager.employeeCode.toLowerCase().includes(searchLower) ||
            manager.email.toLowerCase().includes(searchLower) ||
            manager.phoneNumber.includes(searchTerm)
        );
    });

    const filteredAssignedGuards = assignedGuards.filter(guard => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            guard.fullName.toLowerCase().includes(searchLower) ||
            guard.employeeCode.toLowerCase().includes(searchLower) ||
            guard.email.toLowerCase().includes(searchLower) ||
            guard.phoneNumber.includes(searchTerm)
        );
    });

    const filteredUnassignedGuards = unassignedGuards.filter(guard => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            guard.fullName.toLowerCase().includes(searchLower) ||
            guard.employeeCode.toLowerCase().includes(searchLower) ||
            guard.email.toLowerCase().includes(searchLower) ||
            guard.phoneNumber.includes(searchTerm)
        );
    });

    return (
        <div className="emp-ctrl-container">
            <aside className={`emp-ctrl-sidebar ${isMenuOpen ? 'emp-ctrl-sidebar-open' : 'emp-ctrl-sidebar-closed'}`}>
                <div className="emp-ctrl-sidebar-header">
                    <div className="emp-ctrl-sidebar-logo">
                        <div className="emp-ctrl-logo-icon">D</div>
                        {isMenuOpen && <span className="emp-ctrl-logo-text">Director</span>}
                    </div>
                </div>

                <nav className="emp-ctrl-sidebar-nav">
                    <ul className="emp-ctrl-nav-list">
                        <li className="emp-ctrl-nav-item">
                            <Link to="/director/dashboard" className="emp-ctrl-nav-link">
                                <svg className="emp-ctrl-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="emp-ctrl-nav-item">
                            <Link to="/director/customer-list" className="emp-ctrl-nav-link">
                                <svg className="emp-ctrl-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="emp-ctrl-nav-item emp-ctrl-nav-active">
                            <Link to="/director/employee-control" className="emp-ctrl-nav-link">
                                <svg className="emp-ctrl-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="emp-ctrl-nav-item">
                            <Link to="/director/analytics" className="emp-ctrl-nav-link">
                                <svg className="emp-ctrl-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="emp-ctrl-nav-item">
                            <Link to="/director/reports" className="emp-ctrl-nav-link">
                                <svg className="emp-ctrl-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </Link>
                        </li>
                        <li className="emp-ctrl-nav-item">
                            <Link to="/director/chat" className="emp-ctrl-nav-link">
                                <svg className="emp-ctrl-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                </svg>
                                {isMenuOpen && <span>Trò chuyện</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`emp-ctrl-main-content ${isMenuOpen ? 'emp-ctrl-content-expanded' : 'emp-ctrl-content-collapsed'}`}>
                <header className="emp-ctrl-nav-header">
                    <div className="emp-ctrl-nav-left">
                        <button className="emp-ctrl-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="emp-ctrl-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="emp-ctrl-nav-right">
                        <button className="emp-ctrl-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="emp-ctrl-notification-badge">0</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="emp-ctrl-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="emp-ctrl-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="emp-ctrl-user-info">
                                <span className="emp-ctrl-user-name">{user?.fullName || 'Director'}</span>
                                <span className="emp-ctrl-user-role">Giám đốc điều hành</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="emp-ctrl-profile-dropdown">
                                    <div
                                        className={`emp-ctrl-dropdown-item emp-ctrl-logout-item ${isLoggingOut ? 'emp-ctrl-disabled' : ''}`}
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
                                        <svg className="emp-ctrl-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="emp-ctrl-main">
                    <div className="emp-ctrl-page-header">
                        <h1 className="emp-ctrl-page-title">Quản lý nhân sự</h1>
                        <button className="emp-ctrl-refresh-btn" onClick={handleRefresh} title="Lam moi danh sach">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        </button>
                    </div>

                    <div className="emp-ctrl-tabs">
                        <button
                            className={`emp-ctrl-tab ${activeTab === 'managers' ? 'emp-ctrl-tab-active' : ''}`}
                            onClick={() => setActiveTab('managers')}
                        >
                            Quản lý ({managers.length})
                        </button>
                        <button
                            className={`emp-ctrl-tab ${activeTab === 'guards' ? 'emp-ctrl-tab-active' : ''}`}
                            onClick={() => setActiveTab('guards')}
                        >
                            Bảo vệ ({guards.length})
                        </button>
                    </div>

                    <div className="emp-ctrl-filters-section">
                        <div className="emp-ctrl-search-box">
                            <svg className="emp-ctrl-search-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input
                                type="text"
                                className="emp-ctrl-search-input"
                                placeholder="Tìm kiếm theo tên, mã nhân viên, email, số điện thoại..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading && (
                        <div className="emp-ctrl-loading">
                            <div className="emp-ctrl-loading-text">Đang tải danh sách nhân sự...</div>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="emp-ctrl-error">
                            <div className="emp-ctrl-error-text">{error}</div>
                            <button
                                className="emp-ctrl-retry-btn"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <>
                            {activeTab === 'managers' && (
                                <div className="emp-ctrl-list">
                                    {filteredManagers.length === 0 ? (
                                        <div className="emp-ctrl-empty">
                                            <div className="emp-ctrl-empty-text">Không tìm thấy quản lý nào.</div>
                                        </div>
                                    ) : (
                                        filteredManagers.map(manager => (
                                            <div key={manager.id} className="emp-ctrl-item">
                                                <div className="emp-ctrl-item-header">
                                                    <div className="emp-ctrl-item-main-info">
                                                        <div className="emp-ctrl-item-name">{manager.fullName}</div>
                                                        <div className="emp-ctrl-item-code">
                                                            <span className="emp-ctrl-code-label">Mã nhân viên:</span>
                                                            <span className="emp-ctrl-code-value">{manager.employeeCode}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`emp-ctrl-item-status emp-ctrl-status-${manager.isActive ? 'active' : 'inactive'}`}>
                                                        {manager.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                                                    </div>
                                                </div>
                                                <div className="emp-ctrl-item-details">
                                                    <div className="emp-ctrl-item-detail">
                                                        <span className="emp-ctrl-detail-label">Email:</span>
                                                        <span className="emp-ctrl-detail-value">{manager.email}</span>
                                                    </div>
                                                    <div className="emp-ctrl-item-detail">
                                                        <span className="emp-ctrl-detail-label">Số điện thoại:</span>
                                                        <span className="emp-ctrl-detail-value">{manager.phoneNumber}</span>
                                                    </div>
                                                    <div className="emp-ctrl-item-detail">
                                                        <span className="emp-ctrl-detail-label">Địa chỉ:</span>
                                                        <span className="emp-ctrl-detail-value">{manager.currentAddress}</span>
                                                    </div>
                                                    <div className="emp-ctrl-item-detail">
                                                        <span className="emp-ctrl-detail-label">Ngày sinh:</span>
                                                        <span className="emp-ctrl-detail-value">{formatDate(manager.dateOfBirth)}</span>
                                                    </div>
                                                    <div className="emp-ctrl-item-detail">
                                                        <span className="emp-ctrl-detail-label">Số bảo vệ quản lý:</span>
                                                        <span className="emp-ctrl-detail-value">{manager.totalGuardsSupervised}</span>
                                                    </div>
                                                    <div className="emp-ctrl-item-detail">
                                                        <span className="emp-ctrl-detail-label">Số ca đã phân công:</span>
                                                        <span className="emp-ctrl-detail-value">{manager.totalShiftsCreated}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'guards' && (
                                <>
                                    <div className="emp-ctrl-section">
                                        <div className="emp-ctrl-section-header">
                                            <h2 className="emp-ctrl-section-title">Bảo vệ chưa phân công ({filteredUnassignedGuards.length})</h2>
                                        </div>
                                        <div className="emp-ctrl-list">
                                            {filteredUnassignedGuards.length === 0 ? (
                                                <div className="emp-ctrl-empty">
                                                    <div className="emp-ctrl-empty-text">Không có bảo vệ chưa phân công.</div>
                                                </div>
                                            ) : (
                                                filteredUnassignedGuards.map(guard => (
                                                    <div key={guard.id} className="emp-ctrl-item">
                                                        <div className="emp-ctrl-item-header">
                                                            <div className="emp-ctrl-item-main-info">
                                                                <div className="emp-ctrl-item-name">{guard.fullName}</div>
                                                                <div className="emp-ctrl-item-code">
                                                                    <span className="emp-ctrl-code-label">Mã nhân viên:</span>
                                                                    <span className="emp-ctrl-code-value">{guard.employeeCode}</span>
                                                                </div>
                                                            </div>
                                                            <div className={`emp-ctrl-item-status emp-ctrl-status-${guard.isActive ? 'active' : 'inactive'}`}>
                                                                {guard.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                                                            </div>
                                                        </div>
                                                        <div className="emp-ctrl-item-details">
                                                            <div className="emp-ctrl-item-detail">
                                                                <span className="emp-ctrl-detail-label">Email:</span>
                                                                <span className="emp-ctrl-detail-value">{guard.email}</span>
                                                            </div>
                                                            <div className="emp-ctrl-item-detail">
                                                                <span className="emp-ctrl-detail-label">Điện thoại:</span>
                                                                <span className="emp-ctrl-detail-value">{guard.phoneNumber}</span>
                                                            </div>
                                                            <div className="emp-ctrl-item-detail">
                                                                <span className="emp-ctrl-detail-label">Địa chỉ:</span>
                                                                <span className="emp-ctrl-detail-value">{guard.currentAddress}</span>
                                                            </div>
                                                            <div className="emp-ctrl-item-detail">
                                                                <span className="emp-ctrl-detail-label">Ngày sinh:</span>
                                                                <span className="emp-ctrl-detail-value">{formatDate(guard.dateOfBirth)}</span>
                                                            </div>
                                                            <div className="emp-ctrl-item-detail">
                                                                <span className="emp-ctrl-detail-label">Tình trạng:</span>
                                                                <span className="emp-ctrl-detail-value">{guard.currentAvailability}</span>
                                                            </div>
                                                        </div>
                                                        <div className="emp-ctrl-item-actions">
                                                            <select
                                                                className="emp-ctrl-manager-select"
                                                                value={selectedGuard?.id === guard.id && selectedManager ? selectedManager.id : ''}
                                                                onChange={(e) => {
                                                                    const manager = managers.find(m => m.id === e.target.value);
                                                                    if (manager) {
                                                                        setSelectedGuard(guard);
                                                                        setSelectedManager(manager);
                                                                    }
                                                                }}
                                                                disabled={isAssigning}
                                                            >
                                                                <option value="">Chọn quản lý...</option>
                                                                {managers.map(manager => (
                                                                    <option key={manager.id} value={manager.id}>
                                                                        {manager.fullName} ({manager.employeeCode})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                className="emp-ctrl-action-btn emp-ctrl-btn-assign"
                                                                onClick={() => {
                                                                    if (selectedGuard?.id === guard.id && selectedManager) {
                                                                        handleAssignGuard(guard, selectedManager);
                                                                    }
                                                                }}
                                                                disabled={isAssigning || selectedGuard?.id !== guard.id || !selectedManager}
                                                            >
                                                                {isAssigning && selectedGuard?.id === guard.id ? 'Đang phân công...' : 'Phân công'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="emp-ctrl-section">
                                        <div className="emp-ctrl-section-header">
                                            <h2 className="emp-ctrl-section-title">Bảo vệ đã phân công ({filteredAssignedGuards.length})</h2>
                                        </div>
                                        <div className="emp-ctrl-list">
                                            {filteredAssignedGuards.length === 0 ? (
                                                <div className="emp-ctrl-empty">
                                                    <div className="emp-ctrl-empty-text">Khng có bảo vệ đã phân công.</div>
                                                </div>
                                            ) : (
                                                filteredAssignedGuards.map(guard => {
                                                    const manager = getManagerById(guard.directManagerId);
                                                    return (
                                                        <div key={guard.id} className="emp-ctrl-item">
                                                            <div className="emp-ctrl-item-header">
                                                                <div className="emp-ctrl-item-main-info">
                                                                    <div className="emp-ctrl-item-name">{guard.fullName}</div>
                                                                    <div className="emp-ctrl-item-code">
                                                                        <span className="emp-ctrl-code-label">Mã nhân viên:</span>
                                                                        <span className="emp-ctrl-code-value">{guard.employeeCode}</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`emp-ctrl-item-status emp-ctrl-status-${guard.isActive ? 'active' : 'inactive'}`}>
                                                                    {guard.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                                                                </div>
                                                            </div>
                                                            <div className="emp-ctrl-item-details">
                                                                <div className="emp-ctrl-item-detail">
                                                                    <span className="emp-ctrl-detail-label">Email:</span>
                                                                    <span className="emp-ctrl-detail-value">{guard.email}</span>
                                                                </div>
                                                                <div className="emp-ctrl-item-detail">
                                                                    <span className="emp-ctrl-detail-label">Điện thoại:</span>
                                                                    <span className="emp-ctrl-detail-value">{guard.phoneNumber}</span>
                                                                </div>
                                                                <div className="emp-ctrl-item-detail">
                                                                    <span className="emp-ctrl-detail-label">Địa chỉ:</span>
                                                                    <span className="emp-ctrl-detail-value">{guard.currentAddress}</span>
                                                                </div>
                                                                <div className="emp-ctrl-item-detail">
                                                                    <span className="emp-ctrl-detail-label">Ngày sinh:</span>
                                                                    <span className="emp-ctrl-detail-value">{formatDate(guard.dateOfBirth)}</span>
                                                                </div>
                                                                <div className="emp-ctrl-item-detail">
                                                                    <span className="emp-ctrl-detail-label">Tình trạng:</span>
                                                                    <span className="emp-ctrl-detail-value">{guard.currentAvailability}</span>
                                                                </div>
                                                                {manager && (
                                                                    <div className="emp-ctrl-item-detail">
                                                                        <span className="emp-ctrl-detail-label">Quản lý:</span>
                                                                        <span className="emp-ctrl-detail-value emp-ctrl-manager-name">{manager.fullName}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>

            {showLogoutModal && (
                <div className="emp-ctrl-modal-overlay" onClick={cancelLogout}>
                    <div className="emp-ctrl-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="emp-ctrl-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="emp-ctrl-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="emp-ctrl-modal-footer">
                            <button className="emp-ctrl-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="emp-ctrl-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SnackbarChecked
                message={snackbarMessage}
                isOpen={snackbarOpen}
                onClose={() => setSnackbarOpen(false)}
            />
            <SnackbarFailed
                message={snackbarFailedMessage}
                isOpen={snackbarFailedOpen}
                onClose={() => setSnackbarFailedOpen(false)}
            />
        </div>
    );
};

export default EmployeeControl;
