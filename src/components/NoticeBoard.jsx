import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import './NoticeBoard.css';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    // 공지사항 실시간 구독
    const noticesQuery = query(
      collection(db, 'notices'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(noticesQuery, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setNotices(noticesData);
      setLoading(false);
    }, (error) => {
      console.error('공지사항 구독 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNoticeClick = async (notice) => {
    setSelectedNotice(notice);
    
    // 조회수 증가
    try {
      const noticeRef = doc(db, 'notices', notice.id);
      await updateDoc(noticeRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('조회수 증가 오류:', error);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="notice-board-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (selectedNotice) {
    return (
      <div className="notice-board-container">
        <div className="notice-detail">
          <div className="notice-detail-header">
            <button className="back-button" onClick={() => setSelectedNotice(null)}>
              ← 목록으로
            </button>
            <h2 className="notice-detail-title">{selectedNotice.title}</h2>
            <div className="notice-detail-meta">
              <span>{formatDate(selectedNotice.createdAt)}</span>
              <span>조회: {selectedNotice.views || 0}</span>
            </div>
          </div>
          <div className="notice-detail-content">
            {selectedNotice.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notice-board-container">
      <div className="notice-board-header">
        <h2 className="notice-board-title">공지사항</h2>
      </div>
      
      {notices.length === 0 ? (
        <div className="empty-notices">
          <p>공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="notices-list">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className="notice-item"
              onClick={() => handleNoticeClick(notice)}
            >
              <div className="notice-item-header">
                <h3 className="notice-item-title">{notice.title}</h3>
                <span className="notice-item-date">{formatDate(notice.createdAt)}</span>
              </div>
              <div className="notice-item-preview">
                {notice.content.length > 100 
                  ? notice.content.substring(0, 100) + '...' 
                  : notice.content}
              </div>
              <div className="notice-item-footer">
                <span className="notice-item-views">조회: {notice.views || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
