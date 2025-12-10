import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './eContractServiceModal.css';

interface Customer {
    id: string;
    customerCode: string;
    companyName: string;
    contactPersonName: string;
    contactPersonTitle: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    gender: string;
    dateOfBirth: string;
    address: string;
    status: string;
    customerSince: string;
}

interface Contract {
    id: string;
    customerId: string;
    contractNumber: string;
    contractTitle: string;
    startDate: string;
    endDate: string;
    status: string;
}

interface ContractExpiredInfo {
    success: boolean;
    contractId: string;
    contractNumber: string;
    contractType: string;
    endDate: string;
    daysRemaining: number;
    status: string;
    message: string;
}

interface Document {
    id: string;
    category: string;
    documentType: string;
    documentName: string;
    fileUrl: string;
    fileSize: number;
    version: string;
    startDate: string | null;
    endDate: string | null;
    uploadedBy: string;
    createdAt: string;
    fileSizeFormatted: string;
    downloadUrl: string;
}

interface DocumentsResponse {
    success: boolean;
    errorMessage: string | null;
    documents: Document[];
    totalCount: number;
}

interface EContractServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId?: string;
}

const EContractServiceModal = ({ isOpen, onClose, templateId }: EContractServiceModalProps) => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serviceTemplateId, setServiceTemplateId] = useState<string | null>(null);
    const [contractExpiredInfo, setContractExpiredInfo] = useState<Record<string, ContractExpiredInfo>>({});

    // Fetch template on mount
    useEffect(() => {
        if (isOpen) {
            fetchServiceTemplate();
            fetchCustomers();
        }
    }, [isOpen]);

    // Fetch contracts when customer is selected
    useEffect(() => {
        if (selectedCustomerId) {
            fetchContracts(selectedCustomerId);
        }
    }, [selectedCustomerId]);

    // Fetch expired info for contracts with status 'shift_generated'
    useEffect(() => {
        if (contracts.length > 0) {
            contracts.forEach(contract => {
                if (contract.status === 'shift_generated') {
                    fetchContractExpiredInfo(contract.id);
                }
            });
        }
    }, [contracts]);

    const fetchServiceTemplate = async () => {
        try {
            const token = localStorage.getItem('eContractAccessToken') ||
                localStorage.getItem('accessToken');

            if (!token) {
                console.error('No token found for fetching template');
                return;
            }

            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const response = await fetch(`${apiUrl}/contracts/documents`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }

            const data: DocumentsResponse = await response.json();

            // Find guard_service_contract template
            const serviceTemplate = data.documents.find(
                doc => doc.category === 'guard_service_contract' && doc.documentType === 'template'
            );

            if (serviceTemplate) {
                setServiceTemplateId(serviceTemplate.id);
            } else {
                console.warn('No guard_service_contract template found');
            }
        } catch (err) {
            console.error('Error fetching service template:', err);
        }
    };

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        setError(null);
        try {
            // Kiểm tra token eContract trước, sau đó mới kiểm tra token thông thường
            const token = localStorage.getItem('eContractAccessToken') ||
                localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('accessToken') ||
                sessionStorage.getItem('token');

            if (!token) {
                console.error('Available localStorage keys:', Object.keys(localStorage));
                throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            }

            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const response = await fetch(`${apiUrl}/contracts/customers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                throw new Error('Token hết hạn. Vui lòng đăng nhập lại.');
            }

            if (!response.ok) {
                throw new Error('Không thể tải danh sách khách hàng');
            }

            const data = await response.json();
            setCustomers(data.customers || []);

            if (data.customers && data.customers.length > 0) {
                setSelectedCustomerId(data.customers[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        } finally {
            setLoadingCustomers(false);
        }
    };


    const fetchContracts = async (customerId: string) => {
        setLoadingContracts(true);
        try {
            // Kiểm tra token eContract trước, sau đó mới kiểm tra token thông thường
            const token = localStorage.getItem('eContractAccessToken') ||
                localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const response = await fetch(`${apiUrl}/contracts/customers/${customerId}/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách hợp đồng');
            }

            const data = await response.json();
            setContracts(data.contracts || []);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setContracts([]);
        } finally {
            setLoadingContracts(false);
        }
    };

    const fetchContractExpiredInfo = async (contractId: string) => {
        try {
            const token = localStorage.getItem('eContractAccessToken') ||
                localStorage.getItem('accessToken');
            if (!token) {
                return;
            }

            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;
            const response = await fetch(`${apiUrl}/contracts/${contractId}/check-expired`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error(`Failed to fetch expired info for contract ${contractId}`);
                return;
            }

            const data: ContractExpiredInfo = await response.json();
            setContractExpiredInfo(prev => ({
                ...prev,
                [contractId]: data
            }));
        } catch (err) {
            console.error(`Error fetching expired info for contract ${contractId}:`, err);
        }
    };

    const handleCreateContract = (customer: Customer) => {
        // Navigate to template editor with customer info and template ID as query params
        const params = new URLSearchParams({
            customerId: customer.id,
            customerCode: customer.customerCode,
            companyName: customer.companyName || '',
            contactPersonName: customer.contactPersonName,
            contactPersonTitle: customer.contactPersonTitle || '',
            email: customer.email,
            phone: customer.phone,
            gender: customer.gender || '',
            dateOfBirth: customer.dateOfBirth || '',
            address: customer.address || '',
        });

        // Use serviceTemplateId from API, fallback to prop templateId
        const finalTemplateId = serviceTemplateId || templateId;

        if (finalTemplateId) {
            params.append('template', finalTemplateId);
        }

        navigate(`/e-contracts/service-template-editor?${params.toString()}`);
        onClose();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    if (!isOpen) return null;

    return (
        <div className="ecsm-overlay" onClick={onClose}>
            <div className="ecsm-container" onClick={(e) => e.stopPropagation()}>
                <div className="ecsm-header">
                    <h2 className="ecsm-title">Tạo hợp đồng dịch vụ bảo vệ</h2>
                    <button className="ecsm-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <div className="ecsm-body">
                    {/* Left Column - Customers List */}
                    <div className="ecsm-left-column">
                        <div className="ecsm-column-header">
                            <h3 className="ecsm-column-title">Danh sách khách hàng</h3>
                        </div>

                        {loadingCustomers ? (
                            <div className="ecsm-loading">Đang tải khách hàng...</div>
                        ) : error ? (
                            <div className="ecsm-error">{error}</div>
                        ) : customers.length === 0 ? (
                            <div className="ecsm-empty">Không có khách hàng nào</div>
                        ) : (
                            <div className="ecsm-customers-list">
                                {customers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className={`ecsm-customer-item ${selectedCustomerId === customer.id ? 'ecsm-customer-active' : ''}`}
                                        onClick={() => setSelectedCustomerId(customer.id)}
                                    >
                                        <div className="ecsm-customer-info">
                                            <div className="ecsm-customer-avatar">
                                                {customer.avatarUrl ? (
                                                    <img src={customer.avatarUrl} alt={customer.contactPersonName} />
                                                ) : (
                                                    <span>{customer.contactPersonName.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="ecsm-customer-details">
                                                <div className="ecsm-customer-name">{customer.contactPersonName}</div>
                                                <div className="ecsm-customer-email">{customer.email}</div>
                                                <div className="ecsm-customer-phone">{customer.phone}</div>
                                            </div>
                                        </div>
                                        <button
                                            className="ecsm-create-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCreateContract(customer);
                                            }}
                                        >
                                            Tạo
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Contracts List */}
                    <div className="ecsm-right-column">
                        <div className="ecsm-column-header">
                            <h3 className="ecsm-column-title">Hợp đồng hiện có</h3>
                        </div>

                        {!selectedCustomerId ? (
                            <div className="ecsm-empty">Chọn khách hàng để xem hợp đồng</div>
                        ) : loadingContracts ? (
                            <div className="ecsm-loading">Đang tải hợp đồng...</div>
                        ) : contracts.length === 0 ? (
                            <div className="ecsm-empty">Khách hàng chưa có hợp đồng nào</div>
                        ) : (
                            <div className="ecsm-contracts-list">
                                {contracts.map((contract) => {
                                    const expiredInfo = contractExpiredInfo[contract.id];
                                    const showExpiredInfo = contract.status === 'shift_generated' && expiredInfo;

                                    return (
                                        <div key={contract.id} className="ecsm-contract-item">
                                            <div className="ecsm-contract-title">{contract.contractTitle}</div>
                                            <div className="ecsm-contract-dates">
                                                <div className="ecsm-contract-date">
                                                    <span className="ecsm-date-label">Bắt đầu:</span>
                                                    <span className="ecsm-date-value">{formatDate(contract.startDate)}</span>
                                                </div>
                                                <div className="ecsm-contract-date">
                                                    <span className="ecsm-date-label">Kết thúc:</span>
                                                    <span className="ecsm-date-value">{formatDate(contract.endDate)}</span>
                                                </div>
                                            </div>
                                            {showExpiredInfo && (
                                                <div className="ecsm-contract-expired-info">
                                                    <div className="ecsm-expired-message">{expiredInfo.message}</div>
                                                    <div className="ecsm-expired-details">
                                                        <span className="ecsm-expired-label">Trạng thái:</span>
                                                        <span className={`ecsm-expired-status ecsm-status-${expiredInfo.status}`}>
                                                            {expiredInfo.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EContractServiceModal;
