import { useState } from 'react';
import logo from '../assets/logo.svg';
import './Welcome.css';

const Welcome = ({ onStart }) => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-header">
          <img src={logo} alt="비즈블라" className="welcome-logo" />
          <p className="welcome-subtitle">자영업자를 위한 익명 커뮤니티</p>
        </div>

        <div className="welcome-description">
          <p className="welcome-text">혼자 고민하지 마세요.</p>
          <p className="welcome-text">
            자영업 운영의 모든 질문을
          </p>
          <p className="welcome-text">
            <span className="highlight">점주끼리 실시간</span>으로 나눕니다.
          </p>
        </div>

        <button 
          className="welcome-start-button"
          onClick={onStart}
        >
          시작하기
        </button>

        <div className="welcome-disclaimer" style={{ textAlign: 'center' }}>
          <p>
            본 커뮤니티는 자영업자 간 정보 공유를 목적으로 한
            <br /> 
            독립적인 커뮤니티이며,
            각 브랜드 본사와는 공식적인 제휴 
            <br />
            관계가 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
