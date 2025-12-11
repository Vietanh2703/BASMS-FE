import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

export interface LoginResponse {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
}

export interface RefreshTokenRequest {
    RefreshToken: string;
}

class AuthService {
    // Refresh token - Đây là method quan trọng nhất
    async refreshToken(refreshToken: string): Promise<LoginResponse> {
        const response = await axios.post(`${API_URL}/refresh-token`, {
            RefreshToken: refreshToken
        });
        return response.data;
    }

// Login - thêm method này vào AuthService
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await axios.post(`${API_URL}/login`, {
            email,
            password
        });

        // Lưu tokens sau khi login thành công
        this.saveTokens(response.data);

        return response.data;
    }


    // Logout
    async logout(): Promise<void> {
        const accessToken = localStorage.getItem('accessToken');
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
                console.error('Logout error:', error);
                // Vẫn tiếp tục clear tokens dù API call bị lỗi
            }
        }
    }

    // Lưu tokens vào localStorage
    saveTokens(data: LoginResponse): void {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('accessTokenExpiry', data.accessTokenExpiry);
        localStorage.setItem('refreshTokenExpiry', data.refreshTokenExpiry);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('email', data.email);
        // Note: fullName and roleId are stored separately by authContext and not part of LoginResponse
    }

    // Xóa tokens
    clearTokens(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessTokenExpiry');
        localStorage.removeItem('refreshTokenExpiry');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
    }

    // Lấy access token
    getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    // Lấy refresh token
    getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken');
    }

    // Kiểm tra access token còn hạn không
    isAccessTokenExpired(): boolean {
        const expiry = localStorage.getItem('accessTokenExpiry');
        if (!expiry) return true;
        return new Date(expiry) <= new Date();
    }

    // Kiểm tra refresh token còn hạn không
    isRefreshTokenExpired(): boolean {
        const expiry = localStorage.getItem('refreshTokenExpiry');
        if (!expiry) return true;
        return new Date(expiry) <= new Date();
    }

    // Kiểm tra user đã đăng nhập chưa
    isAuthenticated(): boolean {
        const refreshToken = this.getRefreshToken();
        return !!refreshToken && !this.isRefreshTokenExpired();
    }
}

export default new AuthService();