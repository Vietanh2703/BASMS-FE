import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEContractAuth } from '../../hooks/useEContractAuth';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import './TemplateEditor.css';

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

interface WageRate {
    id: string;
    certificationLevel: string;
    minWage: number;
    maxWage: number;
    standardWage: number;
    standardWageInWords: string;
    currency: string;
    description: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    notes: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

const TemplateEditor = () => {
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

    // Form data with formatting - UPDATED: Added CertificationLevel and StandardWage
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
        CertificationLevel: { fieldName: 'Cấp bậc', value: '', formatting: { bold: false, italic: false, underline: false } },
        StandardWage: { fieldName: 'Lương cơ bản', value: '', formatting: { bold: false, italic: false, underline: false } },
    });

    const [activeField, setActiveField] = useState<string | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Wage rates state
    const [wageRates, setWageRates] = useState<WageRate[]>([]);
    const [isLoadingWageRates, setIsLoadingWageRates] = useState(false);

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
        const savedData = localStorage.getItem('contractReviewData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Check if the templateId matches current template
                if (data.templateId === templateId && data.formData) {
                    // Merge saved data with default formData to ensure all fields exist
                    setFormData(prev => {
                        const merged = { ...prev };
                        Object.keys(data.formData).forEach(key => {
                            if (merged[key]) {
                                merged[key] = data.formData[key];
                            }
                        });
                        return merged;
                    });
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
        setIsDataLoaded(true);
    }, [templateId]);

    // Pre-fill form with customer data from URL params
    useEffect(() => {
        if (!isDataLoaded) return;

        const contactPersonName = searchParams.get('contactPersonName');
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');
        const address = searchParams.get('address');
        const dateOfBirth = searchParams.get('dateOfBirth');

        // Only pre-fill if we have customer data from URL and fields are empty
        if (contactPersonName || email || phone) {
            setFormData(prev => {
                const updated = { ...prev };

                // Pre-fill employee name
                if (contactPersonName && !prev.EmployeeName.value) {
                    updated.EmployeeName = { ...prev.EmployeeName, value: contactPersonName };
                }

                // Pre-fill email
                if (email && !prev.EmployeeEmail.value) {
                    updated.EmployeeEmail = { ...prev.EmployeeEmail, value: email };
                }

                // Pre-fill phone
                if (phone && !prev.EmployeePhone.value) {
                    updated.EmployeePhone = { ...prev.EmployeePhone, value: phone };
                }

                // Pre-fill address
                if (address && !prev.EmployeeAddress.value) {
                    updated.EmployeeAddress = { ...prev.EmployeeAddress, value: address };
                }

                // Pre-fill date of birth (format from ISO to display format)
                if (dateOfBirth && !prev.EmployeeDateOfBirth.value) {
                    try {
                        const date = new Date(dateOfBirth);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear();
                        updated.EmployeeDateOfBirth = { ...prev.EmployeeDateOfBirth, value: `${day}/${month}/${year}` };
                    } catch (error) {
                        console.error('Error formatting date:', error);
                    }
                }

                return updated;
            });
        }
    }, [searchParams, isDataLoaded]);

    // Auto-save formData to localStorage whenever it changes (after initial load)
    useEffect(() => {
        if (isDataLoaded && templateId) {
            const contractData = {
                templateId: templateId,
                formData: formData
            };
            localStorage.setItem('contractReviewData', JSON.stringify(contractData));
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

    // Fetch wage rates from API
    useEffect(() => {
        const fetchWageRates = async () => {
            setIsLoadingWageRates(true);
            try {
                const apiUrl = import.meta.env.VITE_API_BASE_URL;
                const token = localStorage.getItem('eContractAccessToken');

                if (!token) {
                    navigate('/econtract/login');
                    return;
                }

                const response = await fetch(`${apiUrl}/shifts/wage-rates`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch wage rates');
                }

                const data = await response.json();
                if (data && data.wageRates) {
                    setWageRates(data.wageRates);
                }
            } catch (error) {
                console.error('Error fetching wage rates:', error);
                setSnackbarMessage('Không thể tải danh sách cấp bậc lương');
                setShowSnackbarWarning(true);
            } finally {
                setIsLoadingWageRates(false);
            }
        };

        fetchWageRates();
    }, [navigate]);

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
        try {
            await logout();
            navigate('/econtract/login');
        } catch (error) {
            console.error('Logout error:', error);
            setIsLoggingOut(false);
            setShowLogoutModal(false);
        }
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const handleFieldChange = (fieldKey: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [fieldKey]: {
                ...prev[fieldKey],
                value: value
            }
        }));
        // Clear error when user starts typing
        if (fieldErrors[fieldKey]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
    };

    const handleCertificationLevelChange = (certificationLevel: string) => {
        // Find the wage rate for the selected certification level
        const selectedWageRate = wageRates.find(
            rate => rate.certificationLevel === certificationLevel
        );

        if (selectedWageRate) {
            // Update both CertificationLevel and StandardWage
            setFormData(prev => ({
                ...prev,
                CertificationLevel: {
                    ...prev.CertificationLevel,
                    value: certificationLevel
                },
                StandardWage: {
                    ...prev.StandardWage,
                    value: selectedWageRate.standardWage.toLocaleString('vi-VN')
                }
            }));

            // Clear errors
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.CertificationLevel;
                delete newErrors.StandardWage;
                return newErrors;
            });
        }
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

    const renderFieldValue = (fieldKey: string) => {
        const field = formData[fieldKey];
        if (!field || !field.value) {
            return <span className="ted-field-placeholder">[{field?.fieldName || fieldKey}]</span>;
        }

        const styles: React.CSSProperties = {
            fontWeight: field.formatting.bold ? 'bold' : 'normal',
            fontStyle: field.formatting.italic ? 'italic' : 'normal',
            textDecoration: field.formatting.underline ? 'underline' : 'none',
        };

        return <span style={styles}>{field.value}</span>;
    };

    const validateForm = () => {
        const errors: { [key: string]: string } = {};
        const requiredFields = [
            'ContractNumber',
            'SignDay',
            'SignMonth',
            'SignYear',
            'SignLocation',
            'EmployeeName',
            'EmployeeDateOfBirth',
            'EmployeeBirthPlace',
            'EmployeeIdentityNumber',
            'EmployeeIdentityIssueDate',
            'EmployeeIdentityIssuePlace',
            'EmployeeAddress',
            'EmployeePhone',
            'EmployeeEmail',
            'ContractStartDate',
            'ContractEndDate',
            'CertificationLevel',
            'StandardWage'
        ];

        requiredFields.forEach(fieldKey => {
            if (!formData[fieldKey]?.value.trim()) {
                errors[fieldKey] = `${formData[fieldKey]?.fieldName} là bắt buộc`;
            }
        });

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            setSnackbarMessage('Vui lòng điền đầy đủ các trường bắt buộc');
            setShowSnackbarWarning(true);
            // Scroll to first error
            const firstErrorField = Object.keys(fieldErrors)[0];
            const element = document.getElementById(`field-${firstErrorField}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Prepare data to save with template info
        const contractData = {
            templateId: templateId,
            formData: formData,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage (this will be used in review page)
        localStorage.setItem('contractReviewData', JSON.stringify(contractData));

        // Navigate to review page
        navigate(`/econtract/contract-review?template=${templateId}`);
    };

    const handleBack = () => {
        navigate('/e-contracts/create-new-contract');
    };

    return (
        <div className="ted-container">
            {/* Sidebar */}
            <aside className={`ted-sidebar ${isMenuOpen ? 'ted-sidebar-open' : 'ted-sidebar-closed'}`}>
                <div className="ted-sidebar-header">
                    <div className="ted-sidebar-logo">
                        <div className="ted-logo-icon">E</div>
                        {isMenuOpen && <span className="ted-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="ted-sidebar-nav">
                    <ul className="ted-nav-list">
                        <li className="ted-nav-item">
                            <a href="/e-contracts/dashboard" className="ted-nav-link">
                                <svg className="ted-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="ted-nav-item ted-nav-active">
                            <a href="/e-contracts/list" className="ted-nav-link">
                                <svg className="ted-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`ted-main-content ${isMenuOpen ? 'ted-content-expanded' : 'ted-content-collapsed'}`}>
                {/* Header */}
                <header className="ted-nav-header">
                    <div className="ted-nav-left">
                        <button className="ted-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="ted-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="ted-nav-right">
                        <button className="ted-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="ted-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="ted-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="ted-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="ted-user-info">
                                <span className="ted-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="ted-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="ted-profile-dropdown">
                                    <div
                                        className={`ted-dropdown-item ted-logout-item ${isLoggingOut ? 'ted-disabled' : ''}`}
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
                                        <svg className="ted-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="ted-main">
                    <div className="ted-page-header">
                        <div>
                            <h1 className="ted-page-title">Hợp đồng lao động bảo vệ</h1>
                            <p className="ted-page-subtitle">Điền thông tin và xem trước hợp đồng trước khi tạo</p>
                        </div>
                        <div className="ted-header-actions">
                            <button className="ted-back-btn" onClick={handleBack}>
                                Quay lại
                            </button>
                            <button className="ted-submit-btn" onClick={handleSubmit}>
                                Xem trước
                            </button>
                        </div>
                    </div>

                    {/* Two Panel Layout */}
                    <div className="ted-editor-body">
                        {/* Left Panel - Form Fields */}
                        <div className="ted-form-panel">
                            <div className="ted-form-header">
                                <h3 className="ted-form-title">Thông tin hợp đồng</h3>
                                <p className="ted-form-subtitle">Nhập đầy đủ thông tin để tạo hợp đồng</p>
                            </div>

                            <div className="ted-form-content">
                                {Object.keys(formData).map((fieldKey) => (
                                    <div key={fieldKey} className="ted-field-group" id={`field-${fieldKey}`}>
                                        <label className="ted-field-label">
                                            {formData[fieldKey].fieldName}
                                            <span className="ted-required-mark"> *</span>
                                        </label>
                                        <div className="ted-field-input-wrapper">
                                            {fieldKey === 'CertificationLevel' ? (
                                                <select
                                                    className={`ted-field-input ${activeField === fieldKey ? 'ted-field-active' : ''} ${fieldErrors[fieldKey] ? 'ted-field-error' : ''}`}
                                                    value={formData[fieldKey].value}
                                                    onChange={(e) => handleCertificationLevelChange(e.target.value)}
                                                    onFocus={() => setActiveField(fieldKey)}
                                                    onBlur={() => setActiveField(null)}
                                                    disabled={isLoadingWageRates}
                                                >
                                                    <option value="">
                                                        {isLoadingWageRates ? 'Đang tải...' : 'Chọn cấp bậc'}
                                                    </option>
                                                    {wageRates
                                                        .filter(rate => ['I', 'II', 'III'].includes(rate.certificationLevel))
                                                        .map((rate) => (
                                                            <option key={rate.id} value={rate.certificationLevel}>
                                                                {rate.certificationLevel} - {rate.description}
                                                            </option>
                                                        ))}
                                                </select>
                                            ) : fieldKey === 'StandardWage' ? (
                                                // Read-only input for StandardWage
                                                <input
                                                    type="text"
                                                    className={`ted-field-input ${activeField === fieldKey ? 'ted-field-active' : ''} ${fieldErrors[fieldKey] ? 'ted-field-error' : ''}`}
                                                    value={formData[fieldKey].value}
                                                    readOnly
                                                    placeholder="Sẽ tự động điền khi chọn cấp bậc"
                                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                                />
                                            ) : ['ContractNumber', 'SignDay', 'SignMonth', 'SignYear'].includes(fieldKey) ? (
                                                // Read-only input for auto-generated fields
                                                <input
                                                    type="text"
                                                    className={`ted-field-input ${activeField === fieldKey ? 'ted-field-active' : ''} ${fieldErrors[fieldKey] ? 'ted-field-error' : ''}`}
                                                    value={formData[fieldKey].value}
                                                    readOnly
                                                    placeholder="Tự động điền"
                                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                                />
                                            ) : (
                                                // Regular input for other fields
                                                <input
                                                    type="text"
                                                    className={`ted-field-input ${activeField === fieldKey ? 'ted-field-active' : ''} ${fieldErrors[fieldKey] ? 'ted-field-error' : ''}`}
                                                    value={formData[fieldKey].value}
                                                    onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                                                    onFocus={() => setActiveField(fieldKey)}
                                                    onBlur={() => setActiveField(null)}
                                                    placeholder={`Nhập ${formData[fieldKey].fieldName.toLowerCase()}`}
                                                />
                                            )}
                                            {fieldErrors[fieldKey] && (
                                                <p className="ted-field-error-message">{fieldErrors[fieldKey]}</p>
                                            )}
                                            {fieldKey !== 'StandardWage' && (
                                                <div className="ted-formatting-toolbar">
                                                    <button
                                                        className={`ted-format-btn ${formData[fieldKey].formatting.bold ? 'ted-format-active' : ''}`}
                                                        onClick={() => toggleFormatting(fieldKey, 'bold')}
                                                        title="Bold"
                                                    >
                                                        <strong>B</strong>
                                                    </button>
                                                    <button
                                                        className={`ted-format-btn ${formData[fieldKey].formatting.italic ? 'ted-format-active' : ''}`}
                                                        onClick={() => toggleFormatting(fieldKey, 'italic')}
                                                        title="Italic"
                                                    >
                                                        <em>I</em>
                                                    </button>
                                                    <button
                                                        className={`ted-format-btn ${formData[fieldKey].formatting.underline ? 'ted-format-active' : ''}`}
                                                        onClick={() => toggleFormatting(fieldKey, 'underline')}
                                                        title="Underline"
                                                    >
                                                        <u>U</u>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel - Template Preview */}
                        <div className="ted-preview-panel">
                            <div className="ted-preview-header">
                                <h3 className="ted-preview-title">Xem trước hợp đồng</h3>
                                <p className="ted-preview-subtitle">Nội dung tự động cập nhật khi bạn nhập liệu</p>
                            </div>

                            <div className="ted-preview-content">
                                <div className="ted-preview-template-document">
                                    {/* Page 1 */}
                                    <div className="ted-preview-a4-page">
                                        <div className="ted-preview-doc-header">
                                            <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                            <p>Độc lập – Tự do – Hạnh phúc</p>
                                        </div>

                                        <h2 className="ted-preview-doc-title">HỢP ĐỒNG LAO ĐỘNG</h2>
                                        <p className="ted-preview-doc-subtitle">
                                            Số: {renderFieldValue('ContractNumber')}/HĐLĐ
                                        </p>

                                        <div className="ted-preview-doc-body">
                                        <p>- Căn cứ Bộ luật dân sự 2015 và Bộ luật lao động 2019;</p>
                                        <p>- Căn cứ vào nhu cầu và khả năng của hai bên.</p>
                                        <p>
                                            Hôm nay, ngày {renderFieldValue('SignDay')} tháng {renderFieldValue('SignMonth')} năm {renderFieldValue('SignYear')} tại {renderFieldValue('SignLocation')}
                                        </p>
                                        <p>Chúng tôi gồm có:</p>

                                        <p className="ted-preview-section-title">Bên A (Người sử dụng lao động):</p>
                                        <p>– Tên công ty: Công ty TNHH An ninh Con Hổ</p>
                                        <p>– Địa chỉ trụ sở chính: Quận Phú Nhuận, TPHCM</p>
                                        <p>– Đại diện là: Ông/Bà C &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</p>
                                        <p>– Số CCCD: 082204156723 &nbsp;&nbsp; ngày cấp 26/05/2018 &nbsp;&nbsp; nơi cấp: Công an Quận 2</p>
                                        <p>– Mã số thuế / Giấy phép kinh doanh: 0123456789</p>
                                        <p>– Điện thoại: 0346666577 &nbsp;&nbsp;&nbsp;&nbsp; Email: anh.aty2732004@gmail.com</p>

                                        <p className="ted-preview-section-title">Bên B (Người lao động):</p>
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

                                        <p className="ted-preview-section-title">Điều 1. Loại hợp đồng & thời hạn</p>
                                        <p>
                                            Hợp đồng này là Hợp đồng lao động xác định thời hạn / Hợp đồng lao động không xác định thời hạn (xem chọn 1).
                                        </p>
                                        <p>
                                            Nếu là xác định thời hạn: thời hạn từ ngày {renderFieldValue('ContractStartDate')} đến ngày {renderFieldValue('ContractEndDate')} (không quá 36 tháng nếu theo quy định).
                                        </p>
                                        <p>
                                            Mọi thay đổi về vị trí, địa điểm, ca trực hoặc phần mềm quản lý sẽ được lập Phụ lục hợp đồng.
                                        </p>

                                        <p className="ted-preview-section-title">Điều 2. Công việc, địa điểm làm việc</p>
                                        <p>Bên B sẽ làm vị trí: Nhân viên bảo vệ – chịu sự quản lý của Bên A.</p>
                                        <p>Cấp bậc: {renderFieldValue('CertificationLevel')}</p>
                                        <p>Công việc chính gồm:</p>
                                        <p>– Thực hiện nhiệm vụ bảo vệ an ninh, giám sát mục tiêu, tuần tra, kiểm soát ra/vào theo phân công.</p>
                                        <p>– Sử dụng phần mềm quản lý và chấm công của Bên A (tên phần mềm: Biometric & shift management system) để khai báo ca trực, đăng nhập khi bắt đầu ca, kết thúc ca và báo cáo theo yêu cầu.</p>
                                        <p>– Khi Bên A giao địa điểm trực với khách hàng (sau khi ký ca trực với khách) thì Bên B sẽ tới địa điểm đó để bắt đầu ca – ghi nhận bằng phần mềm và thực hiện nhiệm vụ tại địa điểm đó.</p>
                                        <p>– Làm các nhiệm vụ khác được giao phù hợp với vị trí bảo vệ và theo chỉ đạo của Bên A hoặc khách hàng (nếu có).</p>
                                        <p>Địa điểm làm việc chính hiện tại là: ………………………………………………</p>
                                        <p>Trong tương lai, Bên A có thể bố trí địa điểm trực thay đổi trong khu vực …………………………, Bên A sẽ thông báo cho Bên B ít nhất … ngày trước khi bắt đầu ca mới.</p>
                                        <p>Bên B cam kết thực hiện công việc tại địa điểm được giao và sử dụng phần mềm đúng quy định.</p>

                                        <p className="ted-preview-section-title">Điều 3. Thời giờ làm việc & ca trực</p>
                                        <p>Thời giờ làm việc theo ca:</p>
                                        <p>– Ca A: từ … giờ … phút đến … giờ … phút</p>
                                        <p>– Ca B: từ … giờ … phút đến … giờ … phút</p>
                                        <p>(Hai bên có thể thỏa thuận hoặc bổ sung chi tiết vào Phụ lục ca trực)</p>
                                        <p>Bên B phải đăng nhập phần mềm quản lý/chấm công của Bên A ngay khi bắt đầu ca trực tại địa điểm được giao và đăng xuất khi kết thúc ca trực. Việc đăng nhập/trễ ca hoặc chấm công không đúng có thể ảnh hưởng tới quyền lợi lương/nhận ca.</p>
                                        <p>Thời gian làm việc, nghỉ ngơi tuân theo luật lao động hiện hành: không quá … giờ/ngày, … giờ/tuần, làm thêm giờ, ca đêm, nghỉ lễ theo pháp luật và theo nội quy của Bên A.</p>
                                        <p>Đối với ca đêm, tuần tra hoặc mục tiêu đặc biệt, Bên B sẽ được phụ cấp theo quy định của Bên A (nêu rõ tại Điều 4).</p>

                                        <p className="ted-preview-section-title">Điều 4. Tiền lương, phụ cấp và hình thức thanh toán</p>
                                        <p>Mức lương cơ bản: {renderFieldValue('StandardWage')} VNĐ/tháng được thanh toán vào ngày … hàng tháng bằng hình thức chuyển khoản hoặc tiền mặt (thỏa thuận).</p>
                                        <p>Điều kiện để được thanh toán lương và phụ cấp: Bên B phải đăng nhập phần mềm chấm công, hoàn thành ca trực đúng giờ, tuân thủ quy định của Bên A. Trường hợp không chấm công, bỏ ca, trễ ca, vi phạm nội quy thì Bên A có quyền khấu trừ hoặc không thanh toán phụ cấp.</p>
                                        <p>Bên A chịu trách nhiệm đóng bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp cho Bên B theo quy định pháp luật.</p>
                                        <p>Phương thức thanh toán và nhận lương ……………………………………………………</p>
                                        <p>Ngày trả lương: …….. hàng tháng.</p>
                                        </div>
                                    </div>

                                    {/* Page 2 */}
                                    <div className="ted-preview-a4-page">
                                        <div className="ted-preview-doc-body">
                                        <p className="ted-preview-section-title">Điều 5. Quyền lợi & nghĩa vụ</p>
                                        <p className="ted-preview-section-title">5.1 Nghĩa vụ của Bên B:</p>
                                        <p>– Thực hiện đúng chức trách vị trí bảo vệ được giao; tuần tra, giám sát, kiểm soát ra/vào, bảo vệ tài sản và người theo phân công.</p>
                                        <p>– Sử dụng phần mềm quản lý/chấm công đúng cách: đăng nhập/đăng xuất theo ca, báo cáo theo yêu cầu.</p>
                                        <p>– Chấp hành nội quy, quy định của Bên A, quy trình ca trực, an toàn lao động, phòng cháy chữa cháy (PCCC).</p>
                                        <p>– Bảo mật thông tin khách hàng, mục tiêu trực, dữ liệu phần mềm quản lý theo yêu cầu nếu có.</p>
                                        <p>– Báo cáo kịp thời cho Bên A hoặc khách hàng khi có sự cố an ninh, mất dữ liệu, vi phạm ca trực.</p>

                                        <p className="ted-preview-section-title">5.2 Nghĩa vụ của Bên A:</p>
                                        <p>– Cung cấp cho Bên B đầy đủ thiết bị cần thiết (đồng phục, thẻ, thiết bị phần mềm, máy quét nếu có) để Bên B thực hiện công việc.</p>
                                        <p>– Cung cấp thông tin ca trực, địa điểm trực, phần mềm quản lý/chấm công để Bên B thực hiện đăng nhập.</p>
                                        <p>– Thanh toán lương và phụ cấp đúng hạn; đóng bảo hiểm theo quy định; đảm bảo điều kiện làm việc an toàn.</p>
                                        <p>– Thông báo cho Bên B về việc thay đổi địa điểm, ca, phần mềm ít nhất … ngày trước khi bắt đầu áp dụng.</p>

                                        <p className="ted-preview-section-title">5.3 Quyền lợi của Bên B:</p>
                                        <p>– Được hưởng lương, phụ cấp, bảo hiểm, quyền nghỉ phép, nghỉ lễ theo quy định của pháp luật và nội quy Bên A.</p>
                                        <p>– Được đào tạo nghiệp vụ bảo vệ, sử dụng phần mềm quản lý, và được hỗ trợ khi làm ca trực mới tại khách hàng.</p>
                                        <p>– Được làm việc trong môi trường đảm bảo an toàn lao động và theo đúng ca trực đã ký kết.</p>

                                        <p className="ted-preview-section-title">Điều 6. Thay đổi – Chấm dứt hợp đồng</p>
                                        <p>Hai bên có thể ký Phụ lục hợp đồng khi có thay đổi về công việc, vị trí, địa điểm, ca trực, phần mềm quản lý hoặc lương, phụ cấp.</p>
                                        <p>Hợp đồng này chấm dứt khi:</p>
                                        <p>– Hết thời hạn hợp đồng (nếu là HĐ xác định thời hạn).</p>
                                        <p>– Hai bên thỏa thuận chấm dứt hợp đồng.</p>
                                        <p>– Một bên đơn phương chấm dứt theo quy định của pháp luật (ví dụ: Bên B vi phạm nội quy nghiêm trọng, Bên A không cung cấp điều kiện làm việc theo hợp đồng).</p>
                                        <p>Trong trường hợp Bên B vi phạm hợp đồng (không đăng nhập phần mềm, trễ/không thực hiện ca trực, gây mất ca, vi phạm an ninh) thì Bên A có quyền kỷ luật, chấm dứt hợp đồng hoặc khấu trừ thiệt hại theo nội quy và hợp đồng.</p>
                                        <p>Sau khi chấm dứt, Bên A phải hoàn tất thanh toán lương, phụ cấp, đóng bảo hiểm, bàn giao thiết bị (nếu có) và hai bên thực hiện thủ tục thanh lý hợp đồng.</p>

                                        <p className="ted-preview-section-title">Điều 7. Giải quyết tranh chấp</p>
                                        <p>Hai bên cam kết giải quyết các tranh chấp phát sinh từ hợp đồng này bằng thương lượng.</p>
                                        <p>Nếu không thương lượng được, tranh chấp sẽ được giải quyết tại:</p>
                                        <p>– Hội đồng hòa giải lao động hoặc</p>
                                        <p>– Tòa án nhân dân có thẩm quyền theo pháp luật Việt Nam.</p>
                                        <p>Áp dụng pháp luật Việt Nam để điều chỉnh hợp đồng và giải quyết tranh chấp.</p>

                                        <p className="ted-preview-section-title">Điều 8. Hiệu lực hợp đồng</p>
                                        <p>Hợp đồng này có hiệu lực kể từ ngày ký.</p>
                                        <p>Hợp đồng này gồm 03 (ba) tờ. Hai bên mỗi bên giữ 01 (một) bản có giá trị pháp lý như nhau.</p>
                                        <p>Mọi sửa đổi, bổ sung hợp đồng phải được lập thành Phụ lục hợp đồng, có chữ ký của hai bên mới có hiệu lực.</p>
                                        </div>

                                        <div className="ted-preview-doc-footer">
                                            <div className="ted-preview-signature-section">
                                                <div className="ted-preview-signature-box">
                                                    <p className="ted-preview-signature-title">ĐẠI DIỆN BÊN A</p>
                                                    <p className="ted-preview-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                                </div>
                                                <div className="ted-preview-signature-box">
                                                    <p className="ted-preview-signature-title">BÊN B – Người lao động</p>
                                                    <p className="ted-preview-signature-subtitle">(Ký, ghi rõ họ tên)</p>
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
                <div className="ted-modal-overlay" onClick={cancelLogout}>
                    <div className="ted-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ted-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="ted-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="ted-modal-footer">
                            <button className="ted-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="ted-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateEditor;