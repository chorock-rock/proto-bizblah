import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BrandSelection from './components/BrandSelection';
import Login from './components/Login';
import Header from './components/Header';
import MainContent from './components/MainContent';
import NicknameSetup from './components/NicknameSetup';
import PostDetailPage from './components/PostDetailPage';
import './App.css';

function AppContent() {
  const { currentUser, selectedBrand, selectBrand, userProfile, profileLoading, fetchUserProfile } = useAuth();
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [currentView, setCurrentView] = useState('all');

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

  return (
    <Routes>
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;
