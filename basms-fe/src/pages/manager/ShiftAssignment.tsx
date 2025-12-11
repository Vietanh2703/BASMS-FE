import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import ManagerInfoModal from "../../components/managerInfoModal/managerInfoModal.tsx";
import '../manager/dashboardManager.css';
import './ShiftAssignment.css';

interface ManagedContract {
    contractId: string;
    managerId: string;
    locationId: string;
    locationName: string;
    locationAddress: string;
    locationLatitude: number;
    locationLongitude: number;
    totalShiftTemplates: number;
    totalActiveTemplates: number;
    templateStatus: string;
    effectiveFrom: string;
    effectiveTo: string;
    earliestCreatedAt: string;
    latestUpdatedAt: string;
}

interface ManagedContractsResponse {
    success: boolean;
    data: ManagedContract[];
    totalCount: number;
    filters: {
        managerId: string;
        status: string;
    };
}

interface Customer {
    id: string;
    customerCode: string;
    companyName: string;
    contactPersonName: string;
    contactPersonTitle: string;
    identityNumber: string;
    identityIssueDate: string;
    identityIssuePlace: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    city: string | null;
    district: string | null;
    industry: string | null;
    status: string;
}

interface ContractDetail {
    id: string;
    contractNumber: string;
    contractTitle: string;
    contractType: string;
    serviceScope: string;
    startDate: string;
    endDate: string;
    durationMonths: number;
    status: string;
    customer: Customer;
}

interface ContractDetailResponse {
    success: boolean;
    data: ContractDetail;
}

interface DisplayContract {
    contractId: string;
    locationName: string;
    customerName: string;
    customerAddress: string;
    status: string;
    startDate: string;
    endDate: string;
}

