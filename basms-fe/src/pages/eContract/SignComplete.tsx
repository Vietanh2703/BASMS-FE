import './SignComplete.css';

const SignComplete = () => {
    return (
        <div className="sc-container">
            <header className="sc-header">
                <div className="sc-header-content">
                    <div className="sc-logo">
                        <div className="sc-logo-icon">E</div>
                        <span className="sc-logo-text">eContract</span>
                    </div>
                    <h1 className="sc-header-title">Hệ thống ký hợp đồng điện tử</h1>
                </div>
            </header>

            <main className="sc-main">
                <div className="sc-success-container">
                    <div className="sc-success-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div className="sc-success-title">Ký hợp đồng thành công!</div>
                    <div className="sc-success-message">Hợp đồng đã được ký và lưu thành công. Bạn có thể đóng trang này.</div>
                </div>
            </main>
        </div>
    );
};

export default SignComplete;
