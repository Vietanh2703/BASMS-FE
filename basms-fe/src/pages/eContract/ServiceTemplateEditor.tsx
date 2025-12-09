import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEContractAuth } from '../../hooks/useEContractAuth';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import './ServiceTemplateEditor.css';

interface FieldFormatting {
    bold: boolean;
    italic: boolean;
    underline: boolean;
}

interface FormField {
    fieldName: string;
    value: string;
    formatting: FieldFormatting;
    isTextarea?: boolean;
}

interface FormData {
    [key: string]: FormField;
}

const ServiceTemplateEditor = () => {
    const navigate = useNavigate();
    const { user, logout } = useEContractAuth();
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('template');

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Form data with formatting
    const [formData, setFormData] = useState<FormData>({
        ContractNumber: { fieldName: 'Số hợp đồng', value: '', formatting: { bold: false, italic: false, underline: false } },
        SignDay: { fieldName: 'Ngày ký', value: '', formatting: { bold: false, italic: false, underline: false } },
        SignMonth: { fieldName: 'Tháng ký', value: '', formatting: { bold: false, italic: false, underline: false } },
        SignYear: { fieldName: 'Năm ký', value: '', formatting: { bold: false, italic: false, underline: false } },
        SignLocation: { fieldName: 'Địa điểm ký', value: '', formatting: { bold: false, italic: false, underline: false } },
        CompanyName: { fieldName: 'Tên công ty (Bên B)', value: '', formatting: { bold: false, italic: false, underline: false } },
        Address: { fieldName: 'Địa chỉ công ty', value: '', formatting: { bold: false, italic: false, underline: false } },
        Phone: { fieldName: 'Số điện thoại công ty', value: '', formatting: { bold: false, italic: false, underline: false } },
        CompanyEmail: { fieldName: 'Email công ty', value: '', formatting: { bold: false, italic: false, underline: false } },
        TaxCode: { fieldName: 'Mã số thuế', value: '', formatting: { bold: false, italic: false, underline: false } },
        Gender: { fieldName: 'Ông/Bà', value: '', formatting: { bold: false, italic: false, underline: false } },
        Name: { fieldName: 'Họ tên đại diện', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeIdentityNumber: { fieldName: 'Số CCCD đại diện', value: '', formatting: { bold: false, italic: false, underline: false } },
        GuardQuantity: { fieldName: 'Số lượng bảo vệ', value: '', formatting: { bold: false, italic: false, underline: false } },
        ContractStartDate: { fieldName: 'Ngày bắt đầu HĐ', value: '', formatting: { bold: false, italic: false, underline: false } },
        ContractEndDate: { fieldName: 'Ngày kết thúc HĐ', value: '', formatting: { bold: false, italic: false, underline: false } },
        TaskPeriod: { fieldName: 'Thời gian làm việc', value: '', formatting: { bold: false, italic: false, underline: false } },
        ShiftQuantityPerDay: { fieldName: 'Số ca mỗi ngày', value: '', formatting: { bold: false, italic: false, underline: false } },
        TaskSchedules: { fieldName: 'Lịch trực các ca', value: '', formatting: { bold: false, italic: false, underline: false }, isTextarea: true },
        WeekendPolicy: { fieldName: 'Chính sách cuối tuần', value: '', formatting: { bold: false, italic: false, underline: false }, isTextarea: true },
        HolidayPolicy: { fieldName: 'Chính sách ngày lễ', value: '', formatting: { bold: false, italic: false, underline: false }, isTextarea: true },
    });

    const [activeField, setActiveField] = useState<string | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Validation states
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [showSnackbarWarning, setShowSnackbarWarning] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Memoized callback to close snackbar
    const handleCloseSnackbar = useCallback(() => {
        setShowSnackbarWarning(false);
    }, []);

    // Auto-generate contract number and sign date on mount
    useEffect(() => {
        // Only generate if not already set (not from saved data)
        if (!formData.ContractNumber.value) {
            // Generate 8 random digits
            const randomNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

            // Get current date
            const now = new Date();
            const day = now.getDate().toString();
            const month = (now.getMonth() + 1).toString();
            const year = now.getFullYear().toString();

            setFormData(prev => ({
                ...prev,
                ContractNumber: { ...prev.ContractNumber, value: randomNumber },
                SignDay: { ...prev.SignDay, value: day },
                SignMonth: { ...prev.SignMonth, value: month },
                SignYear: { ...prev.SignYear, value: year },
            }));
        }
    }, []);

    // Load saved data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('serviceContractReviewData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.templateId === templateId && data.formData) {
                    setFormData(data.formData);
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
        setIsDataLoaded(true);
    }, [templateId]);

    useEffect(() => {
        if (isDataLoaded && templateId) {
            const contractData = {
                templateId: templateId,
                formData: formData
            };
            localStorage.setItem('serviceContractReviewData', JSON.stringify(contractData));
        }
    }, [formData, templateId, isDataLoaded]);

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

    const handleInputChange = (fieldKey: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [fieldKey]: {
                ...prev[fieldKey],
                value: value
            }
        }));
    };

    const toggleFormatting = (fieldKey: string, formatType: 'bold' | 'italic' | 'underline') => {
        setFormData(prev => ({
            ...prev,
            [fieldKey]: {
                ...prev[fieldKey],
                formatting: {
                    ...prev[fieldKey].formatting,
                    [formatType]: !prev[fieldKey].formatting[formatType]
                }
            }
        }));
    };

    const getFieldStyle = (fieldKey: string): React.CSSProperties => {
        const formatting = formData[fieldKey].formatting;
        return {
            fontWeight: formatting.bold ? 'bold' : 'normal',
            fontStyle: formatting.italic ? 'italic' : 'normal',
            textDecoration: formatting.underline ? 'underline' : 'none'
        };
    };

    const renderFieldValue = (fieldKey: string) => {
        const field = formData[fieldKey];
        if (!field.value) {
            return <span className="sted-field-placeholder">.....................</span>;
        }
        return <span style={getFieldStyle(fieldKey)}>{field.value}</span>;
    };

    // Render multiline text with proper line breaks
    const renderMultilineText = (fieldName: string) => {
        const field = formData[fieldName];
        if (!field || !field.value) {
            return <span className="sted-field-placeholder">.....................</span>;
        }

        const style = getFieldStyle(fieldName);
        // Split by \\n and render as separate paragraphs
        const lines = field.value.split('\\n');
        return (
            <>
                {lines.map((line, index) => (
                    <p key={index} style={style}>{line}</p>
                ))}
            </>
        );
    };

    // Validation helper functions
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPhoneNumber = (phone: string): boolean => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    };

    const isValidCCCD = (cccd: string): boolean => {
        const cccdRegex = /^\d{12}$/;
        return cccdRegex.test(cccd);
    };

    const isValidDate = (dateString: string): boolean => {
        if (!dateString) return false;
        const parts = dateString.split('/');
        if (parts.length !== 3) return false;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month - 1, day);
        return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
    };

    const isDateNotBeforeToday = (dateString: string): boolean => {
        if (!dateString) return false;
        const parts = dateString.split('/');
        if (parts.length !== 3) return false;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate >= today;
    };

    const isSignDateValid = (): boolean => {
        const day = formData.SignDay.value;
        const month = formData.SignMonth.value;
        const year = formData.SignYear.value;
        if (!day || !month || !year) return false;

        const dateString = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        if (!isValidDate(dateString)) return false;
        return isDateNotBeforeToday(dateString);
    };

    const validateAllFields = (): boolean => {
        const errors: { [key: string]: string } = {};
        let hasError = false;

        Object.keys(formData).forEach(fieldKey => {
            const field = formData[fieldKey];
            const value = field.value.trim();

            // Check if empty
            if (!value) {
                errors[fieldKey] = 'Trường này không được để trống';
                hasError = true;
                return;
            }

            // Validate specific field formats
            switch (fieldKey) {
                case 'Phone':
                    if (!isValidPhoneNumber(value)) {
                        errors[fieldKey] = 'Số điện thoại phải có 10 số';
                        hasError = true;
                    }
                    break;
                case 'EmployeeIdentityNumber':
                    if (!isValidCCCD(value)) {
                        errors[fieldKey] = 'Số CCCD phải có 12 số';
                        hasError = true;
                    }
                    break;
                case 'CompanyEmail':
                    if (!isValidEmail(value)) {
                        errors[fieldKey] = 'Email không hợp lệ';
                        hasError = true;
                    }
                    break;
                case 'SignDay':
                case 'SignMonth':
                case 'SignYear':
                    if (fieldKey === 'SignYear' && formData.SignDay.value && formData.SignMonth.value && value) {
                        if (!isSignDateValid()) {
                            errors.SignDay = 'Ngày ký không hợp lệ hoặc trước hôm nay';
                            errors.SignMonth = 'Ngày ký không hợp lệ hoặc trước hôm nay';
                            errors.SignYear = 'Ngày ký không hợp lệ hoặc trước hôm nay';
                            hasError = true;
                        }
                    }
                    break;
                case 'ContractStartDate':
                    if (!isValidDate(value)) {
                        errors[fieldKey] = 'Ngày bắt đầu không hợp lệ (dd/mm/yyyy)';
                        hasError = true;
                    } else if (!isDateNotBeforeToday(value)) {
                        errors[fieldKey] = 'Ngày bắt đầu không được trước hôm nay';
                        hasError = true;
                    }
                    break;
                case 'ContractEndDate':
                    if (!isValidDate(value)) {
                        errors[fieldKey] = 'Ngày kết thúc không hợp lệ (dd/mm/yyyy)';
                        hasError = true;
                    } else if (!isDateNotBeforeToday(value)) {
                        errors[fieldKey] = 'Ngày kết thúc không được trước hôm nay';
                        hasError = true;
                    } else if (formData.ContractStartDate.value && isValidDate(formData.ContractStartDate.value)) {
                        const startParts = formData.ContractStartDate.value.split('/');
                        const endParts = value.split('/');
                        const startDate = new Date(parseInt(startParts[2]), parseInt(startParts[1]) - 1, parseInt(startParts[0]));
                        const endDate = new Date(parseInt(endParts[2]), parseInt(endParts[1]) - 1, parseInt(endParts[0]));
                        if (endDate < startDate) {
                            errors[fieldKey] = 'Ngày kết thúc không được trước ngày bắt đầu';
                            hasError = true;
                        }
                    }
                    break;
            }
        });

        setFieldErrors(errors);
        return !hasError;
    };

    const handleSubmit = () => {
        const isValid = validateAllFields();

        if (!isValid) {
            setShowSnackbarWarning(false);
            setTimeout(() => {
                setSnackbarMessage(`Vui lòng kiểm tra và điền đầy đủ thông tin. Có một số trường chưa hợp lệ hoặc bị bỏ trống.`);
                setShowSnackbarWarning(true);
            }, 10);
            return;
        }

        setFieldErrors({});

        const contractData = {
            templateId: templateId,
            formData: formData
        };

        localStorage.setItem('serviceContractReviewData', JSON.stringify(contractData));
        navigate('/e-contracts/service-template-review');
    };

    return (
        <div className="sted-container">
            <aside className={`sted-sidebar ${isMenuOpen ? 'sted-sidebar-open' : 'sted-sidebar-closed'}`}>
                <div className="sted-sidebar-header">
                    <div className="sted-sidebar-logo">
                        <div className="sted-logo-icon">E</div>
                        {isMenuOpen && <span className="sted-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="sted-sidebar-nav">
                    <ul className="sted-nav-list">
                        <li className="sted-nav-item">
                            <a href="/e-contracts/dashboard" className="sted-nav-link">
                                <svg className="sted-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="sted-nav-item sted-nav-active">
                            <a href="/e-contracts/list" className="sted-nav-link">
                                <svg className="sted-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`sted-main-content ${isMenuOpen ? 'sted-content-expanded' : 'sted-content-collapsed'}`}>
                <header className="sted-nav-header">
                    <div className="sted-nav-left">
                        <button className="sted-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="sted-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="sted-nav-right">
                        <button className="sted-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="sted-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="sted-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="sted-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="sted-user-info">
                                <span className="sted-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="sted-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="sted-profile-dropdown">
                                    <div
                                        className={`sted-dropdown-item sted-logout-item ${isLoggingOut ? 'sted-disabled' : ''}`}
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
                                        <svg className="sted-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="sted-main">
                    <div className="sted-page-header">
                        <div>
                            <h1 className="sted-page-title">Điền thông tin hợp đồng dịch vụ bảo vệ</h1>
                            <p className="sted-page-subtitle">Template: {templateId || 'Hợp đồng dịch vụ bảo vệ'}</p>
                        </div>
                        <div className="sted-header-actions">
                            <button className="sted-back-btn" onClick={() => navigate('/e-contracts/create-new-contract')}>
                                Quay lại
                            </button>
                            <button className="sted-submit-btn" onClick={handleSubmit}>
                                Xem trước
                            </button>
                        </div>
                    </div>

                    <div className="sted-editor-body">
                        {/* Left Panel - Form Fields */}
                        <div className="sted-form-panel">
                            <div className="sted-form-header">
                                <h3 className="sted-form-title">Thông tin hợp đồng</h3>
                                <p className="sted-form-subtitle">Điền thông tin vào các trường bên dưới</p>
                            </div>

                            <div className="sted-form-content">
                                {Object.keys(formData).map((fieldKey) => (
                                    <div key={fieldKey} className="sted-field-group">
                                        <label className="sted-field-label">
                                            {formData[fieldKey].fieldName}
                                            <span className="sted-required-mark"> *</span>
                                        </label>
                                        <div className="sted-field-input-wrapper">
                                            {fieldKey === 'Gender' ? (
                                                <div className="sted-gender-selector">
                                                    <button
                                                        type="button"
                                                        className={`sted-gender-btn ${formData[fieldKey].value === 'Ông' ? 'sted-gender-active' : ''} ${fieldErrors[fieldKey] ? 'sted-field-error' : ''}`}
                                                        onClick={() => handleInputChange(fieldKey, 'Ông')}
                                                    >
                                                        Ông
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`sted-gender-btn ${formData[fieldKey].value === 'Bà' ? 'sted-gender-active' : ''} ${fieldErrors[fieldKey] ? 'sted-field-error' : ''}`}
                                                        onClick={() => handleInputChange(fieldKey, 'Bà')}
                                                    >
                                                        Bà
                                                    </button>
                                                </div>
                                            ) : formData[fieldKey].isTextarea ? (
                                                <textarea
                                                    className={`sted-field-textarea ${activeField === fieldKey ? 'sted-field-active' : ''} ${fieldErrors[fieldKey] ? 'sted-field-error' : ''}`}
                                                    value={formData[fieldKey].value}
                                                    onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                    onFocus={() => setActiveField(fieldKey)}
                                                    onBlur={() => setActiveField(null)}
                                                    placeholder={`Nhập ${formData[fieldKey].fieldName.toLowerCase()}...`}
                                                    style={getFieldStyle(fieldKey)}
                                                    rows={6}
                                                />
                                            ) : ['ContractNumber', 'SignDay', 'SignMonth', 'SignYear'].includes(fieldKey) ? (
                                                // Read-only input for auto-generated fields
                                                <input
                                                    type="text"
                                                    className={`sted-field-input ${activeField === fieldKey ? 'sted-field-active' : ''} ${fieldErrors[fieldKey] ? 'sted-field-error' : ''}`}
                                                    value={formData[fieldKey].value}
                                                    readOnly
                                                    placeholder="Tự động điền"
                                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    className={`sted-field-input ${activeField === fieldKey ? 'sted-field-active' : ''} ${fieldErrors[fieldKey] ? 'sted-field-error' : ''}`}
                                                    value={formData[fieldKey].value}
                                                    onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                    onFocus={() => setActiveField(fieldKey)}
                                                    onBlur={() => setActiveField(null)}
                                                    placeholder={`Nhập ${formData[fieldKey].fieldName.toLowerCase()}...`}
                                                    style={getFieldStyle(fieldKey)}
                                                />
                                            )}
                                            {fieldErrors[fieldKey] && (
                                                <div className="sted-field-error-message">{fieldErrors[fieldKey]}</div>
                                            )}
                                            <div className="sted-formatting-toolbar">
                                                <button
                                                    className={`sted-format-btn ${formData[fieldKey].formatting.bold ? 'sted-format-active' : ''}`}
                                                    onClick={() => toggleFormatting(fieldKey, 'bold')}
                                                    title="Bold"
                                                >
                                                    <strong>B</strong>
                                                </button>
                                                <button
                                                    className={`sted-format-btn ${formData[fieldKey].formatting.italic ? 'sted-format-active' : ''}`}
                                                    onClick={() => toggleFormatting(fieldKey, 'italic')}
                                                    title="Italic"
                                                >
                                                    <em>I</em>
                                                </button>
                                                <button
                                                    className={`sted-format-btn ${formData[fieldKey].formatting.underline ? 'sted-format-active' : ''}`}
                                                    onClick={() => toggleFormatting(fieldKey, 'underline')}
                                                    title="Underline"
                                                >
                                                    <u>U</u>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel - Template Preview */}
                        <div className="sted-preview-panel">
                            <div className="sted-preview-header">
                                <h3 className="sted-preview-title">Xem trước hợp đồng</h3>
                                <p className="sted-preview-subtitle">Nội dung tự động cập nhật khi bạn nhập liệu</p>
                            </div>

                            <div className="sted-preview-content">
                                <div className="ste-preview-document-pages">
                                    {/* Page 1 */}
                                    <div className="ste-preview-a4-page">
                                        <div className="ste-preview-doc-header">
                                            <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                            <p>Độc lập – Tự do – Hạnh phúc</p>
                                        </div>

                                        <h2 className="ste-preview-doc-title">HỢP ĐỒNG DỊCH VỤ BẢO VỆ</h2>
                                        <p className="ste-preview-doc-subtitle">
                                            Số: {renderFieldValue('ContractNumber')}/HDDVBV
                                        </p>

                                        <div className="ste-preview-doc-body">
                                            <p><strong>Căn cứ:</strong></p>
                                            <p>– Bộ luật Dân sự 2015;</p>
                                            <p>– Luật Thương mại 2005;</p>
                                            <p>– Nghị định 96/2016/NĐ-CP (được sửa đổi, bổ sung bởi Nghị định 56/2023/NĐ-CP) về điều kiện an ninh, trật tự đối với ngành, nghề đầu tư kinh doanh có điều kiện;</p>
                                            <p style={{ marginBottom: '30px' }}>– Nhu cầu và thỏa thuận của các bên.</p>
                                            <p>
                                                Hôm nay, ngày {renderFieldValue('SignDay')} tháng {renderFieldValue('SignMonth')} năm {renderFieldValue('SignYear')} tại {renderFieldValue('SignLocation')}, chúng tôi gồm có:
                                            </p>

                                            <p className="ste-preview-section-title">BÊN A: CÔNG TY TNHH AN NINH CON HỔ</p>
                                            <p>Địa chỉ: Quận Phú Nhuận, TPHCM</p>
                                            <p>Điện thoại: 0346666577</p>
                                            <p>Email: anh.aty2732004@gmail.com</p>
                                            <p>Mã số thuế: 0123456789</p>
                                            <p>Đại diện: Ông Nguyễn Văn Bảnh – Giám đốc</p>
                                            <p>Số CCCD: 082204156723</p>

                                            <p className="ste-preview-section-title">BÊN B: {renderFieldValue('CompanyName')}</p>
                                            <p>Địa chỉ: {renderFieldValue('Address')}</p>
                                            <p>Điện thoại: {renderFieldValue('Phone')}</p>
                                            <p>Email: {renderFieldValue('CompanyEmail')}</p>
                                            <p>Mã số thuế: {renderFieldValue('TaxCode')}</p>
                                            <p>Đại diện: {renderFieldValue('Gender')} {renderFieldValue('Name')} – Giám đốc điều hành</p>
                                            <p>Số CCCD: {renderFieldValue('EmployeeIdentityNumber')}</p>

                                            <p>Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:</p>

                                            <p className="ste-preview-section-title">ĐIỀU 1: ĐỐI TƯỢNG VÀ PHẠM VI HỢP ĐỒNG</p>
                                            <p>Bên A cung cấp dịch vụ bảo vệ chuyên nghiệp cho Bên B tại địa điểm:</p>
                                            <p>– Tên địa điểm: {renderFieldValue('CompanyName')}</p>
                                            <p>– Địa chỉ: {renderFieldValue('Address')}</p>
                                            <p>– Số lượng: {renderFieldValue('GuardQuantity')}</p>
                                        </div>
                                    </div>

                                    {/* Page 2 */}
                                    <div className="ste-preview-a4-page">
                                        <div className="ste-preview-doc-body">
                                            <p className="ste-preview-section-title">ĐIỀU 2: THỜI HẠN HỢP ĐỒNG</p>
                                            <p>Hợp đồng có hiệu lực từ ngày {renderFieldValue('ContractStartDate')} đến ngày {renderFieldValue('ContractEndDate')}. Hai bên có thể gia hạn hợp đồng bằng phụ lục hợp đồng khi có thỏa thuận bằng văn bản.</p>
                                            <p>– Bên B có trách nhiệm cung cấp thông tin về thời gian diễn ra các hoạt động, sự kiện hoặc thay đổi có thể ảnh hưởng đến lịch trực để Bên A chủ động sắp xếp nhân sự phù hợp.</p>
                                            <p>– Bên A chịu trách nhiệm quản lý, kiểm tra và đảm bảo chất lượng ca trực, đồng thời thay thế ngay nhân viên vi phạm quy định hoặc không đáp ứng yêu cầu nhiệm vụ.</p>
                                            <p>– Nhân viên bảo vệ của Bên A phải có mặt tại vị trí trực đúng giờ, không tự ý rời khỏi vị trí, không đổi ca hoặc nghỉ ca khi chưa có sự chấp thuận của người quản lý được phân công.</p>

                                            <p className="ste-preview-section-title">ĐIỀU 3: LỊCH LÀM VIỆC, CA TRỰC, NGÀY NGHỈ VÀ TĂNG CA</p>
                                            <p><strong>3.1. Quy định chung về ca trực</strong></p>
                                            <p>– Bên A bố trí nhân viên bảo vệ làm việc {renderFieldValue('TaskPeriod')}, đảm bảo an ninh trật tự tại khu vực Nhà Văn hoá Sinh viên TP.HCM.</p>
                                            <p>– Mỗi ngày chia thành {renderFieldValue('ShiftQuantityPerDay')} ca làm việc như sau:</p>
                                            <div className="ste-preview-multiline-field" style={{ textIndent: '30px' }}>
                                                {renderMultilineText('TaskSchedules')}
                                            </div>
                                            <p>– Mỗi ca bảo đảm đủ quân số, không gián đoạn công tác bảo vệ.</p>
                                            <p>– Nhân viên phải có mặt đúng giờ, không tự ý rời ca, đổi ca hoặc nghỉ ca khi chưa được người quản lý phê duyệt.</p>

                                            <p><strong>3.2. Lịch làm việc và ngày nghỉ thường xuyên</strong></p>
                                            <p>– Mỗi nhân viên bảo vệ được bố trí nghỉ 01 (một) ngày/tuần, theo lịch luân phiên do Bên A sắp xếp, bảo đảm mục tiêu luôn có đủ nhân lực trực 24/24.</p>
                                            <p>– Lịch nghỉ được quản lý nội bộ của Bên A điều phối nhưng phải duy trì quân số trực tại mục tiêu, không làm gián đoạn dịch vụ.</p>

                                            <p><strong>3.3. Ca trực cuối tuần (Thứ Bảy và Chủ Nhật)</strong></p>
                                            <div className="ste-preview-multiline-field">
                                                {renderMultilineText('WeekendPolicy')}
                                            </div>

                                            <p><strong>3.4. Ngày lễ, Tết</strong></p>
                                            <div className="ste-preview-multiline-field">
                                                {renderMultilineText('HolidayPolicy')}
                                            </div>

                                            <p><strong>3.5. Tăng ca và điều động đột xuất</strong></p>
                                            <p>– Khi có yêu cầu tăng cường nhân lực (do sự kiện, chương trình đặc biệt hoặc tình huống khẩn cấp), Bên A phải kịp thời điều động nhân viên bổ sung theo yêu cầu hợp lý của Bên B.</p>
                                            <p>– Khi nhân viên xin nghỉ đột xuất, Bên A phải bố trí người thay thế kịp thời để không ảnh hưởng đến nhiệm vụ.</p>
                                            <p>– Việc tăng ca được ghi nhận và tính theo chính sách nội bộ của Bên A.</p>

                                            <p><strong>3.6. Thông báo và điều chỉnh ca trực</strong></p>
                                            <p>– Mọi thay đổi về ca trực, số lượng nhân viên hoặc lịch làm việc phải được hai bên thông báo và thống nhất bằng văn bản hoặc email hợp lệ trước ít nhất 24 giờ, trừ trường hợp khẩn cấp.</p>
                                            <p>– Bên B có trách nhiệm thông báo trước cho Bên A về các hoạt động, sự kiện có thể ảnh hưởng đến công tác bảo vệ để Bên A chủ động bố trí lực lượng.</p>
                                        </div>
                                    </div>

                                    {/* Page 3 */}
                                    <div className="ste-preview-a4-page">
                                        <div className="ste-preview-doc-body">
                                            <p className="ste-preview-section-title">ĐIỀU 4: GIÁ TRỊ VÀ PHƯƠNG THỨC THANH TOÁN</p>
                                            <p>Tổng giá trị hợp đồng: ………………………………………..</p>
                                            <p>Phương thức thanh toán: Bên B thanh toán cho Bên A hàng tháng bằng hình thức chuyển khoản vào tài khoản của Bên A trong vòng 05 (năm) ngày kể từ ngày nhận hóa đơn hợp lệ.</p>
                                            <p>Tài khoản Bên A: ……………………………………………..</p>

                                            <p className="ste-preview-section-title">ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</p>
                                            <p>– Cung cấp đầy đủ nhân sự bảo vệ đúng thời gian, ca trực và tiêu chuẩn chuyên môn đã thỏa thuận.</p>
                                            <p>– Đảm bảo nhân viên bảo vệ có đồng phục, thẻ tên và được đào tạo nghiệp vụ.</p>
                                            <p>– Giám sát, kiểm tra thường xuyên hoạt động của nhân viên bảo vệ tại địa điểm làm việc.</p>
                                            <p>– Bồi thường thiệt hại cho Bên B nếu lỗi do nhân viên Bên A gây ra trong quá trình thực hiện công việc.</p>
                                            <p>– Thay thế nhân viên bảo vệ khi có yêu cầu hợp lý từ Bên B trong vòng 24 giờ.</p>

                                            <p className="ste-preview-section-title">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</p>
                                            <p>– Thanh toán đúng hạn theo quy định tại Điều 4 của hợp đồng.</p>
                                            <p>– Cung cấp đầy đủ thông tin, nội quy, quy định của địa điểm bảo vệ để Bên A nắm rõ.</p>
                                            <p>– Có quyền yêu cầu thay đổi nhân viên bảo vệ nếu nhân viên đó vi phạm quy định, thiếu trách nhiệm.</p>
                                            <p>– Phối hợp với Bên A trong việc xử lý các tình huống phát sinh liên quan đến an ninh, trật tự.</p>

                                            <p className="ste-preview-section-title">ĐIỀU 7: TRÁCH NHIỆM VÀ BỒI THƯỜNG THIỆT HẠI</p>
                                            <p>Hai bên có trách nhiệm phối hợp giải quyết mọi sự cố an ninh xảy ra tại khu vực bảo vệ. Nếu thiệt hại xảy ra do lỗi chủ quan của nhân viên bảo vệ, Bên A chịu trách nhiệm bồi thường theo quy định của pháp luật.</p>

                                            <p className="ste-preview-section-title">ĐIỀU 8: BẢO MẬT VÀ XỬ LÝ THÔNG TIN</p>
                                            <p>Bên A và nhân viên của Bên A cam kết giữ bí mật thông tin, tài liệu liên quan tới khu vực bảo vệ và hoạt động nội bộ của Bên B; không được tiết lộ cho bên thứ ba nếu không có sự đồng ý bằng văn bản của Bên B. Việc sử dụng hình ảnh, dữ liệu camera (nếu có) phải tuân theo pháp luật về bảo vệ dữ liệu cá nhân.</p>
                                            <p style={{ textIndent: '30px' }}>8.1. Kiểm tra, đánh giá và chứng cứ tuân thủ: Theo yêu cầu hợp lý của Bên B, Bên A cung cấp báo cáo, tài liệu chứng minh tuân thủ (ví dụ: biên bản kiểm thử/xâm nhập, báo cáo đánh giá bảo mật) và/hoặc cho phép kiểm tra tại chỗ trong phạm vi không ảnh hưởng đến an ninh của Hệ thống; chi phí phát sinh do hai bên thỏa thuận.</p>
                                            <p style={{ textIndent: '30px' }}>8.2. Thời hạn lưu giữ, hủy/ẩn danh dữ liệu: Bên A lưu giữ Thông tin Khách hàng không lâu hơn mức cần thiết cho mục đích thực hiện Hợp đồng hoặc thời hạn luật định. Khi chấm dứt Hợp đồng hoặc khi Bên B yêu cầu, Bên A xóa/ẩn danh hoặc trả lại dữ liệu, trừ trường hợp pháp luật yêu cầu lưu giữ lâu hơn (bao gồm xóa bản sao lưu khi không còn nhu cầu nghiệp vụ).</p>
                                        </div>
                                    </div>

                                    {/* Page 4 */}
                                    <div className="ste-preview-a4-page">
                                        <div className="ste-preview-doc-body">
                                            <p style={{ textIndent: '30px' }}>8.3. Sự cố xâm phạm dữ liệu: Khi phát hiện sự cố gây hoặc có khả năng gây ảnh hưởng tới dữ liệu cá nhân, Bên A sẽ (i) kích hoạt quy trình ứng cứu, khắc phục; (ii) thông báo cho Bên B kèm tối thiểu thời điểm phát hiện, loại dữ liệu bị ảnh hưởng, phạm vi, nguyên nhân dự kiến, biện pháp đã áp dụng; và (iii) phối hợp với Bên B để thực hiện nghĩa vụ thông báo cơ quan nhà nước có thẩm quyền và/hoặc chủ thể dữ liệu trong thời hạn luật định.</p>
                                            <p style={{ textIndent: '30px' }}>8.4. Quyền của chủ thể dữ liệu và hỗ trợ của Bên A: Theo yêu cầu hợp lệ của Bên B hoặc của chủ thể dữ liệu, Bên A sẽ hỗ trợ tra cứu, cung cấp bản sao, chỉnh sửa, hạn chế xử lý hoặc xóa dữ liệu theo thời hạn pháp luật quy định; trường hợp có yêu cầu hạn chế xử lý, Bên A thực hiện trong thời hạn luật định.</p>
                                            <p style={{ textIndent: '30px' }}>8.5. Lưu trữ và định vị dữ liệu; chuyển dữ liệu ra nước ngoài: Thông tin Khách hàng được lưu trữ tại Việt Nam, trừ khi hai bên có thỏa thuận khác và Bên A đáp ứng đầy đủ điều kiện pháp luật về đánh giá tác động và thông báo cho cơ quan có thẩm quyền trước khi chuyển dữ liệu ra nước ngoài. Bên A duy trì hồ sơ tuân thủ và cung cấp cho Bên B khi được yêu cầu.</p>
                                            <p style={{ textIndent: '30px' }}>8.6. Truy cập, chia sẻ và nhà thầu phụ: Chỉ nhân sự được ủy quyền của Bên A mới được truy cập Hệ thống ở mức quyền tối thiểu cần thiết. Việc sử dụng nhà thầu phụ/cung cấp dịch vụ đám mây cho Hệ thống phải có chấp thuận bằng văn bản của Bên B và Bên A bảo đảm ràng buộc nghĩa vụ bảo mật tương đương.</p>
                                            <p style={{ textIndent: '30px' }}>8.7. Biện pháp an ninh kỹ thuật và tổ chức: Bên A áp dụng tối thiểu các biện pháp: (i) phân quyền theo vai trò (RBAC) và xác thực nhiều lớp đối với tài khoản quản trị Hệ thống; (ii) mã hóa dữ liệu khi truyền và khi lưu trữ (nếu khả thi); (iii) tách môi trường và kiểm soát sao lưu/khôi phục; (iv) ghi nhật ký và lưu giữ nhật ký xử lý dữ liệu; (v) rà soát bảo mật định kỳ, khắc phục lỗ hổng; (vi) cam kết bảo mật và đào tạo định kỳ cho nhân sự truy cập Hệ thống.</p>
                                            <p style={{ textIndent: '30px' }}>8.8. Căn cứ xử lý và minh bạch: Bên A chỉ thu thập và xử lý trong phạm vi cần thiết để thực hiện Hợp đồng và theo căn cứ pháp luật hiện hành; thực hiện nghĩa vụ thông báo/ghi nhận chấp thuận khi xử lý dữ liệu cá nhân nhạy cảm theo quy định; bố trí đầu mối tiếp nhận và giải quyết các yêu cầu liên quan đến dữ liệu cá nhân.</p>
                                            <p style={{ textIndent: '30px' }}>8.9. Vai trò xử lý dữ liệu: Đối với Thông tin Khách hàng do Bên B cung cấp hoặc phát sinh trong quá trình thực hiện dịch vụ, Bên A là bên xử lý dữ liệu theo ủy quyền của Bên B và chỉ được xử lý theo hướng dẫn bằng văn bản của Bên B; không dùng cho mục đích riêng, không bán, không chia sẻ cho bên thứ ba nếu không có căn cứ pháp luật hoặc chấp thuận bằng văn bản của Bên B.</p>
                                            <p style={{ textIndent: '30px' }}>8.10. Phạm vi và phân loại dữ liệu: "Thông tin Khách hàng" trên Hệ thống quản lý nhân sự và chấm công của Bên A (gọi chung là "Hệ thống") bao gồm: (i) dữ liệu định danh, liên hệ của Bên B và người đại diện/đầu mối liên hệ; (ii) dữ liệu lập lịch, ca trực gắn với địa điểm của Bên B; (iii) nhật ký vào/ra, điểm danh, chấm công có thể chứa họ tên, số liên hệ, biển số, giờ vào/ra; (iv) dữ liệu hình ảnh/âm thanh nếu Hệ thống tích hợp camera; và (v) các trường dữ liệu khác được thỏa thuận bằng phụ lục. Các dữ liệu này có thể là "dữ liệu cá nhân" và một phần có thể là "dữ liệu cá nhân nhạy cảm" theo quy định pháp luật (ví dụ: dữ liệu sinh trắc học nếu dùng chấm công vân tay/khuôn mặt).</p>

                                            <p className="ste-preview-section-title">ĐIỀU 9: GIẢI QUYẾT TRANH CHẤP</p>
                                            <p>Trước khi đưa ra Tòa án, hai bên sẽ thương lượng, hòa giải. Nếu hòa giải không thành, tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền nơi Bên A đặt trụ sở hoặc theo thỏa thuận khác; hợp đồng chịu sự điều chỉnh của pháp luật Việt Nam.</p>
                                        </div>
                                    </div>

                                    {/* Page 5 */}
                                    <div className="ste-preview-a4-page">
                                        <div className="ste-preview-doc-body">
                                            <p className="ste-preview-section-title">ĐIỀU 10: HIỆU LỰC HỢP ĐỒNG</p>
                                            <p>1. Hai bên cam kết thực hiện nghiêm túc các điều khoản đã ký kết.</p>
                                            <p>2. Mọi sửa đổi, bổ sung hợp đồng phải được lập thành văn bản (phụ lục) và có chữ ký của đại diện hai bên.</p>
                                            <p>3. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản.</p>
                                            <p>4. Hợp đồng có hiệu lực kể từ ngày ký.</p>
                                        </div>

                                        <div className="ste-preview-doc-footer">
                                            <div className="ste-preview-signature-section">
                                                <div className="ste-preview-signature-box">
                                                    <p className="ste-preview-signature-title">ĐẠI DIỆN BÊN A</p>
                                                    <p className="ste-preview-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                                </div>
                                                <div className="ste-preview-signature-box">
                                                    <p className="ste-preview-signature-title">ĐẠI DIỆN BÊN B</p>
                                                    <p className="ste-preview-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <SnackbarWarning
                message={snackbarMessage}
                isOpen={showSnackbarWarning}
                duration={3000}
                onClose={handleCloseSnackbar}
            />

            {showLogoutModal && (
                <div className="sted-modal-overlay" onClick={cancelLogout}>
                    <div className="sted-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="sted-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="sted-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="sted-modal-footer">
                            <button className="sted-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="sted-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceTemplateEditor;
