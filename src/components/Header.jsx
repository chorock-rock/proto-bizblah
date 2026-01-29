import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-logo">BIZBLAH</h1>
        <div className="header-user">
          {currentUser && (
            <>
              <div className="user-info">
                <img 
                  src={currentUser.photoURL || '/default-avatar.png'} 
                  alt="프로필" 
                  className="user-avatar"
                />
                <span className="user-name">{currentUser.displayName || '익명'}</span>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
