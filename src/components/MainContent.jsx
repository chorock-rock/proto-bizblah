import Board from './Board';
import NoticeBoard from './NoticeBoard';
import SuggestionBoard from './SuggestionBoard';
import './MainContent.css';

const MainContent = ({ currentView = 'all' }) => {
  return (
    <div className="main-content">
      {currentView === 'notices' ? (
        <NoticeBoard />
      ) : currentView === 'suggestions' ? (
        <SuggestionBoard />
      ) : (
        <Board filter={currentView} />
      )}
    </div>
  );
};

export default MainContent;
