import eContractAuthService from './eContractAuthService';

class EContractTokenManager {
    private refreshTimer: number | null = null;
    private onTokenRefreshed?: () => void;
    private onLogout?: () => void;

    // Đăng ký callback
    setCallbacks(
        onTokenRefreshed?: () => void,
        onLogout?: () => void
    ) {
        this.onTokenRefreshed = onTokenRefreshed;
        this.onLogout = onLogout;
    }

    // Bắt đầu auto refresh
    startAutoRefresh() {
        this.stopAutoRefresh();
        this.scheduleNextRefresh();
    }

    // Dừng auto refresh
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // Lên lịch refresh tiếp theo
    private scheduleNextRefresh() {
        const accessTokenExpiry = localStorage.getItem('eContractAccessTokenExpiry');
        if (!accessTokenExpiry) {
            return;
        }

        const expiryTime = new Date(accessTokenExpiry).getTime();
        const now = new Date().getTime();

        // Refresh trước 5 phút (300000ms) khi token hết hạn
        const refreshTime = expiryTime - now - 300000;

        // Nếu token sắp hết hạn hoặc đã hết hạn, refresh ngay
        if (refreshTime <= 0) {
            this.refreshAccessToken();
        } else {
            // Lên lịch refresh
            this.refreshTimer = window.setTimeout(() => {
                this.refreshAccessToken();
            }, refreshTime);
        }
    }

    // Refresh access token
    private async refreshAccessToken() {
        try {
            const refreshToken = eContractAuthService.getRefreshToken();

            if (!refreshToken) {
                this.handleLogout();
                return;
            }

            // Kiểm tra refresh token còn hạn không
            if (eContractAuthService.isRefreshTokenExpired()) {
                this.handleLogout();
                return;
            }

            const response = await eContractAuthService.refreshToken(refreshToken);

            // Lưu tokens mới
            eContractAuthService.saveTokens(response);

            // Callback
            if (this.onTokenRefreshed) {
                this.onTokenRefreshed();
            }

            // Lên lịch refresh tiếp theo
            this.scheduleNextRefresh();
        } catch (error) {
            console.error('eContract: Failed to refresh token:', error);
            this.handleLogout();
        }
    }

    // Xử lý logout
    private handleLogout() {
        this.stopAutoRefresh();
        eContractAuthService.clearTokens();

        if (this.onLogout) {
            this.onLogout();
        }
    }

    // Force refresh ngay lập tức
    async forceRefresh(): Promise<boolean> {
        try {
            const refreshToken = eContractAuthService.getRefreshToken();

            if (!refreshToken || eContractAuthService.isRefreshTokenExpired()) {
                this.handleLogout();
                return false;
            }

            const response = await eContractAuthService.refreshToken(refreshToken);
            eContractAuthService.saveTokens(response);
            this.scheduleNextRefresh();

            return true;
        } catch (error) {
            console.error('eContract: Force refresh failed:', error);
            this.handleLogout();
            return false;
        }
    }
}

export default new EContractTokenManager();
