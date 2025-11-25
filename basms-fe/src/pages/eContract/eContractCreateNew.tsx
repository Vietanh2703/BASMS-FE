import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './eContractCreateNew.css';

interface ContractTemplate {
    id: string;
    name: string;
    type: string;
    createdAt: string;
    description: string;
}

interface Document {
    id: string;
    documentType: string;
    documentName: string;
    fileUrl: string;
    createdAt: string;
    templateType?: string;
}

interface ContractResponse {
    success: boolean;
    errorMessage: string | null;
    documents: Document[];
    totalCount: number;
}

const EContractCreateNew = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    // Upload modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [templateName, setTemplateName] = useState('');
    const [templateType, setTemplateType] = useState('labor');

    // Templates from API
    const [allTemplates, setAllTemplates] = useState<ContractTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [templatesError, setTemplatesError] = useState<string | null>(null);

    const templateTypes = [
        { value: 'all', label: 'Tất cả loại' },
        { value: 'labor', label: 'Hợp đồng lao động' },
        { value: 'service', label: 'Hợp đồng dịch vụ' },
        { value: 'training', label: 'Hợp đồng đào tạo' },
    ];

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

    // Fetch templates from API
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoadingTemplates(true);
            setTemplatesError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
                const token = localStorage.getItem('eContractAccessToken');

                if (!token) {
                    navigate('/e-contract/login');
                    return;
                }

                const response = await fetch(`${apiUrl}/contracts/documents`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch templates');
                }

                const data: ContractResponse = await response.json();

                // Filter only templates
                const templateDocuments = data.documents.filter(doc => doc.documentType === 'template');

                // Map to ContractTemplate interface
                const mappedTemplates: ContractTemplate[] = templateDocuments.map(doc => {
                    // Extract type from templateType field or default to 'service'
                    let type = doc.templateType || 'service';

                    // Map type if it doesn't match our expected values
                    if (!['labor', 'service', 'training'].includes(type)) {
                        type = 'service';
                    }

                    return {
                        id: doc.id,
                        name: doc.documentName,
                        type: type,
                        createdAt: doc.createdAt,
                        description: `Mẫu hợp đồng ${doc.documentName}`,
                    };
                });

                setAllTemplates(mappedTemplates);
            } catch (err) {
                console.error('Error fetching templates:', err);
                setTemplatesError('Không thể tải danh sách mẫu hợp đồng. Vui lòng thử lại sau.');
            } finally {
                setIsLoadingTemplates(false);
            }
        };

        fetchTemplates();
    }, [navigate]);

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


    // Filter templates
    const filteredTemplates = allTemplates.filter(template => {
        // Search filter
        if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) && !template.id.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Type filter
        if (selectedType !== 'all' && template.type !== selectedType) {
            return false;
        }

        return true;
    });

    const handleCreateFromTemplate = (templateId: string) => {
        // Find template details
        const template = allTemplates.find(t => t.id === templateId);
        if (!template) {
            alert('Không tìm thấy thông tin mẫu hợp đồng');
            return;
        }

        // Navigate to template editor page
        navigate(`/e-contracts/template-editor?template=${templateId}`);
    };


    // Upload modal handlers
    const handleOpenUploadModal = () => {
        setShowUploadModal(true);
        setSelectedFile(null);
        setFileError(null);
        setTemplateName('');
        setTemplateType('labor');
    };

    const handleCloseUploadModal = () => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setFileError(null);
        setTemplateName('');
        setTemplateType('labor');
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset error
        setFileError(null);

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            setFileError('Kích thước file vượt quá 10MB. Vui lòng chọn file nhỏ hơn.');
            setSelectedFile(null);
            return;
        }

        // Validate file type (PDF or Word)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(file.type)) {
            setFileError('Định dạng file không hợp lệ. Chỉ chấp nhận file PDF hoặc Word.');
            setSelectedFile(null);
            return;
        }

        // File is valid
        setSelectedFile(file);
    };

    const handleUploadComplete = async () => {
        if (!selectedFile) return;

        // Validate template name
        if (!templateName.trim()) {
            setFileError('Vui lòng nhập tên hợp đồng mẫu');
            return;
        }

        setIsUploading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('eContractAccessToken');

            if (!token) {
                navigate('/e-contract/login');
                return;
            }

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('name', templateName.trim());
            formData.append('type', templateType);

            const response = await fetch(`${apiUrl}/contracts/templates/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            // Success
            setShowUploadModal(false);
            setSelectedFile(null);
            setFileError(null);
            setTemplateName('');
            setTemplateType('labor');
            setSnackbarMessage('Hợp đồng mẫu đã tải lên hệ thống thành công');
            setSnackbarType('success');
            setShowSnackbar(true);

            // Reload templates list
            window.location.reload();

            // Hide snackbar after 3 seconds
            setTimeout(() => {
                setShowSnackbar(false);
            }, 3000);
        } catch (error) {
            console.error('Upload error:', error);
            setSnackbarMessage('Không thể tải lên hợp đồng mẫu. Vui lòng thử lại sau.');
            setSnackbarType('error');
            setShowSnackbar(true);

            // Hide snackbar after 3 seconds
            setTimeout(() => {
                setShowSnackbar(false);
            }, 3000);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            // Simulate file input change
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            handleFileSelect({ target: fileInput } as any);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    return (
        <div className="ec-create-container">
            <aside className={`ec-create-sidebar ${isMenuOpen ? 'ec-create-sidebar-open' : 'ec-create-sidebar-closed'}`}>
                <div className="ec-create-sidebar-header">
                    <div className="ec-create-sidebar-logo">
                        <div className="ec-create-logo-icon">E</div>
                        {isMenuOpen && <span className="ec-create-logo-text">eContract</span>}
                    </div>
                </div>

                <nav className="ec-create-sidebar-nav">
                    <ul className="ec-create-nav-list">
                        <li className="ec-create-nav-item">
                            <a href="/e-contracts/dashboard" className="ec-create-nav-link">
                                <svg className="ec-create-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </a>
                        </li>
                        <li className="ec-create-nav-item ec-create-nav-active">
                            <a href="/e-contracts/list" className="ec-create-nav-link">
                                <svg className="ec-create-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {isMenuOpen && <span>Hợp đồng</span>}
                            </a>
                        </li>
                        <li className="ec-create-nav-item">
                            <a href="#" className="ec-create-nav-link">
                                <svg className="ec-create-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className={`ec-create-main-content ${isMenuOpen ? 'ec-create-content-expanded' : 'ec-create-content-collapsed'}`}>
                <header className="ec-create-nav-header">
                    <div className="ec-create-nav-left">
                        <button className="ec-create-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="ec-create-datetime-display">
                            {formatDateTime(currentTime)}
                        </div>
                    </div>

                    <div className="ec-create-nav-right">
                        <button className="ec-create-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="ec-create-notification-badge">2</span>
                        </button>

                        <div
                            ref={profileRef}
                            className="ec-create-user-profile"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="ec-create-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <div className="ec-create-user-info">
                                <span className="ec-create-user-name">
                                    {user?.fullName || user?.email?.split('@')[0] || 'eContract User'}
                                </span>
                                <span className="ec-create-user-role">Quản lý hợp đồng</span>
                            </div>

                            {isProfileDropdownOpen && (
                                <div className="ec-create-profile-dropdown">
                                    <div
                                        className={`ec-create-dropdown-item ec-create-logout-item ${isLoggingOut ? 'ec-create-disabled' : ''}`}
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
                                        <svg className="ec-create-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="ec-create-main">
                    <div className="ec-create-page-header">
                        <div>
                            <h1 className="ec-create-page-title">Tạo hợp đồng mới</h1>
                            <p className="ec-create-page-subtitle">Chọn mẫu hợp đồng để bắt đầu tạo</p>
                        </div>
                        <div className="ec-create-header-actions">
                            <button className="ec-create-upload-btn" onClick={handleOpenUploadModal}>
                                Tải lên hợp đồng mẫu
                            </button>
                            <button className="ec-create-back-btn" onClick={() => navigate('/e-contracts/list')}>
                                Quay lại danh sách
                            </button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="ec-create-filters-section">
                        <div className="ec-create-search-box">
                            <svg className="ec-create-search-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input
                                type="text"
                                className="ec-create-search-input"
                                placeholder="Tìm kiếm mẫu hợp đồng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="ec-create-filter-group">
                            <select
                                className="ec-create-filter-select"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                {templateTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoadingTemplates && (
                        <div className="ec-create-loading">
                            <div className="ec-create-loading-text">Đang tải danh sách mẫu hợp đồng...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {templatesError && !isLoadingTemplates && (
                        <div className="ec-create-error">
                            <div className="ec-create-error-text">{templatesError}</div>
                            <button
                                className="ec-create-retry-btn"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Results Info */}
                    {!isLoadingTemplates && !templatesError && (
                        <div className="ec-create-results-info">
                            Tìm thấy {filteredTemplates.length} mẫu hợp đồng
                        </div>
                    )}

                    {/* Template List */}
                    {!isLoadingTemplates && !templatesError && (
                        <div className="ec-create-template-list">
                            {filteredTemplates.length === 0 ? (
                                <div className="ec-create-empty">
                                    <div className="ec-create-empty-text">Không tìm thấy mẫu hợp đồng nào.</div>
                                </div>
                            ) : (
                                filteredTemplates.map(template => (
                                <div key={template.id} className="ec-create-template-item">
                                    <div className="ec-create-template-name">{template.name}</div>
                                    <div className="ec-create-template-description">{template.description}</div>
                                    <div className="ec-create-template-details">
                                        <div className="ec-create-template-detail">
                                            <span className="ec-create-detail-label">Ngày tạo:</span>
                                            <span className="ec-create-detail-value">
                                                {new Date(template.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ec-create-template-actions">
                                        <button
                                            className="ec-create-action-btn ec-create-btn-create"
                                            onClick={() => handleCreateFromTemplate(template.id)}
                                        >
                                            Tạo mới
                                        </button>
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    )}
                </main>
            </div>

            {showLogoutModal && (
                <div className="ec-create-modal-overlay" onClick={cancelLogout}>
                    <div className="ec-create-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ec-create-modal-header">
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className="ec-create-modal-body">
                            <p>Bạn có chắc muốn đăng xuất khỏi hệ thống eContract?</p>
                        </div>
                        <div className="ec-create-modal-footer">
                            <button className="ec-create-btn-cancel-modal" onClick={cancelLogout}>
                                Hủy
                            </button>
                            <button className="ec-create-btn-confirm-modal" onClick={confirmLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="ec-create-upload-overlay" onClick={handleCloseUploadModal}>
                    <div className="ec-create-upload-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ec-create-upload-header">
                            <h3>Tải lên hợp đồng mẫu</h3>
                            <button className="ec-create-close-btn" onClick={handleCloseUploadModal}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        <div className="ec-create-upload-body">
                            <div className="ec-create-upload-notice">
                                <h4>Lưu ý trước khi tải lên:</h4>
                                <ul>
                                    <li>Chỉ chấp nhận file định dạng PDF hoặc Word (.doc, .docx)</li>
                                    <li>Kích thước file tối đa: 10MB</li>
                                    <li>File hợp đồng mẫu sẽ được lưu vào hệ thống để sử dụng sau này</li>
                                </ul>
                            </div>

                            <div className="ec-create-template-form">
                                <div className="ec-create-form-group">
                                    <label htmlFor="template-name" className="ec-create-form-label">
                                        Tên hợp đồng mẫu <span className="ec-create-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="template-name"
                                        className="ec-create-form-input"
                                        placeholder="Nhập tên hợp đồng mẫu..."
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                    />
                                </div>

                                <div className="ec-create-form-group">
                                    <label htmlFor="template-type" className="ec-create-form-label">
                                        Loại hợp đồng <span className="ec-create-required">*</span>
                                    </label>
                                    <select
                                        id="template-type"
                                        className="ec-create-form-select"
                                        value={templateType}
                                        onChange={(e) => setTemplateType(e.target.value)}
                                    >
                                        <option value="labor">Hợp đồng lao động</option>
                                        <option value="service">Hợp đồng dịch vụ</option>
                                        <option value="training">Hợp đồng đào tạo</option>
                                    </select>
                                </div>
                            </div>

                            <input
                                type="file"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />

                            <div
                                className={`ec-create-upload-container ${fileError ? 'ec-create-upload-error' : ''} ${selectedFile ? 'ec-create-upload-success' : ''}`}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {!selectedFile && !fileError && (
                                    <>
                                        <svg className="ec-create-upload-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                                        </svg>
                                        <p className="ec-create-upload-text">Bấm vào đây để chọn file</p>
                                        <p className="ec-create-upload-subtext">hoặc kéo thả file vào đây</p>
                                    </>
                                )}

                                {selectedFile && !fileError && (
                                    <div className="ec-create-file-info">
                                        <svg className="ec-create-file-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                        </svg>
                                        <div className="ec-create-file-details">
                                            <p className="ec-create-file-name">{selectedFile.name}</p>
                                            <p className="ec-create-file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                )}

                                {fileError && (
                                    <div className="ec-create-error-info">
                                        <svg className="ec-create-error-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                        </svg>
                                        <p className="ec-create-error-text">{fileError}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedFile && !fileError && (
                            <div className="ec-create-upload-footer">
                                <button
                                    className="ec-create-btn-upload-complete"
                                    onClick={handleUploadComplete}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Đang tải lên...' : 'Hoàn tất'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Snackbar */}
            {showSnackbar && (
                <div className={`ec-create-snackbar ${snackbarType === 'success' ? 'ec-create-snackbar-success' : 'ec-create-snackbar-error'}`}>
                    <svg className="ec-create-snackbar-icon" viewBox="0 0 24 24" fill="currentColor">
                        {snackbarType === 'success' ? (
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        ) : (
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        )}
                    </svg>
                    <span className="ec-create-snackbar-message">{snackbarMessage}</span>
                </div>
            )}
        </div>
    );
};

export default EContractCreateNew;
