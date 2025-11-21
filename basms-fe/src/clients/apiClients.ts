import axios from 'axios';
import tokenManager from '../services/tokenManager';
import authService from '../services/authService';

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/users/login',
        LOGOUT: '/users/logout',
        REFRESH_TOKEN: '/users/refresh-token',
        REGISTER: '/users/register',
    },
    USERS: {
        PROFILE: '/users/{id:guid}',
        UPDATE: '/users/update',
    },
    // Thêm các endpoints khác của bạn ở đây
};

// Types
export interface LoginRequest {
    Email: string;
    Password: string;
}

export interface LoginResponse {
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

export interface RefreshTokenResponse {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    sessionExpiry: string;
}

// Create axios instance
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Request interceptor - Thêm token vào header
apiClient.interceptors.request.use(
    (config) => {
        const token = authService.getAccessToken();

        // Không thêm token cho các endpoint public
        const publicEndpoints = [
            API_ENDPOINTS.AUTH.LOGIN,
            API_ENDPOINTS.AUTH.REGISTER,
            API_ENDPOINTS.AUTH.REFRESH_TOKEN
        ];

        const isPublicEndpoint = publicEndpoints.some(endpoint =>
            config.url?.includes(endpoint)
        );

        if (token && !isPublicEndpoint) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Xử lý errors và auto refresh token
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Nếu là endpoint login hoặc refresh-token bị 401, không xử lý auto-refresh
            if (originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
                originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)) {
                // Nếu là refresh-token thất bại, logout
                if (originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)) {
                    authService.clearTokens();
                    tokenManager.stopAutoRefresh();
                    window.location.href = '/login';
                }
                // Với endpoint login, chỉ trả về lỗi để component xử lý
                return Promise.reject(error);
            }

            // Nếu đang refresh, đưa request vào queue
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        const token = authService.getAccessToken();
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Force refresh token
                const success = await tokenManager.forceRefresh();

                if (success) {
                    // Update token cho original request
                    const newToken = authService.getAccessToken();
                    if (newToken) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }

                    // Process queue
                    processQueue(null);
                    isRefreshing = false;

                    // Retry original request
                    return apiClient(originalRequest);
                } else {
                    throw new Error('Token refresh failed');
                }
            } catch (refreshError) {
                processQueue(error);
                isRefreshing = false;

                authService.clearTokens();
                tokenManager.stopAutoRefresh();
                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;