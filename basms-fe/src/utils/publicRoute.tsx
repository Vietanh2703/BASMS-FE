import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEContractAuth } from '../hooks/useEContractAuth';
import { getDashboardByRole } from '../constants/roles';

interface PublicRouteProps {
    children: React.ReactNode;
}

const LoadingScreen = () => (
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

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const { isAuthenticated: isEContractAuthenticated, loading: eContractLoading } = useEContractAuth();
    const location = useLocation();

    // Determine which system we're in based on path
    // Contract signing page pattern: /:documentId/sign
    const isSigningPage = /^\/[^/]+\/sign$/.test(location.pathname);
    const isEContractPath = location.pathname.startsWith('/e-contract') ||
                           location.pathname.startsWith('/e-contracts') ||
                           isSigningPage;

    // ========== eContract System Logic ==========
    if (isEContractPath || location.pathname === '/e-contract/login') {
        // Show loading for eContract auth
        if (eContractLoading) {
            return <LoadingScreen />;
        }

        // If already authenticated with eContract, redirect to eContract dashboard
        if (isEContractAuthenticated) {
            return <Navigate to="/e-contracts/dashboard" replace />;
        }

        // Not authenticated with eContract, allow access to eContract login page
        return <>{children}</>;
    }

    // ========== BASMS System Logic ==========
    // Show loading for BASMS auth
    if (loading) {
        return <LoadingScreen />;
    }

    // If already authenticated with BASMS, redirect to BASMS dashboard
    if (isAuthenticated && user) {
        // Check if there's a redirect path saved
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            return <Navigate to={redirectPath} replace />;
        }

        // Redirect to dashboard based on role
        const dashboardPath = getDashboardByRole(user.roleId);
        return <Navigate to={dashboardPath} replace />;
    }

    // Not authenticated with BASMS, allow access to BASMS login page
    return <>{children}</>;
};