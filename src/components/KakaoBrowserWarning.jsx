import { useState, useEffect } from 'react';
import './KakaoBrowserWarning.css';

const KakaoBrowserWarning = () => {
  const [isKakaoBrowser, setIsKakaoBrowser] = useState(false);

  useEffect(() => {
    // 카카오톡 브라우저 감지
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isKakao = /KAKAOTALK|KakaoTalk/i.test(userAgent);
    setIsKakaoBrowser(isKakao);
  }, []);

  if (!isKakaoBrowser) {
    return null;
  }

  return (
    <div className="kakao-browser-warning-overlay">
      <div className="kakao-browser-warning-modal">
        <div className="kakao-browser-warning-icon">⚠️</div>
        <h2 className="kakao-browser-warning-title">카카오톡 브라우저로 접속하셨습니다</h2>
        <p className="kakao-browser-warning-message">
          원활한 서비스 이용을 위해 다른 브라우저로 접속해주세요.
        </p>
        <p className="kakao-browser-warning-submessage">
          Chrome, Safari, Edge 등의 브라우저를 사용해주시기 바랍니다.
        </p>
        <div className="kakao-browser-warning-buttons">
          <button 
            className="kakao-browser-warning-button"
            onClick={() => {
              // 외부 브라우저로 열기 시도
              const currentUrl = window.location.href;
              window.open(`intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;end`, '_blank');
            }}
          >
            외부 브라우저로 열기
          </button>
        </div>
      </div>
    </div>
  );
};

export default KakaoBrowserWarning;
