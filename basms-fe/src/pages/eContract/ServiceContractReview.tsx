import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEContractAuth } from '../../hooks/useEContractAuth';
import './ServiceContractReview.css';
import SnackbarChecked from "../../components/snackbar/snackbarChecked.tsx";
import SnackbarFailed from "../../components/snackbar/snackbarFailed.tsx";

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

const ServiceContractReview = () => {
    const navigate = useNavigate();
    const { user, logout } = useEContractAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [contractData, setContractData] = useState<ContractData | null>(null);
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);

    useEffect(() => {
        // Load contract data from localStorage
        const storedData = localStorage.getItem('serviceContractReviewData');
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
        navigate(-1);
    };

    const handleConfirm = async () => {
        if (!contractData) return;

        setIsSubmitting(true);

        try {
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

            const response = await fetch(`${apiUrl}/contracts/template/fill-from-s3`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    templateDocumentId: contractData.templateId,
                    data: payload
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create contract');
            }
            localStorage.removeItem('serviceContractReviewData');
            setShowSnackbarSuccess(true);
            setTimeout(() => navigate('/e-contracts/list'), 6000);
        } catch (error) {
            setShowSnackbarFailed(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFieldValue = (fieldName: string) => {
        if (!contractData || !contractData.formData[fieldName]) {
            return <span className="scr-field-placeholder">{`{{${fieldName}}}`}</span>;
        }

        const field = contractData.formData[fieldName];
        const { value, formatting } = field;
        if (!field || !field.value) {
            return <span className="scr-field-placeholder">............</span>;
        }

        const style: React.CSSProperties = {};
        if (formatting.bold) style.fontWeight = 'bold';
        if (formatting.italic) style.fontStyle = 'italic';
        if (formatting.underline) style.textDecoration = 'underline';

        return <span style={style}>{value || `${field.value}`}</span>;
    };

    // Render multiline text with proper line breaks
    const renderMultilineText = (fieldName: string) => {
        if (!contractData || !contractData.formData[fieldName]) {
            return <span className="scr-field-placeholder">{`{{${fieldName}}}`}</span>;
        }

        const field = contractData.formData[fieldName];
        if (!field || !field.value) {
            return <span className="scr-field-placeholder">............</span>;
        }

        const style: React.CSSProperties = {};
        if (field.formatting.bold) style.fontWeight = 'bold';
        if (field.formatting.italic) style.fontStyle = 'italic';
        if (field.formatting.underline) style.textDecoration = 'underline';

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

    if (!contractData) {
        return (
            <div className="scr-loading-container">
                <div className="scr-loading-text">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className={`scr-container ${isLoggingOut ? 'scr-disabled' : ''}`}>
            <aside className={`scr-sidebar ${isMenuOpen ? 'scr-sidebar-open' : 'scr-sidebar-closed'}`}>
                <div className="scr-sidebar-header">
                    <div className="scr-sidebar-logo">
                        <div className="scr-logo-icon">C</div>
                        {isMenuOpen && <span className="scr-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="scr-sidebar-nav">
                    <ul className="ec-contracts-nav-list">
                        <li className="ec-contracts-nav-item">
                            <a href="/e-contracts/dashboard" className="ec-contracts-nav-link">
                                <svg className="ec-contracts-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="ec-contracts-nav-item ec-contracts-nav-active">
                            <a href="/e-contracts/list" className="ec-contracts-nav-link">
                                <svg className="ec-contracts-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                        <li className="ec-contracts-nav-item">
                            <a href="#" className="ec-contracts-nav-link">
                                <svg className="ec-contracts-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`scr-main-content ${isMenuOpen ? 'scr-content-expanded' : 'scr-content-collapsed'}`}>
                <header className="scr-nav-header">
                    <div className="scr-nav-left">
                        <button className="scr-menu-toggle" onClick={toggleMenu}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="scr-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="ec-contracts-nav-right">
                        <button className="ec-contracts-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="ec-contracts-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="ec-contracts-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="ec-contracts-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="ec-contracts-user-info">
                                <span className="ec-contracts-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="ec-contracts-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="ec-contracts-profile-dropdown">
                                    <div
                                        className={`ec-contracts-dropdown-item ec-contracts-logout-item ${isLoggingOut ? 'ec-contracts-disabled' : ''}`}
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
                                        <svg className="ec-contracts-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="scr-main">
                    <div className="scr-page-header">
                        <div>
                            <h1 className="scr-page-title">Xem trước hợp đồng dịch vụ bảo vệ</h1>
                            <p className="scr-page-subtitle">Kiểm tra thông tin trước khi tạo hợp đồng</p>
                        </div>
                        <div className="scr-header-actions">
                            <button className="scr-back-btn" onClick={handleBack} disabled={isSubmitting}>
                                Quay lại chỉnh sửa
                            </button>
                            <button
                                className="scr-submit-btn"
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                            </button>
                        </div>
                    </div>

                    <div className="scr-review-content">
                        <div className="scr-document-pages">
                            {/* Page 1 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-header">
                                    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                    <p>Độc lập – Tự do – Hạnh phúc</p>
                                </div>

                                <h2 className="scr-doc-title">HỢP ĐỒNG DỊCH VỤ BẢO VỆ</h2>
                                <p className="scr-doc-subtitle">
                                    Số: {renderFieldValue('ContractNumber')}/HDDVBV
                                </p>

                                <div className="scr-doc-body">
                                    <p><strong>Căn cứ:</strong></p>
                                    <p>– Bộ luật Dân sự 2015;</p>
                                    <p>– Luật Thương mại 2005;</p>
                                    <p>– Nghị định 96/2016/NĐ-CP (được sửa đổi, bổ sung bởi Nghị định 56/2023/NĐ-CP) về điều kiện an ninh, trật tự đối với ngành, nghề đầu tư kinh doanh có điều kiện;</p>
                                    <p>– Nhu cầu và thỏa thuận của các bên.</p>
                                    <p>
                                        Hôm nay, ngày {renderFieldValue('SignDay')} tháng {renderFieldValue('SignMonth')} năm {renderFieldValue('SignYear')} tại {renderFieldValue('SignLocation')}, chúng tôi gồm có:
                                    </p>

                                    <p className="scr-section-title">BÊN A: CÔNG TY TNHH AN NINH CON HỔ</p>
                                    <p>Địa chỉ: Quận Phú Nhuận, TPHCM</p>
                                    <p>Điện thoại: 0346666577</p>
                                    <p>Email: anh.aty2732004@gmail.com</p>
                                    <p>Mã số thuế: 0123456789</p>
                                    <p>Đại diện: Ông Nguyễn Văn Bảnh – Giám đốc</p>
                                    <p>Số CCCD: 082204156723</p>

                                    <p className="scr-section-title">BÊN B: {renderFieldValue('CompanyName')}</p>
                                    <p>Địa chỉ: {renderFieldValue('Address')}</p>
                                    <p>Điện thoại: {renderFieldValue('Phone')}</p>
                                    <p>Email: {renderFieldValue('CompanyEmail')}</p>
                                    <p>Mã số thuế: {renderFieldValue('TaxCode')}</p>
                                    <p>Đại diện: {renderFieldValue('Gender')} {renderFieldValue('Name')} – Giám đốc điều hành</p>
                                    <p>Số CCCD: {renderFieldValue('EmployeeIdentityNumber')}</p>

                                    <p>Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:</p>

                                    <p className="scr-section-title">ĐIỀU 1: ĐỐI TƯỢNG VÀ PHẠM VI HỢP ĐỒNG</p>
                                    <p>Bên A cung cấp dịch vụ bảo vệ chuyên nghiệp cho Bên B tại địa điểm:</p>
                                    <p>– Tên địa điểm: {renderFieldValue('CompanyName')}</p>
                                    <p>– Địa chỉ: {renderFieldValue('Address')}</p>
                                    <p>– Số lượng: {renderFieldValue('GuardQuantity')}</p>
                                </div>
                            </div>

                            {/* Page 2 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p className="scr-section-title">ĐIỀU 2: THỜI HẠN HỢP ĐỒNG</p>
                                    <p>Thời hạn hợp đồng: {renderFieldValue('TaskPeriod')}</p>
                                    <p>– Ngày bắt đầu: {renderFieldValue('ContractStartDate')}</p>
                                    <p>– Ngày kết thúc: {renderFieldValue('ContractEndDate')}</p>
                                    <p>Hợp đồng có thể được gia hạn hoặc chấm dứt theo thỏa thuận của hai bên hoặc theo quy định của pháp luật.</p>

                                    <p className="scr-section-title">ĐIỀU 3: LỊCH LÀM VIỆC, CA TRỰC, NGÀY NGHỈ VÀ TĂNG CA</p>
                                    <p><strong>3.1. Lịch làm việc và ca trực:</strong></p>
                                    <p>Bên A cung cấp nhân viên bảo vệ làm việc theo lịch trình như sau:</p>
                                    <p>– Số ca làm việc mỗi ngày: {renderFieldValue('ShiftQuantityPerDay')} ca</p>
                                    <p>– Lịch ca trực cụ thể:</p>
                                    <div className="scr-multiline-field">
                                        {renderMultilineText('TaskSchedules')}
                                    </div>

                                    <p><strong>3.2. Ngày nghỉ cuối tuần:</strong></p>
                                    <div className="scr-multiline-field">
                                        {renderMultilineText('WeekendPolicy')}
                                    </div>

                                    <p><strong>3.3. Ngày nghỉ lễ, Tết:</strong></p>
                                    <div className="scr-multiline-field">
                                        {renderMultilineText('HolidayPolicy')}
                                    </div>

                                    <p><strong>3.4. Tăng ca:</strong></p>
                                    <p>Nếu Bên B yêu cầu tăng ca (ngoài lịch trình đã thỏa thuận), hai bên sẽ thỏa thuận về mức phí tăng ca và thanh toán riêng theo từng tháng.</p>
                                </div>
                            </div>

                            {/* Page 3 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p className="scr-section-title">ĐIỀU 4: GIÁ TRỊ VÀ PHƯƠNG THỨC THANH TOÁN</p>
                                    <p><strong>4.1. Giá trị hợp đồng:</strong></p>
                                    <p>Giá trị hợp đồng được xác định dựa trên:</p>
                                    <p>– Số lượng nhân viên bảo vệ: {renderFieldValue('GuardQuantity')}</p>
                                    <p>– Thời gian thực hiện dịch vụ</p>
                                    <p>– Các yêu cầu cụ thể về ca trực và địa điểm</p>
                                    <p>Chi phí cụ thể sẽ được thỏa thuận và ghi chi tiết trong Phụ lục hợp đồng hoặc bảng báo giá đính kèm.</p>

                                    <p><strong>4.2. Phương thức thanh toán:</strong></p>
                                    <p>– Bên B thanh toán cho Bên A theo chu kỳ: hàng tháng/quý (tùy thỏa thuận).</p>
                                    <p>– Hình thức thanh toán: chuyển khoản ngân hàng hoặc tiền mặt.</p>
                                    <p>– Thời hạn thanh toán: trong vòng … ngày kể từ ngày nhận hóa đơn hợp lệ từ Bên A.</p>
                                    <p>– Bên A sẽ cung cấp hóa đơn giá trị gia tăng (VAT) đầy đủ theo quy định.</p>

                                    <p><strong>4.3. Điều chỉnh giá:</strong></p>
                                    <p>Trường hợp có sự thay đổi về chính sách lương tối thiểu, bảo hiểm xã hội hoặc các quy định pháp luật liên quan, hai bên sẽ thương lượng điều chỉnh giá hợp đồng phù hợp.</p>

                                    <p className="scr-section-title">ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</p>
                                    <p><strong>5.1. Quyền của Bên A:</strong></p>
                                    <p>– Được thanh toán đầy đủ, đúng hạn theo thỏa thuận.</p>
                                    <p>– Được quyền điều chỉnh nhân sự bảo vệ khi cần thiết để đảm bảo chất lượng dịch vụ.</p>
                                    <p>– Được từ chối thực hiện các yêu cầu vượt quá phạm vi hợp đồng hoặc không hợp pháp.</p>

                                    <p><strong>5.2. Nghĩa vụ của Bên A:</strong></p>
                                    <p>– Cung cấp đủ số lượng nhân viên bảo vệ có trình độ chuyên môn, sức khỏe phù hợp.</p>
                                    <p>– Trang bị đồng phục, thiết bị bảo vệ cần thiết cho nhân viên.</p>
                                    <p>– Đào tạo, hướng dẫn nhân viên bảo vệ tuân thủ quy trình làm việc tại địa điểm của Bên B.</p>
                                    <p>– Quản lý, giám sát và chịu trách nhiệm về hành vi của nhân viên bảo vệ trong quá trình thực hiện nhiệm vụ.</p>
                                    <p>– Thay thế nhân viên khi có yêu cầu hợp lý từ Bên B hoặc khi nhân viên không đáp ứng yêu cầu công việc.</p>
                                    <p>– Mua bảo hiểm trách nhiệm nghề nghiệp và các loại bảo hiểm bắt buộc khác cho nhân viên theo quy định.</p>
                                </div>
                            </div>

                            {/* Page 4 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p className="scr-section-title">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</p>
                                    <p><strong>6.1. Quyền của Bên B:</strong></p>
                                    <p>– Yêu cầu Bên A cung cấp dịch vụ đúng tiêu chuẩn, đúng số lượng và đúng thời hạn đã thỏa thuận.</p>
                                    <p>– Được quyền yêu cầu thay đổi nhân viên bảo vệ nếu có lý do chính đáng (vi phạm kỷ luật, không đáp ứng yêu cầu công việc).</p>
                                    <p>– Được quyền tạm dừng hoặc chấm dứt hợp đồng nếu Bên A vi phạm nghiêm trọng các điều khoản đã cam kết.</p>
                                    <p>– Được giám sát, đánh giá chất lượng dịch vụ của Bên A.</p>

                                    <p><strong>6.2. Nghĩa vụ của Bên B:</strong></p>
                                    <p>– Thanh toán đầy đủ, đúng hạn theo thỏa thuận.</p>
                                    <p>– Cung cấp điều kiện làm việc cần thiết cho nhân viên bảo vệ (nơi trực, điện nước, vệ sinh...).</p>
                                    <p>– Cung cấp thông tin về quy trình, nội quy làm việc tại địa điểm cần bảo vệ.</p>
                                    <p>– Phối hợp với Bên A trong việc quản lý, giám sát nhân viên bảo vệ.</p>
                                    <p>– Thông báo kịp thời cho Bên A khi có thay đổi về yêu cầu dịch vụ hoặc phát sinh vấn đề.</p>

                                    <p className="scr-section-title">ĐIỀU 7: TRÁCH NHIỆM BỒI THƯỜNG</p>
                                    <p><strong>7.1. Trách nhiệm của Bên A:</strong></p>
                                    <p>Bên A chịu trách nhiệm bồi thường thiệt hại cho Bên B trong các trường hợp sau:</p>
                                    <p>– Nhân viên bảo vệ vi phạm quy định, gây thiệt hại về tài sản hoặc uy tín của Bên B.</p>
                                    <p>– Không cung cấp đủ số lượng nhân viên theo thỏa thuận mà không có lý do chính đáng.</p>
                                    <p>– Vi phạm các cam kết về bảo mật thông tin.</p>
                                    <p>Mức bồi thường sẽ được xác định căn cứ vào mức độ thiệt hại thực tế và theo quy định của pháp luật.</p>

                                    <p><strong>7.2. Trách nhiệm của Bên B:</strong></p>
                                    <p>Bên B chịu trách nhiệm bồi thường thiệt hại cho Bên A trong các trường hợp sau:</p>
                                    <p>– Chậm thanh toán hoặc không thanh toán đầy đủ chi phí dịch vụ theo thỏa thuận.</p>
                                    <p>– Không cung cấp điều kiện làm việc cần thiết, ảnh hưởng đến sức khỏe, an toàn của nhân viên bảo vệ.</p>
                                    <p>– Chấm dứt hợp đồng trước thời hạn mà không có lý do chính đáng hoặc không thông báo trước theo quy định.</p>

                                    <p><strong>7.3. Giới hạn trách nhiệm:</strong></p>
                                    <p>Trong trường hợp bất khả kháng (thiên tai, hỏa hoạn, dịch bệnh, chiến tranh...), hai bên được miễn trừ trách nhiệm bồi thường. Bên gặp sự kiện bất khả kháng phải thông báo cho bên kia trong vòng 24 giờ và có biện pháp khắc phục kịp thời.</p>
                                </div>
                            </div>

                            {/* Page 5 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p className="scr-section-title">ĐIỀU 8: BẢO MẬT THÔNG TIN</p>
                                    <p><strong>8.1. Cam kết bảo mật:</strong></p>
                                    <p>Hai bên cam kết bảo mật mọi thông tin liên quan đến hợp đồng này và hoạt động kinh doanh của nhau, trừ khi được sự đồng ý bằng văn bản hoặc theo yêu cầu của pháp luật.</p>

                                    <p><strong>8.2. Định nghĩa thông tin bảo mật:</strong></p>
                                    <p>Thông tin bảo mật bao gồm nhưng không giới hạn:</p>
                                    <p>– Thông tin kinh doanh, kế hoạch, chiến lược, báo cáo tài chính;</p>
                                    <p>– Thông tin về khách hàng, đối tác, nhà cung cấp;</p>
                                    <p>– Thông tin về hệ thống an ninh, quy trình bảo vệ;</p>
                                    <p>– Các tài liệu, dữ liệu kỹ thuật và thông tin nội bộ khác.</p>

                                    <p><strong>8.3. Nghĩa vụ bảo mật của Bên A:</strong></p>
                                    <p>– Hướng dẫn và yêu cầu nhân viên bảo vệ ký cam kết bảo mật thông tin.</p>
                                    <p>– Không tiết lộ thông tin về hoạt động, tài sản, nhân sự của Bên B cho bất kỳ bên thứ ba nào.</p>
                                    <p>– Chỉ sử dụng thông tin của Bên B cho mục đích thực hiện hợp đồng này.</p>

                                    <p><strong>8.4. Nghĩa vụ bảo mật của Bên B:</strong></p>
                                    <p>– Không tiết lộ thông tin về nhân sự, quy trình làm việc, mức giá dịch vụ của Bên A cho các đối thủ cạnh tranh.</p>
                                    <p>– Bảo vệ thông tin cá nhân của nhân viên bảo vệ theo quy định về bảo vệ dữ liệu cá nhân.</p>

                                    <p><strong>8.5. Ngoại lệ:</strong></p>
                                    <p>Nghĩa vụ bảo mật không áp dụng đối với thông tin:</p>
                                    <p>– Đã được công khai hợp pháp trước khi ký hợp đồng;</p>
                                    <p>– Được tiết lộ theo yêu cầu của cơ quan nhà nước có thẩm quyền;</p>
                                    <p>– Được sự đồng ý bằng văn bản của bên kia.</p>

                                    <p><strong>8.6. Thời hạn bảo mật:</strong></p>
                                    <p>Nghĩa vụ bảo mật có hiệu lực trong suốt thời gian hợp đồng và tiếp tục trong vòng 02 (hai) năm sau khi hợp đồng chấm dứt.</p>

                                    <p><strong>8.7. Xử lý vi phạm:</strong></p>
                                    <p>Bên vi phạm cam kết bảo mật phải chịu trách nhiệm bồi thường toàn bộ thiệt hại phát sinh cho bên bị vi phạm và có thể bị xử lý theo quy định pháp luật.</p>
                                </div>
                            </div>

                            {/* Page 6 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p className="scr-section-title">ĐIỀU 9: ĐIỀU KHOẢN CHUNG</p>
                                    <p><strong>9.1. Sửa đổi, bổ sung hợp đồng:</strong></p>
                                    <p>Mọi sửa đổi, bổ sung hợp đồng phải được lập thành văn bản (Phụ lục hợp đồng) và có chữ ký, đóng dấu của cả hai bên. Phụ lục hợp đồng là một phần không tách rời của hợp đồng này.</p>

                                    <p><strong>9.2. Chấm dứt hợp đồng:</strong></p>
                                    <p>Hợp đồng chấm dứt trong các trường hợp sau:</p>
                                    <p>– Hết thời hạn hợp đồng;</p>
                                    <p>– Hai bên thỏa thuận chấm dứt trước thời hạn;</p>
                                    <p>– Một bên đơn phương chấm dứt do bên kia vi phạm nghiêm trọng các điều khoản hợp đồng và phải thông báo trước ít nhất 30 ngày;</p>
                                    <p>– Theo quyết định của cơ quan có thẩm quyền hoặc theo quy định pháp luật.</p>

                                    <p><strong>9.3. Giải quyết tranh chấp:</strong></p>
                                    <p>Mọi tranh chấp phát sinh từ hợp đồng này sẽ được giải quyết thông qua thương lượng, hòa giải giữa hai bên.</p>
                                    <p>Nếu không thương lượng được trong vòng 30 ngày, tranh chấp sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền theo quy định của pháp luật Việt Nam.</p>

                                    <p><strong>9.4. Luật áp dụng:</strong></p>
                                    <p>Hợp đồng này được điều chỉnh và giải thích theo pháp luật Việt Nam.</p>

                                    <p><strong>9.5. Ngôn ngữ hợp đồng:</strong></p>
                                    <p>Hợp đồng được lập bằng tiếng Việt. Trong trường hợp có phiên bản song ngữ, phiên bản tiếng Việt sẽ được ưu tiên áp dụng.</p>

                                    <p className="scr-section-title">ĐIỀU 10: HIỆU LỰC HỢP ĐỒNG</p>
                                    <p><strong>10.1. Hiệu lực:</strong></p>
                                    <p>Hợp đồng này có hiệu lực kể từ ngày ký.</p>

                                    <p><strong>10.2. Số bản hợp đồng:</strong></p>
                                    <p>Hợp đồng được lập thành 02 (hai) bản gốc có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản.</p>

                                    <p><strong>10.3. Cam kết chung:</strong></p>
                                    <p>Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản đã thỏa thuận trong hợp đồng này. Mọi vi phạm sẽ được xử lý theo quy định của pháp luật.</p>
                                </div>

                                <div className="scr-doc-footer">
                                    <div className="scr-signature-section">
                                        <div className="scr-signature-box">
                                            <p className="scr-signature-title">ĐẠI DIỆN BÊN A</p>
                                            <p className="scr-signature-subtitle">CÔNG TY TNHH AN NINH CON HỔ</p>
                                            <p className="scr-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                        </div>
                                        <div className="scr-signature-box">
                                            <p className="scr-signature-title">ĐẠI DIỆN BÊN B</p>
                                            <p className="scr-signature-subtitle">{renderFieldValue('CompanyName')}</p>
                                            <p className="scr-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>


            {showLogoutModal && (
                <div className="scr-modal-overlay" onClick={cancelLogout}>
                    <div className="scr-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="scr-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="scr-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="scr-modal-footer">
                            <button className="scr-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="scr-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SnackbarChecked
                message="Hợp đồng dịch vụ bảo vệ đã điền thông tin thành công và gửi đến email bên kí xác nhận"
                isOpen={showSnackbarSuccess}
                duration={4000}
                onClose={() => setShowSnackbarSuccess(false)}
            />

            <SnackbarFailed
                message="Điền thông tin thất bại. Hãy thử lại"
                isOpen={showSnackbarFailed}
                duration={4000}
                onClose={() => setShowSnackbarFailed(false)}
            />
        </div>
    );
};

export default ServiceContractReview;
