import { useNavigate } from 'react-router-dom';
import './TermsOfService.css';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <div className="terms-container">
        <button className="terms-back-button" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </button>
        <h1 className="terms-title">이용약관</h1>
        <div className="terms-content">
          <p className="terms-updated">최종 수정일: 2025년 2월 2일</p>
          
          <section className="terms-section">
            <h2>제1조 (목적)</h2>
            <p>
              이 약관은 비즈블라(BIZBLAH, 이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>제2조 (정의)</h2>
            <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ul>
              <li>"서비스"란 회사가 제공하는 프랜차이즈 점주 커뮤니티 플랫폼을 의미합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
              <li>"회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
              <li>"게시물"이란 회원이 서비스를 이용하면서 게시한 글, 사진, 각종 파일과 링크 등을 말합니다.</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>제3조 (약관의 게시와 개정)</h2>
            <p>
              회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>제4조 (회원가입)</h2>
            <p>
              이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다. 회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
            </p>
            <ul>
              <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
              <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
              <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>제5조 (서비스의 제공 및 변경)</h2>
            <p>회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul>
              <li>익명 게시판 서비스</li>
              <li>커뮤니티 소통 서비스</li>
              <li>브랜드 리뷰 서비스</li>
              <li>건의사항 제출 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>제6조 (서비스의 중단)</h2>
            <p>
              회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다. 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>제7조 (회원의 의무)</h2>
            <p>회원은 다음 행위를 하여서는 안 됩니다:</p>
            <ul>
              <li>신청 또는 변경 시 허위내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>제8조 (게시물의 저작권)</h2>
            <p>
              이용자가 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다. 이용자는 서비스를 이용하여 취득한 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>제9조 (개인정보보호)</h2>
            <p>
              회사는 이용자의 개인정보 수집 시 서비스 제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 회사는 회원가입 시 구매계약이 필요하거나 서비스 제공을 위하여 필요한 개인정보만을 수집하며, 사상, 신념, 가족 및 친인척관계, 학력(學歷), 병력(病歷), 기타 사회활동 경력 등 개인의 권리·이익이나 사생활을 뚜렷하게 침해할 우려가 있는 민감정보는 수집하지 않습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>제10조 (회원의 ID 및 비밀번호에 대한 의무)</h2>
            <p>
              회원은 Google 계정을 통해 로그인하며, Google 계정의 보안에 대한 책임은 회원 본인에게 있습니다. 회원은 자신의 Google 계정이 부정하게 사용된 것을 인지한 경우 즉시 회사에 통지하여야 합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>제11조 (면책조항)</h2>
            <p>
              회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>제12조 (준거법 및 관할법원)</h2>
            <p>
              이 약관의 해석 및 회사와 회원 간의 분쟁에 대하여는 대한민국의 법을 적용하며, 본 서비스와 관련하여 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2>부칙</h2>
            <p>이 약관은 2025년 2월 2일부터 시행됩니다.</p>
            <div className="terms-contact">
              <p><strong>문의처:</strong> 고객센터 1877-4463</p>
              <p><strong>이메일:</strong> support@bizblah.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
