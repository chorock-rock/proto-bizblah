import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';
import { useSEO } from './hooks/useSEO';
import BrandSelection from './components/BrandSelection';
import Login from './components/Login';
import Header from './components/Header';
import MainContent from './components/MainContent';
import NicknameSetup from './components/NicknameSetup';
import PostDetailPage from './components/PostDetailPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import BusinessNumberModal from './components/BusinessNumberModal';
import Welcome from './components/Welcome';
import './App.css';

function AppContent() {
  const { currentUser, selectedBrand, selectBrand, userProfile, profileLoading, fetchUserProfile } = useAuth();
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [currentView, setCurrentView] = useState('all');
  const [showBusinessNumberModal, setShowBusinessNumberModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (currentUser && !profileLoading) {
      if (!userProfile) {
        // 프로필이 없을 때: 브랜드가 있으면 닉네임 설정, 없으면 브랜드 선택 화면 표시
        if (selectedBrand) {
          setShowNicknameSetup(true);
        } else {
          setShowNicknameSetup(false);
        }
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
  const isAdminPage = location.pathname.startsWith('/admin');

  // SEO 설정
  useSEO({
    title: isAdminPage ? '관리자 페이지' : isPostDetailPage ? '게시글 상세' : '홈',
    description: isAdminPage 
      ? '비즈블라 관리자 페이지'
      : isPostDetailPage 
      ? '자영업자 커뮤니티 게시글을 확인하세요.'
      : '자영업자를 위한 익명 커뮤니티. 안전하고 자유로운 소통 공간에서 정보를 공유하고 네트워킹하세요.',
    url: location.pathname
  });

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

  const handleWelcomeStart = () => {
    setShowWelcome(false);
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
            {/* 웰컴 화면 표시 (최초 방문 시) */}
            {showWelcome && !currentUser ? (
              <Welcome onStart={handleWelcomeStart} />
            ) : !currentUser ? (
              !selectedBrand ? (
                <BrandSelection onSelect={selectBrand} />
              ) : (
                <Login />
              )
            ) : profileLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                로딩 중...
              </div>
            ) : !selectedBrand ? (
              // 로그인했지만 브랜드가 없으면 브랜드 선택 화면 표시
              <BrandSelection onSelect={selectBrand} />
            ) : showNicknameSetup ? (
              <NicknameSetup onComplete={handleNicknameComplete} />
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
