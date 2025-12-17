/// <reference path="../../here-maps.d.ts" />
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
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

interface UnassignedGroup {
    representativeShiftId: string;
    shiftTemplateId: string;
    contractId: string;
    templateName: string;
    templateCode: string;
    contractNumber: string | null;
    contractTitle: string | null;
    locationId: string;
    locationName: string;
    locationAddress: string;
    shiftStart: string;
    shiftEnd: string;
    workDurationHours: number;
    unassignedShiftCount: number;
    requiredGuards: number;
    nearestShiftDate: string;
    farthestShiftDate: string;
    isNightShift: boolean;
    shiftType: string;
}

interface Team {
    teamId: string;
    teamCode: string;
    teamName: string;
    managerId: string;
    managerName: string;
    specialization: string;
    currentMemberCount: number;
    minMembers: number;
    maxMembers: number;
    isActive: boolean;
    createdAt: string;
}

interface AssignedGuard {
    guardId: string;
    employeeCode: string;
    fullName: string;
    avatarUrl: string;
    email: string;
    phoneNumber: string;
    gender: string;
    employmentStatus: string;
    role: string;
    isLeader: boolean;
    assignmentId: string;
    assignmentStatus: string;
    assignmentType: string;
    assignedAt: string;
    confirmedAt: string | null;
    certificationLevel: string;
}

interface ShiftGuardsResponse {
    success: boolean;
    data: {
        shiftId: string;
        teamId: string;
        teamName: string;
        guards: AssignedGuard[];
        totalGuards: number;
    };
}

interface AttendanceStatus {
    id: string;
    shiftAssignmentId: string;
    guardId: string;
    shiftId: string;
    checkInTime: string | null;
    checkInLatitude: number | null;
    checkInLongitude: number | null;
    checkInLocationAccuracy: number | null;
    checkInDistanceFromSite: number | null;
    checkInDeviceId: string | null;
    checkInFaceImageUrl: string | null;
    checkInFaceMatchScore: number | null;
    checkOutTime: string | null;
    checkOutLatitude: number | null;
    checkOutLongitude: number | null;
    checkOutLocationAccuracy: number | null;
    checkOutDistanceFromSite: number | null;
    checkOutDeviceId: string | null;
    checkOutFaceImageUrl: string | null;
    checkOutFaceMatchScore: number | null;
    scheduledStartTime: string;
    scheduledEndTime: string;
    actualWorkDurationMinutes: number | null;
    breakDurationMinutes: number;
    totalHours: number | null;
    status: string;
    isLate: boolean;
    isEarlyLeave: boolean;
    hasOvertime: boolean;
    isIncomplete: boolean;
    isVerified: boolean;
    lateMinutes: number | null;
    earlyLeaveMinutes: number | null;
    overtimeMinutes: number | null;
    verifiedBy: string | null;
    verifiedAt: string | null;
    verificationStatus: string;
    notes: string | null;
    managerNotes: string | null;
    autoDetected: boolean;
    flagsForReview: boolean;
    flagReason: string | null;
    createdAt: string;
    updatedAt: string | null;
}

interface AttendanceResponse {
    success: boolean;
    data: AttendanceStatus;
}

interface ContractDatesResponse {
    success: boolean;
    data: {
        startDate: string;
        endDate: string;
    };
}

interface GuardIssue {
    id: string;
    shiftId: string | null;
    guardId: string;
    issueType: string;
    reason: string;
    startDate: string;
    endDate: string;
    issueDate: string;
    evidenceFileUrl: string;
    totalShiftsAffected: number;
    totalGuardsAffected: number;
    createdAt: string;
    createdBy: string;
}

interface GuardIssuesResponse {
    success: boolean;
    data: {
        guardId: string;
        issues: GuardIssue[];
        totalIssues: number;
    };
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
    const [assignedGuards, setAssignedGuards] = useState<AssignedGuard[]>([]);
    const [loadingGuards, setLoadingGuards] = useState(false);
    const [guardAttendances, setGuardAttendances] = useState<Map<string, AttendanceStatus>>(new Map());
    const [showAttendanceDetailModal, setShowAttendanceDetailModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceStatus | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const mapInstanceRef = useRef<H.Map | null>(null);

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [unassignedGroups, setUnassignedGroups] = useState<UnassignedGroup[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<UnassignedGroup | null>(null);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [assignmentType, setAssignmentType] = useState<'REGULAR' | 'ONEDAY'>('REGULAR');
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');

    // Leave confirmation modal states
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [selectedGuardForLeave, setSelectedGuardForLeave] = useState<AssignedGuard | null>(null);
    const [leaveFromDate, setLeaveFromDate] = useState('');
    const [leaveToDate, setLeaveToDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveType, setLeaveType] = useState<'SICK_LEAVE' | 'MATERNITY_LEAVE' | 'LONG_TERM_LEAVE'>('SICK_LEAVE');
    const [leaveFile, setLeaveFile] = useState<File | null>(null);
    const [leaveFilePreview, setLeaveFilePreview] = useState<string | null>(null);
    const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
    const [contractStartDate, setContractStartDate] = useState<string | null>(null);
    const [contractEndDate, setContractEndDate] = useState<string | null>(null);
    const [fromDateError, setFromDateError] = useState<string>('');
    const [toDateError, setToDateError] = useState<string>('');
    const [loadingContractInfo, setLoadingContractInfo] = useState(false);

    // Guard issues states
    const [guardIssuesMap, setGuardIssuesMap] = useState<Map<string, GuardIssue[]>>(new Map());
    const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<GuardIssue | null>(null);

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
        // Use local date string to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

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

    const handleShiftClick = async (shift: Shift) => {
        setSelectedShift(shift);
        setShowShiftDetail(true);
        await fetchAssignedGuards(shift.id);
    };

    const closeShiftDetail = () => {
        setShowShiftDetail(false);
        setSelectedShift(null);
        setAssignedGuards([]);
    };

    const fetchGuardIssues = async (guardId: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/guards/${guardId}/shift-issues`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data: GuardIssuesResponse = await response.json();
                if (data.success && data.data.issues.length > 0) {
                    setGuardIssuesMap(prev => new Map(prev).set(guardId, data.data.issues));
                }
            }
        } catch (err) {
            console.error(`Error fetching issues for guard ${guardId}:`, err);
        }
    };

    const fetchAssignedGuards = async (shiftId: string) => {
        try {
            setLoadingGuards(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('Không tìm thấy token xác thực');

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/${shiftId}/guards`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                // Nếu shift chưa có guards, trả về empty array
                setAssignedGuards([]);
                return;
            }

            const data: ShiftGuardsResponse = await response.json();
            const guards = data.data?.guards || [];
            setAssignedGuards(guards);

            // Fetch attendance status for each guard
            await fetchGuardsAttendances(guards, shiftId);

            // Fetch issues for cancelled guards
            await Promise.all(
                guards
                    .filter(guard => guard.assignmentStatus === 'CANCELLED')
                    .map(guard => fetchGuardIssues(guard.guardId))
            );
        } catch (err) {
            console.error('Error fetching assigned guards:', err);
            setAssignedGuards([]);
        } finally {
            setLoadingGuards(false);
        }
    };

