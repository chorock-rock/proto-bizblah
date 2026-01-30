import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BrandSelection from './components/BrandSelection';
import Login from './components/Login';
import Header from './components/Header';
import MainContent from './components/MainContent';
import NicknameSetup from './components/NicknameSetup';
import './App.css';

function AppContent() {
  const { currentUser, selectedBrand, selectBrand, userProfile, profileLoading, fetchUserProfile } = useAuth();
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);

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

  // 로그인한 사용자는 브랜드 선택 화면을 볼 수 없음
  // 로그인 전에만 브랜드 선택 가능
  if (!currentUser) {
    if (!selectedBrand) {
      return <BrandSelection onSelect={selectBrand} />;
    }
    return <Login />;
  }

  // 로그인 후 프로필 로딩 중
  if (profileLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>로딩 중...</div>;
  }

  // 닉네임 설정 단계
  if (showNicknameSetup) {
    return <NicknameSetup onComplete={handleNicknameComplete} />;
  }

  // 브랜드가 없으면 대기 (프로필에서 브랜드를 가져오는 중)
  if (!selectedBrand) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>로딩 중...</div>;
  }

  // 메인 화면
  return (
    <>
      <Header />
      <MainContent />
    </>
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
