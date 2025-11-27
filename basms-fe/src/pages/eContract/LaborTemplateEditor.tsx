import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEContractAuth } from '../../hooks/useEContractAuth';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import './LaborTemplateEditor.css';

interface FieldFormatting {
    bold: boolean;
    italic: boolean;
    underline: boolean;
}

interface FormField {
    fieldName: string;
    value: string;
    formatting: FieldFormatting;
}

interface FormData {
    [key: string]: FormField;
}

const LaborTemplateEditor = () => {
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
        EmployeeName: { fieldName: 'Họ tên nhân viên', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeDateOfBirth: { fieldName: 'Ngày sinh', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeBirthPlace: { fieldName: 'Nơi sinh', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeIdentityNumber: { fieldName: 'Số CCCD', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeIdentityIssueDate: { fieldName: 'Ngày cấp CCCD', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeIdentityIssuePlace: { fieldName: 'Nơi cấp CCCD', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeAddress: { fieldName: 'Hộ khẩu thường trú', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeCurrentAddress: { fieldName: 'Chỗ ở hiện tại', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeePhone: { fieldName: 'Số điện thoại', value: '', formatting: { bold: false, italic: false, underline: false } },
        EmployeeEmail: { fieldName: 'Email', value: '', formatting: { bold: false, italic: false, underline: false } },
        ContractStartDate: { fieldName: 'Ngày bắt đầu HĐ', value: '', formatting: { bold: false, italic: false, underline: false } },
        ContractEndDate: { fieldName: 'Ngày kết thúc HĐ', value: '', formatting: { bold: false, italic: false, underline: false } },
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

    // Load saved data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('laborContractReviewData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Check if the templateId matches current template
                if (data.templateId === templateId && data.formData) {
                    setFormData(data.formData);
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
        setIsDataLoaded(true);
    }, [templateId]);

    // Auto-save formData to localStorage whenever it changes (after initial load)
    useEffect(() => {
        if (isDataLoaded && templateId) {
            const contractData = {
                templateId: templateId,
                formData: formData
            };
            localStorage.setItem('laborContractReviewData', JSON.stringify(contractData));
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
            return <span className="lted-field-placeholder">.....................</span>;
        }
        return <span style={getFieldStyle(fieldKey)}>{field.value}</span>;
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

        // Check all fields except EmployeeCurrentAddress
        Object.keys(formData).forEach(fieldKey => {
            if (fieldKey === 'EmployeeCurrentAddress') return;

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
                case 'EmployeePhone':
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
                case 'EmployeeEmail':
                    if (!isValidEmail(value)) {
                        errors[fieldKey] = 'Email không hợp lệ';
                        hasError = true;
                    }
                    break;
                case 'EmployeeDateOfBirth':
                case 'EmployeeIdentityIssueDate':
                    if (!isValidDate(value)) {
                        errors[fieldKey] = 'Ngày tháng không hợp lệ (dd/mm/yyyy)';
                        hasError = true;
                    }
                    break;
                case 'SignDay':
                case 'SignMonth':
                case 'SignYear':
                    // Check signing date
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
                        // Check if end date is not before start date
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
        // Validate all fields
        const isValid = validateAllFields();

        if (!isValid) {
            // Reset snackbar first to ensure clean state
            setShowSnackbarWarning(false);

            // Show snackbar warning after a brief delay to allow state reset
            setTimeout(() => {
                setSnackbarMessage(`Vui lòng kiểm tra và điền đầy đủ thông tin. Có một số trường chưa hợp lệ hoặc bị bỏ trống.`);
                setShowSnackbarWarning(true);
            }, 10);
            return;
        }

        // Clear errors if validation passes
        setFieldErrors({});

        // Prepare data for review
        const contractData = {
            templateId: templateId,
            formData: formData
        };

        // Store in localStorage to pass to review page
        localStorage.setItem('laborContractReviewData', JSON.stringify(contractData));

        // Navigate to review page
        navigate('/e-contracts/manager-template-review');
    };

    return (
        <div className="lted-container">
            <aside className={`lted-sidebar ${isMenuOpen ? 'lted-sidebar-open' : 'lted-sidebar-closed'}`}>
                <div className="lted-sidebar-header">
                    <div className="lted-sidebar-logo">
                        <div className="lted-logo-icon">E</div>
                        {isMenuOpen && <span className="lted-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="lted-sidebar-nav">
                    <ul className="lted-nav-list">
                        <li className="lted-nav-item">
                            <a href="/e-contracts/dashboard" className="lted-nav-link">
                                <svg className="lted-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="lted-nav-item lted-nav-active">
                            <a href="/e-contracts/list" className="lted-nav-link">
                                <svg className="lted-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`lted-main-content ${isMenuOpen ? 'lted-content-expanded' : 'lted-content-collapsed'}`}>
                <header className="lted-nav-header">
                    <div className="lted-nav-left">
                        <button className="lted-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="lted-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="lted-nav-right">
                        <button className="lted-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="lted-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="lted-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="lted-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="lted-user-info">
                                <span className="lted-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="lted-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="lted-profile-dropdown">
                                    <div
                                        className={`lted-dropdown-item lted-logout-item ${isLoggingOut ? 'lted-disabled' : ''}`}
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
                                        <svg className="lted-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="lted-main">
                    <div className="lted-page-header">
                        <div>
                            <h1 className="lted-page-title">Điền thông tin hợp đồng lao động quản lý</h1>
                            <p className="lted-page-subtitle">Template: {templateId || 'Hợp đồng lao động quản lý'}</p>
                        </div>
                        <div className="lted-header-actions">
                            <button className="lted-back-btn" onClick={() => navigate('/e-contracts/create-new-contract')}>
                                Quay lại
                            </button>
                            <button className="lted-submit-btn" onClick={handleSubmit}>
                                Xem trước
                            </button>
                        </div>
                    </div>

                    <div className="lted-editor-body">
                        {/* Left Panel - Form Fields */}
                        <div className="lted-form-panel">
                            <div className="lted-form-header">
                                <h3 className="lted-form-title">Thông tin hợp đồng</h3>
                                <p className="lted-form-subtitle">Điền thông tin vào các trường bên dưới</p>
                            </div>

                            <div className="lted-form-content">
                                {Object.keys(formData).map((fieldKey) => (
                                    <div key={fieldKey} className="lted-field-group">
                                        <label className="lted-field-label">
                                            {formData[fieldKey].fieldName}
                                            {fieldKey !== 'EmployeeCurrentAddress' && <span className="lted-required-mark"> *</span>}
                                        </label>
                                        <div className="lted-field-input-wrapper">
                                            <input
                                                type="text"
                                                className={`lted-field-input ${activeField === fieldKey ? 'lted-field-active' : ''} ${fieldErrors[fieldKey] ? 'lted-field-error' : ''}`}
                                                value={formData[fieldKey].value}
                                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                onFocus={() => setActiveField(fieldKey)}
                                                onBlur={() => setActiveField(null)}
                                                placeholder={`Nhập ${formData[fieldKey].fieldName.toLowerCase()}...`}
                                                style={getFieldStyle(fieldKey)}
                                            />
                                            {fieldErrors[fieldKey] && (
                                                <div className="lted-field-error-message">{fieldErrors[fieldKey]}</div>
                                            )}
                                            <div className="lted-formatting-toolbar">
                                                <button
                                                    className={`lted-format-btn ${formData[fieldKey].formatting.bold ? 'lted-format-active' : ''}`}
                                                    onClick={() => toggleFormatting(fieldKey, 'bold')}
                                                    title="Bold"
                                                >
                                                    <strong>B</strong>
                                                </button>
                                                <button
                                                    className={`lted-format-btn ${formData[fieldKey].formatting.italic ? 'lted-format-active' : ''}`}
                                                    onClick={() => toggleFormatting(fieldKey, 'italic')}
                                                    title="Italic"
                                                >
                                                    <em>I</em>
                                                </button>
                                                <button
                                                    className={`lted-format-btn ${formData[fieldKey].formatting.underline ? 'lted-format-active' : ''}`}
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
                        <div className="lted-preview-panel">
                            <div className="lted-preview-header">
                                <h3 className="lted-preview-title">Xem trước hợp đồng</h3>
                                <p className="lted-preview-subtitle">Nội dung tự động cập nhật khi bạn nhập liệu</p>
                            </div>

                            <div className="lted-preview-content">
                                <div className="lted-template-document">
                                    <div className="lted-doc-header">
                                        <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                        <p>Độc lập – Tự do – Hạnh phúc</p>
                                    </div>

                                    <h2 className="lted-doc-title">HỢP ĐỒNG LAO ĐỘNG</h2>
                                    <p className="lted-doc-subtitle">
                                        Số: {renderFieldValue('ContractNumber')}/HĐLĐ
                                    </p>

                                    <div className="lted-doc-body">
                                        <p>- Căn cứ Bộ luật dân sự 2015 và Bộ luật lao động 2019;</p>
                                        <p>- Căn cứ vào nhu cầu và khả năng của hai bên.</p>
                                        <p>
                                            Hôm nay, ngày {renderFieldValue('SignDay')} tháng {renderFieldValue('SignMonth')} năm {renderFieldValue('SignYear')} tại {renderFieldValue('SignLocation')}
                                        </p>
                                        <p>Chúng tôi gồm có:</p>

                                        <p className="lted-section-title">Bên A (Người sử dụng lao động):</p>
                                        <p>– Tên công ty: Công ty THHH An ninh Con Hổ</p>
                                        <p>– Địa chỉ trụ sở chính: Quận Phú Nhuận, TPHCM</p>
                                        <p>– Đại diện là: Ông/Bà C &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</p>
                                        <p>– Số CCCD: 082204156723 &nbsp;&nbsp; ngày cấp 26/05/2018 &nbsp;&nbsp; nơi cấp: Công an Quận 2</p>
                                        <p>– Mã số thuế / Giấy phép kinh doanh: 0123456789</p>
                                        <p>– Điện thoại: 0346666577 &nbsp;&nbsp;&nbsp;&nbsp; Email: anh.aty2732004@gmail.com</p>

                                        <p className="lted-section-title">Bên B (Người lao động):</p>
                                        <p>– Họ và tên: {renderFieldValue('EmployeeName')}</p>
                                        <p>
                                            – Sinh ngày: {renderFieldValue('EmployeeDateOfBirth')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; tại: {renderFieldValue('EmployeeBirthPlace')}
                                        </p>
                                        <p>
                                            – Số CCCD: {renderFieldValue('EmployeeIdentityNumber')} &nbsp; ngày cấp: {renderFieldValue('EmployeeIdentityIssueDate')} &nbsp; nơi cấp: {renderFieldValue('EmployeeIdentityIssuePlace')}
                                        </p>
                                        <p>– Hộ khẩu thường trú: {renderFieldValue('EmployeeAddress')}</p>
                                        <p>– Chỗ ở hiện tại (nếu khác): {renderFieldValue('EmployeeCurrentAddress')}</p>
                                        <p>– Điện thoại: {renderFieldValue('EmployeePhone')}</p>
                                        <p>– Email: {renderFieldValue('EmployeeEmail')}</p>

                                        <p>Hai bên thống nhất ký kết hợp đồng lao động với các điều khoản sau:</p>

                                        <p className="lted-section-title">Điều 1. Loại hợp đồng & thời hạn</p>
                                        <p>
                                            Hợp đồng này là Hợp đồng lao động xác định thời hạn / Hợp đồng lao động không xác định thời hạn (xem chọn 1).
                                        </p>
                                        <p>
                                            Nếu là xác định thời hạn: thời hạn từ ngày {renderFieldValue('ContractStartDate')} đến ngày {renderFieldValue('ContractEndDate')} (không quá 36 tháng nếu theo quy định).
                                        </p>
                                        <p>
                                            Mọi thay đổi về vị trí, địa điểm, ca trực hoặc phần mềm quản lý sẽ được lập Phụ lục hợp đồng.
                                        </p>

                                        <p className="lted-doc-notice">
                                            [Các điều khoản tiếp theo của hợp đồng sẽ được hiển thị đầy đủ sau khi tạo...]
                                        </p>
                                    </div>

                                    <div className="lted-doc-footer">
                                        <div className="lted-signature-section">
                                            <div className="lted-signature-box">
                                                <p className="lted-signature-title">ĐẠI DIỆN BÊN A</p>
                                                <p className="lted-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                            </div>
                                            <div className="lted-signature-box">
                                                <p className="lted-signature-title">BÊN B – Người lao động</p>
                                                <p className="lted-signature-subtitle">(Ký, ghi rõ họ tên)</p>
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
                <div className="lted-modal-overlay" onClick={cancelLogout}>
                    <div className="lted-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="lted-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="lted-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="lted-modal-footer">
                            <button className="lted-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="lted-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LaborTemplateEditor;
