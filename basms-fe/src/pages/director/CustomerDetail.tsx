import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ManagerAssignmentModal from '../../components/ManagerAssignmentModal/ManagerAssignmentModal';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import './CustomerDetail.css';

// Declare HERE Maps types
declare global {
    interface Window {
        H: any;
    }
}

interface Customer {
    id: string;
    customerCode: string;
    companyName: string;
    contactPersonName: string;
    contactPersonTitle: string;
    identityNumber: string;
    identityIssueDate: string | null;
    identityIssuePlace: string | null;
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
    notes: string | null;
    createdAt: string;
}

interface Location {
    id: string;
    customerId: string;
    locationCode: string;
    locationName: string;
    locationType: string;
    address: string;
    city: string | null;
    district: string | null;
    ward: string | null;
    latitude: number | null;
    longitude: number | null;
    geofenceRadiusMeters: number;
    siteManagerName: string | null;
    siteManagerPhone: string | null;
    operatingHoursType: string;
    requires24x7Coverage: boolean;
    minimumGuardsRequired: number;
    isActive: boolean;
}

interface ContractLocation {
    id: string;
    contractId: string;
    locationId: string;
    guardsRequired: number;
    coverageType: string;
    serviceStartDate: string;
    serviceEndDate: string | null;
    isPrimaryLocation: boolean;
    priorityLevel: number;
    autoGenerateShifts: boolean;
    isActive: boolean;
}

interface ShiftSchedule {
    id: string;
    contractId: string;
    locationId: string;
    scheduleName: string;
    scheduleType: string;
    shiftStartTime: string;
    shiftEndTime: string;
    crossesMidnight: boolean;
    durationHours: number;
    breakMinutes: number;
    guardsPerShift: number;
    recurrenceType: string;
    appliesMonday: boolean;
    appliesTuesday: boolean;
    appliesWednesday: boolean;
    appliesThursday: boolean;
    appliesFriday: boolean;
    appliesSaturday: boolean;
    appliesSunday: boolean;
    monthlyDates: string | null;
    appliesOnPublicHolidays: boolean;
    appliesOnCustomerHolidays: boolean;
    appliesOnWeekends: boolean;
    skipWhenLocationClosed: boolean;
    requiresArmedGuard: boolean;
    requiresSupervisor: boolean;
    minimumExperienceMonths: number;
    requiredCertifications: string | null;
    autoGenerateEnabled: boolean;
    generateAdvanceDays: number;
    effectiveFrom: string;
    effectiveTo: string;
    isActive: boolean;
    notes: string | null;
    createdBy: string;
}

interface PublicHoliday {
    id: string;
    contractId: string;
    holidayDate: string;
    holidayName: string;
    holidayNameEn: string;
    holidayCategory: string;
    isTetPeriod: boolean;
    isTetHoliday: boolean;
    tetDayNumber: number | null;
    holidayStartDate: string;
    holidayEndDate: string;
    totalHolidayDays: number;
    isOfficialHoliday: boolean;
    isObserved: boolean;
    originalDate: string | null;
    observedDate: string | null;
    appliesNationwide: boolean;
    appliesToRegions: string | null;
    standardWorkplacesClosed: boolean;
    essentialServicesOperating: boolean;
    description: string | null;
    year: number;
}

interface Document {
    id: string;
    documentType: string;
    category: string;
    documentName: string;
    fileUrl: string;
    fileSize: number;
    version: string;
    startDate: string;
    endDate: string;
    signDate: string;
    approvedAt: string;
    createdAt: string;
    fileSizeFormatted: string;
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
    durationMonths: number;
    coverageModel: string;
    followsCustomerCalendar: boolean;
    workOnPublicHolidays: boolean;
    workOnCustomerClosedDays: boolean;
    isRenewable: boolean;
    autoRenewal: boolean;
    renewalNoticeDays: number;
    renewalCount: number;
    autoGenerateShifts: boolean;
    generateShiftsAdvanceDays: number;
    status: string;
    approvedBy: string | null;
    approvedAt: string | null;
    signedDate: string | null;
    activatedAt: string | null;
    terminationDate: string | null;
    terminationType: string | null;
    terminationReason: string | null;
    terminatedBy: string | null;
    contractFileUrl: string;
    notes: string | null;
    createdAt: string;
    document: Document;
    locations: ContractLocation[];
    shiftSchedules: ShiftSchedule[];
    publicHolidays: PublicHoliday[];
}

