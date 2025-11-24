import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './eContractDashboard.css';

const EContractDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userInfo, setUserInfo] = useState({
        fullName: '',
        email: '',
    });

    useEffect(() => {
        // Load user info (auth is handled by EContractRoute)
        const fullName = localStorage.getItem('eContractFullName') || '';
        const email = localStorage.getItem('eContractEmail') || '';
        setUserInfo({ fullName, email });

        // Prevent back navigation - push current page to history
        window.history.pushState(null, '', location.pathname);

        const handlePopState = () => {
            // When user clicks back, push the current page again
            window.history.pushState(null, '', location.pathname);
        };

        // Listen to popstate event (browser back button)
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [location.pathname]);

    const handleLogout = () => {
        // Clear eContract session
        localStorage.removeItem('eContractAccessToken');
        localStorage.removeItem('eContractRefreshToken');
        localStorage.removeItem('eContractAccessTokenExpiry');
        localStorage.removeItem('eContractRefreshTokenExpiry');
        localStorage.removeItem('eContractUserId');
        localStorage.removeItem('eContractEmail');
        localStorage.removeItem('eContractFullName');
        localStorage.removeItem('eContractRoleId');

        // Redirect to eContract login
        navigate('/e-contract-login', { replace: true });
    };

    return (
        <div className="econtract-dashboard-page">
            <div className="econtract-dashboard-container">
                <div className="econtract-dashboard-header">
                    <h1 className="econtract-dashboard-title">eContract Dashboard</h1>
                    <button onClick={handleLogout} className="econtract-logout-btn">
                        Đăng xuất
                    </button>
                </div>

                <div className="econtract-dashboard-content">
                    <div className="econtract-welcome-card">
                        <h2>Chào mừng, {userInfo.fullName}!</h2>
                        <p>Email: {userInfo.email}</p>
                        <p className="econtract-dashboard-note">
                            Đây là trang eContract Dashboard. Nội dung sẽ được phát triển thêm.
                        </p>
                    </div>

                    <div className="econtract-features-grid">
                        <div className="econtract-feature-card">
                            <h3>📄 Hợp đồng điện tử</h3>
                            <p>Quản lý và ký hợp đồng điện tử</p>
                        </div>

                        <div className="econtract-feature-card">
                            <h3>📊 Báo cáo</h3>
                            <p>Xem báo cáo và thống kê</p>
                        </div>

                        <div className="econtract-feature-card">
                            <h3>⚙️ Cài đặt</h3>
                            <p>Cấu hình hệ thống eContract</p>
                        </div>

                        <div className="econtract-feature-card">
                            <h3>👥 Quản lý người dùng</h3>
                            <p>Quản lý tài khoản và phân quyền</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EContractDashboard;
