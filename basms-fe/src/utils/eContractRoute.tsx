import { Navigate } from 'react-router-dom';
import type {ReactNode} from 'react';

const ALLOWED_ROLE_ID = 'ddbd5fad-ba6e-11f0-bcac-00155dca8f48';

interface EContractRouteProps {
    children: ReactNode;
}

export const EContractRoute = ({ children }: EContractRouteProps) => {
    const eContractAccessToken = localStorage.getItem('eContractAccessToken');
    const eContractRoleId = localStorage.getItem('eContractRoleId');
    const eContractAccessTokenExpiry = localStorage.getItem('eContractAccessTokenExpiry');

    // Check if access token exists
    if (!eContractAccessToken) {
        return <Navigate to="/e-contract/login" replace />;
    }

    // Check if role is allowed
    if (eContractRoleId !== ALLOWED_ROLE_ID) {
        return <Navigate to="/e-contract/login" replace />;
    }

    // Check if token is expired
    if (eContractAccessTokenExpiry) {
        const expiryDate = new Date(eContractAccessTokenExpiry);
        const now = new Date();

        if (expiryDate <= now) {
            // Token expired, clear storage and redirect
            localStorage.removeItem('eContractAccessToken');
            localStorage.removeItem('eContractRefreshToken');
            localStorage.removeItem('eContractAccessTokenExpiry');
            localStorage.removeItem('eContractRefreshTokenExpiry');
            localStorage.removeItem('eContractUserId');
            localStorage.removeItem('eContractEmail');
            localStorage.removeItem('eContractFullName');
            localStorage.removeItem('eContractRoleId');

            return <Navigate to="/e-contract/login" replace />;
        }
    }

    // All checks passed, render the protected content
    return <>{children}</>;
};
