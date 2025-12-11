import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService, {type LoginResponse } from '../services/authService';
import tokenManager from '../services/tokenManager';

interface User {
    userId: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Khôi phục user từ localStorage khi load trang
    useEffect(() => {
        const initAuth = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const email = localStorage.getItem('email');

                if (userId && email && authService.isAuthenticated()) {
                    setUser({ userId, email });

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
                }
            } catch (error) {
                console.error('Init auth error:', error);
                authService.clearTokens();
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
            // Lưu trang hiện tại để redirect sau khi login
            const currentPath = location.pathname;
            if (currentPath !== '/login' && currentPath !== '/') {
                sessionStorage.setItem('redirectAfterLogin', currentPath);
            }
            navigate('/login');
        };

        const handleTokenRefreshed = () => {
            console.log('Token refreshed successfully');
        };

        tokenManager.setCallbacks(handleTokenRefreshed, handleLogoutCallback);
    }, [navigate, location]);

    // Xử lý khi tab/window đóng
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Token sẽ tự động expire sau 30 phút khi đóng tab
            console.log('Tab closing, token will expire in 30 minutes');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleLogoutCallback = () => {
        setUser(null);
        // Lưu trang hiện tại để redirect sau khi login
        const currentPath = location.pathname;
        if (currentPath !== '/login' && currentPath !== '/') {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        navigate('/login');
    };

    const login = async (email: string, password: string) => {
        const response: LoginResponse = await authService.login(email, password);

        // Lưu tokens
        authService.saveTokens(response);

        // Set user
        setUser({
            userId: response.userId,
            email: response.email
        });

        // Bắt đầu auto refresh
        tokenManager.startAutoRefresh();

        // Redirect về trang trước đó hoặc dashboard
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath, { replace: true });
        } else {
            navigate('/admin/dashboard', { replace: true });
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
        loading,
        login,
        logout,
        isAuthenticated: !!user && authService.isAuthenticated()
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};