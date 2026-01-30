import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { loginAdmin } = useAdmin();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      if (loginAdmin(password.trim())) {
        navigate('/admin');
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('관리자 로그인 오류:', err);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1 className="admin-logo">BIZBLAH</h1>
          <p className="admin-subtitle">관리자 로그인</p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
