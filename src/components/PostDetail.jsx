import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, increment, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import Comment from './Comment';
import PostEdit from './PostEdit';
import './PostDetail.css';

const PostDetail = ({ postId, onClose }) => {
  const { currentUser, getNickname } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 조회수 증가는 한 번만 실행 (sessionStorage 사용)
  useEffect(() => {
    if (!postId) return;

    const storageKey = `viewed_${postId}`;
    const hasViewed = sessionStorage.getItem(storageKey);

    if (hasViewed) {
      return; // 이미 조회한 경우 중단
    }

    const incrementViews = async () => {
      try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          views: increment(1)
        });
        // 조회 완료 표시
        sessionStorage.setItem(storageKey, 'true');
      } catch (error) {
        console.error('조회수 증가 오류:', error);
      }
    };

    incrementViews();
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    // 게시글 실시간 구독
    const postRef = doc(db, 'posts', postId);
    const unsubscribePost = onSnapshot(postRef, (postDoc) => {
      if (postDoc.exists()) {
        const postData = postDoc.data();
        setPost({
          id: postDoc.id,
          ...postData,
          createdAt: postData.createdAt?.toDate() || new Date()
        });
        setLikesCount(postData.likes || 0);
        setLoading(false);
      }
    });

    // 좋아요 상태 확인
    const checkLikeStatus = async () => {
      if (currentUser) {
        try {
          const likeDoc = await getDoc(doc(db, 'posts', postId, 'likes', currentUser.uid));
          if (likeDoc.exists()) {
            const likeData = likeDoc.data();
            setLiked(likeData.deleted !== true);
          } else {
            setLiked(false);
          }
        } catch (error) {
          console.error('좋아요 상태 확인 오류:', error);
        }
      } else {
        setLiked(false);
      }
    };

    checkLikeStatus();

    return () => unsubscribePost();
  }, [postId, currentUser]);

  // 댓글 실시간 구독
  useEffect(() => {
    if (!postId) return;

    const commentsQuery = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const commentsData = await Promise.all(
        snapshot.docs.map(async (commentDoc) => {
          const commentData = commentDoc.data();
          
          // 대댓글 가져오기
          const repliesQuery = query(
            collection(db, 'posts', postId, 'comments', commentDoc.id, 'replies'),
            orderBy('createdAt', 'asc')
          );
          
          const repliesSnapshot = await getDocs(repliesQuery);
          const replies = repliesSnapshot.docs.map(replyDoc => ({
            id: replyDoc.id,
            ...replyDoc.data(),
            createdAt: replyDoc.data().createdAt?.toDate() || new Date()
          }));

          return {
            id: commentDoc.id,
            ...commentData,
            createdAt: commentData.createdAt?.toDate() || new Date(),
            replies: replies || []
          };
        })
      );
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);


  const handleLike = async () => {
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
        setLiked(false);
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
        setLiked(true);
      }
    } catch (error) {
      console.error('좋아요 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    try {
      setSubmittingComment(true);
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        content: commentText.trim(),
        authorId: currentUser.uid,
        authorName: getNickname(),
        likes: 0,
        repliesCount: 0,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      setCommentText('');
    } catch (error) {
      console.error('댓글 작성 오류:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          alert('링크가 클립보드에 복사되었습니다.');
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('링크가 클립보드에 복사되었습니다.');
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !post || post.authorId !== currentUser.uid) return;
    
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'posts', postId));
      alert('게시글이 삭제되었습니다.');
      onClose();
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      alert('게시글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditComplete = () => {
    // 실시간 구독으로 자동 업데이트되므로 별도 처리 불필요
    setShowEditModal(false);
  };

  const isAuthor = currentUser && post && post.authorId === currentUser.uid;

  if (loading) {
    return (
      <div className="post-detail-overlay" onClick={onClose}>
        <div className="post-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

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

  return (
    <div className="post-detail-overlay" onClick={onClose}>
      <div className="post-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="post-detail-content">
          <div className="post-detail-title-wrapper">
            <div className="post-detail-title">{post.title}</div>
            {isAuthor && (
              <div className="post-owner-actions">
                <button 
                  className="edit-button"
                  onClick={() => setShowEditModal(true)}
                  disabled={isDeleting}
                >
                  수정
                </button>
                <button 
                  className="delete-button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            )}
          </div>
          <div className="post-detail-meta">
            <span className="post-author">{post.authorBrand} {post.authorName}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
            <span className="post-views">조회 {post.views || 0}</span>
          </div>
          
          <div className="post-detail-body">{post.content}</div>
          
          <div className="post-detail-actions">
            <button 
              className={`like-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <span className="like-icon">❤️</span>
              <span>{likesCount}</span>
            </button>
            <button className="share-button" onClick={handleShare}>
              <span className="share-icon">🔗</span>
              <span>공유</span>
            </button>
          </div>
        </div>

        <div className="comments-section">
          <h3 className="comments-title">댓글 {comments.length}</h3>
          
          <div className="comments-list">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                postId={postId}
                currentUser={currentUser}
              />
            ))}
          </div>

          {currentUser && (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={3}
                disabled={submittingComment}
              />
              <button type="submit" disabled={!commentText.trim() || submittingComment}>
                {submittingComment ? '작성 중...' : '댓글 작성'}
              </button>
            </form>
          )}
        </div>
      </div>

      {showEditModal && post && (
        <PostEdit
          post={post}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditComplete}
        />
      )}
    </div>
  );
};

export default PostDetail;
