import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import PostWrite from './PostWrite';
import './Board.css';

const Board = ({ filter = 'all' }) => {
  const { currentUser, getBrandLabel, selectedBrand } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const scrollRestoredRef = useRef(false);

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

  // 스크롤 위치 저장 및 복원
  useEffect(() => {
    // 메인 페이지로 돌아왔을 때 스크롤 위치 복원
    if (location.pathname === '/' && !loading && posts.length > 0) {
      const savedScroll = sessionStorage.getItem('boardScrollPosition');
      if (savedScroll && !scrollRestoredRef.current) {
        scrollRestoredRef.current = true;
        // DOM이 업데이트된 후 스크롤 복원
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: parseInt(savedScroll, 10),
              behavior: 'instant'
            });
            scrollRestoredRef.current = false;
          });
        });
      }
    } else if (location.pathname.includes('/post/')) {
      // 게시글 상세 페이지로 이동할 때는 복원 플래그 리셋
      scrollRestoredRef.current = false;
    }
  }, [location.pathname, loading, posts.length]);

  const handlePostClick = (postId) => {
    // 현재 스크롤 위치 저장
    sessionStorage.setItem('boardScrollPosition', window.scrollY.toString());
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
                  <div className="post-meta">
                    <span className="post-brand">{post.authorBrand}</span>
                    <span className="post-meta-divider">|</span>
                    <span className="post-author-name">{post.authorName}</span>
                    <span className="post-meta-divider">|</span>
                    <span className="post-date">{formatDate(post.createdAt)}</span>
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-content">{post.content}</p>
                  <div className="post-stats">
                    <span className="post-likes">
                      <svg className="post-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                      {post.likes || 0}
                    </span>
                    <span className="post-comments">
                      <svg className="post-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                      {post.commentsCount || 0}
                    </span>
                    <span className="post-views">
                      <svg className="post-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      {post.views || 0}
                    </span>
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
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  );
};

export default Board;
