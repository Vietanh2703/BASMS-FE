import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './CustomerList.css';

interface Customer {
    id: string;
    customerCode: string;
    companyName: string;
    contactPersonName: string;
    contactPersonTitle: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    gender: string;
    dateOfBirth: string;
    address: string;
    city: string | null;
    district: string | null;
    industry: string | null;
    companySize: string | null;
    status: string;
    customerSince: string;
    followsNationalHolidays: boolean;
    createdAt: string;
}

interface CustomerResponse {
    success: boolean;
    errorMessage: string | null;
    customers: Customer[];
    totalCount: number;
}

const CustomerList = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Search and sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'companyName' | 'customerSince'>('companyName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // API data states
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sortOptions = [
        { value: 'companyName', label: 'Tên công ty (A-Z)' },
        { value: 'customerSince', label: 'Ngày trở thành khách hàng' },
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

    // Fetch customers from API
    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken'); // Changed from eContractAccessToken

                if (!token) {
                    console.error('No access token found');
                    setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/customers`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch customers');
                }

                const data: CustomerResponse = await response.json();

                setAllCustomers(data.customers);
            } catch (err) {
                console.error('Error fetching customers:', err);
                setError('Không thể tải danh sách khách hàng. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomers();
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

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            active: 'Đang hoạt động',
            inactive: 'Không hoạt động',
            assigning_manager: 'Phân công quản lý',
            schedule_shifts: 'Phân công ca trực',
            Cancelled: 'Đã hủy',
            Expired: 'Hết hạn',
        };
        return statusMap[status] || status;
    };

    // Filter and sort customers
    const filteredAndSortedCustomers = allCustomers
        .filter(customer => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    customer.companyName.toLowerCase().includes(searchLower) ||
                    customer.contactPersonName.toLowerCase().includes(searchLower) ||
                    customer.customerCode.toLowerCase().includes(searchLower) ||
                    customer.email.toLowerCase().includes(searchLower) ||
                    customer.phone.includes(searchTerm)
                );
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'companyName') {
                const comparison = a.companyName.localeCompare(b.companyName, 'vi');
                return sortOrder === 'asc' ? comparison : -comparison;
            } else if (sortBy === 'customerSince') {
                const dateA = new Date(a.customerSince).getTime();
                const dateB = new Date(b.customerSince).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
            return 0;
        });

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCustomers = filteredAndSortedCustomers.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewCustomer = (customerId: string) => {
        navigate(`/director/customer/${customerId}`);
    };

    const handleViewSchedule = (customerId: string) => {
        navigate(`/director/customer/${customerId}/view-shift-schedule`);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="dir-customers-container">
            <aside className={`dir-customers-sidebar ${isMenuOpen ? 'dir-customers-sidebar-open' : 'dir-customers-sidebar-closed'}`}>
                <div className="dir-customers-sidebar-header">
                    <div className="dir-customers-sidebar-logo">
                        <div className="dir-customers-logo-icon">D</div>
                        {isMenuOpen && <span className="dir-customers-logo-text">Director</span>}
                    </div>
                </div>

                <nav className="dir-customers-sidebar-nav">
                    <ul className="dir-customers-nav-list">
                        <li className="dir-customers-nav-item">
                            <Link to="/director/dashboard" className="dir-customers-nav-link">
                                <svg className="dir-customers-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="dir-customers-nav-item dir-customers-nav-active">
                            <Link to="/director/customer-list" className="dir-customers-nav-link">
                                <svg className="dir-customers-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="dir-customers-nav-item">
                            <Link to="/director/employee-control" className="dir-customers-nav-link">
                                <svg className="dir-customers-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="dir-customers-nav-item">
                            <Link to="/director/analytics" className="dir-customers-nav-link">
                                <svg className="dir-customers-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="dir-customers-nav-item">
                            <Link to="/director/reports" className="dir-customers-nav-link">
                                <svg className="dir-customers-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`dir-customers-main-content ${isMenuOpen ? 'dir-customers-content-expanded' : 'dir-customers-content-collapsed'}`}>
                <header className="dir-customers-nav-header">
                    <div className="dir-customers-nav-left">
                        <button className="dir-customers-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="dir-customers-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="dir-customers-nav-right">
                        <button className="dir-customers-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="dir-customers-notification-badge">0</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="dir-customers-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="dir-customers-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="dir-customers-user-info">
                                <span className="dir-customers-user-name">{user?.fullName || 'Director'}</span>
                                <span className="dir-customers-user-role">Giám đốc điều hành</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="dir-customers-profile-dropdown">
                                    <div
                                        className={`dir-customers-dropdown-item dir-customers-logout-item ${isLoggingOut ? 'dir-customers-disabled' : ''}`}
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
                                        <svg className="dir-customers-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="dir-customers-main">
                    <div className="dir-customers-page-header">
                        <h1 className="dir-customers-page-title">Quản lý khách hàng</h1>
                        <button className="dir-customers-refresh-btn" onClick={handleRefresh} title="Làm mới danh sách">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Search and Sort */}
                    <div className="dir-customers-filters-section">
                        <div className="dir-customers-search-box">
                            <svg className="dir-customers-search-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input
                                type="text"
                                className="dir-customers-search-input"
                                placeholder="Tìm kiếm theo tên công ty, người liên hệ, mã khách hàng..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="dir-customers-sort-group">
                            <select
                                className="dir-customers-sort-select"
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value as 'companyName' | 'customerSince');
                                    setCurrentPage(1);
                                }}
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>

                            <button
                                className="dir-customers-sort-order-btn"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                title={sortOrder === 'asc' ? 'Sắp xếp tăng dần' : 'Sắp xếp giảm dần'}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    {sortOrder === 'asc' ? (
                                        <path d="M7 14l5-5 5 5z"/>
                                    ) : (
                                        <path d="M7 10l5 5 5-5z"/>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="dir-customers-loading">
                            <div className="dir-customers-loading-text">Đang tải danh sách khách hàng...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="dir-customers-error">
                            <div className="dir-customers-error-text">{error}</div>
                            <button
                                className="dir-customers-retry-btn"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Results Info */}
                    {!isLoading && !error && (
                        <div className="dir-customers-results-info">
                            Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredAndSortedCustomers.length)} trong tổng số {filteredAndSortedCustomers.length} khách hàng
                        </div>
                    )}

                    {/* Customer List */}
                    {!isLoading && !error && (
                        <div className="dir-customers-list">
                            {currentCustomers.length === 0 ? (
                                <div className="dir-customers-empty">
                                    <div className="dir-customers-empty-text">Không tìm thấy khách hàng nào.</div>
                                </div>
                            ) : (
                                currentCustomers.map(customer => (
                                    <div key={customer.id} className="dir-customers-item">
                                        <div className="dir-customers-item-header">
                                            <div className="dir-customers-item-main-info">
                                                <div className="dir-customers-item-company-name">{customer.companyName}</div>
                                                <div className="dir-customers-item-contact-name">{customer.contactPersonName}</div>
                                                <div className="dir-customers-item-code">
                                                    <span className="dir-customers-code-label">Mã KH:</span>
                                                    <span className="dir-customers-code-value">{customer.customerCode}</span>
                                                </div>
                                            </div>
                                            <div className={`dir-customers-item-status dir-customers-status-${customer.status}`}>
                                                {getStatusLabel(customer.status)}
                                            </div>
                                        </div>
                                        <div className="dir-customers-item-details">
                                            <div className="dir-customers-item-detail">
                                                <span className="dir-customers-detail-label">Chức vụ:</span>
                                                <span className="dir-customers-detail-value">{customer.contactPersonTitle}</span>
                                            </div>
                                            <div className="dir-customers-item-detail">
                                                <span className="dir-customers-detail-label">Email:</span>
                                                <span className="dir-customers-detail-value">{customer.email}</span>
                                            </div>
                                            <div className="dir-customers-item-detail">
                                                <span className="dir-customers-detail-label">Điện thoại:</span>
                                                <span className="dir-customers-detail-value">{customer.phone}</span>
                                            </div>
                                            <div className="dir-customers-item-detail">
                                                <span className="dir-customers-detail-label">Địa chỉ:</span>
                                                <span className="dir-customers-detail-value">{customer.address}</span>
                                            </div>
                                            <div className="dir-customers-item-detail">
                                                <span className="dir-customers-detail-label">Khách hàng từ:</span>
                                                <span className="dir-customers-detail-value">{formatDate(customer.customerSince)}</span>
                                            </div>
                                        </div>
                                        <div className="dir-customers-item-actions">
                                            {customer.status === 'active' && (
                                                <button
                                                    className="dir-customers-action-btn dir-customers-btn-schedule"
                                                    onClick={() => handleViewSchedule(customer.id)}
                                                >
                                                    Xem ca trực
                                                </button>
                                            )}
                                            <button
                                                className="dir-customers-action-btn dir-customers-btn-view"
                                                onClick={() => handleViewCustomer(customer.id)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && !error && totalPages > 1 && (
                        <div className="dir-customers-pagination">
                            <button
                                className="dir-customers-page-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Trước
                            </button>
                            <div className="dir-customers-page-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`dir-customers-page-number ${page === currentPage ? 'dir-customers-page-active' : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="dir-customers-page-btn"
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
                <div className="dir-customers-modal-overlay" onClick={cancelLogout}>
                    <div className="dir-customers-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dir-customers-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="dir-customers-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="dir-customers-modal-footer">
                            <button className="dir-customers-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="dir-customers-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerList;
