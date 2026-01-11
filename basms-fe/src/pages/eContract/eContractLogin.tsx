import { useState } from 'react';
import SnackbarChecked from '../../components/snackbar/snackbarChecked';
import SnackbarWarning from '../../components/snackbar/snackbarWarning';
import SnackbarFailed from '../../components/snackbar/snackbarFailed';
import { apiClient, API_ENDPOINTS } from '../../clients/apiClients';
import { useEContractAuth } from '../../hooks/useEContractAuth';
import './eContractLogin.css';

const ALLOWED_ROLE_ID = 'ddbd5bad-ba6e-11f0-bcac-00155dca8f48';

interface EContractLoginResponse {
    userId: string;
    email: string;
    fullName: string;
    roleId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    sessionExpiry: string;
}

const EContractLogin = () => {
    const { login } = useEContractAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [showSnackbarWarning, setShowSnackbarWarning] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isRateLimited, setIsRateLimited] = useState(false);

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
            const response = await apiClient.post<EContractLoginResponse>(
                API_ENDPOINTS.AUTH.LOGIN,
                {
                    Email: username,
                    Password: password,
                }
            );

            const { accessToken, refreshToken, fullName, email, userId, roleId, accessTokenExpiry, refreshTokenExpiry } = response.data;

            // Check roleId
            if (roleId !== ALLOWED_ROLE_ID) {
                setSnackbarMessage('Tài khoản không có quyền hạn thực hiện chức năng này.');
                setShowSnackbarFailed(true);
                setIsLoading(false);
                return;
            }

            // Tạo userInfo object
            const userInfo = {
                userId,
                email,
                fullName,
                roleId
            };

            // Sử dụng expiry times từ API, hoặc fallback nếu API không trả về
            const finalAccessTokenExpiry = accessTokenExpiry || new Date(Date.now() + 30 * 60 * 1000).toISOString();
            const finalRefreshTokenExpiry = refreshTokenExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            // Login qua context - truyền đầy đủ params bao gồm expiry times
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

                    if (responseData.errorCode === 'AUTH_INVALID_PASSWORD') {
                        const newAttempts = failedAttempts + 1;
                        setFailedAttempts(newAttempts);

                        errorMessage = 'Mật khẩu bạn nhập hiện không đúng';

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

            console.error('eContract Login error:', error);
            setSnackbarMessage(errorMessage);
            setShowSnackbarFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessSnackbarClose = () => {
        setShowSnackbarSuccess(false);
        // Context login function already handles navigation
    };

    return (
        <div className="econtract-login-page">
            <div className="econtract-login-container">
                <div className="econtract-login-box">
                    <h1 className="econtract-login-title">Đăng nhập eContract</h1>

                    <form onSubmit={handleSubmit} className="econtract-login-form">
                        <div className="econtract-form-group">
                            <input
                                type="text"
                                placeholder="tên tài khoản"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="econtract-form-input"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="econtract-form-group">
                            <input
                                type="password"
                                placeholder="mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="econtract-form-input"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="econtract-login-btn"
                            disabled={isLoading || isRateLimited}
                        >
                            {isLoading ? 'Đang đăng nhập...' :
                                isRateLimited ? 'Vui lòng đợi 3 giây...' :
                                    'Đăng nhập'}
                        </button>

                    </form>

                    <div className="econtract-back-login-link-container">
                        <button
                            type="button"
                            className="econtract-back-login-link"
                            onClick={() => window.location.href = '/login'}
                        >
                            Quay lại hệ thống quản lý bảo vệ
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
        </div>
    );
};

export default EContractLogin;
