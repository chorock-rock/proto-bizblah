# BIZBLAH 프로젝트 기획서

## 1. 프로젝트 개요

### 1.1 프로젝트명
**BIZBLAH** - 프랜차이즈 점주 익명 커뮤니티 플랫폼

### 1.2 프로젝트 목적
프랜차이즈 점주들이 안전하고 자유롭게 정보를 공유하고 소통할 수 있는 익명 커뮤니티 플랫폼 제공

### 1.3 핵심 가치
- **익명성**: 닉네임 기반의 익명 커뮤니티
- **브랜드별 커뮤니티**: 동일 브랜드 점주들 간의 정보 공유
- **신뢰성**: 사업자 번호 인증을 통한 점주 인증
- **자유로운 소통**: 부담 없는 정보 공유 및 네트워킹

---

## 2. 기술 스택

### 2.1 Frontend
- **React 19**: UI 라이브러리
- **Vite**: 빌드 도구 및 개발 서버
- **React Router Dom**: 클라이언트 사이드 라우팅
- **CSS Variables**: 디자인 토큰 관리
- **Pretendard**: 한글 웹폰트

### 2.2 Backend & Services
- **Firebase Authentication**: Google 로그인
- **Firebase Firestore**: 실시간 데이터베이스
- **Firebase Analytics**: 사용자 행동 분석
- **공공데이터포털 API**: 사업자 번호 진위 확인

### 2.3 라이브러리
- **recharts**: 관리자 대시보드 차트
- **Firebase SDK**: Firebase 서비스 연동

---

## 3. 주요 기능

### 3.1 사용자 인증 및 온보딩

#### 3.1.1 브랜드 선택
- **화면**: 브랜드 선택 화면
- **기능**:
  - 프랜차이즈 브랜드 선택 (메가커피, 초록마을, 스타벅스, 이디야커피, 투썸플레이스, 엔젤리너스, 할리스커피, 빽다방, 탐앤탐스, 기타)
  - 선택한 브랜드는 로컬 스토리지에 저장
  - 법적 고지사항 표시: "본 커뮤니티는 프랜차이즈 점주 간 정보 교류를 목적으로 한 독립적인 커뮤니티이며, 각 브랜드 본사와는 어떠한 공식적 제휴·운영·보증 관계도 없습니다."
- **제약사항**: 로그인 후에는 브랜드 변경 불가

#### 3.1.2 Google 로그인
- **인증 방식**: Firebase Authentication의 Google Sign-in
- **프로세스**: 브랜드 선택 → Google 로그인 → 닉네임 설정

#### 3.1.3 닉네임 설정
- **기능**:
  - 최초 로그인 시 닉네임 설정 필수
  - 닉네임 중복 확인
  - 닉네임 길이 제한: 2-20자
  - 닉네임은 Firestore의 `users` 컬렉션과 `nicknames` 컬렉션에 저장

#### 3.1.4 사업자 번호 인증
- **트리거**: 사용자가 스크롤할 때 자동 팝업
- **기능**:
  - 사업자 번호 입력 (자동 포맷팅: 123-45-67890)
  - 공공데이터포털 API를 통한 진위 확인
  - 사업자 상태 확인 (정상/휴업/폐업/부도)
  - 검증된 사업자 번호는 Firestore `users` 컬렉션에 저장
- **제약사항**:
  - 팝업 표시 중 스크롤 차단
  - X 버튼 없음, 배경 클릭으로 닫기 불가
  - 검증 완료 전까지 계속 표시

---

### 3.2 게시판 기능

#### 3.2.1 게시글 목록
- **필터링**:
  - **내 브랜드 게시판**: 선택한 브랜드의 게시글만 표시
  - **내가 쓴 글**: 현재 사용자가 작성한 게시글만 표시
- **게시글 카드 구성**:
  - 브랜드 | 닉네임 | 작성시간
  - 제목
  - 내용 (2줄 말줄임)
  - 통계: 좋아요 수, 댓글 수, 조회수 (아이콘 포함)
- **기능**:
  - 게시글 클릭 시 상세 페이지로 이동
  - 리스트에서 직접 좋아요 가능 (하트 아이콘 클릭)
  - 좋아요 상태 표시 (좋아요한 경우 채워진 빨간 하트)
  - 스크롤 위치 저장 및 복원

#### 3.2.2 게시글 작성
- **UI**: 플로팅 액션 버튼 (우측 하단)
- **기능**:
  - 제목 입력 (최대 100자)
  - 내용 입력 (텍스트 영역)
  - 작성 완료 시 게시판에 즉시 반영
- **Firestore 저장**: `posts` 컬렉션

