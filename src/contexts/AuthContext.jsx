import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const BRAND_LABELS = {
  megacoffee: '메가커피',
  greenvillage: '초록마을',
  starbucks: '스타벅스',
  ediya: '이디야커피',
  twosome: '투썸플레이스',
  angelinus: '엔젤리너스',
  hollys: '할리스커피',
  paik: '빽다방',
  tomntoms: '탐앤탐스',
  other: '기타'
};

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(() => {
    // 로컬 스토리지에서 브랜드 정보 불러오기
    return localStorage.getItem('selectedBrand') || null;
  });
  const [loading, setLoading] = useState(true);

  // 브랜드 선택 저장
  const selectBrand = (brand) => {
    setSelectedBrand(brand);
    localStorage.setItem('selectedBrand', brand);
  };

  // Google 로그인
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await signOut(auth);
      // 로그아웃 시 브랜드 정보도 초기화
      setSelectedBrand(null);
      localStorage.removeItem('selectedBrand');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error;
    }
  };

  // 브랜드 이름 가져오기
  const getBrandLabel = () => {
    return selectedBrand ? BRAND_LABELS[selectedBrand] || '점주' : '점주';
  };

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    selectedBrand,
    selectBrand,
    signInWithGoogle,
    logout,
    getBrandLabel
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
