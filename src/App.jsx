import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import MainContent from './components/MainContent';
import './App.css';

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser ? (
        <>
          <Header />
          <MainContent />
        </>
      ) : (
        <Login />
      )}
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
