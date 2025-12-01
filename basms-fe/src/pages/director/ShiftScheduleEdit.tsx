import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import './ShiftScheduleEdit.css';

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

interface Contract {
    id: string;
    contractNumber: string;
    customerId: string;
}

interface ShiftSchedule {
    id: string;
    contractId: string;
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

interface ShiftScheduleEditProps {
    customerId: string;
}

export interface ShiftScheduleEditHandle {
    saveShiftSchedule: () => Promise<boolean>;
    hasChanges: () => boolean;
}

const SCHEDULE_NAMES = [
    { value: 'morning', label: 'Ca sáng' },
    { value: 'afternoon', label: 'Ca chiều' },
    { value: 'night', label: 'Ca đêm' }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const SECONDS = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const ShiftScheduleEdit = forwardRef<ShiftScheduleEditHandle, ShiftScheduleEditProps>(({
    customerId
}, ref) => {
    // API data states
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);

    // Loading states
    const [isLoadingContracts, setIsLoadingContracts] = useState(false);
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [formData, setFormData] = useState<ShiftScheduleData>({
        scheduleName: 'morning',
        scheduleType: 'regular',
        shiftStartTime: '07:00:00',
        shiftEndTime: '16:00:00',
        crossesMidnight: false,
        durationHours: 9.0,
        breakMinutes: 60,
        guardsPerShift: 3,
        recurrenceType: 'weekly',
        appliesMonday: true,
        appliesTuesday: true,
        appliesWednesday: true,
        appliesThursday: true,
        appliesFriday: true,
        appliesSaturday: false,
        appliesSunday: false,
        appliesOnPublicHolidays: true,
        appliesOnCustomerHolidays: true,
        appliesOnWeekends: false,
        skipWhenLocationClosed: false,
        requiresArmedGuard: false,
        requiresSupervisor: true,
        minimumExperienceMonths: 12,
        requiredCertifications: null,
        autoGenerateEnabled: true,
        generateAdvanceDays: 30,
        effectiveFrom: '2025-01-01T00:00:00',
        effectiveTo: null,
        isActive: true,
        notes: ''
    });

    const [startHour, setStartHour] = useState('07');
    const [startMinute, setStartMinute] = useState('00');
    const [startSecond, setStartSecond] = useState('00');

    const [endHour, setEndHour] = useState('16');
    const [endMinute, setEndMinute] = useState('00');
    const [endSecond, setEndSecond] = useState('00');

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Fetch contracts when component mounts
    useEffect(() => {
        const fetchContracts = async () => {
            if (!customerId) return;

            setIsLoadingContracts(true);
            setLoadError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    setLoadError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/customers/${customerId}/contracts`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch contracts');
                }

                const data = await response.json();
                setContracts(data.contracts || []);

                // Automatically select first contract if available
                if (data.contracts && data.contracts.length > 0) {
                    setContractId(data.contracts[0].id);
                }
            } catch (err) {
                setLoadError('Không thể tải danh sách hợp đồng. Vui lòng thử lại sau.');
            } finally {
                setIsLoadingContracts(false);
            }
        };

        fetchContracts();
    }, [customerId]);

    // Fetch shift schedules when contractId changes
    useEffect(() => {
        const fetchShiftSchedules = async () => {
            if (!contractId) return;

            setIsLoadingSchedules(true);
            setLoadError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    setLoadError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/${contractId}/shift-schedules`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch shift schedules');
                }

                const data = await response.json();
                setShiftSchedules(data.shiftSchedules || []);

                // Automatically select first schedule if available
                if (data.shiftSchedules && data.shiftSchedules.length > 0) {
                    setSelectedScheduleId(data.shiftSchedules[0].id);
                }
            } catch (err) {
                setLoadError('Không thể tải danh sách lịch ca trực. Vui lòng thử lại sau.');
            } finally {
                setIsLoadingSchedules(false);
            }
        };

        fetchShiftSchedules();
    }, [contractId]);

