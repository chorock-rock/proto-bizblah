import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';
import BrandSelection from './components/BrandSelection';
import Login from './components/Login';
import Header from './components/Header';
import MainContent from './components/MainContent';
import NicknameSetup from './components/NicknameSetup';
import PostDetailPage from './components/PostDetailPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import BusinessNumberModal from './components/BusinessNumberModal';
import './App.css';

function AppContent() {
  const { currentUser, selectedBrand, selectBrand, userProfile, profileLoading, fetchUserProfile } = useAuth();
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [currentView, setCurrentView] = useState('all');
  const [showBusinessNumberModal, setShowBusinessNumberModal] = useState(false);

  useEffect(() => {
    if (currentUser && !profileLoading) {
      if (!userProfile) {
        // 프로필이 없으면 닉네임 설정
        setShowNicknameSetup(true);
      } else if (!userProfile.brand && selectedBrand) {
        // 프로필에 브랜드가 없지만 선택한 브랜드가 있으면 닉네임 설정
        setShowNicknameSetup(true);
      } else {
        setShowNicknameSetup(false);
      }
    }
  }, [currentUser, userProfile, profileLoading, selectedBrand]);

  const handleNicknameComplete = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    }
    setShowNicknameSetup(false);
  };

  const location = useLocation();
  const isPostDetailPage = location.pathname.startsWith('/post/');

  // 페이지뷰 추적
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: location.pathname,
        page_title: document.title
      });
    }
  }, [location.pathname]);

  // 스크롤 이벤트 감지
  useEffect(() => {
    if (!currentUser || !selectedBrand || profileLoading || showNicknameSetup || showBusinessNumberModal) {
      return;
    }

    // userProfile의 businessNumber 확인 (localStorage는 신뢰하지 않음)
    const isVerified = userProfile?.businessNumber;
    if (isVerified) {
      return; // 이미 검증됨
    }

    const handleScroll = () => {
      // 스크롤이 발생했고 아직 모달이 표시되지 않았으면
      if (!showBusinessNumberModal) {
        setShowBusinessNumberModal(true);
      }
    };

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [currentUser, selectedBrand, profileLoading, showNicknameSetup, showBusinessNumberModal, userProfile]);

  const handleBusinessNumberVerify = async (verified) => {
    if (verified) {
      setShowBusinessNumberModal(false);
      // 프로필 다시 불러오기
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      }
    }
  };

  return (
    <Routes>
      {/* 관리자 페이지 */}
      <Route 
        path="/admin/login" 
        element={<AdminLogin />} 
      />
      <Route 
        path="/admin/posts" 
        element={<AdminDashboard />} 
      />
      <Route 
        path="/admin/notices" 
        element={<AdminDashboard />} 
      />
      <Route 
        path="/admin/suggestions" 
        element={<AdminDashboard />} 
      />
      <Route 
        path="/admin" 
        element={<AdminDashboard />} 
      />
      
      {/* 게시글 상세 페이지 */}
      <Route 
        path="/post/:postId" 
        element={
          currentUser && selectedBrand ? (
            <PostDetailPage currentView={currentView} onViewChange={setCurrentView} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* 메인 앱 라우트 */}
      <Route
        path="/*"
        element={
          <>
            {/* 로그인한 사용자는 브랜드 선택 화면을 볼 수 없음 */}
            {!currentUser ? (
              !selectedBrand ? (
                <BrandSelection onSelect={selectBrand} />
              ) : (
                <Login />
              )
            ) : profileLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                로딩 중...
              </div>
            ) : showNicknameSetup ? (
              <NicknameSetup onComplete={handleNicknameComplete} />
            ) : !selectedBrand ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                로딩 중...
              </div>
            ) : (
              <>
                <Header currentView={currentView} onViewChange={setCurrentView} />
                <MainContent currentView={currentView} />
                {showBusinessNumberModal && (
                  <BusinessNumberModal
                    onVerify={handleBusinessNumberVerify}
                    onClose={() => setShowBusinessNumberModal(false)}
                  />
                )}
              </>
            )}
          </>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <AppContent />
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
