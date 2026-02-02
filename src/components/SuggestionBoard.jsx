import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, analytics } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import './SuggestionBoard.css';

const SuggestionBoard = () => {
  const { currentUser, getNickname } = useAuth();
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'history'
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mySuggestions, setMySuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // 사용자 자신의 건의사항 목록 가져오기
  useEffect(() => {
    if (!currentUser || activeTab !== 'history') return;

    const suggestionsQuery = query(
      collection(db, 'suggestions'),
      where('authorId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    setLoadingSuggestions(true);
    const unsubscribe = onSnapshot(suggestionsQuery, (snapshot) => {
      const suggestionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || null
      }));
      setMySuggestions(suggestionsData);
      setLoadingSuggestions(false);
    }, (error) => {
      console.error('건의사항 구독 오류:', error);
      setLoadingSuggestions(false);
    });

    return () => unsubscribe();
  }, [currentUser, activeTab]);

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

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return { text: '검토 중', color: '#667eea' };
      case 'reviewed':
        return { text: '검토 완료', color: '#764ba2' };
      case 'resolved':
        return { text: '처리 완료', color: '#10b981' };
      default:
        return { text: '검토 중', color: '#667eea' };
    }
  };

  // 건의사항 상세 보기
  if (selectedSuggestion) {
    const statusInfo = getStatusLabel(selectedSuggestion.status);
    return (
      <div className="suggestion-board-container">
        <div className="suggestion-detail-view">
          <button className="back-button" onClick={() => setSelectedSuggestion(null)}>
            ← 목록으로
          </button>
          <div className="suggestion-detail-header">
            <div className="suggestion-detail-title-wrapper">
              <h2 className="suggestion-detail-title">{selectedSuggestion.title}</h2>
              <span 
                className="suggestion-status-badge"
                style={{ backgroundColor: statusInfo.color }}
              >
                {statusInfo.text}
              </span>
            </div>
            <div className="suggestion-detail-meta">
              <span>작성일: {formatDate(selectedSuggestion.createdAt)}</span>
              {selectedSuggestion.updatedAt && (
                <span>수정일: {formatDate(selectedSuggestion.updatedAt)}</span>
              )}
            </div>
          </div>
          <div className="suggestion-detail-content">
            {selectedSuggestion.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestion-board-container">
      <div className="suggestion-board-header">
        <h2 className="suggestion-board-title">건의하기</h2>
        <div className="suggestion-tabs">
          <button
            className={`suggestion-tab ${activeTab === 'write' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('write');
              setShowSuccess(false);
            }}
          >
            건의하기
          </button>
          <button
            className={`suggestion-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            내 건의내역
          </button>
        </div>
      </div>

      {activeTab === 'write' ? (
        showSuccess ? (
          /* 완료 메시지 */
          <div className="suggestion-success-section">
            <div className="success-icon-large">✓</div>
            <div className="success-message-large">건의가 완료되었습니다</div>
            <button 
              className="submit-button" 
              onClick={() => {
                setShowSuccess(false);
                setActiveTab('history');
              }}
              style={{ marginTop: '24px', width: 180 }}
            >
              내 건의내역 보기
            </button>
            <button 
              className="submit-button" 
              onClick={() => setShowSuccess(false)}
              style={{ marginTop: '12px', width: 180, background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            >
              다시 건의하기
            </button>
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
        )
      ) : (
        /* 내 건의내역 */
        <div className="suggestion-history-section">
          {loadingSuggestions ? (
            <div className="loading-state">로딩 중...</div>
          ) : mySuggestions.length === 0 ? (
            <div className="empty-state">
              <p>아직 제출한 건의사항이 없습니다.</p>
              <button 
                className="submit-button" 
                onClick={() => setActiveTab('write')}
                style={{ marginTop: '16px' }}
              >
                건의하기
              </button>
            </div>
          ) : (
            <div className="suggestion-list">
              {mySuggestions.map((suggestion) => {
                const statusInfo = getStatusLabel(suggestion.status);
                return (
                  <div 
                    key={suggestion.id} 
                    className="suggestion-item"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <div className="suggestion-item-header">
                      <div className="suggestion-item-title-wrapper">
                        <h3 className="suggestion-item-title">{suggestion.title}</h3>
                        <span 
                          className="suggestion-status-badge"
                          style={{ backgroundColor: statusInfo.color }}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                      <span className="suggestion-item-date">{formatDate(suggestion.createdAt)}</span>
                    </div>
                    <div className="suggestion-item-content">
                      {suggestion.content.length > 150 
                        ? suggestion.content.substring(0, 150) + '...' 
                        : suggestion.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestionBoard;