    const fetchGuardsAttendances = async (guards: AssignedGuard[], shiftId: string) => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const attendanceMap = new Map<string, AttendanceStatus>();

        await Promise.all(
            guards.map(async (guard) => {
                try {
                    const url = `${import.meta.env.VITE_API_SHIFTS_URL}/attendances/status?guardId=${guard.guardId}&shiftId=${shiftId}`;
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    });

                    if (response.ok) {
                        const data: AttendanceResponse = await response.json();
                        attendanceMap.set(guard.guardId, data.data);
                    }
                } catch (err) {
                    console.error(`Error fetching attendance for guard ${guard.guardId}:`, err);
                }
            })
        );

        setGuardAttendances(attendanceMap);
    };

    const handleOpenAttendanceDetail = async (guardId: string) => {
        if (!selectedShift) return;

        const attendance = guardAttendances.get(guardId);
        if (attendance) {
            setSelectedAttendance(attendance);
            setShowShiftDetail(false);
            setShowAttendanceDetailModal(true);
        }
    };

    const handleCloseAttendanceDetail = () => {
        setShowAttendanceDetailModal(false);
        setSelectedAttendance(null);
        setShowShiftDetail(true);
    };

    const getAttendanceStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            'PENDING': 'Chưa điểm danh',
            'CHECKED_IN': 'Bắt đầu ca',
            'CHECKED-IN': 'Bắt đầu ca',
            'CHECKED_OUT': 'Kết thúc ca',
            'CHECKED-OUT': 'Kết thúc ca',
            'ABSENT': 'Vắng mặt'
        };
        return labels[status] || status;
    };

    const getAttendanceStatusColor = (status: string): string => {
        const colors: { [key: string]: string } = {
            'PENDING': '#f59e0b',
            'CHECKED_IN': '#3b82f6',
            'CHECKED-IN': '#3b82f6',
            'CHECKED_OUT': '#10b981',
            'CHECKED-OUT': '#10b981',
            'ABSENT': '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const formatPhoneNumber = (phone: string): string => {
        return phone.replace(/^\+84/, '0');
    };

    const getRoleLabel = (role: string): string => {
        return role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên';
    };

    const getIssueTypeLabel = (issueType: string): string => {
        const labels: { [key: string]: string } = {
            'SICK_LEAVE': 'Nghỉ bệnh dài ngày',
            'MATERNITY_LEAVE': 'Nghỉ thai sản',
            'LONG_TERM_LEAVE': 'Nghỉ dài ngày có phép'
        };
        return labels[issueType] || issueType;
    };

    const getFileType = (url: string): string => {
        const extension = url.split('.').pop()?.toLowerCase();
        const typeMap: { [key: string]: string } = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime'
        };
        return typeMap[extension || ''] || 'application/octet-stream';
    };

    const handleOpenIssueDetail = (issue: GuardIssue) => {
        setSelectedIssue(issue);
        setShowIssueDetailModal(true);
    };

    const handleCloseIssueDetail = () => {
        setShowIssueDetailModal(false);
        setSelectedIssue(null);
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

    const getShiftTimeSlot = (templateName: string): string => {
        const nameLower = templateName.toLowerCase();
        if (nameLower.includes('sáng')) return 'MORNING';
        if (nameLower.includes('chiều')) return 'AFTERNOON';
        if (nameLower.includes('đêm') || nameLower.includes('tối')) return 'EVENING';
        return '';
    };

    const getShiftTimeSlotLabel = (shiftTimeSlot: string): string => {
        const labelMap: { [key: string]: string } = {
            'MORNING': 'Ca sáng',
            'AFTERNOON': 'Ca chiều',
            'EVENING': 'Ca đêm'
        };
        return labelMap[shiftTimeSlot] || 'Không xác định';
    };

    const handleOpenAssignModal = async () => {
        setShowAssignModal(true);
        setSelectedGroup(null);
        await fetchUnassignedGroups();
        await fetchTeams();
    };

    const handleCloseAssignModal = () => {
        setShowAssignModal(false);
        setSelectedGroup(null);
        setUnassignedGroups([]);
        setTeams([]);
    };

    const fetchUnassignedGroups = async () => {
        if (!contractId || shifts.length === 0) return;

        try {
            setLoadingGroups(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('Không tìm thấy token xác thực');

            const managerId = shifts[0].managerId;
            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/unassigned-groups?managerId=${managerId}&contractId=${contractId}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Không thể tải danh sách ca trực chưa phân công');

            const data = await response.json();
            setUnassignedGroups(data.data || []);
        } catch (err) {
            console.error('Error fetching unassigned groups:', err);
            setSnackbarMessage(err instanceof Error ? err.message : 'Lỗi khi tải danh sách ca trực');
            setShowErrorSnackbar(true);
        } finally {
            setLoadingGroups(false);
        }
    };

    const fetchTeams = async () => {
        if (shifts.length === 0) return;

        try {
            setLoadingTeams(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('Không tìm thấy token xác thực');

            const managerId = shifts[0].managerId;
            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/teams?managerId=${managerId}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Không thể tải danh sách team');

            const data = await response.json();
            setTeams(data.teams || []);
        } catch (err) {
            console.error('Error fetching teams:', err);
            setSnackbarMessage(err instanceof Error ? err.message : 'Lỗi khi tải danh sách team');
            setShowErrorSnackbar(true);
        } finally {
            setLoadingTeams(false);
        }
    };

    const handleAssignTeam = (team: Team) => {
        if (!selectedGroup) return;
        setSelectedTeam(team);
        setShowAssignModal(false);
        setShowConfirmModal(true);
        setAssignmentType('REGULAR');
        setAssignmentNotes('');
    };

    const handleBackToList = () => {
        setShowConfirmModal(false);
        setShowAssignModal(true);
        setSelectedTeam(null);
        setAssignmentType('REGULAR');
        setAssignmentNotes('');
    };

    const handleConfirmAssign = async () => {
        if (!selectedGroup || !selectedTeam) return;

        try {
            setIsAssigning(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('Không tìm thấy token xác thực');

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/teams/${selectedTeam.teamId}/assign`;

            const shiftTimeSlot = getShiftTimeSlot(selectedGroup.templateName);

            const requestBody = {
                startDate: selectedGroup.nearestShiftDate.split('T')[0],
                endDate: selectedGroup.farthestShiftDate.split('T')[0],
                shiftTimeSlot: shiftTimeSlot,
                locationId: selectedGroup.locationId,
                contractId: selectedGroup.contractId,
                assignmentType: assignmentType,
                assignmentNotes: assignmentNotes
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể phân công ca trực');
            }

            const responseData = await response.json();

            if (responseData.totalShiftsAssigned === 0) {
                setSnackbarMessage('Không thể phân công cho đội này làm hai ca liên tiếp nhau');
                setShowErrorSnackbar(true);
                setShowConfirmModal(false);
                setSelectedTeam(null);
                setSelectedGroup(null);
            } else {
                setSnackbarMessage('Phân công ca trực thành công!');
                setShowSuccessSnackbar(true);
                setShowConfirmModal(false);
                setSelectedTeam(null);
                setSelectedGroup(null);
            }
        } catch (err) {
            console.error('Error assigning team:', err);
            setSnackbarMessage(err instanceof Error ? err.message : 'Lỗi khi phân công ca trực');
            setShowErrorSnackbar(true);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleSuccessSnackbarClose = () => {
        setShowSuccessSnackbar(false);
        window.location.reload();
    };

    const handleCancelShift = async () => {
        if (!selectedShift) return;

        try {
            setIsCancelling(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('Không tìm thấy token xác thực');

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/${selectedShift.id}/cancel`;

            const requestBody = {
                ShiftId: selectedShift.id,
                CancellationReason: cancellationReason.trim(),
                CancelledBy: user?.userId || ''
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Không thể hủy ca trực');
            }

            // Success - close all modals and show success snackbar
            setShowCancelModal(false);
            setShowShiftDetail(false);
            setCancellationReason('');
            setSnackbarMessage(`Đã hủy ca trực ${formatFullDate(selectedShift.shiftDate)} - ${formatTime(selectedShift.shiftStart)} - ${formatTime(selectedShift.shiftEnd)}`);
            setShowSuccessSnackbar(true);
        } catch (err) {
            console.error('Error cancelling shift:', err);
            setSnackbarMessage(`Hủy ca trực ${formatFullDate(selectedShift.shiftDate)} - ${formatTime(selectedShift.shiftStart)} - ${formatTime(selectedShift.shiftEnd)} không thành công`);
            setShowErrorSnackbar(true);
        } finally {
            setIsCancelling(false);
        }
    };

    const fetchContractDates = async (contractId: string) => {
        try {
            setLoadingContractInfo(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('Không tìm thấy token xác thực');

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/contracts/${contractId}/dates`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Không thể lấy thông tin hợp đồng');
            }

            const data: ContractDatesResponse = await response.json();

            if (data.success && data.data) {
                setContractStartDate(data.data.startDate);
                setContractEndDate(data.data.endDate);
            }
        } catch (err) {
            console.error('Error fetching contract dates:', err);
            setSnackbarMessage('Không thể lấy thông tin hợp đồng');
            setShowErrorSnackbar(true);
        } finally {
            setLoadingContractInfo(false);
        }
    };

    const handleOpenLeaveModal = async (guard: AssignedGuard) => {
        setSelectedGuardForLeave(guard);
        setLeaveFromDate('');
        setLeaveToDate('');
        setLeaveReason('');
        setLeaveType('SICK_LEAVE');
        setLeaveFile(null);
        setLeaveFilePreview(null);
        setFromDateError('');
        setToDateError('');
        setContractStartDate(null);
        setContractEndDate(null);
        setShowLeaveModal(true);

        // Fetch contract info
        if (selectedShift?.contractId) {
            await fetchContractDates(selectedShift.contractId);
        }
    };

    const handleCloseLeaveModal = () => {
        setShowLeaveModal(false);
        setSelectedGuardForLeave(null);
        setLeaveFromDate('');
        setLeaveToDate('');
        setLeaveReason('');
        setLeaveType('SICK_LEAVE');
        setLeaveFile(null);
        setLeaveFilePreview(null);
        setFromDateError('');
        setToDateError('');
        setContractStartDate(null);
        setContractEndDate(null);
    };

    const validateFromDate = (date: string): boolean => {
        setFromDateError('');

        if (!date) {
            setFromDateError('Vui lòng chọn từ ngày');
            return false;
        }

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        // Must be after today (tomorrow or later)
        if (selectedDate <= today) {
            setFromDateError('Từ ngày phải sau ngày hôm nay');
            return false;
        }

        // Check against contract date range
        if (contractStartDate && contractEndDate) {
            const startDate = new Date(contractStartDate);
            const endDate = new Date(contractEndDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            if (selectedDate < startDate || selectedDate > endDate) {
                setFromDateError('Từ ngày phải nằm trong khoảng thời gian hợp đồng');
                return false;
            }
        }

        return true;
    };

    const validateToDate = (date: string): boolean => {
        setToDateError('');

        if (!date) {
            setToDateError('Vui lòng chọn đến ngày');
            return false;
        }

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        // Must not be before today
        if (selectedDate < today) {
            setToDateError('Đến ngày không được trước ngày hôm nay');
            return false;
        }

        // Must not be before fromDate
        if (leaveFromDate) {
            const fromDate = new Date(leaveFromDate);
            fromDate.setHours(0, 0, 0, 0);

            if (selectedDate < fromDate) {
                setToDateError('Đến ngày không được trước từ ngày');
                return false;
            }
        }

        // Check against contract date range
        if (contractStartDate && contractEndDate) {
            const startDate = new Date(contractStartDate);
            const endDate = new Date(contractEndDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            if (selectedDate < startDate || selectedDate > endDate) {
                setToDateError('Đến ngày phải nằm trong khoảng thời gian hợp đồng');
                return false;
            }
        }

        return true;
    };

    const handleFromDateChange = (date: string) => {
        setLeaveFromDate(date);
        if (date) {
            validateFromDate(date);
            // Re-validate toDate if it's already set
            if (leaveToDate) {
                validateToDate(leaveToDate);
            }
        }
    };

    const handleToDateChange = (date: string) => {
        setLeaveToDate(date);
        if (date) {
            validateToDate(date);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4',
            'video/x-msvideo',
            'video/quicktime'
        ];

        if (!allowedTypes.includes(file.type)) {
            setSnackbarMessage('Định dạng file không được hỗ trợ');
            setShowErrorSnackbar(true);
            return;
        }

        setLeaveFile(file);

        // Create preview for image and video files
        const previewTypes = ['image/png', 'image/gif', 'video/mp4', 'video/x-msvideo', 'video/quicktime'];
        if (previewTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLeaveFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setLeaveFilePreview(null);
        }
    };

    const handleSubmitLeave = async () => {
        if (!selectedGuardForLeave || !leaveFile) return;

        // Validate dates before submitting
        const isFromDateValid = validateFromDate(leaveFromDate);
        const isToDateValid = validateToDate(leaveToDate);

        if (!isFromDateValid || !isToDateValid) {
            return;
        }

        try {
            setIsSubmittingLeave(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('Không tìm thấy token xác thực');

            const formData = new FormData();

            const dataObj = {
                guardId: selectedGuardForLeave.guardId,
                fromDate: leaveFromDate,
                toDate: leaveToDate,
                cancellationReason: leaveReason,
                leaveType: leaveType,
                cancelledBy: user?.userId || ''
            };

            formData.append('data', JSON.stringify(dataObj));
            formData.append('file', leaveFile);

            const url = `${import.meta.env.VITE_API_SHIFTS_URL}/shifts/bulk-cancel`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Không thể xác nhận nghỉ phép');
            }

            // Success
            handleCloseLeaveModal();
            setSnackbarMessage('Xác nhận nghỉ phép cho bảo vệ thành công');
            setShowSuccessSnackbar(true);
        } catch (err) {
            console.error('Error submitting leave:', err);
            setSnackbarMessage('Xác nhận nghỉ phép cho bảo vệ thất bại');
            setShowErrorSnackbar(true);
        } finally {
            setIsSubmittingLeave(false);
        }
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
                        <button
                            className="mgr-shift-detail-assign-btn"
                            onClick={handleOpenAssignModal}
                        >
                            Phân công ca trực
                        </button>
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
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: shift.status?.toUpperCase() === 'CANCELLED' ? '#e0e0e0' : undefined,
                                                        opacity: shift.status?.toUpperCase() === 'CANCELLED' ? 0.7 : 1
                                                    }}
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
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {selectedShift.status?.toUpperCase() === 'CANCELLED' ? (
                                    <span style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}>
                                        Ca trực đã hủy
                                    </span>
                                ) : (
                                    <button
                                        className="mgr-shift-detail-cancel-shift-btn"
                                        onClick={() => {
                                            setCancellationReason('');
                                            setShowCancelModal(true);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Hủy ca trực
                                    </button>
                                )}
                                <button className="mgr-shift-detail-close-btn" onClick={closeShiftDetail}>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            </div>
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
                                </div>

                                {loadingGuards ? (
                                    <div className="mgr-shift-detail-guards-loading">
                                        <div className="mgr-shift-detail-spinner"></div>
                                        <p>Đang tải danh sách bảo vệ...</p>
                                    </div>
                                ) : assignedGuards.length > 0 ? (
                                    <div className="mgr-shift-detail-guards-list">
                                        {assignedGuards.map((guard) => {
                                            const attendance = guardAttendances.get(guard.guardId);

                                            return (
                                                <div key={guard.guardId} className="mgr-shift-detail-guard-item">
                                                    <div className="mgr-shift-detail-guard-avatar">
                                                        {guard.avatarUrl ? (
                                                            <img src={guard.avatarUrl} alt={guard.fullName} />
                                                        ) : (
                                                            <span>{guard.fullName.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="mgr-shift-detail-guard-info">
                                                        <div className="mgr-shift-detail-guard-name">{guard.fullName}</div>
                                                        <div className="mgr-shift-detail-guard-role">{getRoleLabel(guard.role)}</div>
                                                        <div className="mgr-shift-detail-guard-contact">
                                                            <span>{formatPhoneNumber(guard.phoneNumber)}</span>
                                                            <span>{guard.email}</span>
                                                        </div>
                                                    </div>
                                                    {attendance && (
                                                        <div
                                                            className="mgr-shift-detail-guard-attendance-badge"
                                                            style={{
                                                                color: getAttendanceStatusColor(attendance.status)
                                                            }}
                                                        >
                                                            {getAttendanceStatusLabel(attendance.status)}
                                                        </div>
                                                    )}

                                                    {guard.assignmentStatus === 'CANCELLED' ? (
                                                        <div className="mgr-shift-detail-guard-issue-section">
                                                            {(() => {
                                                                const issues = guardIssuesMap.get(guard.guardId);
                                                                if (!issues || issues.length === 0) {
                                                                    return <div className="mgr-shift-detail-guard-issue-loading">Đang tải thông tin nghỉ phép...</div>;
                                                                }
                                                                const issue = issues[0]; // Display first issue
                                                                return (
                                                                    <div className="mgr-shift-detail-guard-issue-info">
                                                                        <div className="mgr-shift-detail-guard-issue-type">
                                                                            {getIssueTypeLabel(issue.issueType)}
                                                                        </div>
                                                                        <div className="mgr-shift-detail-guard-issue-dates">
                                                                            {formatFullDate(issue.startDate)} - {formatFullDate(issue.endDate)}
                                                                        </div>
                                                                        <button
                                                                            className="mgr-shift-detail-guard-issue-detail-btn"
                                                                            onClick={() => handleOpenIssueDetail(issue)}
                                                                        >
                                                                            Xem chi tiết
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <div className="mgr-shift-detail-guard-actions">
                                                            <button
                                                                className="mgr-shift-detail-guard-leave-btn"
                                                                onClick={() => handleOpenLeaveModal(guard)}
                                                            >
                                                                Xác nhận nghỉ
                                                            </button>
                                                            <button
                                                                className="mgr-shift-detail-guard-detail-btn"
                                                                onClick={() => handleOpenAttendanceDetail(guard.guardId)}
                                                                disabled={!attendance}
                                                            >
                                                                Chi tiết điểm danh
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : selectedShift.assignedGuardsCount > 0 ? (
                                    <div className="mgr-shift-detail-guards-empty">
                                        <p>Không thể tải danh sách bảo vệ</p>
                                    </div>
                                ) : null}
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

            {showAssignModal && (
                <div className="mgr-shift-assign-modal-overlay" onClick={handleCloseAssignModal}>
                    <div className="mgr-shift-assign-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-shift-assign-modal-header">
                            <h2>Phân công ca trực</h2>
                            <button className="mgr-shift-assign-close-btn" onClick={handleCloseAssignModal}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>

                        <div className="mgr-shift-assign-modal-content">
                            <div className="mgr-shift-assign-column">
                                <h3 className="mgr-shift-assign-column-title">Ca trực chưa phân công</h3>
                                {loadingGroups ? (
                                    <div className="mgr-shift-assign-loading">
                                        <div className="mgr-shift-assign-spinner"></div>
                                        <p>Đang tải...</p>
                                    </div>
                                ) : unassignedGroups.length === 0 ? (
                                    <div className="mgr-shift-assign-empty">
                                        <p>Không có ca trực chưa phân công</p>
                                    </div>
                                ) : (
                                    <div className="mgr-shift-assign-list">
                                        {unassignedGroups.map((group) => (
                                            <div
                                                key={group.representativeShiftId}
                                                className={`mgr-shift-assign-group-item ${selectedGroup?.representativeShiftId === group.representativeShiftId ? 'mgr-shift-assign-selected' : ''}`}
                                                onClick={() => setSelectedGroup(group)}
                                            >
                                                <div className="mgr-shift-assign-group-name">{group.templateName}</div>
                                                <div className="mgr-shift-assign-group-code">{group.templateCode}</div>
                                                <div className="mgr-shift-assign-group-time">
                                                    {formatTime(group.shiftStart)} - {formatTime(group.shiftEnd)}
                                                </div>
                                                <div className="mgr-shift-assign-group-info">
                                                    <span>Số ca: {group.unassignedShiftCount}</span>
                                                    <span>Yêu cầu: {group.requiredGuards} bảo vệ</span>
                                                </div>
                                                <div className="mgr-shift-assign-group-duration">
                                                    Thời gian: {group.workDurationHours} giờ
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mgr-shift-assign-column">
                                <h3 className="mgr-shift-assign-column-title">Danh sách Team</h3>
                                {loadingTeams ? (
                                    <div className="mgr-shift-assign-loading">
                                        <div className="mgr-shift-assign-spinner"></div>
                                        <p>Đang tải...</p>
                                    </div>
                                ) : teams.length === 0 ? (
                                    <div className="mgr-shift-assign-empty">
                                        <p>Không có team nào</p>
                                    </div>
                                ) : (
                                    <div className="mgr-shift-assign-list">
                                        {teams.map((team) => {
                                            const canAssignTeam = selectedGroup && (() => {
                                                const required = selectedGroup.requiredGuards;
                                                const current = team.currentMemberCount;

                                                if (required > 1) {
                                                    return current === required || (current < required && current >= 2);
                                                } else if (required === 1) {
                                                    return current === 1;
                                                }
                                                return false;
                                            })();

                                            return (
                                                <div key={team.teamId} className="mgr-shift-assign-team-item">
                                                    <div className="mgr-shift-assign-team-name">{team.teamName}</div>
                                                    <div className="mgr-shift-assign-team-code">{team.teamCode}</div>
                                                    <div className="mgr-shift-assign-team-info">
                                                        <span>Thành viên: {team.currentMemberCount}</span>
                                                        <span>Trạng thái: {team.isActive ? 'Hoạt động' : 'Không hoạt động'}</span>
                                                    </div>
                                                    {canAssignTeam && (
                                                        <button
                                                            className="mgr-shift-assign-action-btn"
                                                            onClick={() => handleAssignTeam(team)}
                                                        >
                                                            Phân công
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmModal && selectedGroup && selectedTeam && (
                <div className="mgr-shift-confirm-modal-overlay">
                    <div className="mgr-shift-confirm-modal-box">
                        <div className="mgr-shift-confirm-modal-header">
                            <h2>Xác nhận phân công ca trực</h2>
                        </div>

                        <div className="mgr-shift-confirm-modal-content">
                            <div className="mgr-shift-confirm-info-section">
                                <h3 className="mgr-shift-confirm-section-title">Thông tin ca trực</h3>
                                <div className="mgr-shift-confirm-info-grid">
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Tên ca:</span>
                                        <span className="mgr-shift-confirm-value">{selectedGroup.templateName}</span>
                                    </div>
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Mã ca:</span>
                                        <span className="mgr-shift-confirm-value">{selectedGroup.templateCode}</span>
                                    </div>
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Loại ca:</span>
                                        <span className="mgr-shift-confirm-value">{getShiftTimeSlotLabel(getShiftTimeSlot(selectedGroup.templateName))}</span>
                                    </div>
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Giờ làm việc:</span>
                                        <span className="mgr-shift-confirm-value">
                                            {formatTime(selectedGroup.shiftStart)} - {formatTime(selectedGroup.shiftEnd)}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Số ca:</span>
                                        <span className="mgr-shift-confirm-value">{selectedGroup.unassignedShiftCount} ca</span>
                                    </div>
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Thời gian:</span>
                                        <span className="mgr-shift-confirm-value">
                                            {formatFullDate(selectedGroup.nearestShiftDate)} - {formatFullDate(selectedGroup.farthestShiftDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mgr-shift-confirm-info-section">
                                <h3 className="mgr-shift-confirm-section-title">Thông tin Team</h3>
                                <div className="mgr-shift-confirm-info-grid">
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Tên team:</span>
                                        <span className="mgr-shift-confirm-value">{selectedTeam.teamName}</span>
                                    </div>
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Mã team:</span>
                                        <span className="mgr-shift-confirm-value">{selectedTeam.teamCode}</span>
                                    </div>
                                    <div className="mgr-shift-confirm-info-item">
                                        <span className="mgr-shift-confirm-label">Số thành viên:</span>
                                        <span className="mgr-shift-confirm-value">{selectedTeam.currentMemberCount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mgr-shift-confirm-form-section">
                                <div className="mgr-shift-confirm-form-group">
                                    <label className="mgr-shift-confirm-form-label">Loại phân công</label>
                                    <select
                                        className="mgr-shift-confirm-form-select"
                                        value={assignmentType}
                                        onChange={(e) => setAssignmentType(e.target.value as 'REGULAR' | 'ONEDAY')}
                                    >
                                        <option value="REGULAR">Thường ngày</option>
                                        <option value="ONEDAY">1 ngày</option>
                                    </select>
                                </div>

                                <div className="mgr-shift-confirm-form-group">
                                    <label className="mgr-shift-confirm-form-label">Ghi chú</label>
                                    <textarea
                                        className="mgr-shift-confirm-form-textarea"
                                        placeholder="Nhập ghi chú cho phân công..."
                                        value={assignmentNotes}
                                        onChange={(e) => setAssignmentNotes(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mgr-shift-confirm-modal-footer">
                            <button
                                className="mgr-shift-confirm-btn-back"
                                onClick={handleBackToList}
                                disabled={isAssigning}
                            >
                                Quay lại
                            </button>
                            <button
                                className="mgr-shift-confirm-btn-submit"
                                onClick={handleConfirmAssign}
                                disabled={isAssigning}
                            >
                                {isAssigning ? 'Đang phân công...' : 'Xác nhận phân công'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && selectedShift && (
                <div className="mgr-shift-detail-modal-overlay" onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                }}>
                    <div className="mgr-shift-detail-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-shift-detail-modal-header">
                            <h3>Xác nhận hủy ca trực</h3>
                        </div>
                        <div className="mgr-shift-detail-modal-body">
                            <p>
                                Bạn có chắc hủy ca trực {formatFullDate(selectedShift.shiftDate)} - {formatTime(selectedShift.shiftStart)} - {formatTime(selectedShift.shiftEnd)}?
                            </p>
                            <div style={{ marginTop: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    Lý do hủy ca <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <textarea
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="Nhập lý do hủy ca trực..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                    disabled={isCancelling}
                                />
                            </div>
                        </div>
                        <div className="mgr-shift-detail-modal-footer">
                            <button
                                className="mgr-shift-detail-btn-cancel"
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancellationReason('');
                                }}
                                disabled={isCancelling}
                            >
                                Không
                            </button>
                            <button
                                className="mgr-shift-detail-btn-confirm"
                                onClick={handleCancelShift}
                                disabled={isCancelling || !cancellationReason.trim()}
                                style={{
                                    backgroundColor: '#dc3545',
                                    opacity: (isCancelling || !cancellationReason.trim()) ? 0.6 : 1,
                                    cursor: (isCancelling || !cancellationReason.trim()) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isCancelling ? 'Đang hủy...' : 'Hủy ca trực'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAttendanceDetailModal && selectedAttendance && (
                <div className="mgr-shift-attendance-modal-overlay" onClick={handleCloseAttendanceDetail}>
                    <div className="mgr-shift-attendance-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-shift-attendance-modal-header">
                            <h2>Chi tiết chấm công</h2>
                            <div
                                className="mgr-shift-attendance-status-badge"
                                style={{ color: getAttendanceStatusColor(selectedAttendance.status) }}
                            >
                                Trạng thái: {getAttendanceStatusLabel(selectedAttendance.status)}
                            </div>
                            <button className="mgr-shift-attendance-close-btn" onClick={handleCloseAttendanceDetail}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>

                        <div className="mgr-shift-attendance-modal-body">
                            <div className="mgr-shift-attendance-section">
                                <h3>Chấm công vào ca</h3>
                                <div className="mgr-shift-attendance-time-header">
                                    Vào ca - {formatTime(selectedAttendance.scheduledStartTime)}
                                </div>
                                <div className="mgr-shift-attendance-info-grid">
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Thời gian check-in:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.checkInTime ? formatTime(selectedAttendance.checkInTime) : 'Chưa có thông tin'}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Tọa độ:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.checkInLatitude && selectedAttendance.checkInLongitude
                                                ? `${selectedAttendance.checkInLatitude.toFixed(6)}, ${selectedAttendance.checkInLongitude.toFixed(6)}`
                                                : 'Chưa có thông tin'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mgr-shift-attendance-section">
                                <h3>Chấm công hết ca</h3>
                                <div className="mgr-shift-attendance-time-header">
                                    Hết ca - {formatTime(selectedAttendance.scheduledEndTime)}
                                </div>
                                <div className="mgr-shift-attendance-info-grid">
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Thời gian check-out:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.checkOutTime ? formatTime(selectedAttendance.checkOutTime) : 'Chưa có thông tin'}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Tọa độ:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.checkOutLatitude && selectedAttendance.checkOutLongitude
                                                ? `${selectedAttendance.checkOutLatitude.toFixed(6)}, ${selectedAttendance.checkOutLongitude.toFixed(6)}`
                                                : 'Chưa có thông tin'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mgr-shift-attendance-section">
                                <h3>Thông tin tổng hợp</h3>
                                <div className="mgr-shift-attendance-info-grid">
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Tổng giờ làm:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.totalHours ? `${selectedAttendance.totalHours} giờ` : 'Chưa có thông tin'}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Đi muộn:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.isLate ? 'Có' : 'Không'}
                                            {selectedAttendance.lateMinutes ? ` (${selectedAttendance.lateMinutes} phút)` : ''}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Về sớm:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.isEarlyLeave ? 'Có' : 'Không'}
                                            {selectedAttendance.earlyLeaveMinutes ? ` (${selectedAttendance.earlyLeaveMinutes} phút)` : ''}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Làm thêm giờ:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.hasOvertime ? 'Có' : 'Không'}
                                            {selectedAttendance.overtimeMinutes ? ` (${selectedAttendance.overtimeMinutes} phút)` : ''}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Chưa hoàn thành:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.isIncomplete ? 'Có' : 'Không'}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Trạng thái xác nhận:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.verificationStatus === 'VERIFIED' ? 'Đã xác nhận' : 'Chưa xác nhận'}
                                        </span>
                                    </div>
                                    <div className="mgr-shift-attendance-info-item">
                                        <span className="mgr-shift-attendance-label">Thời gian xác nhận:</span>
                                        <span className="mgr-shift-attendance-value">
                                            {selectedAttendance.verifiedAt ? formatTime(selectedAttendance.verifiedAt) : 'Chưa có thông tin'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mgr-shift-attendance-modal-footer">
                            <button className="mgr-shift-attendance-verify-btn">
                                Xác nhận tiến độ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showIssueDetailModal && selectedIssue && (
                <div className="mgr-issue-detail-modal-overlay" onClick={handleCloseIssueDetail}>
                    <div className="mgr-issue-detail-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-issue-detail-modal-header">
                            <h3>Chi tiết nghỉ phép</h3>
                            <button className="mgr-issue-detail-close-btn" onClick={handleCloseIssueDetail}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>

                        <div className="mgr-issue-detail-modal-body">
                            <div className="mgr-issue-detail-section">
                                <h4>Thông tin nghỉ phép</h4>
                                <div className="mgr-issue-detail-grid">
                                    <div className="mgr-issue-detail-item">
                                        <span className="mgr-issue-detail-label">Loại nghỉ:</span>
                                        <span className="mgr-issue-detail-value">{getIssueTypeLabel(selectedIssue.issueType)}</span>
                                    </div>
                                    <div className="mgr-issue-detail-item">
                                        <span className="mgr-issue-detail-label">Từ ngày:</span>
                                        <span className="mgr-issue-detail-value">{formatFullDate(selectedIssue.startDate)}</span>
                                    </div>
                                    <div className="mgr-issue-detail-item">
                                        <span className="mgr-issue-detail-label">Đến ngày:</span>
                                        <span className="mgr-issue-detail-value">{formatFullDate(selectedIssue.endDate)}</span>
                                    </div>
                                    <div className="mgr-issue-detail-item">
                                        <span className="mgr-issue-detail-label">Ngày tạo:</span>
                                        <span className="mgr-issue-detail-value">{formatFullDate(selectedIssue.issueDate)}</span>
                                    </div>
                                    <div className="mgr-issue-detail-item">
                                        <span className="mgr-issue-detail-label">Số ca bị ảnh hưởng:</span>
                                        <span className="mgr-issue-detail-value">{selectedIssue.totalShiftsAffected} ca</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mgr-issue-detail-section">
                                <h4>Lý do</h4>
                                <p className="mgr-issue-detail-reason">{selectedIssue.reason}</p>
                            </div>

                            {selectedIssue.evidenceFileUrl && (
                                <div className="mgr-issue-detail-section">
                                    <h4>Tài liệu đính kèm</h4>
                                    <div className="mgr-issue-detail-evidence">
                                        {(() => {
                                            const fileType = getFileType(selectedIssue.evidenceFileUrl);

                                            if (fileType.startsWith('image/')) {
                                                return (
                                                    <img
                                                        src={selectedIssue.evidenceFileUrl}
                                                        alt="Evidence"
                                                        className="mgr-issue-detail-evidence-image"
                                                    />
                                                );
                                            } else if (fileType.startsWith('video/')) {
                                                return (
                                                    <video
                                                        src={selectedIssue.evidenceFileUrl}
                                                        controls
                                                        className="mgr-issue-detail-evidence-video"
                                                    />
                                                );
                                            } else if (fileType === 'application/pdf') {
                                                return (
                                                    <div className="mgr-issue-detail-evidence-pdf">
                                                        <iframe
                                                            src={selectedIssue.evidenceFileUrl}
                                                            className="mgr-issue-detail-evidence-pdf-viewer"
                                                            title="PDF Document"
                                                        />
                                                        <a
                                                            href={selectedIssue.evidenceFileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mgr-issue-detail-evidence-download"
                                                        >
                                                            Tải xuống PDF
                                                        </a>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <a
                                                        href={selectedIssue.evidenceFileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mgr-issue-detail-evidence-download"
                                                    >
                                                        Tải xuống tài liệu
                                                    </a>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showLeaveModal && selectedGuardForLeave && (
                <div className="mgr-leave-modal-overlay" onClick={handleCloseLeaveModal}>
                    <div className="mgr-leave-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-leave-modal-header">
                            <h3>Xác nhận nghỉ phép</h3>
                            <button className="mgr-leave-modal-close" onClick={handleCloseLeaveModal}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>

                        <div className="mgr-leave-modal-body">
                            <div className="mgr-leave-guard-info">
                                <div className="mgr-leave-guard-avatar">
                                    {selectedGuardForLeave.avatarUrl ? (
                                        <img src={selectedGuardForLeave.avatarUrl} alt={selectedGuardForLeave.fullName} />
                                    ) : (
                                        <span>{selectedGuardForLeave.fullName.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="mgr-leave-guard-details">
                                    <div className="mgr-leave-guard-name">{selectedGuardForLeave.fullName}</div>
                                    <div className="mgr-leave-guard-code">{selectedGuardForLeave.employeeCode}</div>
                                    <div className="mgr-leave-guard-contact">
                                        {formatPhoneNumber(selectedGuardForLeave.phoneNumber)} | {selectedGuardForLeave.email}
                                    </div>
                                </div>
                            </div>

                            {loadingContractInfo && (
                                <div className="mgr-leave-loading-info">
                                    <div className="mgr-leave-spinner"></div>
                                    <span>Đang tải thông tin hợp đồng...</span>
                                </div>
                            )}

                            <div className="mgr-leave-form">
                                <div className="mgr-leave-form-row">
                                    <div className="mgr-leave-form-group">
                                        <label className="mgr-leave-form-label">Từ ngày <span className="mgr-leave-required">*</span></label>
                                        <input
                                            type="date"
                                            className={`mgr-leave-form-input ${fromDateError ? 'mgr-leave-form-input-error' : ''}`}
                                            value={leaveFromDate}
                                            onChange={(e) => handleFromDateChange(e.target.value)}
                                            disabled={isSubmittingLeave || loadingContractInfo}
                                            min={(() => {
                                                const tomorrow = new Date();
                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                return tomorrow.toISOString().split('T')[0];
                                            })()}
                                            max={contractEndDate || undefined}
                                        />
                                        {fromDateError && <span className="mgr-leave-error-message">{fromDateError}</span>}
                                    </div>
                                    <div className="mgr-leave-form-group">
                                        <label className="mgr-leave-form-label">Đến ngày <span className="mgr-leave-required">*</span></label>
                                        <input
                                            type="date"
                                            className={`mgr-leave-form-input ${toDateError ? 'mgr-leave-form-input-error' : ''}`}
                                            value={leaveToDate}
                                            onChange={(e) => handleToDateChange(e.target.value)}
                                            disabled={isSubmittingLeave || loadingContractInfo}
                                            min={leaveFromDate || new Date().toISOString().split('T')[0]}
                                            max={contractEndDate || undefined}
                                        />
                                        {toDateError && <span className="mgr-leave-error-message">{toDateError}</span>}
                                    </div>
                                </div>

                                <div className="mgr-leave-form-group">
                                    <label className="mgr-leave-form-label">Loại nghỉ phép <span className="mgr-leave-required">*</span></label>
                                    <select
                                        className="mgr-leave-form-select"
                                        value={leaveType}
                                        onChange={(e) => setLeaveType(e.target.value as 'SICK_LEAVE' | 'MATERNITY_LEAVE' | 'LONG_TERM_LEAVE')}
                                        disabled={isSubmittingLeave}
                                    >
                                        <option value="SICK_LEAVE">Nghỉ bệnh</option>
                                        <option value="MATERNITY_LEAVE">Nghỉ thai sản</option>
                                        <option value="LONG_TERM_LEAVE">Nghỉ dài hạn</option>
                                    </select>
                                </div>

                                <div className="mgr-leave-form-group">
                                    <label className="mgr-leave-form-label">Lý do nghỉ <span className="mgr-leave-required">*</span></label>
                                    <textarea
                                        className="mgr-leave-form-textarea"
                                        value={leaveReason}
                                        onChange={(e) => setLeaveReason(e.target.value)}
                                        placeholder="Nhập lý do nghỉ phép..."
                                        rows={4}
                                        disabled={isSubmittingLeave}
                                    />
                                </div>

                                <div className="mgr-leave-form-group">
                                    <label className="mgr-leave-form-label">Tài liệu đính kèm <span className="mgr-leave-required">*</span></label>
                                    <input
                                        type="file"
                                        className="mgr-leave-form-file"
                                        onChange={handleFileChange}
                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.mp4,.avi,.mov"
                                        disabled={isSubmittingLeave}
                                    />
                                    {leaveFile && (
                                        <div className="mgr-leave-file-name">{leaveFile.name}</div>
                                    )}
                                </div>

                                {leaveFilePreview && (
                                    <div className="mgr-leave-preview">
                                        <label className="mgr-leave-form-label">Xem trước</label>
                                        {leaveFile?.type.startsWith('image/') ? (
                                            <img src={leaveFilePreview} alt="Preview" className="mgr-leave-preview-image" />
                                        ) : leaveFile?.type.startsWith('video/') ? (
                                            <video src={leaveFilePreview} controls className="mgr-leave-preview-video" />
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mgr-leave-modal-footer">
                            <button
                                className="mgr-leave-btn-cancel"
                                onClick={handleCloseLeaveModal}
                                disabled={isSubmittingLeave}
                            >
                                Hủy
                            </button>
                            <button
                                className="mgr-leave-btn-submit"
                                onClick={handleSubmitLeave}
                                disabled={
                                    isSubmittingLeave ||
                                    loadingContractInfo ||
                                    !leaveFromDate ||
                                    !leaveToDate ||
                                    !leaveReason.trim() ||
                                    !leaveFile ||
                                    !!fromDateError ||
                                    !!toDateError
                                }
                            >
                                {isSubmittingLeave ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SnackbarChecked
                message={snackbarMessage}
                isOpen={showSuccessSnackbar}
                onClose={handleSuccessSnackbarClose}
            />

            <SnackbarFailed
                message={snackbarMessage}
                isOpen={showErrorSnackbar}
                onClose={() => setShowErrorSnackbar(false)}
            />
        </div>
    );
};

export default ManagerShiftDetail;
