import {useState, useEffect, useRef} from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import ManagerInfoModal from "../../components/managerInfoModal/managerInfoModal.tsx";
import SnackbarChecked from "../../components/snackbar/snackbarChecked.tsx";
import SnackbarFailed from "../../components/snackbar/snackbarFailed.tsx";
import './managerRequest.css';

interface DaysOfWeek {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
}

interface ShiftTemplate {
    id: string;
    managerId: string;
    contractId: string;
    templateCode: string;
    templateName: string;
    description: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    breakDurationMinutes: number;
    isNightShift: boolean;
    crossesMidnight: boolean;
    daysOfWeek: DaysOfWeek;
    minGuardsRequired: number;
    maxGuardsAllowed: number;
    optimalGuards: number;
    locationId: string;
    locationName: string;
    locationAddress: string;
    status: string;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo: string;
    createdAt: string;
    updatedAt: string | null;
}

interface ContractGroup {
    contractId: string;
    contractName: string;
    templateCount: number;
    totalLocations: number;
    locationNames: string[];
    totalMinGuardsRequired: number;
    templates: ShiftTemplate[];
}

interface PendingTemplatesResponse {
    success: boolean;
    managerId: string;
    totalContracts: number;
    totalTemplates: number;
    contractGroups: ContractGroup[];
}

