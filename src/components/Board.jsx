import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import PostWrite from './PostWrite';
import './Board.css';

const Board = ({ filter = 'all' }) => {
  const { currentUser, getBrandLabel, selectedBrand } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);

  useEffect(() => {
    if (!currentUser && filter === 'my') {
      setPosts([]);
      setLoading(false);
      return;
    }

    if (!selectedBrand && filter === 'all') {
      setPosts([]);
      setLoading(false);
      return;
    }

    // 게시글 실시간 구독
    let postsQuery;
    if (filter === 'my' && currentUser) {
      // 내가 쓴 글만 필터링
      postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      // 내 브랜드 게시글만 필터링
      const brandLabel = getBrandLabel();
      
      if (!brandLabel || brandLabel === '점주') {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      postsQuery = query(
        collection(db, 'posts'),
        where('authorBrand', '==', brandLabel),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('게시글 구독 오류:', error);
      // 인덱스 오류인 경우 사용자에게 안내
      if (error.code === 'failed-precondition') {
        const errorMessage = error.message || '';
        const indexUrlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        
        if (indexUrlMatch) {
          const indexUrl = indexUrlMatch[0];
          const shouldCreate = window.confirm(
            'Firestore 인덱스가 필요합니다.\n\n' +
            '인덱스를 생성하시겠습니까? (새 창이 열립니다)\n\n' +
            '또는 수동으로 Firebase Console > Firestore Database > Indexes에서 생성할 수 있습니다.'
          );
          
          if (shouldCreate) {
            window.open(indexUrl, '_blank');
          }
        } else {
          alert(
            'Firestore 인덱스가 필요합니다.\n\n' +
            'Firebase Console > Firestore Database > Indexes에서 다음 인덱스를 생성해주세요:\n\n' +
            'Collection: posts\n' +
            'Fields: authorBrand (Ascending), createdAt (Descending)'
          );
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, currentUser, selectedBrand]);

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

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    <>
      <div className="board-container">
        <div className="board-content">
          {loading ? (
            <div className="empty-board">
              <p>로딩 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-board">
              <p>
                {filter === 'my' 
                  ? '작성한 게시글이 없습니다.' 
                  : '아직 게시글이 없습니다.'
                }
              </p>
              {filter === 'all' && (
                <p>첫 번째 게시글을 작성해보세요!</p>
              )}
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="post-item"
                  onClick={() => handlePostClick(post.id)}
                >
                  <div className="post-header">
                    <h3 className="post-title">{post.title}</h3>
                    <span className="post-date">{formatDate(post.createdAt)}</span>
                  </div>
                  <p className="post-content">{post.content}</p>
                  <div className="post-footer">
                    <span className="post-author">{post.authorBrand} {post.authorName}</span>
                    <div className="post-stats">
                      <span className="post-likes">❤️ {post.likes || 0}</span>
                      <span className="post-comments">💬 {post.commentsCount || 0}</span>
                      <span className="post-views">👁️ {post.views || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showWriteModal && (
        <PostWrite
          onClose={() => setShowWriteModal(false)}
          onSuccess={() => {
            // 글 작성 성공 시 모달 닫기
          }}
        />
      )}

      {/* 플로팅 글쓰기 버튼 */}
      <button 
        className="floating-write-button"
        onClick={() => setShowWriteModal(true)}
        aria-label="글쓰기"
      >
        <svg className="floating-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
        </svg>
      </button>
    </>
  );
};

export default Board;
