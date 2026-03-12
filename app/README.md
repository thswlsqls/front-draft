# Tech N AI — App

AI/ML 기술 동향을 탐색하고, 북마크하고, AI 챗봇과 대화할 수 있는 사용자용 웹 애플리케이션입니다.

## 기술 스택

| 항목 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Radix UI, Lucide Icons |
| Styling | Tailwind CSS v4, Neo-Brutalism 커스텀 디자인 시스템 |
| Date | date-fns v4, react-day-picker v9 |
| Fonts | Space Grotesk (sans), DM Mono (mono) |

## 주요 기능

### 신기술 동향 피드 (`/`)

- AI 기술 업데이트 카드 그리드 (페이지당 20건, 스켈레톤 로딩)
- 전체 텍스트 검색 (`/api/v1/emerging-tech/search`)
- 다차원 필터링: 제공사 (OpenAI/Anthropic/Google/Meta/xAI), 업데이트 유형, 소스 유형, 날짜 범위 (캘린더 피커)
- 상세 보기 모달
- 카드별 북마크 토글 (로그인 시)
- API 응답 필드 호환성 처리 (`items/totalCount` → `list/totalSize` 정규화)

### 북마크 (`/bookmarks`)

- 저장된 기사 목록 (페이지당 10건)
- 제목/메모/태그/전체 검색
- 정렬 (생성일 순, 최근 수정 순) 및 제공사 필터
- 태그·메모 수정 모달
- 소프트 삭제 및 휴지통 (`/bookmarks/deleted`) — 기간 필터 및 복원
- 변경 이력 모달 (감사 추적, 버전별 복원)

### AI 챗봇 (`/chat`)

- 분할 레이아웃: 세션 사이드바 + 메시지 영역
- 세션 관리: 생성, 삭제, 인라인 제목 수정 (optimistic update + 롤백)
- 위로 무한 스크롤 메시지 히스토리 (스크롤 위치 보존)
- 타이핑 인디케이터, 실패 메시지 재시도
- RAG 소스 인용 (관련도 점수 + 컬렉션 타입 배지)
- 빈 상태 예시 질문

### 인증

- 이메일/비밀번호 회원가입 (이메일 인증)
- 이메일/비밀번호 로그인
- Google OAuth 소셜 로그인
- 비밀번호 재설정 (이메일 요청 → 토큰 확인)
- 계정 삭제
- BFF 패턴 + HttpOnly Cookie 기반 JWT 보안

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (폰트, Provider)
│   ├── page.tsx                      # 신기술 동향 피드
│   ├── globals.css                   # Tailwind + Neo-Brutalism 유틸리티
│   ├── signin/page.tsx               # 로그인
│   ├── signup/page.tsx               # 회원가입
│   ├── verify-email/page.tsx         # 이메일 인증
│   ├── reset-password/
│   │   ├── page.tsx                  # 비밀번호 재설정 요청
│   │   └── confirm/page.tsx          # 새 비밀번호 설정
│   ├── oauth/callback/page.tsx       # Google OAuth 콜백
│   ├── bookmarks/
│   │   ├── page.tsx                  # 북마크 목록
│   │   └── deleted/page.tsx          # 삭제된 북마크 (휴지통)
│   ├── chat/page.tsx                 # AI 챗봇
│   └── api/bff/auth/                 # BFF 인증 라우트
│       ├── login/route.ts
│       ├── logout/route.ts
│       ├── refresh/route.ts
│       ├── me/route.ts
│       └── oauth/callback/route.ts
├── components/
│   ├── auth/                         # 인증 컴포넌트 (Header, Form, OAuth 등)
│   ├── emerging-tech/                # 피드 컴포넌트 (Card, Grid, Filter, Search 등)
│   ├── bookmark/                     # 북마크 컴포넌트 (Card, Toggle, Edit, History 등)
│   ├── chatbot/                      # 챗봇 컴포넌트 (Sidebar, Message, Input 등)
│   └── ui/                           # 공통 UI (Button, Input, Dialog, Calendar 등)
├── contexts/
│   ├── auth-context.tsx              # 전역 인증 상태 관리
│   └── toast-context.tsx             # 토스트 알림 관리
├── lib/
│   ├── api.ts                        # 신기술 동향 API + normalizePageData
│   ├── auth-api.ts                   # 인증 API (로그인, 회원가입, OAuth, 재설정)
│   ├── auth-fetch.ts                 # 인증 fetch 래퍼 (자동 토큰 갱신)
│   ├── bookmark-api.ts              # 북마크 CRUD + 이력 API
│   ├── chatbot-api.ts               # 챗봇 세션·메시지 API
│   ├── cookie-config.ts             # 쿠키 설정 및 백엔드 URL
│   ├── constants.ts                 # 제공사/유형 라벨·색상 매핑
│   └── utils.ts                     # cn(), 유효성 검증 유틸리티
├── types/
│   ├── common.ts                    # PageData<T> 제네릭 페이지네이션 타입
│   ├── auth.ts                      # 인증 타입
│   ├── emerging-tech.ts             # 신기술 동향 타입
│   ├── bookmark.ts                  # 북마크 타입
│   └── chatbot.ts                   # 챗봇 타입
└── middleware.ts                    # /api/v1/* 요청에 Authorization 헤더 주입
```

## 인증 아키텍처

```
브라우저 → Next.js BFF Route Handler → 백엔드 (localhost:8081)
```

1. **로그인**: BFF 라우트가 백엔드에서 받은 JWT 토큰을 HttpOnly 쿠키로 설정, 디코딩된 사용자 정보만 클라이언트에 반환
2. **세션 복원**: `AuthProvider`가 마운트 시 `/api/bff/auth/me` 호출 → 쿠키의 JWT 디코딩 → 사용자 정보 반환
3. **인증된 요청**: Next.js 미들웨어가 `/api/v1/*` 요청에 쿠키에서 읽은 토큰을 `Authorization` 헤더로 주입
4. **토큰 갱신**: 401 응답 시 `authFetch`가 자동으로 `/api/bff/auth/refresh` 호출 후 원래 요청 재시도
5. **OAuth**: Google OAuth 콜백 → BFF 라우트가 코드 교환 → HttpOnly 쿠키 설정 → 사용자 정보 반환

## 페이지 라우트

| 경로 | 인증 필요 | 설명 |
|---|---|---|
| `/` | 아니오 (북마크 토글은 인증 필요) | 신기술 동향 피드 |
| `/signin` | 아니오 | 로그인 |
| `/signup` | 아니오 | 회원가입 |
| `/verify-email` | 아니오 | 이메일 인증 |
| `/reset-password` | 아니오 | 비밀번호 재설정 요청 |
| `/reset-password/confirm` | 아니오 | 새 비밀번호 설정 |
| `/oauth/callback` | 아니오 | Google OAuth 콜백 |
| `/bookmarks` | 예 | 북마크 목록 |
| `/bookmarks/deleted` | 예 | 삭제된 북마크 (휴지통) |
| `/chat` | 예 | AI 챗봇 |

## 시작하기

### 사전 요구사항

- Node.js 20+
- 백엔드 서버 실행 중 (`http://localhost:8081`)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm run dev
```

### 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8081` | 백엔드 서버 URL (BFF 라우트에서 사용) |

### 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (포트 3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |
