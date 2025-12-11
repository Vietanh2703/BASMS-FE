import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import axios from 'axios';
import './forgotPassword.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showSnackbarWarning, setShowSnackbarWarning] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Lấy email từ localStorage
        const savedEmail = localStorage.getItem('resetPasswordEmail');
        if (!savedEmail) {
            navigate('/verify-email');
            return;
        }
        setEmail(savedEmail);
    }, [navigate]);

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Mật khẩu phải có ít nhất 8 ký tự';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất một chữ hoa';
        }
        if (!/[a-z]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất một chữ thường';
        }
        if (!/[0-9]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất một chữ số';
        }
        if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords
        if (!newPassword || !confirmPassword) {
            setSnackbarMessage('Vui lòng nhập đầy đủ mật khẩu');
            setShowSnackbarWarning(true);
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setSnackbarMessage(passwordError);
            setShowSnackbarWarning(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setSnackbarMessage('Mật khẩu xác nhận không khớp');
            setShowSnackbarWarning(true);
            return;
        }

        setIsLoading(true);

        try {
            await axios.post(`${API_URL}/reset-password`, {
                Email: email,
                NewPassword: newPassword,
                ConfirmPassword: confirmPassword
            });

            setSnackbarMessage('Đặt lại mật khẩu thành công!');
            setShowSnackbarSuccess(true);

        } catch (error: unknown) {
            let errorMessage = 'Đặt lại mật khẩu thất bại';

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

            console.error('Reset password error:', error);
            setSnackbarMessage(errorMessage);
            setShowSnackbarFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessSnackbarClose = () => {
        setShowSnackbarSuccess(false);
        // Xóa email khỏi localStorage và chuyển về trang login
        localStorage.removeItem('resetPasswordEmail');
        navigate('/login');
    };

    return (
        <div className="forgot-password-page">
            <Navbar />

            <div className="forgot-password-container">
                <div className="forgot-password-box">
                    <h1 className="forgot-password-title">Đặt lại mật khẩu</h1>
                    <p className="forgot-password-subtitle">
                        Nhập mật khẩu mới cho tài khoản: <strong>{email}</strong>
                    </p>

                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <div className="forgot-password-form-group">
                            <input
                                type="password"
                                placeholder="Mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="forgot-password-form-input"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="forgot-password-form-group">
                            <input
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="forgot-password-form-input"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="forgot-password-requirements">
                            <p className="forgot-password-requirements-title">Yêu cầu mật khẩu:</p>
                            <ul className="forgot-password-requirements-list">
                                <li className={newPassword.length >= 8 ? 'valid' : ''}>
                                    Ít nhất 8 ký tự
                                </li>
                                <li className={/[A-Z]/.test(newPassword) ? 'valid' : ''}>
                                    Chứa chữ hoa (A-Z)
                                </li>
                                <li className={/[a-z]/.test(newPassword) ? 'valid' : ''}>
                                    Chứa chữ thường (a-z)
                                </li>
                                <li className={/[0-9]/.test(newPassword) ? 'valid' : ''}>
                                    Chứa số (0-9)
                                </li>
                                <li className={/[!@#$%^&*(),.?":{}|<>_\-]/.test(newPassword) ? 'valid' : ''}>
                                    Chứa ký tự đặc biệt (!@#$%...)
                                </li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            className="forgot-password-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>

                        <button
                            type="button"
                            className="forgot-password-back-btn"
                            onClick={() => navigate('/verify-otp-password')}
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
                    onClose={handleSuccessSnackbarClose}
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

export default ForgotPassword;
