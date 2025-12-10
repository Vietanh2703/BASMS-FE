import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useEContractAuth } from '../../hooks/useEContractAuth';
import './eContractDashboard.css';

interface Document {
    id: string;
    documentType: string;
    documentName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string | null;
    version: string;
    documentDate: string | null;
    uploadedBy: string;
    createdAt: string;
    fileSizeFormatted: string;
    downloadUrl: string;
    category?: string;
    startDate?: string;
    endDate?: string;
}

interface ContractResponse {
    success: boolean;
    errorMessage: string | null;
    documents: Document[];
    totalCount: number;
}

interface ContractStats {
    total: number;
    completed: number;
    unsigned: number;
    expiredOrCanceled: number;
}

interface Contract {
    id: string;
    contractNumber: string;
    contractType: string;
    status: string;
    documentId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    category: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    expiryStatus: string;
    createdAt: string;
    updatedAt: string;
}

interface ContractsResponse {
    success: boolean;
    contracts: Contract[];
    totalCount: number;
    errorMessage: string | null;
}

const EContractDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user} = useEContractAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [contractStats, setContractStats] = useState<ContractStats>({
        total: 0,
        completed: 0,
        unsigned: 0,
        expiredOrCanceled: 0,
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [chartFilter, setChartFilter] = useState<'7days' | '1month' | '1year'>('7days');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoadingContracts, setIsLoadingContracts] = useState(true);

    // Calendar state
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // User info is now loaded from context via useEContractAuth

        // Prevent back navigation
        window.history.pushState(null, '', location.pathname);

        const handlePopState = () => {
            window.history.pushState(null, '', location.pathname);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [location.pathname]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Close dropdown when clicking outside
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
            // Clear eContract session
            localStorage.removeItem('eContractAccessToken');
            localStorage.removeItem('eContractRefreshToken');
            localStorage.removeItem('eContractAccessTokenExpiry');
            localStorage.removeItem('eContractRefreshTokenExpiry');
            localStorage.removeItem('eContractUserId');
            localStorage.removeItem('eContractEmail');
            localStorage.removeItem('eContractFullName');
            localStorage.removeItem('eContractRoleId');

            // Redirect to eContract login
            navigate('/e-contract-login', { replace: true });
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

    // Fetch contract statistics from API
    const fetchContractStats = async () => {
        setIsLoadingStats(true);
        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');

            const response = await fetch(`${apiUrl}/contracts/documents`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contract data');
            }

            const data: ContractResponse = await response.json();

            if (data.success) {
                // Save documents for chart processing
                setDocuments(data.documents);

                // Filter out templates
                const nonTemplateDocuments = data.documents.filter(doc => doc.documentType !== 'template');

                // Count documents by type
                const completed = data.documents.filter(doc =>
                    doc.documentType === 'signed_document' || doc.documentType === 'approved_document'
                ).length;
                const unsigned = data.documents.filter(doc => doc.documentType === 'filled_document').length;
                const expiredOrCanceled = data.documents.filter(doc =>
                    doc.documentType === 'canceled' || doc.documentType === 'expired_document'
                ).length;

                setContractStats({
                    total: nonTemplateDocuments.length,
                    completed,
                    unsigned,
                    expiredOrCanceled,
                });
            }
        } catch (error) {
            console.error('Error fetching contract stats:', error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    // Fetch contracts from API
    const fetchContracts = async () => {
        setIsLoadingContracts(true);
        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');

            const response = await fetch(`${apiUrl}/contracts/get-all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contracts');
            }

            const data: ContractsResponse = await response.json();

            if (data.success) {
                setContracts(data.contracts);
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setIsLoadingContracts(false);
        }
    };

    // Fetch contract stats on component mount
    useEffect(() => {
        fetchContractStats();
        fetchContracts();
    }, []);

    // Process documents into chart data based on filter
    const processChartData = (filter: '7days' | '1month' | '1year') => {
        if (documents.length === 0) return [];

        // Filter out templates
        const nonTemplateDocuments = documents.filter(doc => doc.documentType !== 'template');

        const now = new Date();
        const chartData: { date: string; created: number; signed: number; rejected: number }[] = [];

        if (filter === '7days') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

                const dayDocs = nonTemplateDocuments.filter(doc => {
                    const docDate = new Date(doc.createdAt);
                    return docDate.toDateString() === date.toDateString();
                });

                chartData.push({
                    date: dateStr,
                    created: dayDocs.length,
                    signed: dayDocs.filter(d => d.documentType === 'signed_document' || d.documentType === 'approved_document').length,
                    rejected: dayDocs.filter(d => d.documentType === 'expired_document' || d.documentType === 'canceled').length,
                });
            }
        } else if (filter === '1month') {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - (i * 7) - 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                const weekDocs = nonTemplateDocuments.filter(doc => {
                    const docDate = new Date(doc.createdAt);
                    return docDate >= weekStart && docDate <= weekEnd;
                });

                chartData.push({
                    date: `Tuần ${4 - i}`,
                    created: weekDocs.length,
                    signed: weekDocs.filter(d => d.documentType === 'signed_document' || d.documentType === 'approved_document').length,
                    rejected: weekDocs.filter(d => d.documentType === 'expired_document' || d.documentType === 'canceled').length,
                });
            }
        } else if (filter === '1year') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const month = new Date(now);
                month.setMonth(month.getMonth() - i);
                const monthStr = `T${month.getMonth() + 1}`;

                const monthDocs = nonTemplateDocuments.filter(doc => {
                    const docDate = new Date(doc.createdAt);
                    return docDate.getMonth() === month.getMonth() &&
                           docDate.getFullYear() === month.getFullYear();
                });

                chartData.push({
                    date: monthStr,
                    created: monthDocs.length,
                    signed: monthDocs.filter(d => d.documentType === 'signed_document' || d.documentType === 'approved_document').length,
                    rejected: monthDocs.filter(d => d.documentType === 'expired_document' || d.documentType === 'canceled').length,
                });
            }
        }

        return chartData;
    };

    // Get chart data based on selected filter
    const chartData = processChartData(chartFilter);

    // Get category label
    const getCategoryLabel = (category?: string) => {
        const categoryMap: { [key: string]: string } = {
            'manager_labor_contract': 'HĐ lao động quản lý',
            'guard_labor_contract': 'HĐ lao động bảo vệ',
            'guard_service_contract': 'HĐ dịch vụ bảo vệ',
        };
        return category ? categoryMap[category] || category : 'Khác';
    };

    // Get contract category label for contracts
    const getContractCategoryLabel = (category: string) => {
        const categoryMap: { [key: string]: string } = {
            'guard_service_contract': 'Hợp đồng dịch vụ bảo vệ',
            'guard_labor_contract': 'Hợp đồng lao động bảo vệ',
            'manager_service_contract': 'Hợp đồng lao động quản lý',
        };
        return categoryMap[category] || category;
    };

    // Get expiry status label
    const getExpiryStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'active': 'Đang hoạt động',
            'near_expired': 'Gần hết hạn',
            'expired': 'Hết hạn',
        };
        return statusMap[status] || status;
    };

    // Process contracts by category for bar chart (last 12 months)
    const processContractsByCategory = () => {
        if (documents.length === 0) return [];

        const nonTemplateDocuments = documents.filter(doc => doc.documentType !== 'template');
        const now = new Date();
        const monthlyData: { [key: string]: any } = {};

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const month = new Date(now);
            month.setMonth(month.getMonth() - i);
            const monthKey = `${month.getFullYear()}-${(month.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthLabel = `T${month.getMonth() + 1}`;

            monthlyData[monthKey] = {
                month: monthLabel,
                'HĐ lao động quản lý': 0,
                'HĐ lao động bảo vệ': 0,
                'HĐ dịch vụ bảo vệ': 0,
            };
        }

        // Count contracts by category for each month
        nonTemplateDocuments.forEach(doc => {
            const docDate = new Date(doc.createdAt);
            const monthKey = `${docDate.getFullYear()}-${(docDate.getMonth() + 1).toString().padStart(2, '0')}`;

            if (monthlyData[monthKey]) {
                const categoryLabel = getCategoryLabel(doc.category);
                if (monthlyData[monthKey][categoryLabel] !== undefined) {
                    monthlyData[monthKey][categoryLabel]++;
                }
            }
        });

        return Object.values(monthlyData);
    };

    // Mock data for activity feed
    const activities = [
        { id: 1, type: 'signed', message: 'Hợp đồng HD-2024-128 đã được ký bởi Nguyễn Văn A', time: '15:30' },
        { id: 2, type: 'sent', message: 'Hợp đồng HD-2024-129 đã được gửi đi chờ ký', time: '14:20' },
        { id: 3, type: 'created', message: 'Tạo mới hợp đồng HD-2024-130', time: '13:15' },
        { id: 4, type: 'rejected', message: 'Hợp đồng HD-2024-127 bị từ chối', time: '12:00' },
        { id: 5, type: 'signed', message: 'Hợp đồng HD-2024-126 đã được ký bởi Trần Thị B', time: '11:45' },
        { id: 6, type: 'created', message: 'Tạo mới hợp đồng HD-2024-131', time: '10:30' },
    ];


    // Mock data for calendar events (deadlines)
    const calendarEvents = [
        { date: 26, count: 2, type: 'urgent' },
        { date: 27, count: 1, type: 'warning' },
        { date: 28, count: 3, type: 'normal' },
        { date: 30, count: 1, type: 'normal' },
    ];

    // Mock data for Row 4 - Donut Chart (Contract Status Distribution)
    const donutData = [
        { name: 'Đã ký kết', value: contractStats.completed, color: '#10b981' },
        { name: 'Chưa ký', value: contractStats.unsigned, color: '#f59e0b' },
        { name: 'Hết hạn/Từ chối', value: contractStats.expiredOrCanceled, color: '#ef4444' },
    ];

    // Bar Chart Data - Contracts by Category
    const barChartData = processContractsByCategory();

    // Mock data for Performance Metrics
    const performanceMetrics = [
        { label: 'Thời gian xử lý TB', value: '2.5 ngày', trend: 'down', trendValue: '12%' },
        { label: 'Tỷ lệ hoàn thành', value: '94%', trend: 'up', trendValue: '8%' },
        { label: 'Độ hài lòng', value: '4.7/5', trend: 'up', trendValue: '5%' },
    ];

    // Calendar navigation functions
    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const goToToday = () => {
        const today = new Date();
        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
    };

    // Generate calendar days for selected month
    const generateCalendarDays = () => {
        const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        const days = [];
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const event = calendarEvents.find(e => e.date === i);
            days.push({ date: i, event });
        }
        return days;
    };

    const calendarDays = generateCalendarDays();
    const displayedMonth = new Date(selectedYear, selectedMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    return (
        <div className="ec-dashboard-container">
            <aside className={`ec-sidebar ${isMenuOpen ? 'ec-sidebar-open' : 'ec-sidebar-closed'}`}>
                <div className="ec-sidebar-header">
                    <div className="ec-sidebar-logo">
                        <div className="ec-logo-icon">E</div>
                        {isMenuOpen && <span className="ec-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="ec-sidebar-nav">
                    <ul className="ec-nav-list">
                        <li className="ec-nav-item ec-nav-active">
                            <a href="/e-contracts/dashboard" className="ec-nav-link">
                                <svg className="ec-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="ec-nav-item">
                            <a href="/e-contracts/list" className="ec-nav-link">
                                <svg className="ec-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                        <li className="ec-nav-item">
                            <a href="#" className="ec-nav-link">
                                <svg className="ec-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`ec-main-content ${isMenuOpen ? 'ec-content-expanded' : 'ec-content-collapsed'}`}>
                <header className="ec-nav-header">
                    <div className="ec-nav-left">
                        <button className="ec-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="ec-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="ec-nav-right">
                        <button className="ec-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="ec-notification-badge">3</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="ec-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="ec-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="ec-user-info">
                                <span className="ec-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="ec-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="ec-profile-dropdown">
                                    <div className="ec-dropdown-item">
                                        <svg className="ec-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Thông tin người dùng
                                    </div>
                                    <div
                                        className={`ec-dropdown-item ec-logout-item ${isLoggingOut ? 'ec-disabled' : ''}`}
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
                                        <svg className="ec-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="ec-dashboard-main">
                    <div className="ec-dashboard-header">
                        <h1 className="ec-page-title">eContract Dashboard</h1>
                        <p className="ec-page-subtitle">Chào mừng đến hệ thống quản lý hợp đồng điện tử</p>
                    </div>

                    <div className="ec-kpi-grid">
                        {/* Card 1: Tổng hợp đồng */}
                        <div className="ec-kpi-card ec-kpi-primary">
                            <div className="ec-kpi-body">
                                <div className="ec-kpi-number">
                                    {isLoadingStats ? '...' : contractStats.total}
                                </div>
                                <div className="ec-kpi-label">Tổng hợp đồng</div>
                                <div className="ec-kpi-subtitle">
                                    Tổng số hợp đồng trong hệ thống
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Đã ký kết */}
                        <div className="ec-kpi-card ec-kpi-success">
                            <div className="ec-kpi-body">
                                <div className="ec-kpi-number">
                                    {isLoadingStats ? '...' : contractStats.completed}
                                </div>
                                <div className="ec-kpi-label">Đã ký kết</div>
                                <div className="ec-kpi-subtitle">
                                    Tỷ lệ: {isLoadingStats ? '...' : contractStats.total > 0 ? ((contractStats.completed / contractStats.total) * 100).toFixed(1) : '0'}%
                                </div>
                            </div>
                            {!isLoadingStats && contractStats.total > 0 && (
                                <div className="ec-kpi-progress">
                                    <div
                                        className="ec-kpi-progress-bar"
                                        style={{width: `${(contractStats.completed / contractStats.total) * 100}%`}}
                                    ></div>
                                </div>
                            )}
                        </div>

                        {/* Card 3: Chờ ký */}
                        <div className="ec-kpi-card ec-kpi-warning">
                            {!isLoadingStats && contractStats.unsigned > 0 && (
                                <div className="ec-kpi-header">
                                    <div className="ec-kpi-badge ec-kpi-badge-warning">
                                        Cần xử lý
                                    </div>
                                </div>
                            )}
                            <div className="ec-kpi-body">
                                <div className="ec-kpi-number">
                                    {isLoadingStats ? '...' : contractStats.unsigned}
                                </div>
                                <div className="ec-kpi-label">Chờ ký</div>
                                <div className="ec-kpi-subtitle">
                                    Hợp đồng chưa được ký kết
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Quá hạn/Từ chối */}
                        <div className="ec-kpi-card ec-kpi-danger">
                            <div className="ec-kpi-body">
                                <div className="ec-kpi-number">
                                    {isLoadingStats ? '...' : contractStats.expiredOrCanceled}
                                </div>
                                <div className="ec-kpi-label">Quá hạn/Từ chối</div>
                                <div className="ec-kpi-subtitle">
                                    Hợp đồng hết hạn hoặc bị hủy
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Chart and Activity Feed */}
                    <div className="ec-row2-container">
                        {/* Line Chart - 2/3 width */}
                        <div className="ec-chart-section">
                            <div className="ec-chart-header">
                                <h2 className="ec-chart-title">Thống kê hợp đồng</h2>
                                <div className="ec-chart-filter">
                                    <button
                                        className={`ec-filter-btn ${chartFilter === '7days' ? 'ec-filter-active' : ''}`}
                                        onClick={() => setChartFilter('7days')}
                                    >
                                        7 ngày
                                    </button>
                                    <button
                                        className={`ec-filter-btn ${chartFilter === '1month' ? 'ec-filter-active' : ''}`}
                                        onClick={() => setChartFilter('1month')}
                                    >
                                        1 tháng
                                    </button>
                                    <button
                                        className={`ec-filter-btn ${chartFilter === '1year' ? 'ec-filter-active' : ''}`}
                                        onClick={() => setChartFilter('1year')}
                                    >
                                        1 năm
                                    </button>
                                </div>
                            </div>
                            <div className="ec-chart-content">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#6b7280"
                                            style={{ fontSize: '13px' }}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            style={{ fontSize: '13px' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                fontSize: '13px'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '13px' }}
                                            iconType="circle"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="created"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            name="Tạo mới"
                                            dot={{ fill: '#10b981', r: 4 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="signed"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            name="Đã ký"
                                            dot={{ fill: '#3b82f6', r: 4 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="rejected"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            name="Từ chối"
                                            dot={{ fill: '#ef4444', r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Activity Feed - 1/3 width */}
                        <div className="ec-activity-section">
                            <div className="ec-activity-header">
                                <h2 className="ec-activity-title">Hoạt động gần đây</h2>
                            </div>
                            <div className="ec-activity-content">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="ec-activity-item">
                                        <div className="ec-activity-indicator">
                                            <span className={`ec-activity-dot ec-activity-${activity.type}`}></span>
                                        </div>
                                        <div className="ec-activity-details">
                                            <p className="ec-activity-message">{activity.message}</p>
                                            <span className="ec-activity-time">{activity.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Priority Table and Calendar */}
                    <div className="ec-row3-container">
                        {/* Priority Table */}
                        <div className="ec-table-section">
                            <div className="ec-table-header">
                                <h2 className="ec-table-title">Hợp đồng cần xử lý</h2>
                            </div>
                            <div className="ec-table-content">
                                {isLoadingContracts ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
                                ) : contracts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>Không có hợp đồng nào</div>
                                ) : (
                                    <table className="ec-priority-table">
                                        <thead>
                                            <tr>
                                                <th>Mã hợp đồng</th>
                                                <th>Người ký</th>
                                                <th>Loại hợp đồng</th>
                                                <th>Trạng thái</th>
                                                <th>Còn lại</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contracts.map((contract) => (
                                                <tr key={contract.id} className={contract.daysRemaining <= 7 ? 'ec-row-urgent' : ''}>
                                                    <td className="ec-td-name">{contract.contractNumber}</td>
                                                    <td>{contract.customerName}</td>
                                                    <td>{getContractCategoryLabel(contract.category)}</td>
                                                    <td>
                                                        <span className={`ec-status-badge ec-status-${contract.expiryStatus}`}>
                                                            {getExpiryStatusLabel(contract.expiryStatus)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`ec-days-left ${contract.daysRemaining <= 7 ? 'ec-days-urgent' : ''}`}>
                                                            {contract.daysRemaining} ngày
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Calendar Widget */}
                        <div className="ec-calendar-section">
                            <div className="ec-calendar-header">
                                <button className="ec-calendar-nav-btn" onClick={goToPreviousMonth} title="Tháng trước">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                                    </svg>
                                </button>
                                <h2 className="ec-calendar-title">{displayedMonth}</h2>
                                <button className="ec-calendar-nav-btn" onClick={goToNextMonth} title="Tháng sau">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="ec-calendar-nav-actions">
                                <button className="ec-calendar-today-btn" onClick={goToToday}>
                                    Hôm nay
                                </button>
                            </div>
                            <div className="ec-calendar-content">
                                <div className="ec-calendar-weekdays">
                                    <div className="ec-weekday">CN</div>
                                    <div className="ec-weekday">T2</div>
                                    <div className="ec-weekday">T3</div>
                                    <div className="ec-weekday">T4</div>
                                    <div className="ec-weekday">T5</div>
                                    <div className="ec-weekday">T6</div>
                                    <div className="ec-weekday">T7</div>
                                </div>
                                <div className="ec-calendar-days">
                                    {calendarDays.map((day, index) => (
                                        <div
                                            key={index}
                                            className={`ec-calendar-day ${!day ? 'ec-day-empty' : ''} ${day?.event ? 'ec-day-has-event' : ''}`}
                                        >
                                            {day && (
                                                <>
                                                    <span className="ec-day-number">{day.date}</span>
                                                    {day.event && (
                                                        <span className={`ec-day-dot ec-dot-${day.event.type}`}></span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="ec-calendar-legend">
                                <div className="ec-legend-item">
                                    <span className="ec-legend-dot ec-dot-urgent"></span>
                                    <span className="ec-legend-text">Khẩn cấp</span>
                                </div>
                                <div className="ec-legend-item">
                                    <span className="ec-legend-dot ec-dot-warning"></span>
                                    <span className="ec-legend-text">Cảnh báo</span>
                                </div>
                                <div className="ec-legend-item">
                                    <span className="ec-legend-dot ec-dot-normal"></span>
                                    <span className="ec-legend-text">Bình thường</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Donut Chart | Bar Chart | Performance */}
                    <div className="ec-row4-container">
                        {/* Donut Chart Section */}
                        <div className="ec-row4-donut-section">
                            <h2 className="ec-row4-section-title">Phân phối trạng thái</h2>
                            <div className="ec-donut-chart-wrapper">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="ec-donut-legend">
                                    {donutData.map((item, index) => (
                                        <div key={index} className="ec-donut-legend-item">
                                            <span className="ec-donut-legend-color" style={{ backgroundColor: item.color }}></span>
                                            <span className="ec-donut-legend-label">{item.name}</span>
                                            <span className="ec-donut-legend-value">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart Section */}
                        <div className="ec-row4-bar-section">
                            <h2 className="ec-row4-section-title">Hợp đồng theo tháng</h2>
                            <div className="ec-bar-chart-wrapper">
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={barChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="HĐ lao động quản lý" fill="#059669" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="HĐ lao động bảo vệ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="HĐ dịch vụ bảo vệ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Performance Metrics Section */}
                        <div className="ec-row4-performance-section">
                            <h2 className="ec-row4-section-title">Hiệu suất</h2>
                            <div className="ec-performance-metrics">
                                {performanceMetrics.map((metric, index) => (
                                    <div key={index} className="ec-performance-item">
                                        <div className="ec-performance-label">{metric.label}</div>
                                        <div className="ec-performance-value">{metric.value}</div>
                                        <div className={`ec-performance-trend ${metric.trend === 'up' ? 'ec-trend-up' : 'ec-trend-down'}`}>
                                            <span className="ec-trend-icon">
                                                {metric.trend === 'up' ? '↑' : '↓'}
                                            </span>
                                            <span className="ec-trend-value">{metric.trendValue}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="ec-modal-overlay" onClick={cancelLogout}>
                    <div className="ec-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ec-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="ec-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="ec-modal-footer">
                            <button className="ec-btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="ec-btn-confirm" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EContractDashboard;
