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
    if (currentUser && !profileLoading && !userProfile) {
      setShowNicknameSetup(true);
    } else if (userProfile) {
      setShowNicknameSetup(false);
    }
  }, [currentUser, userProfile, profileLoading]);

  const handleNicknameComplete = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    }
    setShowNicknameSetup(false);
  };

  // 브랜드 선택 단계
  if (!selectedBrand) {
    return <BrandSelection onSelect={selectBrand} />;
  }

  // 로그인 단계
  if (!currentUser) {
    return <Login />;
  }

  // 닉네임 설정 단계
  if (showNicknameSetup) {
    return <NicknameSetup onComplete={handleNicknameComplete} />;
  }

  // 메인 화면 (인사 + 게시판)
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
