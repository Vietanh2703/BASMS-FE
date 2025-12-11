import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ShiftScheduleEdit, { type ShiftScheduleEditHandle } from './ShiftScheduleEdit';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import './CustomerEdit.css';

interface Customer {
    id: string;
    customerCode: string;
    companyName: string;
    contactPersonName: string;
    contactPersonTitle: string;
    email: string;
    phone: string;
    address: string;
    city: string | null;
    district: string | null;
    industry: string | null;
    status: string;
}

interface LocationDetails {
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
}

interface Location {
    id: string;
    locationId: string;
    guardsRequired: number;
    coverageType: string;
    serviceStartDate: string;
    serviceEndDate: string | null;
    isPrimaryLocation: boolean;
    priorityLevel: number;
    autoGenerateShifts: boolean;
    isActive: boolean;
    notes: string | null;
    locationDetails: LocationDetails;
}

interface Document {
    id: string;
    documentType: string;
    documentName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string | null;
    version: string;
    documentDate: string | null;
    createdAt: string;
}

interface Period {
    id: string;
    periodNumber: number;
    periodType: string;
    periodStartDate: string;
    periodEndDate: string;
    isCurrentPeriod: boolean;
    notes: string | null;
    createdAt: string;
}

interface ShiftSchedule {
    id: string;
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
    appliesOnPublicHolidays: boolean;
    appliesOnCustomerHolidays: boolean;
    appliesOnWeekends: boolean;
    skipWhenLocationClosed: boolean;
    requiresArmedGuard: boolean;
    requiresSupervisor: boolean;
    minimumExperienceMonths: number;
    autoGenerateEnabled: boolean;
    generateAdvanceDays: number;
    effectiveFrom: string;
    effectiveTo: string;
    isActive: boolean;
}

interface PublicHoliday {
    id: string;
    contractId: string | null;
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

interface ContractData {
    id: string;
    contractNumber: string;
    contractTitle: string;
    contractType: string;
    serviceScope: string;
    startDate: string;
    endDate: string;
    durationMonths: number;
    status: string;
    coverageModel: string;
    isRenewable: boolean;
    autoRenewal: boolean;
    renewalNoticeDays: number;
    renewalCount: number;
    followsCustomerCalendar: boolean;
    workOnPublicHolidays: boolean;
    workOnCustomerClosedDays: boolean;
    autoGenerateShifts: boolean;
    generateShiftsAdvanceDays: number;
    customer: Customer;
    documents: Document[];
    locations: Location[];
    shiftSchedules: ShiftSchedule[];
    periods: Period[];
    publicHolidays: PublicHoliday[];
    createdBy: string;
    createdAt: string;
    updatedBy: string | null;
    updatedAt: string | null;
}



interface UpdateLocationGpsRequest {
    latitude: number;
    longitude: number;
}

const CustomerEdit = () => {
    const navigate = useNavigate();
    const { customerId, contractId } = useParams<{ customerId: string; contractId: string }>();
    const { user, logout } = useAuth();

    // UI state
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Map refs and state
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<H.Map | null>(null);
    const markerRef = useRef<H.map.Marker | null>(null);
    const shiftScheduleRef = useRef<ShiftScheduleEditHandle>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<H.service.SearchResult[]>([]);

    // Data state
    const [contractData, setContractData] = useState<ContractData | null>(null);
    const [customerData, setCustomerData] = useState<Customer | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    // Snackbar states
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);

    // GPS form state
    const [gpsData, setGpsData] = useState<UpdateLocationGpsRequest>({
        latitude: 0,
        longitude: 0,
    });

    // Update current time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Handle click outside for profile dropdown
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

