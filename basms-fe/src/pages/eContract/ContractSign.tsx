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
    const navigate = useNavigate();
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
    const [isConfirmed, setIsConfirmed] = useState(false);
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

        // Check if signature exists
        if (!signatureData) {
            alert('Vui lòng ký vào hợp đồng trước khi xác nhận');
            return;
        }

        setIsSigning(true);

        try {
            const apiUrl = import.meta.env.VITE_API_CONTRACT_URL;

            // Convert base64 to Blob (PNG file)
            const base64Response = await fetch(signatureData);
            const blob = await base64Response.blob();

            // Create FormData
            const formData = new FormData();
            formData.append('documentId', documentId);
            formData.append('image', blob, 'signature.png');  // PNG file with name

            // Send FormData with image file
            const response = await fetch(`${apiUrl}/contracts/sign-document`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${securityToken}`,
                    // Don't set Content-Type - browser will set it automatically with boundary
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Không thể ký hợp đồng');
            }
            await response.json();
            setShowSnackbarSuccess(true);

            // Try to close window immediately after showing success message
            setTimeout(() => {
                window.close();
            }, 1500);
        } catch (error) {
            setShowSnackbarFailed(true);
        } finally {
            setIsSigning(false);
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

        // Save as PNG (hoặc 'image/jpeg', 0.95 cho JPEG với quality 95%)
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
                    <div className="cs-info-notice">
                        <svg className="cs-notice-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        <p>Vui lòng đọc kỹ nội dung hợp đồng bên dưới trước khi ký xác nhận</p>
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
                        <div className="cs-confirm-checkbox-wrapper">
                            <label className="cs-confirm-checkbox">
                                <input
                                    type="checkbox"
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                    className="cs-checkbox-input"
                                />
                                <span className="cs-checkbox-checkmark"></span>
                                <span className="cs-checkbox-label">
                                    Tôi đã đọc kỹ hợp đồng trên và xác nhận thông tin trên hợp đồng là đúng
                                </span>
                            </label>
                        </div>
                        <button
                            className="cs-btn cs-btn-sign"
                            onClick={handleSign}
                            disabled={isSigning || !signatureData || !isConfirmed}
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
