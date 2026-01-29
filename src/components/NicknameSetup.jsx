import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './NicknameSetup.css';

const NicknameSetup = ({ onComplete }) => {
  const { currentUser, getBrandLabel } = useAuth();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      // 사용자 프로필 저장
      await setDoc(doc(db, 'users', currentUser.uid), {
        nickname: nickname.trim(),
        brand: getBrandLabel(),
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
              disabled={loading}
              autoFocus
            />
            <p className="hint">닉네임은 게시글과 댓글에 표시됩니다.</p>
          </div>
          
          <button type="submit" className="submit-button" disabled={loading || !nickname.trim()}>
            {loading ? '설정 중...' : '설정 완료'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NicknameSetup;
