import { useSEO } from '../hooks/useSEO';
import Board from './Board';
import NoticeBoard from './NoticeBoard';
import SuggestionBoard from './SuggestionBoard';
import BrandReview from './BrandReview';
import './MainContent.css';

const MainContent = ({ currentView = 'all' }) => {
  // 뷰별 SEO 설정
  const getSEOConfig = () => {
    switch (currentView) {
      case 'notices':
        return {
          title: '공지사항',
          description: 'BIZBLAH 공지사항을 확인하세요. 중요한 업데이트와 안내사항을 놓치지 마세요.'
        };
      case 'suggestions':
        return {
          title: '건의하기',
          description: 'BIZBLAH에 건의사항을 제출하세요. 여러분의 의견이 커뮤니티를 더 좋게 만듭니다.'
        };
      case 'review':
        return {
          title: '브랜드 리뷰',
          description: '브랜드에 대한 점주님들의 솔직한 리뷰를 확인하세요.'
        };
      case 'my':
        return {
          title: '내가 쓴 글',
          description: '내가 작성한 게시글을 확인하세요.'
        };
      default:
        return {
          title: '게시판',
          description: '프랜차이즈 점주 커뮤니티 게시판에서 정보를 공유하고 소통하세요.'
        };
    }
  };

  const seoConfig = getSEOConfig();
  useSEO({
    ...seoConfig,
    url: window.location.pathname
  });

  return (
    <div className="main-content">
      {currentView === 'notices' ? (
        <NoticeBoard />
      ) : currentView === 'suggestions' ? (
        <SuggestionBoard />
      ) : currentView === 'review' ? (
        <BrandReview />
      ) : (
        <Board filter={currentView} />
      )}
    </div>
  );
};

export default MainContent;
