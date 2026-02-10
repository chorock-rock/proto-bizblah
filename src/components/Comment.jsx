import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, analytics } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, updateDoc, increment, getDoc, getDocs } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import './Comment.css';

const Comment = ({ comment, postId, currentUser }) => {
  const { getNickname } = useAuth();
  const [replies, setReplies] = useState(comment.replies || []);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingToReplyId, setReplyingToReplyId] = useState(null);
  const [nestedReplyText, setNestedReplyText] = useState('');
  const [submittingNestedReply, setSubmittingNestedReply] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes || 0);
  const [expanded, setExpanded] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // 댓글 좋아요 수 실시간 구독
  useEffect(() => {
    if (!comment.id || !postId) return;

    const commentRef = doc(db, 'posts', postId, 'comments', comment.id);
    const unsubscribeComment = onSnapshot(commentRef, (commentDoc) => {
      if (commentDoc.exists()) {
        const commentData = commentDoc.data();
        setLikesCount(commentData.likes || 0);
      }
    });

    return () => unsubscribeComment();
  }, [comment.id, postId]);

  useEffect(() => {
    // 대댓글 실시간 구독
    const repliesQuery = query(
      collection(db, 'posts', postId, 'comments', comment.id, 'replies'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(repliesQuery, (snapshot) => {
      const repliesData = snapshot.docs.map(replyDoc => ({
        id: replyDoc.id,
        ...replyDoc.data(),
        createdAt: replyDoc.data().createdAt?.toDate() || new Date()
      }));
      setReplies(repliesData);
    });

    // 좋아요 상태 확인
    const checkLikeStatus = async () => {
      if (currentUser) {
        try {
          const likeDoc = await getDoc(doc(db, 'posts', postId, 'comments', comment.id, 'likes', currentUser.uid));
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

    return () => unsubscribe();
  }, [comment.id, postId, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      const likeRef = doc(db, 'posts', postId, 'comments', comment.id, 'likes', currentUser.uid);
      const likeDoc = await getDoc(likeRef);
      
      if (likeDoc.exists() && likeDoc.data().deleted !== true) {
        // 좋아요 취소
        await updateDoc(likeRef, { deleted: true });
        await updateDoc(doc(db, 'posts', postId, 'comments', comment.id), {
          likes: increment(-1)
        });
        setLiked(false);
        
        // 댓글 좋아요 취소 이벤트 추적
        if (analytics) {
          logEvent(analytics, 'comment_unlike', {
            post_id: postId,
            comment_id: comment.id,
            content_type: 'comment'
          });
        }
      } else {
        // 좋아요 추가
        setIsAnimating(true);
        await setDoc(likeRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          deleted: false
        });
        await updateDoc(doc(db, 'posts', postId, 'comments', comment.id), {
          likes: increment(1)
        });
        setLiked(true);
        
        // 애니메이션 종료
        setTimeout(() => setIsAnimating(false), 5000);
        
        // 댓글 좋아요 이벤트 추적
        if (analytics) {
          logEvent(analytics, 'comment_like', {
            post_id: postId,
            comment_id: comment.id,
            content_type: 'comment'
          });
        }
      }
    } catch (error) {
      console.error('좋아요 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser) return;

    try {
      setSubmittingReply(true);
      const replyRef = await addDoc(collection(db, 'posts', postId, 'comments', comment.id, 'replies'), {
        content: replyText.trim(),
        authorId: currentUser.uid,
        authorName: getNickname(),
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId, 'comments', comment.id), {
        repliesCount: increment(1)
      });

      // 게시글의 댓글 카운트도 증가 (대댓글 포함)
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      // 대댓글 작성 이벤트 추적
      if (analytics) {
        logEvent(analytics, 'reply_create', {
          post_id: postId,
          comment_id: comment.id,
          reply_id: replyRef.id
        });
      }

      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('대댓글 작성 오류:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleNestedReplySubmit = async (e, replyId) => {
    e.preventDefault();
    if (!nestedReplyText.trim() || !currentUser || !replyId) return;

    try {
      setSubmittingNestedReply(true);
      
      const targetReply = replies.find(r => r.id === replyId);
      const targetAuthorName = targetReply?.authorName || '익명';
      
      // 중첩된 답글을 replies 컬렉션에 저장 (replyTo 필드로 원본 대댓글 ID와 닉네임 표시)
      const nestedReplyRef = await addDoc(collection(db, 'posts', postId, 'comments', comment.id, 'replies'), {
        content: nestedReplyText.trim(),
        authorId: currentUser.uid,
        authorName: getNickname(),
        replyTo: replyId, // 어떤 대댓글에 대한 답글인지 표시 (ID)
        replyToName: targetAuthorName, // 원본 대댓글 작성자 닉네임
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId, 'comments', comment.id), {
        repliesCount: increment(1)
      });

      // 게시글의 댓글 카운트도 증가
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      // 중첩 답글 작성 이벤트 추적
      if (analytics) {
        logEvent(analytics, 'nested_reply_create', {
          post_id: postId,
          comment_id: comment.id,
          reply_id: replyId,
          nested_reply_id: nestedReplyRef.id
        });
      }

      setNestedReplyText('');
      setReplyingToReplyId(null);
    } catch (error) {
      console.error('중첩 답글 작성 오류:', error);
    } finally {
      setSubmittingNestedReply(false);
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

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-author">{comment.authorName}</span>
        <span className="comment-date">{formatDate(comment.createdAt)}</span>
      </div>
      
      <div className="comment-content">{comment.content}</div>
      
      <div className="comment-actions">
        <button 
          className={`comment-like-button ${liked ? 'liked' : ''} ${isAnimating ? 'animating' : ''}`}
          onClick={handleLike}
        >
          <svg className="comment-like-icon" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isAnimating && (
            <div className="heart-burst">
              <span className="heart-particle">❤️</span>
              <span className="heart-particle">❤️</span>
              <span className="heart-particle">❤️</span>
              <span className="heart-particle">❤️</span>
              <span className="heart-particle">❤️</span>
            </div>
          )}
          <span>{likesCount}</span>
        </button>
        {currentUser && (
          <button 
            className="reply-button"
            onClick={() => {
              setShowReplyForm(!showReplyForm);
              setExpanded(true);
            }}
          >
            답글 {replies.length > 0 && `(${replies.length})`}
          </button>
        )}
      </div>

      {replies.length > 0 && (
        <div className="replies-section">
          <button 
            className="toggle-replies"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'} 답글 {replies.length}개
          </button>
          
          {expanded && (
            <div className="replies-list">
              {replies.map((reply) => (
                <div key={reply.id} className="reply-item">
                  <div className="reply-header">
                    <span className="reply-author">
                      {reply.replyTo && (
                        <span className="reply-to-indicator">@{reply.replyToName || replies.find(r => r.id === reply.replyTo)?.authorName || '알 수 없음'}</span>
                      )}
                      {reply.authorName}
                    </span>
                    <span className="reply-date">{formatDate(reply.createdAt)}</span>
                  </div>
                  <div className="reply-content">
                    {reply.content.split(/(@[^\s]+)/g).map((part, index) => {
                      if (part.startsWith('@')) {
                        return <span key={index} className="mention-text">{part}</span>;
                      }
                      return <span key={index}>{part}</span>;
                    })}
                  </div>
                  {currentUser && (
                    <div className="reply-actions">
                      <button 
                        className="reply-to-reply-button"
                        onClick={() => {
                          if (replyingToReplyId === reply.id) {
                            setReplyingToReplyId(null);
                            setNestedReplyText('');
                          } else {
                            setReplyingToReplyId(reply.id);
                            setNestedReplyText(`@${reply.authorName || '익명'} `);
                          }
                        }}
                      >
                        답글달기
                      </button>
                    </div>
                  )}
                  {replyingToReplyId === reply.id && (
                    <form onSubmit={(e) => handleNestedReplySubmit(e, reply.id)} className="nested-reply-form">
                      <textarea
                        value={nestedReplyText}
                        onChange={(e) => setNestedReplyText(e.target.value)}
                        placeholder={`@${reply.authorName || '익명'} 답글을 입력하세요...`}
                        rows={2}
                        disabled={submittingNestedReply}
                      />
                      <div className="reply-form-actions">
                        <button 
                          type="button" 
                          className="cancel-reply-button"
                          onClick={() => {
                            setReplyingToReplyId(null);
                            setNestedReplyText('');
                          }}
                        >
                          취소
                        </button>
                        <button 
                          type="submit" 
                          disabled={!nestedReplyText.trim() || submittingNestedReply}
                        >
                          {submittingNestedReply ? '작성 중...' : '답글 작성'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReplyForm && currentUser && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="답글을 입력하세요..."
            rows={2}
            disabled={submittingReply}
          />
          <div className="reply-form-actions">
            <button 
              type="button" 
              className="cancel-reply-button"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={!replyText.trim() || submittingReply}
            >
              {submittingReply ? '작성 중...' : '답글 작성'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Comment;
