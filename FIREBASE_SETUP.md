# Firebase 설정 가이드

BIZBLAH 프로젝트에서 Firebase Google 로그인을 사용하기 위한 설정 방법입니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. "프로젝트 추가"를 클릭하여 새 프로젝트를 생성합니다.
3. 프로젝트 이름을 입력하고 Google Analytics 설정을 선택합니다.

## 2. Authentication 설정

1. Firebase Console에서 "Authentication" 메뉴로 이동합니다.
2. "시작하기"를 클릭합니다.
3. "Sign-in method" 탭에서 "Google"을 선택합니다.
4. "사용 설정"을 활성화하고 프로젝트 지원 이메일을 입력합니다.
5. "저장"을 클릭합니다.

## 3. Firestore Database 설정 (선택사항)

1. Firebase Console에서 "Firestore Database" 메뉴로 이동합니다.
2. "데이터베이스 만들기"를 클릭합니다.
3. 프로덕션 모드 또는 테스트 모드 중 하나를 선택합니다.
4. 위치를 선택합니다 (예: asia-northeast3 - 서울).

## 4. 웹 앱 등록

1. Firebase Console에서 프로젝트 설정(톱니바퀴 아이콘)으로 이동합니다.
2. "내 앱" 섹션에서 웹 아이콘(</>)을 클릭합니다.
3. 앱 닉네임을 입력하고 "앱 등록"을 클릭합니다.
4. Firebase SDK 설정 정보가 표시됩니다.

## 5. 프로젝트에 Firebase 설정 적용

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 Firebase Console에서 받은 실제 값으로 채워주세요:

1. `.env.example` 파일을 참고하여 `.env` 파일을 생성합니다.
2. Firebase Console에서 받은 설정 값을 `.env` 파일에 입력합니다:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

**참고**: Vite에서는 환경 변수에 `VITE_` 접두사가 필요합니다. 이 접두사가 붙은 변수만 클라이언트 코드에서 접근할 수 있습니다.

**중요**: `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다. 실제 값은 직접 입력해야 합니다.

## 6. 인증된 도메인 추가 (배포 시)

프로덕션 환경에 배포할 경우:
1. Firebase Console > Authentication > Settings > 승인된 도메인
2. 배포할 도메인을 추가합니다.

## 보안 주의사항

- Firebase 설정 값은 클라이언트에 노출되므로 공개되어도 안전합니다.
- 하지만 Firebase Console에서 API 키 제한을 설정하는 것을 권장합니다.
- Firestore 보안 규칙을 적절히 설정하여 데이터를 보호하세요.
- `.env` 파일은 절대 Git에 커밋하지 마세요. `.gitignore`에 이미 포함되어 있습니다.
- 프로덕션 환경에서는 별도의 환경 변수 설정이 필요할 수 있습니다.

## 문제 해결

- **로그인이 작동하지 않는 경우**: Firebase Console에서 Google 인증이 활성화되어 있는지 확인하세요.
- **CORS 오류**: 승인된 도메인에 현재 도메인이 추가되어 있는지 확인하세요.
- **권한 오류**: Firestore 보안 규칙을 확인하세요.
