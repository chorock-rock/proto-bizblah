import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';
import './Login.css';

const Login = () => {
  const { signInWithGoogle, selectedBrand, getBrandLabel, selectBrand } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReselectBrand = () => {
    selectBrand(null);
    localStorage.removeItem('selectedBrand');
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      
      // 로그인 성공 이벤트 추적
      if (analytics) {
        logEvent(analytics, 'login', {
          method: 'google',
          brand: selectedBrand || 'unknown'
        });
      }
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
      
      // 로그인 실패 이벤트 추적
      if (analytics) {
        logEvent(analytics, 'login_failure', {
          method: 'google',
          error: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-content">
          <h1 className="login-greeting">
            {selectedBrand ? `${getBrandLabel()} 점주님, 안녕하세요.` : '점주님, 안녕하세요.'}
          </h1>
          
          <p className="login-description">
            Google 계정으로 간편하게 로그인하고<br />
            익명 커뮤니티를 시작해보세요.
          </p>
          
          {selectedBrand && (
            <button 
              className="reselect-brand-button"
              onClick={handleReselectBrand}
              type="button"
            >
              브랜드 다시 선택하기
            </button>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            className="google-signin-button"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <span>로그인 중...</span>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google로 로그인</span>
              </>
            )}
          </button>
          
          <p className="privacy-note">
            로그인 시 개인정보 처리방침 및 이용약관에 동의한 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
