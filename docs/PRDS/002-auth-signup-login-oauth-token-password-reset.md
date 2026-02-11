# PRD: Auth - Signup, Login, OAuth, Token Management, Password Reset

**작성일**: 2026-02-10
**버전**: v1
**기반 프롬프트**: `docs/prompts/002-auth-prd-generation-prompt.md`
**API 스펙 문서**: `docs/API-specifications/api-auth-specification.md`

---

## 1. 개요

사용자 인증 기능을 프론트엔드에 구현한다. 회원가입, 로그인(일반/OAuth), 이메일 인증, 비밀번호 재설정, 토큰 관리, 로그아웃, 회원탈퇴를 포함한다.

| 항목 | 내용 |
|------|------|
| 기술 스택 | Next.js 16 (App Router) + React 19 + TypeScript |
| UI 라이브러리 | Radix UI + CVA (class-variance-authority) |
| 스타일링 | Tailwind CSS v4 + Neo-Brutalism 유틸리티 |
| 아이콘 | Lucide React |
| 폰트 | Space Grotesk (sans), DM Mono (mono) |
| 디자인 테마 | Neo-Brutalism |
| 색상 테마 | Primary Blue (#3B82F6), Accent (#DBEAFE), Black (#000000), White (#FFFFFF), Gray (#F5F5F5) |
| API Gateway | `http://localhost:8081` (Next.js rewrites `/api/*` → Gateway) |
| 인증 방식 | Bearer Token (JWT) — Access Token 1시간, Refresh Token 7일 |
| UI 언어 | English (모든 화면 텍스트 영문) |

---

## 2. API 연동

모든 요청은 Gateway(8081)로 전송한다. Next.js rewrites가 `/api/*` → `http://localhost:8081/api/*`로 프록시한다.

### 2.1 공통 응답 형식

```typescript
interface ApiResponse<T> {
  code: string;           // "2000" (성공), "4000", "4010" 등
  messageCode: {
    code: string;         // "SUCCESS", "AUTH_FAILED" 등
    text: string;
  };
  message?: string;
  data?: T;
}
```

에러 응답도 동일 구조. `code` 값으로 HTTP 상태를 판별하고, `messageCode.code`로 구체적 에러를 식별한다.

### 2.2 엔드포인트 목록

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/api/v1/auth/signup` | X | Sign up |
| 2 | POST | `/api/v1/auth/login` | X | Sign in |
| 3 | POST | `/api/v1/auth/logout` | O | Sign out |
| 4 | DELETE | `/api/v1/auth/me` | O | Delete account |
| 5 | POST | `/api/v1/auth/refresh` | X | Refresh token |
| 6 | GET | `/api/v1/auth/verify-email?token={token}` | X | Verify email |
| 7 | POST | `/api/v1/auth/reset-password` | X | Request password reset |
| 8 | POST | `/api/v1/auth/reset-password/confirm` | X | Confirm password reset |
| 9 | GET | `/api/v1/auth/oauth2/{provider}` | X | Start OAuth (302 redirect) |
| 10 | GET | `/api/v1/auth/oauth2/{provider}/callback` | X | OAuth callback |

### 2.3 요청/응답 상세

#### Sign Up (POST `/api/v1/auth/signup`)

**Request Body (SignupRequest)**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | String | O | Email format | User email |
| username | String | O | 3~50 chars | Username |
| password | String | O | Min 8 chars, 2+ of: uppercase/lowercase/digit/special | Password |

**Response**: `ApiResponse<AuthResponse>`

| Field | Type | Description |
|-------|------|-------------|
| userId | Long | User ID |
| email | String | Email |
| username | String | Username |
| message | String | Guidance message |

**Errors**: `400` (validation), `409` (email/username duplicate)

#### Sign In (POST `/api/v1/auth/login`)

**Request Body (LoginRequest)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | O | User email |
| password | String | O | Password |

**Response**: `ApiResponse<TokenResponse>`

| Field | Type | Description |
|-------|------|-------------|
| accessToken | String | JWT access token |
| refreshToken | String | Refresh token |
| tokenType | String | Always "Bearer" |
| expiresIn | Integer | Access token TTL in seconds (3600) |
| refreshTokenExpiresIn | Integer | Refresh token TTL in seconds (604800) |

**Errors**: `401` (invalid credentials, email not verified)

#### Sign Out (POST `/api/v1/auth/logout`)

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body (LogoutRequest)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | String | O | Refresh token |

**Response**: `ApiResponse<Void>`

**Errors**: `401` (auth failed)

#### Delete Account (DELETE `/api/v1/auth/me`)

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body (WithdrawRequest)** — optional

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| password | String | X | 8~100 chars | Password confirmation |
| reason | String | X | Max 500 chars | Withdrawal reason |

**Response**: `ApiResponse<Void>`

**Errors**: `401` (auth failed), `404` (user not found), `409` (already withdrawn)

#### Refresh Token (POST `/api/v1/auth/refresh`)

**Request Body (RefreshTokenRequest)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | String | O | Refresh token |

**Response**: `ApiResponse<TokenResponse>` (same as login)

**Errors**: `401` (expired or invalid refresh token)

#### Verify Email (GET `/api/v1/auth/verify-email`)

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| token | String | O | Email verification token |

**Response**: `ApiResponse<Void>`

**Errors**: `400` (expired, invalid, already verified)

#### Request Password Reset (POST `/api/v1/auth/reset-password`)

**Request Body (ResetPasswordRequest)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | O | User email |

**Response**: `ApiResponse<Void>` (always success for security)

#### Confirm Password Reset (POST `/api/v1/auth/reset-password/confirm`)

**Request Body (ResetPasswordConfirmRequest)**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| token | String | O | — | Reset token |
| newPassword | String | O | Min 8 chars, 2+ categories | New password |

**Response**: `ApiResponse<Void>`

**Errors**: `400` (expired/invalid token, policy violation, same as old password)

#### OAuth Start (GET `/api/v1/auth/oauth2/{provider}`)

**Path Parameters**: `provider` = `google` (v1 구현 대상. `kakao`, `naver`는 추후 확장)

**Response**: `302 Redirect` to OAuth provider

#### OAuth Callback (GET `/api/v1/auth/oauth2/{provider}/callback`)

**Query Parameters**: `code` (required), `state` (optional)

**Response**: `ApiResponse<TokenResponse>` (same as login)

**Errors**: `401` (state mismatch, OAuth failure)

### 2.3 에러 코드 매핑

API `messageCode.code` → 프론트엔드 영문 메시지:

| messageCode.code | English Message |
|------------------|-----------------|
| AUTH_FAILED | Authentication failed. |
| INVALID_TOKEN | Invalid token. |
| TOKEN_EXPIRED | Token has expired. |
| EMAIL_NOT_VERIFIED | Email verification required. Please check your inbox. |
| EMAIL_ALREADY_EXISTS | This email is already registered. |
| USERNAME_ALREADY_EXISTS | This username is already taken. |
| PASSWORD_POLICY_VIOLATION | Password must be at least 8 characters with 2+ types (uppercase, lowercase, digit, special character). |
| INVALID_CREDENTIALS | Incorrect email or password. |

HTTP status fallback (messageCode 미제공 시):

| HTTP Status | English Message |
|-------------|-----------------|
| 400 | Invalid request. Please check your input. |
| 401 | Authentication failed. Please sign in again. |
| 403 | You don't have permission to perform this action. |
| 404 | Resource not found. |
| 409 | Conflict. This resource already exists. |
| 500 | Something went wrong. Please try again later. |

---

## 3. 페이지 구조

### 3.1 신규 페이지 목록

| Route | Page | Description |
|-------|------|-------------|
| `/signup` | Sign Up | Registration form |
| `/signin` | Sign In | Login form + OAuth buttons |
| `/verify-email` | Email Verification | Token verification result |
| `/reset-password` | Reset Password | Email input for reset request |
| `/reset-password/confirm` | Confirm Reset | New password form |
| `/oauth/callback` | OAuth Callback | Token processing (no visible UI) |

### 3.2 Header (Modified)

기존 Header에 인증 버튼 영역을 추가한다.

```
┌──────────────────────────────────────────────────────────┐
│  Header                                                  │
│  ┌────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Tech N AI  │  │ 🔍 Search...     │  │ Auth Buttons │ │
│  └────────────┘  └──────────────────┘  └──────────────┘ │
│                                                          │
│  [Signed Out]:  ... [Sign Up] [Sign In]                  │
│  [Signed In]:   ... {username} ▼  [Logout]               │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Sign Up Page (`/signup`)

```
┌──────────────────────────────────────────────────────────┐
│  Header (with auth buttons)                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│           ┌──────────────────────────────┐               │
│           │  ╔══════════════════════════╗ │               │
│           │  ║      Create Account      ║ │               │
│           │  ╚══════════════════════════╝ │               │
│           │                              │               │
│           │  Email                       │               │
│           │  ┌──────────────────────────┐│               │
│           │  │ you@example.com          ││               │
│           │  └──────────────────────────┘│               │
│           │                              │               │
│           │  Username                    │               │
│           │  ┌──────────────────────────┐│               │
│           │  │ johndoe                  ││               │
│           │  └──────────────────────────┘│               │
│           │                              │               │
│           │  Password                    │               │
│           │  ┌──────────────────────────┐│               │
│           │  │ ••••••••                 ││               │
│           │  └──────────────────────────┘│               │
│           │                              │               │
│           │  Confirm Password            │               │
│           │  ┌──────────────────────────┐│               │
│           │  │ ••••••••                 ││               │
│           │  └──────────────────────────┘│               │
│           │                              │               │
│           │  [■■■■■ Sign Up ■■■■■]       │               │
│           │                              │               │
│           │  Already have an account?    │               │
│           │  Sign In                     │               │
│           └──────────────────────────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**성공 시**: 폼 대신 성공 메시지 표시

```
           ┌──────────────────────────────┐
           │  ✓ Account Created!          │
           │                              │
           │  We've sent a verification   │
           │  email to you@example.com.   │
           │  Please check your inbox.    │
           │                              │
           │  [Go to Sign In]             │
           └──────────────────────────────┘
```

### 3.4 Sign In Page (`/signin`)

```
┌──────────────────────────────────────────────────────────┐
│  Header                                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│           ┌──────────────────────────────┐               │
│           │  ╔══════════════════════════╗ │               │
│           │  ║       Welcome Back       ║ │               │
│           │  ╚══════════════════════════╝ │               │
│           │                              │               │
│           │  Email                       │               │
│           │  ┌──────────────────────────┐│               │
│           │  │ you@example.com          ││               │
│           │  └──────────────────────────┘│               │
│           │                              │               │
│           │  Password                    │               │
│           │  ┌──────────────────────────┐│               │
│           │  │ ••••••••                 ││               │
│           │  └──────────────────────────┘│               │
│           │                              │               │
│           │  Forgot password?            │               │
│           │                              │               │
│           │  [■■■■■ Sign In ■■■■■]       │               │
│           │                              │               │
│           │  ──── Or continue with ────  │               │
│           │                              │               │
│           │  [G Google]                     │              │
│           │                              │               │
│           │  Don't have an account?      │               │
│           │  Sign Up                     │               │
│           └──────────────────────────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.5 Email Verification Page (`/verify-email`)

```
           ┌──────────────────────────────┐
           │  [Success]                    │
           │  ✓ Email Verified!            │
           │                              │
           │  Your email has been          │
           │  verified successfully.       │
           │                              │
           │  [Go to Sign In]             │
           └──────────────────────────────┘

           ┌──────────────────────────────┐
           │  [Error]                      │
           │  ✗ Verification Failed        │
           │                              │
           │  {error message}              │
           │                              │
           │  [Go to Sign In]             │
           └──────────────────────────────┘
```

### 3.6 Reset Password Page (`/reset-password`)

```
           ┌──────────────────────────────┐
           │  ╔══════════════════════════╗ │
           │  ║    Reset Password        ║ │
           │  ╚══════════════════════════╝ │
           │                              │
           │  Enter your email and we'll  │
           │  send you a reset link.      │
           │                              │
           │  Email                       │
           │  ┌──────────────────────────┐│
           │  │ you@example.com          ││
           │  └──────────────────────────┘│
           │                              │
           │  [■■■ Send Reset Link ■■■]   │
           │                              │
           │  Back to Sign In             │
           └──────────────────────────────┘
```

**성공 시**: 폼 대신 안내 메시지

```
           ┌──────────────────────────────┐
           │  ✓ Check Your Email           │
           │                              │
           │  If an account exists for     │
           │  that email, we've sent a     │
           │  password reset link.         │
           │                              │
           │  [Back to Sign In]           │
           └──────────────────────────────┘
```

### 3.7 Confirm Reset Page (`/reset-password/confirm`)

```
           ┌──────────────────────────────┐
           │  ╔══════════════════════════╗ │
           │  ║   Set New Password       ║ │
           │  ╚══════════════════════════╝ │
           │                              │
           │  New Password                │
           │  ┌──────────────────────────┐│
           │  │ ••••••••                 ││
           │  └──────────────────────────┘│
           │                              │
           │  Confirm New Password        │
           │  ┌──────────────────────────┐│
           │  │ ••••••••                 ││
           │  └──────────────────────────┘│
           │                              │
           │  [■■ Reset Password ■■]      │
           └──────────────────────────────┘
```

### 3.8 OAuth Callback Page (`/oauth/callback`)

UI 없음. 로딩 스피너만 표시하고 토큰 처리 후 리다이렉트한다.

```
           ┌──────────────────────────────┐
           │                              │
           │       ◌ Signing in...        │
           │                              │
           └──────────────────────────────┘
```

---

## 4. 컴포넌트 상세

### 4.1 Header Auth Area

기존 Header(`page.tsx`)의 우측 검색바 옆에 인증 영역을 추가한다.

**Signed Out 상태**:
- "Sign Up" 버튼: outline 스타일, `/signup`으로 이동
- "Sign In" 버튼: primary 스타일 (bg-[#3B82F6] text-white), `/signin`으로 이동

**Signed In 상태**:
- 사용자명 텍스트 (bold) + 드롭다운 아이콘 (ChevronDown)
- 드롭다운 메뉴 (Radix Popover):
  - "Delete Account" 항목 → 회원탈퇴 확인 다이얼로그
- "Logout" 버튼: outline 스타일, 클릭 시 로그아웃 처리

**렌더링 규칙**:
- 인증 상태는 AuthContext에서 제공
- SSR 하이드레이션 불일치 방지: 초기 렌더링 시 버튼 숨김, 클라이언트에서 마운트 후 표시

### 4.2 Auth Form Components

공통 폼 패턴:

**Input Field**:
- Label (bold, text-sm, uppercase tracking)
- Input (brutal-border, focus시 border-[#3B82F6])
- Error message (text-red-500, text-sm, input 하단)

**Validation Rules (Client-side)**:

| Field | Rule | Error Message |
|-------|------|---------------|
| Email | RFC 5322 email format | Please enter a valid email address. |
| Username | 3~50 characters | Username must be 3-50 characters. |
| Password | Min 8 chars + 2 of: uppercase, lowercase, digit, special | Password must be at least 8 characters with 2+ types (uppercase, lowercase, digit, special character). |
| Confirm Password | Must match Password | Passwords do not match. |

**Validation Timing**: onBlur (포커스 아웃 시) + onSubmit. 이전에 에러가 표시된 필드는 onChange로 실시간 재검증.

**Submit Button**:
- 전체 너비, primary 스타일
- 요청 중 disabled + 로딩 스피너 (Loader2 아이콘 spin)
- 이중 제출 방지

**Server Error Display**:
- 폼 상단에 에러 배너 (bg-red-50, brutal-border, border-red-500)
- messageCode.code로 영문 메시지 매핑

### 4.3 OAuth Button Group

Sign In 페이지 하단에 구분선 "Or continue with" 아래 배치.

> **v1 구현 범위**: Google만 우선 구현. Kakao, Naver는 추후 확장 예정.

| Provider | Button Text | Style | v1 구현 |
|----------|-------------|-------|---------|
| Google | Google | bg-white, border-black | O |
| Kakao | Kakao | bg-[#FEE500], text-black | X (추후) |
| Naver | Naver | bg-[#03C75A], text-white | X (추후) |

**동작**:
1. 버튼 클릭 → `window.location.href = "/api/v1/auth/oauth2/{provider}"` (Gateway를 통해 302 리다이렉트)
2. OAuth 인증 완료 → 백엔드가 프론트엔드 콜백 URL로 리다이렉트
3. `/oauth/callback` 페이지에서 URL query params의 code, state를 추출
4. `GET /api/v1/auth/oauth2/{provider}/callback?code={code}&state={state}` 호출
5. TokenResponse 수신 → 토큰 저장 → `/`로 리다이렉트

**에러 시**: 로그인 페이지로 이동 + 에러 메시지 표시

### 4.4 Token Management

**저장소**: `localStorage`

| Key | Value |
|-----|-------|
| `accessToken` | JWT access token |
| `refreshToken` | Refresh token |
| `user` | `{ username, email }` (JSON) — JWT payload에서 추출하거나 signup 응답에서 저장 |

**자동 갱신 흐름**:
1. 인증 필요 API 호출 시 `Authorization: Bearer {accessToken}` 헤더 첨부
2. 401 응답 수신 → refreshToken으로 `POST /api/v1/auth/refresh` 호출
3. 갱신 성공 → 새 토큰 저장 → 원래 요청 재시도
4. 갱신 실패 (401) → 전체 토큰 삭제 → `/signin`으로 리다이렉트

**동시 갱신 방지**: refresh 요청 진행 중이면 다른 401 요청들은 동일 Promise를 공유하여 한 번만 갱신.

### 4.5 Delete Account Dialog

Radix AlertDialog 사용.

```
┌──────────────────────────────────────┐
│  Delete Account                      │
│  ────────────────────────────────    │
│                                      │
│  Are you sure you want to delete     │
│  your account? This action cannot    │
│  be undone.                          │
│                                      │
│  Password (optional)                 │
│  ┌──────────────────────────────┐    │
│  │ ••••••••                     │    │
│  └──────────────────────────────┘    │
│                                      │
│  Reason (optional)                   │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  └──────────────────────────────┘    │
│                                      │
│  [Cancel]  [Delete Account]          │
│             (destructive)            │
└──────────────────────────────────────┘
```

- "Delete Account" 버튼: `bg-[#EF4444] text-white brutal-border`
- 성공 시: 토큰 삭제 → `/`로 이동

---

## 5. 인증 상태 관리

### 5.1 AuthContext

React Context로 인증 상태를 전역 관리한다.

```typescript
interface AuthContextValue {
  user: { username: string; email: string } | null;
  isLoading: boolean;
  login: (tokens: TokenResponse) => void;
  logout: () => Promise<void>;
}
```

**AuthProvider** 위치: `src/app/layout.tsx`에서 `{children}`을 감싸기.

**초기화 흐름**:
1. 마운트 시 localStorage에서 accessToken 확인
2. 토큰 있으면 user 정보 복원 (`localStorage.user` 파싱)
3. 토큰 없으면 `user = null` (비로그인 상태)

### 5.2 인증 필요 API 클라이언트

기존 `lib/api.ts`의 `fetch` 래퍼를 확장한다.

```typescript
// lib/auth-api.ts
async function authFetch(url: string, options?: RequestInit): Promise<Response>
```

- localStorage에서 accessToken 읽어 Authorization 헤더 자동 첨부
- 401 응답 시 자동 토큰 갱신 후 재시도
- 갱신 실패 시 로그아웃 처리

### 5.3 Route Guard

이미 로그인한 상태에서의 리다이렉트:
- `/signup`, `/signin` 접근 시 → `/`로 리다이렉트

회원탈퇴 다이얼로그: AuthContext의 user 존재 여부로 접근 제어

---

## 6. 디자인 가이드

### 6.1 일관성 원칙

모든 인증 페이지는 기존 랜딩 페이지의 Neo-Brutalism 디자인 시스템을 그대로 따른다.

### 6.2 인증 페이지 레이아웃

- **배경**: `bg-[#F5F5F5]` (랜딩 페이지와 동일)
- **폼 카드**: 화면 중앙 정렬, `max-w-md mx-auto`, `bg-white brutal-border brutal-shadow`
- **카드 내부 패딩**: `p-8`
- **페이지 제목**: 카드 내부 상단, `text-2xl font-bold tracking-tight`

### 6.3 컴포넌트별 스타일

| Component | Style |
|-----------|-------|
| Form Card | `bg-white brutal-border brutal-shadow p-8 max-w-md mx-auto` |
| Input | `brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none` |
| Label | `text-sm font-bold uppercase tracking-wide mb-1.5 block` |
| Primary Button | `w-full bg-[#3B82F6] text-white brutal-border brutal-shadow brutal-hover font-bold py-3` |
| Outline Button | `bg-white text-black brutal-border brutal-shadow brutal-hover font-bold py-2 px-4` |
| Destructive Button | `bg-[#EF4444] text-white brutal-border brutal-shadow brutal-hover font-bold` |
| Error Banner | `bg-red-50 border-2 border-[#EF4444] p-4 text-sm text-[#EF4444]` |
| Field Error | `text-[#EF4444] text-sm mt-1` |
| Link Text | `text-[#3B82F6] font-bold hover:underline` |
| Divider | `flex items-center gap-4` + `h-[2px] flex-1 bg-black` + `text-sm text-gray-500` |
| OAuth Button | `brutal-border brutal-shadow brutal-hover flex items-center justify-center gap-2 py-3 font-bold` |
| Success Box | `bg-[#DBEAFE] brutal-border brutal-shadow p-8 text-center` |
### 6.4 색상 팔레트

기존 랜딩 페이지와 동일:

| Usage | Color | Code |
|-------|-------|------|
| Primary / Active | Blue | #3B82F6 |
| Accent / Success BG | Light Blue | #DBEAFE |
| Text / Border | Black | #000000 |
| Background | White | #FFFFFF |
| Page Background | Gray | #F5F5F5 |
| Muted Text | Gray | #525252 |
| Destructive | Red | #EF4444 |

### 6.5 폰트

- 본문/UI: Space Grotesk (`font-sans`)
- 코드/토큰: DM Mono (`font-mono`)

---

## 7. 기술 구현 사항

### 7.1 추가 디렉토리/파일 구조

```
src/
├── app/
│   ├── layout.tsx                     # AuthProvider 추가
│   ├── page.tsx                       # (기존) 랜딩 페이지
│   ├── signup/
│   │   └── page.tsx                   # Sign Up 페이지
│   ├── signin/
│   │   └── page.tsx                   # Sign In 페이지
│   ├── verify-email/
│   │   └── page.tsx                   # Email Verification 페이지
│   ├── reset-password/
│   │   ├── page.tsx                   # Reset Password Request 페이지
│   │   └── confirm/
│   │       └── page.tsx               # Reset Password Confirm 페이지
│   └── oauth/
│       └── callback/
│           └── page.tsx               # OAuth Callback 페이지
├── components/
│   ├── ui/                            # (기존) 공통 UI
│   ├── emerging-tech/                 # (기존) 도메인 컴포넌트
│   └── auth/
│       ├── auth-header.tsx            # Header 인증 영역
│       ├── signup-form.tsx            # Sign Up 폼
│       ├── signin-form.tsx            # Sign In 폼
│       ├── oauth-buttons.tsx          # OAuth 버튼 그룹
│       ├── reset-password-form.tsx    # Reset Password 폼
│       ├── reset-password-confirm-form.tsx  # Reset Confirm 폼
│       └── delete-account-dialog.tsx  # 회원탈퇴 Dialog
├── contexts/
│   └── auth-context.tsx               # AuthContext + AuthProvider
├── lib/
│   ├── api.ts                         # (기존) Emerging Tech API
│   ├── auth-api.ts                    # Auth API 함수들
│   ├── auth-fetch.ts                  # 인증 fetch 래퍼 (자동 토큰 첨부/갱신)
│   ├── constants.ts                   # (기존)
│   └── utils.ts                       # (기존)
└── types/
    ├── emerging-tech.ts               # (기존)
    └── auth.ts                        # Auth 타입 정의
```

### 7.2 TypeScript 타입 정의

```typescript
// types/auth.ts

interface ApiResponse<T> {
  code: string;
  messageCode: { code: string; text: string };
  message?: string;
  data?: T;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}

interface AuthResponse {
  userId: number;
  email: string;
  username: string;
  message: string;
}

interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LogoutRequest {
  refreshToken: string;
}

interface WithdrawRequest {
  password?: string;
  reason?: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface ResetPasswordRequest {
  email: string;
}

interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}
```

### 7.3 Auth API 함수

```typescript
// lib/auth-api.ts

const AUTH_BASE = "/api/v1/auth";

export async function signup(req: SignupRequest): Promise<AuthResponse>
export async function login(req: LoginRequest): Promise<TokenResponse>
export async function logout(accessToken: string, req: LogoutRequest): Promise<void>
export async function withdraw(accessToken: string, req?: WithdrawRequest): Promise<void>
export async function refreshToken(req: RefreshTokenRequest): Promise<TokenResponse>
export async function verifyEmail(token: string): Promise<void>
export async function resetPassword(req: ResetPasswordRequest): Promise<void>
export async function resetPasswordConfirm(req: ResetPasswordConfirmRequest): Promise<void>

// OAuth: browser redirect, no API function needed for start
export async function oauthCallback(provider: string, code: string, state?: string): Promise<TokenResponse>
```

### 7.4 비밀번호 정책 검증 함수

```typescript
// lib/utils.ts (기존 파일에 추가)

export function validatePassword(password: string): string | null
// Returns error message or null if valid
// Rule: min 8 chars, at least 2 of: uppercase, lowercase, digit, special character
```

### 7.5 OAuth Provider 설정

| Provider | Key | Value |
|----------|-----|-------|
| Google | Client ID | `${GOOGLE_CLIENT_ID}` |
| Google | Client Secret | `${GOOGLE_CLIENT_SECRET}` |

> **Note**: 실제 배포 시 Client Secret은 환경 변수로 관리하며, 소스 코드나 클라이언트에 노출하지 않는다. 백엔드 서버에서만 사용.

### 7.6 라우팅 정리

| Route | Auth Required | Redirect If Signed In |
|-------|--------------|----------------------|
| `/` | X | — |
| `/signup` | X | → `/` |
| `/signin` | X | → `/` |
| `/verify-email` | X | — |
| `/reset-password` | X | — |
| `/reset-password/confirm` | X | — |
| `/oauth/callback` | X | — |

---

## 8. 범위 제한

### 포함

- Header 인증 UI (Sign Up / Sign In / Logout 버튼)
- 회원가입 페이지 + 클라이언트 유효성 검증
- 이메일 인증 결과 페이지
- 로그인 페이지 (일반 + OAuth)
- OAuth 로그인 (Google만 v1 구현, Kakao/Naver 추후 확장) + 콜백 처리
- 비밀번호 재설정 (요청 + 확인)
- 토큰 관리 (localStorage 저장, 자동 갱신, 만료 처리)
- 로그아웃
- 회원탈퇴 (확인 다이얼로그)
- API 스펙 사용자 인증 엔드포인트 10개 연동
- 에러 코드별 영문 메시지 매핑
- Neo-Brutalism 디자인 일관성

### 미포함 (v1)

- Kakao, Naver OAuth 연동 (추후 확장 예정)
- 관리자 기능 (관리자 로그인, 관리자 계정 CRUD — 별도 관리자 전용 웹앱에서 구현)
- 다크 모드
- 다국어 시스템 (i18n)
- 소셜 프로필 연동/관리
- 이메일 인증 재발송 기능 (API 미제공)
- 비밀번호 변경 (재설정과 별도 — API 미제공)
- 사용자 프로필 수정 (API 미제공)
- SSR/ISR 인증 (클라이언트 사이드 인증만)
- 전역 상태 관리 라이브러리 (React Context로 충분)
- 자동 로그인 유지 (Remember me)
- Rate limiting / CAPTCHA (서버에서 처리)

---

**문서 버전**: 1.2
**최종 업데이트**: 2026-02-11
**변경 이력**:
- v1.2 — OAuth Provider를 Google만 우선 구현으로 범위 조정 (Kakao/Naver 추후 확장)
- v1.1 — 관리자 기능(F10) 제외 (별도 관리자 전용 웹앱에서 구현)
