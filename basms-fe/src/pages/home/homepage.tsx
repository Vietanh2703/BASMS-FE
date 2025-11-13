import Navbar from '../../components/navbar/navbar';
import './homepage.css';

const HomePage = () => {
    return (
        <div className="homepage-container">
            <Navbar />

            <main className="homepage-main">
                <h1 className="welcome-text">
                    Chào mừng đến hệ thống quản lý bảo vệ
                </h1>
            </main>

            <footer className="homepage-footer">
                <p>&copy; 2025 BASMS. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;