#### 3.2.3 게시글 상세
- **레이아웃**:
  - 헤더: 뒤로가기 버튼 (좌측), 조회수 및 좋아요 버튼 (우측)
  - 메타 정보: 브랜드 | 닉네임 | 작성시간
  - 제목
  - 본문 (스크롤 가능)
  - 수정/삭제 버튼 (작성자만, 제목 옆)
- **기능**:
  - 조회수 증가 (세션당 1회)
  - 좋아요 (하트 아이콘 클릭)
  - 좋아요 애니메이션 (하트가 위로 날아가는 효과)
  - 댓글 작성/조회
  - 공유 기능 (링크 복사)
- **URL**: `/post/:postId` (딥링크 지원)
- **모달 형태**: 배경 딤 처리, URL 유지

#### 3.2.4 게시글 수정/삭제
- **권한**: 작성자만 가능
- **UI**: 제목 옆에 수정/삭제 아이콘 버튼
- **기능**:
  - 수정: 팝업 모달에서 제목/내용 수정
  - 삭제: 확인 후 삭제

#### 3.2.5 댓글 기능
- **기능**:
  - 댓글 작성
  - 대댓글 작성 (댓글에 대한 답글)
  - 댓글/대댓글 좋아요
  - 좋아요 애니메이션 (하트가 위로 날아가는 효과)
- **Firestore 구조**: `posts/{postId}/comments/{commentId}`

---

### 3.3 브랜드 리뷰 기능

#### 3.3.1 리뷰 작성
- **접근 제한**: 리뷰를 작성한 사용자만 페이지 접근 가능
- **UI**: 페이지 진입 시 자동으로 리뷰 작성 팝업 표시
- **평가 항목** (각 항목별 0-5점, 0.5점 단위):
  - 수익성 만족도
  - 본사 지원 만족도
  - 물류·원가 합리성
  - 브랜드 경쟁력
  - 소통·정책 신뢰도
- **입력 방식**: 별 5개를 클릭/스와이프하여 점수 선택
  - 별의 왼쪽 절반: 0.5점
  - 별의 오른쪽 절반: 1점
- **제약사항**: 1인당 1회만 작성 가능 (수정 불가)

#### 3.3.2 리뷰 통계 표시
- **레이아웃**:
  - 좌측: 평균 점수 (큰 숫자), 평균 별점, 평가 인원 수
  - 우측: 세부 평가 항목별 점수 및 별점
- **별점 표시**:
  - 0.5점 단위로 반올림
  - 0.5점은 반별 표시
  - 최대 5개 별

#### 3.3.3 리뷰 목록
- **표시 정보**:
  - 작성자 닉네임
  - 작성일 (상대 시간: 오늘, N일 전, N주 전, N개월 전)
  - 평균 점수 및 별점
  - 세부 평가 항목별 점수 및 별점
- **정렬**: 작성일 기준 내림차순

---

### 3.4 공지사항 기능

#### 3.4.1 사용자 화면
- **접근**: 헤더 메뉴 → "공지사항"
- **기능**: 관리자가 작성한 공지사항 목록 조회

#### 3.4.2 관리자 화면
- **접근**: 관리자 대시보드 → "공지사항 작성"
- **기능**: 공지사항 작성 및 관리

---

### 3.5 건의하기 기능

#### 3.5.1 사용자 화면
- **접근**: 헤더 메뉴 → "건의하기"
- **UI**: 인라인 폼 (팝업 없음)
- **기능**:
  - 건의 내용 입력
  - 제출 시 "건의가 완료되었습니다" 메시지 및 체크 표시
  - 제출 후 폼 숨김 처리
- **Firestore 저장**: `suggestions` 컬렉션

#### 3.5.2 관리자 화면
- **접근**: 관리자 대시보드 → "건의사항 확인"
- **기능**: 사용자들이 제출한 건의사항 목록 조회

---

### 3.6 관리자 기능

#### 3.6.1 관리자 로그인
- **경로**: `/admin/login`
- **인증**: 비밀번호 기반 (비밀번호: `abcd 12345`)
- **세션 관리**: sessionStorage 사용

#### 3.6.2 관리자 대시보드
- **경로**: `/admin`
- **기능**:
  - 일일 가입자 수 차트 (Line Chart)
  - 일일 게시글 수 차트 (Line Chart)
  - 공지사항 작성
  - 네비게이션: 대시보드, 게시글 관리, 공지사항, 건의사항 확인

#### 3.6.3 게시글 관리
- **경로**: `/admin/posts`
- **기능**:
  - 전체 게시글 목록 조회
  - 게시글 삭제
  - 게시글 상세 정보 확인

---

### 3.7 기타 기능

#### 3.7.1 초대하기
- **접근**: 헤더 메뉴 → "초대하기"
- **기능**: 현재 사이트 URL을 클립보드에 복사
- **피드백**: "링크가 복사되었어요! 붙여넣기로 전달해주세요" 토스트 메시지

