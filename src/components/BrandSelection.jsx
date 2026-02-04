import { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo.svg';
import './BrandSelection.css';

const BRANDS = [
  { value: 'megamgccoffee', label: '메가엠지씨커피' },
  { value: 'composecoffee', label: '컴포즈커피' },
  { value: 'ediya', label: '이디야커피' },
  { value: 'starbucks', label: '스타벅스' },
  { value: 'paik', label: '빽다방' },
  { value: 'twosome', label: '투썸플레이스' },
  { value: 'theventi', label: '더벤티' },
  { value: 'tenpercent', label: '텐퍼센트스페셜티커피' },
  { value: 'mammothcoffee', label: '매머드커피' },
  { value: 'mammothexpress', label: '매머드익스프레스' }
];

const BrandSelection = ({ onSelect }) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBrand && !customBrand) {
      setError('브랜드를 선택하거나 입력해주세요.');
      return;
    }
    setError('');
    // 커스텀 브랜드가 입력된 경우
    if (customBrand.trim()) {
      onSelect(`custom:${customBrand.trim()}`);
    } else {
      onSelect(selectedBrand);
    }
  };

  const handleCustomBrandChange = (e) => {
    setCustomBrand(e.target.value);
    setError('');
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 필터링된 브랜드 목록
  const filteredBrands = BRANDS.filter(brand =>
    brand.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 선택된 브랜드 라벨 가져오기
  const selectedBrandLabel = BRANDS.find(b => b.value === selectedBrand)?.label || '';

  const handleBrandSelect = (brandValue) => {
    setSelectedBrand(brandValue);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setShowCustomInput(false);
    setCustomBrand('');
    setError('');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
    setError('');
  };

  const handleInputFocus = () => {
    if (showCustomInput) {
      // 커스텀 입력 모드일 때 셀렉트 박스 클릭 시 일반 모드로 전환
      setShowCustomInput(false);
      setCustomBrand('');
    }
    setIsDropdownOpen(true);
  };

  const handleSelectWrapperClick = () => {
    if (showCustomInput) {
      // 커스텀 입력 모드일 때 셀렉트 박스 영역 클릭 시 일반 모드로 전환
      setShowCustomInput(false);
      setCustomBrand('');
      setError('');
    }
  };

  const handleCustomBrandClick = () => {
    setSelectedBrand('');
    setSearchQuery('');
    setIsDropdownOpen(false);
    setShowCustomInput(true);
    setCustomBrand('');
    setError('');
  };

  return (
    <div className="brand-selection-container">
      <div className="brand-selection-card">
        <div className="brand-selection-header">
          <img src={logo} alt="BIZBLAH" className="logo" />
          <p className="subtitle">자영업자 익명 커뮤니티</p>
        </div>
        
        <div className="brand-selection-content">
          <h2 className="question">어디 점주님이신가요?</h2>
          <p className="description">
            운영중인 브랜드를 선택해주세요.
          </p>
          
          <form onSubmit={handleSubmit} className="brand-form">
            <div 
              className={`select-wrapper ${isDropdownOpen ? 'dropdown-open' : ''}`} 
              ref={dropdownRef}
              onClick={handleSelectWrapperClick}
            >
              <div className="brand-search-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={isDropdownOpen ? searchQuery : selectedBrandLabel}
                  onChange={handleSearchChange}
                  onFocus={handleInputFocus}
                  placeholder="브랜드를 검색하거나 선택해주세요"
                  className="brand-search-input"
                  disabled={showCustomInput}
                />
                <svg 
                  className="brand-dropdown-icon" 
                  viewBox="0 0 12 12" 
                  onClick={() => !showCustomInput && setIsDropdownOpen(!isDropdownOpen)}
                >
                  <path fill="#333" d="M6 9L1 4h10z"/>
                </svg>
              </div>
              
              {isDropdownOpen && !showCustomInput && (
                <div className="brand-dropdown">
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => (
                      <div
                        key={brand.value}
                        className={`brand-option ${selectedBrand === brand.value ? 'selected' : ''}`}
                        onClick={() => handleBrandSelect(brand.value)}
                      >
                        {brand.label}
                      </div>
                    ))
                  ) : (
                    <div className="brand-option no-results">
                      검색 결과가 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>

            {showCustomInput && (
              <div className="custom-brand-input-wrapper">
                <input
                  type="text"
                  value={customBrand}
                  onChange={handleCustomBrandChange}
                  placeholder="브랜드 이름을 입력하세요"
                  className="custom-brand-input"
                  autoFocus
                />
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit"
              className="next-button"
              disabled={!selectedBrand && !customBrand.trim()}
            >
              다음 단계로
            </button>
          </form>

          {!showCustomInput && (
            <button
              type="button"
              onClick={handleCustomBrandClick}
              className="custom-brand-button"
            >
              내 브랜드 추가하기
            </button>
          )}

          
          <div className="disclaimer">
            <p className="disclaimer-text">
              본 커뮤니티는 자영업자 간 정보 교류를 목적으로 한 
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
