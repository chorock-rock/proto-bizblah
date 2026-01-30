import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import './AdminPosts.css';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState(null);

  useEffect(() => {
    // 모든 게시글 실시간 구독
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
    }, (error) => {
      console.error('게시글 구독 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingPostId(postId);
      
      // 게시글의 댓글과 좋아요도 삭제
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      
      // 각 댓글의 대댓글 삭제
      for (const commentDoc of commentsSnapshot.docs) {
        const repliesRef = collection(db, 'posts', postId, 'comments', commentDoc.id, 'replies');
        const repliesSnapshot = await getDocs(repliesRef);
        for (const replyDoc of repliesSnapshot.docs) {
          await deleteDoc(doc(db, 'posts', postId, 'comments', commentDoc.id, 'replies', replyDoc.id));
        }
        // 댓글 삭제
        await deleteDoc(doc(db, 'posts', postId, 'comments', commentDoc.id));
      }
      
      // 좋아요 삭제
      const likesRef = collection(db, 'posts', postId, 'likes');
      const likesSnapshot = await getDocs(likesRef);
      for (const likeDoc of likesSnapshot.docs) {
        await deleteDoc(doc(db, 'posts', postId, 'likes', likeDoc.id));
      }
      
      // 게시글 삭제
      await deleteDoc(doc(db, 'posts', postId));
      
      alert('게시글이 삭제되었습니다.');
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      alert('게시글 삭제에 실패했습니다.');
    } finally {
      setDeletingPostId(null);
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
    <div className="admin-posts">
      <div className="admin-posts-section">
        <h2 className="section-title">게시글 관리</h2>
        
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">게시글이 없습니다.</div>
        ) : (
          <div className="admin-posts-list">
            {posts.map((post) => (
              <div key={post.id} className="admin-post-item">
                <div className="admin-post-header">
                  <h3 className="admin-post-title">{post.title}</h3>
                  <span className="admin-post-date">{formatDate(post.createdAt)}</span>
                </div>
                <div className="admin-post-content">{post.content}</div>
                <div className="admin-post-footer">
                  <div className="admin-post-meta">
                    <span>{post.authorBrand} {post.authorName}</span>
                    <span>조회: {post.views || 0}</span>
                    <span>좋아요: {post.likes || 0}</span>
                    <span>댓글: {post.commentsCount || 0}</span>
                  </div>
                  <button
                    className="admin-delete-button"
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPosts;
