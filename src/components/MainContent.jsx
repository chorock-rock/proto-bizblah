import { useAuth } from '../contexts/AuthContext';
import './MainContent.css';

const MainContent = () => {
  const { currentUser } = useAuth();

  return (
    <div className="main-content">
      <div className="container">
        <div className="welcome-section">
          <h2>환영합니다, {currentUser?.displayName || '익명'}님!</h2>
          <p>BIZBLAH 커뮤니티에 오신 것을 환영합니다.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>익명 게시판</h3>
            <p>자유롭게 의견을 나누고 정보를 공유하세요</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>안전한 공간</h3>
            <p>익명성을 보장하여 부담 없이 소통할 수 있습니다</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>점주 네트워크</h3>
            <p>같은 고민을 가진 점주들과 연결되세요</p>
          </div>
        </div>
        
        <div className="coming-soon">
          <p>더 많은 기능이 곧 추가될 예정입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
