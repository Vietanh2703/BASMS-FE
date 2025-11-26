import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import './ContractSign.css';
import SnackbarChecked from "../../components/snackbar/snackbarChecked.tsx";
import SnackbarFailed from "../../components/snackbar/snackbarFailed.tsx";

interface ContractDocument {
    fileUrl: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    documentId: string;
    urlExpiresAt: string;
}

interface ContractResponse {
    success: boolean;
    data: ContractDocument;
}

const ContractSign = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const [searchParams] = useSearchParams();
    useNavigate();
    const securityToken = searchParams.get('token');

    const [contractData, setContractData] = useState<ContractDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const fetchContractData = async () => {
            if (!documentId || !securityToken) {
                setError('Thiếu thông tin document ID hoặc security token');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;

                const response = await fetch(`${apiUrl}/contracts/documents/${documentId}/view?token=${securityToken}`, {
                    method: 'GET',
                    headers: {
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
                setPdfUrl(result.data.fileUrl);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải hợp đồng');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContractData();
    }, [documentId, securityToken]);

    const handleSign = async () => {
        if (!documentId || !securityToken) {
            setShowSnackbarFailed(true);
            return;
        }

        setIsSigning(true);

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;

            const response = await fetch(`${apiUrl}/contracts/documents/${documentId}/sign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${securityToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Không thể ký hợp đồng');
            }

            setShowSnackbarSuccess(true);
            setTimeout(() => {
                // Redirect to success page or close window
                window.close();
            }, 3000);
        } catch (error) {
            setShowSnackbarFailed(true);
        } finally {
            setIsSigning(false);
        }
    };

    const handleReject = () => {
        const confirmed = window.confirm('Bạn có chắc chắn muốn từ chối ký hợp đồng này?');
        if (confirmed) {
            window.close();
        }
    };

    const handleOpenSignatureModal = () => {
        setShowSignatureModal(true);
    };

    const handleCloseSignatureModal = () => {
        setShowSignatureModal(false);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        setSignatureData(dataUrl);
        setShowSignatureModal(false);
    };

    if (isLoading) {
        return (
            <div className="cs-loading-container">
                <div className="cs-loading-spinner"></div>
                <div className="cs-loading-text">Đang tải hợp đồng...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cs-error-container">
                <div className="cs-error-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <div className="cs-error-title">Có lỗi xảy ra</div>
                <div className="cs-error-message">{error}</div>
                <button className="cs-error-btn" onClick={() => window.close()}>
                    Đóng trang
                </button>
            </div>
        );
    }

    if (!contractData) {
        return (
            <div className="cs-error-container">
                <div className="cs-error-title">Không tìm thấy hợp đồng</div>
                <button className="cs-error-btn" onClick={() => window.close()}>
                    Đóng trang
                </button>
            </div>
        );
    }

    return (
        <div className="cs-container">
            <header className="cs-header">
                <div className="cs-header-content">
                    <div className="cs-logo">
                        <div className="cs-logo-icon">E</div>
                        <span className="cs-logo-text">eContract</span>
                    </div>
                    <h1 className="cs-header-title">Xác nhận ký hợp đồng</h1>
                </div>
            </header>

            <main className="cs-main">
                <div className="cs-info-section">
                    <div className="cs-info-card">
                        <h2 className="cs-info-title">{contractData.fileName}</h2>
                        <div className="cs-info-details">
                            <div className="cs-info-detail">
                                <span className="cs-info-label">Loại file:</span>
                                <span className="cs-info-value">
                                    {contractData.contentType.includes('pdf') ? 'PDF' : 'Word Document'}
                                </span>
                            </div>
                            <div className="cs-info-detail">
                                <span className="cs-info-label">Link hết hạn lúc:</span>
                                <span className="cs-info-value">
                                    {new Date(contractData.urlExpiresAt).toLocaleString('vi-VN', {
                                        year: 'numeric',
                                        month: 'numeric',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="cs-info-notice">
                            <svg className="cs-notice-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                            </svg>
                            <p>Vui lòng đọc kỹ nội dung hợp đồng bên dưới trước khi ký xác nhận</p>
                        </div>
                    </div>
                </div>

                <div className="cs-document-section">
                    <div className="cs-document-container">
                        {pdfUrl && contractData ? (
                            <>
                                <iframe
                                    src={
                                        contractData.contentType === 'application/pdf'
                                            ? pdfUrl
                                            : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pdfUrl)}`
                                    }
                                    className="cs-pdf-viewer"
                                    title="Contract Document"
                                />
                                <div className="cs-signature-box" onClick={handleOpenSignatureModal}>
                                    {signatureData ? (
                                        <img src={signatureData} alt="Chữ ký" className="cs-signature-preview" />
                                    ) : (
                                        <div className="cs-signature-placeholder">
                                            <svg className="cs-signature-icon" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                            </svg>
                                            <p>Bấm vào đây để ký</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="cs-no-document">
                                <p>Không thể hiển thị nội dung hợp đồng</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="cs-actions-section">
                    <div className="cs-actions-container">
                        <button
                            className="cs-btn cs-btn-reject"
                            onClick={handleReject}
                            disabled={isSigning}
                        >
                            Từ chối
                        </button>
                        <button
                            className="cs-btn cs-btn-sign"
                            onClick={handleSign}
                            disabled={isSigning}
                        >
                            {isSigning ? 'Đang xử lý...' : 'Ký xác nhận'}
                        </button>
                    </div>
                </div>
            </main>

            {showSignatureModal && (
                <div className="cs-signature-modal-overlay" onClick={handleCloseSignatureModal}>
                    <div className="cs-signature-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cs-signature-modal-header">
                            <h3>Vẽ chữ ký của bạn</h3>
                            <button className="cs-close-btn" onClick={handleCloseSignatureModal}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        <div className="cs-signature-modal-body">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={300}
                                className="cs-signature-canvas"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            <p className="cs-signature-hint">Vẽ chữ ký của bạn trong khung trên</p>
                        </div>
                        <div className="cs-signature-modal-footer">
                            <button className="cs-btn-secondary" onClick={clearSignature}>
                                Xóa
                            </button>
                            <button className="cs-btn-primary" onClick={saveSignature}>
                                Lưu chữ ký
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SnackbarChecked
                message="Hợp đồng đã được ký thành công"
                isOpen={showSnackbarSuccess}
                duration={4000}
                onClose={() => setShowSnackbarSuccess(false)}
            />

            <SnackbarFailed
                message="Không thể ký hợp đồng. Vui lòng thử lại"
                isOpen={showSnackbarFailed}
                duration={4000}
                onClose={() => setShowSnackbarFailed(false)}
            />
        </div>
    );
};

export default ContractSign;
