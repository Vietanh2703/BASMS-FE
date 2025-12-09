import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
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

interface Contract {
    id: string;
    customerId: string;
    documentId: string;
    contractNumber: string;
    contractTitle: string;
    contractType: string;
    serviceScope: string;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
}

interface ContractsResponse {
    success: boolean;
    errorMessage: string | null;
    customerId: string;
    customerCode: string;
    customerName: string;
    totalContracts: number;
    contracts: Contract[];
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
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // API data states
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Contracts states
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
    const [customerContracts, setCustomerContracts] = useState<Map<string, ContractsResponse>>(new Map());
    const [loadingContracts, setLoadingContracts] = useState<Set<string>>(new Set());

    // Create customer modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
    const [showFailureSnackbar, setShowFailureSnackbar] = useState(false);
    const [failureMessage, setFailureMessage] = useState('');

    // Account activation/lock states
    const [activatingCustomers, setActivatingCustomers] = useState<Set<string>>(new Set());
    const [lockingCustomers, setLockingCustomers] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({
        IdentityNumber: '',
        IdentityIssueDate: '',
        IdentityIssuePlace: '',
        Email: '',
        Password: '',
        FullName: '',
        Phone: '',
        Gender: 'Nam',
        Address: '',
        BirthDay: '',
        BirthMonth: '',
        BirthYear: '',
        AvatarUrl: '',
        RoleId: 'ddbd630a-ba6e-11f0-bcac-00155dca8f48',
        AuthProvider: 'email'
    });

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
            'in-active': 'Chưa hoạt động',
            assigning_manager: 'Phân công quản lý',
            schedule_shifts: 'Phân công ca trực',
            Cancelled: 'Đã hủy',
            Expired: 'Hết hạn',
        };
        return statusMap[status] || status;
    };

    const getContractStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'draft': 'Chưa phân công',
            'schedule_shifts': 'Đang xếp ca trực',
            'shift_generated': 'Đã xếp ca trực',
        };
        return statusMap[status] || status;
    };

    const getContractStatusColor = (status: string) => {
        const colorMap: { [key: string]: string } = {
            'draft': '#6b7280', // gray
            'schedule_shifts': '#f59e0b', // amber
            'shift_generated': '#10b981', // green
        };
        return colorMap[status] || '#6b7280';
    };

    // Filter and sort customers
    const filteredAndSortedCustomers = allCustomers
        .filter(customer => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = (
                    customer.companyName.toLowerCase().includes(searchLower) ||
                    customer.contactPersonName.toLowerCase().includes(searchLower) ||
                    customer.customerCode.toLowerCase().includes(searchLower) ||
                    customer.email.toLowerCase().includes(searchLower) ||
                    customer.phone.includes(searchTerm)
                );
                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && customer.status !== statusFilter) {
                return false;
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
    const handleViewContract = (customerId: string, contractId: string) => {
        navigate(`/director/customer/${customerId}/${contractId}`);
    };

    const handleViewSchedule = (customerId: string) => {
        navigate(`/director/customer/${customerId}/view-shift-schedule`);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const fetchCustomerContracts = async (customerId: string) => {
        // If already loading, return
        if (loadingContracts.has(customerId)) {
            return;
        }

        // If already fetched, just toggle expand
        if (customerContracts.has(customerId)) {
            return;
        }

        setLoadingContracts(prev => new Set(prev).add(customerId));

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return;
            }

            const response = await fetch(`${apiUrl}/contracts/customers/${customerId}/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contracts');
            }

            const data: ContractsResponse = await response.json();

            setCustomerContracts(prev => {
                const newMap = new Map(prev);
                newMap.set(customerId, data);
                return newMap;
            });
        } catch (err) {
            console.error('Error fetching contracts:', err);
        } finally {
            setLoadingContracts(prev => {
                const newSet = new Set(prev);
                newSet.delete(customerId);
                return newSet;
            });
        }
    };

    const toggleCustomerContracts = async (customerId: string) => {
        const isExpanded = expandedCustomers.has(customerId);

        if (isExpanded) {
            // Collapse
            setExpandedCustomers(prev => {
                const newSet = new Set(prev);
                newSet.delete(customerId);
                return newSet;
            });
        } else {
            // Expand
            setExpandedCustomers(prev => new Set(prev).add(customerId));

            // Fetch contracts if not already fetched
            if (!customerContracts.has(customerId)) {
                await fetchCustomerContracts(customerId);
            }
        }
    };

    const handleCreateCustomer = () => {
        setShowCreateModal(true);
        setCreateError(null);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setCreateError(null);
        setFormData({
            IdentityNumber: '',
            IdentityIssueDate: '',
            IdentityIssuePlace: '',
            Email: '',
            Password: '',
            FullName: '',
            Phone: '',
            Gender: 'Nam',
            Address: '',
            BirthDay: '',
            BirthMonth: '',
            BirthYear: '',
            AvatarUrl: '',
            RoleId: 'ddbd630a-ba6e-11f0-bcac-00155dca8f48',
            AuthProvider: 'email'
        });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const generateRandomPassword = () => {
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        const specialChars = '!@#$%^&*';

        // Ensure at least 1 uppercase, 1 number, 1 special character
        let password = '';
        password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
        password += numberChars[Math.floor(Math.random() * numberChars.length)];
        password += specialChars[Math.floor(Math.random() * specialChars.length)];

        // Fill remaining 5 characters with random mix
        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
        for (let i = 0; i < 5; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password to randomize position of required characters
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        setFormData(prev => ({
            ...prev,
            Password: password
        }));
    };

    const handleSubmitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            }

            // Process phone number: replace leading 0 with +84
            let processedPhone = formData.Phone.trim();
            if (processedPhone.startsWith('0')) {
                processedPhone = '+84' + processedPhone.substring(1);
            }

            // Convert BirthDay, BirthMonth, BirthYear to numbers
            const requestData = {
                ...formData,
                Phone: processedPhone,
                BirthDay: parseInt(formData.BirthDay),
                BirthMonth: parseInt(formData.BirthMonth),
                BirthYear: parseInt(formData.BirthYear)
            };

            const response = await fetch(`${apiUrl}/users/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.errorMessage || 'Không thể tạo khách hàng');
            }

            // Success - close modal, show success message, and refresh list
            handleCloseModal();
            setShowSuccessSnackbar(true);

            // Reload page after showing success message
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            setCreateError(err.message || 'Có lỗi xảy ra khi tạo khách hàng. Vui lòng thử lại.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleActivateCustomer = async (customer: Customer) => {
        if (activatingCustomers.has(customer.id)) return;

        setActivatingCustomers(prev => new Set(prev).add(customer.id));

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            }

            // Step 1: Activate customer
            const activateResponse = await fetch(`${apiUrl}/contracts/customers/${customer.id}/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!activateResponse.ok) {
                const errorText = await activateResponse.text();
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || 'Không thể kích hoạt tài khoản');
                } catch (parseError) {
                    if (parseError instanceof Error && parseError.message.includes('Không thể')) {
                        throw parseError;
                    }
                    throw new Error('Không thể kích hoạt tài khoản');
                }
            }

            // Step 2: Send login email
            const emailResponse = await fetch(`${apiUrl}/users/send-login-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: customer.email,
                    phoneNumber: customer.phone
                }),
            });

            if (!emailResponse.ok) {
                // Email sending failed, but activation succeeded
                setFailureMessage('Tài khoản đã được kích hoạt nhưng không thể gửi email thông báo');
                setShowFailureSnackbar(true);
            } else {
                // Both succeeded
                setShowSuccessSnackbar(true);
            }

            // Reload page after showing message
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            setFailureMessage(err.message || 'Có lỗi xảy ra khi kích hoạt tài khoản');
            setShowFailureSnackbar(true);
        } finally {
            setActivatingCustomers(prev => {
                const newSet = new Set(prev);
                newSet.delete(customer.id);
                return newSet;
            });
        }
    };

    const handleLockCustomer = async (customer: Customer) => {
        if (lockingCustomers.has(customer.id)) return;

        setLockingCustomers(prev => new Set(prev).add(customer.id));

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            }

            // Lock customer account
            const lockResponse = await fetch(`${apiUrl}/contracts/customers/${customer.id}/lock`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!lockResponse.ok) {
                const errorText = await lockResponse.text();
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || 'Không thể khóa tài khoản');
                } catch (parseError) {
                    if (parseError instanceof Error && parseError.message.includes('Không thể')) {
                        throw parseError;
                    }
                    throw new Error('Không thể khóa tài khoản');
                }
            }

            setShowSuccessSnackbar(true);

            // Reload page after showing success message
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            setFailureMessage(err.message || 'Có lỗi xảy ra khi khóa tài khoản');
            setShowFailureSnackbar(true);
        } finally {
            setLockingCustomers(prev => {
                const newSet = new Set(prev);
                newSet.delete(customer.id);
                return newSet;
            });
        }
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
                        <div className="dir-customers-header-actions">
                            <button className="dir-customers-create-btn" onClick={handleCreateCustomer} title="Tạo khách hàng mới">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                <span>Tạo mới</span>
                            </button>
                            <button className="dir-customers-refresh-btn" onClick={handleRefresh} title="Làm mới danh sách">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                </svg>
                            </button>
                        </div>
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

                        <div className="dir-customers-status-filter">
                            <select
                                className="dir-customers-sort-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                                <option value="in-active">Chưa hoạt động</option>
                                <option value="assigning_manager">Phân công quản lý</option>
                                <option value="schedule_shifts">Phân công ca trực</option>
                                <option value="Cancelled">Đã hủy</option>
                                <option value="Expired">Hết hạn</option>
                            </select>
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

                                        {/* Action buttons based on customer status */}
                                        <div className="dir-customers-item-actions">
                                            {customer.status === 'in-active' && (
                                                <button
                                                    className="dir-customers-action-btn dir-customers-btn-activate"
                                                    onClick={() => handleActivateCustomer(customer)}
                                                    disabled={activatingCustomers.has(customer.id)}
                                                >
                                                    {activatingCustomers.has(customer.id) ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
                                                </button>
                                            )}

                                            {customer.status === 'active' && (
                                                <>
                                                    <button
                                                        className="dir-customers-action-btn dir-customers-btn-schedule"
                                                        onClick={() => handleViewSchedule(customer.id)}
                                                    >
                                                        Xem ca trực
                                                    </button>
                                                    <button
                                                        className="dir-customers-action-btn dir-customers-btn-lock"
                                                        onClick={() => handleLockCustomer(customer)}
                                                        disabled={lockingCustomers.has(customer.id)}
                                                    >
                                                        {lockingCustomers.has(customer.id) ? 'Đang khóa...' : 'Khóa tài khoản'}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Total Contracts Toggle */}
                                        <div className="dir-customers-contracts-toggle">
                                            <button
                                                className="dir-customers-toggle-btn"
                                                onClick={() => toggleCustomerContracts(customer.id)}
                                                disabled={loadingContracts.has(customer.id)}
                                            >
                                                <span className="dir-customers-toggle-text">
                                                    {loadingContracts.has(customer.id) ? 'Đang tải...' :
                                                     customerContracts.has(customer.id) ?
                                                     `${customerContracts.get(customer.id)?.totalContracts || 0} Hợp đồng` :
                                                     'Xem hợp đồng'}
                                                </span>
                                                <svg
                                                    className={`dir-customers-toggle-icon ${expandedCustomers.has(customer.id) ? 'dir-customers-toggle-icon-expanded' : ''}`}
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M7 10l5 5 5-5z"/>
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Contracts List */}
                                        {expandedCustomers.has(customer.id) && customerContracts.has(customer.id) && (
                                            <div className="dir-customers-contracts-list">
                                                {customerContracts.get(customer.id)!.contracts.length === 0 ? (
                                                    <div className="dir-customers-contracts-empty">
                                                        Không có hợp đồng nào
                                                    </div>
                                                ) : (
                                                    customerContracts.get(customer.id)!.contracts.map(contract => (
                                                        <div key={contract.id} className="dir-customers-contract-item">
                                                            <div className="dir-customers-contract-content">
                                                                <div className="dir-customers-contract-main">
                                                                    <div className="dir-customers-contract-title">
                                                                        {contract.contractTitle}
                                                                    </div>
                                                                    <div className="dir-customers-contract-subtitle">
                                                                        {contract.contractNumber}
                                                                    </div>
                                                                </div>
                                                                <div className="dir-customers-contract-dates">
                                                                    <div className="dir-customers-contract-date">
                                                                        <span className="dir-customers-contract-date-label">Bắt đầu:</span>
                                                                        <span className="dir-customers-contract-date-value">{formatDate(contract.startDate)}</span>
                                                                    </div>
                                                                    <div className="dir-customers-contract-date">
                                                                        <span className="dir-customers-contract-date-label">Kết thúc:</span>
                                                                        <span className="dir-customers-contract-date-value">{formatDate(contract.endDate)}</span>
                                                                        <span
                                                                            className="dir-customers-contract-status"
                                                                            style={{
                                                                                color: getContractStatusColor(contract.status),
                                                                                marginLeft: '12px',
                                                                                fontWeight: '500',
                                                                                fontSize: '14px'
                                                                            }}
                                                                        >
                                                                            {getContractStatusLabel(contract.status)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="dir-customers-contract-action">
                                                                <button
                                                                    className="dir-customers-action-btn dir-customers-btn-view"
                                                                    onClick={() => handleViewContract(customer.id, contract.id)}
                                                                >
                                                                    {contract.status === 'draft' ? 'Xem chi tiết & phân công' : 'Xem chi tiết'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
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

            {showCreateModal && (
                <div className="custlist-create-modal-overlay" onClick={handleCloseModal}>
                    <div className="custlist-create-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="custlist-create-modal-header">
                            <h2 className="custlist-create-modal-title">Tạo khách hàng mới</h2>
                        </div>

                        {createError && (
                            <div className="custlist-form-error">
                                <div className="custlist-form-error-text">{createError}</div>
                            </div>
                        )}

                        <form className="custlist-create-form" onSubmit={handleSubmitCreate}>
                            {/* Column 1: Avatar, Email, Password */}
                            <div className="custlist-form-column-left">
                                <div className="custlist-avatar-preview-container">
                                    <div className="custlist-avatar-preview">
                                        {formData.AvatarUrl ? (
                                            <img src={formData.AvatarUrl} alt="Avatar" />
                                        ) : (
                                            <span className="custlist-avatar-placeholder">?</span>
                                        )}
                                    </div>
                                    <div className="custlist-form-group">
                                        <label className="custlist-form-label">URL Avatar</label>
                                        <input
                                            type="text"
                                            name="AvatarUrl"
                                            className="custlist-form-input"
                                            placeholder="https://..."
                                            value={formData.AvatarUrl}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Email *</label>
                                    <input
                                        type="email"
                                        name="Email"
                                        className="custlist-form-input"
                                        value={formData.Email}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Mật khẩu *</label>
                                    <div className="custlist-password-input-wrapper">
                                        <input
                                            type="password"
                                            name="Password"
                                            className="custlist-form-input"
                                            value={formData.Password}
                                            onChange={handleFormChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="custlist-generate-password-btn"
                                            onClick={generateRandomPassword}
                                            title="Tạo mật khẩu ngẫu nhiên"
                                        >
                                            Tạo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: All other fields */}
                            <div className="custlist-form-column-right">
                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Họ và tên *</label>
                                    <input
                                        type="text"
                                        name="FullName"
                                        className="custlist-form-input"
                                        value={formData.FullName}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        name="Phone"
                                        className="custlist-form-input"
                                        value={formData.Phone}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Giới tính *</label>
                                    <select
                                        name="Gender"
                                        className="custlist-form-select"
                                        value={formData.Gender}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Ngày sinh *</label>
                                    <div className="custlist-form-row">
                                        <input
                                            type="number"
                                            name="BirthDay"
                                            className="custlist-form-input"
                                            placeholder="Ngày"
                                            min="1"
                                            max="31"
                                            value={formData.BirthDay}
                                            onChange={handleFormChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="BirthMonth"
                                            className="custlist-form-input"
                                            placeholder="Tháng"
                                            min="1"
                                            max="12"
                                            value={formData.BirthMonth}
                                            onChange={handleFormChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="BirthYear"
                                            className="custlist-form-input"
                                            placeholder="Năm"
                                            min="1900"
                                            max="2100"
                                            value={formData.BirthYear}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Số CMND/CCCD *</label>
                                    <input
                                        type="text"
                                        name="IdentityNumber"
                                        className="custlist-form-input"
                                        value={formData.IdentityNumber}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Ngày cấp *</label>
                                    <input
                                        type="date"
                                        name="IdentityIssueDate"
                                        className="custlist-form-input"
                                        value={formData.IdentityIssueDate}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Nơi cấp *</label>
                                    <input
                                        type="text"
                                        name="IdentityIssuePlace"
                                        className="custlist-form-input"
                                        value={formData.IdentityIssuePlace}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className="custlist-form-group">
                                    <label className="custlist-form-label">Địa chỉ *</label>
                                    <input
                                        type="text"
                                        name="Address"
                                        className="custlist-form-input"
                                        value={formData.Address}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="custlist-form-actions">
                                <button
                                    type="button"
                                    className="custlist-btn-cancel"
                                    onClick={handleCloseModal}
                                    disabled={isCreating}
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    className="custlist-btn-submit"
                                    disabled={isCreating}
                                >
                                    {isCreating ? 'Đang tạo...' : 'Xác nhận'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

            <SnackbarChecked
                message="Đã tạo thông tin khách hàng mới thành công"
                isOpen={showSuccessSnackbar}
                duration={2000}
                onClose={() => setShowSuccessSnackbar(false)}
            />

            <SnackbarFailed
                message={failureMessage}
                isOpen={showFailureSnackbar}
                duration={4000}
                onClose={() => setShowFailureSnackbar(false)}
            />
        </div>
    );
};

export default CustomerList;
