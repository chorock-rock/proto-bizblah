import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from './Header';
import MainContent from './MainContent';
import PostDetail from './PostDetail';

const PostDetailPage = ({ currentView = 'all', onViewChange }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser, selectedBrand, profileLoading } = useAuth();
  const [post, setPost] = useState(null);

  // 게시글 정보 가져오기
  useEffect(() => {
    if (!postId) return;
    
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() });
        }
      } catch (error) {
        console.error('게시글 가져오기 오류:', error);
      }
    };

    fetchPost();
  }, [postId]);

  // SEO 설정
  useSEO({
    title: post ? post.title : '게시글 상세',
    description: post 
      ? post.content 
        ? post.content.substring(0, 150).replace(/\n/g, ' ') + '...'
        : '프랜차이즈 점주 커뮤니티 게시글을 확인하세요.'
      : '게시글을 불러오는 중...',
    url: `/post/${postId}`
  });

  const handleClose = () => {
    // 스크롤 복원을 위해 이벤트 발생
    window.dispatchEvent(new Event('restoreScroll'));
    navigate('/'); // 메인 페이지로 이동
  };

  // 로딩 중
  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        로딩 중...
      </div>
    );
  }

  // 로그인하지 않았거나 브랜드가 없으면 메인으로 리다이렉트
  if (!currentUser || !selectedBrand) {
    return null;
  }

  if (!postId) {
    return null;
  }

  // 뒤에 메인 화면을 보여주고 그 위에 모달 표시
  return (
    <>
      <Header currentView={currentView} onViewChange={onViewChange} />
      <MainContent currentView={currentView} />
      <PostDetail postId={postId} onClose={handleClose} />
    </>
  );
};

export default PostDetailPage;
