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

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showSnackbarSuccess, setShowSnackbarSuccess] = useState(false);
    const [showSnackbarWarning, setShowSnackbarWarning] = useState(false);
    const [showSnackbarFailed, setShowSnackbarFailed] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    useNavigate();
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
            const loginData: LoginRequest = {
                Email: username,
                Password: password,
            };

            const response = await apiClient.post<LoginResponse>(
                API_ENDPOINTS.AUTH.LOGIN,
                loginData
            );

            const { accessToken: _accessToken, refreshToken: _refreshToken, fullName, email, userId, roleId, accessTokenExpiry, refreshTokenExpiry } = response.data;


            // Tạo userInfo object
            const userInfo: UserInfo = {
                fullName,
                email,
                userId,
                roleId,
                sub: userId
            };

            // Lưu expiry dates vào response data để authContext có thể sử dụng
            const updatedResponse = {
                ...response.data,
                accessTokenExpiry: accessTokenExpiry || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                refreshTokenExpiry: refreshTokenExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

            // Login qua context - sẽ tự động lưu tokens và redirect
            login(updatedResponse.accessToken, updatedResponse.refreshToken, userInfo);

            setSnackbarMessage('Đăng nhập thành công!');
            setShowSnackbarSuccess(true);

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error details:', errorMessage);

            setSnackbarMessage('Tài khoản không tồn tại');
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

                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
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

export default Login;