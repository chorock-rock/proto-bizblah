import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, analytics } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import './PostWrite.css';

const PostWrite = ({ onClose, onSuccess }) => {
  const { currentUser, getBrandLabel, getNickname } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const docRef = await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        authorId: currentUser.uid,
        authorName: getNickname(),
        authorBrand: getBrandLabel(),
        views: 0,
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 글 작성 이벤트 추적
      if (analytics) {
        logEvent(analytics, 'post_create', {
          post_id: docRef.id,
          brand: getBrandLabel()
        });
      }

      setTitle('');
      setContent('');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('글 작성 오류:', err);
      setError('글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-write-overlay" onClick={onClose}>
      <div className="post-write-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <form onSubmit={handleSubmit} className="post-write-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
              disabled={loading}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
              취소
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostWrite;
