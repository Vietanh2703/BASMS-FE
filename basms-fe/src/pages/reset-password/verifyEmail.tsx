import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import axios from 'axios';
import './verifyEmail.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [showSnackbarWarning, setShowSnackbarWarning] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate email
        if (!email) {
            setSnackbarMessage('Ô nhập email không được trống');
            setShowSnackbarWarning(true);
            return;
        }

        if (!emailRegex.test(email)) {
            setSnackbarMessage('Email không đúng định dạng');
            setShowSnackbarWarning(true);
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_URL}/reset-password/request-otp`, {
                Email: email
            });

            // Check response success
            if (response.data && response.data.success === false) {
                // API trả về success: false
                let errorMessage = 'Email không tồn tại trong hệ thống';

                if (response.data.message === 'Your account is inactive. Please contact support.') {
                    errorMessage = 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
                } else if (response.data.message) {
                    errorMessage = response.data.message;
                }

                setSnackbarMessage(errorMessage);
                setShowSnackbarFailed(true);
                return; // Không navigate
            }

            // Lưu email vào localStorage và chuyển sang verify OTP
            localStorage.setItem('resetPasswordEmail', email);
            navigate('/verify-otp-password');

        } catch (error: unknown) {
            let errorMessage = 'Email không tồn tại trong hệ thống';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: {
                            errorCode?: string;
                            message?: string;
                            details?: string;
                            validationErrors?: string[];
                        };
                    }
                };

                if (axiosError.response?.data) {
                    const responseData = axiosError.response.data;

                    if (responseData.validationErrors && responseData.validationErrors.length > 0) {
                        errorMessage = responseData.validationErrors.join(', ');
                    } else if (responseData.message) {
                        // Kiểm tra nếu tài khoản bị khóa
                        if (responseData.message === 'Your account is inactive. Please contact support.') {
                            errorMessage = 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
                        } else {
                            errorMessage = responseData.message;
                        }
                    } else if (responseData.details) {
                        errorMessage = responseData.details;
                    }
                }
            }

            console.error('Request OTP error:', error);
            setSnackbarMessage(errorMessage);
            setShowSnackbarFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="verify-email-page">
            <Navbar />

            <div className="verify-email-container">
                <div className="verify-email-box">
                    <h1 className="verify-email-title">Xác thực Email</h1>
                    <p className="verify-email-subtitle">Nhập email của bạn để nhận mã OTP</p>

                    <form onSubmit={handleSubmit} className="verify-email-form">
                        <div className="verify-email-form-group">
                            <input
                                type="text"
                                placeholder="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="verify-email-form-input"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="verify-email-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </button>

                        <button
                            type="button"
                            className="verify-email-back-btn"
                            onClick={() => navigate('/login')}
                            disabled={isLoading}
                        >
                            Quay lại đăng nhập
                        </button>
                    </form>
                </div>
            </div>

            {showSnackbarWarning && (
                <SnackbarWarning
                    message={snackbarMessage}
                    isOpen={showSnackbarWarning}
                    onClose={() => setShowSnackbarWarning(false)}
                    duration={3000}
                />
            )}

            {showSnackbarFailed && (
                <SnackbarFailed
                    message={snackbarMessage}
                    isOpen={showSnackbarFailed}
                    onClose={() => setShowSnackbarFailed(false)}
                    duration={3000}
                />
            )}
        </div>
    );
};

export default VerifyEmail;
