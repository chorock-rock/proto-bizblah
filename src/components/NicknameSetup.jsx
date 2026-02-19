import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './NicknameSetup.css';

const NicknameSetup = ({ onComplete }) => {
  const { currentUser, selectedBrand } = useAuth();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // s5j2d1r0 형식: 영문 한 글자 + 숫자 교차 (8자)
  const generateLetterNumberNickname = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += i % 2 === 0
        ? letters[Math.floor(Math.random() * letters.length)]
        : numbers[Math.floor(Math.random() * numbers.length)];
    }
    return result;
  };

  // 고유한 닉네임 생성 함수
  const generateUniqueNickname = async () => {
    setGenerating(true);
    setError('');

    try {
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        const generatedNickname = generateLetterNumberNickname();

        // 중복 확인
        const nicknameCheck = await getDoc(doc(db, 'nicknames', generatedNickname));
        
        if (!nicknameCheck.exists()) {
          setNickname(generatedNickname);
          setGenerating(false);
          return;
        }

        attempts++;
      }

      // 최대 시도 횟수 초과 시 패턴 확장 (s5j2d1r0x9)
      const base = generateLetterNumberNickname();
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      const generatedNickname = base + letters[Math.floor(Math.random() * 26)] + Math.floor(Math.random() * 10);
      
      setNickname(generatedNickname);
      setGenerating(false);
    } catch (err) {
      console.error('닉네임 생성 오류:', err);
      setError('닉네임 생성에 실패했습니다. 다시 시도해주세요.');
      setGenerating(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 닉네임 생성
  useEffect(() => {
    if (currentUser && !nickname && !generating) {
      generateUniqueNickname();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.trim().length < 2) {
      setError('닉네임은 2자 이상 입력해주세요.');
      return;
    }

    if (nickname.trim().length > 20) {
      setError('닉네임은 20자 이하로 입력해주세요.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // 닉네임 중복 확인
      const nicknameCheck = await getDoc(doc(db, 'nicknames', nickname.trim()));
      if (nicknameCheck.exists() && nicknameCheck.data().userId !== currentUser.uid) {
        setError('이미 사용 중인 닉네임입니다.');
        setLoading(false);
        return;
      }

      // 브랜드 이름 가져오기
      let brandName = '점주';
      if (selectedBrand) {
        try {
          const brandDoc = await getDoc(doc(db, 'brands', selectedBrand));
          if (brandDoc.exists()) {
            brandName = brandDoc.data().name;
          }
        } catch (error) {
          console.error('브랜드 정보 가져오기 오류:', error);
        }
      }

      // 사용자 프로필 저장
      await setDoc(doc(db, 'users', currentUser.uid), {
        nickname: nickname.trim(),
        brand: brandName,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      // 닉네임 인덱스 저장
      await setDoc(doc(db, 'nicknames', nickname.trim()), {
        userId: currentUser.uid,
        createdAt: new Date()
      }, { merge: true });

      onComplete();
    } catch (err) {
      console.error('닉네임 설정 오류:', err);
      setError('닉네임 설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nickname-setup-overlay">
      <div className="nickname-setup-modal">
        <div className="nickname-setup-header">
          <h2>닉네임 설정</h2>
          <p className="subtitle">커뮤니티에서 사용할 닉네임을 설정해주세요</p>
        </div>
        
        <form onSubmit={handleSubmit} className="nickname-setup-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder="2-20자 이내로 입력하세요"
                maxLength={20}
                disabled={loading || generating}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={generateUniqueNickname}
                disabled={loading || generating}
                className="generate-nickname-button"
              >
                🎲
              </button>
            </div>
            <p className="hint">닉네임은 게시글과 댓글에 표시됩니다. 자동 생성된 닉네임을 사용하거나 직접 입력할 수 있습니다.</p>
          </div>
          
          <button type="submit" className="submit-button" disabled={loading || generating || !nickname.trim()}>
            {loading ? '설정 중...' : '설정 완료'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NicknameSetup;
