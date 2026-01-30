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
    // 로컬 스토리지에서 브랜드 정보 불러오기 (로그인 전용)
    return localStorage.getItem('selectedBrand') || null;
  });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // 브랜드 선택 저장 (로그인 전에만 사용)
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
      // 로그아웃 시 프로필만 초기화, 브랜드는 로컬스토리지에 유지
      setUserProfile(null);
      // 로컬스토리지의 브랜드는 유지하여 다음 접속 시 브랜드 선택 화면 건너뛰기
      const savedBrand = localStorage.getItem('selectedBrand');
      if (savedBrand) {
        setSelectedBrand(savedBrand);
      } else {
        setSelectedBrand(null);
      }
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
      // 로그아웃 시가 아니면 로컬스토리지의 브랜드 유지
      const savedBrand = localStorage.getItem('selectedBrand');
      if (!savedBrand) {
        setSelectedBrand(null);
      }
      return;
    }

    try {
      setProfileLoading(true);
      const profileDoc = await getDoc(doc(db, 'users', userId));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        setUserProfile(profileData);
        
        // 프로필에 브랜드가 있으면 사용 (로그인 후 브랜드 고정)
        if (profileData.brand) {
          // 브랜드 값을 역으로 찾기
          const brandKey = Object.keys(BRAND_LABELS).find(
            key => BRAND_LABELS[key] === profileData.brand
          );
          if (brandKey) {
            setSelectedBrand(brandKey);
            // 로컬 스토리지에도 저장하여 다음 접속 시 브랜드 선택 화면 건너뛰기
            localStorage.setItem('selectedBrand', brandKey);
          }
        } else {
          // 프로필에 브랜드가 없으면 로컬스토리지의 브랜드 사용
          const savedBrand = localStorage.getItem('selectedBrand');
          if (savedBrand) {
            setSelectedBrand(savedBrand);
          }
        }
      } else {
        setUserProfile(null);
        // 프로필이 없어도 로컬스토리지의 브랜드 사용
        const savedBrand = localStorage.getItem('selectedBrand');
        if (savedBrand) {
          setSelectedBrand(savedBrand);
        }
      }
    } catch (error) {
      console.error('프로필 가져오기 오류:', error);
      setUserProfile(null);
      // 에러 발생 시에도 로컬스토리지의 브랜드 사용
      const savedBrand = localStorage.getItem('selectedBrand');
      if (savedBrand) {
        setSelectedBrand(savedBrand);
      }
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
        // 로그아웃 시 프로필 초기화, 브랜드는 로컬스토리지에서 유지
        setUserProfile(null);
        const savedBrand = localStorage.getItem('selectedBrand');
        if (savedBrand) {
          setSelectedBrand(savedBrand);
        }
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
