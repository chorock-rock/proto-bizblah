import { useAuth } from '../contexts/AuthContext';
import './Greeting.css';

const Greeting = () => {
  const { getBrandLabel } = useAuth();
  const brandLabel = getBrandLabel();

  return (
    <div className="greeting-section">
      <h2 className="greeting-text">
        안녕하세요. {brandLabel} 점장님
      </h2>
      <p className="greeting-subtitle">
        BIZBLAH 커뮤니티에 오신 것을 환영합니다.
      </p>
    </div>
  );
};

export default Greeting;
