import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import authService from '../services/authService';
import tokenManager from '../services/tokenManager';

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Request interceptor - Thêm access token vào header
axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = authService.getAccessToken();

        // Không thêm token cho các endpoint public
        const publicEndpoints = ['/login', '/register', '/refresh-token'];
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

// Response interceptor - Xử lý lỗi 401 và refresh token
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Nếu là endpoint refresh-token bị 401, logout luôn
            if (originalRequest.url?.includes('/refresh-token')) {
                authService.clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            // Nếu đang refresh, đưa request vào queue
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    const token = authService.getAccessToken();
                    if (token && originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = authService.getRefreshToken();

                if (!refreshToken || authService.isRefreshTokenExpired()) {
                    throw new Error('No valid refresh token');
                }

                // Refresh token
                const response = await authService.refreshToken(refreshToken);
                authService.saveTokens(response);

                // Update token cho original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
                }

                // Process queue
                processQueue(null);

                isRefreshing = false;

                // Retry original request
                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(error);
                isRefreshing = false;

                // Clear tokens và redirect to login
                authService.clearTokens();
                tokenManager.stopAutoRefresh();
                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axios;