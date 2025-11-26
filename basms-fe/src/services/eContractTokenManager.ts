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
        console.log('eContract: Starting auto refresh...');
        this.stopAutoRefresh();
        this.scheduleNextRefresh();
    }

    // Dừng auto refresh
    stopAutoRefresh() {
        if (this.refreshTimer) {
            console.log('eContract: Stopping auto refresh...');
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // Lên lịch refresh tiếp theo
    private scheduleNextRefresh() {
        const accessTokenExpiry = localStorage.getItem('eContractAccessTokenExpiry');
        if (!accessTokenExpiry) {
            console.log('eContract: No access token expiry found');
            return;
        }

        const expiryTime = new Date(accessTokenExpiry).getTime();
        const now = new Date().getTime();

        // Refresh trước 5 phút (300000ms) khi token hết hạn
        const refreshTime = expiryTime - now - 300000;

        console.log('eContract: Token expires at:', new Date(expiryTime).toLocaleString());
        console.log('eContract: Will refresh in:', Math.max(0, refreshTime / 1000 / 60), 'minutes');

        // Nếu token sắp hết hạn hoặc đã hết hạn, refresh ngay
        if (refreshTime <= 0) {
            console.log('eContract: Token expiring soon, refreshing now...');
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
            console.log('eContract: Refreshing access token...');
            const refreshToken = eContractAuthService.getRefreshToken();

            if (!refreshToken) {
                console.log('eContract: No refresh token found, logging out...');
                this.handleLogout();
                return;
            }

            // Kiểm tra refresh token còn hạn không
            if (eContractAuthService.isRefreshTokenExpired()) {
                console.log('eContract: Refresh token expired, logging out...');
                this.handleLogout();
                return;
            }

            const response = await eContractAuthService.refreshToken(refreshToken);

            // Lưu tokens mới
            eContractAuthService.saveTokens(response);

            console.log('eContract: Token refreshed successfully');

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
        console.log('eContract: Handling logout...');
        this.stopAutoRefresh();
        eContractAuthService.clearTokens();

        if (this.onLogout) {
            this.onLogout();
        }
    }

    // Force refresh ngay lập tức
    async forceRefresh(): Promise<boolean> {
        try {
            console.log('eContract: Force refreshing token...');
            const refreshToken = eContractAuthService.getRefreshToken();

            if (!refreshToken || eContractAuthService.isRefreshTokenExpired()) {
                console.log('eContract: Cannot force refresh, invalid refresh token');
                this.handleLogout();
                return false;
            }

            const response = await eContractAuthService.refreshToken(refreshToken);
            eContractAuthService.saveTokens(response);
            this.scheduleNextRefresh();

            console.log('eContract: Force refresh successful');
            return true;
        } catch (error) {
            console.error('eContract: Force refresh failed:', error);
            this.handleLogout();
            return false;
        }
    }
}

export default new EContractTokenManager();
