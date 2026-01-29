# BIZBLAH

프랜차이즈 점주 익명 커뮤니티

## 프로젝트 소개

BIZBLAH는 프랜차이즈 점주들을 위한 익명 커뮤니티 플랫폼입니다. 안전하고 자유로운 소통 공간을 제공하여 점주들이 부담 없이 정보를 공유하고 네트워킹할 수 있도록 합니다.

## 기술 스택

- **React 19** - UI 라이브러리
- **Vite** - 빌드 도구
- **Firebase Authentication** - Google 로그인
- **Firebase Firestore** - 데이터베이스 (향후 확장)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

Firebase 프로젝트를 생성하고 설정해야 합니다. 자세한 내용은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)를 참고하세요.

`src/firebase.js` 파일에서 Firebase 설정 값을 실제 값으로 교체하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

## 주요 기능

- ✅ Google 로그인 (Firebase Authentication)
- ✅ 사용자 인증 상태 관리
- ✅ 반응형 디자인
- 🔜 익명 게시판 (개발 예정)
- 🔜 실시간 채팅 (개발 예정)
- 🔜 커뮤니티 기능 (개발 예정)

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Login.jsx       # 로그인 화면
│   ├── Header.jsx      # 헤더 컴포넌트
│   └── MainContent.jsx # 메인 콘텐츠
├── contexts/           # React Context
│   └── AuthContext.jsx # 인증 컨텍스트
├── firebase.js         # Firebase 설정
├── App.jsx             # 메인 앱 컴포넌트
└── main.jsx            # 진입점
```

## 빌드

프로덕션 빌드를 생성하려면:

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 라이선스

이 프로젝트는 개인 프로젝트입니다.
