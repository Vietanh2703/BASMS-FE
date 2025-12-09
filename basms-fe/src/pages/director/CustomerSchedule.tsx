import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './CustomerSchedule.css';

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
    shiftStart: string; // datetime
    shiftEnd: string; // datetime
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

const CustomerSchedule = () => {
    const { contractId } = useParams<{ contractId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Data states
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getMonday(new Date()));
    const [customerName, setCustomerName] = useState<string>('');
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [showShiftDetail, setShowShiftDetail] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);

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
            initializeMap();
        }
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

            // Get shifts using contractId directly from URL params
            const shiftsUrl = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/get-all?contractId=${contractId}`;
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

            // Use response.data instead of response.shifts
            setShifts(shiftsData.data || []);

            // Get customer name if available
            if (shiftsData.data && shiftsData.data.length > 0) {
                // You can get customer name from the first shift or from another source
                setCustomerName('Khách hàng');
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
            // Extract date part from shiftDate (format: "2026-01-08T00:00:00")
            const shiftDateStr = shift.shiftDate.split('T')[0];
            return shiftDateStr === dateStr;
        }).sort((a, b) => {
            // Sort by shiftStart datetime
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
        // Use shiftType from API if available
        if (shift.shiftType) {
            return shift.shiftType;
        }
        // Fallback to time-based detection
        const startDate = new Date(shift.shiftStart);
        const hour = startDate.getHours();
        if (hour >= 6 && hour < 12) return 'Sáng';
        if (hour >= 12 && hour < 18) return 'Chiều';
        return 'Tối';
    };

    const getShiftStatusClass = (shift: Shift): string => {
        if (shift.isUnderstaffed) return 'cust-schedule-understaffed';
        if (shift.isFullyStaffed) return 'cust-schedule-fully-staffed';
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

    const initializeMap = () => {
        if (!selectedShift || !mapRef.current) return;

        // Clear previous map
        mapRef.current.innerHTML = '';

        // @ts-ignore - HERE Maps API
        if (window.H) {
            // @ts-ignore
            const platform = new window.H.service.Platform({
                apikey: import.meta.env.VITE_HERE_MAPS_API_KEY || 'YOUR_HERE_API_KEY'
            });

            const defaultLayers = platform.createDefaultLayers();

            // @ts-ignore
            const map = new window.H.Map(
                mapRef.current,
                defaultLayers.vector.normal.map,
                {
                    center: { lat: selectedShift.locationLatitude, lng: selectedShift.locationLongitude },
                    zoom: 15,
                    pixelRatio: window.devicePixelRatio || 1
                }
            );

            // @ts-ignore
            const behavior = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
            // @ts-ignore
            const ui = window.H.ui.UI.createDefault(map, defaultLayers);

            // Add marker
            // @ts-ignore
            const marker = new window.H.map.Marker({
                lat: selectedShift.locationLatitude,
                lng: selectedShift.locationLongitude
            });
            map.addObject(marker);
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
        <div className="cust-schedule-wrapper">
            <aside className={`cust-schedule-sidebar ${isMenuOpen ? 'cust-schedule-sidebar-open' : 'cust-schedule-sidebar-closed'}`}>
                <div className="cust-schedule-sidebar-header">
                    <div className="cust-schedule-sidebar-logo">
                        <div className="cust-schedule-logo-icon">D</div>
                        {isMenuOpen && <span className="cust-schedule-logo-text">Director</span>}
                    </div>
                </div>

                <nav className="cust-schedule-sidebar-nav">
                    <ul className="cust-schedule-nav-list">
                        <li className="cust-schedule-nav-item">
                            <Link to="/director/dashboard" className="cust-schedule-nav-link">
                                <svg className="cust-schedule-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="cust-schedule-nav-item cust-schedule-nav-active">
                            <Link to="/director/customer-list" className="cust-schedule-nav-link">
                                <svg className="cust-schedule-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="cust-schedule-nav-item">
                            <Link to="/director/employee-control" className="cust-schedule-nav-link">
                                <svg className="cust-schedule-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="cust-schedule-nav-item">
                            <Link to="/director/analytics" className="cust-schedule-nav-link">
                                <svg className="cust-schedule-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="cust-schedule-nav-item">
                            <Link to="/director/reports" className="cust-schedule-nav-link">
                                <svg className="cust-schedule-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`cust-schedule-main-content ${isMenuOpen ? 'cust-schedule-content-expanded' : 'cust-schedule-content-collapsed'}`}>
                <header className="cust-schedule-nav-header">
                    <div className="cust-schedule-nav-left">
                        <button className="cust-schedule-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="cust-schedule-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="cust-schedule-nav-right">
                        <button className="cust-schedule-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="cust-schedule-notification-badge">0</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="cust-schedule-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="cust-schedule-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="cust-schedule-user-info">
                                <span className="cust-schedule-user-name">{user?.fullName || 'Director'}</span>
                                <span className="cust-schedule-user-role">Giám đốc điều hành</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="cust-schedule-profile-dropdown">
                                    <div
                                        className={`cust-schedule-dropdown-item cust-schedule-logout-item ${isLoggingOut ? 'cust-schedule-disabled' : ''}`}
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
                                        <svg className="cust-schedule-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="cust-schedule-main">
                    <div className="cust-schedule-page-header">
                        <div>
                            <h1 className="cust-schedule-page-title">Lịch ca trực - {customerName}</h1>
                            <button
                                className="cust-schedule-back-btn"
                                onClick={() => navigate('/director/customer-list')}
                            >
                                ← Quay lại danh sách
                            </button>
                        </div>
                    </div>

                    <div className="cust-schedule-controls">
                        <button className="cust-schedule-nav-btn" onClick={handlePreviousWeek}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <button className="cust-schedule-today-btn" onClick={handleToday}>
                            Hôm nay
                        </button>
                        <div className="cust-schedule-week-label">
                            {formatWeekRange(selectedWeekStart)}
                        </div>
                        <button className="cust-schedule-nav-btn" onClick={handleNextWeek}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>

                    {loading ? (
                        <div className="cust-schedule-loading">
                            <div className="cust-schedule-spinner"></div>
                            <p>Đang tải lịch ca trực...</p>
                        </div>
                    ) : error ? (
                        <div className="cust-schedule-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="cust-schedule-calendar">
                            <div className="cust-schedule-calendar-header">
                                {weekDates.map((date, index) => (
                                    <div
                                        key={index}
                                        className={`cust-schedule-day-header ${isToday(date) ? 'cust-schedule-today' : ''}`}
                                    >
                                        <div className="cust-schedule-day-name">{dayLabels[index]}</div>
                                        <div className="cust-schedule-day-date">
                                            {date.getDate()}/{date.getMonth() + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cust-schedule-calendar-body">
                                {weekDates.map((date, index) => (
                                    <div
                                        key={index}
                                        className={`cust-schedule-day-column ${isToday(date) ? 'cust-schedule-today-column' : ''}`}
                                    >
                                        {getShiftsForDate(date).length === 0 ? (
                                            <div className="cust-schedule-no-shifts">
                                                Không có ca trực
                                            </div>
                                        ) : (
                                            getShiftsForDate(date).map(shift => (
                                                <div
                                                    key={shift.id}
                                                    className={`cust-schedule-shift-card ${getShiftStatusClass(shift)}`}
                                                    onClick={() => handleShiftClick(shift)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="cust-schedule-shift-type">
                                                        {getShiftTypeLabel(shift)}
                                                        {shift.isNightShift && (
                                                            <span className="cust-schedule-night-badge">🌙</span>
                                                        )}
                                                    </div>
                                                    <div className="cust-schedule-shift-time">
                                                        {formatTime(shift.shiftStart)} - {formatTime(shift.shiftEnd)}
                                                    </div>
                                                    <div className="cust-schedule-shift-guards">
                                                        {shift.assignedGuardsCount}/{shift.requiredGuards} bảo vệ
                                                    </div>
                                                    {shift.isUnderstaffed && (
                                                        <div className="cust-schedule-understaffed-warning">
                                                            ⚠️ Thiếu
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
                <div className="cust-schedule-modal-overlay" onClick={cancelLogout}>
                    <div className="cust-schedule-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="cust-schedule-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="cust-schedule-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="cust-schedule-modal-footer">
                            <button className="cust-schedule-btn-cancel" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="cust-schedule-btn-confirm" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showShiftDetail && selectedShift && (
                <div className="cust-schedule-detail-overlay" onClick={closeShiftDetail}>
                    <div className="cust-schedule-detail-box" onClick={(e) => e.stopPropagation()}>
                        <div className="cust-schedule-detail-header">
                            <h2>Chi tiết ca trực</h2>
                            <button className="cust-schedule-close-btn" onClick={closeShiftDetail}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>

                        <div className="cust-schedule-detail-content">
                            <div className="cust-schedule-detail-section">
                                <h3>Thông tin ca trực</h3>
                                <div className="cust-schedule-detail-grid">
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Loại ca:</span>
                                        <span className="cust-schedule-detail-value">{getShiftTypeLabel(selectedShift)}</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Ngày:</span>
                                        <span className="cust-schedule-detail-value">{formatFullDate(selectedShift.shiftDate)}</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Giờ bắt đầu:</span>
                                        <span className="cust-schedule-detail-value">{formatTime(selectedShift.shiftStart)}</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Giờ kết thúc:</span>
                                        <span className="cust-schedule-detail-value">{formatTime(selectedShift.shiftEnd)}</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Tổng thời gian:</span>
                                        <span className="cust-schedule-detail-value">{selectedShift.workDurationHours} giờ</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Trạng thái:</span>
                                        <span className="cust-schedule-detail-value">{getStatusLabel(selectedShift.status)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="cust-schedule-detail-section">
                                <h3>Nhân sự</h3>
                                <div className="cust-schedule-detail-grid">
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Yêu cầu:</span>
                                        <span className="cust-schedule-detail-value">{selectedShift.requiredGuards} bảo vệ</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Đã phân công:</span>
                                        <span className="cust-schedule-detail-value">{selectedShift.assignedGuardsCount} bảo vệ</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Đã xác nhận:</span>
                                        <span className="cust-schedule-detail-value">{selectedShift.confirmedGuardsCount} bảo vệ</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Tỷ lệ nhân sự:</span>
                                        <span className="cust-schedule-detail-value">{selectedShift.staffingPercentage}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="cust-schedule-detail-section">
                                <h3>Địa điểm</h3>
                                <div className="cust-schedule-detail-location">
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Tên:</span>
                                        <span className="cust-schedule-detail-value">{selectedShift.locationName}</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Địa chỉ:</span>
                                        <span className="cust-schedule-detail-value">{selectedShift.locationAddress}</span>
                                    </div>
                                    <div className="cust-schedule-detail-item">
                                        <span className="cust-schedule-detail-label">Tọa độ:</span>
                                        <span className="cust-schedule-detail-value">
                                            {selectedShift.locationLatitude.toFixed(6)}, {selectedShift.locationLongitude.toFixed(6)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedShift.description && (
                                <div className="cust-schedule-detail-section">
                                    <h3>Mô tả</h3>
                                    <p className="cust-schedule-detail-description">{selectedShift.description}</p>
                                </div>
                            )}

                            {selectedShift.specialInstructions && (
                                <div className="cust-schedule-detail-section">
                                    <h3>Hướng dẫn đặc biệt</h3>
                                    <p className="cust-schedule-detail-description">{selectedShift.specialInstructions}</p>
                                </div>
                            )}

                            <div className="cust-schedule-detail-section">
                                <h3>Bản đồ</h3>
                                <div ref={mapRef} className="cust-schedule-map-container"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSchedule;
