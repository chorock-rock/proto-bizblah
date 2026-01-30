import { useState } from 'react';
import './BrandSelection.css';

const BRANDS = [
  { value: 'megacoffee', label: '메가커피' },
  { value: 'greenvillage', label: '초록마을' },
  { value: 'starbucks', label: '스타벅스' },
  { value: 'ediya', label: '이디야커피' },
  { value: 'twosome', label: '투썸플레이스' },
  { value: 'angelinus', label: '엔젤리너스' },
  { value: 'hollys', label: '할리스커피' },
  { value: 'paik', label: '빽다방' },
  { value: 'tomntoms', label: '탐앤탐스' },
  { value: 'other', label: '기타' }
];

const BrandSelection = ({ onSelect }) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBrand) {
      setError('브랜드를 선택해주세요.');
      return;
    }
    setError('');
    onSelect(selectedBrand);
  };

  return (
    <div className="brand-selection-container">
      <div className="brand-selection-card">
        <div className="brand-selection-header">
          <h1 className="logo">BIZBLAH</h1>
          <p className="subtitle">프랜차이즈 점주 익명 커뮤니티</p>
        </div>
        
        <div className="brand-selection-content">
          <h2 className="question">어디 점주님이신가요?</h2>
          <p className="description">
            소속하신 프랜차이즈 브랜드를 선택해주세요.
          </p>
          
          <form onSubmit={handleSubmit} className="brand-form">
            <div className="select-wrapper">
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setError('');
                }}
                className="brand-select"
              >
                <option value="">브랜드를 선택하세요</option>
                {BRANDS.map((brand) => (
                  <option key={brand.value} value={brand.value}>
                    {brand.label}
                  </option>
                ))}
              </select>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit"
              className="next-button"
              disabled={!selectedBrand}
            >
              다음 단계로
            </button>
          </form>
          
          <div className="disclaimer">
            <p className="disclaimer-text">
              본 커뮤니티는 프랜차이즈 점주 간 정보 교류를 목적으로 한 
              <br />독립적인 커뮤니티이며,
              <br />
              각 브랜드 본사와는 어떠한 공식적 제휴·운영·보증 관계도 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandSelection;
