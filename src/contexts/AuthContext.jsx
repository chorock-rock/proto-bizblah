import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

  // 회원탈퇴
  const deleteAccount = async () => {
    try {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = currentUser.uid;
      
      // Firestore에서 사용자 프로필 삭제
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 닉네임 삭제
        if (userData.nickname) {
          const nicknameDocRef = doc(db, 'nicknames', userData.nickname);
          await deleteDoc(nicknameDocRef);
        }
        
        // 사용자 프로필 삭제
        await deleteDoc(userDocRef);
      }

      // Firebase Auth에서 계정 삭제
      await deleteUser(currentUser);
      
      // 로컬스토리지 초기화
      localStorage.removeItem('selectedBrand');
      setSelectedBrand(null);
      setUserProfile(null);
    } catch (error) {
      console.error('회원탈퇴 오류:', error);
      throw error;
    }
  };

  // 브랜드 이름 가져오기 (userProfile 우선 사용)
  const getBrandLabel = () => {
    // userProfile에 브랜드가 있으면 우선 사용
    if (userProfile?.brand) {
      return userProfile.brand;
    }
    
    // userProfile이 없거나 브랜드가 없으면 '점주' 반환
    // (selectedBrand는 브랜드 ID이므로 직접 사용 불가)
    return '점주';
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
          // 브랜드 이름으로 브랜드 ID 찾기
          try {
            const brandNameLower = profileData.brand.toLowerCase();
            const brandsQuery = query(
              collection(db, 'brands'),
              where('nameLower', '==', brandNameLower),
              where('isActive', '==', true)
            );
            const brandsSnapshot = await getDocs(brandsQuery);
            
            if (!brandsSnapshot.empty) {
              const brandId = brandsSnapshot.docs[0].id;
              setSelectedBrand(brandId);
              localStorage.setItem('selectedBrand', brandId);
            } else {
              // 브랜드를 찾을 수 없으면 null로 설정
              setSelectedBrand(null);
              localStorage.removeItem('selectedBrand');
            }
          } catch (error) {
            console.error('브랜드 ID 찾기 오류:', error);
            setSelectedBrand(null);
            localStorage.removeItem('selectedBrand');
          }
        } else {
          // 프로필에 브랜드가 없으면 로그인 전에 선택한 브랜드 유지
          const savedBrand = localStorage.getItem('selectedBrand');
          if (!savedBrand) {
            setSelectedBrand(null);
          } else {
            // 로그인 전에 선택한 브랜드가 있으면 유지
            setSelectedBrand(savedBrand);
          }
        }
      } else {
        // 프로필이 없으면 로그인 전에 선택한 브랜드 유지
        setUserProfile(null);
        const savedBrand = localStorage.getItem('selectedBrand');
        if (!savedBrand) {
          setSelectedBrand(null);
        } else {
          // 로그인 전에 선택한 브랜드가 있으면 유지
          setSelectedBrand(savedBrand);
        }
      }
    } catch (error) {
      console.error('프로필 가져오기 오류:', error);
      setUserProfile(null);
      // 에러 발생 시에도 로그인 전에 선택한 브랜드 유지
      const savedBrand = localStorage.getItem('selectedBrand');
      if (!savedBrand) {
        setSelectedBrand(null);
      } else {
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
    deleteAccount,
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
