import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEContractAuth } from '../../hooks/useEContractAuth';
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

    // Load saved data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('contractReviewData');
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
            return <span className="ted-field-placeholder">.....................</span>;
        }
        return <span style={getFieldStyle(fieldKey)}>{field.value}</span>;
    };

    const handleSubmit = () => {
        // Validate that at least some fields are filled
        const hasData = Object.values(formData).some(field => field.value.trim() !== '');

        if (!hasData) {
            alert('Vui lòng điền ít nhất một trường thông tin');
            return;
        }

        // Prepare data for review
        const contractData = {
            templateId: templateId,
            formData: formData
        };

        // Store in localStorage to pass to review page
        localStorage.setItem('contractReviewData', JSON.stringify(contractData));

        // Navigate to review page
        navigate('/e-contracts/review');
    };

    return (
        <div className="ted-container">
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

            <div className={`ted-main-content ${isMenuOpen ? 'ted-content-expanded' : 'ted-content-collapsed'}`}>
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
                            <h1 className="ted-page-title">Điền thông tin hợp đồng</h1>
                            <p className="ted-page-subtitle">Template: {templateId || 'Hợp đồng lao động'}</p>
                        </div>
                        <div className="ted-header-actions">
                            <button className="ted-back-btn" onClick={() => navigate('/e-contracts/create-new-contract')}>
                                Quay lại
                            </button>
                            <button className="ted-submit-btn" onClick={handleSubmit}>
                                Xem trước
                            </button>
                        </div>
                    </div>

                    <div className="ted-editor-body">
                        {/* Left Panel - Form Fields */}
                        <div className="ted-form-panel">
                            <div className="ted-form-header">
                                <h3 className="ted-form-title">Thông tin hợp đồng</h3>
                                <p className="ted-form-subtitle">Điền thông tin vào các trường bên dưới</p>
                            </div>

                            <div className="ted-form-content">
                                {Object.keys(formData).map((fieldKey) => (
                                    <div key={fieldKey} className="ted-field-group">
                                        <label className="ted-field-label">
                                            {formData[fieldKey].fieldName}
                                        </label>
                                        <div className="ted-field-input-wrapper">
                                            <input
                                                type="text"
                                                className={`ted-field-input ${activeField === fieldKey ? 'ted-field-active' : ''}`}
                                                value={formData[fieldKey].value}
                                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                onFocus={() => setActiveField(fieldKey)}
                                                onBlur={() => setActiveField(null)}
                                                placeholder={`Nhập ${formData[fieldKey].fieldName.toLowerCase()}...`}
                                                style={getFieldStyle(fieldKey)}
                                            />
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
                                <div className="ted-template-document">
                                    <div className="ted-doc-header">
                                        <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                        <p>Độc lập – Tự do – Hạnh phúc</p>
                                    </div>

                                    <h2 className="ted-doc-title">HỢP ĐỒNG LAO ĐỘNG</h2>
                                    <p className="ted-doc-subtitle">
                                        Số: {renderFieldValue('ContractNumber')}/HĐLĐ
                                    </p>

                                    <div className="ted-doc-body">
                                        <p>- Căn cứ Bộ luật dân sự 2015 và Bộ luật lao động 2019;</p>
                                        <p>- Căn cứ vào nhu cầu và khả năng của hai bên.</p>
                                        <p>
                                            Hôm nay, ngày {renderFieldValue('SignDay')} tháng {renderFieldValue('SignMonth')} năm {renderFieldValue('SignYear')} tại {renderFieldValue('SignLocation')}
                                        </p>
                                        <p>Chúng tôi gồm có:</p>

                                        <p className="ted-section-title">Bên A (Người sử dụng lao động):</p>
                                        <p>– Tên công ty: Công ty TNHH An ninh Con Hổ</p>
                                        <p>– Địa chỉ trụ sở chính: Quận Phú Nhuận, TPHCM</p>
                                        <p>– Đại diện là: Ông/Bà C &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</p>
                                        <p>– Số CCCD: 082204156723 &nbsp;&nbsp; ngày cấp 26/05/2018 &nbsp;&nbsp; nơi cấp: Công an Quận 2</p>
                                        <p>– Mã số thuế / Giấy phép kinh doanh: 0123456789</p>
                                        <p>– Điện thoại: 0346666577 &nbsp;&nbsp;&nbsp;&nbsp; Email: anh.aty2732004@gmail.com</p>

                                        <p className="ted-section-title">Bên B (Người lao động):</p>
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

                                        <p className="ted-section-title">Điều 1. Loại hợp đồng & thời hạn</p>
                                        <p>
                                            Hợp đồng này là Hợp đồng lao động xác định thời hạn / Hợp đồng lao động không xác định thời hạn.
                                        </p>
                                        <p>
                                            Nếu là xác định thời hạn: thời hạn từ ngày {renderFieldValue('ContractStartDate')} đến ngày {renderFieldValue('ContractEndDate')} (không quá 36 tháng nếu theo quy định).
                                        </p>
                                        <p>
                                            Trong trường hợp Bên A và Bên B đồng ý thay đổi công việc, địa điểm, phòng ban, ca trực hoặc phần mềm quản lý thì sẽ lập Phụ lục hợp đồng và ký với Bên B.
                                        </p>

                                        <p className="ted-doc-notice">
                                            [Các điều khoản tiếp theo của hợp đồng sẽ được hiển thị đầy đủ sau khi tạo...]
                                        </p>
                                    </div>

                                    <div className="ted-doc-footer">
                                        <div className="ted-signature-section">
                                            <div className="ted-signature-box">
                                                <p className="ted-signature-title">ĐẠI DIỆN BÊN A</p>
                                                <p className="ted-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                            </div>
                                            <div className="ted-signature-box">
                                                <p className="ted-signature-title">BÊN B – Người lao động</p>
                                                <p className="ted-signature-subtitle">(Ký, ghi rõ họ tên)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

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
