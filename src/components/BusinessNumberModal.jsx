import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import './BusinessNumberModal.css';

const BusinessNumberModal = ({ onVerify, onClose }) => {
  const { currentUser } = useAuth();
  const [businessNumber, setBusinessNumber] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const formatBusinessNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');
    // 최대 10자리로 제한
    const limited = numbers.slice(0, 10);
    
    // 포맷팅: 123-45-67890 형식
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
    }
  };

  const handleChange = (e) => {
    const formatted = formatBusinessNumber(e.target.value);
    setBusinessNumber(formatted);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 하이픈 제거한 숫자만 추출
    const numbersOnly = businessNumber.replace(/\D/g, '');
    
    if (numbersOnly.length !== 10) {
      setError('사업자 등록 번호는 10자리 숫자입니다.');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      // 먼저 형식 검증
      const formatValid = verifyBusinessNumber(numbersOnly);
      if (!formatValid) {
        setError('유효하지 않은 사업자 등록 번호 형식입니다.');
        setIsVerifying(false);
        return;
      }

      // API로 실제 사업자 번호 조회
      const apiKey = import.meta.env.VITE_BUSINESS_API_SERVICE_KEY;
      if (!apiKey) {
        console.error('사업자 번호 조회 API 키가 설정되지 않았습니다.');
        setError('서비스 설정 오류가 발생했습니다.');
        setIsVerifying(false);
        return;
      }

      const response = await fetch('https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=' + encodeURIComponent(apiKey), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          b_no: [numbersOnly]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류:', errorText);
        setError('사업자 번호 조회 중 오류가 발생했습니다.');
        setIsVerifying(false);
        return;
      }

      const result = await response.json();
      console.log('사업자 번호 조회 결과:', result);

      // API 응답 확인
      if (result.data && result.data.length > 0) {
        const businessData = result.data[0];
        // b_stt: 사업자 상태 (01: 부도, 02: 휴업, 03: 폐업, 04: 정상)
        // b_stt_cd: 사업자 상태 코드
        if (businessData.b_stt === '01' || businessData.b_stt === '02' || businessData.b_stt === '03') {
          setError('휴업, 폐업, 또는 부도 상태의 사업자 번호입니다.');
          setIsVerifying(false);
          return;
        }

        // 정상 사업자 번호인 경우 저장
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            businessNumber: numbersOnly,
            businessNumberVerifiedAt: serverTimestamp()
          }, { merge: true });
          
          // 검증 통과
          localStorage.setItem('businessNumberVerified', 'true');
          localStorage.setItem('businessNumber', numbersOnly);
          onVerify(true);
        }
      } else {
        setError('등록되지 않은 사업자 번호입니다.');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error('사업자 등록 번호 검증 오류:', err);
      setError('검증 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsVerifying(false);
    }
  };

  // 사업자 등록 번호 진위 확인 함수
  const verifyBusinessNumber = (number) => {
    if (!number || number.length !== 10) {
      return false;
    }

    // 숫자만 있는지 확인
    if (!/^\d{10}$/.test(number)) {
      return false;
    }

    // 체크섬 검증 알고리즘
    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;

    // 앞 9자리에 가중치를 곱한 합 계산
    for (let i = 0; i < 9; i++) {
      sum += parseInt(number[i]) * weights[i];
    }

    // 10번째 자리(인덱스 8)의 가중치 5를 곱한 값을 10으로 나눈 몫을 더함
    sum += Math.floor((parseInt(number[8]) * 5) / 10);

    // 체크섬 계산: 10에서 (합 % 10)을 뺀 값
    const checkDigit = (10 - (sum % 10)) % 10;

    // 마지막 자리(인덱스 9)와 체크섬이 일치하는지 확인
    return checkDigit === parseInt(number[9]);
  };

  return (
    <div className="business-number-overlay">
      <div className="business-number-modal">
        <div className="business-number-content">
          <h2 className="business-number-title">사업자 등록 번호 확인</h2>
          <p className="business-number-description">
            서비스 이용을 위해 사업자 등록 번호를 입력해주세요.
          </p>
          
          <form onSubmit={handleSubmit} className="business-number-form">
            <div className="business-number-input-group">
              <input
                type="text"
                className="business-number-input"
                value={businessNumber}
                onChange={handleChange}
                placeholder="123-45-67890"
                maxLength={12}
                disabled={isVerifying}
                autoFocus
              />
              {error && <div className="business-number-error">{error}</div>}
            </div>
            
            <div className="business-number-actions">
              <button
                type="submit"
                className="business-number-submit"
                disabled={isVerifying || businessNumber.replace(/\D/g, '').length !== 10}
              >
                {isVerifying ? '확인 중...' : '확인'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessNumberModal;