interface CustomerDetailResponse {
    success: boolean;
    errorMessage: string | null;
    customer: Customer;
    locations: Location[];
    contracts: Contract[];
}

const CustomerDetail = () => {
    const navigate = useNavigate();
    const { customerId } = useParams<{ customerId: string }>();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [customerData, setCustomerData] = useState<CustomerDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const mapRefs = useRef<{ [key: string]: any }>({});

    // Manager assignment modal state
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        contract: { id: string; title: string; number: string } | null;
    }>({
        isOpen: false,
        contract: null
    });

    // Snackbar states
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Load Here Maps scripts
    useEffect(() => {
        if (window.H) {
            setMapsLoaded(true);
            return;
        }

        const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                document.head.appendChild(script);
            });
        };

        const loadStyles = (href: string) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            document.head.appendChild(link);
        };

        const loadHereMaps = async () => {
            try {
                // Load HERE Maps CSS
                loadStyles('https://js.api.here.com/v3/3.1/mapsjs-ui.css');

                // Load HERE Maps scripts in order
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-core.js');
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-service.js');
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-ui.js');
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-mapevents.js');

                setMapsLoaded(true);
            } catch (error) {
                console.error('Error loading HERE Maps:', error);
            }
        };

        loadHereMaps();
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
        const fetchCustomerDetail = async () => {
            if (!customerId) {
                setError('ID khách hàng không hợp lệ');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    console.error('No access token found');
                    setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/customers/${customerId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch customer details');
                }

                const data: CustomerDetailResponse = await response.json();
                setCustomerData(data);
            } catch (err) {
                console.error('Error fetching customer details:', err);
                setError('Không thể tải thông tin khách hàng. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomerDetail();
    }, [customerId]);

    // Initialize maps for locations
    useEffect(() => {
        if (!mapsLoaded || !customerData || !customerData.locations) {
            return;
        }

        const initializeMaps = () => {
            const apiKey = import.meta.env.VITE_HERE_MAP_API_KEY;

            customerData.locations.forEach((location) => {
                if (!location.latitude || !location.longitude) {
                    return;
                }

                const mapContainer = document.getElementById(`map-${location.id}`);
                if (!mapContainer || mapRefs.current[location.id]) {
                    return;
                }

                try {
                    // Initialize the platform
                    const platform = new window.H.service.Platform({
                        apikey: apiKey
                    });

                    // Obtain the default map types from the platform object
                    const defaultLayers = platform.createDefaultLayers();

                    // Instantiate the map
                    const map = new window.H.Map(
                        mapContainer,
                        defaultLayers.vector.normal.map,
                        {
                            zoom: 16,
                            center: { lat: location.latitude, lng: location.longitude }
                        }
                    );

                    // Disable all interactions (read-only mode)
                    // Note: We're not adding MapEvents or Behavior, which disables interactions

                    // Add a marker at the location
                    const marker = new window.H.map.Marker({
                        lat: location.latitude,
                        lng: location.longitude
                    });
                    map.addObject(marker);

                    // Store map reference
                    mapRefs.current[location.id] = map;

                    // Make the map resize when window is resized
                    window.addEventListener('resize', () => map.getViewPort().resize());
                } catch (error) {
                    console.error(`Error initializing map for location ${location.id}:`, error);
                }
            });
        };

        // Small delay to ensure DOM is ready
        setTimeout(initializeMaps, 100);

        // Cleanup function
        return () => {
            Object.values(mapRefs.current).forEach((map) => {
                if (map && map.dispose) {
                    map.dispose();
                }
            });
            mapRefs.current = {};
        };
    }, [mapsLoaded, customerData]);

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

    const formatDate = (dateString: string | null) => {
        if (!dateString || dateString === '0001-01-01T00:00:00') return 'Chưa có';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatTime = (timeString: string) => {
        return timeString.substring(0, 5);
    };

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            active: 'Đang hoạt động',
            inactive: 'Không hoạt động',
            assigning_manager: 'Phân công bảo vệ',
            schedule_shifts: 'Phân công ca trực',
            draft: 'Bản nháp',
            pending_approval: 'Chờ phê duyệt',
            approved: 'Đã phê duyệt',
            signed: 'Đã ký',
            activated: 'Đã kích hoạt',
            expired: 'Hết hạn',
            terminated: 'Đã chấm dứt',
        };
        return statusMap[status] || status;
    };

    const getGenderLabel = (gender: string) => {
        const genderMap: { [key: string]: string } = {
            male: 'Nam',
            female: 'Nữ',
            other: 'Khác',
        };
        return genderMap[gender] || gender;
    };

    const getLocationTypeLabel = (type: string) => {
        const typeMap: { [key: string]: string } = {
            office: 'Văn phòng',
            factory: 'Nhà máy',
            warehouse: 'Kho',
            retail: 'Bán lẻ',
            other: 'Khác',
        };
        return typeMap[type] || type;
    };

    const getContractTypeLabel = (type: string) => {
        const typeMap: { [key: string]: string } = {
            long_term: 'Dài hạn',
            short_term: 'Ngắn hạn',
            trial: 'Thử nghiệm',
        };
        return typeMap[type] || type;
    };

    // Manager assignment functions
    const handleOpenManagerModal = (contract: Contract) => {
        setModalState({
            isOpen: true,
            contract: {
                id: contract.id,
                title: contract.contractTitle,
                number: contract.contractNumber
            }
        });
    };

    const handleCloseManagerModal = () => {
        setModalState({
            isOpen: false,
            contract: null
        });
    };

    const handleManagerAssignmentSuccess = async () => {
        // Show success snackbar
        setShowSnackbarSuccess(true);

        // Refresh customer data after successful activation
        if (customerId) {
            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) return;

                const response = await fetch(`${apiUrl}/customers/${customerId}/details`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setCustomerData(data);
                }
            } catch (err) {
                console.error('Error refreshing customer data:', err);
            }
        }
    };

    const handleManagerAssignmentError = () => {
        // Show error snackbar
        setShowSnackbarFailed(true);
    };

    return (
        <div className="cust-detail-container">
            <aside className={`cust-detail-sidebar ${isMenuOpen ? 'cust-detail-sidebar-open' : 'cust-detail-sidebar-closed'}`}>
                <div className="cust-detail-sidebar-header">
                    <div className="cust-detail-sidebar-logo">
                        <div className="cust-detail-logo-icon">D</div>
                        {isMenuOpen && <span className="cust-detail-logo-text">Director</span>}
                    </div>
                </div>

                <nav className="cust-detail-sidebar-nav">
                    <ul className="cust-detail-nav-list">
                        <li className="cust-detail-nav-item">
                            <Link to="/director/dashboard" className="cust-detail-nav-link">
                                <svg className="cust-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="cust-detail-nav-item cust-detail-nav-active">
                            <Link to="/director/customer-list" className="cust-detail-nav-link">
                                <svg className="cust-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="cust-detail-nav-item">
                            <Link to="/director/employee-control" className="cust-detail-nav-link">
                                <svg className="cust-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="cust-detail-nav-item">
                            <Link to="/director/analytics" className="cust-detail-nav-link">
                                <svg className="cust-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="cust-detail-nav-item">
                            <Link to="/director/reports" className="cust-detail-nav-link">
                                <svg className="cust-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`cust-detail-main-content ${isMenuOpen ? 'cust-detail-content-expanded' : 'cust-detail-content-collapsed'}`}>
                <header className="cust-detail-nav-header">
                    <div className="cust-detail-nav-left">
                        <button className="cust-detail-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="cust-detail-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="cust-detail-nav-right">
                        <button className="cust-detail-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="cust-detail-notification-badge">0</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="cust-detail-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="cust-detail-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="cust-detail-user-info">
                                <span className="cust-detail-user-name">{user?.fullName || 'Director'}</span>
                                <span className="cust-detail-user-role">Giám đốc điều hành</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="cust-detail-profile-dropdown">
                                    <div
                                        className={`cust-detail-dropdown-item cust-detail-logout-item ${isLoggingOut ? 'cust-detail-disabled' : ''}`}
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
                                        <svg className="cust-detail-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="cust-detail-main">
                    {/* Page Header */}
                    <div className="cust-detail-page-header">
                        <div className="cust-detail-header-left">
                            <button
                                className="cust-detail-back-btn"
                                onClick={() => navigate('/director/customer-list')}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                                Quay lại
                            </button>
                            <h1 className="cust-detail-page-title">Chi tiết khách hàng</h1>
                        </div>
                        {/* Hide buttons when customer status is schedule_shifts */}
                        {customerData?.customer?.status !== 'schedule_shifts' && (
                            <div className="cust-detail-header-actions">
                                <button
                                    className="cust-detail-action-btn cust-detail-btn-update"
                                    onClick={() => {
                                        navigate(`/director/customer/${customerId}/edit`);
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                    Cập nhật thông tin
                                </button>
                                <button
                                    className="cust-detail-action-btn cust-detail-btn-assign"
                                    onClick={() => {
                                        if (customerData?.contracts && customerData.contracts.length > 0) {
                                            // Use the first contract for now
                                            handleOpenManagerModal(customerData.contracts[0]);
                                        } else {
                                            console.log('No contracts found');
                                        }
                                    }}
                                    disabled={!customerData?.contracts || customerData.contracts.length === 0}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                    </svg>
                                    Phân công cho quản lý
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="cust-detail-loading">
                            <div className="cust-detail-loading-text">Đang tải thông tin khách hàng...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="cust-detail-error">
                            <div className="cust-detail-error-text">{error}</div>
                            <button
                                className="cust-detail-retry-btn"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Customer Detail Content */}
                    {!isLoading && !error && customerData && (
                        <div className="cust-detail-content">
                            {/* Customer Basic Information */}
                            <div className="cust-detail-section">
                                <h2 className="cust-detail-section-title">Thông tin cơ bản</h2>
                                <div className="cust-detail-info-grid">
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Mã khách hàng:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.customerCode}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Tên công ty:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.companyName}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Địa chỉ:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.address}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Khách hàng từ:</span>
                                        <span className="cust-detail-info-value">{formatDate(customerData.customer.customerSince)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Person Information */}
                            <div className="cust-detail-section">
                                <h2 className="cust-detail-section-title">Thông tin người liên hệ</h2>
                                <div className="cust-detail-info-grid">
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Họ và tên:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.contactPersonName}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Chức vụ:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.contactPersonTitle}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Số CMND/CCCD:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.identityNumber}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Email:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.email}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Số điện thoại:</span>
                                        <span className="cust-detail-info-value">{customerData.customer.phone}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Giới tính:</span>
                                        <span className="cust-detail-info-value">{getGenderLabel(customerData.customer.gender)}</span>
                                    </div>
                                    <div className="cust-detail-info-item">
                                        <span className="cust-detail-info-label">Ngày sinh:</span>
                                        <span className="cust-detail-info-value">{formatDate(customerData.customer.dateOfBirth)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Locations */}
                            {customerData.locations && customerData.locations.length > 0 && (
                                <div className="cust-detail-section">
                                    <h2 className="cust-detail-section-title">Địa điểm ({customerData.locations.length})</h2>
                                    {customerData.locations.map((location) => (
                                        <div key={location.id} className="cust-detail-location-card">
                                            <div className="cust-detail-location-header">
                                                <h3 className="cust-detail-location-name">{location.locationName}</h3>
                                                <span className={`cust-detail-location-status ${location.isActive ? 'cust-detail-active' : 'cust-detail-inactive'}`}>
                                                    {location.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                                </span>
                                            </div>
                                            <div className="cust-detail-info-grid">
                                                <div className="cust-detail-info-item">
                                                    <span className="cust-detail-info-label">Mã địa điểm:</span>
                                                    <span className="cust-detail-info-value">{location.locationCode}</span>
                                                </div>
                                                <div className="cust-detail-info-item">
                                                    <span className="cust-detail-info-label">Loại địa điểm:</span>
                                                    <span className="cust-detail-info-value">{getLocationTypeLabel(location.locationType)}</span>
                                                </div>
                                                <div className="cust-detail-info-item">
                                                    <span className="cust-detail-info-label">Địa chỉ:</span>
                                                    <span className="cust-detail-info-value">{location.address}</span>
                                                </div>
                                                <div className="cust-detail-info-item">
                                                    <span className="cust-detail-info-label">Yêu cầu 24/7:</span>
                                                    <span className="cust-detail-info-value">
                                                        {location.requires24x7Coverage ? 'Có' : 'Không'}
                                                    </span>
                                                </div>
                                                {location.siteManagerName && (
                                                    <>
                                                        <div className="cust-detail-info-item">
                                                            <span className="cust-detail-info-label">Người quản lý:</span>
                                                            <span className="cust-detail-info-value">{location.siteManagerName}</span>
                                                        </div>
                                                        <div className="cust-detail-info-item">
                                                            <span className="cust-detail-info-label">SĐT người quản lý:</span>
                                                            <span className="cust-detail-info-value">{location.siteManagerPhone}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* HERE Maps Display */}
                                            {location.latitude && location.longitude && (
                                                <div className="cust-detail-location-map">
                                                    <h4 className="cust-detail-map-title">Vị trí trên bản đồ</h4>
                                                    <div className="cust-detail-map-coordinates">
                                                        <span>Kinh độ: {location.longitude.toFixed(6)}</span>
                                                        <span>Vĩ độ: {location.latitude.toFixed(6)}</span>
                                                    </div>
                                                    <div
                                                        id={`map-${location.id}`}
                                                        className="cust-detail-map-container"
                                                        style={{
                                                            width: '100%',
                                                            height: '400px',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {!mapsLoaded && (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                height: '100%',
                                                                background: '#f5f5f5',
                                                                color: '#666'
                                                            }}>
                                                                Đang tải bản đồ...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Contracts */}
                            {customerData.contracts && customerData.contracts.length > 0 && (
                                <div className="cust-detail-section">
                                    <h2 className="cust-detail-section-title">Hợp đồng ({customerData.contracts.length})</h2>
                                    {customerData.contracts.map((contract) => (
                                        <div key={contract.id} className="cust-detail-contract-card">
                                            <div className="cust-detail-contract-header">
                                                <div>
                                                    <h3 className="cust-detail-contract-title">{contract.contractTitle}</h3>
                                                    <p className="cust-detail-contract-number">{contract.contractNumber}</p>
                                                </div>
                                                <div className="cust-detail-contract-header-actions">
                                                    <span className={`cust-detail-contract-status cust-detail-status-${contract.status}`}>
                                                        {getStatusLabel(contract.status)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Contract Basic Info */}
                                            <div className="cust-detail-subsection">
                                                <h4 className="cust-detail-subsection-title">Thông tin chung</h4>
                                                <div className="cust-detail-info-grid">
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Loại hợp đồng:</span>
                                                        <span className="cust-detail-info-value">{getContractTypeLabel(contract.contractType)}</span>
                                                    </div>
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Phạm vi dịch vụ:</span>
                                                        <span className="cust-detail-info-value">{contract.serviceScope}</span>
                                                    </div>
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Ngày bắt đầu:</span>
                                                        <span className="cust-detail-info-value">{formatDate(contract.startDate)}</span>
                                                    </div>
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Ngày kết thúc:</span>
                                                        <span className="cust-detail-info-value">{formatDate(contract.endDate)}</span>
                                                    </div>
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Thời hạn:</span>
                                                        <span className="cust-detail-info-value">{contract.durationMonths} tháng</span>
                                                    </div>
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Gia hạn tự động:</span>
                                                        <span className="cust-detail-info-value">
                                                            {contract.autoRenewal ? 'Có' : 'Không'}
                                                        </span>
                                                    </div>
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Làm việc ngày lễ:</span>
                                                        <span className="cust-detail-info-value">
                                                            {contract.workOnPublicHolidays ? 'Có' : 'Không'}
                                                        </span>
                                                    </div>
                                                    <div className="cust-detail-info-item">
                                                        <span className="cust-detail-info-label">Tự động tạo ca:</span>
                                                        <span className="cust-detail-info-value">
                                                            {contract.autoGenerateShifts ? 'Có' : 'Không'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shift Schedules */}
                                            {contract.shiftSchedules && contract.shiftSchedules.length > 0 && (
                                                <div className="cust-detail-subsection">
                                                    <h4 className="cust-detail-subsection-title">Lịch ca trực ({contract.shiftSchedules.length})</h4>
                                                    {contract.shiftSchedules.map((shift) => (
                                                        <div key={shift.id} className="cust-detail-shift-card">
                                                            <div className="cust-detail-shift-header">
                                                                <h5 className="cust-detail-shift-name">{shift.scheduleName}</h5>
                                                                <span className="cust-detail-shift-time">
                                                                    {formatTime(shift.shiftStartTime)} - {formatTime(shift.shiftEndTime)}
                                                                    {shift.crossesMidnight && ' (qua đêm)'}
                                                                </span>
                                                            </div>
                                                            <div className="cust-detail-info-grid">
                                                                <div className="cust-detail-info-item">
                                                                    <span className="cust-detail-info-label">Thời lượng:</span>
                                                                    <span className="cust-detail-info-value">{shift.durationHours} giờ</span>
                                                                </div>
                                                                <div className="cust-detail-info-item">
                                                                    <span className="cust-detail-info-label">Nghỉ giữa ca:</span>
                                                                    <span className="cust-detail-info-value">{shift.breakMinutes} phút</span>
                                                                </div>
                                                                <div className="cust-detail-info-item">
                                                                    <span className="cust-detail-info-label">Số bảo vệ/ca:</span>
                                                                    <span className="cust-detail-info-value">{shift.guardsPerShift}</span>
                                                                </div>
                                                            </div>
                                                            <div className="cust-detail-shift-days">
                                                                <span className="cust-detail-info-label">Áp dụng:</span>
                                                                <div className="cust-detail-days-row">
                                                                    <span className={shift.appliesMonday ? 'cust-detail-day-active' : 'cust-detail-day-inactive'}>T2</span>
                                                                    <span className={shift.appliesTuesday ? 'cust-detail-day-active' : 'cust-detail-day-inactive'}>T3</span>
                                                                    <span className={shift.appliesWednesday ? 'cust-detail-day-active' : 'cust-detail-day-inactive'}>T4</span>
                                                                    <span className={shift.appliesThursday ? 'cust-detail-day-active' : 'cust-detail-day-inactive'}>T5</span>
                                                                    <span className={shift.appliesFriday ? 'cust-detail-day-active' : 'cust-detail-day-inactive'}>T6</span>
                                                                    <span className={shift.appliesSaturday ? 'cust-detail-day-active' : 'cust-detail-day-inactive'}>T7</span>
                                                                    <span className={shift.appliesSunday ? 'cust-detail-day-active' : 'cust-detail-day-inactive'}>CN</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Public Holidays */}
                                            {contract.publicHolidays && contract.publicHolidays.length > 0 && (
                                                <div className="cust-detail-subsection">
                                                    <h4 className="cust-detail-subsection-title">Ngày nghỉ lễ ({contract.publicHolidays.length})</h4>
                                                    <div className="cust-detail-holidays-list">
                                                        {contract.publicHolidays.map((holiday) => (
                                                            <div key={holiday.id} className="cust-detail-holiday-item">
                                                                <div className="cust-detail-holiday-date">
                                                                    {formatDate(holiday.holidayDate)}
                                                                </div>
                                                                <div className="cust-detail-holiday-info">
                                                                    <div className="cust-detail-holiday-name">{holiday.holidayName}</div>
                                                                    <div className="cust-detail-holiday-details">
                                                                        {holiday.totalHolidayDays > 1 &&
                                                                            `(${holiday.totalHolidayDays} ngày)`
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {showLogoutModal && (
                <div className="cust-detail-modal-overlay" onClick={cancelLogout}>
                    <div className="cust-detail-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="cust-detail-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="cust-detail-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="cust-detail-modal-footer">
                            <button className="cust-detail-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="cust-detail-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manager Assignment Modal */}
            {modalState.contract && (
                <ManagerAssignmentModal
                    isOpen={modalState.isOpen}
                    onClose={handleCloseManagerModal}
                    contractId={modalState.contract.id}
                    contractTitle={modalState.contract.title}
                    contractNumber={modalState.contract.number}
                    onSuccess={handleManagerAssignmentSuccess}
                    onError={handleManagerAssignmentError}
                />
            )}

            {/* Snackbar Notifications */}
            <SnackbarChecked
                message="Phân công thành công"
                isOpen={showSnackbarSuccess}
                duration={4000}
                onClose={() => setShowSnackbarSuccess(false)}
            />
            <SnackbarFailed
                message="Phân công thất bại. Vui lòng thử lại"
                isOpen={showSnackbarFailed}
                duration={4000}
                onClose={() => setShowSnackbarFailed(false)}
            />
        </div>
    );
};

export default CustomerDetail;
