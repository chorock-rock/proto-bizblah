import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import MainContent from './MainContent';
import PostDetail from './PostDetail';

const PostDetailPage = ({ currentView = 'all', onViewChange }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser, selectedBrand, profileLoading } = useAuth();

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
