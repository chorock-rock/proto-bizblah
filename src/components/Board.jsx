import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import PostWrite from './PostWrite';
import PostDetail from './PostDetail';
import './Board.css';

const Board = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    // 게시글 실시간 구독
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    setSelectedPostId(postId);
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
              <p>아직 게시글이 없습니다.</p>
              <p>첫 번째 게시글을 작성해보세요!</p>
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

      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
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
