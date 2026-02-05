# 오늘 추가된 변경사항 (2026년 2월 2일)

## 1. 헤더 로고 클릭 시 스크롤 기능
- 홈 화면에서 스크롤을 내렸을 때 헤더의 "비즈블라" 로고 클릭 시 맨 상단으로 부드럽게 스크롤
- 게시글 상세 페이지에서는 홈으로 이동 후 스크롤
- `window.scrollTo({ top: 0, behavior: 'smooth' })` 사용

## 2. 텍스트 용어 변경
- "자영업자" → "프랜차이즈 점주"로 전체 앱에서 일괄 변경
- 변경된 파일:
  - `src/components/MainContent.jsx`
  - `src/components/BrandSelection.jsx`
  - `src/App.jsx`
  - `src/hooks/useSEO.js`
  - `src/components/PostDetailPage.jsx`
  - `src/components/Welcome.jsx`

## 3. 텍스트 에어리어 크기 조절 UI 제거
- 모든 textarea에서 크기 조절 핸들 제거
- 전역 CSS (`src/index.css`)에 `textarea { resize: none; }` 추가
- 각 컴포넌트 CSS 파일에서도 `resize: vertical` → `resize: none`으로 변경
- 변경된 파일:
  - `src/index.css`
  - `src/components/SuggestionBoard.css`
  - `src/components/PostDetail.css`
  - `src/components/PostWrite.css`
  - `src/components/Comment.css`
  - `src/components/AdminNoticeWrite.css`
  - `src/components/SuggestionWrite.css`
  - `src/components/BrandReview.css`

## 4. 구글 로그인 화면에 브랜드 다시 선택하기 버튼 추가
- 로그인 화면에 "브랜드 다시 선택하기" 버튼 추가
- 브랜드가 선택된 상태에서만 표시
- 클릭 시 브랜드 선택 화면으로 이동
- 변경된 파일:
  - `src/components/Login.jsx`
  - `src/components/Login.css`

## 5. 회원탈퇴 기능 추가
- 로그아웃 버튼 아래에 "회원탈퇴" 버튼 추가
- 확인 모달 표시 후 탈퇴 진행
- Firestore의 `users` 및 `nicknames` 컬렉션에서 사용자 데이터 삭제
- Firebase Auth에서 계정 삭제
- 변경된 파일:
  - `src/contexts/AuthContext.jsx` (deleteAccount 함수 추가)
  - `src/components/Header.jsx` (회원탈퇴 버튼 및 모달 추가)
  - `src/components/Header.css` (회원탈퇴 모달 스타일 추가)

## 6. 구글 로그인 후 게시판으로 이동하도록 수정
- 로그인 완료 후 프로필이 있고 브랜드가 있으면 게시판으로 바로 이동
- 브랜드 선택 화면으로 가는 버그 수정
- 로그인 전에 선택한 브랜드를 유지하도록 개선
- 변경된 파일:
  - `src/App.jsx` (라우팅 로직 수정)
  - `src/contexts/AuthContext.jsx` (프로필 로드 시 브랜드 유지 로직 개선)

## 7. 댓글 카운트에 대댓글 포함
- 댓글 수 표시 시 대댓글도 포함하도록 수정
- 대댓글 작성 시 게시글의 `commentsCount`도 증가
- 게시글 상세 페이지에서 댓글 수 = 댓글 수 + 대댓글 수로 표시
- 변경된 파일:
  - `src/components/Comment.jsx` (대댓글 작성 시 commentsCount 증가)
  - `src/components/PostDetail.jsx` (댓글 수 계산 로직 수정)

## 8. 전체 게시판에서도 대댓글 합계 표시
- 게시판 목록에서도 댓글 수에 대댓글 포함
- 각 게시글의 댓글과 대댓글을 실시간으로 계산하여 표시
- 변경된 파일:
  - `src/components/Board.jsx` (댓글/대댓글 수 계산 로직 추가)

