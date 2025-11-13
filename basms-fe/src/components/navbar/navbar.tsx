import { useNavigate } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-text">Hệ thống quản lý bảo vệ</span>
        </div>

        <div className="navbar-right">
          <button className="login-button" onClick={() => navigate('/login')}>
            Đăng nhập
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

