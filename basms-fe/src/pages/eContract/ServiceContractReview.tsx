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

        const style: React.CSSProperties = {
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            maxWidth: '100%',
            display: 'inline-block'
        };
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

        const style: React.CSSProperties = {
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            maxWidth: '100%'
        };
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
                                    <p style={{ marginBottom: '30px' }}>– Nhu cầu và thỏa thuận của các bên.</p>
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
                                    <p>Hợp đồng có hiệu lực từ ngày {renderFieldValue('ContractStartDate')} đến ngày {renderFieldValue('ContractEndDate')}. Hai bên có thể gia hạn hợp đồng bằng phụ lục hợp đồng khi có thỏa thuận bằng văn bản.</p>
                                    <p>– Bên B có trách nhiệm cung cấp thông tin về thời gian diễn ra các hoạt động, sự kiện hoặc thay đổi có thể ảnh hưởng đến lịch trực để Bên A chủ động sắp xếp nhân sự phù hợp.</p>
                                    <p>– Bên A chịu trách nhiệm quản lý, kiểm tra và đảm bảo chất lượng ca trực, đồng thời thay thế ngay nhân viên vi phạm quy định hoặc không đáp ứng yêu cầu nhiệm vụ.</p>
                                    <p>– Nhân viên bảo vệ của Bên A phải có mặt tại vị trí trực đúng giờ, không tự ý rời khỏi vị trí, không đổi ca hoặc nghỉ ca khi chưa có sự chấp thuận của người quản lý được phân công.</p>

                                    <p className="scr-section-title">ĐIỀU 3: LỊCH LÀM VIỆC, CA TRỰC, NGÀY NGHỈ VÀ TĂNG CA</p>
                                    <p><strong>3.1. Quy định chung về ca trực</strong></p>
                                    <p>– Bên A bố trí nhân viên bảo vệ làm việc {renderFieldValue('TaskPeriod')}, đảm bảo an ninh trật tự tại khu vực Nhà Văn hoá Sinh viên TP.HCM.</p>
                                    <p>– Mỗi ngày chia thành  {renderFieldValue('ShiftQuantityPerDay')} ca làm việc như sau:</p>
                                    <div className="scr-multiline-field" style={{ textIndent: '30px' }}>
                                        {renderMultilineText('TaskSchedules')}
                                    </div>
                                    <p>– Mỗi ca bảo đảm đủ quân số, không gián đoạn công tác bảo vệ.</p>
                                    <p>– Nhân viên phải có mặt đúng giờ, không tự ý rời ca, đổi ca hoặc nghỉ ca khi chưa được người quản lý phê duyệt.</p>

                                    <p><strong>3.2. Lịch làm việc và ngày nghỉ thường xuyên</strong></p>
                                    <p>– Mỗi nhân viên bảo vệ được bố trí nghỉ 01 (một) ngày/tuần, theo lịch luân phiên do Bên A sắp xếp, bảo đảm mục tiêu luôn có đủ nhân lực trực 24/24.</p>
                                    <p>– Lịch nghỉ được quản lý nội bộ của Bên A điều phối nhưng phải duy trì quân số trực tại mục tiêu, không làm gián đoạn dịch vụ.</p>

                                    <p><strong>3.3. Ca trực cuối tuần (Thứ Bảy và Chủ Nhật)</strong></p>
                                    <div className="scr-multiline-field">
                                        {renderMultilineText('WeekendPolicy')}
                                    </div>

                                    <p><strong>3.4. Ngày lễ, Tết</strong></p>
                                    <div className="scr-multiline-field">
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
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p className="scr-section-title">ĐIỀU 4: GIÁ TRỊ VÀ PHƯƠNG THỨC THANH TOÁN</p>
                                    <p>Tổng giá trị hợp đồng: ………………………………………..</p>
                                    <p>Phương thức thanh toán: Bên B thanh toán cho Bên A hàng tháng bằng hình thức chuyển khoản vào tài khoản của Bên A trong vòng 05 (năm) ngày kể từ ngày nhận hóa đơn hợp lệ.</p>
                                    <p>Tài khoản Bên A: ……………………………………………..</p>

                                    <p className="scr-section-title">ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</p>
                                    <p>– Cung cấp đầy đủ nhân sự bảo vệ đúng thời gian, ca trực và tiêu chuẩn chuyên môn đã thỏa thuận.</p>
                                    <p>– Đảm bảo nhân viên bảo vệ có đồng phục, thẻ tên và được đào tạo nghiệp vụ.</p>
                                    <p>– Giám sát, kiểm tra thường xuyên hoạt động của nhân viên bảo vệ tại địa điểm làm việc.</p>
                                    <p>– Bồi thường thiệt hại cho Bên B nếu lỗi do nhân viên Bên A gây ra trong quá trình thực hiện công việc.</p>
                                    <p>– Thay thế nhân viên bảo vệ khi có yêu cầu hợp lý từ Bên B trong vòng 24 giờ.</p>

                                    <p className="scr-section-title">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</p>
                                    <p>– Thanh toán đúng hạn theo quy định tại Điều 4 của hợp đồng.</p>
                                    <p>– Cung cấp đầy đủ thông tin, nội quy, quy định của địa điểm bảo vệ để Bên A nắm rõ.</p>
                                    <p>– Có quyền yêu cầu thay đổi nhân viên bảo vệ nếu nhân viên đó vi phạm quy định, thiếu trách nhiệm.</p>
                                    <p>– Phối hợp với Bên A trong việc xử lý các tình huống phát sinh liên quan đến an ninh, trật tự.</p>


                                    <p className="scr-section-title">ĐIỀU 7: TRÁCH NHIỆM VÀ BỒI THƯỜNG THIỆT HẠI</p>
                                    <p>Hai bên có trách nhiệm phối hợp giải quyết mọi sự cố an ninh xảy ra tại khu vực bảo vệ. Nếu thiệt hại xảy ra do lỗi chủ quan của nhân viên bảo vệ, Bên A chịu trách nhiệm bồi thường theo quy định của pháp luật.</p>

                                    <p className="scr-section-title">ĐIỀU 8: BẢO MẬT VÀ XỬ LÝ THÔNG TIN</p>
                                    <p>Bên A và nhân viên của Bên A cam kết giữ bí mật thông tin, tài liệu liên quan tới khu vực bảo vệ và hoạt động nội bộ của Bên B; không được tiết lộ cho bên thứ ba nếu không có sự đồng ý bằng văn bản của Bên B. Việc sử dụng hình ảnh, dữ liệu camera (nếu có) phải tuân theo pháp luật về bảo vệ dữ liệu cá nhân.</p>
                                    <p style={{ textIndent: '30px' }}>8.1. Kiểm tra, đánh giá và chứng cứ tuân thủ: Theo yêu cầu hợp lý của Bên B, Bên A cung cấp báo cáo, tài liệu chứng minh tuân thủ (ví dụ: biên bản kiểm thử/xâm nhập, báo cáo đánh giá bảo mật) và/hoặc cho phép kiểm tra tại chỗ trong phạm vi không ảnh hưởng đến an ninh của Hệ thống; chi phí phát sinh do hai bên thỏa thuận.</p>
                                    <p style={{ textIndent: '30px' }}>8.2. Thời hạn lưu giữ, hủy/ẩn danh dữ liệu: Bên A lưu giữ Thông tin Khách hàng không lâu hơn mức cần thiết cho mục đích thực hiện Hợp đồng hoặc thời hạn luật định. Khi chấm dứt Hợp đồng hoặc khi Bên B yêu cầu, Bên A xóa/ẩn danh hoặc trả lại dữ liệu, trừ trường hợp pháp luật yêu cầu lưu giữ lâu hơn (bao gồm xóa bản sao lưu khi không còn nhu cầu nghiệp vụ).</p>
                                </div>
                            </div>

                            {/* Page 4 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p style={{ textIndent: '30px' }}>8.3. Sự cố xâm phạm dữ liệu: Khi phát hiện sự cố gây hoặc có khả năng gây ảnh hưởng tới dữ liệu cá nhân, Bên A sẽ (i) kích hoạt quy trình ứng cứu, khắc phục; (ii) thông báo cho Bên B kèm tối thiểu thời điểm phát hiện, loại dữ liệu bị ảnh hưởng, phạm vi, nguyên nhân dự kiến, biện pháp đã áp dụng; và (iii) phối hợp với Bên B để thực hiện nghĩa vụ thông báo cơ quan nhà nước có thẩm quyền và/hoặc chủ thể dữ liệu trong thời hạn luật định.</p>
                                    <p style={{ textIndent: '30px' }}>8.4. Quyền của chủ thể dữ liệu và hỗ trợ của Bên A: Theo yêu cầu hợp lệ của Bên B hoặc của chủ thể dữ liệu, Bên A sẽ hỗ trợ tra cứu, cung cấp bản sao, chỉnh sửa, hạn chế xử lý hoặc xóa dữ liệu theo thời hạn pháp luật quy định; trường hợp có yêu cầu hạn chế xử lý, Bên A thực hiện trong thời hạn luật định.</p>
                                    <p style={{ textIndent: '30px' }}>8.5. Lưu trữ và định vị dữ liệu; chuyển dữ liệu ra nước ngoài: Thông tin Khách hàng được lưu trữ tại Việt Nam, trừ khi hai bên có thỏa thuận khác và Bên A đáp ứng đầy đủ điều kiện pháp luật về đánh giá tác động và thông báo cho cơ quan có thẩm quyền trước khi chuyển dữ liệu ra nước ngoài. Bên A duy trì hồ sơ tuân thủ và cung cấp cho Bên B khi được yêu cầu.</p>
                                    <p style={{ textIndent: '30px' }}>8.6. Truy cập, chia sẻ và nhà thầu phụ: Chỉ nhân sự được ủy quyền của Bên A mới được truy cập Hệ thống ở mức quyền tối thiểu cần thiết. Việc sử dụng nhà thầu phụ/cung cấp dịch vụ đám mây cho Hệ thống phải có chấp thuận bằng văn bản của Bên B và Bên A bảo đảm ràng buộc nghĩa vụ bảo mật tương đương.</p>
                                    <p style={{ textIndent: '30px' }}>8.7. Biện pháp an ninh kỹ thuật và tổ chức: Bên A áp dụng tối thiểu các biện pháp: (i) phân quyền theo vai trò (RBAC) và xác thực nhiều lớp đối với tài khoản quản trị Hệ thống; (ii) mã hóa dữ liệu khi truyền và khi lưu trữ (nếu khả thi); (iii) tách môi trường và kiểm soát sao lưu/khôi phục; (iv) ghi nhật ký và lưu giữ nhật ký xử lý dữ liệu; (v) rà soát bảo mật định kỳ, khắc phục lỗ hổng; (vi) cam kết bảo mật và đào tạo định kỳ cho nhân sự truy cập Hệ thống.</p>
                                    <p style={{ textIndent: '30px' }}>8.8. Căn cứ xử lý và minh bạch: Bên A chỉ thu thập và xử lý trong phạm vi cần thiết để thực hiện Hợp đồng và theo căn cứ pháp luật hiện hành; thực hiện nghĩa vụ thông báo/ghi nhận chấp thuận khi xử lý dữ liệu cá nhân nhạy cảm theo quy định; bố trí đầu mối tiếp nhận và giải quyết các yêu cầu liên quan đến dữ liệu cá nhân.</p>
                                    <p style={{ textIndent: '30px' }}>8.9. Vai trò xử lý dữ liệu: Đối với Thông tin Khách hàng do Bên B cung cấp hoặc phát sinh trong quá trình thực hiện dịch vụ, Bên A là bên xử lý dữ liệu theo ủy quyền của Bên B và chỉ được xử lý theo hướng dẫn bằng văn bản của Bên B; không dùng cho mục đích riêng, không bán, không chia sẻ cho bên thứ ba nếu không có căn cứ pháp luật hoặc chấp thuận bằng văn bản của Bên B.</p>
                                    <p style={{ textIndent: '30px' }}>8.10. Phạm vi và phân loại dữ liệu: "Thông tin Khách hàng" trên Hệ thống quản lý nhân sự và chấm công của Bên A (gọi chung là "Hệ thống") bao gồm: (i) dữ liệu định danh, liên hệ của Bên B và người đại diện/đầu mối liên hệ; (ii) dữ liệu lập lịch, ca trực gắn với địa điểm của Bên B; (iii) nhật ký vào/ra, điểm danh, chấm công có thể chứa họ tên, số liên hệ, biển số, giờ vào/ra; (iv) dữ liệu hình ảnh/âm thanh nếu Hệ thống tích hợp camera; và (v) các trường dữ liệu khác được thỏa thuận bằng phụ lục. Các dữ liệu này có thể là "dữ liệu cá nhân" và một phần có thể là "dữ liệu cá nhân nhạy cảm" theo quy định pháp luật (ví dụ: dữ liệu sinh trắc học nếu dùng chấm công vân tay/khuôn mặt).</p>

                                    <p className="scr-section-title">ĐIỀU 9: GIẢI QUYẾT TRANH CHẤP</p>
                                    <p>Trước khi đưa ra Tòa án, hai bên sẽ thương lượng, hòa giải. Nếu hòa giải không thành, tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền nơi Bên A đặt trụ sở hoặc theo thỏa thuận khác; hợp đồng chịu sự điều chỉnh của pháp luật Việt Nam.</p>
                                </div>
                            </div>

                            {/* Page 6 */}
                            <div className="scr-a4-page">
                                <div className="scr-doc-body">
                                    <p className="scr-section-title">ĐIỀU 10: HIỆU LỰC HỢP ĐỒNG</p>
                                    <p>1. Hai bên cam kết thực hiện nghiêm túc các điều khoản đã ký kết.</p>
                                    <p>2. Mọi sửa đổi, bổ sung hợp đồng phải được lập thành văn bản (phụ lục) và có chữ ký của đại diện hai bên.</p>
                                    <p>3. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản.</p>
                                    <p>4. Hợp đồng có hiệu lực kể từ ngày ký.</p>
                                </div>

                                <div className="scr-doc-footer">
                                    <div className="scr-signature-section">
                                        <div className="scr-signature-box">
                                            <p className="scr-signature-title">ĐẠI DIỆN BÊN A</p>
                                            <p className="scr-signature-subtitle">(Ký, ghi rõ họ tên, đóng dấu)</p>
                                        </div>
                                        <div className="scr-signature-box">
                                            <p className="scr-signature-title">ĐẠI DIỆN BÊN B</p>
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
