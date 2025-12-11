/// <reference path="../../here-maps.d.ts" />
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './ManagerShiftDetail.css';

interface Shift {
    id: string;
    shiftTemplateId: string;
    locationId: string;
    locationName: string;
    locationAddress: string;
    locationLatitude: number;
    locationLongitude: number;
    contractId: string;
    managerId: string;
    shiftDate: string;
    shiftDay: number;
    shiftMonth: number;
    shiftYear: number;
    shiftQuarter: number;
    shiftWeek: number;
    dayOfWeek: number;
    shiftEndDate: string;
    shiftStart: string;
    shiftEnd: string;
    totalDurationMinutes: number;
    workDurationMinutes: number;
    workDurationHours: number;
    breakDurationMinutes: number;
    paidBreakMinutes: number;
    unpaidBreakMinutes: number;
    requiredGuards: number;
    assignedGuardsCount: number;
    confirmedGuardsCount: number;
    checkedInGuardsCount: number;
    completedGuardsCount: number;
    isFullyStaffed: boolean;
    isUnderstaffed: boolean;
    isOverstaffed: boolean;
    staffingPercentage: number;
    isRegularWeekday: boolean;
    isSaturday: boolean;
    isSunday: boolean;
    isPublicHoliday: boolean;
    isTetHoliday: boolean;
    isNightShift: boolean;
    nightHours: number;
    dayHours: number;
    shiftType: string;
    isMandatory: boolean;
    isCritical: boolean;
    isTrainingShift: boolean;
    requiresArmedGuard: boolean;
    requiresApproval: boolean;
    approvedBy: string | null;
    approvedAt: string | null;
    approvalStatus: string;
    rejectionReason: string | null;
    status: string;
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    description: string | null;
    specialInstructions: string | null;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
    version: number;
}

