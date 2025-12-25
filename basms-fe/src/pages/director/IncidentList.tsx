import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
            // Refresh incidents list
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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
        <div className="dir-incidents-container">
            {/* Sidebar */}
            <aside className={`dir-incidents-sidebar ${isSidebarOpen ? 'dir-incidents-sidebar-open' : 'dir-incidents-sidebar-closed'}`}>
                <div className="dir-incidents-sidebar-header">
                    <div className="dir-incidents-sidebar-logo">
                        <div className="dir-incidents-logo-icon">B</div>
                        {isSidebarOpen && <span className="dir-incidents-logo-text">BASMS</span>}
                    </div>
                </div>
                <nav className="dir-incidents-sidebar-nav">
                    <ul className="dir-incidents-nav-list">
                        <li className="dir-incidents-nav-item">
                            <a href="/director/dashboard" className="dir-incidents-nav-link">
                                <span className="dir-incidents-nav-icon">📊</span>
                                {isSidebarOpen && <span>Dashboard</span>}
                            </a>
                        </li>
                        <li className="dir-incidents-nav-item">
                            <a href="/director/customer-list" className="dir-incidents-nav-link">
                                <span className="dir-incidents-nav-icon">👥</span>
                                {isSidebarOpen && <span>Khách hàng</span>}
                            </a>
                        </li>
                        <li className="dir-incidents-nav-item">
                            <a href="/director/employee-control" className="dir-incidents-nav-link">
                                <span className="dir-incidents-nav-icon">👮</span>
                                {isSidebarOpen && <span>Nhân viên</span>}
                            </a>
                        </li>
                        <li className="dir-incidents-nav-item dir-incidents-nav-active">
                            <a href="/director/incidents" className="dir-incidents-nav-link">
                                <span className="dir-incidents-nav-icon">🚨</span>
                                {isSidebarOpen && <span>Sự cố</span>}
                            </a>
                        </li>
                        <li className="dir-incidents-nav-item">
                            <a href="/director/chat" className="dir-incidents-nav-link">
                                <span className="dir-incidents-nav-icon">💬</span>
                                {isSidebarOpen && <span>Tin nhắn</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={`dir-incidents-main ${isSidebarOpen ? 'dir-incidents-main-sidebar-open' : 'dir-incidents-main-sidebar-closed'}`}>
                {/* Header */}
                <header className="dir-incidents-header">
                    <div className="dir-incidents-header-left">
                        <button className="dir-incidents-menu-btn" onClick={toggleSidebar}>
                            ☰
                        </button>
                        <h1 className="dir-incidents-title">Danh sách sự cố</h1>
                    </div>
                    <div className="dir-incidents-header-right">
                        <div className="dir-incidents-user-info">
                            <div className="dir-incidents-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <span className="dir-incidents-user-name">{user?.fullName || 'Director'}</span>
                            <button className="dir-incidents-logout-btn" onClick={() => setShowLogoutModal(true)}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="dir-incidents-content">
                    {loading ? (
                        <div className="dir-incidents-loading">Đang tải dữ liệu...</div>
                    ) : error ? (
                        <div className="dir-incidents-error">Lỗi: {error}</div>
                    ) : incidents.length === 0 ? (
                        <div className="dir-incidents-empty">Không có sự cố nào</div>
                    ) : (
                        <>
                            {/* Incidents List */}
                            <div className="dir-incidents-list">
                                {currentIncidents.map((incident) => (
                                    <div key={incident.id} className="dir-incident-item">
                                        <div className="dir-incident-info">
                                            <div className="dir-incident-header">
                                                <h3 className="dir-incident-title">{incident.title}</h3>
                                                <span className="dir-incident-code">{incident.incidentCode}</span>
                                            </div>
                                            <div className="dir-incident-details">
                                                <div className="dir-incident-detail-item">
                                                    <span className="dir-incident-label">Loại sự cố:</span>
                                                    <span className="dir-incident-value">{getIncidentTypeLabel(incident.incidentType)}</span>
                                                </div>
                                                <div className="dir-incident-detail-item">
                                                    <span className="dir-incident-label">Mức độ:</span>
                                                    <span
                                                        className="dir-incident-severity"
                                                        style={{ backgroundColor: getSeverityColor(incident.severity) }}
                                                    >
                                                        {getSeverityLabel(incident.severity)}
                                                    </span>
                                                </div>
                                                <div className="dir-incident-detail-item">
                                                    <span className="dir-incident-label">Trạng thái:</span>
                                                    <span className="dir-incident-status">{getStatusLabel(incident.status)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="dir-incident-actions">
                                            <button
                                                className="dir-incident-btn dir-incident-btn-detail"
                                                onClick={() => handleViewDetail(incident.id)}
                                            >
                                                Xem chi tiết
                                            </button>
                                            <button
                                                className="dir-incident-btn dir-incident-btn-response"
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
                                <div className="dir-incidents-pagination">
                                    <button
                                        className="dir-incidents-page-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        « Trước
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            className={`dir-incidents-page-btn ${currentPage === page ? 'dir-incidents-page-btn-active' : ''}`}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        className="dir-incidents-page-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Sau »
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="dir-incident-modal-overlay" onClick={handleCloseDetailModal}>
                    <div className="dir-incident-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dir-incident-modal-header">
                            <h2>Chi tiết sự cố</h2>
                            <button className="dir-incident-modal-close" onClick={handleCloseDetailModal}>×</button>
                        </div>
                        <div className="dir-incident-modal-body">
                            {loadingDetail ? (
                                <div className="dir-incident-modal-loading">Đang tải...</div>
                            ) : selectedIncident ? (
                                <div className="dir-incident-detail">
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Mã sự cố:</span>
                                        <span className="dir-incident-detail-value">{selectedIncident.incidentCode}</span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Tiêu đề:</span>
                                        <span className="dir-incident-detail-value">{selectedIncident.title}</span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Mô tả:</span>
                                        <span className="dir-incident-detail-value">{selectedIncident.description}</span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Loại sự cố:</span>
                                        <span className="dir-incident-detail-value">{getIncidentTypeLabel(selectedIncident.incidentType)}</span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Mức độ:</span>
                                        <span
                                            className="dir-incident-severity"
                                            style={{ backgroundColor: getSeverityColor(selectedIncident.severity) }}
                                        >
                                            {getSeverityLabel(selectedIncident.severity)}
                                        </span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Thời gian xảy ra:</span>
                                        <span className="dir-incident-detail-value">
                                            {new Date(selectedIncident.incidentTime).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Địa điểm:</span>
                                        <span className="dir-incident-detail-value">{selectedIncident.location}</span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Ca làm việc:</span>
                                        <span className="dir-incident-detail-value">{selectedIncident.shiftLocation || 'N/A'}</span>
                                    </div>
                                    <div className="dir-incident-detail-row">
                                        <span className="dir-incident-detail-label">Trạng thái:</span>
                                        <span className="dir-incident-detail-value">{getStatusLabel(selectedIncident.status)}</span>
                                    </div>
                                    {selectedIncident.responseContent && (
                                        <div className="dir-incident-detail-row">
                                            <span className="dir-incident-detail-label">Nội dung phản hồi:</span>
                                            <span className="dir-incident-detail-value">{selectedIncident.responseContent}</span>
                                        </div>
                                    )}
                                    {selectedIncident.respondedAt && (
                                        <div className="dir-incident-detail-row">
                                            <span className="dir-incident-detail-label">Thời gian phản hồi:</span>
                                            <span className="dir-incident-detail-value">
                                                {new Date(selectedIncident.respondedAt).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                    )}
                                    {selectedIncident.mediaFiles && selectedIncident.mediaFiles.length > 0 && (
                                        <div className="dir-incident-detail-row dir-incident-media-section">
                                            <span className="dir-incident-detail-label">Hình ảnh:</span>
                                            <div className="dir-incident-media-gallery">
                                                {selectedIncident.mediaFiles.map((media) => (
                                                    <div key={media.id} className="dir-incident-media-item">
                                                        {media.mediaType === 'IMAGE' && (
                                                            <img
                                                                src={media.presignedUrl}
                                                                alt={media.caption || media.fileName}
                                                                className="dir-incident-media-image"
                                                            />
                                                        )}
                                                        {media.caption && (
                                                            <p className="dir-incident-media-caption">{media.caption}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="dir-incident-modal-error">Không thể tải thông tin chi tiết</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Response Modal */}
            {showResponseModal && (
                <div className="dir-incident-modal-overlay" onClick={handleCloseResponseModal}>
                    <div className="dir-incident-modal-content dir-incident-response-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dir-incident-modal-header">
                            <h2>Phản hồi sự cố</h2>
                            <button className="dir-incident-modal-close" onClick={handleCloseResponseModal}>×</button>
                        </div>
                        <div className="dir-incident-modal-body">
                            <div className="dir-incident-response-form">
                                <label className="dir-incident-form-label">Nội dung phản hồi:</label>
                                <textarea
                                    className="dir-incident-form-textarea"
                                    value={responseContent}
                                    onChange={(e) => setResponseContent(e.target.value)}
                                    placeholder="Nhập nội dung phản hồi..."
                                    rows={6}
                                />
                                {responseError && (
                                    <div className="dir-incident-form-error">{responseError}</div>
                                )}
                                <button
                                    className="dir-incident-form-submit"
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
                <div className="dir-incident-modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div className="dir-incident-modal-content dir-incident-logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dir-incident-modal-header">
                            <h2>Xác nhận đăng xuất</h2>
                            <button className="dir-incident-modal-close" onClick={() => setShowLogoutModal(false)}>×</button>
                        </div>
                        <div className="dir-incident-modal-body">
                            <p>Bạn có chắc chắn muốn đăng xuất?</p>
                            <div className="dir-incident-logout-actions">
                                <button className="dir-incident-btn-cancel" onClick={() => setShowLogoutModal(false)}>
                                    Hủy
                                </button>
                                <button className="dir-incident-btn-confirm" onClick={handleLogout}>
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar */}
            {showSnackbar && (
                <div className={`dir-incident-snackbar dir-incident-snackbar-${snackbarType}`}>
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
};

export default IncidentList;
