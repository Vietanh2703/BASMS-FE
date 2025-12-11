import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEContractAuth } from '../hooks/useEContractAuth';

interface EContractRouteProps {
    children: ReactNode;
}

export const EContractRoute = ({ children }: EContractRouteProps) => {
    const { isAuthenticated, loading } = useEContractAuth();

    // Show loading state
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

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/e-contract/login" replace />;
    }

    // All checks passed, render the protected content
    return <>{children}</>;
};
