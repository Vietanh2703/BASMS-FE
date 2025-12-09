import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import './ShiftScheduleEdit.css';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';

interface ShiftScheduleData {
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
    requiredCertifications: string | null;
    autoGenerateEnabled: boolean;
    generateAdvanceDays: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    isActive: boolean;
    notes: string;
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
    requiredCertifications: string | null;
    autoGenerateEnabled: boolean;
    generateAdvanceDays: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    isActive: boolean;
    notes: string;
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
    holidayStartDate: string | null;
    holidayEndDate: string | null;
    totalHolidayDays: number;
    isOfficialHoliday: boolean;
    isObserved: boolean;
    originalDate: string | null;
    observedDate: string | null;
    appliesNationwide: boolean;
    appliesToRegions: string | null;
    standardWorkplacesClosed: boolean;
    essentialServicesOperating: boolean;
    description: string;
    year: number;
}

interface ShiftScheduleEditProps {
    contractId: string;
}

export interface ShiftScheduleEditHandle {
    saveShiftSchedule: () => Promise<boolean>;
    savePublicHolidays: () => Promise<boolean>;
    hasChanges: () => boolean;
}

const SCHEDULE_NAMES = [
    { value: 'Ca sáng', label: 'Ca sáng' },
    { value: 'Ca chiều', label: 'Ca chiều' },
    { value: 'Ca đêm', label: 'Ca đêm' }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const SECONDS = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const ShiftScheduleEdit = forwardRef<ShiftScheduleEditHandle, ShiftScheduleEditProps>(({
    contractId
}, ref) => {
    // API data states
    const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>([]);
    const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);

    // Loading states
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Form data for each schedule - keyed by schedule ID
    const [scheduleFormsData, setScheduleFormsData] = useState<{ [scheduleId: string]: ShiftScheduleData }>({});

    // Time pickers for each schedule
    const [timePickers, setTimePickers] = useState<{
        [scheduleId: string]: {
            startHour: string;
            startMinute: string;
            startSecond: string;
            endHour: string;
            endMinute: string;
            endSecond: string;
        }
    }>({});

    const [errors, setErrors] = useState<{ [scheduleId: string]: { [key: string]: string } }>({});

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarCheckedOpen, setSnackbarCheckedOpen] = useState(false);
    const [snackbarFailedOpen, setSnackbarFailedOpen] = useState(false);
    const [snackbarHolidayValidationOpen, setSnackbarHolidayValidationOpen] = useState(false);

    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);

    // Fetch contract data (includes shift schedules and public holidays)
    useEffect(() => {
        const fetchContractData = async () => {
            if (!contractId) return;

            setIsLoadingSchedules(true);
            setIsLoadingHolidays(true);
            setLoadError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    setLoadError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
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
                const data = result.data;

                // Process shift schedules
                const scheduleOrder: { [key: string]: number } = {
                    'Ca sáng': 1,
                    'Ca chiều': 2,
                    'Ca đêm': 3
                };
                const sortedSchedules = (data.shiftSchedules || []).sort((a: ShiftSchedule, b: ShiftSchedule) => {
                    return (scheduleOrder[a.scheduleName] || 999) - (scheduleOrder[b.scheduleName] || 999);
                });

                setShiftSchedules(sortedSchedules);

                // Process public holidays
                setPublicHolidays(data.publicHolidays || []);

                // Initialize form data and time pickers for all schedules
                const formsData: { [scheduleId: string]: ShiftScheduleData } = {};
                const timers: typeof timePickers = {};

                sortedSchedules.forEach((schedule: ShiftSchedule) => {
                    const [startH, startM, startS] = schedule.shiftStartTime.split(':');
                    const [endH, endM, endS] = schedule.shiftEndTime.split(':');

                    timers[schedule.id] = {
                        startHour: startH,
                        startMinute: startM,
                        startSecond: startS,
                        endHour: endH,
                        endMinute: endM,
                        endSecond: endS
                    };

                    formsData[schedule.id] = {
                        scheduleName: schedule.scheduleName,
                        scheduleType: schedule.scheduleType,
                        shiftStartTime: schedule.shiftStartTime,
                        shiftEndTime: schedule.shiftEndTime,
                        crossesMidnight: schedule.crossesMidnight,
                        durationHours: schedule.durationHours,
                        breakMinutes: schedule.breakMinutes,
                        guardsPerShift: schedule.guardsPerShift,
                        recurrenceType: schedule.recurrenceType,
                        appliesMonday: schedule.appliesMonday,
                        appliesTuesday: schedule.appliesTuesday,
                        appliesWednesday: schedule.appliesWednesday,
                        appliesThursday: schedule.appliesThursday,
                        appliesFriday: schedule.appliesFriday,
                        appliesSaturday: schedule.appliesSaturday,
                        appliesSunday: schedule.appliesSunday,
                        appliesOnPublicHolidays: schedule.appliesOnPublicHolidays,
                        appliesOnCustomerHolidays: schedule.appliesOnCustomerHolidays,
                        appliesOnWeekends: schedule.appliesOnWeekends,
                        skipWhenLocationClosed: schedule.skipWhenLocationClosed,
                        requiresArmedGuard: schedule.requiresArmedGuard,
                        requiresSupervisor: schedule.requiresSupervisor,
                        minimumExperienceMonths: schedule.minimumExperienceMonths,
                        requiredCertifications: schedule.requiredCertifications,
                        autoGenerateEnabled: schedule.autoGenerateEnabled,
                        generateAdvanceDays: schedule.generateAdvanceDays,
                        effectiveFrom: schedule.effectiveFrom,
                        effectiveTo: schedule.effectiveTo,
                        isActive: schedule.isActive,
                        notes: schedule.notes,
                    };
                });

                setScheduleFormsData(formsData);
                setTimePickers(timers);
            } catch (err) {
                setLoadError('Không thể tải thông tin hợp đồng. Vui lòng thử lại sau.');
            } finally {
                setIsLoadingSchedules(false);
                setIsLoadingHolidays(false);
            }
        };

        fetchContractData();
    }, [contractId]);

    const calculateDuration = (scheduleId: string, startTime: string, endTime: string) => {
        const [startH, startM, startS] = startTime.split(':').map(Number);
        const [endH, endM, endS] = endTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM + startS / 60;
        let endMinutes = endH * 60 + endM + endS / 60;

        // Auto-detect if shift crosses midnight
        const crossesMidnight = endMinutes < startMinutes;

        // If end time is before start time, assume it crosses midnight
        if (crossesMidnight) {
            endMinutes += 24 * 60;
        }

        const durationMinutes = endMinutes - startMinutes;
        const durationHours = durationMinutes / 60;

        setScheduleFormsData(prev => ({
            ...prev,
            [scheduleId]: {
                ...prev[scheduleId],
                durationHours: Math.round(durationHours * 100) / 100,
                crossesMidnight: crossesMidnight
            }
        }));
    };

    const validateTimes = (scheduleId: string, scheduleName: string, startTime: string, endTime: string) => {
        const newErrors: { [key: string]: string } = {};
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Only validate for morning and afternoon shifts
        if ((scheduleName === 'Ca sáng' || scheduleName === 'Ca chiều') &&
            startMinutes >= endMinutes) {
            newErrors.shiftTime = 'Thời gian bắt đầu phải trước thời gian kết thúc';
        }

        setErrors(prev => ({
            ...prev,
            [scheduleId]: newErrors
        }));
    };

    const validateScheduleName = (scheduleId: string, newName: string): boolean => {
        // Check if another schedule already has this name
        const otherSchedules = shiftSchedules.filter(s => s.id !== scheduleId);
        const nameExists = otherSchedules.some(s =>
            getScheduleNameLabel(scheduleFormsData[s.id]?.scheduleName || s.scheduleName) ===
            getScheduleNameLabel(newName)
        );

        if (nameExists) {
            setSnackbarOpen(true);
            return false;
        }

        return true;
    };

    const handleInputChange = (scheduleId: string, field: keyof ShiftScheduleData, value: any) => {
        setScheduleFormsData(prev => ({
            ...prev,
            [scheduleId]: {
                ...prev[scheduleId],
                [field]: value
            }
        }));
    };

    const handleCheckboxChange = (scheduleId: string, field: keyof ShiftScheduleData) => {
        setScheduleFormsData(prev => ({
            ...prev,
            [scheduleId]: {
                ...prev[scheduleId],
                [field]: !prev[scheduleId][field]
            }
        }));

        // Auto-update appliesOnWeekends
        if (field === 'appliesSaturday' || field === 'appliesSunday') {
            const formData = scheduleFormsData[scheduleId];
            const newSaturday = field === 'appliesSaturday' ? !formData.appliesSaturday : formData.appliesSaturday;
            const newSunday = field === 'appliesSunday' ? !formData.appliesSunday : formData.appliesSunday;
            const hasWeekendDays = newSaturday || newSunday;

            setScheduleFormsData(prev => ({
                ...prev,
                [scheduleId]: {
                    ...prev[scheduleId],
                    appliesOnWeekends: hasWeekendDays
                }
            }));
        }
    };

    const handleTimePickerChange = (scheduleId: string, field: string, value: string) => {
        setTimePickers(prev => ({
            ...prev,
            [scheduleId]: {
                ...prev[scheduleId],
                [field]: value
            }
        }));

        // Update the corresponding time in form data
        const timePicker = timePickers[scheduleId];
        const newTimePicker = { ...timePicker, [field]: value };

        if (field.startsWith('start')) {
            const newStartTime = `${newTimePicker.startHour}:${newTimePicker.startMinute}:${newTimePicker.startSecond}`;
            setScheduleFormsData(prev => ({
                ...prev,
                [scheduleId]: {
                    ...prev[scheduleId],
                    shiftStartTime: newStartTime
                }
            }));

            const formData = scheduleFormsData[scheduleId];
            calculateDuration(scheduleId, newStartTime, formData.shiftEndTime);
            validateTimes(scheduleId, formData.scheduleName, newStartTime, formData.shiftEndTime);
        } else {
            const newEndTime = `${newTimePicker.endHour}:${newTimePicker.endMinute}:${newTimePicker.endSecond}`;
            setScheduleFormsData(prev => ({
                ...prev,
                [scheduleId]: {
                    ...prev[scheduleId],
                    shiftEndTime: newEndTime
                }
            }));

            const formData = scheduleFormsData[scheduleId];
            calculateDuration(scheduleId, formData.shiftStartTime, newEndTime);
            validateTimes(scheduleId, formData.scheduleName, formData.shiftStartTime, newEndTime);
        }
    };

    const validateForm = (): boolean => {
        const allErrors: { [scheduleId: string]: { [key: string]: string } } = {};
        let hasErrors = false;

        shiftSchedules.forEach(schedule => {
            const formData = scheduleFormsData[schedule.id];
            if (!formData) return;

            const scheduleErrors: { [key: string]: string } = {};

            if (formData.breakMinutes <= 0) {
                scheduleErrors.breakMinutes = 'Thời gian nghỉ phải lớn hơn 0';
            }

            if (formData.guardsPerShift <= 0) {
                scheduleErrors.guardsPerShift = 'Số lượng bảo vệ phải lớn hơn 0';
            }

            if (Object.keys(scheduleErrors).length > 0) {
                allErrors[schedule.id] = scheduleErrors;
                hasErrors = true;
            }
        });

        setErrors(allErrors);
        return !hasErrors;
    };

    const handleHolidayChange = (holidayId: string, field: keyof PublicHoliday, value: any) => {
        setPublicHolidays(prev => prev.map(h =>
            h.id === holidayId ? { ...h, [field]: value } : h
        ));
    };

    const handleAddHoliday = () => {
        const newHoliday: PublicHoliday = {
            id: `temp-${Date.now()}`,
            contractId: contractId,
            holidayDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
            holidayName: '',
            holidayNameEn: '',
            holidayCategory: 'national',
            isTetPeriod: false,
            isTetHoliday: false,
            tetDayNumber: null,
            holidayStartDate: null,
            holidayEndDate: null,
            totalHolidayDays: 1,
            isOfficialHoliday: true,
            isObserved: true,
            originalDate: null,
            observedDate: null,
            appliesNationwide: true,
            appliesToRegions: null,
            standardWorkplacesClosed: true,
            essentialServicesOperating: false,
            description: '',
            year: new Date().getFullYear()
        };
        setPublicHolidays(prev => [...prev, newHoliday]);
    };

    const handleRemoveHoliday = (holidayId: string) => {
        // For new holidays that haven't been saved yet, just remove from state
        setPublicHolidays(prev => prev.filter(h => h.id !== holidayId));
    };

    const handleDeleteHoliday = (holidayId: string) => {
        setHolidayToDelete(holidayId);
        setShowDeleteModal(true);
    };

    const confirmDeleteHoliday = async () => {
        if (!holidayToDelete) return;

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setSnackbarFailedOpen(true);
                setShowDeleteModal(false);
                setHolidayToDelete(null);
                return;
            }

            const response = await fetch(`${apiUrl}/contracts/holidays/${holidayToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete holiday');
            }

            // Remove from local state on success
            setPublicHolidays(prev => prev.filter(h => h.id !== holidayToDelete));
            setSnackbarCheckedOpen(true);
        } catch (err) {
            setSnackbarFailedOpen(true);
        } finally {
            setShowDeleteModal(false);
            setHolidayToDelete(null);
        }
    };

    const cancelDeleteHoliday = () => {
        setShowDeleteModal(false);
        setHolidayToDelete(null);
    };

    // Expose save functions to parent via ref
    useImperativeHandle(ref, () => ({
        saveShiftSchedule: async () => {
            if (shiftSchedules.length === 0) {
                return false;
            }

            if (!validateForm()) {
                return false;
            }

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    return false;
                }

                // Save all schedules
                for (const schedule of shiftSchedules) {
                    const formData = scheduleFormsData[schedule.id];
                    if (!formData) continue;

                    // Validate schedule name before saving
                    if (!validateScheduleName(schedule.id, formData.scheduleName)) {
                        return false;
                    }

                    const response = await fetch(`${apiUrl}/contracts/shift-schedules/${schedule.id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update shift schedule');
                    }
                }

                return true;
            } catch (err) {
                return false;
            }
        },
        savePublicHolidays: async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    return false;
                }

                // Separate new holidays (with temp- IDs) from existing ones
                const newHolidays = publicHolidays.filter(h => h.id.startsWith('temp-'));
                const existingHolidays = publicHolidays.filter(h => !h.id.startsWith('temp-'));

                // Validate new holidays for required fields
                for (const holiday of newHolidays) {
                    if (!holiday.holidayName || holiday.holidayName.trim() === '') {
                        setSnackbarHolidayValidationOpen(true);
                        return false;
                    }
                    if (!holiday.holidayNameEn || holiday.holidayNameEn.trim() === '') {
                        setSnackbarHolidayValidationOpen(true);
                        return false;
                    }
                    if (!holiday.holidayDate) {
                        setSnackbarHolidayValidationOpen(true);
                        return false;
                    }
                }

                // Create new holidays via POST
                for (const holiday of newHolidays) {
                    const requestBody = {
                        ContractId: contractId,
                        HolidayDate: holiday.holidayDate,
                        HolidayName: holiday.holidayName,
                        HolidayNameEn: holiday.holidayNameEn,
                        HolidayCategory: holiday.holidayCategory,
                        IsTetPeriod: holiday.isTetPeriod,
                        IsTetHoliday: holiday.isTetHoliday,
                        TetDayNumber: holiday.tetDayNumber,
                        HolidayStartDate: holiday.holidayStartDate,
                        HolidayEndDate: holiday.holidayEndDate,
                        TotalHolidayDays: holiday.totalHolidayDays,
                        IsOfficialHoliday: holiday.isOfficialHoliday,
                        IsObserved: holiday.isObserved,
                        OriginalDate: holiday.originalDate,
                        ObservedDate: holiday.observedDate,
                        AppliesNationwide: holiday.appliesNationwide,
                        AppliesToRegions: holiday.appliesToRegions,
                        StandardWorkplacesClosed: holiday.standardWorkplacesClosed,
                        EssentialServicesOperating: holiday.essentialServicesOperating,
                        Description: holiday.description,
                        Year: holiday.year
                    };

                    const response = await fetch(`${apiUrl}/contracts/holidays`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create public holiday');
                    }
                }

                // Update existing holidays via PUT
                for (const holiday of existingHolidays) {
                    try {
                        const response = await fetch(`${apiUrl}/contracts/holidays/${holiday.id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(holiday),
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            console.error('Failed to update holiday:', holiday.id, errorData);
                            // Continue with other holidays instead of throwing
                            continue;
                        }
                    } catch (error) {
                        console.error('Error updating holiday:', holiday.id, error);
                        // Continue with other holidays
                        continue;
                    }
                }

                return true;
            } catch (err) {
                return false;
            }
        },
        hasChanges: () => {
            return true; // Can implement proper change detection if needed
        }
    }));

    const getScheduleNameLabel = (name: string) => {
        const schedule = SCHEDULE_NAMES.find(s => s.value === name);
        return schedule ? schedule.label : name;
    };

    return (
        <div className="shift-schedule-edit">
            {/* Loading and Error States */}
            {loadError && (
                <div className="shift-schedule-section">
                    <div className="shift-schedule-error-text">{loadError}</div>
                </div>
            )}

            {isLoadingSchedules && (
                <div className="shift-schedule-section">
                    <div className="shift-schedule-info-text">Đang tải thông tin lịch ca trực và ngày lễ...</div>
                </div>
            )}

            {!isLoadingSchedules && shiftSchedules.length === 0 && !loadError && (
                <div className="shift-schedule-section">
                    <div className="shift-schedule-info-text">Không có lịch ca trực nào cho hợp đồng này.</div>
                </div>
            )}

            {/* Render all shift schedules */}
            {!isLoadingSchedules && shiftSchedules.length > 0 && shiftSchedules.map(schedule => {
                const formData = scheduleFormsData[schedule.id];
                const timePicker = timePickers[schedule.id];
                const scheduleErrors = errors[schedule.id] || {};

                if (!formData || !timePicker) return null;

                return (
                    <div key={schedule.id} className="shift-schedule-section">
                        <h3 className="shift-schedule-section-title">{getScheduleNameLabel(formData.scheduleName)}</h3>

                        <div className="shift-schedule-form-grid">
                            {/* Schedule Name */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Tên ca trực *</label>
                                <select
                                    className="shift-schedule-input"
                                    value={formData.scheduleName}
                                    onChange={(e) => {
                                        if (validateScheduleName(schedule.id, e.target.value)) {
                                            handleInputChange(schedule.id, 'scheduleName', e.target.value);
                                        }
                                    }}
                                >
                                    {SCHEDULE_NAMES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Schedule Type */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Loại lịch *</label>
                                <input
                                    type="text"
                                    className="shift-schedule-input"
                                    value={formData.scheduleType}
                                    onChange={(e) => handleInputChange(schedule.id, 'scheduleType', e.target.value)}
                                />
                            </div>

                            {/* Start Time */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Giờ bắt đầu *</label>
                                <div className="shift-schedule-time-picker">
                                    <select
                                        className="shift-schedule-time-input"
                                        value={timePicker.startHour}
                                        onChange={(e) => handleTimePickerChange(schedule.id, 'startHour', e.target.value)}
                                    >
                                        {HOURS.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={timePicker.startMinute}
                                        onChange={(e) => handleTimePickerChange(schedule.id, 'startMinute', e.target.value)}
                                    >
                                        {MINUTES.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={timePicker.startSecond}
                                        onChange={(e) => handleTimePickerChange(schedule.id, 'startSecond', e.target.value)}
                                    >
                                        {SECONDS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* End Time */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Giờ kết thúc *</label>
                                <div className="shift-schedule-time-picker">
                                    <select
                                        className="shift-schedule-time-input"
                                        value={timePicker.endHour}
                                        onChange={(e) => handleTimePickerChange(schedule.id, 'endHour', e.target.value)}
                                    >
                                        {HOURS.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={timePicker.endMinute}
                                        onChange={(e) => handleTimePickerChange(schedule.id, 'endMinute', e.target.value)}
                                    >
                                        {MINUTES.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={timePicker.endSecond}
                                        onChange={(e) => handleTimePickerChange(schedule.id, 'endSecond', e.target.value)}
                                    >
                                        {SECONDS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                {scheduleErrors.shiftTime && (
                                    <span className="shift-schedule-error-text">{scheduleErrors.shiftTime}</span>
                                )}
                            </div>

                            {/* Duration (read-only) */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Thời lượng (giờ)</label>
                                <input
                                    type="text"
                                    className="shift-schedule-input"
                                    value={formData.durationHours}
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Break Minutes */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Thời gian nghỉ (phút) *</label>
                                <input
                                    type="number"
                                    className="shift-schedule-input"
                                    value={formData.breakMinutes}
                                    onChange={(e) => handleInputChange(schedule.id, 'breakMinutes', Number(e.target.value))}
                                    min="1"
                                />
                                {scheduleErrors.breakMinutes && (
                                    <span className="shift-schedule-error-text">{scheduleErrors.breakMinutes}</span>
                                )}
                            </div>

                            {/* Guards Per Shift */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Số bảo vệ/ca *</label>
                                <input
                                    type="number"
                                    className="shift-schedule-input"
                                    value={formData.guardsPerShift}
                                    onChange={(e) => handleInputChange(schedule.id, 'guardsPerShift', Number(e.target.value))}
                                    min="1"
                                />
                                {scheduleErrors.guardsPerShift && (
                                    <span className="shift-schedule-error-text">{scheduleErrors.guardsPerShift}</span>
                                )}
                            </div>

                            {/* Recurrence Type */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Loại lặp lại *</label>
                                <input
                                    type="text"
                                    className="shift-schedule-input"
                                    value={formData.recurrenceType}
                                    onChange={(e) => handleInputChange(schedule.id, 'recurrenceType', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Days of Week - moved inside the schedule section */}
                        <h4 className="shift-schedule-subsection-title">Áp dụng theo ngày</h4>
                        <div className="shift-schedule-days-grid">
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesMonday}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesMonday')}
                                />
                                <span>Thứ 2</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesTuesday}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesTuesday')}
                                />
                                <span>Thứ 3</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesWednesday}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesWednesday')}
                                />
                                <span>Thứ 4</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesThursday}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesThursday')}
                                />
                                <span>Thứ 5</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesFriday}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesFriday')}
                                />
                                <span>Thứ 6</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesSaturday}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesSaturday')}
                                />
                                <span>Thứ 7</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesSunday}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesSunday')}
                                />
                                <span>Chủ nhật</span>
                            </label>
                        </div>
                        {formData.appliesOnWeekends && (
                            <p className="shift-schedule-info-text">✓ Tự động áp dụng cho cuối tuần</p>
                        )}

                        {/* Other Options - moved inside the schedule section */}
                        <h4 className="shift-schedule-subsection-title">Tùy chọn khác</h4>
                        <div className="shift-schedule-checkboxes-grid">
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesOnPublicHolidays}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesOnPublicHolidays')}
                                />
                                <span>Áp dụng vào ngày lễ</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesOnCustomerHolidays}
                                    onChange={() => handleCheckboxChange(schedule.id, 'appliesOnCustomerHolidays')}
                                />
                                <span>Áp dụng vào ngày nghỉ của khách hàng</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.skipWhenLocationClosed}
                                    onChange={() => handleCheckboxChange(schedule.id, 'skipWhenLocationClosed')}
                                />
                                <span>Bỏ qua khi địa điểm đóng cửa</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresArmedGuard}
                                    onChange={() => handleCheckboxChange(schedule.id, 'requiresArmedGuard')}
                                />
                                <span>Yêu cầu bảo vệ có vũ trang</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresSupervisor}
                                    onChange={() => handleCheckboxChange(schedule.id, 'requiresSupervisor')}
                                />
                                <span>Yêu cầu giám sát viên</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.autoGenerateEnabled}
                                    onChange={() => handleCheckboxChange(schedule.id, 'autoGenerateEnabled')}
                                />
                                <span>Tự động tạo lịch</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={() => handleCheckboxChange(schedule.id, 'isActive')}
                                />
                                <span>Đang hoạt động</span>
                            </label>
                        </div>

                        {/* Auto-generate Info - moved inside the schedule section */}
                        <h4 className="shift-schedule-subsection-title">Thông tin tự tạo ca</h4>
                        <div className="shift-schedule-form-grid">
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Số ngày tạo trước</label>
                                <input
                                    type="number"
                                    className="shift-schedule-input"
                                    value={formData.generateAdvanceDays}
                                    onChange={(e) => handleInputChange(schedule.id, 'generateAdvanceDays', Number(e.target.value))}
                                    min="0"
                                />
                            </div>
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Bắt đầu (EffectiveFrom)</label>
                                <input
                                    type="date"
                                    className="shift-schedule-input"
                                    value={formData.effectiveFrom ? formData.effectiveFrom.split('T')[0] : ''}
                                    onChange={(e) => {
                                        const dateValue = e.target.value ? `${e.target.value}T00:00:00` : '';
                                        handleInputChange(schedule.id, 'effectiveFrom', dateValue);
                                    }}
                                />
                            </div>
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Kết thúc (EffectiveTo)</label>
                                <input
                                    type="date"
                                    className="shift-schedule-input"
                                    value={formData.effectiveTo ? formData.effectiveTo.split('T')[0] : ''}
                                    onChange={(e) => {
                                        const dateValue = e.target.value ? `${e.target.value}T00:00:00` : null;
                                        handleInputChange(schedule.id, 'effectiveTo', dateValue);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Public Holidays Section - Keep outside of schedule loop */}
            {!isLoadingSchedules && shiftSchedules.length > 0 && (
                <>
                    <div className="shift-schedule-section">
                        <div className="shift-schedule-section-header">
                            <h3 className="shift-schedule-section-title">Thông tin các ngày lễ đặc biệt</h3>
                            <button
                                className="shift-schedule-add-button"
                                onClick={handleAddHoliday}
                                type="button"
                            >
                                + Thêm ngày lễ
                            </button>
                        </div>

                        {isLoadingHolidays && (
                            <div className="shift-schedule-info-text">Đang tải danh sách ngày lễ...</div>
                        )}

                        {!isLoadingHolidays && publicHolidays.length > 0 && (
                            <div className="shift-schedule-holidays-list">
                                {publicHolidays.map((holiday, index) => (
                                    <div key={holiday.id} className="shift-schedule-holiday-item">
                                        <div className="shift-schedule-holiday-item-header">
                                            <h4 className="shift-schedule-holiday-item-title">Ngày lễ #{index + 1}</h4>
                                            {holiday.id.startsWith('temp-') ? (
                                                <button
                                                    className="shift-schedule-remove-button"
                                                    onClick={() => handleRemoveHoliday(holiday.id)}
                                                    type="button"
                                                >
                                                    Gỡ
                                                </button>
                                            ) : (
                                                <button
                                                    className="shift-schedule-delete-button"
                                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                                    type="button"
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>

                                        <div className="shift-schedule-form-grid">
                                            <div className="shift-schedule-form-group">
                                                <label className="shift-schedule-label">Tên ngày lễ (Tiếng Việt) *</label>
                                                <input
                                                    type="text"
                                                    className="shift-schedule-input"
                                                    value={holiday.holidayName}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'holidayName', e.target.value)}
                                                    placeholder="VD: Tết Nguyên Đán"
                                                />
                                            </div>

                                            <div className="shift-schedule-form-group">
                                                <label className="shift-schedule-label">Tên ngày lễ (Tiếng Anh) *</label>
                                                <input
                                                    type="text"
                                                    className="shift-schedule-input"
                                                    value={holiday.holidayNameEn}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'holidayNameEn', e.target.value)}
                                                    placeholder="VD: Lunar New Year"
                                                />
                                            </div>

                                            <div className="shift-schedule-form-group">
                                                <label className="shift-schedule-label">Ngày *</label>
                                                <input
                                                    type="date"
                                                    className="shift-schedule-input"
                                                    value={holiday.holidayDate ? holiday.holidayDate.split('T')[0] : ''}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'holidayDate', e.target.value + 'T00:00:00')}
                                                />
                                            </div>

                                            <div className="shift-schedule-form-group">
                                                <label className="shift-schedule-label">Số ngày nghỉ *</label>
                                                <input
                                                    type="number"
                                                    className="shift-schedule-input"
                                                    value={holiday.totalHolidayDays}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'totalHolidayDays', Number(e.target.value))}
                                                    min="1"
                                                />
                                            </div>

                                            <div className="shift-schedule-form-group">
                                                <label className="shift-schedule-label">Loại ngày lễ *</label>
                                                <select
                                                    className="shift-schedule-input"
                                                    value={holiday.holidayCategory}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'holidayCategory', e.target.value)}
                                                >
                                                    <option value="national">Quốc gia</option>
                                                    <option value="traditional">Truyền thống</option>
                                                    <option value="tet">Tết</option>
                                                </select>
                                            </div>

                                            <div className="shift-schedule-form-group shift-schedule-full-width">
                                                <label className="shift-schedule-label">Mô tả</label>
                                                <textarea
                                                    className="shift-schedule-input shift-schedule-textarea"
                                                    value={holiday.description || ''}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'description', e.target.value)}
                                                    rows={3}
                                                    placeholder="Mô tả về ngày lễ..."
                                                />
                                            </div>
                                        </div>

                                        <div className="shift-schedule-checkboxes-grid">
                                            <label className="shift-schedule-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={holiday.appliesNationwide}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'appliesNationwide', e.target.checked)}
                                                />
                                                <span>Áp dụng toàn quốc</span>
                                            </label>
                                            <label className="shift-schedule-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={holiday.standardWorkplacesClosed}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'standardWorkplacesClosed', e.target.checked)}
                                                />
                                                <span>Nơi làm việc đóng cửa</span>
                                            </label>
                                            <label className="shift-schedule-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={holiday.essentialServicesOperating}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'essentialServicesOperating', e.target.checked)}
                                                />
                                                <span>Dịch vụ thiết yếu hoạt động</span>
                                            </label>
                                            <label className="shift-schedule-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={holiday.isOfficialHoliday}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'isOfficialHoliday', e.target.checked)}
                                                />
                                                <span>Ngày lễ chính thức</span>
                                            </label>
                                            <label className="shift-schedule-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={holiday.isTetHoliday}
                                                    onChange={(e) => handleHolidayChange(holiday.id, 'isTetHoliday', e.target.checked)}
                                                />
                                                <span>Ngày Tết</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isLoadingHolidays && publicHolidays.length === 0 && contractId && (
                            <div className="shift-schedule-info-text">
                                Chưa có ngày lễ nào. Nhấn "Thêm ngày lễ" để thêm mới.
                            </div>
                        )}
                    </div>
                </>
            )}

            {showDeleteModal && (
                <div className="shift-schedule-modal-overlay" onClick={cancelDeleteHoliday}>
                    <div className="shift-schedule-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="shift-schedule-modal-title">Xác nhận xóa</h3>
                        <p className="shift-schedule-modal-message">
                            Bạn có chắc chắn muốn xóa ngày lễ này không?
                        </p>
                        <div className="shift-schedule-modal-actions">
                            <button
                                className="shift-schedule-modal-button shift-schedule-modal-button-cancel"
                                onClick={cancelDeleteHoliday}
                                type="button"
                            >
                                Không
                            </button>
                            <button
                                className="shift-schedule-modal-button shift-schedule-modal-button-confirm"
                                onClick={confirmDeleteHoliday}
                                type="button"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar Warning - Schedule Name */}
            <SnackbarWarning
                message="Tên ca trực đã tồn tại. Vui lòng chọn tên khác"
                isOpen={snackbarOpen}
                duration={4000}
                onClose={() => setSnackbarOpen(false)}
            />

            {/* Snackbar Warning - Holiday Validation */}
            <SnackbarWarning
                message="Vui lòng điền đầy đủ thông tin bắt buộc (*) cho ngày lễ mới"
                isOpen={snackbarHolidayValidationOpen}
                duration={4000}
                onClose={() => setSnackbarHolidayValidationOpen(false)}
            />

            {/* Snackbar Success */}
            <SnackbarChecked
                message="Xóa ngày lễ thành công"
                isOpen={snackbarCheckedOpen}
                duration={3000}
                onClose={() => setSnackbarCheckedOpen(false)}
            />

            {/* Snackbar Error */}
            <SnackbarFailed
                message="Xóa ngày lễ thất bại. Vui lòng thử lại"
                isOpen={snackbarFailedOpen}
                duration={3000}
                onClose={() => setSnackbarFailedOpen(false)}
            />
        </div>
    );
});

ShiftScheduleEdit.displayName = 'ShiftScheduleEdit';

export default ShiftScheduleEdit;
