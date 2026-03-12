# Tech N AI — Admin

관리자 계정을 관리하기 위한 Next.js 기반 어드민 패널입니다.

## 기술 스택

| 항목 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Radix UI, Lucide Icons |
| Styling | Tailwind CSS v4, Neo-Brutalism 커스텀 디자인 시스템 |
| Fonts | Space Grotesk (sans), DM Mono (mono) |

## 주요 기능

### 관리자 인증

- 이메일/비밀번호 로그인
- BFF(Backend-for-Frontend) 패턴을 통한 JWT 토큰 보안 처리
- HttpOnly Cookie 기반 토큰 저장 (클라이언트 JavaScript에 토큰 노출 방지)
- 자동 토큰 갱신 (401 응답 시 refresh → 재시도)
- 동시 갱신 요청 방지를 위한 singleton promise 패턴

### 계정 관리 (CRUD)

- 관리자 계정 목록 조회 (데이터 테이블 + 스켈레톤 로딩)
- 계정 상세 보기 (읽기 전용 모달)
- 계정 생성 (이메일, 사용자명, 비밀번호 — 필드별 유효성 검증)
- 계정 수정 (사용자명, 비밀번호 변경)
- 계정 삭제 (확인 대화상자 + 본인 계정 삭제 방지)

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                 # 루트 레이아웃 (폰트, AuthProvider, ToastProvider)
│   ├── page.tsx                   # 대시보드 (/ 경로, 인증 필요)
│   ├── accounts/page.tsx          # 계정 관리 페이지
│   ├── signin/page.tsx            # 로그인 페이지
│   └── api/bff/auth/              # BFF 인증 라우트
│       ├── login/route.ts
│       ├── logout/route.ts
│       ├── refresh/route.ts
│       └── me/route.ts
├── components/
│   ├── auth/                      # 인증 관련 컴포넌트 (Header, SigninForm)
│   ├── admin/                     # 계정 관리 컴포넌트 (Table, CRUD Dialogs)
│   └── ui/                        # 공통 UI 컴포넌트 (Button, Input, Dialog 등)
├── contexts/
│   ├── auth-context.tsx           # 전역 인증 상태 관리
│   └── toast-context.tsx          # 토스트 알림 관리
├── lib/
│   ├── auth-fetch.ts              # 인증 fetch 래퍼 (자동 토큰 갱신)
│   ├── auth-api.ts                # 로그인/로그아웃 API
│   ├── admin-api.ts               # 관리자 계정 CRUD API
│   ├── cookie-config.ts           # 쿠키 설정 및 백엔드 URL
│   └── utils.ts                   # cn(), 유효성 검증 유틸리티
├── types/
│   ├── auth.ts                    # 인증 관련 타입
│   └── admin.ts                   # 관리자 계정 타입
└── middleware.ts                  # /api/v1/* 요청에 Authorization 헤더 주입
```

## 인증 아키텍처

```
브라우저 → Next.js BFF Route Handler → 백엔드 (localhost:8081)
```

1. **로그인**: BFF 라우트가 백엔드에서 받은 JWT 토큰을 HttpOnly 쿠키로 설정하고, 디코딩된 사용자 정보만 클라이언트에 반환
2. **세션 복원**: `AuthProvider`가 마운트 시 `/api/bff/auth/me` 호출 → 쿠키의 JWT 디코딩 → 사용자 정보 반환
3. **인증된 요청**: Next.js 미들웨어가 `/api/v1/*` 요청에 쿠키에서 읽은 토큰을 `Authorization` 헤더로 주입
4. **토큰 갱신**: 401 응답 시 `authFetch`가 자동으로 `/api/bff/auth/refresh` 호출 후 원래 요청 재시도

## 시작하기

### 사전 요구사항

- Node.js 20+
- 백엔드 서버 실행 중 (`http://localhost:8081`)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3001)
npm run dev
```

### 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8081` | 백엔드 서버 URL (BFF 라우트에서 사용) |

### 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (포트 3001) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 (포트 3001) |
| `npm run lint` | ESLint 실행 |
