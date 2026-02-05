import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, analytics } from '../firebase';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, getDocs } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import PostWrite from './PostWrite';
import './Board.css';

const Board = ({ filter = 'all' }) => {
  const { currentUser, getBrandLabel, selectedBrand } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState({}); // { postId: true/false }
  const [animatingPosts, setAnimatingPosts] = useState({}); // { postId: true/false }
  const [commentsCounts, setCommentsCounts] = useState({}); // { postId: totalCount }
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    if (!currentUser && filter === 'my') {
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
      // 전체 게시글 조회 (브랜드 필터링 제거)
      postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setPosts(postsData);
      
      // 각 게시글의 좋아요 상태 확인
      if (currentUser) {
        const likedStatus = {};
        await Promise.all(
          postsData.map(async (post) => {
            try {
              const likeDoc = await getDoc(doc(db, 'posts', post.id, 'likes', currentUser.uid));
              likedStatus[post.id] = likeDoc.exists() && likeDoc.data().deleted !== true;
            } catch (error) {
              console.error(`게시글 ${post.id} 좋아요 상태 확인 오류:`, error);
              likedStatus[post.id] = false;
            }
          })
        );
        setLikedPosts(likedStatus);
      } else {
        setLikedPosts({});
      }

      // 각 게시글의 댓글과 대댓글 수 계산
      const counts = {};
      await Promise.all(
        postsData.map(async (post) => {
          try {
            // 댓글 가져오기
            const commentsQuery = query(
              collection(db, 'posts', post.id, 'comments'),
              orderBy('createdAt', 'asc')
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            let totalCount = commentsSnapshot.size; // 댓글 수

            // 각 댓글의 대댓글 수 추가
            await Promise.all(
              commentsSnapshot.docs.map(async (commentDoc) => {
                const repliesQuery = query(
                  collection(db, 'posts', post.id, 'comments', commentDoc.id, 'replies')
                );
                const repliesSnapshot = await getDocs(repliesQuery);
                totalCount += repliesSnapshot.size; // 대댓글 수 추가
              })
            );

            counts[post.id] = totalCount;
          } catch (error) {
            console.error(`게시글 ${post.id} 댓글 수 계산 오류:`, error);
            // 오류 발생 시 기존 commentsCount 사용
            counts[post.id] = post.commentsCount || 0;
          }
        })
      );
      setCommentsCounts(counts);
      
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
            'Fields: createdAt (Descending)'
          );
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, currentUser]);

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

  const handleLike = async (e, postId) => {
    e.stopPropagation(); // 게시글 클릭 이벤트 방지
    if (!currentUser) return;

    try {
      const likeRef = doc(db, 'posts', postId, 'likes', currentUser.uid);
      const likeDoc = await getDoc(likeRef);
      
      if (likeDoc.exists() && likeDoc.data().deleted !== true) {
        // 좋아요 취소
        await updateDoc(likeRef, { deleted: true });
        await updateDoc(doc(db, 'posts', postId), {
          likes: increment(-1)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: false }));
        setAnimatingPosts(prev => ({ ...prev, [postId]: false }));
        
        // 좋아요 취소 이벤트 추적
        if (analytics) {
          logEvent(analytics, 'post_unlike', {
            post_id: postId,
            content_type: 'post'
          });
        }
      } else {
        // 좋아요 추가
        await setDoc(likeRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          deleted: false
        });
        await updateDoc(doc(db, 'posts', postId), {
          likes: increment(1)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: true }));
        setAnimatingPosts(prev => ({ ...prev, [postId]: true }));
        
        // 애니메이션 종료
        setTimeout(() => {
          setAnimatingPosts(prev => ({ ...prev, [postId]: false }));
        }, 3000);
        
        // 좋아요 이벤트 추적
        if (analytics) {
          logEvent(analytics, 'post_like', {
            post_id: postId,
            content_type: 'post'
          });
        }
      }
    } catch (error) {
      console.error('좋아요 오류:', error);
    }
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
                    <button 
                      className={`post-likes-button ${likedPosts[post.id] ? 'liked' : ''} ${animatingPosts[post.id] ? 'animating' : ''}`}
                      onClick={(e) => handleLike(e, post.id)}
                      aria-label="좋아요"
                    >
                      <svg className="post-icon" viewBox="0 0 24 24" fill={likedPosts[post.id] ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {animatingPosts[post.id] && (
                        <div className="heart-burst">
                          <span className="heart-particle">❤️</span>
                          <span className="heart-particle">❤️</span>
                          <span className="heart-particle">❤️</span>
                          <span className="heart-particle">❤️</span>
                          <span className="heart-particle">❤️</span>
                        </div>
                      )}
                      {post.likes || 0}
                    </button>
                    <span className="post-comments">
                      <svg className="post-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                      {commentsCounts[post.id] !== undefined ? commentsCounts[post.id] : (post.commentsCount || 0)}
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