    // Load selected schedule data into form
    useEffect(() => {
        if (!selectedScheduleId) return;

        const selectedSchedule = shiftSchedules.find(s => s.id === selectedScheduleId);
        if (!selectedSchedule) return;

        // Parse time components
        const [startH, startM, startS] = selectedSchedule.shiftStartTime.split(':');
        setStartHour(startH);
        setStartMinute(startM);
        setStartSecond(startS);

        const [endH, endM, endS] = selectedSchedule.shiftEndTime.split(':');
        setEndHour(endH);
        setEndMinute(endM);
        setEndSecond(endS);

        // Set form data
        setFormData({
            scheduleName: selectedSchedule.scheduleName,
            scheduleType: selectedSchedule.scheduleType,
            shiftStartTime: selectedSchedule.shiftStartTime,
            shiftEndTime: selectedSchedule.shiftEndTime,
            crossesMidnight: selectedSchedule.crossesMidnight,
            durationHours: selectedSchedule.durationHours,
            breakMinutes: selectedSchedule.breakMinutes,
            guardsPerShift: selectedSchedule.guardsPerShift,
            recurrenceType: selectedSchedule.recurrenceType,
            appliesMonday: selectedSchedule.appliesMonday,
            appliesTuesday: selectedSchedule.appliesTuesday,
            appliesWednesday: selectedSchedule.appliesWednesday,
            appliesThursday: selectedSchedule.appliesThursday,
            appliesFriday: selectedSchedule.appliesFriday,
            appliesSaturday: selectedSchedule.appliesSaturday,
            appliesSunday: selectedSchedule.appliesSunday,
            appliesOnPublicHolidays: selectedSchedule.appliesOnPublicHolidays,
            appliesOnCustomerHolidays: selectedSchedule.appliesOnCustomerHolidays,
            appliesOnWeekends: selectedSchedule.appliesOnWeekends,
            skipWhenLocationClosed: selectedSchedule.skipWhenLocationClosed,
            requiresArmedGuard: selectedSchedule.requiresArmedGuard,
            requiresSupervisor: selectedSchedule.requiresSupervisor,
            minimumExperienceMonths: selectedSchedule.minimumExperienceMonths,
            requiredCertifications: selectedSchedule.requiredCertifications,
            autoGenerateEnabled: selectedSchedule.autoGenerateEnabled,
            generateAdvanceDays: selectedSchedule.generateAdvanceDays,
            effectiveFrom: selectedSchedule.effectiveFrom,
            effectiveTo: selectedSchedule.effectiveTo,
            isActive: selectedSchedule.isActive,
            notes: selectedSchedule.notes,
        });
    }, [selectedScheduleId, shiftSchedules]);

    // Update shiftStartTime when components change
    useEffect(() => {
        const newStartTime = `${startHour}:${startMinute}:${startSecond}`;
        setFormData(prev => ({ ...prev, shiftStartTime: newStartTime }));
    }, [startHour, startMinute, startSecond]);

    // Update shiftEndTime when components change
    useEffect(() => {
        const newEndTime = `${endHour}:${endMinute}:${endSecond}`;
        setFormData(prev => ({ ...prev, shiftEndTime: newEndTime }));
    }, [endHour, endMinute, endSecond]);

    // Auto-calculate duration
    useEffect(() => {
        calculateDuration();
        validateTimes();
    }, [formData.shiftStartTime, formData.shiftEndTime, formData.scheduleName]);

    // Auto-update appliesOnWeekends
    useEffect(() => {
        const hasWeekendDays = formData.appliesSaturday || formData.appliesSunday;
        setFormData(prev => ({ ...prev, appliesOnWeekends: hasWeekendDays }));
    }, [formData.appliesSaturday, formData.appliesSunday]);

    const calculateDuration = () => {
        const [startH, startM, startS] = formData.shiftStartTime.split(':').map(Number);
        const [endH, endM, endS] = formData.shiftEndTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM + startS / 60;
        let endMinutes = endH * 60 + endM + endS / 60;

        // If end time is before start time, assume it crosses midnight
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60;
        }

