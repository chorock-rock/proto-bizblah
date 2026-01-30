import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, analytics } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import './SuggestionBoard.css';

const SuggestionBoard = () => {
  const { currentUser, getNickname } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('건의사항을 입력해주세요.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);

      const docRef = await addDoc(collection(db, 'suggestions'), {
        title: '건의사항', // 제목 없이 내용만 저장하므로 기본 제목 사용
        content: content.trim(),
        authorId: currentUser.uid,
        authorName: getNickname(),
        status: 'pending',
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 건의 작성 이벤트 추적
      if (analytics) {
        logEvent(analytics, 'suggestion_create', {
          suggestion_id: docRef.id
        });
      }

      setContent('');
      setShowSuccess(true);
    } catch (err) {
      console.error('건의 작성 오류:', err);
      setError('건의 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="suggestion-board-container">
      <div className="suggestion-board-header">
        <h2 className="suggestion-board-title">건의하기</h2>
      </div>

      {showSuccess ? (
        /* 완료 메시지 */
        <div className="suggestion-success-section">
          <div className="success-icon-large">✓</div>
          <div className="success-message-large">건의가 완료되었습니다</div>
        </div>
      ) : (
        /* 건의 작성 폼 */
        <div className="suggestion-write-section">
          <form onSubmit={handleSubmit} className="suggestion-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="건의사항을 입력하세요"
                rows={8}
                disabled={submitting}
                className="suggestion-textarea"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={submitting || !content.trim()}
              >
                {submitting ? '작성 중...' : '건의하기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SuggestionBoard;
