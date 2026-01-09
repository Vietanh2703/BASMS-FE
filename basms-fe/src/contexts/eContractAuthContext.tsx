import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import eContractAuthService from '../services/eContractAuthService';
import eContractTokenManager from '../services/eContractTokenManager';

export interface EContractUserInfo {
    fullName: string;
    email: string;
    userId: string;
    roleId: string;
}

interface EContractAuthContextType {
    user: EContractUserInfo | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (accessToken: string, refreshToken: string, userInfo: EContractUserInfo, accessTokenExpiry: string, refreshTokenExpiry: string) => void;
    logout: () => Promise<void>;
}

export const EContractAuthContext = createContext<EContractAuthContextType | undefined>(undefined);

interface EContractAuthProviderProps {
    children: ReactNode;
}

const ALLOWED_ROLE_ID = 'ddbd5bad-ba6e-11f0-bcac-00155dca8f48';

export const EContractAuthProvider: React.FC<EContractAuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<EContractUserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useLocation();
// Khôi phục user từ localStorage khi load trang
    useEffect(() => {
        const initAuth = async () => {
            try {
                const userId = localStorage.getItem('eContractUserId');
                const email = localStorage.getItem('eContractEmail');
                const fullName = localStorage.getItem('eContractFullName');
                const roleId = localStorage.getItem('eContractRoleId');

                if (userId && email && roleId === ALLOWED_ROLE_ID && eContractAuthService.isAuthenticated()) {
                    const userInfo: EContractUserInfo = {
                        userId,
                        email,
                        fullName: fullName || '',
                        roleId
                    };
                    setUser(userInfo);

                    // Kiểm tra nếu access token đã hết hạn, refresh ngay
                    if (eContractAuthService.isAccessTokenExpired()) {
                        const success = await eContractTokenManager.forceRefresh();
                        if (!success) {
                            handleLogoutCallback();
                            return;
                        }
                    }

                    // Bắt đầu auto refresh
                    eContractTokenManager.startAutoRefresh();
                } else {
                    // Clear nếu không hợp lệ
                    eContractAuthService.clearTokens();
                }
            } catch (error) {
                console.error('eContract: Init auth error:', error);
                eContractAuthService.clearTokens();
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
            navigate('/e-contract/login');
        };

        const handleTokenRefreshed = () => {
            // Restore user state from localStorage after token refresh
            const userId = localStorage.getItem('eContractUserId');
            const email = localStorage.getItem('eContractEmail');
            const fullName = localStorage.getItem('eContractFullName');
            const roleId = localStorage.getItem('eContractRoleId');

            if (userId && email && roleId === ALLOWED_ROLE_ID && eContractAuthService.isAuthenticated()) {
                const userInfo: EContractUserInfo = {
                    userId,
                    email,
                    fullName: fullName || '',
                    roleId
                };
                setUser(userInfo);
            }
        };

        eContractTokenManager.setCallbacks(handleTokenRefreshed, handleLogoutCallback);
    }, [navigate]);

    // Xử lý khi tab/window đóng - dừng auto refresh
    useEffect(() => {
        const handleBeforeUnload = () => {
            eContractTokenManager.stopAutoRefresh();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleLogoutCallback = () => {
        setUser(null);
        navigate('/e-contract/login');
    };

    const login = (
        accessToken: string,
        refreshToken: string,
        userInfo: EContractUserInfo,
        accessTokenExpiry: string,
        refreshTokenExpiry: string
    ) => {
        // Lưu tokens vào localStorage
        const loginResponse = {
            userId: userInfo.userId,
            email: userInfo.email,
            fullName: userInfo.fullName,
            roleId: userInfo.roleId,
            accessToken,
            refreshToken,
            accessTokenExpiry,
            refreshTokenExpiry
        };

        eContractAuthService.saveTokens(loginResponse);

        // Set user state
        setUser(userInfo);

        // Bắt đầu auto refresh
        eContractTokenManager.startAutoRefresh();

        // Redirect về dashboard
        navigate('/e-contracts/dashboard', { replace: true });
    };

    const logout = async () => {
        try {
            // Gọi API logout
            await eContractAuthService.logout();
        } catch (error) {
            console.error('eContract: Logout error:', error);
        } finally {
            // Dừng auto refresh
            eContractTokenManager.stopAutoRefresh();

            // Clear tokens
            eContractAuthService.clearTokens();

            // Clear user
            setUser(null);

            // Redirect to login
            navigate('/e-contract/login', { replace: true });
        }
    };

    const value: EContractAuthContextType = {
        user,
        isAuthenticated: !!user && eContractAuthService.isAuthenticated(),
        loading,
        login,
        logout
    };

    return (
        <EContractAuthContext.Provider value={value}>
            {children}
        </EContractAuthContext.Provider>
    );
};
