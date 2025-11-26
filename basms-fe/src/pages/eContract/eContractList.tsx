import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './eContractList.css';

interface Document {
    id: string;
    documentType: string;
    documentName: string;
    fileUrl: string;
    createdAt: string;
}

interface ContractResponse {
    success: boolean;
    errorMessage: string | null;
    documents: Document[];
    totalCount: number;
}

interface Contract {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'expired' | 'pending' | 'cancelled' | 'awaiting_signature' | 'awaiting_approval' | 'approved';
    createdAt: string;
    expiresAt: string;
}

const EContractList = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedTimeRange, setSelectedTimeRange] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // API data states
    const [allContracts, setAllContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const contractTypes = [
        { value: 'all', label: 'Tất cả loại' },
        { value: 'service', label: 'Dịch vụ' },
        { value: 'rental', label: 'Thuê' },
        { value: 'partnership', label: 'Hợp tác' },
        { value: 'maintenance', label: 'Bảo trì' },
        { value: 'consulting', label: 'Tư vấn' },
        { value: 'training', label: 'Đào tạo' },
        { value: 'insurance', label: 'Bảo hiểm' },
        { value: 'sales', label: 'Mua bán' },
        { value: 'transport', label: 'Vận chuyển' },
        { value: 'marketing', label: 'Quảng cáo' },
        { value: 'manufacturing', label: 'Gia công' },
        { value: 'distribution', label: 'Phân phối' },
    ];

    const contractStatuses = [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'expired', label: 'Hết hạn' },
        { value: 'cancelled', label: 'Đã hủy' },
    ];

    const timeRanges = [
        { value: 'all', label: 'Tất cả thời gian' },
        { value: '7days', label: '7 ngày qua' },
        { value: '30days', label: '30 ngày qua' },
        { value: '3months', label: '3 tháng qua' },
        { value: '1year', label: '1 năm qua' },
    ];

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

    // Fetch contracts from API
    useEffect(() => {
        const fetchContracts = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('eContractAccessToken');

                if (!token) {
                    navigate('/e-contract/login');
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/documents`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch contracts');
                }

                const data: ContractResponse = await response.json();

                // Filter out templates - only show actual contracts
                const nonTemplateDocuments = data.documents.filter(doc => doc.documentType !== 'template');

                // Map API documents to Contract interface
                const mappedContracts: Contract[] = nonTemplateDocuments.map(doc => {
                    const createdDate = new Date(doc.createdAt);
                    const expiresDate = new Date(createdDate);
                    expiresDate.setFullYear(expiresDate.getFullYear() + 1); // Default 1 year expiration

                    // Map documentType to status
                    let status: 'active' | 'expired' | 'pending' | 'cancelled' | 'awaiting_signature' | 'awaiting_approval' | 'approved' = 'active';
                    if (doc.documentType === 'filled_contract') {
                        status = 'awaiting_signature';
                    } else if (doc.documentType === 'signed_contract') {
                        status = 'awaiting_approval';
                    } else if (doc.documentType === 'completed_contract') {
                        status = 'approved';
                    } else if (doc.documentType === 'unsign_contract') {
                        status = 'pending';
                    } else if (doc.documentType === 'expired_contract') {
                        status = 'expired';
                    } else if (doc.documentType === 'canceled_contract') {
                        status = 'cancelled';
                    }

                    // Map documentType to contract type (simplified)
                    let type = 'service';
                    if (doc.documentName.toLowerCase().includes('thuê')) type = 'rental';
                    else if (doc.documentName.toLowerCase().includes('hợp tác')) type = 'partnership';
                    else if (doc.documentName.toLowerCase().includes('bảo trì')) type = 'maintenance';
                    else if (doc.documentName.toLowerCase().includes('tư vấn')) type = 'consulting';
                    else if (doc.documentName.toLowerCase().includes('đào tạo')) type = 'training';
                    else if (doc.documentName.toLowerCase().includes('bảo hiểm')) type = 'insurance';
                    else if (doc.documentName.toLowerCase().includes('mua bán')) type = 'sales';
                    else if (doc.documentName.toLowerCase().includes('vận chuyển')) type = 'transport';
                    else if (doc.documentName.toLowerCase().includes('quảng cáo')) type = 'marketing';
                    else if (doc.documentName.toLowerCase().includes('gia công')) type = 'manufacturing';
                    else if (doc.documentName.toLowerCase().includes('phân phối')) type = 'distribution';

                    return {
                        id: doc.id,
                        name: doc.documentName,
                        type: type,
                        status: status,
                        createdAt: doc.createdAt,
                        expiresAt: expiresDate.toISOString(),
                    };
                });

                setAllContracts(mappedContracts);
            } catch (err) {
                console.error('Error fetching contracts:', err);
                setError('Không thể tải danh sách hợp đồng. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContracts();
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

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            active: 'Đang hoạt động',
            pending: 'Chờ xử lý',
            expired: 'Hết hạn',
            cancelled: 'Đã hủy',
            awaiting_signature: 'Chờ kí duyệt',
            awaiting_approval: 'Chờ xét duyệt',
            approved: 'Đã xét duyệt',
        };
        return statusMap[status] || status;
    };

    const getTypeLabel = (type: string) => {
        const found = contractTypes.find(t => t.value === type);
        return found ? found.label : type;
    };

    // Filter contracts
    const filteredContracts = allContracts.filter(contract => {
        // Search filter
        if (searchTerm && !contract.name.toLowerCase().includes(searchTerm.toLowerCase()) && !contract.id.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Type filter
        if (selectedType !== 'all' && contract.type !== selectedType) {
            return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && contract.status !== selectedStatus) {
            return false;
        }

        // Time range filter
        if (selectedTimeRange !== 'all') {
            const createdDate = new Date(contract.createdAt);
            const now = new Date();
            const diffTime = now.getTime() - createdDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);

            if (selectedTimeRange === '7days' && diffDays > 7) return false;
            if (selectedTimeRange === '30days' && diffDays > 30) return false;
            if (selectedTimeRange === '3months' && diffDays > 90) return false;
            if (selectedTimeRange === '1year' && diffDays > 365) return false;
        }

        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentContracts = filteredContracts.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreateContract = () => {
        // Navigate to create contract page
        navigate('/e-contracts/create-new-contract');
    };

    const handleViewContract = async (contractId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');

            if (!token) {
                navigate('/e-contract/login');
                return;
            }

            // Fetch document details to get file URL
            const response = await fetch(`${apiUrl}/contracts/documents`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contract details');
            }

            const data: ContractResponse = await response.json();
            const document = data.documents.find(doc => doc.id === contractId);

            if (document && document.fileUrl) {
                // Open contract file in new tab
                window.open(document.fileUrl, '_blank');
            } else {
                alert('Không tìm thấy file hợp đồng.');
            }
        } catch (error) {
            console.error('Error viewing contract:', error);
            alert('Không thể xem hợp đồng. Vui lòng thử lại sau.');
        }
    };

    const handleCancelContract = async (contractId: string) => {
        const confirmed = window.confirm('Bạn có chắc chắn muốn hủy hợp đồng này không?');

        if (!confirmed) {
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');

            if (!token) {
                navigate('/e-contract/login');
                return;
            }

            // Call API to cancel contract
            const response = await fetch(`${apiUrl}/contracts/documents/${contractId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to cancel contract');
            }

            alert('Hợp đồng đã được hủy thành công.');

            // Refresh contracts list
            window.location.reload();
        } catch (error) {
            console.error('Error canceling contract:', error);
            alert('Không thể hủy hợp đồng. Vui lòng thử lại sau.');
        }
    };

    const handleRenewContract = async (contractId: string) => {
        const confirmed = window.confirm('Bạn có muốn gia hạn hợp đồng này không?');

        if (!confirmed) {
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');

            if (!token) {
                navigate('/e-contract/login');
                return;
            }

            // Call API to renew contract
            const response = await fetch(`${apiUrl}/contracts/documents/${contractId}/renew`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to renew contract');
            }

            alert('Hợp đồng đã được gia hạn thành công.');

            // Refresh contracts list
            window.location.reload();
        } catch (error) {
            console.error('Error renewing contract:', error);
            alert('Không thể gia hạn hợp đồng. Vui lòng thử lại sau.');
        }
    };

    return (
        <div className="ec-contracts-container">
            <aside className={`ec-contracts-sidebar ${isMenuOpen ? 'ec-contracts-sidebar-open' : 'ec-contracts-sidebar-closed'}`}>
                <div className="ec-contracts-sidebar-header">
                    <div className="ec-contracts-sidebar-logo">
                        <div className="ec-contracts-logo-icon">E</div>
                        {isMenuOpen && <span className="ec-contracts-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="ec-contracts-sidebar-nav">
                    <ul className="ec-contracts-nav-list">
                        <li className="ec-contracts-nav-item">
                            <a href="/e-contracts/dashboard" className="ec-contracts-nav-link">
                                <svg className="ec-contracts-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="ec-contracts-nav-item ec-contracts-nav-active">
                            <a href="/e-contracts/list" className="ec-contracts-nav-link">
                                <svg className="ec-contracts-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                        <li className="ec-contracts-nav-item">
                            <a href="#" className="ec-contracts-nav-link">
                                <svg className="ec-contracts-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`ec-contracts-main-content ${isMenuOpen ? 'ec-contracts-content-expanded' : 'ec-contracts-content-collapsed'}`}>
                <header className="ec-contracts-nav-header">
                    <div className="ec-contracts-nav-left">
                        <button className="ec-contracts-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="ec-contracts-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="ec-contracts-nav-right">
                        <button className="ec-contracts-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="ec-contracts-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="ec-contracts-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="ec-contracts-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="ec-contracts-user-info">
                                <span className="ec-contracts-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="ec-contracts-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="ec-contracts-profile-dropdown">
                                    <div
                                        className={`ec-contracts-dropdown-item ec-contracts-logout-item ${isLoggingOut ? 'ec-contracts-disabled' : ''}`}
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
                                        <svg className="ec-contracts-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="ec-contracts-main">
                    <div className="ec-contracts-page-header">
                        <h1 className="ec-contracts-page-title">Quản lý hợp đồng</h1>
                        <button className="ec-contracts-create-btn" onClick={handleCreateContract}>
                            Tạo hợp đồng mới
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="ec-contracts-filters-section">
                        <div className="ec-contracts-search-box">
                            <svg className="ec-contracts-search-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input
                                type="text"
                                className="ec-contracts-search-input"
                                placeholder="Tìm kiếm theo tên hoặc mã hợp đồng..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="ec-contracts-filter-group">
                            <select
                                className="ec-contracts-filter-select"
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                {contractTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                            <select
                                className="ec-contracts-filter-select"
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                {contractStatuses.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>

                            <select
                                className="ec-contracts-filter-select"
                                value={selectedTimeRange}
                                onChange={(e) => {
                                    setSelectedTimeRange(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                {timeRanges.map(range => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="ec-contracts-loading">
                            <div className="ec-contracts-loading-text">Đang tải danh sách hợp đồng...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="ec-contracts-error">
                            <div className="ec-contracts-error-text">{error}</div>
                            <button
                                className="ec-contracts-retry-btn"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Results Info */}
                    {!isLoading && !error && (
                        <div className="ec-contracts-results-info">
                            Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredContracts.length)} trong tổng số {filteredContracts.length} hợp đồng
                        </div>
                    )}

                    {/* Contract List */}
                    {!isLoading && !error && (
                        <div className="ec-contracts-list">
                            {currentContracts.length === 0 ? (
                                <div className="ec-contracts-empty">
                                    <div className="ec-contracts-empty-text">Không tìm thấy hợp đồng nào.</div>
                                </div>
                            ) : (
                                currentContracts.map(contract => (
                            <div key={contract.id} className="ec-contracts-item">
                                <div className="ec-contracts-item-header">
                                    <div></div>
                                    <div className={`ec-contracts-item-status ec-contracts-status-${contract.status}`}>
                                        {getStatusLabel(contract.status)}
                                    </div>
                                </div>
                                <div className="ec-contracts-item-name">{contract.name}</div>
                                <div className="ec-contracts-item-details">
                                    <div className="ec-contracts-item-detail">
                                        <span className="ec-contracts-detail-label">Loại:</span>
                                        <span className="ec-contracts-detail-value">{getTypeLabel(contract.type)}</span>
                                    </div>
                                    <div className="ec-contracts-item-detail">
                                        <span className="ec-contracts-detail-label">Ngày lập:</span>
                                        <span className="ec-contracts-detail-value">{new Date(contract.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="ec-contracts-item-detail">
                                        <span className="ec-contracts-detail-label">Hết hạn:</span>
                                        <span className="ec-contracts-detail-value">{new Date(contract.expiresAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                                <div className="ec-contracts-item-actions">
                                    <button
                                        className="ec-contracts-action-btn ec-contracts-btn-view"
                                        onClick={() => handleViewContract(contract.id)}
                                    >
                                        Xem chi tiết
                                    </button>
                                    {contract.status === 'expired' && (
                                        <button
                                            className="ec-contracts-action-btn ec-contracts-btn-renew"
                                            onClick={() => handleRenewContract(contract.id)}
                                        >
                                            Gia hạn
                                        </button>
                                    )}
                                    {(contract.status === 'active' || contract.status === 'pending') && (
                                        <button
                                            className="ec-contracts-action-btn ec-contracts-btn-cancel"
                                            onClick={() => handleCancelContract(contract.id)}
                                        >
                                            Hủy bỏ
                                        </button>
                                    )}
                                </div>
                            </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && !error && totalPages > 1 && (
                        <div className="ec-contracts-pagination">
                            <button
                                className="ec-contracts-page-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Trước
                            </button>
                            <div className="ec-contracts-page-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`ec-contracts-page-number ${page === currentPage ? 'ec-contracts-page-active' : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="ec-contracts-page-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {showLogoutModal && (
                <div className="ec-contracts-modal-overlay" onClick={cancelLogout}>
                    <div className="ec-contracts-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ec-contracts-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="ec-contracts-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="ec-contracts-modal-footer">
                            <button className="ec-contracts-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="ec-contracts-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EContractList;
