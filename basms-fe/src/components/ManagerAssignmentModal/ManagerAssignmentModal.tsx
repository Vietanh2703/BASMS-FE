import { useState, useEffect } from 'react';
import './ManagerAssignmentModal.css';

interface Manager {
    id: string;
    identityNumber: string;
    employeeCode: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phoneNumber: string;
    currentAddress: string;
    gender: string;
    dateOfBirth: string;
    role: string;
    position: string | null;
    department: string | null;
    managerLevel: number;
    reportsToManagerId: string | null;
    employmentStatus: string;
    canCreateShifts: boolean;
    canApproveShifts: boolean;
    canAssignGuards: boolean;
    canApproveOvertime: boolean;
    canManageTeams: boolean;
    totalTeamsManaged: number;
    totalGuardsSupervised: number;
    totalShiftsCreated: number;
    isActive: boolean;
    lastSyncedAt: string;
    syncStatus: string;
    createdAt: string;
}

interface ManagerAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
    contractTitle: string;
    contractNumber: string;
    onSuccess: () => void;
    onError?: () => void;
}

const ManagerAssignmentModal: React.FC<ManagerAssignmentModalProps> = ({
    isOpen,
    onClose,
    contractId,
    contractTitle,
    contractNumber,
    onSuccess,
    onError
}) => {
    const [managers, setManagers] = useState<Manager[]>([]);
    const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
    const [isLoadingManagers, setIsLoadingManagers] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchManagers();
        } else {
            // Reset state when modal closes
            setSelectedManager(null);
            setShowConfirmModal(false);
            setManagers([]);
        }
    }, [isOpen]);

    const fetchManagers = async () => {
        setIsLoadingManagers(true);

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                return;
            }

            const response = await fetch(`${apiUrl}/shifts/managers`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Failed to fetch managers, status:', response.status);
                throw new Error('Failed to fetch managers');
            }

            const data = await response.json();
            setManagers(data.managers || []);
        } catch (err) {
            console.error('Error fetching managers:', err);
        } finally {
            setIsLoadingManagers(false);
        }
    };

    const handleSelectManager = (manager: Manager) => {
        setSelectedManager(manager);
    };

    const handleOpenConfirmModal = () => {
        if (!selectedManager) return;
        setShowConfirmModal(true);
    };

    const handleBackToManagerList = () => {
        setShowConfirmModal(false);
    };

    const handleActivateContract = async () => {
        if (!selectedManager) return;

        setIsActivating(true);

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const token = localStorage.getItem('accessToken');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                console.error('Missing token or userId');
                return;
            }

            const requestBody = {
                ContractId: contractId,
                ActivatedBy: userId,
                ManagerId: selectedManager.id,
                Notes: "create-shift-template"
            };

            const response = await fetch(`${apiUrl}/contracts/${contractId}/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('Failed to activate contract');
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error activating contract:', err);
            if (onError) {
                onError();
            }
            onClose();
        } finally {
            setIsActivating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Manager Selection Modal */}
            {!showConfirmModal && (
                <div className="mgr-assign-modal-overlay" onClick={onClose}>
                    <div className="mgr-assign-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-assign-modal-header">
                            <h3>Chọn quản lý</h3>
                            <button className="mgr-assign-modal-close" onClick={onClose}>×</button>
                        </div>
                        <div className="mgr-assign-modal-body">
                            {isLoadingManagers ? (
                                <div className="mgr-assign-modal-loading">Đang tải danh sách quản lý...</div>
                            ) : managers.length === 0 ? (
                                <div className="mgr-assign-modal-empty">Không có quản lý nào</div>
                            ) : (
                                <div className="mgr-assign-list">
                                    {managers.map((manager) => (
                                        <div
                                            key={manager.id}
                                            className={`mgr-assign-item ${selectedManager?.id === manager.id ? 'mgr-assign-selected' : ''}`}
                                            onClick={() => handleSelectManager(manager)}
                                        >
                                            <div className="mgr-assign-info">
                                                <div className="mgr-assign-name">{manager.fullName}</div>
                                                <div className="mgr-assign-details">
                                                    <span>Mã NV: {manager.employeeCode}</span>
                                                    {manager.position && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{manager.position}</span>
                                                        </>
                                                    )}
                                                    <span>•</span>
                                                    <span>Cấp {manager.managerLevel}</span>
                                                </div>
                                                <div className="mgr-assign-contact">
                                                    <span>{manager.email}</span>
                                                    <span>•</span>
                                                    <span>{manager.phoneNumber}</span>
                                                </div>
                                                <div className="mgr-assign-stats">
                                                    <span>Teams: {manager.totalTeamsManaged}</span>
                                                    <span>•</span>
                                                    <span>Ca: {manager.totalShiftsCreated}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mgr-assign-modal-footer">
                            <button className="mgr-assign-btn-cancel" onClick={onClose}>
                                Đóng
                            </button>
                            <button
                                className="mgr-assign-btn-confirm"
                                onClick={handleOpenConfirmModal}
                                disabled={!selectedManager}
                            >
                                Xác nhận phân công quản lý
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && selectedManager && (
                <div className="mgr-assign-modal-overlay">
                    <div className="mgr-assign-confirm-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mgr-assign-modal-header">
                            <h3>Xác nhận thông tin</h3>
                        </div>
                        <div className="mgr-assign-modal-body">
                            <div className="mgr-assign-confirm-section">
                                <h4>Thông tin hợp đồng</h4>
                                <div className="mgr-assign-confirm-info">
                                    <p><strong>Hợp đồng:</strong> {contractTitle}</p>
                                    <p><strong>Số HĐ:</strong> {contractNumber}</p>
                                </div>
                            </div>
                            <div className="mgr-assign-confirm-section">
                                <h4>Thông tin quản lý được phân công</h4>
                                <div className="mgr-assign-confirm-info">
                                    <p><strong>Họ tên:</strong> {selectedManager.fullName}</p>
                                    <p><strong>Mã NV:</strong> {selectedManager.employeeCode}</p>
                                    <p><strong>Cấp bậc:</strong> Cấp {selectedManager.managerLevel}</p>
                                    {selectedManager.position && (
                                        <p><strong>Chức vụ:</strong> {selectedManager.position}</p>
                                    )}
                                    {selectedManager.department && (
                                        <p><strong>Phòng ban:</strong> {selectedManager.department}</p>
                                    )}
                                    <p><strong>Email:</strong> {selectedManager.email}</p>
                                    <p><strong>SĐT:</strong> {selectedManager.phoneNumber}</p>
                                    <p><strong>Trạng thái:</strong> {selectedManager.employmentStatus}</p>
                                </div>
                            </div>
                            <div className="mgr-assign-confirm-message">
                                Xác nhận thông tin và phân công ca trực?
                            </div>
                        </div>
                        <div className="mgr-assign-modal-footer">
                            <button
                                className="mgr-assign-btn-cancel"
                                onClick={handleBackToManagerList}
                                disabled={isActivating}
                            >
                                Quay lại
                            </button>
                            <button
                                className="mgr-assign-btn-confirm"
                                onClick={handleActivateContract}
                                disabled={isActivating}
                            >
                                {isActivating ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManagerAssignmentModal;