const ShiftAssignment = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showManagerInfoModal, setShowManagerInfoModal] = useState(false);
    const [contracts, setContracts] = useState<DisplayContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [managerId, setManagerId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

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
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            setError(null);
            const email = user?.email;

            if (!email) {
                setError('Không tìm thấy thông tin người dùng');
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
                setError('Không tìm thấy access token');
                setLoading(false);
                return;
            }

            // Fetch manager ID by email
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
                throw new Error(`Failed to fetch manager: ${managerResponse.status} - ${errorText}`);
            }

            const managerData = await managerResponse.json();
            const fetchedManagerId = managerData.manager?.id;

            if (!fetchedManagerId) {
                throw new Error('Không tìm thấy manager ID trong response');
            }

            setManagerId(fetchedManagerId);

            // Fetch contracts managed by this manager
            const contractsUrl = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/contracts/managed/${fetchedManagerId}`;

            const contractsResponse = await fetch(contractsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!contractsResponse.ok) {
                const errorText = await contractsResponse.text();
                throw new Error(`Failed to fetch contracts: ${contractsResponse.status} - ${errorText}`);
            }

            const managedContractsData: ManagedContractsResponse = await contractsResponse.json();

            if (!managedContractsData.success) {
                setError('Failed to load contracts');
                return;
            }

            // Fetch detailed contract information for each contract
            const displayContracts: DisplayContract[] = [];

            for (const managedContract of managedContractsData.data) {
                try {
                    const contractDetailUrl = `${import.meta.env.VITE_API_CONTRACT_URL}/contracts/${managedContract.contractId}`;

                    const contractDetailResponse = await fetch(contractDetailUrl, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        }
                    });

                    if (contractDetailResponse.ok) {
                        const contractDetailData: ContractDetailResponse = await contractDetailResponse.json();

                        if (contractDetailData.success && contractDetailData.data) {
                            displayContracts.push({
                                contractId: managedContract.contractId,
                                locationName: managedContract.locationName,
                                customerName: contractDetailData.data.customer.contactPersonName,
                                customerAddress: contractDetailData.data.customer.address,
                                status: contractDetailData.data.status,
                                startDate: contractDetailData.data.startDate,
                                endDate: contractDetailData.data.endDate
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching contract details for ${managedContract.contractId}:`, err);
                }
            }

            setContracts(displayContracts);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching contracts:', err);
        } finally {
            setLoading(false);
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

    const handleOpenUserInfo = () => {
        setShowManagerInfoModal(true);
        setIsProfileDropdownOpen(false);
    };

    const filteredContracts = contracts.filter(contract => {
        const searchLower = searchTerm.toLowerCase();
        return (
            contract.locationName.toLowerCase().includes(searchLower) ||
            contract.customerName.toLowerCase().includes(searchLower) ||
            contract.customerAddress.toLowerCase().includes(searchLower)
        );
    });

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase();

        switch (statusLower) {
            case 'shift_generated':
                return <span className="shift-status-badge shift-status-active">Đang hoạt động</span>;
            case 'expired':
                return <span className="shift-status-badge shift-status-cancelled">Hết hạn</span>;
            case 'active':
                return <span className="shift-status-badge shift-status-active">Đang hoạt động</span>;
            case 'pending':
                return <span className="shift-status-badge shift-status-pending">Chờ xử lý</span>;
            case 'completed':
                return <span className="shift-status-badge shift-status-completed">Hoàn thành</span>;
            case 'cancelled':
                return <span className="shift-status-badge shift-status-cancelled">Đã hủy</span>;
            default:
                return <span className="shift-status-badge">{status}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
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
                                <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
                                {isMenuOpen && <span>Yêu cầu phân công</span>}
                            </a>
                        </li>
                        <li className="manager-nav-item manager-nav-active">
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

                <main className="manager-main">
                    <div className="manager-header">
                        <h1 className="manager-title">Phân công ca làm</h1>
                        <p className="manager-subtitle">Quản lý các hợp đồng và phân công ca làm việc</p>
                    </div>

                    <div className="manager-content">
                        <div className="manager-search-bar">
                            <svg className="manager-search-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã hợp đồng, tên hợp đồng, khách hàng, địa điểm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="manager-search-input"
                            />
                        </div>

                        {loading ? (
                            <div className="manager-loading">
                                <div className="manager-spinner"></div>
                                <p>Đang tải danh sách hợp đồng...</p>
                            </div>
                        ) : error ? (
                            <div className="manager-error">
                                <svg className="manager-error-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                </svg>
                                <p>{error}</p>
                                <button onClick={fetchContracts} className="manager-retry-btn">Thử lại</button>
                            </div>
                        ) : filteredContracts.length === 0 ? (
                            <div className="manager-empty">
                                <svg className="manager-empty-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                                </svg>
                                <p>Không tìm thấy hợp đồng nào</p>
                            </div>
                        ) : (
                            <div className="shift-contracts-grid">
                                {filteredContracts.map((contract) => (
                                    <div key={contract.contractId} className="shift-contract-card">
                                        <div className="shift-contract-header">
                                            <div className="shift-contract-title-section">
                                                <h3 className="shift-contract-number">{contract.locationName}</h3>
                                            </div>
                                            {getStatusBadge(contract.status)}
                                        </div>

                                        <div className="shift-contract-body">
                                            <div className="shift-contract-info-row">
                                                <svg className="shift-info-icon" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                                </svg>
                                                <div className="shift-info-content">
                                                    <span className="shift-info-label">Khách hàng:</span>
                                                    <span className="shift-info-value">{contract.customerName}</span>
                                                </div>
                                            </div>

                                            <div className="shift-contract-info-row">
                                                <svg className="shift-info-icon" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                </svg>
                                                <div className="shift-info-content">
                                                    <span className="shift-info-label">Địa chỉ:</span>
                                                    <span className="shift-info-value">{contract.customerAddress}</span>
                                                </div>
                                            </div>

                                            <div className="shift-contract-info-row">
                                                <svg className="shift-info-icon" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                                                </svg>
                                                <div className="shift-info-content">
                                                    <span className="shift-info-label">Thời gian:</span>
                                                    <span className="shift-info-value">
                                                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shift-contract-footer">
                                            <button className="shift-btn-view">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                                </svg>
                                                Xem chi tiết
                                            </button>
                                            <button className="shift-btn-assign">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                </svg>
                                                Phân công ca
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="manager-modal-overlay" onClick={cancelLogout}>
                    <div className="manager-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="manager-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="manager-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
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

            {showManagerInfoModal && (
                <ManagerInfoModal
                    isOpen={showManagerInfoModal}
                    onClose={() => setShowManagerInfoModal(false)}
                    managerId={managerId}
                />
            )}
        </div>
    );
};

export default ShiftAssignment;
