import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import { apiClient, API_ENDPOINTS, type LoginRequest, type LoginResponse } from '../../clients/apiClients';
import { useAuth } from '../../hooks/useAuth';
import './login.css';
import type { UserInfo } from "../../contexts/authContext";

interface CheckFirstLoginResponse {
    isFirstLogin: boolean;
    email: string;
    loginCount: number;
}

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [showSnackbarWarning, setShowSnackbarWarning] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isRateLimited, setIsRateLimited] = useState(false);


    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

    const navigate = useNavigate();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        // Validate inputs
        if (!username && !password) {
            setSnackbarMessage('Ô nhập tên tài khoản và mật khẩu không được trống');
            setShowSnackbarWarning(true);
            return;
        }

        if (!username) {
            setSnackbarMessage('Ô nhập tên tài khoản không được trống');
            setShowSnackbarWarning(true);
            return;
        }

        if (!password) {
            setSnackbarMessage('Ô nhập mật khẩu không được trống');
            setShowSnackbarWarning(true);
            return;
        }

        if (!emailRegex.test(username)) {
            setSnackbarMessage('Tên đăng nhập không đúng định dạng email');
            setShowSnackbarWarning(true);
            return;
        }

        setIsLoading(true);

        try {
            // BƯỚC 1: Check isFirstLogin TRƯỚC khi gọi API login
            const checkFirstLoginResponse = await apiClient.post<CheckFirstLoginResponse>(
                `${import.meta.env.VITE_API_BASE_URL}/users/check-first-login`,
                { Email: username }
            );

            const { isFirstLogin } = checkFirstLoginResponse.data;

            // Nếu isFirstLogin === true, redirect đến update-password KHÔNG GỌI API LOGIN
            if (isFirstLogin === true) {
                setIsLoading(false);
                navigate('/update-password', { state: { email: username } });
                return;
            }

            // BƯỚC 2: Nếu không phải lần đầu (isFirstLogin === false), tiến hành login bình thường
            const loginData: LoginRequest = {
                Email: username,
                Password: password,
            };

            const response = await apiClient.post<LoginResponse>(
                API_ENDPOINTS.AUTH.LOGIN,
                loginData
            );

            const { accessToken, refreshToken, fullName, email, userId, roleId, accessTokenExpiry, refreshTokenExpiry } = response.data;

            const blockedRoleIds = import.meta.env.VITE_BLOCKED_ROLE_IDS?.split(',') || [];

            if (blockedRoleIds.includes(roleId)) {
                setSnackbarMessage('Bạn không được cấp quyền để vào hệ thống');
                setShowSnackbarFailed(true);
                setIsLoading(false);
                return;
            }

            const userInfo: UserInfo = {
                fullName,
                email,
                userId,
                roleId,
                sub: userId
            };

            const finalAccessTokenExpiry = accessTokenExpiry || new Date(Date.now() + 30 * 60 * 1000).toISOString();
            const finalRefreshTokenExpiry = refreshTokenExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            login(accessToken, refreshToken, userInfo, finalAccessTokenExpiry, finalRefreshTokenExpiry);

            setSnackbarMessage('Đăng nhập thành công!');
            setShowSnackbarSuccess(true);

        } catch (error: unknown) {
            let errorMessage = 'Đăng nhập thất bại';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: {
                            errorCode?: string;
                            message?: string;
                            details?: string;
                            validationErrors?: string[];
                        };
                        status?: number;
                    }
                };

                if (axiosError.response?.data) {
                    const responseData = axiosError.response.data;

                    // Xử lý theo errorCode
                    if (responseData.errorCode === 'AUTH_INVALID_PASSWORD') {
                        const newAttempts = failedAttempts + 1;
                        setFailedAttempts(newAttempts);

                        if (newAttempts >= 5) {
                            setShowPasswordResetModal(true);
                            setFailedAttempts(0);
                        } else {
                            errorMessage = 'Mật khẩu bạn nhập hiện không đúng';
                        }

                        // Disable nút login 3 giây
                        setIsRateLimited(true);
                        setTimeout(() => {
                            setIsRateLimited(false);
                        }, 3000);
                    }
                    else if (responseData.errorCode === 'AUTH_USER_NOT_FOUND' ||
                             responseData.errorCode === 'AUTH_INVALID_EMAIL') {
                        errorMessage = 'Tài khoản không tồn tại';
                    }
                    else if (responseData.validationErrors && responseData.validationErrors.length > 0) {
                        errorMessage = responseData.validationErrors.join(', ');
                    }
                    else if (responseData.message) {
                        // Kiểm tra nếu tài khoản bị khóa
                        if (responseData.message === 'Account is inactive. Please contact support.') {
                            errorMessage = 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
                        } else {
                            errorMessage = responseData.message;
                        }
                    }
                    else if (responseData.details) {
                        errorMessage = responseData.details;
                    }
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            console.error('Login error:', error);
            setSnackbarMessage(errorMessage);
            setShowSnackbarFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Function để handle khi snackbar success đóng
    const handleSuccessSnackbarClose = () => {
        setShowSnackbarSuccess(false);
        // Navigate được xử lý tự động trong authContext.login()
    };

    return (
        <div className="login-page">
            <Navbar />

            <div className="login-container">
                <div className="login-box">
                    <h1 className="login-title">Đăng nhập</h1>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="tên tài khoản"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="form-input"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="forgot-password-link-container">
                            <button
                                type="button"
                                className="forgot-password-link"
                                onClick={() => window.location.href = '/verify-email'}
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={isLoading || isRateLimited}
                        >
                            {isLoading ? 'Đang đăng nhập...' :
                                isRateLimited ? 'Vui lòng đợi 3 giây...' :
                                    'Đăng nhập'}
                        </button>

                    </form>

                    <div className="econtract-login-link-container">
                        <button
                            type="button"
                            className="econtract-login-link"
                            onClick={() => window.location.href = '/e-contract/login'}
                        >
                            Đăng nhập eContract
                        </button>
                    </div>
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

            {showPasswordResetModal && (
                <div className="password-fail-overlay" onClick={() => setShowPasswordResetModal(false)}>
                    <div className="password-fail-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Cảnh báo</h2>
                        <p>Bạn đã nhập sai mật khẩu quá 5 lần. Bạn có muốn đổi mật khẩu không?</p>
                        <div className="password-fail-actions">
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    setShowPasswordResetModal(false);
                                    window.location.href = '/forgotPassword';
                                }}
                            >
                                Đổi mật khẩu
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowPasswordResetModal(false)}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Login;