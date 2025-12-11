import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

export interface EContractLoginResponse {
    userId: string;
    email: string;
    fullName: string;
    roleId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
}

export interface RefreshTokenRequest {
    RefreshToken: string;
}

class EContractAuthService {
    // Refresh token
    async refreshToken(refreshToken: string): Promise<EContractLoginResponse> {
        const response = await axios.post(`${API_URL}/refresh-token`, {
            RefreshToken: refreshToken
        });
        return response.data;
    }

    // Logout
    async logout(): Promise<void> {
        const accessToken = localStorage.getItem('eContractAccessToken');
        if (accessToken) {
            try {
                await axios.post(`${API_URL}/logout`, {
                    AccessToken: accessToken
                }, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('eContract Logout error:', error);
                // Vẫn tiếp tục clear tokens dù API call bị lỗi
            }
        }
    }

    // Lưu tokens vào localStorage với prefix eContract
    saveTokens(data: EContractLoginResponse): void {
        localStorage.setItem('eContractAccessToken', data.accessToken);
        localStorage.setItem('eContractRefreshToken', data.refreshToken);
        localStorage.setItem('eContractAccessTokenExpiry', data.accessTokenExpiry);
        localStorage.setItem('eContractRefreshTokenExpiry', data.refreshTokenExpiry);
        localStorage.setItem('eContractUserId', data.userId);
        localStorage.setItem('eContractEmail', data.email);

        // Only save fullName and roleId if they exist (they won't exist in refresh token response)
        if (data.fullName) {
            localStorage.setItem('eContractFullName', data.fullName);
        }
        if (data.roleId) {
            localStorage.setItem('eContractRoleId', data.roleId);
        }
    }

    // Xóa tokens
    clearTokens(): void {
        localStorage.removeItem('eContractAccessToken');
        localStorage.removeItem('eContractRefreshToken');
        localStorage.removeItem('eContractAccessTokenExpiry');
        localStorage.removeItem('eContractRefreshTokenExpiry');
        localStorage.removeItem('eContractUserId');
        localStorage.removeItem('eContractEmail');
        localStorage.removeItem('eContractFullName');
        localStorage.removeItem('eContractRoleId');
    }

    // Lấy access token
    getAccessToken(): string | null {
        return localStorage.getItem('eContractAccessToken');
    }

    // Lấy refresh token
    getRefreshToken(): string | null {
        return localStorage.getItem('eContractRefreshToken');
    }

    // Kiểm tra access token còn hạn không
    isAccessTokenExpired(): boolean {
        const expiry = localStorage.getItem('eContractAccessTokenExpiry');
        if (!expiry) return true;
        return new Date(expiry) <= new Date();
    }

    // Kiểm tra refresh token còn hạn không
    isRefreshTokenExpired(): boolean {
        const expiry = localStorage.getItem('eContractRefreshTokenExpiry');
        if (!expiry) return true;
        return new Date(expiry) <= new Date();
    }

    // Kiểm tra user đã đăng nhập chưa
    isAuthenticated(): boolean {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        return !!accessToken && !!refreshToken && !this.isRefreshTokenExpired();
    }

    // Kiểm tra access token sắp hết hạn (còn dưới 5 phút)
    isAccessTokenExpiringSoon(): boolean {
        const expiry = localStorage.getItem('eContractAccessTokenExpiry');
        if (!expiry) return true;

        const expiryTime = new Date(expiry).getTime();
        const now = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 phút

        return (expiryTime - now) <= fiveMinutes;
    }
}

export default new EContractAuthService();
