import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import './AdminSuggestions.css';

const AdminSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    // 모든 건의 실시간 구독
    const suggestionsQuery = query(
      collection(db, 'suggestions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(suggestionsQuery, (snapshot) => {
      const suggestionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setSuggestions(suggestionsData);
      setLoading(false);
    }, (error) => {
      console.error('건의 구독 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (suggestionId, newStatus) => {
    try {
      setUpdatingStatus(suggestionId);
      await updateDoc(doc(db, 'suggestions', suggestionId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (date) => {
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
        return { text: '검토 중', color: '#ED4E39' };
      case 'reviewed':
        return { text: '검토 완료', color: '#764ba2' };
      case 'resolved':
        return { text: '처리 완료', color: '#10b981' };
      default:
        return { text: '검토 중', color: '#ED4E39' };
    }
  };

  if (selectedSuggestion) {
    const statusInfo = getStatusLabel(selectedSuggestion.status);
    return (
      <div className="admin-suggestions">
        <div className="admin-suggestion-detail">
          <button className="back-button" onClick={() => setSelectedSuggestion(null)}>
            ← 목록으로
          </button>
          <div className="suggestion-detail-header">
            <h2 className="suggestion-detail-title">{selectedSuggestion.title}</h2>
            <div className="suggestion-detail-meta">
              <span>작성자: {selectedSuggestion.authorName}</span>
              <span>{formatDate(selectedSuggestion.createdAt)}</span>
            </div>
          </div>
          <div className="suggestion-detail-content">
            {selectedSuggestion.content}
          </div>
          <div className="suggestion-detail-actions">
            <label className="status-label">상태 변경:</label>
            <select
              className="status-select"
              value={selectedSuggestion.status}
              onChange={(e) => handleStatusChange(selectedSuggestion.id, e.target.value)}
              disabled={updatingStatus === selectedSuggestion.id}
            >
              <option value="pending">검토 중</option>
              <option value="reviewed">검토 완료</option>
              <option value="resolved">처리 완료</option>
            </select>
            {updatingStatus === selectedSuggestion.id && (
              <span className="updating-text">저장 중...</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-suggestions">
      <div className="admin-suggestions-section">
        <h2 className="section-title">건의 관리</h2>
        
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">건의가 없습니다.</div>
        ) : (
          <div className="admin-suggestions-list">
            {suggestions.map((suggestion) => {
              const statusInfo = getStatusLabel(suggestion.status);
              return (
                <div 
                  key={suggestion.id} 
                  className="admin-suggestion-item"
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <div className="admin-suggestion-header">
                    <div className="admin-suggestion-title-wrapper">
                      <h3 className="admin-suggestion-title">{suggestion.title}</h3>
                      <span 
                        className="admin-suggestion-status"
                        style={{ color: statusInfo.color }}
                      >
                        {statusInfo.text}
                      </span>
                    </div>
                    <span className="admin-suggestion-date">{formatDate(suggestion.createdAt)}</span>
                  </div>
                  <div className="admin-suggestion-content">
                    {suggestion.content.length > 100 
                      ? suggestion.content.substring(0, 100) + '...' 
                      : suggestion.content}
                  </div>
                  <div className="admin-suggestion-footer">
                    <span className="admin-suggestion-author">작성자: {suggestion.authorName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSuggestions;
