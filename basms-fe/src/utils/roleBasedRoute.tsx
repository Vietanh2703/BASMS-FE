import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardByRole } from '../constants/roles';

interface RoleBasedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[]; // Array of roleIds that can access this route
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();

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

    // Nếu chưa đăng nhập, redirect to login
    if (!isAuthenticated || !user) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra role có được phép truy cập không
    if (!allowedRoles.includes(user.roleId)) {
        // Redirect về dashboard của role đó
        const userDashboard = getDashboardByRole(user.roleId);
        return <Navigate to={userDashboard} replace />;
    }

    return <>{children}</>;
};