import Board from './Board';
import './MainContent.css';

const MainContent = ({ currentView = 'all' }) => {
  return (
    <div className="main-content">
      <Board filter={currentView} />
    </div>
  );
};

export default MainContent;
