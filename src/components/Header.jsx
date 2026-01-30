import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = ({ currentView, onViewChange }) => {
  const { currentUser, logout, getNickname, getBrandLabel } = useAuth();
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

  // 메뉴 외부 클릭 시 닫기 (딤 오버레이 클릭)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
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
                <span className="user-brand">{getBrandLabel()}</span>
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
                  <>
                    <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
                    <div className="menu-sidebar">
                      <button 
                        className={`menu-item ${currentView === 'all' ? 'active' : ''}`}
                        onClick={() => handleViewChange('all')}
                      >
                        홈
                      </button>
                      <button 
                        className={`menu-item ${currentView === 'my' ? 'active' : ''}`}
                        onClick={() => handleViewChange('my')}
                      >
                        내가 쓴 글
                      </button>
                      <button 
                        className={`menu-item ${currentView === 'notices' ? 'active' : ''}`}
                        onClick={() => handleViewChange('notices')}
                      >
                        공지사항
                      </button>
                      <button 
                        className={`menu-item ${currentView === 'suggestions' ? 'active' : ''}`}
                        onClick={() => handleViewChange('suggestions')}
                      >
                        건의하기
                      </button>
                      <div className="menu-divider"></div>
                      <button className="menu-item logout-item" onClick={handleLogout}>
                        로그아웃
                      </button>
                    </div>
                  </>
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
