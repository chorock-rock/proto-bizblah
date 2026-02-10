import { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import logo from '../assets/logo.svg';
import './BrandSelection.css';

const BrandSelection = ({ onSelect }) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedBrandLabel, setSelectedBrandLabel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topBrands, setTopBrands] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // 초기 상위 10개 브랜드 로드
  useEffect(() => {
    const loadTopBrands = async () => {
      try {
        setLoading(true);
        const brandsQuery = query(
          collection(db, 'brands'),
          where('isActive', '==', true),
          orderBy('storeCount', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(brandsQuery);
        const brands = snapshot.docs.map(doc => ({
          id: doc.id,
          value: doc.id,
          label: doc.data().name,
          storeCount: doc.data().storeCount || 0
        }));
        setTopBrands(brands);
      } catch (error) {
        console.error('브랜드 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopBrands();
  }, []);

  // 검색어 변경 시 Firestore에서 검색
  useEffect(() => {
    const searchBrands = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const searchLower = searchQuery.toLowerCase().trim();
        const brandsQuery = query(
          collection(db, 'brands'),
          where('isActive', '==', true),
          where('nameLower', '>=', searchLower),
          where('nameLower', '<=', searchLower + '\uf8ff'),
          orderBy('nameLower'),
          limit(20)
        );
        const snapshot = await getDocs(brandsQuery);
        const brands = snapshot.docs.map(doc => ({
          id: doc.id,
          value: doc.id,
          label: doc.data().name,
          storeCount: doc.data().storeCount || 0
        }));
        setSearchResults(brands);
      } catch (error) {
        console.error('브랜드 검색 오류:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchBrands();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBrand && !customBrand) {
      setError('브랜드를 선택하거나 입력해주세요.');
      return;
    }
    setError('');
    
    // 커스텀 브랜드가 입력된 경우 Firestore에 추가
    if (customBrand.trim()) {
      try {
        const customBrandName = customBrand.trim();
        const customBrandLower = customBrandName.toLowerCase();
        
        // 중복 체크
        const checkQuery = query(
          collection(db, 'brands'),
          where('nameLower', '==', customBrandLower)
        );
        const existingDocs = await getDocs(checkQuery);
        
        let brandId;
        if (!existingDocs.empty) {
          // 이미 존재하는 경우 기존 ID 사용
          brandId = existingDocs.docs[0].id;
        } else {
          // 새로 추가
          const brandData = {
            name: customBrandName,
            nameLower: customBrandLower,
            category: '',
            storeCount: 0,
            expectedCost: '',
            note: '',
            isCustom: true,
            isActive: true,
            createdAt: serverTimestamp(),
            usageCount: 0
          };
          const docRef = await addDoc(collection(db, 'brands'), brandData);
          brandId = docRef.id;
        }
        
        onSelect(brandId);
      } catch (error) {
        console.error('커스텀 브랜드 추가 오류:', error);
        setError('브랜드 추가 중 오류가 발생했습니다.');
      }
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

  // 표시할 브랜드 목록 (검색어가 있으면 검색 결과, 없으면 상위 10개)
  const displayBrands = searchQuery.trim() ? searchResults : topBrands;

  const handleBrandSelect = (brandId, brandLabel) => {
    setSelectedBrand(brandId);
    setSelectedBrandLabel(brandLabel);
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
          <p className="subtitle">프랜차이즈 점주 익명 커뮤니티</p>
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
                  {loading || searchLoading ? (
                    <div className="brand-option no-results">
                      로딩 중...
                    </div>
                  ) : displayBrands.length > 0 ? (
                    displayBrands.map((brand) => (
                      <div
                        key={brand.id}
                        className={`brand-option ${selectedBrand === brand.id ? 'selected' : ''}`}
                        onClick={() => handleBrandSelect(brand.id, brand.label)}
                      >
                        {brand.label}
                      </div>
                    ))
                  ) : (
                    <div className="brand-option no-results">
                      {searchQuery.trim() ? '검색 결과가 없습니다' : '브랜드가 없습니다'}
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