#### 3.7.2 헤더 네비게이션
- **햄버거 메뉴** (우측 상단):
  - 홈 (내 브랜드 게시판)
  - 내가 쓴 글
  - 공지사항
  - 건의하기
  - 브랜드 리뷰
  - 초대하기
  - 로그아웃
- **사용자 정보 표시**: 브랜드 배지 + 닉네임

---

## 4. 데이터 구조

### 4.1 Firestore 컬렉션

#### 4.1.1 `users`
```javascript
{
  uid: string,
  nickname: string,
  brand: string,
  businessNumber: string,
  businessNumberVerifiedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 4.1.2 `nicknames`
```javascript
{
  nickname: string,
  userId: string,
  createdAt: timestamp
}
```

#### 4.1.3 `posts`
```javascript
{
  id: string,
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  authorBrand: string,
  likes: number,
  commentsCount: number,
  views: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 4.1.4 `posts/{postId}/likes/{userId}`
```javascript
{
  userId: string,
  createdAt: timestamp,
  deleted: boolean
}
```

#### 4.1.5 `posts/{postId}/comments/{commentId}`
```javascript
{
  content: string,
  authorId: string,
  authorName: string,
  likes: number,
  repliesCount: number,
  createdAt: timestamp
}
```

#### 4.1.6 `posts/{postId}/comments/{commentId}/replies/{replyId}`
```javascript
{
  content: string,
  authorId: string,
  authorName: string,
  likes: number,
  createdAt: timestamp
}
```

#### 4.1.7 `notices`
```javascript
{
  title: string,
  content: string,
  authorId: string,
  createdAt: timestamp
}
```

#### 4.1.8 `suggestions`
```javascript
{
  content: string,
  authorId: string,
  authorName: string,
  createdAt: timestamp
}
```

#### 4.1.9 `brandReviews`
```javascript
{
  brand: string,
  authorId: string,
  authorName: string,
  profitability: number,
  support: number,
  logistics: number,
  competitiveness: number,
  communication: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 5. UI/UX 디자인

### 5.1 디자인 시스템

#### 5.1.1 색상
- **Primary**: #667eea (보라색 그라데이션)
- **Text Primary**: #333
- **Text Secondary**: #666
- **Like Color**: #ff6b6b (빨간색)
- **Background**: #ffffff, #f8f9fa

#### 5.1.2 폰트
- **전체 폰트**: Pretendard
- **크기**: 반응형 (데스크톱/태블릿/모바일)

#### 5.1.3 아이콘
- **SVG 아이콘**: 하트, 댓글, 조회수, 공유, 뒤로가기 등
- **커스텀 디자인**: 일관된 스타일의 아이콘 세트

### 5.2 반응형 디자인

#### 5.2.1 브레이크포인트
- **Desktop**: 1024px 이상
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: 480px 미만

#### 5.2.2 모바일 최적화
- 게시글 상세 모달: 전체 화면
- 햄버거 메뉴: 우측 슬라이드
- 플로팅 버튼: 우측 하단 고정
- 터치 친화적 버튼 크기

### 5.3 애니메이션

#### 5.3.1 좋아요 애니메이션
- 하트 아이콘 클릭 시 하트 파티클이 위로 날아가는 효과
- 구불구불한 경로로 이동
- 3초 동안 애니메이션
- 작은 크기의 하트 파티클

#### 5.3.2 모달 애니메이션
- 페이드인 및 슬라이드업 효과
- 부드러운 전환 애니메이션

---

## 6. 사용자 플로우

### 6.1 신규 사용자 플로우
1. 브랜드 선택 화면
2. 법적 고지사항 확인
3. Google 로그인
4. 닉네임 설정
5. 메인 게시판 진입
6. 스크롤 시 사업자 번호 인증 팝업
7. 사업자 번호 입력 및 검증
8. 게시판 이용 시작

### 6.2 기존 사용자 플로우
1. 브랜드 자동 선택 (로컬 스토리지)
2. Google 로그인
3. 메인 게시판 진입

### 6.3 게시글 작성 플로우
1. 플로팅 버튼 클릭
2. 게시글 작성 팝업 열기
3. 제목 및 내용 입력
4. 작성하기 버튼 클릭
5. 게시판에 즉시 반영

### 6.4 리뷰 작성 플로우
1. 브랜드 리뷰 페이지 진입
2. 리뷰 작성 팝업 자동 표시
3. 각 항목별 별점 선택 (스와이프/클릭)
4. 제출하기 버튼 클릭
5. 리뷰 통계 및 목록 표시

---

## 7. 보안 및 제약사항

### 7.1 인증
- Google 로그인 필수
- 사업자 번호 인증 (공공데이터포털 API)
- 세션 관리 (sessionStorage)

### 7.2 데이터 접근 제어
- 브랜드별 게시글 필터링
- 작성자만 게시글 수정/삭제 가능
- 리뷰는 1인당 1회만 작성 가능
- 리뷰 작성자만 리뷰 페이지 접근 가능

### 7.3 Firebase 규칙
- 개발 단계: 모든 읽기/쓰기 허용
- 프로덕션: 적절한 보안 규칙 적용 필요

---

## 8. 분석 및 추적

### 8.1 Google Analytics
- 페이지뷰 추적
- 사용자 행동 이벤트 추적:
  - 로그인/로그아웃
  - 게시글 작성/수정/삭제
  - 댓글/대댓글 작성
  - 좋아요/좋아요 취소
  - 공유
  - 공지사항 작성
  - 건의사항 제출

---

## 9. 향후 개선 사항

### 9.1 기능 개선
- 이미지 업로드 기능
- 게시글 검색 기능
- 알림 기능
- 실시간 채팅

### 9.2 성능 최적화
- 이미지 최적화
- 코드 스플리팅
- 캐싱 전략

### 9.3 보안 강화
- Firebase 보안 규칙 강화
- 입력값 검증 강화
- XSS 방지

---

## 10. 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Admin*.jsx      # 관리자 관련 컴포넌트
│   ├── Board.jsx       # 게시판
│   ├── BrandReview.jsx # 브랜드 리뷰
│   ├── BrandSelection.jsx # 브랜드 선택
│   ├── BusinessNumberModal.jsx # 사업자 번호 인증
│   ├── Comment.jsx     # 댓글
│   ├── Header.jsx      # 헤더
│   ├── Login.jsx       # 로그인
│   ├── MainContent.jsx # 메인 콘텐츠
│   ├── NicknameSetup.jsx # 닉네임 설정
│   ├── NoticeBoard.jsx # 공지사항
│   ├── PostDetail.jsx  # 게시글 상세
│   ├── PostEdit.jsx    # 게시글 수정
│   ├── PostWrite.jsx   # 게시글 작성
│   └── SuggestionBoard.jsx # 건의하기
├── contexts/           # React Context
│   ├── AuthContext.jsx # 인증 컨텍스트
│   └── AdminContext.jsx # 관리자 컨텍스트
├── styles/             # 공통 스타일
│   └── colors.css      # 색상 변수
├── firebase.js         # Firebase 설정
├── App.jsx             # 메인 앱 컴포넌트
└── main.jsx            # 진입점
```

---

## 11. 환경 변수

### 11.1 Firebase 설정
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### 11.2 공공데이터포털 API
```
VITE_BUSINESS_API_SERVICE_KEY=
```

---

## 12. 주요 화면 구성

### 12.1 사용자 화면
1. **브랜드 선택 화면**: 브랜드 선택 및 법적 고지
2. **로그인 화면**: Google 로그인
3. **닉네임 설정 화면**: 닉네임 입력 및 중복 확인
4. **메인 게시판**: 게시글 목록, 플로팅 작성 버튼
5. **게시글 상세**: 게시글 내용, 댓글, 좋아요
6. **브랜드 리뷰**: 평균 점수, 세부 평가, 리뷰 목록
7. **공지사항**: 공지사항 목록
8. **건의하기**: 건의사항 작성 폼

### 12.2 관리자 화면
1. **관리자 로그인**: 비밀번호 입력
2. **관리자 대시보드**: 통계 차트, 공지사항 작성
3. **게시글 관리**: 게시글 목록 및 삭제
4. **건의사항 확인**: 건의사항 목록

---

## 13. 특수 기능

### 13.1 스크롤 위치 복원
- 게시글 상세에서 뒤로가기 시 이전 스크롤 위치로 복원
- sessionStorage 사용

### 13.2 좋아요 애니메이션
- 하트 파티클이 위로 날아가는 효과
- 구불구불한 경로로 이동
- 3초 동안 지속

### 13.3 별점 입력
- 별 5개를 클릭/스와이프하여 점수 선택
- 별의 왼쪽 절반: 0.5점, 오른쪽 절반: 1점
- 실시간 점수 표시

---

## 14. 브라우저 호환성

- Chrome (최신 버전)
- Safari (최신 버전)
- Firefox (최신 버전)
- Edge (최신 버전)
- 모바일 브라우저 (iOS Safari, Chrome Mobile)

---

## 15. 배포

### 15.1 빌드
```bash
npm run build
```

### 15.2 배포 플랫폼
- Firebase Hosting (권장)
- Vercel
- Netlify

---

## 16. 유지보수

### 16.1 로그 관리
- Firebase Console에서 에러 로그 확인
- Google Analytics에서 사용자 행동 분석

### 16.2 데이터 관리
- Firestore Console에서 데이터 확인 및 관리
- 인덱스 생성 및 관리

---

## 17. 라이선스

이 프로젝트는 개인 프로젝트입니다.