## 9. 건의사항 상태 변경 즉시 반영
- 관리자가 건의사항 상태를 변경할 때 즉시 반영되도록 수정
- `serverTimestamp()` 사용 및 선택된 건의사항 state 즉시 업데이트
- 변경된 파일:
  - `src/components/AdminSuggestions.jsx` (serverTimestamp 추가, state 업데이트)

## 10. 뒤로가기 버튼 디자인 분리
- '← 목록으로' 버튼과 뒤로가기 아이콘의 디자인 분리
- '← 목록으로' 버튼: `back-to-list-button` 클래스 사용
- 뒤로가기 아이콘: `back-button` 클래스 사용 (예전 디자인으로 롤백)
- 변경된 파일:
  - `src/components/AdminSuggestions.jsx` (클래스명 변경)
  - `src/components/SuggestionBoard.jsx` (클래스명 변경)
  - `src/components/NoticeBoard.jsx` (클래스명 변경)
  - `src/components/AdminSuggestions.css` (스타일 분리)
  - `src/components/SuggestionBoard.css` (스타일 분리)
  - `src/components/NoticeBoard.css` (스타일 분리)
  - `src/components/PostDetail.css` (뒤로가기 아이콘 예전 디자인으로 롤백)

## 11. '← 목록으로' 버튼 텍스트 제거
- '← 목록으로' 텍스트 제거하고 화살표 아이콘만 표시
- 모든 관련 버튼에 SVG 화살표 아이콘 추가
- 변경된 파일:
  - `src/components/AdminSuggestions.jsx` (SVG 아이콘 추가)
  - `src/components/SuggestionBoard.jsx` (SVG 아이콘 추가)
  - `src/components/NoticeBoard.jsx` (SVG 아이콘 추가)
  - `src/components/AdminSuggestions.css` (아이콘 스타일 추가)
  - `src/components/SuggestionBoard.css` (아이콘 스타일 추가)
  - `src/components/NoticeBoard.css` (아이콘 스타일 추가)

## 12. 게시판 팝업 시 body 스크롤 비활성화
- 게시글 상세 모달, 글쓰기 모달, 글 수정 모달이 열릴 때 body 스크롤 비활성화
- 모달이 닫히면 자동으로 스크롤 복원
- 변경된 파일:
  - `src/components/PostDetail.jsx` (useEffect 추가)
  - `src/components/PostWrite.jsx` (useEffect 추가)
  - `src/components/PostEdit.jsx` (useEffect 추가)

## 13. 모바일에서 글쓰기 폼 꽉 차게 표시
- 모바일에서 `.post-write-form`이 화면을 꽉 채우도록 수정
- overlay padding 제거, 모달 border-radius 제거
- 폼 내부 padding 최소화
- 변경된 파일:
  - `src/components/PostWrite.css` (모바일 스타일 수정)

---

## 요약

총 **13건**의 변경사항이 있었습니다:

1. ✅ 헤더 로고 클릭 시 스크롤 기능
2. ✅ 텍스트 용어 변경 ("자영업자" → "프랜차이즈 점주")
3. ✅ 텍스트 에어리어 크기 조절 UI 제거
4. ✅ 구글 로그인 화면에 브랜드 다시 선택하기 버튼 추가
5. ✅ 회원탈퇴 기능 추가
6. ✅ 구글 로그인 후 게시판으로 이동하도록 수정
7. ✅ 댓글 카운트에 대댓글 포함
8. ✅ 전체 게시판에서도 대댓글 합계 표시
9. ✅ 건의사항 상태 변경 즉시 반영
10. ✅ 뒤로가기 버튼 디자인 분리
11. ✅ '← 목록으로' 버튼 텍스트 제거 (아이콘만)
12. ✅ 게시판 팝업 시 body 스크롤 비활성화
13. ✅ 모바일에서 글쓰기 폼 꽉 차게 표시
