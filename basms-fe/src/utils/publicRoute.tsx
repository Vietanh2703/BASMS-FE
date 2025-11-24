import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardByRole } from '../constants/roles';

interface PublicRouteProps {
    children: React.ReactNode;
}

const ALLOWED_ECONTRACT_ROLE_ID = 'ddbd5fad-ba6e-11f0-bcac-00155dca8f48';

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Check eContract session for eContract login page
    const isEContractLoginPage = location.pathname === '/e-contract/login';

    if (isEContractLoginPage) {
        const eContractAccessToken = localStorage.getItem('eContractAccessToken');
        const eContractRoleId = localStorage.getItem('eContractRoleId');
        const eContractAccessTokenExpiry = localStorage.getItem('eContractAccessTokenExpiry');

        if (eContractAccessToken && eContractRoleId === ALLOWED_ECONTRACT_ROLE_ID) {
            // Check if token is still valid
            if (eContractAccessTokenExpiry) {
                const expiryDate = new Date(eContractAccessTokenExpiry);
                const now = new Date();

                if (expiryDate > now) {
                    // eContract session is valid, redirect to eContract dashboard
                    return <Navigate to="/e-contracts/dashboard" replace />;
                }
            }
        }
        // No valid eContract session, allow access to eContract login page
        return <>{children}</>;
    }

    // Hiển thị loading khi đang kiểm tra authentication
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Đang tải...
            </div>
        );
    }

    // Nếu đã đăng nhập (hệ thống thông thường), redirect về dashboard theo role
    if (isAuthenticated && user) {
        // Kiểm tra có trang cần redirect sau login không
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            return <Navigate to={redirectPath} replace />;
        }

        // Redirect dựa trên roleId của user
        const dashboardPath = getDashboardByRole(user.roleId);
        return <Navigate to={dashboardPath} replace />;
    }

    return <>{children}</>;
};