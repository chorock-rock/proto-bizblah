import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, analytics } from '../firebase';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, getDocs, limit, startAfter } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import PostWrite from './PostWrite';
import './Board.css';

const Board = ({ filter = 'all' }) => {
  const { currentUser, getBrandLabel, selectedBrand } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState({}); // { postId: true/false }
  const [animatingPosts, setAnimatingPosts] = useState({}); // { postId: true/false }
  const [commentsCounts, setCommentsCounts] = useState({}); // { postId: totalCount }
  const scrollRestoredRef = useRef(false);
  const [boardFilter, setBoardFilter] = useState(() => {
    // localStorage에서 저장된 필터 값 불러오기
    return localStorage.getItem('boardFilter') || 'all';
  });
  const POSTS_PER_PAGE = 10;

  // boardFilter 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('boardFilter', boardFilter);
  }, [boardFilter]);

  // 게시글 좋아요 수 실시간 업데이트 (첫 페이지만)
  useEffect(() => {
    if (posts.length === 0) return;

    // 첫 10개 게시글만 실시간 구독 (성능 최적화)
    const postsToSubscribe = posts.slice(0, POSTS_PER_PAGE);
    
    const unsubscribes = postsToSubscribe.map(post => {
      const postRef = doc(db, 'posts', post.id);
      return onSnapshot(postRef, (postDoc) => {
        if (postDoc.exists()) {
          const postData = postDoc.data();
          
          // 좋아요 수만 업데이트 (높이 변화 없으므로 스크롤 복원 불필요)
          setPosts(prevPosts => 
            prevPosts.map(p => 
              p.id === post.id ? { ...p, likes: postData.likes || 0 } : p
            )
          );
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length, posts.slice(0, POSTS_PER_PAGE).map(p => p.id).join(',')]);

  // 초기 게시글 로드 (첫 10개)
  useEffect(() => {
    if (!currentUser && filter === 'my') {
      setPosts([]);
      setLoading(false);
      return;
    }

    const loadInitialPosts = async () => {
      try {
        setLoading(true);
        setHasMore(true);
        setLastVisible(null);

        // 게시글 쿼리 생성
        let postsQuery;
        if (filter === 'my' && currentUser) {
          postsQuery = query(
            collection(db, 'posts'),
            where('authorId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
          );
        } else if (filter === 'all' && boardFilter === 'brand' && currentUser) {
          // 내 브랜드 게시판: 현재 사용자의 브랜드와 같은 게시글만
          const userBrand = getBrandLabel();
          if (userBrand && userBrand !== '점주' && userBrand !== null) {
            postsQuery = query(
              collection(db, 'posts'),
              where('authorBrand', '==', userBrand),
              orderBy('createdAt', 'desc'),
              limit(POSTS_PER_PAGE)
            );
          } else {
            // 브랜드가 없으면 전체 게시글 표시
            postsQuery = query(
              collection(db, 'posts'),
              orderBy('createdAt', 'desc'),
              limit(POSTS_PER_PAGE)
            );
          }
        } else {
          // 전체 게시판
          postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
          );
        }

        const snapshot = await getDocs(postsQuery);
        const userBrand = getBrandLabel();
        const postsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }))
          .filter(post => {
            // isBrandOnly가 true인 게시글은 전체 게시판에서는 보이지 않음
            if (post.isBrandOnly === true) {
              // 전체 게시판에서는 아예 표시하지 않음
              if (filter === 'all' && boardFilter === 'all') {
                return false;
              }
              // 내 브랜드 게시판에서는 해당 브랜드 게시글만 가져오므로 모두 표시
              return true;
            }
            // isBrandOnly가 false이거나 없는 게시글은 모두 표시
            return true;
          });

        setPosts(postsData);
        
        // 마지막 문서 저장 (다음 페이지용)
        if (snapshot.docs.length > 0) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
        } else {
          setHasMore(false);
        }

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

        // 댓글 수는 commentsCount 필드 사용 (최적화)
        const counts = {};
        postsData.forEach(post => {
          counts[post.id] = post.commentsCount || 0;
        });
        setCommentsCounts(counts);
        
        setLoading(false);
      } catch (error) {
        console.error('게시글 로드 오류:', error);
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
          }
        }
        setLoading(false);
      }
    };

    loadInitialPosts();
  }, [filter, currentUser, boardFilter]);

  // 새 게시글 실시간 구독 (첫 페이지에만 추가)
  useEffect(() => {
    if (!currentUser && filter === 'my') {
      return;
    }

    let postsQuery;
    if (filter === 'my' && currentUser) {
      postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
    } else if (filter === 'all' && boardFilter === 'brand' && currentUser) {
      // 내 브랜드 게시판: 현재 사용자의 브랜드와 같은 게시글만
      const userBrand = getBrandLabel();
      if (userBrand && userBrand !== '점주' && userBrand !== null) {
        postsQuery = query(
          collection(db, 'posts'),
          where('authorBrand', '==', userBrand),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
      } else {
        // 브랜드가 없으면 전체 게시글 표시
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
      }
    } else {
      // 전체 게시판
      postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
    }

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      if (snapshot.docs.length > 0) {
        const newPostDoc = snapshot.docs[0];
        const newPost = {
          id: newPostDoc.id,
          ...newPostDoc.data(),
          createdAt: newPostDoc.data().createdAt?.toDate() || new Date()
        };

        // isBrandOnly 필터링 적용
        const shouldShowPost = newPost.isBrandOnly === true
          ? (filter === 'all' && boardFilter === 'all' ? false : true) // 전체 게시판에서는 아예 표시하지 않음
          : true;

        if (!shouldShowPost) return;

        // 이미 존재하는 게시글이면 무시
        setPosts(prevPosts => {
          const exists = prevPosts.some(p => p.id === newPost.id);
          if (!exists && prevPosts.length < POSTS_PER_PAGE) {
            // 첫 페이지에 새 게시글 추가
            return [newPost, ...prevPosts].slice(0, POSTS_PER_PAGE);
          }
          return prevPosts;
        });

        // 좋아요 상태 확인
        if (currentUser) {
          try {
            const likeDoc = await getDoc(doc(db, 'posts', newPost.id, 'likes', currentUser.uid));
            setLikedPosts(prev => ({
              ...prev,
              [newPost.id]: likeDoc.exists() && likeDoc.data().deleted !== true
            }));
          } catch (error) {
            console.error('좋아요 상태 확인 오류:', error);
          }
        }

        // 댓글 수 설정
        setCommentsCounts(prev => ({
          ...prev,
          [newPost.id]: newPost.commentsCount || 0
        }));
      }
    });

    return () => unsubscribe();
  }, [filter, currentUser, boardFilter]);


  // 더보기 핸들러 (useCallback으로 메모이제이션)
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore || !lastVisible) return;

    try {
      // 스크롤 위치 저장 (함수 시작 시점)
      const scrollTopStart = window.pageYOffset || document.documentElement.scrollTop;

      setLoadingMore(true);

      let postsQuery;
      if (filter === 'my' && currentUser) {
        postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
      } else if (filter === 'all' && boardFilter === 'brand' && currentUser) {
        // 내 브랜드 게시판: 현재 사용자의 브랜드와 같은 게시글만
        const userBrand = getBrandLabel();
        if (userBrand && userBrand !== '점주' && userBrand !== null) {
          postsQuery = query(
            collection(db, 'posts'),
            where('authorBrand', '==', userBrand),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(POSTS_PER_PAGE)
          );
        } else {
          // 브랜드가 없으면 전체 게시글 표시
          postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(POSTS_PER_PAGE)
          );
        }
      } else {
        // 전체 게시판
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(postsQuery);
      const userBrand = getBrandLabel();
      const newPosts = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        .filter(post => {
          // isBrandOnly가 true인 게시글은 전체 게시판에서는 보이지 않음
          if (post.isBrandOnly === true) {
            // 전체 게시판에서는 아예 표시하지 않음
            if (filter === 'all' && boardFilter === 'all') {
              return false;
            }
            // 내 브랜드 게시판에서는 해당 브랜드 게시글만 가져오므로 모두 표시
            return true;
          }
          // isBrandOnly가 false이거나 없는 게시글은 모두 표시
          return true;
        });

      // 댓글 수 설정
      const counts = {};
      newPosts.forEach(post => {
        counts[post.id] = post.commentsCount || 0;
      });

      // 모든 상태를 한 번에 업데이트 (배치 업데이트)
      setPosts(prev => [...prev, ...newPosts]);
      setCommentsCounts(prev => ({ ...prev, ...counts }));
      
      // 마지막 문서 업데이트
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }

      setLoadingMore(false);

      // DOM 업데이트 완료 후 스크롤 위치 복원
      setTimeout(() => {
        const scrollTopAfter = window.pageYOffset || document.documentElement.scrollTop;
        
        // 함수 시작 전 스크롤 위치로 복원
        if (Math.abs(scrollTopAfter - scrollTopStart) > 10) {
          window.scrollTo({
            top: scrollTopStart,
            behavior: 'instant'
          });
        }
      }, 100);

    } catch (error) {
      console.error('더보기 로드 오류:', error);
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastVisible, filter, currentUser, boardFilter]);

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

  // 무한 스크롤 감지 (디바운싱 적용)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking && hasMore && !loadingMore && lastVisible) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // 하단 300px 전에 도달하면 로드
          if (scrollTop + windowHeight >= documentHeight - 300) {
            loadMorePosts();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, lastVisible, loadMorePosts]);

  // 스크롤 위치 저장 및 복원 (게시글 상세 페이지에서 돌아왔을 때만)
  useEffect(() => {
    // 게시글 상세 페이지로 이동할 때는 복원 플래그 리셋
    if (location.pathname.includes('/post/')) {
      scrollRestoredRef.current = false;
      return;
    }

    // 메인 페이지로 돌아왔을 때만 스크롤 위치 복원
    // (게시글 상세 페이지에서 돌아온 경우에만 실행되도록 조건 강화)
    if (location.pathname === '/' && !loading && posts.length > 0) {
      const savedScroll = sessionStorage.getItem('boardScrollPosition');
      // sessionStorage에 저장된 스크롤 위치가 있고, 아직 복원하지 않았으며,
      // 실제로 게시글 상세 페이지에서 돌아온 경우에만 복원
      if (savedScroll && !scrollRestoredRef.current) {
        const savedScrollValue = parseInt(savedScroll, 10);
        // 저장된 스크롤 위치가 유효한 경우에만 복원
        if (savedScrollValue > 0 && savedScrollValue < document.documentElement.scrollHeight) {
          scrollRestoredRef.current = true;
          // DOM이 업데이트된 후 스크롤 복원
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: savedScrollValue,
                behavior: 'instant'
              });
              scrollRestoredRef.current = false;
            });
          });
        }
      }
    }
  }, [location.pathname, loading]); // posts.length 제거

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
        // 게시글 좋아요 수 업데이트
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p
          )
        );
        
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
        // 게시글 좋아요 수 업데이트
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
          )
        );
        
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
        {/* 탭 (홈 게시판일 때만 표시) */}
        {filter === 'all' && (
          <div className="board-tabs">
            <button
              className={`board-tab ${boardFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBoardFilter('all')}
            >
              전체 게시판
            </button>
            <button
              className={`board-tab ${boardFilter === 'brand' ? 'active' : ''}`}
              onClick={() => setBoardFilter('brand')}
            >
              {getBrandLabel() ? `${getBrandLabel()} 게시판` : '내 브랜드 게시판'}
            </button>
          </div>
        )}
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
                  : filter === 'all' && boardFilter === 'brand'
                  ? '내 브랜드 게시글이 없습니다.'
                  : '아직 게시글이 없습니다.'
                }
              </p>
              {filter === 'all' && boardFilter === 'all' && (
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
              {loadingMore && (
                <div className="load-more-container">
                  <div className="loading-indicator">로딩 중...</div>
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className="load-more-container">
                  <div className="no-more-posts">모든 게시글을 불러왔습니다.</div>
                </div>
              )}
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