const ManagerShiftDetail = () => {
    const { contractId } = useParams<{ contractId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getMonday(new Date()));
    const [locationName, setLocationName] = useState<string>('');
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [showShiftDetail, setShowShiftDetail] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const mapInstanceRef = useRef<H.Map | null>(null);

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
        if (contractId) {
            fetchShifts();
        }
    }, [contractId, selectedWeekStart]);

    useEffect(() => {
        if (showShiftDetail && selectedShift && mapRef.current) {
            loadHereMapsAndInitialize();
        }

        return () => {
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.dispose();
                    mapInstanceRef.current = null;
                } catch (e) {
                    // Silent cleanup
                }
            }
        };
    }, [showShiftDetail, selectedShift]);

    function getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function getWeekDates(startDate: Date): Date[] {
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    const fetchShifts = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            if (!contractId) {
                throw new Error('Không tìm thấy ID hợp đồng');
            }

            // includeAll=true to get past shifts as well
            const shiftsUrl = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/get-all?contractId=${contractId}&includeAll=true`;
            const shiftsResponse = await fetch(shiftsUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!shiftsResponse.ok) {
                throw new Error('Không thể tải danh sách ca trực');
            }

            const shiftsData = await shiftsResponse.json();

            setShifts(shiftsData.data || []);

            if (shiftsData.data && shiftsData.data.length > 0) {
                setLocationName(shiftsData.data[0].locationName || 'Địa điểm');
            }
        } catch (err) {
            console.error('Error fetching shifts:', err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
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

    const formatWeekRange = (startDate: Date): string => {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        return `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()} - ${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
    };

    const handlePreviousWeek = () => {
        const newDate = new Date(selectedWeekStart);
        newDate.setDate(selectedWeekStart.getDate() - 7);
        setSelectedWeekStart(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(selectedWeekStart);
        newDate.setDate(selectedWeekStart.getDate() + 7);
        setSelectedWeekStart(newDate);
    };

    const handleToday = () => {
        setSelectedWeekStart(getMonday(new Date()));
    };

    const getShiftsForDate = (date: Date): Shift[] => {
        const dateStr = date.toISOString().split('T')[0];
        return shifts.filter(shift => {
            const shiftDateStr = shift.shiftDate.split('T')[0];
            return shiftDateStr === dateStr;
        }).sort((a, b) => {
            return new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime();
        });
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const formatTime = (datetime: string): string => {
        const date = new Date(datetime);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const getShiftTypeLabel = (shift: Shift): string => {
        if (shift.shiftType) {
            return shift.shiftType;
        }
        const startDate = new Date(shift.shiftStart);
        const hour = startDate.getHours();
        if (hour >= 6 && hour < 12) return 'Sáng';
        if (hour >= 12 && hour < 18) return 'Chiều';
        return 'Tối';
    };

    const getShiftStatusClass = (shift: Shift): string => {
        if (shift.isUnderstaffed) return 'mgr-shift-detail-understaffed';
        if (shift.isFullyStaffed) return 'mgr-shift-detail-fully-staffed';
        return '';
    };

    const handleShiftClick = (shift: Shift) => {
        setSelectedShift(shift);
        setShowShiftDetail(true);
    };

    const closeShiftDetail = () => {
        setShowShiftDetail(false);
        setSelectedShift(null);
    };

    const loadHereMapsAndInitialize = async () => {
        if (!selectedShift || !mapRef.current) return;

        const apiKey = import.meta.env.VITE_HERE_MAP_API_KEY;

        if (!apiKey) {
            setMapError('HERE Maps API key không được cấu hình. Vui lòng kiểm tra file .env');
            return;
        }

        setMapLoading(true);
        setMapError(null);

        try {
            if (window.H) {
                initializeMap();
                setMapLoading(false);
                return;
            }

            if (!document.querySelector('link[href*="mapsjs-ui.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
                document.head.appendChild(link);
            }

            const scripts = [
                'https://js.api.here.com/v3/3.1/mapsjs-core.js',
                'https://js.api.here.com/v3/3.1/mapsjs-service.js',
                'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
                'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js',
            ];

            for (const src of scripts) {
                await new Promise<void>((resolve, reject) => {
                    if (document.querySelector(`script[src="${src}"]`)) {
                        resolve();
                        return;
                    }

                    const script = document.createElement('script');
                    script.src = src;
                    script.async = false;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`Failed to load ${src}`));
                    document.head.appendChild(script);
                });
            }

            setTimeout(() => {
                initializeMap();
                setMapLoading(false);
            }, 100);
        } catch (error) {
            setMapError('Không thể tải HERE Maps API. Vui lòng kiểm tra kết nối internet.');
            setMapLoading(false);
        }
    };

    const initializeMap = () => {
        if (!selectedShift || !mapRef.current) return;

        mapRef.current.innerHTML = '';

        if (!window.H) {
            setMapError('HERE Maps library chưa được load');
            return;
        }

        try {
            const apiKey = import.meta.env.VITE_HERE_MAP_API_KEY;
            const platform = new window.H.service.Platform({
                apikey: apiKey,
            });

            const defaultLayers = platform.createDefaultLayers();

            const center = {
                lat: selectedShift.locationLatitude,
                lng: selectedShift.locationLongitude,
            };

            const map = new window.H.Map(
                mapRef.current,
                defaultLayers.vector.normal.map,
                {
                    center: center,
                    zoom: 15,
                    pixelRatio: window.devicePixelRatio || 1,
                }
            );

            mapInstanceRef.current = map;

            new window.H.mapevents.Behavior(
                new window.H.mapevents.MapEvents(map)
            );

            window.H.ui.UI.createDefault(map, defaultLayers);

            const marker = new window.H.map.Marker(center);
            map.addObject(marker);

            setMapError(null);
        } catch (error) {
            setMapError(`Lỗi khi khởi tạo bản đồ: ${error}`);
        }
    };

    const formatFullDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getStatusLabel = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'Scheduled': 'Đã lên lịch',
            'InProgress': 'Đang diễn ra',
            'Completed': 'Hoàn thành',
            'Cancelled': 'Đã hủy'
        };
        return statusMap[status] || status;
    };

    const weekDates = getWeekDates(selectedWeekStart);
    const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    return (
        <div className="mgr-shift-detail-wrapper">
            <aside className={`mgr-shift-detail-sidebar ${isMenuOpen ? 'mgr-shift-detail-sidebar-open' : 'mgr-shift-detail-sidebar-closed'}`}>
                <div className="mgr-shift-detail-sidebar-header">
                    <div className="mgr-shift-detail-sidebar-logo">
                        <div className="mgr-shift-detail-logo-icon">B</div>
                        {isMenuOpen && <span className="mgr-shift-detail-logo-text">BASMS</span>}
                    </div>
                </div>

                <nav className="mgr-shift-detail-sidebar-nav">
                    <ul className="mgr-shift-detail-nav-list">
                        <li className="mgr-shift-detail-nav-item">
                            <Link to="/manager/dashboard" className="mgr-shift-detail-nav-link">
                                <svg className="mgr-shift-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="mgr-shift-detail-nav-item">
                            <Link to="/manager/guard-list" className="mgr-shift-detail-nav-link">
                                <svg className="mgr-shift-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân viên</span>}
                            </Link>
                        </li>
                        <li className="mgr-shift-detail-nav-item">
                            <Link to="/manager/request" className="mgr-shift-detail-nav-link">
                                <svg className="mgr-shift-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm16-2c1.11 0 2 .89 2 2v11c0 1.11-.89 2-2 2H4c-1.11 0-2-.89-2-2l.01-11c0-1.11.88-2 1.99-2h4V4c0-1.11.89-2 2-2h4c1.11 0 2 .89 2 2v2h4z"/>
                                </svg>
                                {isMenuOpen && <span>Yêu cầu phân công</span>}
                            </Link>
                        </li>
                        <li className="mgr-shift-detail-nav-item mgr-shift-detail-nav-active">
                            <Link to="/manager/shift-assignment" className="mgr-shift-detail-nav-link">
                                <svg className="mgr-shift-detail-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                                {isMenuOpen && <span>Phân công ca làm</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`mgr-shift-detail-main-content ${isMenuOpen ? 'mgr-shift-detail-content-expanded' : 'mgr-shift-detail-content-collapsed'}`}>
                <header className="mgr-shift-detail-nav-header">
                    <div className="mgr-shift-detail-nav-left">
                        <button className="mgr-shift-detail-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="mgr-shift-detail-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="mgr-shift-detail-nav-right">
                        <button className="mgr-shift-detail-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="mgr-shift-detail-notification-badge">5</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="mgr-shift-detail-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="mgr-shift-detail-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'M'}</span>
                            </div>
                            <div className="mgr-shift-detail-user-info">
                                <span className="mgr-shift-detail-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'Manager User'}
                                </span>
                                <span className="mgr-shift-detail-user-role">Quản lý</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="mgr-shift-detail-profile-dropdown">
                                    <div
                                        className={`mgr-shift-detail-dropdown-item mgr-shift-detail-logout-item ${isLoggingOut ? 'mgr-shift-detail-disabled' : ''}`}
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
                                        <svg className="mgr-shift-detail-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mgr-shift-detail-main">
                    <div className="mgr-shift-detail-page-header">
                        <div>
                            <h1 className="mgr-shift-detail-page-title">Lịch ca trực - {locationName}</h1>
                            <button
                                className="mgr-shift-detail-back-btn"
                                onClick={() => navigate('/manager/shift-assignment')}
                            >
                                ← Quay lại danh sách
                            </button>
                        </div>
                    </div>

                    <div className="mgr-shift-detail-controls">
                        <button className="mgr-shift-detail-nav-btn" onClick={handlePreviousWeek}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <button className="mgr-shift-detail-today-btn" onClick={handleToday}>
                            Hôm nay
                        </button>
                        <div className="mgr-shift-detail-week-label">
                            {formatWeekRange(selectedWeekStart)}
                        </div>
                        <button className="mgr-shift-detail-nav-btn" onClick={handleNextWeek}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>

                    {loading ? (
                        <div className="mgr-shift-detail-loading">
                            <div className="mgr-shift-detail-spinner"></div>
                            <p>Đang tải lịch ca trực...</p>
                        </div>
                    ) : error ? (
                        <div className="mgr-shift-detail-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="mgr-shift-detail-calendar">
                            <div className="mgr-shift-detail-calendar-header">
                                {weekDates.map((date, index) => (
                                    <div
                                        key={index}
                                        className={`mgr-shift-detail-day-header ${isToday(date) ? 'mgr-shift-detail-today' : ''}`}
                                    >
                                        <div className="mgr-shift-detail-day-name">{dayLabels[index]}</div>
                                        <div className="mgr-shift-detail-day-date">
                                            {date.getDate()}/{date.getMonth() + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mgr-shift-detail-calendar-body">
                                {weekDates.map((date, index) => (
                                    <div
                                        key={index}
                                        className={`mgr-shift-detail-day-column ${isToday(date) ? 'mgr-shift-detail-today-column' : ''}`}
                                    >
                                        {getShiftsForDate(date).length === 0 ? (
                                            <div className="mgr-shift-detail-no-shifts">
                                                Không có ca trực
                                            </div>
                                        ) : (
                                            getShiftsForDate(date).map(shift => (
                                                <div
                                                    key={shift.id}
                                                    className={`mgr-shift-detail-shift-card ${getShiftStatusClass(shift)}`}
                                                    onClick={() => handleShiftClick(shift)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="mgr-shift-detail-shift-type">
                                                        {getShiftTypeLabel(shift)}
                                                    </div>
                                                    <div className="mgr-shift-detail-shift-time">
                                                        {formatTime(shift.shiftStart)} - {formatTime(shift.shiftEnd)}
                                                    </div>
                                                    <div className="mgr-shift-detail-shift-guards">
                                                        {shift.assignedGuardsCount}/{shift.requiredGuards} bảo vệ
                                                    </div>
                                                    {shift.isUnderstaffed && (
                                                        <div className="mgr-shift-detail-understaffed-warning">
                                                            Thiếu
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showLogoutModal && (
                <div className="mgr-shift-detail-modal-overlay" onClick={cancelLogout}>
                    <div className="mgr-shift-detail-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-shift-detail-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="mgr-shift-detail-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="mgr-shift-detail-modal-footer">
                            <button className="mgr-shift-detail-btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="mgr-shift-detail-btn-confirm" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showShiftDetail && selectedShift && (
                <div className="mgr-shift-detail-detail-overlay" onClick={closeShiftDetail}>
                    <div className="mgr-shift-detail-detail-box" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-shift-detail-detail-header">
                            <h2>Chi tiết ca trực</h2>
                            <button className="mgr-shift-detail-close-btn" onClick={closeShiftDetail}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>

                        <div className="mgr-shift-detail-detail-content">
                            <div className="mgr-shift-detail-detail-section">
                                <h3>Thông tin ca trực</h3>
                                <div className="mgr-shift-detail-detail-grid">
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Loại ca:</span>
                                        <span className="mgr-shift-detail-detail-value">{getShiftTypeLabel(selectedShift)}</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Ngày:</span>
                                        <span className="mgr-shift-detail-detail-value">{formatFullDate(selectedShift.shiftDate)}</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Giờ bắt đầu:</span>
                                        <span className="mgr-shift-detail-detail-value">{formatTime(selectedShift.shiftStart)}</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Giờ kết thúc:</span>
                                        <span className="mgr-shift-detail-detail-value">{formatTime(selectedShift.shiftEnd)}</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Tổng thời gian:</span>
                                        <span className="mgr-shift-detail-detail-value">{selectedShift.workDurationHours} giờ</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Trạng thái:</span>
                                        <span className="mgr-shift-detail-detail-value">{getStatusLabel(selectedShift.status)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mgr-shift-detail-detail-section">
                                <h3>Nhân sự</h3>
                                <div className="mgr-shift-detail-detail-grid">
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Yêu cầu:</span>
                                        <span className="mgr-shift-detail-detail-value">{selectedShift.requiredGuards} bảo vệ</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Đã phân công:</span>
                                        <span className="mgr-shift-detail-detail-value">{selectedShift.assignedGuardsCount} bảo vệ</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Đã xác nhận:</span>
                                        <span className="mgr-shift-detail-detail-value">{selectedShift.confirmedGuardsCount} bảo vệ</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Tỷ lệ nhân sự:</span>
                                        <span className="mgr-shift-detail-detail-value">{selectedShift.staffingPercentage}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mgr-shift-detail-detail-section">
                                <h3>Địa điểm</h3>
                                <div className="mgr-shift-detail-detail-location">
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Tên:</span>
                                        <span className="mgr-shift-detail-detail-value">{selectedShift.locationName}</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Địa chỉ:</span>
                                        <span className="mgr-shift-detail-detail-value">{selectedShift.locationAddress}</span>
                                    </div>
                                    <div className="mgr-shift-detail-detail-item">
                                        <span className="mgr-shift-detail-detail-label">Tọa độ:</span>
                                        <span className="mgr-shift-detail-detail-value">
                                            {selectedShift.locationLatitude.toFixed(6)}, {selectedShift.locationLongitude.toFixed(6)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedShift.description && (
                                <div className="mgr-shift-detail-detail-section">
                                    <h3>Mô tả</h3>
                                    <p className="mgr-shift-detail-detail-description">{selectedShift.description}</p>
                                </div>
                            )}

                            {selectedShift.specialInstructions && (
                                <div className="mgr-shift-detail-detail-section">
                                    <h3>Hướng dẫn đặc biệt</h3>
                                    <p className="mgr-shift-detail-detail-description">{selectedShift.specialInstructions}</p>
                                </div>
                            )}

                            <div className="mgr-shift-detail-detail-section">
                                <h3>Bản đồ</h3>
                                {mapError ? (
                                    <div className="mgr-shift-detail-map-error">
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                        </svg>
                                        <div className="mgr-shift-detail-map-error-message">{mapError}</div>
                                    </div>
                                ) : mapLoading ? (
                                    <div className="mgr-shift-detail-map-loading">
                                        <div className="mgr-shift-detail-spinner"></div>
                                        <p>Đang tải bản đồ...</p>
                                    </div>
                                ) : (
                                    <div ref={mapRef} className="mgr-shift-detail-map-container"></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerShiftDetail;
