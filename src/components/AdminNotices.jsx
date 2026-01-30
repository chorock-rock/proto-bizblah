import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import AdminNoticeWrite from './AdminNoticeWrite';
import './AdminNotices.css';

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [deletingNoticeId, setDeletingNoticeId] = useState(null);

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

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingNoticeId(noticeId);
      await deleteDoc(doc(db, 'notices', noticeId));
      alert('공지사항이 삭제되었습니다.');
    } catch (error) {
      console.error('공지사항 삭제 오류:', error);
      alert('공지사항 삭제에 실패했습니다.');
    } finally {
      setDeletingNoticeId(null);
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

  return (
    <div className="admin-notices">
      <div className="admin-notices-header">
        <h2 className="section-title">공지사항 관리</h2>
        <button 
          className="admin-write-button"
          onClick={() => setShowWriteModal(true)}
        >
          공지사항 작성
        </button>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : notices.length === 0 ? (
        <div className="empty-state">공지사항이 없습니다.</div>
      ) : (
        <div className="admin-notices-list">
          {notices.map((notice) => (
            <div key={notice.id} className="admin-notice-item">
              <div className="admin-notice-header">
                <h3 className="admin-notice-title">{notice.title}</h3>
                <span className="admin-notice-date">{formatDate(notice.createdAt)}</span>
              </div>
              <div className="admin-notice-content">{notice.content}</div>
              <div className="admin-notice-footer">
                <div className="admin-notice-meta">
                  <span>조회: {notice.views || 0}</span>
                </div>
                <button
                  className="admin-delete-button"
                  onClick={() => handleDeleteNotice(notice.id)}
                  disabled={deletingNoticeId === notice.id}
                >
                  {deletingNoticeId === notice.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showWriteModal && (
        <AdminNoticeWrite
          onClose={() => setShowWriteModal(false)}
          onSuccess={() => {
            // 공지사항 작성 성공 시 모달 닫기
          }}
        />
      )}
    </div>
  );
};

export default AdminNotices;
