import Greeting from './Greeting';
import Board from './Board';
import './MainContent.css';

const MainContent = () => {
  return (
    <div className="main-content">
      <Greeting />
      <div className="content-wrapper">
        <Board />
      </div>
    </div>
  );
};

export default MainContent;
