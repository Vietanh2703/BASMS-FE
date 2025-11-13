import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

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

    // Nếu chưa đăng nhập, lưu trang hiện tại và redirect to login
    if (!isAuthenticated) {
        // Lưu đường dẫn hiện tại để redirect sau khi login
        sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};