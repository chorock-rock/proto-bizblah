import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = ({ currentView, onViewChange }) => {
  const { currentUser, logout, getNickname } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleViewChange = (view) => {
    onViewChange(view);
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-logo">BIZBLAH</h1>
        <div className="header-user">
          {currentUser && (
            <>
              <div className="user-info">
                <span className="user-name">{getNickname()}</span>
              </div>
              <div className="menu-container" ref={menuRef}>
                <button 
                  className="hamburger-button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="메뉴"
                >
                  <span className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </button>
                {menuOpen && (
                  <div className="menu-dropdown">
                    <button 
                      className={`menu-item ${currentView === 'all' ? 'active' : ''}`}
                      onClick={() => handleViewChange('all')}
                    >
                      내 브랜드 게시판
                    </button>
                    <button 
                      className={`menu-item ${currentView === 'my' ? 'active' : ''}`}
                      onClick={() => handleViewChange('my')}
                    >
                      내가 쓴 글
                    </button>
                    <div className="menu-divider"></div>
                    <button className="menu-item logout-item" onClick={handleLogout}>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
