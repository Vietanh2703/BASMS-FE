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
        Gender: { fieldName: 'Giới tính đại diện (Ông/Bà)', value: '', formatting: { bold: false, italic: false, underline: false } },
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

    // Auto-save formData to localStorage whenever it changes (after initial load)
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
                                            {formData[fieldKey].isTextarea ? (
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
                                <div className="sted-template-document">
                                    <div className="sted-doc-header">
                                        <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                        <p>Độc lập – Tự do – Hạnh phúc</p>
                                    </div>

                                    <h2 className="sted-doc-title">HỢP ĐỒNG DỊCH VỤ BẢO VỆ</h2>
                                    <p className="sted-doc-subtitle">
                                        Số: {renderFieldValue('ContractNumber')}/HDDVBV
                                    </p>

                                    <div className="sted-doc-body">
                                        <p><strong>Căn cứ:</strong></p>
                                        <p>– Bộ luật Dân sự 2015;</p>
                                        <p>– Luật Thương mại 2005;</p>
                                        <p>– Nghị định 96/2016/NĐ-CP...</p>
                                        <p>– Nhu cầu và thỏa thuận của các bên.</p>
                                        <p>
                                            Hôm nay, ngày {renderFieldValue('SignDay')} tháng {renderFieldValue('SignMonth')} năm {renderFieldValue('SignYear')} tại {renderFieldValue('SignLocation')}, chúng tôi gồm có:
                                        </p>

                                        <p className="sted-section-title">BÊN A: CÔNG TY TNHH AN NINH CON HỔ</p>
                                        <p>Địa chỉ: Quận Phú Nhuận, TPHCM</p>
                                        <p>Điện thoại: 0346666577</p>

                                        <p className="sted-section-title">BÊN B: {renderFieldValue('CompanyName')}</p>
                                        <p>Địa chỉ: {renderFieldValue('Address')}</p>
                                        <p>Điện thoại: {renderFieldValue('Phone')}</p>
                                        <p>Email: {renderFieldValue('CompanyEmail')}</p>
                                        <p>Mã số thuế: {renderFieldValue('TaxCode')}</p>
                                        <p>Đại diện: {renderFieldValue('Gender')} {renderFieldValue('Name')} – Giám đốc điều hành</p>

                                        <p className="sted-doc-notice">
                                            [Các điều khoản tiếp theo của hợp đồng sẽ được hiển thị đầy đủ sau khi tạo...]
                                        </p>
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
