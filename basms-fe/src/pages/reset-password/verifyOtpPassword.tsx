import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import axios from 'axios';
import './verifyOtpPassword.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

const VerifyOtpPassword = () => {
    const navigate = useNavigate();
    const [otpCode, setOtpCode] = useState('');
    const [email, setEmail] = useState('');
    const [showSnackbarWarning, setShowSnackbarWarning] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isAccountLocked, setIsAccountLocked] = useState(false);
    const [canRefresh, setCanRefresh] = useState(false);
    const [refreshCountdown, setRefreshCountdown] = useState(30);

    useEffect(() => {
        // Lấy email từ localStorage
        const savedEmail = localStorage.getItem('resetPasswordEmail');
        if (!savedEmail) {
            navigate('/verify-email');
            return;
        }
        setEmail(savedEmail);

        // Bắt đầu countdown 30 giây
        const timer = setInterval(() => {
            setRefreshCountdown((prev) => {
                if (prev <= 1) {
                    setCanRefresh(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    const handleRefreshOtp = async () => {
        if (!canRefresh || isAccountLocked) return;

        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/refresh-otp`, {
                Email: email,
                Purpose: 'reset_password'
            });

            setSnackbarMessage('Mã OTP mới đã được gửi đến email của bạn');
            setShowSnackbarSuccess(true);
            setCanRefresh(false);
            setRefreshCountdown(30);

            // Restart countdown
            const timer = setInterval(() => {
                setRefreshCountdown((prev) => {
                    if (prev <= 1) {
                        setCanRefresh(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error: unknown) {
            let errorMessage = 'Không thể làm mới mã OTP';

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
                        errorMessage = responseData.message;
                    } else if (responseData.details) {
                        errorMessage = responseData.details;
                    }
                }
            }

            console.error('Refresh OTP error:', error);
            setSnackbarMessage(errorMessage);
            setShowSnackbarFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate OTP
        if (!otpCode) {
            setSnackbarMessage('Ô nhập mã OTP không được trống');
            setShowSnackbarWarning(true);
            return;
        }

        if (isAccountLocked) {
            setSnackbarMessage('Vì vấn đề bảo mật tài khoản của bạn đã bị khóa. Vui lòng thông báo cho quản trị hệ thống để xử lí');
            setShowSnackbarFailed(true);
            return;
        }

        setIsLoading(true);

        try {
            await axios.post(`${API_URL}/verify-otp`, {
                email: email,
                otpCode: otpCode,
                Purpose: 'reset_password'
            });

            // Reset failed attempts và chuyển sang trang reset password
            setFailedAttempts(0);
            navigate('/forgot-password');

        } catch (error: unknown) {
            let errorMessage = 'Mã OTP không đúng';

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
                        errorMessage = responseData.message;
                    } else if (responseData.details) {
                        errorMessage = responseData.details;
                    }
                }
            }

            // Tăng số lần thất bại
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);

            // Nếu sai >= 5 lần thì khóa account
            if (newAttempts >= 5) {
                setIsAccountLocked(true);
                setSnackbarMessage('Vì vấn đề bảo mật tài khoản của bạn đã bị khóa. Vui lòng thông báo cho quản trị hệ thống để xử lí');
            } else {
                setSnackbarMessage(errorMessage);
            }

            console.error('Verify OTP error:', error);
            setShowSnackbarFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="verify-otp-page">
            <Navbar />

            <div className="verify-otp-container">
                <div className="verify-otp-box">
                    <h1 className="verify-otp-title">Xác nhận OTP</h1>
                    <p className="verify-otp-subtitle">
                        Mã OTP đã được gửi đến email: <strong>{email}</strong>
                    </p>

                    <form onSubmit={handleSubmit} className="verify-otp-form">
                        <div className="verify-otp-form-group">
                            <input
                                type="text"
                                placeholder="Nhập mã OTP"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                                className="verify-otp-form-input"
                                disabled={isLoading || isAccountLocked}
                                maxLength={6}
                            />
                        </div>

                        {failedAttempts > 0 && !isAccountLocked && (
                            <p className="verify-otp-attempts">
                                Số lần nhập sai: {failedAttempts}/5
                            </p>
                        )}

                        {isAccountLocked && (
                            <p className="verify-otp-locked">
                                Tài khoản đã bị khóa do nhập sai quá 5 lần
                            </p>
                        )}

                        <button
                            type="submit"
                            className="verify-otp-btn"
                            disabled={isLoading || isAccountLocked}
                        >
                            {isLoading ? 'Đang xác nhận...' : 'Xác nhận OTP'}
                        </button>

                        <button
                            type="button"
                            className="verify-otp-refresh-btn"
                            onClick={handleRefreshOtp}
                            disabled={!canRefresh || isLoading || isAccountLocked}
                        >
                            {isAccountLocked
                                ? 'Tài khoản đã bị khóa'
                                : canRefresh
                                    ? 'Gửi lại mã OTP'
                                    : `Gửi lại sau ${refreshCountdown}s`}
                        </button>

                        <button
                            type="button"
                            className="verify-otp-back-btn"
                            onClick={() => navigate('/verify-email')}
                            disabled={isLoading}
                        >
                            Quay lại
                        </button>
                    </form>
                </div>
            </div>

            {showSnackbarSuccess && (
                <SnackbarChecked
                    message={snackbarMessage}
                    isOpen={showSnackbarSuccess}
                    onClose={() => setShowSnackbarSuccess(false)}
                    duration={3000}
                />
            )}

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

export default VerifyOtpPassword;
