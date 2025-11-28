import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEContractAuth } from '../../hooks/useEContractAuth';
import './ContractApproval.css';

interface ContractDocument {
    fileUrl: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    documentId: string;
    createdAt: string;
    category?: string;
}

interface ContractResponse {
    success: boolean;
    data: ContractDocument;
}

interface ProgressStep {
    id: string;
    label: string;
    status: 'pending' | 'in_progress' | 'success' | 'error';
    message?: string;
}

const ContractApproval = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useEContractAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [contractData, setContractData] = useState<ContractDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
        { id: 'approve', label: 'Xét duyệt hợp đồng', status: 'pending' },
        { id: 'import', label: 'Tạo mới thông tin', status: 'pending' },
    ]);

    const category = location.state?.category;

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

    useEffect(() => {
        const fetchContractData = async () => {
            if (!documentId) {
                setError('Thiếu thông tin document ID');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('eContractAccessToken');

                if (!token) {
                    navigate('/e-contract/login');
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/documents/${documentId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Không thể tải thông tin hợp đồng');
                }

                const result: ContractResponse = await response.json();

                if (!result.success || !result.data) {
                    throw new Error('Dữ liệu hợp đồng không hợp lệ');
                }

                setContractData(result.data);
                setDocumentUrl(result.data.fileUrl);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải hợp đồng');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContractData();
    }, [documentId, navigate]);

    const updateProgressStep = (stepId: string, status: ProgressStep['status'], message?: string) => {
        setProgressSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status, message } : step
        ));
    };

    const handleApprove = async () => {
        if (!documentId || !isConfirmed) return;

        setIsProcessing(true);

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');
            const userId = user?.userId || localStorage.getItem('eContractUserId');

            console.log('=== DEBUG: ContractApproval handleApprove ===');
            console.log('API URL:', apiUrl);
            console.log('Token exists:', !!token);
            console.log('Token (first 20 chars):', token?.substring(0, 20));
            console.log('User ID:', userId);
            console.log('Document ID:', documentId);
            console.log('Category:', category);

            if (!token || !userId) {
                console.error('Missing auth info - Token:', !!token, 'UserId:', !!userId);
                throw new Error('Thiếu thông tin xác thực');
            }

            // Step 1: Approve contract
            updateProgressStep('approve', 'in_progress');
            console.log('Step 1: Calling approve API...');

            const approveRequestBody = {
                ApproveBy: userId,
            };
            console.log('Approve request body:', JSON.stringify(approveRequestBody, null, 2));

            const approveResponse = await fetch(`${apiUrl}/contracts/documents/${documentId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(approveRequestBody),
            });

            console.log('Approve response status:', approveResponse.status);
            console.log('Approve response ok:', approveResponse.ok);

            if (!approveResponse.ok) {
                const errorData = await approveResponse.text();
                console.error('Approve failed:', errorData);
                throw new Error('Xét duyệt hợp đồng thất bại: ' + errorData);
            }

            const approveData = await approveResponse.json();
            console.log('Approve success:', approveData);

            updateProgressStep('approve', 'success', 'Xét duyệt hợp đồng thành công');

            // Step 2: Import data based on category
            updateProgressStep('import', 'in_progress');
            console.log('Step 2: Determining import endpoint...');

            let importEndpoint = '';
            let importLabel = '';

            if (category === 'guard_labor_contract') {
                importEndpoint = `${apiUrl}/contracts/working/import`;
                importLabel = 'Tạo mới thông tin bảo vệ';
            } else if (category === 'manager_labor_contract') {
                importEndpoint = `${apiUrl}/contracts/manager-working/import`;
                importLabel = 'Tạo mới thông tin quản lý';
            } else if (category === 'guard_service_contract') {
                importEndpoint = `${apiUrl}/contracts/import-from-document`;
                importLabel = 'Tạo mới thông tin đối tác';
            } else {
                console.error('Invalid category:', category);
                throw new Error('Loại hợp đồng không hợp lệ');
            }

            console.log('Import endpoint:', importEndpoint);
            console.log('Import label:', importLabel);

            const importRequestBody = {
                documentId: documentId,
            };
            console.log('Import request body:', JSON.stringify(importRequestBody, null, 2));

            const importResponse = await fetch(importEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(importRequestBody),
            });

            console.log('Import response status:', importResponse.status);
            console.log('Import response ok:', importResponse.ok);

            if (!importResponse.ok) {
                const errorData = await importResponse.text();
                console.error('Import failed:', errorData);
                throw new Error(importLabel + ' thất bại: ' + errorData);
            }

            const importData = await importResponse.json();
            console.log('Import success:', importData);

            updateProgressStep('import', 'success', importLabel + ' thành công');

            // Show success message
            console.log('All steps completed successfully!');
            setShowSuccess(true);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
            console.error('=== ERROR in handleApprove ===');
            console.error('Error:', errorMessage);
            console.error('Error object:', err);

            // Update the failed step
            progressSteps.forEach(step => {
                if (step.status === 'in_progress') {
                    updateProgressStep(step.id, 'error', errorMessage);
                }
            });

            setError(errorMessage);
            setIsProcessing(false);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
        navigate('/e-contracts/list');
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

    const handleBackToList = () => {
        navigate('/e-contracts/list');
    };

    const getCategoryLabel = (cat?: string) => {
        const labels: { [key: string]: string } = {
            'guard_labor_contract': 'Hợp đồng lao động bảo vệ',
            'manager_labor_contract': 'Hợp đồng lao động quản lý',
            'guard_service_contract': 'Hợp đồng dịch vụ bảo vệ',
        };
        return cat ? labels[cat] || cat : 'Không xác định';
    };

    if (isLoading) {
        return (
            <div className="ca-loading-container">
                <div className="ca-loading-spinner"></div>
                <div className="ca-loading-text">Đang tải hợp đồng...</div>
            </div>
        );
    }

    if (error && !isProcessing) {
        return (
            <div className="ca-error-container">
                <div className="ca-error-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <div className="ca-error-title">Có lỗi xảy ra</div>
                <div className="ca-error-message">{error}</div>
                <button className="ca-error-btn" onClick={handleBackToList}>
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="ca-container">
            <aside className={`ca-sidebar ${isMenuOpen ? 'ca-sidebar-open' : 'ca-sidebar-closed'}`}>
                <div className="ca-sidebar-header">
                    <div className="ca-sidebar-logo">
                        <div className="ca-logo-icon">E</div>
                        {isMenuOpen && <span className="ca-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="ca-sidebar-nav">
                    <ul className="ca-nav-list">
                        <li className="ca-nav-item">
                            <a href="/e-contracts/dashboard" className="ca-nav-link">
                                <svg className="ca-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="ca-nav-item ca-nav-active">
                            <a href="/e-contracts/list" className="ca-nav-link">
                                <svg className="ca-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                        <li className="ca-nav-item">
                            <a href="#" className="ca-nav-link">
                                <svg className="ca-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`ca-main-content ${isMenuOpen ? 'ca-content-expanded' : 'ca-content-collapsed'}`}>
                <header className="ca-nav-header">
                    <div className="ca-nav-left">
                        <button className="ca-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="ca-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="ca-nav-right">
                        <button className="ca-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="ca-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="ca-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="ca-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="ca-user-info">
                                <span className="ca-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="ca-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="ca-profile-dropdown">
                                    <div
                                        className={`ca-dropdown-item ca-logout-item ${isLoggingOut ? 'ca-disabled' : ''}`}
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
                                        <svg className="ca-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="ca-main">
                    <div className="ca-page-header">
                        <div>
                            <h1 className="ca-page-title">Xét duyệt hợp đồng</h1>
                            {contractData && (
                                <p className="ca-page-subtitle">{contractData.fileName}</p>
                            )}
                        </div>
                        <button className="ca-back-btn" onClick={handleBackToList}>
                            Quay lại danh sách
                        </button>
                    </div>

                    <div className="ca-content-wrapper">
                        {/* Left Column - Contract Display */}
                        <div className="ca-left-column">
                            <div className="ca-document-section">
                                <h2 className="ca-section-title">Nội dung hợp đồng</h2>
                                <div className="ca-document-container">
                                    {documentUrl && contractData ? (
                                        <iframe
                                            src={
                                                contractData.contentType === 'application/pdf'
                                                    ? documentUrl
                                                    : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`
                                            }
                                            className="ca-document-viewer"
                                            title="Contract Document"
                                        />
                                    ) : (
                                        <div className="ca-no-document">
                                            <p>Không thể hiển thị nội dung hợp đồng</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Contract Info and Approval */}
                        <div className="ca-right-column">
                            <div className="ca-info-section">
                                <h2 className="ca-section-title">Thông tin hợp đồng</h2>
                                {contractData && (
                                    <div className="ca-info-card">
                                        <div className="ca-info-item">
                                            <span className="ca-info-label">Tên file:</span>
                                            <span className="ca-info-value">{contractData.fileName}</span>
                                        </div>
                                        <div className="ca-info-item">
                                            <span className="ca-info-label">Loại hợp đồng:</span>
                                            <span className="ca-info-value">{getCategoryLabel(category)}</span>
                                        </div>
                                        <div className="ca-info-item">
                                            <span className="ca-info-label">Loại file:</span>
                                            <span className="ca-info-value">
                                                {contractData.contentType.includes('pdf') ? 'PDF' : 'Word Document'}
                                            </span>
                                        </div>
                                        <div className="ca-info-item">
                                            <span className="ca-info-label">Ngày khởi tạo:</span>
                                            <span className="ca-info-value">
                                                {new Date(contractData.createdAt).toLocaleString("vi-VN", {
                                                    timeZone: "Asia/Ho_Chi_Minh"
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="ca-approval-section">
                                <div className="ca-confirmation-box">
                                    <label className="ca-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isConfirmed}
                                            onChange={(e) => setIsConfirmed(e.target.checked)}
                                            disabled={isProcessing}
                                            className="ca-checkbox"
                                        />
                                        <span>Tôi đã kiểm tra và xác nhận thông tin trên hợp đồng là đúng</span>
                                    </label>
                                </div>

                                <button
                                    className="ca-approve-btn"
                                    onClick={handleApprove}
                                    disabled={!isConfirmed || isProcessing}
                                >
                                    {isProcessing ? 'Đang xử lý...' : 'Xét duyệt hợp đồng và tạo mới thông tin'}
                                </button>

                                {isProcessing && (
                                    <div className="ca-progress-section">
                                        <h3 className="ca-progress-title">Tiến trình xử lý</h3>
                                        <div className="ca-progress-list">
                                            {progressSteps.map(step => (
                                                <div key={step.id} className={`ca-progress-item ca-progress-${step.status}`}>
                                                    <div className="ca-progress-icon">
                                                        {step.status === 'pending' && (
                                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                                                            </svg>
                                                        )}
                                                        {step.status === 'in_progress' && (
                                                            <div className="ca-spinner"></div>
                                                        )}
                                                        {step.status === 'success' && (
                                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                            </svg>
                                                        )}
                                                        {step.status === 'error' && (
                                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="ca-progress-content">
                                                        <div className="ca-progress-label">{step.label}</div>
                                                        {step.message && (
                                                            <div className="ca-progress-message">{step.message}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showLogoutModal && (
                <div className="ca-modal-overlay" onClick={cancelLogout}>
                    <div className="ca-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ca-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="ca-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="ca-modal-footer">
                            <button className="ca-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="ca-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccess && (
                <div className="ca-snackbar-overlay">
                    <div className="ca-snackbar ca-snackbar-success">
                        <div className="ca-snackbar-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div className="ca-snackbar-content">
                            <div className="ca-snackbar-title">Thành công!</div>
                            <div className="ca-snackbar-message">Hợp đồng đã được xét duyệt và tạo mới thông tin thành công.</div>
                        </div>
                        <button className="ca-snackbar-close" onClick={handleCloseSuccess}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractApproval;
