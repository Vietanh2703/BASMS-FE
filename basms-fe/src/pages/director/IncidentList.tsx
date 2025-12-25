import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './IncidentList.css';

interface MediaFile {
    id: string;
    mediaType: string;
    fileUrl: string;
    presignedUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    caption: string;
    displayOrder: number;
    uploadedBy: string;
    createdAt: string;
}

interface Incident {
    id: string;
    incidentCode: string;
    title: string;
    description: string;
    incidentType: string;
    severity: string;
    incidentTime: string;
    location: string;
    shiftLocation: string;
    shiftId: string | null;
    shiftAssignmentId: string | null;
    reporterId: string;
    reportedTime: string;
    status: string;
    responseContent: string | null;
    responderId: string | null;
    respondedAt: string | null;
    mediaFiles: MediaFile[];
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string | null;
}

interface IncidentListResponse {
    success: boolean;
    data: Incident[];
}

interface IncidentDetailResponse {
    success: boolean;
    data: Incident;
}

const IncidentList: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Detail modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Response modal states
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseContent, setResponseContent] = useState('');
    const [respondingIncidentId, setRespondingIncidentId] = useState<string | null>(null);
    const [isResponding, setIsResponding] = useState(false);
    const [responseError, setResponseError] = useState<string | null>(null);

    // Snackbar states
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    // Logout modal state
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        fetchIncidents();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileDropdownOpen]);

    const fetchIncidents = async () => {
        try {
            setLoading(true);
            setError(null);
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`${apiUrl}/incidents/get-all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch incidents');
            }

            const data: IncidentListResponse = await response.json();
            if (data.success) {
                setIncidents(data.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            showSnackbarMessage('Không thể tải danh sách sự cố', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchIncidentDetail = async (incidentId: string) => {
        try {
            setLoadingDetail(true);
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`${apiUrl}/incidents/${incidentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch incident detail');
            }

            const data: IncidentDetailResponse = await response.json();
            if (data.success) {
                setSelectedIncident(data.data);
            }
        } catch (err) {
            showSnackbarMessage('Không thể tải chi tiết sự cố', 'error');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleViewDetail = async (incidentId: string) => {
        setShowDetailModal(true);
        await fetchIncidentDetail(incidentId);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedIncident(null);
    };

    const handleOpenResponseModal = (incidentId: string) => {
        setRespondingIncidentId(incidentId);
        setResponseContent('');
        setResponseError(null);
        setShowResponseModal(true);
    };

    const handleCloseResponseModal = () => {
        setShowResponseModal(false);
        setRespondingIncidentId(null);
        setResponseContent('');
        setResponseError(null);
    };

    const handleSubmitResponse = async () => {
        if (!responseContent.trim()) {
            setResponseError('Vui lòng nhập nội dung phản hồi');
            return;
        }

        if (!user?.userId) {
            setResponseError('Không tìm thấy thông tin người dùng');
            return;
        }

        try {
            setIsResponding(true);
            setResponseError(null);
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            const requestBody = {
                incidentId: respondingIncidentId,
                responderId: user.userId,
                responseContent: responseContent.trim(),
            };

            const response = await fetch(`${apiUrl}/incidents/response`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('Failed to submit response');
            }

            showSnackbarMessage('Phản hồi sự cố thành công', 'success');
            handleCloseResponseModal();
            await fetchIncidents();
        } catch (err) {
            setResponseError('Không thể gửi phản hồi. Vui lòng thử lại.');
            showSnackbarMessage('Gửi phản hồi thất bại', 'error');
        } finally {
            setIsResponding(false);
        }
    };

    const showSnackbarMessage = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
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
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const formatDateTime = (date: Date): string => {
        const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${days[date.getDay()]}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'LOW':
                return '#10b981';
            case 'MEDIUM':
                return '#f59e0b';
            case 'HIGH':
                return '#ef4444';
            case 'CRITICAL':
                return '#dc2626';
            default:
                return '#6b7280';
        }
    };

    const getIncidentTypeLabel = (type: string): string => {
        const types: { [key: string]: string } = {
            'THEFT': 'Trộm cắp',
            'VANDALISM': 'Phá hoại',
            'TRESPASSING': 'Xâm nhập',
            'FIRE': 'Hỏa hoạn',
            'MEDICAL': 'Y tế',
            'VIOLENCE': 'Bạo lực',
            'OTHER': 'Khác',
        };
        return types[type] || type;
    };

    const getSeverityLabel = (severity: string): string => {
        const severities: { [key: string]: string } = {
            'LOW': 'Thấp',
            'MEDIUM': 'Trung bình',
            'HIGH': 'Cao',
            'CRITICAL': 'Nghiêm trọng',
        };
        return severities[severity] || severity;
    };

    const getStatusLabel = (status: string): string => {
        const statuses: { [key: string]: string } = {
            'PENDING': 'Chờ xử lý',
            'RESPONDED': 'Đã phản hồi',
            'RESOLVED': 'Đã giải quyết',
        };
        return statuses[status] || status;
    };

    // Pagination
    const totalPages = Math.ceil(incidents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentIncidents = incidents.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="il-container">
            {/* Sidebar */}
            <aside className={`il-sidebar ${isMenuOpen ? 'il-sidebar-open' : 'il-sidebar-closed'}`}>
                <div className="il-sidebar-header">
                    <div className="il-sidebar-logo">
                        <div className="il-logo-icon">D</div>
                        {isMenuOpen && <span className="il-logo-text">Director</span>}
                    </div>
                </div>
                <nav className="il-sidebar-nav">
                    <ul className="il-nav-list">
                        <li className="il-nav-item">
                            <Link to="/director/dashboard" className="il-nav-link">
                                <svg className="il-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="il-nav-item">
                            <Link to="/director/customer-list" className="il-nav-link">
                                <svg className="il-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="il-nav-item">
                            <Link to="/director/employee-control" className="il-nav-link">
                                <svg className="il-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                {isMenuOpen && <span>Quản lý nhân sự</span>}
                            </Link>
                        </li>
                        <li className="il-nav-item">
                            <Link to="/director/analytics" className="il-nav-link">
                                <svg className="il-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="il-nav-item il-nav-active">
                            <Link to="/director/incidents" className="il-nav-link">
                                <svg className="il-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z"/>
                                </svg>
                                {isMenuOpen && <span>Sự cố</span>}
                            </Link>
                        </li>
                        <li className="il-nav-item">
                            <Link to="/director/chat" className="il-nav-link">
                                <svg className="il-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                </svg>
                                {isMenuOpen && <span>Trò chuyện</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`il-main-content ${isMenuOpen ? 'il-content-expanded' : 'il-content-collapsed'}`}>
                <header className="il-header">
                    <div className="il-header-left">
                        <button className="il-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="il-datetime">{formatDateTime(currentTime)}</div>
                    </div>
                    <div className="il-header-right">
                        <button className="il-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="il-notification-badge">5</span>
                        </button>
                        <div ref={profileRef} className="il-user-profile" onClick={toggleProfileDropdown}>
                            <div className="il-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="il-user-info">
                                <span className="il-user-name">{user?.fullName || 'Director'}</span>
                                <span className="il-user-role">Giám đốc điều hành</span>
                            </div>
                            {isProfileDropdownOpen && (
                                <div className="il-profile-dropdown">
                                    <div
                                        className={`il-dropdown-item il-logout-item ${isLoggingOut ? 'il-disabled' : ''}`}
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
                                        <svg className="il-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="il-main">
                    {loading ? (
                        <div className="il-loading">Đang tải dữ liệu...</div>
                    ) : error ? (
                        <div className="il-error">Lỗi: {error}</div>
                    ) : incidents.length === 0 ? (
                        <div className="il-empty">Không có sự cố nào</div>
                    ) : (
                        <>
                            {/* Page Header */}
                            <div className="il-page-header">
                                <h2 className="il-section-title">Danh sách sự cố</h2>
                                <p className="il-section-subtitle">Tổng số: {incidents.length} sự cố</p>
                            </div>

                            {/* Incidents List */}
                            <div className="il-incidents-list">
                                {currentIncidents.map((incident) => (
                                    <div key={incident.id} className="il-incident-item">
                                        <div className="il-incident-info">
                                            <div className="il-incident-header">
                                                <h3 className="il-incident-title">{incident.title}</h3>
                                                <span className="il-incident-code">{incident.incidentCode}</span>
                                            </div>
                                            <div className="il-incident-details">
                                                <div className="il-incident-detail-item">
                                                    <span className="il-incident-label">Loại sự cố:</span>
                                                    <span className="il-incident-value">{getIncidentTypeLabel(incident.incidentType)}</span>
                                                </div>
                                                <div className="il-incident-detail-item">
                                                    <span className="il-incident-label">Mức độ:</span>
                                                    <span
                                                        className="il-incident-severity"
                                                        style={{ backgroundColor: getSeverityColor(incident.severity) }}
                                                    >
                                                        {getSeverityLabel(incident.severity)}
                                                    </span>
                                                </div>
                                                <div className="il-incident-detail-item">
                                                    <span className="il-incident-label">Trạng thái:</span>
                                                    <span className="il-incident-status">{getStatusLabel(incident.status)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="il-incident-actions">
                                            <button
                                                className="il-incident-btn il-incident-btn-detail"
                                                onClick={() => handleViewDetail(incident.id)}
                                            >
                                                Xem chi tiết
                                            </button>
                                            <button
                                                className="il-incident-btn il-incident-btn-response"
                                                onClick={() => handleOpenResponseModal(incident.id)}
                                                disabled={incident.status === 'RESPONDED' || incident.status === 'RESOLVED'}
                                            >
                                                Phản hồi
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="il-pagination">
                                    <button
                                        className="il-page-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        « Trước
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            className={`il-page-btn ${currentPage === page ? 'il-page-btn-active' : ''}`}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        className="il-page-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Sau »
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="il-modal-overlay" onClick={handleCloseDetailModal}>
                    <div className="il-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="il-modal-header">
                            <h2>Chi tiết sự cố</h2>
                            <button className="il-modal-close" onClick={handleCloseDetailModal}>×</button>
                        </div>
                        <div className="il-modal-body">
                            {loadingDetail ? (
                                <div className="il-modal-loading">Đang tải...</div>
                            ) : selectedIncident ? (
                                <div className="il-detail">
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Mã sự cố:</span>
                                        <span className="il-detail-value">{selectedIncident.incidentCode}</span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Tiêu đề:</span>
                                        <span className="il-detail-value">{selectedIncident.title}</span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Mô tả:</span>
                                        <span className="il-detail-value">{selectedIncident.description}</span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Loại sự cố:</span>
                                        <span className="il-detail-value">{getIncidentTypeLabel(selectedIncident.incidentType)}</span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Mức độ:</span>
                                        <span
                                            className="il-incident-severity"
                                            style={{ backgroundColor: getSeverityColor(selectedIncident.severity) }}
                                        >
                                            {getSeverityLabel(selectedIncident.severity)}
                                        </span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Thời gian xảy ra:</span>
                                        <span className="il-detail-value">
                                            {new Date(selectedIncident.incidentTime).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Địa điểm:</span>
                                        <span className="il-detail-value">{selectedIncident.location}</span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Ca làm việc:</span>
                                        <span className="il-detail-value">{selectedIncident.shiftLocation || 'N/A'}</span>
                                    </div>
                                    <div className="il-detail-row">
                                        <span className="il-detail-label">Trạng thái:</span>
                                        <span className="il-detail-value">{getStatusLabel(selectedIncident.status)}</span>
                                    </div>
                                    {selectedIncident.responseContent && (
                                        <div className="il-detail-row">
                                            <span className="il-detail-label">Nội dung phản hồi:</span>
                                            <span className="il-detail-value">{selectedIncident.responseContent}</span>
                                        </div>
                                    )}
                                    {selectedIncident.respondedAt && (
                                        <div className="il-detail-row">
                                            <span className="il-detail-label">Thời gian phản hồi:</span>
                                            <span className="il-detail-value">
                                                {new Date(selectedIncident.respondedAt).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                    )}
                                    {selectedIncident.mediaFiles && selectedIncident.mediaFiles.length > 0 && (
                                        <div className="il-detail-row il-media-section">
                                            <span className="il-detail-label">Hình ảnh:</span>
                                            <div className="il-media-gallery">
                                                {selectedIncident.mediaFiles.map((media) => (
                                                    <div key={media.id} className="il-media-item">
                                                        {media.mediaType === 'IMAGE' && (
                                                            <img
                                                                src={media.presignedUrl}
                                                                alt={media.caption || media.fileName}
                                                                className="il-media-image"
                                                            />
                                                        )}
                                                        {media.caption && (
                                                            <p className="il-media-caption">{media.caption}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="il-modal-error">Không thể tải thông tin chi tiết</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Response Modal */}
            {showResponseModal && (
                <div className="il-modal-overlay" onClick={handleCloseResponseModal}>
                    <div className="il-modal-content il-response-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="il-modal-header">
                            <h2>Phản hồi sự cố</h2>
                            <button className="il-modal-close" onClick={handleCloseResponseModal}>×</button>
                        </div>
                        <div className="il-modal-body">
                            <div className="il-response-form">
                                <label className="il-form-label">Nội dung phản hồi:</label>
                                <textarea
                                    className="il-form-textarea"
                                    value={responseContent}
                                    onChange={(e) => setResponseContent(e.target.value)}
                                    placeholder="Nhập nội dung phản hồi..."
                                    rows={6}
                                />
                                {responseError && (
                                    <div className="il-form-error">{responseError}</div>
                                )}
                                <button
                                    className="il-form-submit"
                                    onClick={handleSubmitResponse}
                                    disabled={isResponding}
                                >
                                    {isResponding ? 'Đang gửi...' : 'Xác nhận'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="il-modal-overlay" onClick={cancelLogout}>
                    <div className="il-modal-content il-logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="il-modal-header">
                            <h2>Xác nhận đăng xuất</h2>
                            <button className="il-modal-close" onClick={cancelLogout}>×</button>
                        </div>
                        <div className="il-modal-body">
                            <p>Bạn có chắc chắn muốn đăng xuất?</p>
                            <div className="il-logout-actions">
                                <button className="il-btn-cancel" onClick={cancelLogout}>
                                    Hủy
                                </button>
                                <button className="il-btn-confirm" onClick={confirmLogout}>
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar */}
            {showSnackbar && (
                <div className={`il-snackbar il-snackbar-${snackbarType}`}>
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
};

export default IncidentList;