const ManagerRequest = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showManagerInfoModal, setShowManagerInfoModal] = useState(false);
    const [contractGroups, setContractGroups] = useState<ContractGroup[]>([]);
    const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalTemplates, setTotalTemplates] = useState<number>(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedContractGroup, setSelectedContractGroup] = useState<ContractGroup | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbarChecked, setSnackbarChecked] = useState({ isOpen: false, message: '' });
    const [snackbarFailed, setSnackbarFailed] = useState({ isOpen: false, message: '' });
    const [managerId, setManagerId] = useState<string>('');

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
        fetchPendingTemplates();
    }, []);

    const fetchPendingTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const email = user?.email;

            if (!email) {
                setError('Không tìm thấy thông tin người dùng');
                setLoading(false);
                return;
            }

            // Get accessToken from localStorage
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

            const managerUrl = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/managers/by-email?email=${encodeURIComponent(email)}`;

            const managerResponse = await fetch(managerUrl,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (!managerResponse.ok) {
                const errorText = await managerResponse.text();
                console.error('Manager API error:', managerResponse.status, errorText);
                throw new Error(`Lỗi khi tải thông tin quản lý (${managerResponse.status})`);
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

            const templatesUrl = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/shift-templates/pending/${fetchedManagerId}`;

            const templatesResponse = await fetch(templatesUrl,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (!templatesResponse.ok) {
                const errorText = await templatesResponse.text();
                console.error('Templates API error:', templatesResponse.status, errorText);
                throw new Error(`Lỗi khi tải danh sách ca trực (${templatesResponse.status})`);
            }

            const templatesText = await templatesResponse.text();
            let templatesData: PendingTemplatesResponse;
            try {
                templatesData = JSON.parse(templatesText);
            } catch (e) {
                console.error('Failed to parse templates response:', templatesText.substring(0, 200));
                throw new Error('API trả về dữ liệu không hợp lệ');
            }

            const sortedContractGroups = templatesData.contractGroups.map(group => ({
                ...group,
                templates: sortTemplatesByTime(group.templates)
            }));

            setContractGroups(sortedContractGroups);
            setTotalTemplates(templatesData.totalContracts || 0);
        } catch (err) {
            console.error('Error fetching pending templates:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const sortTemplatesByTime = (templates: ShiftTemplate[]): ShiftTemplate[] => {
        return [...templates].sort((a, b) => {
            const timeA = parseInt(a.startTime.replace(':', ''));
            const timeB = parseInt(b.startTime.replace(':', ''));
            return timeA - timeB;
        });
    };

    const toggleContractExpansion = (contractId: string) => {
        setExpandedContracts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contractId)) {
                newSet.delete(contractId);
            } else {
                newSet.add(contractId);
            }
            return newSet;
        });
    };

    const formatDaysOfWeek = (daysOfWeek: DaysOfWeek): string => {
        const days = [];
        if (daysOfWeek.monday) days.push('T2');
        if (daysOfWeek.tuesday) days.push('T3');
        if (daysOfWeek.wednesday) days.push('T4');
        if (daysOfWeek.thursday) days.push('T5');
        if (daysOfWeek.friday) days.push('T6');
        if (daysOfWeek.saturday) days.push('T7');
        if (daysOfWeek.sunday) days.push('CN');
        return days.join(', ');
    };

    const getShiftTypeLabel = (startTime: string): string => {
        const hour = parseInt(startTime.split(':')[0]);
        if (hour >= 6 && hour < 12) return 'Ca sáng';
        if (hour >= 12 && hour < 18) return 'Ca chiều';
        return 'Ca tối';
    };

    const getShiftTypeClass = (startTime: string): string => {
        const hour = parseInt(startTime.split(':')[0]);
        if (hour >= 6 && hour < 12) return 'mgr-request-shift-morning';
        if (hour >= 12 && hour < 18) return 'mgr-request-shift-afternoon';
        return 'mgr-request-shift-evening';
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

    const calculateGenerateDays = (effectiveFrom: string, effectiveTo: string): number => {
        const fromDate = new Date(effectiveFrom);
        const toDate = new Date(effectiveTo);
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If >= 1 month (30 days), return 30, otherwise return actual days
        return diffDays >= 30 ? 30 : diffDays;
    };

    const handleConfirmCreateShifts = (group: ContractGroup, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedContractGroup(group);
        setShowConfirmModal(true);
    };

    const handleCancelConfirm = () => {
        setShowConfirmModal(false);
        setSelectedContractGroup(null);
    };

    const handleSubmitCreateShifts = async () => {
        if (!selectedContractGroup || !managerId) return;

        setIsSubmitting(true);

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
                throw new Error('Không tìm thấy access token');
            }

            const contractId = selectedContractGroup.contractId;
            console.log('Fetching contract customer for contractId:', contractId);

            const contractCustomerUrl = `${import.meta.env.VITE_API_CONTRACT_URL}/contracts/${contractId}/customer`;
            const contractCustomerResponse = await fetch(contractCustomerUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!contractCustomerResponse.ok) {
                const errorText = await contractCustomerResponse.text();
                console.error('Contract customer API error:', contractCustomerResponse.status, errorText);
                throw new Error(`Lỗi khi lấy thông tin hợp đồng (${contractCustomerResponse.status})`);
            }

            const contractCustomerText = await contractCustomerResponse.text();
            let contractCustomerData;
            try {
                contractCustomerData = JSON.parse(contractCustomerText);
                console.log('Contract customer data:', contractCustomerData);
            } catch (e) {
                console.error('Failed to parse contract customer response:', contractCustomerText.substring(0, 200));
                throw new Error('API trả về dữ liệu không hợp lệ');
            }

            const customerId = contractCustomerData.customerId;
            if (!customerId) {
                throw new Error('Không tìm thấy customer ID');
            }

            console.log('Activating customer:', customerId);

            const activateCustomerUrl = `${import.meta.env.VITE_API_CONTRACT_URL}/contracts/customers/${customerId}/activate`;
            const activateCustomerResponse = await fetch(activateCustomerUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!activateCustomerResponse.ok) {
                const errorText = await activateCustomerResponse.text();
                console.error('Activate customer API error:', activateCustomerResponse.status, errorText);
                throw new Error(`Lỗi khi kích hoạt khách hàng (${activateCustomerResponse.status})`);
            }

            await activateCustomerResponse.text();
            console.log('Customer activated successfully');

            const firstTemplate = selectedContractGroup.templates[0];
            const shiftTemplateIds = selectedContractGroup.templates.map(t => t.id);
            const generateDays = calculateGenerateDays(firstTemplate.effectiveFrom, firstTemplate.effectiveTo);

            const requestBody = {
                managerId: managerId,
                shiftTemplateIds: shiftTemplateIds,
                generateFromDate: firstTemplate.effectiveFrom,
                generateDays: generateDays
            };

            console.log('Generating shifts with request:', requestBody);

            const response = await fetch(
                `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Generate shifts API error:', response.status, errorText);
                throw new Error(`Lỗi khi tạo ca trực (${response.status})`);
            }

            await response.text();
            console.log('Shifts generated successfully');

            setShowConfirmModal(false);
            setSelectedContractGroup(null);
            setSnackbarChecked({ isOpen: true, message: 'Tạo ca trực thành công' });
        } catch (err) {
            console.error('Error in shift creation flow:', err);
            setShowConfirmModal(false);
            setSelectedContractGroup(null);
            setSnackbarFailed({
                isOpen: true,
                message: err instanceof Error ? err.message : 'Lỗi khi tạo ca trực'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSnackbarCheckedClose = () => {
        setSnackbarChecked({ isOpen: false, message: '' });
        // Reload page after snackbar closes
        window.location.reload();
    };

    const handleSnackbarFailedClose = () => {
        setSnackbarFailed({ isOpen: false, message: '' });
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
                        <li className="manager-nav-item manager-nav-active">
                            <a href="/manager/request" className="manager-nav-link">
                                <div className="manager-nav-icon-wrapper">
                                    <svg className="manager-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                    </svg>
                                    {totalTemplates > 0 && (
                                        <span className="manager-nav-badge">{totalTemplates}</span>
                                    )}
                                </div>
                                {isMenuOpen && <span>Yêu cầu phân công</span>}
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
                        <h1 className="manager-page-title">Yêu cầu phân công ca trực</h1>
                        <p className="manager-page-subtitle">Quản lý các yêu cầu tạo ca trực chờ duyệt</p>
                    </div>

                    {loading ? (
                        <div className="mgr-request-loading">
                            <div className="mgr-request-spinner"></div>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <div className="mgr-request-error">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                            </svg>
                            <p>{error}</p>
                        </div>
                    ) : contractGroups.length === 0 ? (
                        <div className="mgr-request-empty">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2V7h-4v2h2z"/>
                            </svg>
                            <p>Không có yêu cầu phân công nào</p>
                        </div>
                    ) : (
                        <div className="mgr-request-list">
                            {contractGroups.map(group => (
                                <div key={group.contractId} className="mgr-request-container">
                                    <div
                                        className="mgr-request-header"
                                        onClick={() => toggleContractExpansion(group.contractId)}
                                    >
                                        <div className="mgr-request-header-left">
                                            <div className="mgr-request-contract-name">{group.locationNames}</div>

                                            <div className="mgr-request-summary">
                                                <span className="mgr-request-badge mgr-request-badge-primary">
                                                    {group.templateCount} ca
                                                </span>
                                                <span className="mgr-request-badge mgr-request-badge-info">
                                                    {group.totalMinGuardsRequired} bảo vệ
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mgr-request-header-right">
                                            <button
                                                className="mgr-request-confirm-btn"
                                                onClick={(e) => handleConfirmCreateShifts(group, e)}
                                                disabled={isSubmitting}
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                </svg>
                                                Xác nhận tạo ca
                                            </button>
                                            <svg
                                                className={`mgr-request-chevron ${expandedContracts.has(group.contractId) ? 'mgr-request-chevron-expanded' : ''}`}
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                                            </svg>
                                        </div>
                                    </div>

                                    {expandedContracts.has(group.contractId) && (
                                        <div className="mgr-request-content">
                                            <div className="mgr-request-shifts">
                                                {group.templates.map(template => (
                                                    <div key={template.id} className={`mgr-request-shift-card ${getShiftTypeClass(template.startTime)}`}>
                                                        <div className="mgr-request-shift-header">
                                                            <div className="mgr-request-shift-title">
                                                                <span className="mgr-request-shift-type">{getShiftTypeLabel(template.startTime)}</span>
                                                                <span className="mgr-request-shift-name">{template.templateName}</span>

                                                            </div>
                                                            <div className="mgr-request-shift-time">
                                                                {template.startTime} - {template.endTime}
                                                            </div>
                                                        </div>

                                                        <div className="mgr-request-shift-body">
                                                            <div className="mgr-request-shift-info">
                                                                <div className="mgr-request-info-item">
                                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                                                    </svg>
                                                                    <span>{template.durationHours}h (nghỉ {template.breakDurationMinutes}p)</span>
                                                                </div>
                                                                <div className="mgr-request-info-item">
                                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.007 3.007 0 0 0 17.12 7H16.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5H18v4h2z"/>
                                                                    </svg>
                                                                    <span>{template.maxGuardsAllowed} người</span>
                                                                </div>
                                                                <div className="mgr-request-info-item">
                                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                                                                    </svg>
                                                                    <span>{formatDaysOfWeek(template.daysOfWeek)}</span>
                                                                </div>
                                                            </div>

                                                            <div className="mgr-request-shift-location">
                                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                                </svg>
                                                                <div>
                                                                    <div className="mgr-request-location-name">{template.locationName}</div>
                                                                    <div className="mgr-request-location-address">{template.locationAddress}</div>
                                                                </div>
                                                            </div>

                                                            <div className="mgr-request-shift-period">
                                                                <strong>Hiệu lực:</strong> {new Date(template.effectiveFrom).toLocaleDateString('vi-VN')} - {new Date(template.effectiveTo).toLocaleDateString('vi-VN')}
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

            <ManagerInfoModal
                isOpen={showManagerInfoModal}
                onClose={() => setShowManagerInfoModal(false)}
                managerId={user?.userId || ''}
            />

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="manager-modal-overlay" onClick={handleCancelConfirm}>
                    <div className="manager-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="manager-modal-header">
                            <h3>Xác nhận tạo ca trực</h3>
                        </div>
                        <div className="manager-modal-body">
                            <p>Bạn có chắc chắn muốn xác nhận tạo {selectedContractGroup?.templateCount} ca trực cho địa điểm <strong>{selectedContractGroup?.locationNames.join(', ')}</strong>?</p>
                            {selectedContractGroup && (
                                <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
                                    <p>• Số bảo vệ cần thiết: {selectedContractGroup.totalMinGuardsRequired} người</p>
                                    <p>• Thời gian: {new Date(selectedContractGroup.templates[0].effectiveFrom).toLocaleDateString('vi-VN')} - {new Date(selectedContractGroup.templates[0].effectiveTo).toLocaleDateString('vi-VN')}</p>
                                </div>
                            )}
                        </div>
                        <div className="manager-modal-footer">
                            <button
                                className="manager-btn-cancel"
                                onClick={handleCancelConfirm}
                                disabled={isSubmitting}
                            >
                                Không
                            </button>
                            <button
                                className="manager-btn-confirm"
                                onClick={handleSubmitCreateShifts}
                                disabled={isSubmitting}
                                style={{
                                    backgroundColor: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="mgr-request-btn-spinner"></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar Notifications */}
            <SnackbarChecked
                isOpen={snackbarChecked.isOpen}
                message={snackbarChecked.message}
                onClose={handleSnackbarCheckedClose}
            />

            <SnackbarFailed
                isOpen={snackbarFailed.isOpen}
                message={snackbarFailed.message}
                onClose={handleSnackbarFailedClose}
            />
        </div>
    );
};

export default ManagerRequest;