        const durationMinutes = endMinutes - startMinutes;
        const durationHours = durationMinutes / 60;

        setFormData(prev => ({
            ...prev,
            durationHours: Math.round(durationHours * 100) / 100
        }));
    };

    const validateTimes = () => {
        const newErrors: { [key: string]: string } = {};
        const [startH, startM] = formData.shiftStartTime.split(':').map(Number);
        const [endH, endM] = formData.shiftEndTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Only validate for morning and afternoon shifts
        if ((formData.scheduleName === 'morning' || formData.scheduleName === 'afternoon') &&
            startMinutes >= endMinutes) {
            newErrors.shiftTime = 'Thời gian bắt đầu phải trước thời gian kết thúc';
        }

        setErrors(newErrors);
    };

    const handleInputChange = (field: keyof ShiftScheduleData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field: keyof ShiftScheduleData) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (formData.breakMinutes <= 0) {
            newErrors.breakMinutes = 'Thời gian nghỉ phải lớn hơn 0';
        }

        if (formData.guardsPerShift <= 0) {
            newErrors.guardsPerShift = 'Số lượng bảo vệ phải lớn hơn 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Expose save function to parent via ref
    useImperativeHandle(ref, () => ({
        saveShiftSchedule: async () => {
            if (!selectedScheduleId) {
                return false;
            }

            if (!validateForm() || Object.keys(errors).length > 0) {
                return false;
            }

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    return false;
                }

                const response = await fetch(`${apiUrl}/contracts/shift-schedules/${selectedScheduleId}`, {
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
            {/* Contract and Schedule Selection */}
            <div className="shift-schedule-section">
                <h3 className="shift-schedule-section-title">Chọn lịch ca trực</h3>

                {isLoadingContracts && (
                    <div className="shift-schedule-info-text">Đang tải danh sách hợp đồng...</div>
                )}

                {loadError && (
                    <div className="shift-schedule-error-text">{loadError}</div>
                )}

                {!isLoadingContracts && contracts.length > 0 && (
                    <div className="shift-schedule-form-grid">
                        <div className="shift-schedule-form-group">
                            <label className="shift-schedule-label">Hợp đồng</label>
                            <select
                                className="shift-schedule-input"
                                value={contractId || ''}
                                onChange={(e) => {
                                    setContractId(e.target.value);
                                    setSelectedScheduleId(null);
                                }}
                            >
                                {contracts.map(contract => (
                                    <option key={contract.id} value={contract.id}>
                                        {contract.contractNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {isLoadingSchedules && (
                    <div className="shift-schedule-info-text">Đang tải danh sách lịch ca trực...</div>
                )}

                {!isLoadingSchedules && shiftSchedules.length > 0 && (
                    <div className="shift-schedule-list">
                        <label className="shift-schedule-label">Chọn ca trực để chỉnh sửa</label>
                        <div className="shift-schedule-cards">
                            {shiftSchedules.map(schedule => (
                                <div
                                    key={schedule.id}
                                    className={`shift-schedule-card ${selectedScheduleId === schedule.id ? 'shift-schedule-card-selected' : ''}`}
                                    onClick={() => setSelectedScheduleId(schedule.id)}
                                >
                                    <div className="shift-schedule-card-header">
                                        <span className="shift-schedule-card-name">
                                            {getScheduleNameLabel(schedule.scheduleName)}
                                        </span>
                                        <span className={`shift-schedule-card-status ${schedule.isActive ? 'shift-schedule-status-active' : 'shift-schedule-status-inactive'}`}>
                                            {schedule.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </div>
                                    <div className="shift-schedule-card-time">
                                        {schedule.shiftStartTime} - {schedule.shiftEndTime}
                                    </div>
                                    <div className="shift-schedule-card-details">
                                        <span>{schedule.guardsPerShift} bảo vệ</span>
                                        <span>•</span>
                                        <span>{schedule.durationHours}h</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isLoadingContracts && !isLoadingSchedules && shiftSchedules.length === 0 && contractId && (
                    <div className="shift-schedule-info-text">Không có lịch ca trực nào cho hợp đồng này.</div>
                )}
            </div>

            {/* Only show form if a schedule is selected */}
            {selectedScheduleId && (
                <>
                    <div className="shift-schedule-section">
                        <h3 className="shift-schedule-section-title">Thông tin ca trực</h3>

                        <div className="shift-schedule-form-grid">
                            {/* Schedule Name */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Tên ca trực *</label>
                                <select
                                    className="shift-schedule-input"
                                    value={formData.scheduleName}
                                    onChange={(e) => handleInputChange('scheduleName', e.target.value)}
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
                                    onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                                />
                            </div>

                            {/* Start Time */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Giờ bắt đầu *</label>
                                <div className="shift-schedule-time-picker">
                                    <select
                                        className="shift-schedule-time-input"
                                        value={startHour}
                                        onChange={(e) => setStartHour(e.target.value)}
                                    >
                                        {HOURS.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={startMinute}
                                        onChange={(e) => setStartMinute(e.target.value)}
                                    >
                                        {MINUTES.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={startSecond}
                                        onChange={(e) => setStartSecond(e.target.value)}
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
                                        value={endHour}
                                        onChange={(e) => setEndHour(e.target.value)}
                                    >
                                        {HOURS.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={endMinute}
                                        onChange={(e) => setEndMinute(e.target.value)}
                                    >
                                        {MINUTES.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select
                                        className="shift-schedule-time-input"
                                        value={endSecond}
                                        onChange={(e) => setEndSecond(e.target.value)}
                                    >
                                        {SECONDS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.shiftTime && (
                                    <span className="shift-schedule-error-text">{errors.shiftTime}</span>
                                )}
                            </div>

                            {/* Crosses Midnight - only for night shift */}
                            {formData.scheduleName === 'night' && (
                                <div className="shift-schedule-form-group">
                                    <label className="shift-schedule-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.crossesMidnight}
                                            onChange={() => handleCheckboxChange('crossesMidnight')}
                                        />
                                        <span>Qua nửa đêm</span>
                                    </label>
                                </div>
                            )}

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
                                    onChange={(e) => handleInputChange('breakMinutes', Number(e.target.value))}
                                    min="1"
                                />
                                {errors.breakMinutes && (
                                    <span className="shift-schedule-error-text">{errors.breakMinutes}</span>
                                )}
                            </div>

                            {/* Guards Per Shift */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Số bảo vệ/ca *</label>
                                <input
                                    type="number"
                                    className="shift-schedule-input"
                                    value={formData.guardsPerShift}
                                    onChange={(e) => handleInputChange('guardsPerShift', Number(e.target.value))}
                                    min="1"
                                />
                                {errors.guardsPerShift && (
                                    <span className="shift-schedule-error-text">{errors.guardsPerShift}</span>
                                )}
                            </div>

                            {/* Recurrence Type */}
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Loại lặp lại *</label>
                                <input
                                    type="text"
                                    className="shift-schedule-input"
                                    value={formData.recurrenceType}
                                    onChange={(e) => handleInputChange('recurrenceType', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Days of Week */}
                    <div className="shift-schedule-section">
                        <h3 className="shift-schedule-section-title">Áp dụng theo ngày</h3>
                        <div className="shift-schedule-days-grid">
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesMonday}
                                    onChange={() => handleCheckboxChange('appliesMonday')}
                                />
                                <span>Thứ 2</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesTuesday}
                                    onChange={() => handleCheckboxChange('appliesTuesday')}
                                />
                                <span>Thứ 3</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesWednesday}
                                    onChange={() => handleCheckboxChange('appliesWednesday')}
                                />
                                <span>Thứ 4</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesThursday}
                                    onChange={() => handleCheckboxChange('appliesThursday')}
                                />
                                <span>Thứ 5</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesFriday}
                                    onChange={() => handleCheckboxChange('appliesFriday')}
                                />
                                <span>Thứ 6</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesSaturday}
                                    onChange={() => handleCheckboxChange('appliesSaturday')}
                                />
                                <span>Thứ 7</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesSunday}
                                    onChange={() => handleCheckboxChange('appliesSunday')}
                                />
                                <span>Chủ nhật</span>
                            </label>
                        </div>
                        {formData.appliesOnWeekends && (
                            <p className="shift-schedule-info-text">✓ Tự động áp dụng cho cuối tuần</p>
                        )}
                    </div>

                    {/* Other Options */}
                    <div className="shift-schedule-section">
                        <h3 className="shift-schedule-section-title">Tùy chọn khác</h3>
                        <div className="shift-schedule-checkboxes-grid">
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesOnPublicHolidays}
                                    onChange={() => handleCheckboxChange('appliesOnPublicHolidays')}
                                />
                                <span>Áp dụng vào ngày lễ</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.appliesOnCustomerHolidays}
                                    onChange={() => handleCheckboxChange('appliesOnCustomerHolidays')}
                                />
                                <span>Áp dụng vào ngày nghỉ của khách hàng</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.skipWhenLocationClosed}
                                    onChange={() => handleCheckboxChange('skipWhenLocationClosed')}
                                />
                                <span>Bỏ qua khi địa điểm đóng cửa</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresArmedGuard}
                                    onChange={() => handleCheckboxChange('requiresArmedGuard')}
                                />
                                <span>Yêu cầu bảo vệ có vũ trang</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresSupervisor}
                                    onChange={() => handleCheckboxChange('requiresSupervisor')}
                                />
                                <span>Yêu cầu giám sát viên</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.autoGenerateEnabled}
                                    onChange={() => handleCheckboxChange('autoGenerateEnabled')}
                                />
                                <span>Tự động tạo lịch</span>
                            </label>
                            <label className="shift-schedule-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={() => handleCheckboxChange('isActive')}
                                />
                                <span>Đang hoạt động</span>
                            </label>
                        </div>
                    </div>

                    {/* Additional Fields */}
                    <div className="shift-schedule-section">
                        <h3 className="shift-schedule-section-title">Thông tin bổ sung</h3>
                        <div className="shift-schedule-form-grid">
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Kinh nghiệm tối thiểu (tháng)</label>
                                <input
                                    type="number"
                                    className="shift-schedule-input"
                                    value={formData.minimumExperienceMonths}
                                    onChange={(e) => handleInputChange('minimumExperienceMonths', Number(e.target.value))}
                                    min="0"
                                />
                            </div>
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Số ngày tạo trước</label>
                                <input
                                    type="number"
                                    className="shift-schedule-input"
                                    value={formData.generateAdvanceDays}
                                    onChange={(e) => handleInputChange('generateAdvanceDays', Number(e.target.value))}
                                    min="0"
                                />
                            </div>
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Hiệu lực từ</label>
                                <input
                                    type="date"
                                    className="shift-schedule-input"
                                    value={formData.effectiveFrom.split('T')[0]}
                                    onChange={(e) => handleInputChange('effectiveFrom', `${e.target.value}T00:00:00`)}
                                />
                            </div>
                            <div className="shift-schedule-form-group">
                                <label className="shift-schedule-label">Hiệu lực đến</label>
                                <input
                                    type="date"
                                    className="shift-schedule-input"
                                    value={formData.effectiveTo ? formData.effectiveTo.split('T')[0] : ''}
                                    onChange={(e) => handleInputChange('effectiveTo', e.target.value ? `${e.target.value}T00:00:00` : null)}
                                />
                            </div>
                            <div className="shift-schedule-form-group shift-schedule-full-width">
                                <label className="shift-schedule-label">Ghi chú</label>
                                <textarea
                                    className="shift-schedule-textarea"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

ShiftScheduleEdit.displayName = 'ShiftScheduleEdit';

export default ShiftScheduleEdit;
