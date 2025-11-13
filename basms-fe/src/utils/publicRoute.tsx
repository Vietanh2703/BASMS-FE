import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
    children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

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

    // Nếu đã đăng nhập, redirect về trang đã lưu hoặc dashboard
    if (isAuthenticated) {
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            return <Navigate to={redirectPath} replace />;
        }
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <>{children}</>;
};