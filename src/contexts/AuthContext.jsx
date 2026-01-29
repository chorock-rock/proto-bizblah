import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const [userProfile, setUserProfile] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(() => {
    // 로컬 스토리지에서 브랜드 정보 불러오기
    return localStorage.getItem('selectedBrand') || null;
  });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

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

  // 사용자 프로필 가져오기
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null);
      return;
    }

    try {
      setProfileLoading(true);
      const profileDoc = await getDoc(doc(db, 'users', userId));
      if (profileDoc.exists()) {
        setUserProfile(profileDoc.data());
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('프로필 가져오기 오류:', error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // 닉네임 가져오기
  const getNickname = () => {
    if (userProfile?.nickname) {
      return userProfile.nickname;
    }
    return '익명';
  };

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    selectedBrand,
    selectBrand,
    signInWithGoogle,
    logout,
    getBrandLabel,
    getNickname,
    fetchUserProfile,
    profileLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
