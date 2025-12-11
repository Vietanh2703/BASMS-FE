import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import tokenManager from '../services/tokenManager';
import { getDashboardByRole } from '../constants/roles';

export interface UserInfo {
    fullName: string;
    email: string;
    userId: string;
    roleId: string;
    sub: string;
}

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (accessToken: string, refreshToken: string, userInfo: UserInfo, accessTokenExpiry: string, refreshTokenExpiry: string) => void;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Khôi phục user từ localStorage khi load trang
    useEffect(() => {
        const initAuth = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const email = localStorage.getItem('email');
                const fullName = localStorage.getItem('fullName');
                const roleId = localStorage.getItem('roleId');

                if (userId && email && authService.isAuthenticated()) {
                    const userInfo: UserInfo = {
                        userId,
                        email,
                        fullName: fullName || '',
                        roleId: roleId || '',
                        sub: userId
                    };
                    setUser(userInfo);

                    // Kiểm tra nếu access token đã hết hạn, refresh ngay
                    if (authService.isAccessTokenExpired()) {
                        const success = await tokenManager.forceRefresh();
                        if (!success) {
                            handleLogoutCallback();
                            return;
                        }
                    }

                    // Bắt đầu auto refresh
                    tokenManager.startAutoRefresh();
                } else {
                    // Clear nếu không hợp lệ
                    authService.clearTokens();
                    clearUserInfo();
                }
            } catch (error) {
                console.error('Init auth error:', error);
                authService.clearTokens();
                clearUserInfo();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Setup callbacks cho token manager
    useEffect(() => {
        const handleLogoutCallback = () => {
            setUser(null);
            clearUserInfo();

            // Lưu trang hiện tại để redirect sau khi login
            const currentPath = location.pathname;
            if (currentPath !== '/login' && currentPath !== '/') {
                sessionStorage.setItem('redirectAfterLogin', currentPath);
            }
            navigate('/login');
        };

        const handleTokenRefreshed = () => {

            // Restore user state from localStorage after token refresh
            const userId = localStorage.getItem('userId');
            const email = localStorage.getItem('email');
            const fullName = localStorage.getItem('fullName');
            const roleId = localStorage.getItem('roleId');

            if (userId && email && authService.isAuthenticated()) {
                const userInfo: UserInfo = {
                    userId,
                    email,
                    fullName: fullName || '',
                    roleId: roleId || '',
                    sub: userId
                };
                setUser(userInfo);
            }
        };

        tokenManager.setCallbacks(handleTokenRefreshed, handleLogoutCallback);
    }, [navigate, location]);

    // Xử lý khi tab/window đóng
    useEffect(() => {
        const handleBeforeUnload = () => {
            console.log('Tab closing, token will expire in 30 minutes');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleLogoutCallback = () => {
        setUser(null);
        clearUserInfo();

        const currentPath = location.pathname;
        if (currentPath !== '/login' && currentPath !== '/') {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        navigate('/login');
    };

    const clearUserInfo = () => {
        localStorage.removeItem('fullName');
        localStorage.removeItem('roleId');
    };

    const saveUserInfo = (userInfo: UserInfo) => {
        localStorage.setItem('fullName', userInfo.fullName);
        localStorage.setItem('roleId', userInfo.roleId);
    };

    const login = (
        accessToken: string,
        refreshToken: string,
        userInfo: UserInfo,
        accessTokenExpiry: string,
        refreshTokenExpiry: string
    ) => {
        // Lưu tokens vào localStorage qua authService với expiry times từ API
        const loginResponse = {
            userId: userInfo.userId,
            email: userInfo.email,
            accessToken,
            refreshToken,
            accessTokenExpiry, // Sử dụng expiry time từ API
            refreshTokenExpiry // Sử dụng expiry time từ API
        };

        authService.saveTokens(loginResponse);
        saveUserInfo(userInfo);

        // Set user state
        setUser(userInfo);

        // Bắt đầu auto refresh
        tokenManager.startAutoRefresh();

        // Redirect về trang trước đó hoặc dashboard
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath, { replace: true });
        } else {
            // Redirect dựa trên roleId
            const dashboardPath = getDashboardByRole(userInfo.roleId);
            navigate(dashboardPath, { replace: true });
        }
    };

    const logout = async () => {
        try {
            // Gọi API logout
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Dừng auto refresh
            tokenManager.stopAutoRefresh();

            // Clear tokens
            authService.clearTokens();
            clearUserInfo();

            // Clear redirect path
            sessionStorage.removeItem('redirectAfterLogin');

            // Clear user
            setUser(null);

            // Redirect to login
            navigate('/login', { replace: true });
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user && authService.isAuthenticated(),
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};