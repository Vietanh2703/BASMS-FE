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

    // Contract signing pages are special - always allow access
    const isSigningPage = /^\/[^/]+\/sign$/.test(location.pathname);
    const isSignCompletePage = location.pathname === '/e-contract/sign-complete';
    if (isSigningPage || isSignCompletePage) {
        return <>{children}</>;
    }

    // Show loading if either system is still checking auth
    if (loading || eContractLoading) {
        return <LoadingScreen />;
    }

    // ========== Priority Check: Redirect authenticated users to their dashboard ==========
    // This prevents accessing any login page when already logged in

    // Priority 1: Check BASMS authentication
    if (isAuthenticated && user) {
        // Check if there's a redirect path saved (from protected route)
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            return <Navigate to={redirectPath} replace />;
        }

        // Already logged in BASMS, redirect to BASMS dashboard
        const dashboardPath = getDashboardByRole(user.roleId);
        return <Navigate to={dashboardPath} replace />;
    }

    // Priority 2: Check eContract authentication
    if (isEContractAuthenticated) {
        // Already logged in eContract, redirect to eContract dashboard
        return <Navigate to="/e-contracts/dashboard" replace />;
    }

    // ========== Not logged in to either system ==========
    // Allow access to login pages and other public pages
    return <>{children}</>;
};