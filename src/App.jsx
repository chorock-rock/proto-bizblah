import { AuthProvider, useAuth } from './contexts/AuthContext';
import BrandSelection from './components/BrandSelection';
import Login from './components/Login';
import Header from './components/Header';
import MainContent from './components/MainContent';
import './App.css';

function AppContent() {
  const { currentUser, selectedBrand, selectBrand } = useAuth();

  // 브랜드 선택 단계
  if (!selectedBrand) {
    return <BrandSelection onSelect={selectBrand} />;
  }

  // 로그인 단계
  if (!currentUser) {
    return <Login />;
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
