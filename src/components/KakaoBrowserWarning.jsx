import { useState, useEffect } from 'react';
import './KakaoBrowserWarning.css';

const KakaoBrowserWarning = () => {
  const [isKakaoBrowser, setIsKakaoBrowser] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    // 카카오톡 브라우저 감지
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isKakao = /KAKAOTALK|KakaoTalk/i.test(userAgent);
    setIsKakaoBrowser(isKakao);
    
    // iOS 감지
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  const handleOpenExternalBrowser = () => {
    const currentUrl = window.location.href;
    
    if (isIOS) {
      // iOS에서는 window.open을 시도하고, 실패 시 URL 복사
      const opened = window.open(currentUrl, '_blank');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        // 팝업이 차단된 경우 URL 복사
        copyToClipboard(currentUrl);
      }
    } else {
      // Android에서는 intent 스킴 사용
      window.open(`intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;end`, '_blank');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 3000);
    } catch (err) {
      // 클립보드 API가 실패하면 fallback 방법 사용
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 3000);
      } catch (err) {
        console.error('URL 복사 실패:', err);
      }
      document.body.removeChild(textArea);
    }
  };

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
            onClick={handleOpenExternalBrowser}
          >
            {isIOS ? 'Safari로 열기' : '외부 브라우저로 열기'}
          </button>
          {isIOS && (
            <button 
              className="kakao-browser-warning-button secondary"
              onClick={() => copyToClipboard(window.location.href)}
            >
              {urlCopied ? 'URL 복사됨!' : 'URL 복사하기'}
            </button>
          )}
        </div>
        {urlCopied && (
          <p className="kakao-browser-warning-copied">
            URL이 복사되었습니다. Safari에서 주소창에 붙여넣어주세요.
          </p>
        )}
      </div>
    </div>
  );
};

export default KakaoBrowserWarning;
