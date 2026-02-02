import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './NicknameSetup.css';

const NicknameSetup = ({ onComplete }) => {
  const { currentUser, getBrandLabel } = useAuth();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // 닉네임 생성용 영어 단어 목록 (다양한 랜덤 단어)
  const words = [
    'zap', 'blip', 'flip', 'snap', 'pop', 'bop', 'hop', 'zip',
    'wiz', 'buzz', 'fizz', 'jazz', 'jolt', 'bolt', 'volt', 'zest',
    'blink', 'twink', 'spark', 'flash', 'dash', 'crash', 'smash', 'splash',
    'zoom', 'boom', 'doom', 'gloom', 'bloom', 'room', 'loom', 'broom',
    'chip', 'clip', 'flip', 'grip', 'skip', 'slip', 'trip', 'whip',
    'blob', 'glob', 'slob', 'snob', 'knob', 'mob', 'rob', 'sob',
    'flap', 'clap', 'slap', 'snap', 'trap', 'wrap', 'scrap', 'strap',
    'blink', 'clink', 'drink', 'link', 'pink', 'sink', 'think', 'wink',
    'blot', 'clot', 'plot', 'slot', 'spot', 'tot', 'dot', 'hot',
    'blur', 'slur', 'spur', 'stir', 'fir', 'sir', 'fur', 'purr',
    'blip', 'clip', 'dip', 'flip', 'grip', 'hip', 'lip', 'rip',
    'blob', 'cob', 'gob', 'job', 'lob', 'mob', 'rob', 'sob',
    'blot', 'clot', 'dot', 'got', 'hot', 'jot', 'lot', 'not',
    'blur', 'cur', 'fur', 'her', 'purr', 'sir', 'stir', 'whir',
    'blip', 'dip', 'flip', 'grip', 'hip', 'kip', 'lip', 'nip',
    'blob', 'cob', 'gob', 'job', 'lob', 'mob', 'rob', 'sob'
  ];

  // 고유한 닉네임 생성 함수
  const generateUniqueNickname = async () => {
    setGenerating(true);
    setError('');

    try {
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        // 영어 단어 + 숫자 조합
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomNumber = Math.floor(Math.random() * 9999) + 1;
        const generatedNickname = `${randomWord}${randomNumber}`;

        // 중복 확인
        const nicknameCheck = await getDoc(doc(db, 'nicknames', generatedNickname));
        
        if (!nicknameCheck.exists()) {
          setNickname(generatedNickname);
          setGenerating(false);
          return;
        }

        attempts++;
      }

      // 최대 시도 횟수 초과 시 타임스탬프 추가
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const timestamp = Date.now().toString().slice(-6);
      const generatedNickname = `${randomWord}${timestamp}`;
      
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
