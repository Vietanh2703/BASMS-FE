import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './ContractReview.css';

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

interface ContractData {
    templateId: string;
    formData: FormData;
}

const ContractReview = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [contractData, setContractData] = useState<ContractData | null>(null);

    useEffect(() => {
        // Load contract data from localStorage
        const storedData = localStorage.getItem('contractReviewData');
        if (!storedData) {
            alert('Không tìm thấy dữ liệu hợp đồng. Vui lòng điền form lại.');
            navigate('/e-contracts/create-new-contract');
            return;
        }

        try {
            const data = JSON.parse(storedData);
            setContractData(data);
        } catch (error) {
            console.error('Error parsing contract data:', error);
            alert('Dữ liệu hợp đồng không hợp lệ. Vui lòng điền form lại.');
            navigate('/e-contracts/create-new-contract');
        }
    }, [navigate]);

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

    const handleBack = () => {
        navigate(-1); // Go back to template editor
    };

    const handleConfirm = async () => {
        if (!contractData) return;

        setIsSubmitting(true);

        try {
            // Prepare API payload with formatting information
            const payload: { [key: string]: any } = {};
            Object.keys(contractData.formData).forEach(key => {
                const field = contractData.formData[key];
                payload[key] = {
                    value: field.value,
                    bold: field.formatting.bold,
                    italic: field.formatting.italic,
                    underline: field.formatting.underline
                };
            });

            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');

            if (!token) {
                navigate('/e-contract/login');
                return;
            }

            const response = await fetch(`${apiUrl}/api/contracts/template/fill-from-s3`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    templateId: contractData.templateId,
                    data: payload
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create contract');
            }

            // Clear localStorage
            localStorage.removeItem('contractReviewData');

            alert('Hợp đồng đã được tạo thành công!');
            navigate('/e-contracts/list');
        } catch (error) {
            console.error('Error creating contract:', error);
            alert('Không thể tạo hợp đồng. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFieldStyle = (field: FormField): React.CSSProperties => {
        return {
            fontWeight: field.formatting.bold ? 'bold' : 'normal',
            fontStyle: field.formatting.italic ? 'italic' : 'normal',
            textDecoration: field.formatting.underline ? 'underline' : 'none'
        };
    };

    const renderFieldValue = (fieldKey: string) => {
        if (!contractData) return <span className="cr-field-placeholder">.....................</span>;

        const field = contractData.formData[fieldKey];
        if (!field || !field.value) {
            return <span className="cr-field-placeholder">.....................</span>;
        }
        return <span style={getFieldStyle(field)}>{field.value}</span>;
    };

    if (!contractData) {
        return (
            <div className="cr-loading-container">
                <div className="cr-loading-text">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="cr-container">
            <aside className={`cr-sidebar ${isMenuOpen ? 'cr-sidebar-open' : 'cr-sidebar-closed'}`}>
                <div className="cr-sidebar-header">
                    <div className="cr-sidebar-logo">
                        <div className="cr-logo-icon">E</div>
                        {isMenuOpen && <span className="cr-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="cr-sidebar-nav">
                    <ul className="cr-nav-list">
                        <li className="cr-nav-item">
                            <a href="/e-contracts/dashboard" className="cr-nav-link">
                                <svg className="cr-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="cr-nav-item cr-nav-active">
                            <a href="/e-contracts/list" className="cr-nav-link">
                                <svg className="cr-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`cr-main-content ${isMenuOpen ? 'cr-content-expanded' : 'cr-content-collapsed'}`}>
                <header className="cr-nav-header">
                    <div className="cr-nav-left">
                        <button className="cr-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="cr-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="cr-nav-right">
                        <button className="cr-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="cr-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="cr-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="cr-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="cr-user-info">
                                <span className="cr-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="cr-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="cr-profile-dropdown">
                                    <div
                                        className={`cr-dropdown-item cr-logout-item ${isLoggingOut ? 'cr-disabled' : ''}`}
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
                                        <svg className="cr-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="cr-main">
                    <div className="cr-page-header">
                        <div>
                            <h1 className="cr-page-title">Xem trước hợp đồng</h1>
                            <p className="cr-page-subtitle">Kiểm tra thông tin trước khi tạo hợp đồng</p>
                        </div>
                        <div className="cr-header-actions">
                            <button className="cr-back-btn" onClick={handleBack} disabled={isSubmitting}>
                                Quay lại chỉnh sửa
                            </button>
                            <button
                                className="cr-submit-btn"
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                            </button>
                        </div>
                    </div>

                    <div className="cr-review-content">
                        <div className="cr-document-container">
                            <div className="cr-template-document">
                                <div className="cr-doc-header">
                                    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                    <p>Độc lập – Tự do – Hạnh phúc</p>
                                </div>

                                <h2 className="cr-doc-title">HỢP ĐỒNG LAO ĐỘNG</h2>
                                <p className="cr-doc-subtitle">
                                    Số: {renderFieldValue('ContractNumber')}/HĐLĐ
                                </p>

                                <div className="cr-doc-body">
                                    <p>- Căn cứ Bộ luật dân sự 2015 và Bộ luật lao động 2019;</p>
                                    <p>- Căn cứ vào nhu cầu và khả năng của hai bên.</p>
                                    <p>
                                        Hôm nay, ngày {renderFieldValue('SignDay')} tháng {renderFieldValue('SignMonth')} năm {renderFieldValue('SignYear')} tại {renderFieldValue('SignLocation')}
                                    </p>
                                    <p>Chúng tôi gồm có:</p>

                                    <p className="cr-section-title">Bên A (Người sử dụng lao động):</p>
                                    <p>– Tên công ty: Công ty TNHH An ninh Con Hổ</p>
                                    <p>– Địa chỉ trụ sở chính: Quận Phú Nhuận, TPHCM</p>
                                    <p>– Đại diện là: Ông/Bà C &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</p>
                                    <p>– Số CCCD: 082204156723 &nbsp;&nbsp; ngày cấp 26/05/2018 &nbsp;&nbsp; nơi cấp: Công an Quận 2</p>
                                    <p>– Mã số thuế / Giấy phép kinh doanh: 0123456789</p>
                                    <p>– Điện thoại: 0346666577 &nbsp;&nbsp;&nbsp;&nbsp; Email: anh.aty2732004@gmail.com</p>

                                    <p className="cr-section-title">Bên B (Người lao động):</p>
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

                                    <p className="cr-section-title">Điều 1. Loại hợp đồng & thời hạn</p>
                                    <p>
                                        Hợp đồng này là Hợp đồng lao động xác định thời hạn / Hợp đồng lao động không xác định thời hạn.
                                    </p>
                                    <p>
                                        Nếu là xác định thời hạn: thời hạn từ ngày {renderFieldValue('ContractStartDate')} đến ngày {renderFieldValue('ContractEndDate')} (không quá 36 tháng nếu theo quy định).
                                    </p>
                                    <p>
                                        Trong trường hợp Bên A và Bên B đồng ý thay đổi công việc, địa điểm, phòng ban, ca trực hoặc phần mềm quản lý thì sẽ lập Phụ lục hợp đồng và ký với Bên B.
                                    </p>

                                    <p className="cr-section-title">Điều 2. Công việc, địa điểm làm việc</p>
                                    <p>Bên B sẽ làm vị trí: Nhân viên bảo vệ – chịu sự quản lý của Bên A.</p>
                                    <p>Công việc chính gồm:</p>
                                    <p>– Thực hiện nhiệm vụ bảo vệ an ninh, giám sát mục tiêu, tuần tra, kiểm soát ra/vào theo phân công.</p>
                                    <p>– Sử dụng phần mềm quản lý và chấm công của Bên A (tên phần mềm: Biometric & shift management system) để khai báo ca trực, đăng nhập khi bắt đầu ca, kết thúc ca và báo cáo theo yêu cầu.</p>

                                    <p className="cr-section-title">Điều 3. Quyền lợi & nghĩa vụ</p>
                                    <p><strong>3.1 Nghĩa vụ của Bên B:</strong></p>
                                    <p>– Thực hiện đúng chức trách vị trí bảo vệ được giao; tuần tra, giám sát, kiểm soát ra/vào, bảo vệ tài sản và người theo phân công.</p>
                                    <p>– Sử dụng phần mềm quản lý/chấm công đúng cách: đăng nhập/đăng xuất theo ca, báo cáo theo yêu cầu.</p>
                                    <p>– Chấp hành nội quy, quy định của Bên A, quy trình ca trực, an toàn lao động, phòng cháy chữa cháy (PCCC).</p>

                                    <p><strong>3.2 Nghĩa vụ của Bên A:</strong></p>
                                    <p>– Cung cấp cho Bên B đầy đủ thiết bị cần thiết (đồng phục, thẻ, thiết bị phần mềm, máy quét nếu có) để Bên B thực hiện công việc.</p>
                                    <p>– Thanh toán lương và phụ cấp đúng hạn; đóng bảo hiểm theo quy định; đảm bảo điều kiện làm việc an toàn.</p>

                                    <p><strong>3.3 Quyền lợi của Bên B:</strong></p>
                                    <p>– Được hưởng lương, phụ cấp, bảo hiểm, quyền nghỉ phép, nghỉ lễ theo quy định của pháp luật và nội quy Bên A.</p>
                                    <p>– Được đào tạo nghiệp vụ bảo vệ, sử dụng phần mềm quản lý, và được hỗ trợ khi làm ca trực mới tại khách hàng.</p>

                                    <p className="cr-section-title">Điều 4. Hiệu lực hợp đồng</p>
                                    <p>Hợp đồng này có hiệu lực kể từ ngày ký.</p>
                                    <p>Hợp đồng này gồm 03(ba) tờ. Hai bên mỗi bên giữ 01 (một) bản có giá trị pháp lý như nhau.</p>
                                    <p>Mọi sửa đổi, bổ sung hợp đồng phải được lập thành Phụ lục hợp đồng, có chữ ký của hai bên mới có hiệu lực.</p>
                                </div>

                                <div className="cr-doc-footer">
                                    <div className="cr-signature-section">
                                        <div className="cr-signature-box">
                                            <p className="cr-signature-title">ĐẠI DIỆN BÊN A</p>
                                            <p className="cr-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                        </div>
                                        <div className="cr-signature-box">
                                            <p className="cr-signature-title">BÊN B – Người lao động</p>
                                            <p className="cr-signature-subtitle">(Ký, ghi rõ họ tên)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="cr-modal-overlay" onClick={cancelLogout}>
                    <div className="cr-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="cr-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="cr-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="cr-modal-footer">
                            <button className="cr-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="cr-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractReview;
