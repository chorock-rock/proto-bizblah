import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import './PostWrite.css';

const PostEdit = ({ post, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
    }
  }, [post]);

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

    if (!post || post.authorId !== currentUser?.uid) {
      setError('권한이 없습니다.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      await updateDoc(doc(db, 'posts', post.id), {
        title: title.trim(),
        content: content.trim(),
        updatedAt: serverTimestamp()
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('글 수정 오류:', err);
      setError('글 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-write-overlay" onClick={onClose}>
      <div className="post-write-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <div className="post-write-header">
          <h2>글 수정</h2>
        </div>
        
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
              {loading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEdit;