    // Fetch contract data
    useEffect(() => {
        const fetchContractData = async () => {
            if (!contractId || !customerId) {
                setError('ID hợp đồng hoặc ID khách hàng không hợp lệ');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/${contractId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch contract data');
                }

                const result = await response.json();
                const data: ContractData = result.data;

                setContractData(data);
                setCustomerData(data.customer);
                setLocations(data.locations || []);

                if (data.locations && data.locations.length > 0) {
                    const firstLocation = data.locations[0];
                    setSelectedLocation(firstLocation);

                    const lat = firstLocation.locationDetails.latitude;
                    const lng = firstLocation.locationDetails.longitude;

                    if (lat && lng) {
                        setGpsData({
                            latitude: lat,
                            longitude: lng,
                        });
                    }
                }
            } catch (error) {
                setError('Không thể tải thông tin hợp đồng. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContractData();
    }, [contractId, customerId]);


    // Initialize HERE Maps
    useEffect(() => {
        if (!selectedLocation || !mapContainerRef.current) return;

        const apiKey = import.meta.env.VITE_HERE_MAP_API_KEY;

        // Check if API key exists
        if (!apiKey) {
            setMapError('HERE Maps API key không được cấu hình. Vui lòng kiểm tra file .env');
            return;
        }

        const initMap = () => {
            if (!mapContainerRef.current) {
                setMapError('Không tìm thấy map element');
                return;
            }

            try {
                if (!window.H) {
                    setMapError('HERE Maps library chưa được load');
                    return;
                }

                const platform = new window.H.service.Platform({
                    apikey: apiKey,
                });

                const defaultLayers = platform.createDefaultLayers();

                const center = {
                    lat: gpsData.latitude || 10.8231,
                    lng: gpsData.longitude || 106.6297,
                };

                const map = new window.H.Map(
                    mapContainerRef.current,
                    defaultLayers.vector.normal.map,
                    {
                        center: center,
                        zoom: 15,
                        pixelRatio: window.devicePixelRatio || 1,
                    }
                );

                mapRef.current = map;

                new window.H.mapevents.Behavior(
                    new window.H.mapevents.MapEvents(map)
                );

                window.H.ui.UI.createDefault(map, defaultLayers);

                // Add marker
                const marker = new window.H.map.Marker(center, { volatility: true });
                marker.draggable = true;
                map.addObject(marker);

                markerRef.current = marker;

                // Update coordinates when marker is dragged
                map.addEventListener('dragstart', (ev: H.MapEvent) => {
                    const target = ev.target;
                    if (target instanceof window.H.map.Marker) {
                        const pointer = ev.currentPointer;
                        (target as H.map.Marker).setGeometry(map.screenToGeo(pointer.viewportX, pointer.viewportY));
                    }
                }, false);

                map.addEventListener('dragend', (ev: H.MapEvent) => {
                    const target = ev.target;
                    if (target instanceof window.H.map.Marker) {
                        const position = (target as H.map.Marker).getGeometry();
                        setGpsData({
                            latitude: position.lat,
                            longitude: position.lng,
                        });
                    }
                }, false);

                // Click on map to place marker
                map.addEventListener('tap', (evt: H.MapEvent) => {
                    const coord = map.screenToGeo(
                        evt.currentPointer.viewportX,
                        evt.currentPointer.viewportY
                    );
                    marker.setGeometry(coord);
                    setGpsData({
                        latitude: coord.lat,
                        longitude: coord.lng,
                    });
                });

                // Resize map on window resize
                const handleResize = () => {
                    if (map) {
                        map.getViewPort().resize();
                    }
                };
                window.addEventListener('resize', handleResize);

                setMapError(null);

                // Cleanup function
                return () => {
                    window.removeEventListener('resize', handleResize);
                };
            } catch (error) {
                setMapError(`Lỗi khi khởi tạo bản đồ: ${error}`);
            }
        };

        // Load HERE Maps scripts sequentially
        const loadScripts = async () => {
            // Check if already loaded
            if (window.H) {
                initMap();
                return;
            }

            try {
                // Load CSS first
                if (!document.querySelector('link[href*="mapsjs-ui.css"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
                    document.head.appendChild(link);
                }

                // Load scripts in order
                const scripts = [
                    'https://js.api.here.com/v3/3.1/mapsjs-core.js',
                    'https://js.api.here.com/v3/3.1/mapsjs-service.js',
                    'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
                    'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js',
                ];

                for (const src of scripts) {
                    await new Promise<void>((resolve, reject) => {
                        // Check if script already exists
                        if (document.querySelector(`script[src="${src}"]`)) {
                            resolve();
                            return;
                        }

                        const script = document.createElement('script');
                        script.src = src;
                        script.async = false; // Load in order
                        script.onload = () => {
                            resolve();
                        };
                        script.onerror = () => {
                            reject(new Error(`Failed to load ${src}`));
                        };
                        document.head.appendChild(script);
                    });
                }

                // Wait a bit for scripts to be fully ready
                setTimeout(initMap, 100);
            } catch (error) {
                setMapError('Không thể tải HERE Maps API. Vui lòng kiểm tra kết nối internet.');
            }
        };

        loadScripts();

        return () => {
            if (mapRef.current) {
                try {
                    mapRef.current.dispose();
                } catch (e) {
                    // Silent cleanup
                }
            }
        };
    }, [selectedLocation]);

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

    const handleUpdateGPS = async () => {
        if (!selectedLocation) return;

        const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
        const token = localStorage.getItem('accessToken');

        if (!token) {
            throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        }

        const response = await fetch(`${apiUrl}/locations/${selectedLocation.locationId}/gps`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: gpsData.latitude.toString(),
                longitude: gpsData.longitude.toString(),
            }),
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật vị trí GPS');
        }
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        setError(null);

        try {
            // Save GPS data if location is selected
            if (selectedLocation) {
                await handleUpdateGPS();
            }

            // Save shift schedule if available
            if (shiftScheduleRef.current) {
                const shiftScheduleSaved = await shiftScheduleRef.current.saveShiftSchedule();
                if (!shiftScheduleSaved) {
                    throw new Error('Không thể lưu thông tin lịch ca trực');
                }

                // Save public holidays
                const holidaysSaved = await shiftScheduleRef.current.savePublicHolidays();
                if (!holidaysSaved) {
                    throw new Error('Không thể lưu thông tin ngày lễ');
                }
            }

            // Show success message
            setShowSuccessMessage(true);
            setShowSnackbarSuccess(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.';
            setError(errorMessage);
            setShowSnackbarFailed(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSearchLocation = () => {
        if (!searchQuery.trim() || !window.H) return;

        setIsSaving(true);
        setSearchResults([]);

        const apiKey = import.meta.env.VITE_HERE_MAP_API_KEY;
        const platform = new window.H.service.Platform({
            apikey: apiKey,
        });

        const searchService = platform.getSearchService();

        searchService.geocode(
            {
                q: searchQuery,
            },
            (result: H.service.GeocodeResponse) => {
                setIsSaving(false);
                if (result.items && result.items.length > 0) {
                    setSearchResults(result.items);
                    const firstResult = result.items[0];
                    const { lat, lng } = firstResult.position;

                    if (mapRef.current && markerRef.current) {
                        mapRef.current.setCenter({ lat, lng });
                        mapRef.current.setZoom(17);
                        markerRef.current.setGeometry({ lat, lng });
                    }

                    setGpsData({
                        latitude: lat,
                        longitude: lng,
                    });
                } else {
                    setError('Không tìm thấy địa điểm. Vui lòng thử lại với từ khóa khác.');
                    setTimeout(() => setError(null), 3000);
                }
            },
            () => {
                setIsSaving(false);
                setError('Lỗi khi tìm kiếm địa điểm. Vui lòng thử lại.');
                setTimeout(() => setError(null), 3000);
            }
        );
    };

    const selectSearchResult = (result: H.service.SearchResult) => {
        const { lat, lng } = result.position;

        if (mapRef.current && markerRef.current) {
            mapRef.current.setCenter({ lat, lng });
            mapRef.current.setZoom(17);
            markerRef.current.setGeometry({ lat, lng });
        }

        setGpsData({
            latitude: lat,
            longitude: lng,
        });

        setSearchResults([]);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchLocation();
        }
    };

    return (
        <div className="cust-edit-container">
            {/* Sidebar */}
            <aside className={`cust-edit-sidebar ${isMenuOpen ? 'cust-edit-sidebar-open' : 'cust-edit-sidebar-closed'}`}>
                <div className="cust-edit-sidebar-header">
                    <div className="cust-edit-sidebar-logo">
                        <div className="cust-edit-logo-icon">D</div>
                        {isMenuOpen && <span className="cust-edit-logo-text">Director</span>}
                    </div>
                </div>

                <nav className="cust-edit-sidebar-nav">
                    <ul className="cust-edit-nav-list">
                        <li className="cust-edit-nav-item">
                            <Link to="/director/dashboard" className="cust-edit-nav-link">
                                <svg className="cust-edit-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="cust-edit-nav-item cust-edit-nav-active">
                            <Link to="/director/customer-list" className="cust-edit-nav-link">
                                <svg className="cust-edit-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="cust-edit-nav-item">
                            <Link to="/director/employee-control" className="cust-edit-nav-link">
                                <svg className="cust-edit-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="cust-edit-nav-item">
                            <Link to="/director/analytics" className="cust-edit-nav-link">
                                <svg className="cust-edit-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="cust-edit-nav-item">
                            <Link to="/director/reports" className="cust-edit-nav-link">
                                <svg className="cust-edit-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`cust-edit-main-content ${isMenuOpen ? 'cust-edit-content-expanded' : 'cust-edit-content-collapsed'}`}>
                {/* Navigation Header */}
                <header className="cust-edit-nav-header">
                    <div className="cust-edit-nav-left">
                        <button className="cust-edit-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="cust-edit-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="cust-edit-nav-right">
                        <button className="cust-edit-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="cust-edit-notification-badge">0</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="cust-edit-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="cust-edit-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="cust-edit-user-info">
                                <span className="cust-edit-user-name">{user?.fullName || 'Director'}</span>
                                <span className="cust-edit-user-role">Giám đốc điều hành</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="cust-edit-profile-dropdown">
                                    <div
                                        className={`cust-edit-dropdown-item cust-edit-logout-item ${isLoggingOut ? 'cust-edit-disabled' : ''}`}
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
                                        <svg className="cust-edit-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="cust-edit-main">
                    {/* Page Header */}
                    <div className="cust-edit-page-header">
                        <div className="cust-edit-header-left">
                            <button
                                className="cust-edit-back-btn"
                                onClick={() => navigate(`/director/customer/${customerId}/${contractId}`)}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                                Quay lại
                            </button>
                            <h1 className="cust-edit-page-title">Cập nhật thông tin hợp đồng</h1>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="cust-edit-loading">
                            <div className="cust-edit-loading-text">Đang tải thông tin...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="cust-edit-error">
                            <div className="cust-edit-error-text">{error}</div>
                        </div>
                    )}

                    {/* Success Message */}
                    {showSuccessMessage && (
                        <div className="cust-edit-success">
                            <div className="cust-edit-success-text">Cập nhật thành công!</div>
                        </div>
                    )}

                    {/* Form Content */}
                    {!isLoading && customerData && contractData && (
                        <div className="cust-edit-content">
                        {/* Customer Information Display (Read-only) */}
                        <div className="cust-edit-section">
                            <h3 className="cust-edit-section-title">Thông tin khách hàng</h3>
                            <div className="cust-edit-form-grid">
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Tên công ty</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={customerData.companyName}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Địa chỉ</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={customerData.address}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* GPS Location Section */}
                        {locations.length > 0 && (
                            <div className="cust-edit-section">
                                <h3 className="cust-edit-section-title">Vị trí GPS địa điểm</h3>

                                {/* Location Selector */}
                                {locations.length > 1 && (
                                    <div className="cust-edit-form-group">
                                        <label className="cust-edit-label">Chọn địa điểm</label>
                                        <select
                                            className="cust-edit-input"
                                            value={selectedLocation?.id || ''}
                                            onChange={(e) => {
                                                const location = locations.find(loc => loc.id === e.target.value);
                                                if (location) {
                                                    setSelectedLocation(location);
                                                    const lat = location.locationDetails.latitude;
                                                    const lng = location.locationDetails.longitude;
                                                    if (lat && lng) {
                                                        setGpsData({ latitude: lat, longitude: lng });
                                                        if (mapRef.current && markerRef.current) {
                                                            mapRef.current.setCenter({ lat, lng });
                                                            markerRef.current.setGeometry({ lat, lng });
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>
                                                    {loc.locationDetails.locationName} - {loc.locationDetails.address}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Map Search */}
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Tìm kiếm địa điểm</label>
                                    <div className="cust-edit-search-container">
                                        <input
                                            type="text"
                                            className="cust-edit-input cust-edit-map-search-input"
                                            placeholder="Nhập tên địa điểm, đường, quận/huyện, thành phố..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={handleSearchKeyPress}
                                        />
                                        <button
                                            type="button"
                                            className="cust-edit-search-btn"
                                            onClick={handleSearchLocation}
                                            disabled={isSaving}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                            </svg>
                                            {isSaving ? 'Đang tìm...' : 'Tìm kiếm'}
                                        </button>
                                    </div>
                                    <p className="cust-edit-search-hint">
                                        Gợi ý: Bạn có thể nhập tên đường, quận/huyện hoặc địa chỉ đầy đủ để tìm kiếm.
                                    </p>
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 1 && (
                                    <div className="cust-edit-search-results">
                                        <p className="cust-edit-results-title">Kết quả tìm kiếm ({searchResults.length})</p>
                                        <div className="cust-edit-results-list">
                                            {searchResults.map((result, index) => (
                                                <div
                                                    key={index}
                                                    className="cust-edit-result-item"
                                                    onClick={() => selectSearchResult(result)}
                                                >
                                                    <div className="cust-edit-result-title">
                                                        {result.title || result.address?.label}
                                                    </div>
                                                    <div className="cust-edit-result-address">
                                                        {result.address?.label}
                                                    </div>
                                                    <div className="cust-edit-result-coords">
                                                        Lat: {result.position.lat.toFixed(6)}, Lng: {result.position.lng.toFixed(6)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* HERE Map */}
                                <div className="cust-edit-map-container">
                                    {mapError ? (
                                        <div className="cust-edit-map-error">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                            </svg>
                                            <div className="cust-edit-map-error-title">Không thể tải bản đồ</div>
                                            <div className="cust-edit-map-error-message">{mapError}</div>
                                            <button
                                                className="cust-edit-map-retry-btn"
                                                onClick={() => {
                                                    setMapError(null);
                                                    window.location.reload();
                                                }}
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    ) : (
                                        <div ref={mapContainerRef} className="cust-edit-map"></div>
                                    )}
                                </div>

                                {/* GPS Coordinates Display */}
                                <div className="cust-edit-gps-info">
                                    <div className="cust-edit-gps-item">
                                        <span className="cust-edit-gps-label">Vĩ độ (Latitude):</span>
                                        <span className="cust-edit-gps-value">{gpsData.latitude.toFixed(6)}</span>
                                    </div>
                                    <div className="cust-edit-gps-item">
                                        <span className="cust-edit-gps-label">Kinh độ (Longitude):</span>
                                        <span className="cust-edit-gps-value">{gpsData.longitude.toFixed(6)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contract Information Display */}
                        <div className="cust-edit-section">
                            <h3 className="cust-edit-section-title">Thông tin hợp đồng</h3>
                            <div className="cust-edit-form-grid">
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Số hợp đồng</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={contractData.contractNumber}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Tên hợp đồng</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={contractData.contractTitle}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Loại hợp đồng</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={contractData.contractType === 'long_term' ? 'Dài hạn' : 'Ngắn hạn'}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Trạng thái</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={contractData.status === 'draft' ? 'Bản nháp' : contractData.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Ngày bắt đầu</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={new Date(contractData.startDate).toLocaleDateString('vi-VN')}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="cust-edit-form-group">
                                    <label className="cust-edit-label">Ngày kết thúc</label>
                                    <input
                                        type="text"
                                        className="cust-edit-input"
                                        value={new Date(contractData.endDate).toLocaleDateString('vi-VN')}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>
                        </div>

                            {/* Shift Schedule Section */}
                            {contractId && (
                                <ShiftScheduleEdit
                                    ref={shiftScheduleRef}
                                    contractId={contractId}
                                />
                            )}

                            {/* Action Buttons */}
                        <div className="cust-edit-actions">
                            <button
                                className="cust-edit-btn cust-edit-btn-cancel"
                                onClick={() => navigate(`/director/customer/${customerId}/${contractId}`)}
                                disabled={isSaving}
                            >
                                Hủy
                            </button>
                            <button
                                className="cust-edit-btn cust-edit-btn-save"
                                onClick={handleSaveAll}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                    )}
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="cust-edit-modal-overlay" onClick={cancelLogout}>
                    <div className="cust-edit-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="cust-edit-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="cust-edit-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className="cust-edit-modal-footer">
                            <button className="cust-edit-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="cust-edit-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar Notifications */}
            <SnackbarChecked
                message="Lưu thay đổi thành công"
                isOpen={showSnackbarSuccess}
                duration={4000}
                onClose={() => setShowSnackbarSuccess(false)}
            />
            <SnackbarFailed
                message="Lưu thay đổi thất bại. Vui lòng thử lại"
                isOpen={showSnackbarFailed}
                duration={4000}
                onClose={() => setShowSnackbarFailed(false)}
            />
        </div>
    );
};

export default CustomerEdit;
