# PRD: Admin App - Account Management

**작성일**: 2026-03-04
**버전**: v1
**기반 프롬프트**: `docs/prompts/005-admin-app-prd-generation-prompt.md`
**API 스펙 문서**: `docs/API-specifications/api-auth-specification.md`

---

## 1. 개요

기존 사용자 앱(`/app`)과 **완전히 독립된 별도의 Next.js 프로젝트**로, 관리자가 관리자 계정을 관리할 수 있는 관리자 웹 애플리케이션을 구현한다. 관리자 전용 로그인 엔드포인트를 사용하며, 인증된 관리자만 접근 가능하다.

| 항목 | 내용 |
|------|------|
| 앱 이름 | Admin App |
| 앱 위치 | `/admin` (기존 `/app`과 독립된 별도 Next.js 프로젝트) |
| 기술 스택 | Next.js 16 (App Router) + React 19 + TypeScript |
| UI 라이브러리 | Radix UI + CVA (class-variance-authority) |
| 스타일링 | Tailwind CSS v4 + 커스텀 Neo-Brutalism 유틸리티 |
| 아이콘 | Lucide React |
| 폰트 | Space Grotesk (sans), DM Mono (mono) |
| 디자인 테마 | Neo-Brutalism |
| 색상 테마 | Primary Blue (#3B82F6), Accent Light Blue (#DBEAFE), Black (#000000), White (#FFFFFF), Gray (#F5F5F5), Destructive Red (#EF4444) |
| API Gateway | `http://localhost:8081` (Next.js rewrites `/api/*` → Gateway) |
| 인증 방식 | JWT 기반 (Bearer 토큰, ADMIN 권한). 관리자 전용 로그인 엔드포인트 사용 |
| UI 언어 | English (모든 화면 텍스트 영문) |

### 독립 앱 설계 원칙

- 자체 `package.json`, `next.config.ts`, `tsconfig.json` 보유
- 자체 `src/` 디렉토리 구조 보유
- 기존 `/app` 프로젝트와 코드 공유 없음 (import 경로 독립)
- 독립적으로 `npm install && npm run dev`로 즉시 실행 가능
- 별도 포트에서 독립 실행 (예: 3001)
- 기존 앱과 동일한 Neo-Brutalism 디자인 테마, 기술 스택, 코드 구조, API 통신 패턴, 컴포넌트 설계 패턴을 적용

---

## 2. API 연동

모든 요청은 Gateway(8081)로 전송한다. Next.js rewrites가 `/api/*` → `http://localhost:8081/api/*`로 프록시한다. 관리자 API는 `Authorization: Bearer {accessToken}` (ADMIN 권한) 헤더가 필요하므로 `authFetch`를 사용한다.

### 2.1 공통 응답 형식

```typescript
// types/auth.ts
interface ApiResponse<T> {
  code: string;           // "2000" (성공), "4000", "4001" 등
  messageCode: {
    code: string;         // "SUCCESS", "AUTH_FAILED" 등
    text: string;
  };
  message?: string;
  data?: T;
}
```

### 2.2 엔드포인트 목록

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/api/v1/auth/admin/login` | X | 관리자 로그인 |
| 2 | POST | `/api/v1/auth/admin/accounts` | O (ADMIN) | 관리자 계정 생성 |
| 3 | GET | `/api/v1/auth/admin/accounts` | O (ADMIN) | 관리자 목록 조회 |
| 4 | GET | `/api/v1/auth/admin/accounts/{adminId}` | O (ADMIN) | 관리자 상세 조회 |
| 5 | PUT | `/api/v1/auth/admin/accounts/{adminId}` | O (ADMIN) | 관리자 정보 수정 |
| 6 | DELETE | `/api/v1/auth/admin/accounts/{adminId}` | O (ADMIN) | 관리자 계정 삭제 |
| 7 | POST | `/api/v1/auth/admin/refresh` | X | 관리자 토큰 갱신 |
| 8 | POST | `/api/v1/auth/admin/logout` | O (ADMIN) | 관리자 로그아웃 |

### 2.3 요청/응답 상세

#### Admin Login (POST `/api/v1/auth/admin/login`)

**Request Body (LoginRequest)**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | String | O | 이메일 형식 | 관리자 이메일 |
| password | String | O | - | 비밀번호 |

**Response**: `ApiResponse<TokenResponse>`

```json
{
  "code": "2000",
  "messageCode": { "code": "SUCCESS", "text": "성공" },
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshTokenExpiresIn": 86400
  }
}
```

**계정 잠금 정책**:

| 연속 실패 횟수 | 잠금 시간 |
|--------------|----------|
| 5회 이상 | 15분 |
| 10회 이상 | 1시간 |

> 로그인 성공 시 실패 횟수가 초기화됩니다.

**Errors**: `401` (이메일/비밀번호 불일치, 비활성화/삭제된 관리자 계정, 계정 잠금 상태)

#### Create Admin Account (POST `/api/v1/auth/admin/accounts`)

**Request Body (AdminCreateRequest)**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | String | O | 이메일 형식 | 관리자 이메일 |
| username | String | O | 2~50자 | 관리자명 |
| password | String | O | 최소 8자 | 비밀번호 |

**Response**: `ApiResponse<AdminResponse>`

**Errors**: `400` (유효성 검증 실패, 이메일/사용자명 중복 — 코드: `4006`, `VALIDATION_ERROR`), `401` (인증 실패), `403` (권한 없음)

#### List Admin Accounts (GET `/api/v1/auth/admin/accounts`)

**Response**: `ApiResponse<AdminResponse[]>`

활성 상태(`isActive=true`)이고 삭제되지 않은(`isDeleted=false`) 관리자 목록을 반환한다. 페이지네이션 없이 전체 목록을 반환한다.

**Errors**: `401` (인증 실패), `403` (권한 없음)

#### Get Admin Detail (GET `/api/v1/auth/admin/accounts/{adminId}`)

**Path Parameters**: `adminId` — 관리자 ID (Long)

**Response**: `ApiResponse<AdminResponse>`

**Errors**: `401` (인증 실패), `403` (권한 없음), `404` (관리자 없음)

#### Update Admin Account (PUT `/api/v1/auth/admin/accounts/{adminId}`)

**Path Parameters**: `adminId` — 관리자 ID (Long)

**Request Body (AdminUpdateRequest)**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| username | String | X | 2~50자 | 관리자명 |
| password | String | X | 최소 8자 | 비밀번호 |

**Response**: `ApiResponse<AdminResponse>`

**Errors**: `400` (유효성 검증 실패, 사용자명 중복), `401` (인증 실패), `403` (권한 없음), `404` (관리자 없음)

#### Delete Admin Account (DELETE `/api/v1/auth/admin/accounts/{adminId}`)

**Path Parameters**: `adminId` — 관리자 ID (Long)

**Response**: `ApiResponse<Void>`

**Errors**: `401` (인증 실패), `403` (권한 없음, 자기 자신 삭제 시도), `404` (관리자 없음)

#### Admin Refresh Token (POST `/api/v1/auth/admin/refresh`)

관리자 리프레시 토큰으로 새 액세스 토큰을 발급받습니다. 사용자(USER) 역할의 토큰은 사용할 수 없습니다.

**Request Body (RefreshTokenRequest)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | String | O | 관리자 리프레시 토큰 |

**Response**: `ApiResponse<TokenResponse>` (관리자 토큰: Access 900초, Refresh 86400초)

**Errors**: `401` (Refresh Token 만료 또는 무효, 사용자 토큰 사용 시도, 비활성화된 관리자 계정, 관리자 ID 불일치)

#### Admin Logout (POST `/api/v1/auth/admin/logout`)

**Request Headers**: `Authorization: Bearer {accessToken}` (ADMIN)

**Request Body (LogoutRequest)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | String | O | 리프레시 토큰 |

**Response**: `ApiResponse<Void>`

**Errors**: `401` (인증 실패, Refresh Token 불일치, 관리자 ID 불일치)

### 2.4 공통 응답 모델

**TokenResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| accessToken | String | O | JWT 액세스 토큰 |
| refreshToken | String | O | 리프레시 토큰 |
| tokenType | String | O | 토큰 타입 (항상 "Bearer") |
| expiresIn | Long | O | 액세스 토큰 만료 시간 (초) |
| refreshTokenExpiresIn | Long | O | 리프레시 토큰 만료 시간 (초) |

**AdminResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | Long | O | 관리자 ID |
| email | String | O | 이메일 |
| username | String | O | 관리자명 |
| role | String | O | 권한 (`ADMIN`) |
| isActive | Boolean | O | 활성화 여부 |
| createdAt | String (ISO 8601) | O | 생성일시 |
| lastLoginAt | String (ISO 8601) | X | 마지막 로그인 일시 |

### 2.5 에러 코드 매핑

API `messageCode.code` → 프론트엔드 영문 메시지:

| messageCode.code | English Message |
|------------------|-----------------|
| AUTH_FAILED | Invalid email or password. |
| AUTH_REQUIRED | Authentication required. Please sign in. |
| FORBIDDEN | You don't have permission to perform this action. |
| NOT_FOUND | Admin account not found. |
| CONFLICT | A conflict occurred. Please try again. |
| VALIDATION_ERROR | Validation failed. Please check your input. |
| BAD_REQUEST | Invalid request. Please check your input. |

HTTP fallback 메시지:

| HTTP Status | English Message |
|-------------|-----------------|
| 400 | Invalid request. Please check your input. |
| 401 | Authentication failed. Please sign in again. |
| 403 | You don't have permission to perform this action. |
| 404 | Resource not found. |
| 429 | Too many requests. Please try again later. |
| 500 | Something went wrong. Please try again later. |

---

## 3. 페이지 구조

### 3.1 페이지 목록

| Route | Type | Description |
|-------|------|-------------|
| `/signin` | New | 관리자 로그인 |
| `/` | New | 관리자 대시보드 (관리자 계정 관리로의 네비게이션) |
| `/accounts` | New | 관리자 계정 관리 (목록 + CRUD) |

### 3.2 Sign In Page (`/signin`)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     bg-[#F5F5F5]                             │
│                                                              │
│          ┌──────────────────────────────────┐                │
│          │  brutal-border-3 brutal-shadow-lg │                │
│          │  bg-white p-8                     │                │
│          │                                   │                │
│          │  ■ Admin Login                    │                │
│          │  ────────────────────────────     │                │
│          │                                   │                │
│          │  Email                             │                │
│          │  ┌──────────────────────────┐     │                │
│          │  │ admin@example.com        │     │                │
│          │  └──────────────────────────┘     │                │
│          │  (validation error inline)        │                │
│          │                                   │                │
│          │  Password                         │                │
│          │  ┌──────────────────────────┐     │                │
│          │  │ ••••••••                 │     │                │
│          │  └──────────────────────────┘     │                │
│          │  (validation error inline)        │                │
│          │                                   │                │
│          │  [        Sign In         ]       │                │
│          │  (server error message)           │                │
│          │                                   │                │
│          └──────────────────────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Dashboard Page (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  🛡 Tech N AI [Admin]            {username} [Logout]        │
│                        [Accounts]                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Admin Dashboard                                         ││
│  │  ────────────────────────────────────────────────────    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Account Management                                     │ │
│  │  ─────────────────                                      │ │
│  │  Manage administrator accounts.                         │ │
│  │                                                         │ │
│  │  [Go to Accounts →]                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Accounts Page (`/accounts`)

```
┌──────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  🛡 Tech N AI [Admin]            {username} [Logout]        │
│                        [Accounts]                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Admin Accounts                        [Create Account]  ││
│  │  ────────────────────────────────────────────────────    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ID │ Email      │ Username │ Role  │ Active │ Created   ││
│  │    │            │          │       │        │ Last Login││
│  │    │            │          │       │        │ Actions   ││
│  ├────┼────────────┼──────────┼───────┼────────┼───────────┤│
│  │ 1  │ admin@...  │ admin    │ ADMIN │ ●Active│ 2025-01.. ││
│  │    │            │          │       │        │ 2025-01.. ││
│  │    │            │          │       │        │ [👁][✏][🗑]││
│  ├────┼────────────┼──────────┼───────┼────────┼───────────┤│
│  │ 2  │ user2@...  │ user2    │ ADMIN │ ●Active│ 2025-01.. ││
│  │    │            │          │       │        │ 2025-01.. ││
│  │    │            │          │       │        │ [👁][✏][🗑]││
│  └────┴────────────┴──────────┴───────┴────────┴───────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Empty State**:

```
│  ┌──────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │              No admin accounts found.                    ││
│  │         Create the first admin account.                  ││
│  │                                                          ││
│  │              [Create Account]                            ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
```

---

## 4. 컴포넌트 상세

### 4.1 Header

앱 전역에 사용되는 헤더 컴포넌트 (대시보드, 계정 관리 페이지).

**구성 요소**:
- 좌측: "Tech N AI [Admin]" 앱 타이틀 (ShieldCheck 아이콘 + 텍스트 + Admin 뱃지, 클릭 시 `/`로 이동)
- 중앙: 네비게이션 링크 — "Accounts" (`/accounts`)
- 우측: 로그인된 관리자 username 표시 + "Logout" 버튼 (LogOut 아이콘)

**네비게이션 활성 상태**: 현재 경로와 일치하는 링크에 `text-[#3B82F6] font-bold` 적용

### 4.2 Sign In Form

관리자 전용 로그인 폼.

**입력 필드**:

| Field | Type | Placeholder | Validation |
|-------|------|-------------|------------|
| Email | `<input type="email">` | `admin@example.com` | 이메일 형식 필수 |
| Password | `<input type="password">` | `Enter password` | 빈 값 방지 |

**클라이언트 유효성 검증**:
- Email: 이메일 형식 정규식 검증. 유효하지 않으면 "Please enter a valid email address." 인라인 표시
- Password: 빈 값이면 "Password is required." 인라인 표시
- 검증 시점: 필드 blur 시 + 폼 submit 시

**동작**:
1. 사용자가 Email, Password 입력 후 "Sign In" 클릭
2. 클라이언트 유효성 검증 통과
3. `POST /api/v1/auth/admin/login` 호출
4. 성공 시: `accessToken`, `refreshToken`을 localStorage에 저장 → `/`로 리다이렉트
5. 실패 시: 에러 메시지를 폼 하단에 인라인 표시
   - `401`: "Invalid email or password."
   - 비활성화/삭제된 계정: "This account has been deactivated."
   - 계정 잠금 상태: "Account is locked. Please try again later."

**제출 상태**: 폼 제출 중 "Sign In" 버튼 비활성화 + 로딩 인디케이터 표시

### 4.3 Admin Accounts Table

관리자 계정 목록을 표시하는 데이터 테이블.

**테이블 컬럼**:

| Column | Field | Format |
|--------|-------|--------|
| ID | `id` | 숫자 |
| Email | `email` | 텍스트 |
| Username | `username` | 텍스트 |
| Role | `role` | Badge (`ADMIN`) |
| Active | `isActive` | Badge (Active: green, Inactive: gray) |
| Created | `createdAt` | `YYYY-MM-DD HH:mm` (DM Mono) |
| Last Login | `lastLoginAt` | `YYYY-MM-DD HH:mm` 또는 `Never` (DM Mono) |
| Actions | — | 아이콘 버튼: View, Edit, Delete |

**액션 버튼**:
- **View** (`Eye` 아이콘): 관리자 상세 조회 다이얼로그 열기
- **Edit** (`Pencil` 아이콘): 관리자 수정 다이얼로그 열기
- **Delete** (`Trash2` 아이콘, `text-[#EF4444]`): 삭제 확인 다이얼로그 열기. 자기 자신의 행에서는 삭제 버튼 비활성화 (`opacity-30 cursor-not-allowed`)

**로딩 상태**: 데이터 로딩 중 테이블 영역에 스켈레톤 UI 표시

**Empty State**: 관리자 목록이 비어있을 때 안내 메시지와 "Create Account" CTA 표시

### 4.4 Create Account Dialog

새 관리자 계정을 생성하는 다이얼로그 (Radix Dialog).

```
┌──────────────────────────────────────┐
│  Create Account                      │
│  ────────────────────────────────    │
│                                      │
│  Email                               │
│  ┌──────────────────────────────┐    │
│  │ admin@example.com            │    │
│  └──────────────────────────────┘    │
│  (validation error inline)           │
│                                      │
│  Username                            │
│  ┌──────────────────────────────┐    │
│  │ adminuser                    │    │
│  └──────────────────────────────┘    │
│  (validation error inline)           │
│                                      │
│  Password                            │
│  ┌──────────────────────────────┐    │
│  │ ••••••••                     │    │
│  └──────────────────────────────┘    │
│  (validation error inline)           │
│                                      │
│  [Cancel]              [Create]      │
└──────────────────────────────────────┘
```

**입력 필드**:

| Field | Placeholder | Validation |
|-------|-------------|------------|
| Email | `admin@example.com` | 이메일 형식 필수 |
| Username | `Enter username` | 2~50자 필수 |
| Password | `Enter password` | 최소 8자 필수 |

**클라이언트 유효성 검증**:
- Email: 이메일 형식. "Please enter a valid email address."
- Username: 2~50자. "Username must be between 2 and 50 characters."
- Password: 최소 8자. "Password must be at least 8 characters."
- 검증 시점: 필드 blur 시 + 폼 submit 시

**서버 에러 표시**:
- 이메일 중복 (`VALIDATION_ERROR`): "This email is already in use." — Email 필드 아래 인라인 표시
- 사용자명 중복 (`VALIDATION_ERROR`): "This username is already taken." — Username 필드 아래 인라인 표시

**동작**:
1. "Create Account" 버튼 클릭 → 다이얼로그 열기
2. 입력 후 "Create" 클릭
3. `POST /api/v1/auth/admin/accounts` 호출
4. 성공 시: 다이얼로그 닫기 + 목록 새로고침 + 성공 토스트 ("Account created successfully.")
5. 실패 시: 에러를 해당 필드 아래 인라인 표시 또는 에러 토스트

**제출 상태**: "Create" 버튼 비활성화 + 로딩 인디케이터

### 4.5 Account Detail Dialog

관리자 상세 정보를 표시하는 다이얼로그 (Radix Dialog).

```
┌──────────────────────────────────────┐
│  Account Detail                      │
│  ────────────────────────────────    │
│                                      │
│  ID            1                     │
│  Email         admin@example.com     │
│  Username      admin                 │
│  Role          ADMIN                 │
│  Active        ● Active             │
│  Created       2025-01-15 10:00     │
│  Last Login    2025-01-20 14:30     │
│                                      │
│                         [Close]      │
└──────────────────────────────────────┘
```

**표시 필드**: AdminResponse 전체 필드 (id, email, username, role, isActive, createdAt, lastLoginAt)

**동작**:
1. 테이블 View 액션 클릭
2. `GET /api/v1/auth/admin/accounts/{adminId}` 호출
3. 응답 데이터를 다이얼로그에 표시
4. 실패 시: 에러 토스트

### 4.6 Edit Account Dialog

관리자 정보를 수정하는 다이얼로그 (Radix Dialog).

```
┌──────────────────────────────────────┐
│  Edit Account                        │
│  ────────────────────────────────    │
│                                      │
│  Email (readonly)                    │
│  admin@example.com                   │
│                                      │
│  Username                            │
│  ┌──────────────────────────────┐    │
│  │ admin                        │    │
│  └──────────────────────────────┘    │
│  (validation error inline)           │
│                                      │
│  New Password (optional)             │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  └──────────────────────────────┘    │
│  (validation error inline)           │
│                                      │
│  [Cancel]         [Save Changes]     │
└──────────────────────────────────────┘
```

**수정 가능 필드**:

| Field | Placeholder | Validation |
|-------|-------------|------------|
| Username | 현재 username | 2~50자 필수 |
| Password | `Enter new password (optional)` | 입력 시 최소 8자 |

**클라이언트 유효성 검증**:
- Username: 2~50자. "Username must be between 2 and 50 characters."
- Password: 비어있으면 검증 생략. 입력 시 최소 8자. "Password must be at least 8 characters."

**서버 에러 표시**:
- 사용자명 중복: "This username is already taken." — Username 필드 아래 인라인 표시

**동작**:
1. 테이블 Edit 액션 클릭 → 다이얼로그 열기 (현재 데이터 로드)
2. 수정 후 "Save Changes" 클릭
3. `PUT /api/v1/auth/admin/accounts/{adminId}` 호출
4. 성공 시: 다이얼로그 닫기 + 목록 새로고침 + 성공 토스트 ("Account updated successfully.")
5. 실패 시: 에러 인라인 표시 또는 에러 토스트

**제출 상태**: "Save Changes" 버튼 비활성화 + 로딩 인디케이터

### 4.7 Delete Confirmation Dialog

관리자 계정 삭제 확인 다이얼로그 (Radix AlertDialog).

```
┌──────────────────────────────────────┐
│  Delete Account                      │
│  ────────────────────────────────    │
│                                      │
│  Are you sure you want to delete     │
│  this account?                       │
│                                      │
│  Email: admin@example.com            │
│  Username: adminuser                 │
│                                      │
│  [Cancel]              [Delete]      │
│                        (destructive) │
└──────────────────────────────────────┘
```

- 삭제 대상 계정의 email, username을 다이얼로그에 표시
- "Delete" 버튼: `bg-[#EF4444] text-white brutal-border`
- "Cancel" 버튼: 기본 스타일

**동작**:
1. 테이블 Delete 액션 클릭 → 확인 다이얼로그 열기
2. "Delete" 클릭 → `DELETE /api/v1/auth/admin/accounts/{adminId}` 호출
3. 성공 시: 다이얼로그 닫기 + 목록에서 제거 + 성공 토스트 ("Account deleted successfully.")
4. 실패 시:
   - `403` (자기 자신 삭제): 에러 토스트 "Cannot delete your own account."
   - `404` (관리자 없음): 에러 토스트 "Admin account not found."
   - 기타: 에러 토스트

**삭제 중 상태**: "Delete" 버튼 비활성화 + 로딩 인디케이터

### 4.8 Toast Notifications

사용자 액션 피드백을 위한 토스트 메시지. 화면 우하단에 표시, 3초 후 자동 사라짐.

| Action | Success Message | Error Message |
|--------|----------------|---------------|
| Login | — (redirect) | "Invalid email or password." / "This account has been deactivated." / "Account is locked. Please try again later." |
| Create account | "Account created successfully." | "Failed to create account." |
| Update account | "Account updated successfully." | "Failed to update account." |
| Delete account | "Account deleted successfully." | "Failed to delete account." / "Cannot delete your own account." |
| Logout | — (redirect) | — |

스타일:
- Success: `bg-[#DBEAFE] brutal-border brutal-shadow-sm px-4 py-3 text-sm font-bold`
- Error: `bg-red-50 border-2 border-[#EF4444] px-4 py-3 text-sm font-bold text-[#EF4444]`

---

## 5. 디자인 가이드

### 5.1 일관성 원칙

모든 Admin App UI는 기존 사용자 앱(`/app`)의 Neo-Brutalism 디자인 시스템을 그대로 따른다.

### 5.2 Neo-Brutalism 유틸리티 클래스

| Class | Style |
|-------|-------|
| `.brutal-shadow` | `box-shadow: 4px 4px 0px 0px #000000` |
| `.brutal-shadow-sm` | `box-shadow: 2px 2px 0px 0px #000000` |
| `.brutal-shadow-lg` | `box-shadow: 6px 6px 0px 0px #000000` |
| `.brutal-border` | `border: 2px solid #000000` |
| `.brutal-border-3` | `border: 3px solid #000000` |
| `.brutal-hover` | hover: `translate(2px, 2px)` + shadow 축소, active: `translate(4px, 4px)` + shadow 제거 |
| `border-radius` | `0` (모든 요소 직각, `--radius: 0rem`) |

### 5.3 로그인 페이지 레이아웃

- **배경**: `bg-[#F5F5F5]` 전체 화면
- **폼 카드**: `bg-white brutal-border-3 brutal-shadow-lg p-8 w-full max-w-md mx-auto`
- **타이틀**: "Admin Login" — `text-2xl font-bold tracking-tight`
- **중앙 정렬**: flexbox `items-center justify-center min-h-screen`

### 5.4 테이블 스타일

- **테이블 컨테이너**: `bg-white brutal-border brutal-shadow overflow-hidden`
- **테이블 헤더**: `bg-[#F5F5F5] border-b-2 border-black text-left text-sm font-bold`
- **테이블 행**: `border-b border-gray-200 hover:bg-[#F5F5F5] transition-colors`
- **테이블 셀**: `px-4 py-3 text-sm`

### 5.5 다이얼로그 스타일

- **Overlay**: Radix Dialog Overlay 기본 + `bg-black/50`
- **Content**: `brutal-border-3 brutal-shadow-lg bg-white p-6 max-w-md`
- **Title**: `text-lg font-bold`
- **Separator**: `border-b-2 border-black mb-4`

### 5.6 컴포넌트별 스타일

| Component | Style |
|-----------|-------|
| Sign In Button | `brutal-border brutal-shadow brutal-hover bg-[#3B82F6] text-white w-full px-4 py-3 text-base font-bold` |
| Create Account Button | `brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] text-white px-4 py-2 text-sm font-bold` |
| Cancel Button | `brutal-border brutal-shadow-sm brutal-hover bg-white px-4 py-2 text-sm font-bold` |
| Delete Button (dialog) | `brutal-border brutal-shadow-sm brutal-hover bg-[#EF4444] text-white px-4 py-2 text-sm font-bold` |
| Input Field | `brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none` |
| Role Badge | `brutal-border bg-[#DBEAFE] px-2 py-0.5 text-xs font-bold` |
| Active Badge | `bg-green-100 text-green-800 px-2 py-0.5 text-xs font-bold rounded-full` |
| Inactive Badge | `bg-gray-100 text-gray-500 px-2 py-0.5 text-xs font-bold rounded-full` |
| Action Icon Button | `p-1.5 hover:bg-[#F5F5F5] transition-colors` |
| Action Icon (delete) | `p-1.5 text-[#EF4444] hover:bg-red-50` |
| Nav Link | `text-sm font-bold hover:text-[#3B82F6] transition-colors` |
| Nav Link (active) | `text-[#3B82F6]` |
| Page Title | `text-xl md:text-2xl font-bold tracking-tight` |
| Dashboard Card | `bg-white brutal-border brutal-shadow p-6` |
| Validation Error | `text-sm text-[#EF4444] mt-1` |
| Empty State | `text-center py-16 text-gray-500` |

### 5.7 색상 팔레트

| Usage | Color | Code |
|-------|-------|------|
| Primary / Buttons | Blue | #3B82F6 |
| Accent / Badge BG | Light Blue | #DBEAFE |
| Text / Border | Black | #000000 |
| Background | White | #FFFFFF |
| Page Background | Gray | #F5F5F5 |
| Destructive | Red | #EF4444 |

### 5.8 폰트

- 본문/UI: Space Grotesk (`font-sans`)
- 날짜/타임스탬프: DM Mono (`font-mono`)

---

## 6. 보안 사항

### 6.1 XSS 방지
- 사용자 입력값 및 API 응답 렌더링 시 React의 기본 이스케이핑에 의존
- `innerHTML`, `dangerouslySetInnerHTML` 직접 조작 금지

### 6.2 입력 검증
- 클라이언트 사이드: 이메일 형식, 사용자명 길이(2~50자), 비밀번호 최소 길이(8자) 검증
- 서버 사이드 검증에도 의존 (이중 검증)

### 6.3 JWT 토큰 관리
- `authFetch` 패턴으로 토큰 자동 첨부, 만료 시 자동 갱신, 갱신 실패 시 로그인 리다이렉트
- 동시 다중 요청 시 토큰 갱신 중복 방지 (singleton refresh promise 패턴)

### 6.4 자기 보호
- 자기 자신의 관리자 계정 삭제 방지
- UI: 테이블에서 자기 자신의 행의 삭제 버튼 비활성화 (`opacity-30 cursor-not-allowed`)
- API: 403 에러 응답 시 "Cannot delete your own account." 에러 토스트

### 6.5 전송 중복 방지
- 모든 폼 제출 중 제출 버튼 비활성화로 중복 요청 방지

---

## 7. 기술 구현 사항

### 7.1 디렉토리/파일 구조

```
admin/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── src/
    ├── app/
    │   ├── layout.tsx              # 루트 레이아웃 (AuthProvider + ToastProvider)
    │   ├── page.tsx                # 대시보드 페이지
    │   ├── globals.css             # 글로벌 스타일 + Neo-Brutalism 유틸리티
    │   ├── signin/
    │   │   └── page.tsx            # 관리자 로그인 페이지
    │   └── accounts/
    │       └── page.tsx            # 관리자 계정 관리 페이지
    ├── components/
    │   ├── ui/
    │   │   ├── button.tsx          # Button (Radix Slot + CVA)
    │   │   ├── input.tsx           # Input
    │   │   ├── dialog.tsx          # Dialog (Radix Dialog)
    │   │   ├── alert-dialog.tsx    # AlertDialog (Radix AlertDialog)
    │   │   └── badge.tsx           # Badge (CVA)
    │   ├── auth/
    │   │   ├── signin-form.tsx     # 로그인 폼
    │   │   └── header.tsx          # 앱 헤더 (타이틀, 네비게이션, 사용자 정보, 로그아웃)
    │   └── admin/
    │       ├── accounts-table.tsx  # 관리자 계정 테이블
    │       ├── create-dialog.tsx   # 계정 생성 다이얼로그
    │       ├── detail-dialog.tsx   # 계정 상세 다이얼로그
    │       ├── edit-dialog.tsx     # 계정 수정 다이얼로그
    │       └── delete-dialog.tsx   # 계정 삭제 확인 다이얼로그
    ├── contexts/
    │   ├── auth-context.tsx        # 관리자 인증 상태 Context
    │   └── toast-context.tsx       # 토스트 알림 Context
    ├── lib/
    │   ├── auth-api.ts             # 관리자 로그인/로그아웃 API
    │   ├── admin-api.ts            # 관리자 계정 CRUD API
    │   ├── auth-fetch.ts           # 인증 fetch 래퍼 (authFetch, parseResponse, parseVoidResponse)
    │   └── utils.ts                # cn 헬퍼, 유효성 검증 유틸리티
    └── types/
        ├── auth.ts                 # TokenResponse, AdminUser, ApiResponse<T>
        └── admin.ts                # AdminResponse, AdminCreateRequest, AdminUpdateRequest
```

### 7.2 package.json 주요 의존성

```json
{
  "name": "admin",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-alert-dialog": "latest",
    "@radix-ui/react-slot": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "latest",
    "postcss": "latest"
  }
}
```

### 7.3 next.config.ts API 프록시 설정

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8081/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

### 7.4 TypeScript 타입 정의

```typescript
// types/auth.ts
export interface ApiResponse<T> {
  code: string;
  messageCode: { code: string; text: string };
  message: string;
  data: T;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: string;
}
```

```typescript
// types/admin.ts
export interface AdminResponse {
  id: number;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminCreateRequest {
  email: string;
  username: string;
  password: string;
}

export interface AdminUpdateRequest {
  username?: string;
  password?: string;
}
```

### 7.5 API 클라이언트 구현

```typescript
// lib/auth-api.ts
import { parseResponse } from "@/lib/auth-fetch";
import type { TokenResponse } from "@/types/auth";

const BASE = "/api/v1/auth";

export async function adminLogin(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<TokenResponse>(res);
}

export async function logout(refreshToken: string): Promise<void> {
  // authFetch로 POST /api/v1/auth/admin/logout 호출 + parseVoidResponse
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/admin/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return parseResponse<TokenResponse>(res);
}
```

```typescript
// lib/admin-api.ts
import { authFetch, parseResponse, parseVoidResponse } from "@/lib/auth-fetch";
import type { AdminResponse, AdminCreateRequest, AdminUpdateRequest } from "@/types/admin";

const BASE = "/api/v1/auth/admin";

export async function fetchAdminAccounts(): Promise<AdminResponse[]> {
  const res = await authFetch(`${BASE}/accounts`);
  return parseResponse<AdminResponse[]>(res);
}

export async function fetchAdminDetail(adminId: number): Promise<AdminResponse> {
  const res = await authFetch(`${BASE}/accounts/${adminId}`);
  return parseResponse<AdminResponse>(res);
}

export async function createAdminAccount(req: AdminCreateRequest): Promise<AdminResponse> {
  const res = await authFetch(`${BASE}/accounts`, {
    method: "POST",
    body: JSON.stringify(req),
  });
  return parseResponse<AdminResponse>(res);
}

export async function updateAdminAccount(adminId: number, req: AdminUpdateRequest): Promise<AdminResponse> {
  const res = await authFetch(`${BASE}/accounts/${adminId}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
  return parseResponse<AdminResponse>(res);
}

export async function deleteAdminAccount(adminId: number): Promise<void> {
  const res = await authFetch(`${BASE}/accounts/${adminId}`, {
    method: "DELETE",
  });
  return parseVoidResponse(res);
}
```

### 7.6 인증 Context 구현

```typescript
// contexts/auth-context.tsx 패턴
// AuthProvider — localStorage에서 토큰/유저 정보 hydration
// useAuth() — { user, isLoading, login, logout } 제공

// login: adminLogin() 호출 → accessToken, refreshToken localStorage 저장 → JWT decode로 user 정보 추출
// logout: logout API 호출 (성공/실패 무관) → localStorage 토큰 제거 → /signin 리다이렉트
// hydration: 마운트 시 localStorage에서 accessToken 존재 여부 확인 → JWT decode로 user 복원
```

### 7.7 상태 관리

- **인증 상태**: `AuthContext` (전역)
- **계정 목록**: `/accounts` 페이지 컴포넌트의 로컬 state (`useState<AdminResponse[]>`)
- **다이얼로그 상태**: 각 다이얼로그의 open/close 로컬 state
- **폼 상태**: 각 폼 컴포넌트의 로컬 state (`useState`)
- **토스트**: `ToastContext` (전역)

### 7.8 독립 실행

```bash
cd admin
npm install
npm run dev
# → http://localhost:3001
```

---

## 8. 접근성

- **폼 필드**: 모든 `<input>`에 `<label>` 연결 (`htmlFor` + `id`)
- **에러 메시지**: `aria-live="polite"` 적용으로 스크린리더 에러 인식
- **테이블**: `<table>` 시맨틱 마크업 사용, `aria-label="Admin accounts table"`
- **키보드 네비게이션**: 모든 인터랙티브 요소 Tab 이동 가능
- **다이얼로그 포커스 트랩**: Radix Dialog/AlertDialog 기본 포커스 트랩 활용
- **버튼 상태**: 비활성화된 버튼에 `aria-disabled="true"` 적용

---

## 9. 범위 제한

### 포함

- 관리자 전용 로그인 페이지 (`/signin`)
- 관리자 대시보드 (`/`) — 계정 관리 네비게이션
- 관리자 계정 목록 테이블 (`/accounts`)
- 관리자 계정 생성 다이얼로그
- 관리자 상세 조회 다이얼로그
- 관리자 정보 수정 다이얼로그
- 관리자 계정 삭제 확인 다이얼로그
- 자기 자신 삭제 방지 (UI + API 에러 처리)
- 헤더 (앱 타이틀, 네비게이션, 사용자 정보, 로그아웃)
- JWT 토큰 관리 (저장, 자동 갱신, 만료 시 리다이렉트)
- 인증 가드 (비인증 시 `/signin` 리다이렉트)
- 클라이언트/서버 유효성 검증 및 에러 표시
- 토스트 알림 (성공/에러)
- 로딩 상태 (스켈레톤, 버튼 비활성화)
- Empty State UI
- Neo-Brutalism 디자인 일관성
- 독립 프로젝트 구조 (별도 package.json, 포트 3001)

### 미포함

- 다크 모드
- 다국어 시스템 (i18n)
- 역할 기반 접근 제어 세분화 (현재 ADMIN 단일 권한)
- 감사 로그 UI
- 대시보드 차트/통계
- 실시간 알림 (WebSocket)
- 클라이언트 사이드 페이지네이션 (API가 전체 목록 반환)
- 테이블 정렬/필터링
- 검색 기능
- 모노레포 설정, 공유 패키지 추출
- 서버 사이드 렌더링 (클라이언트 사이드 인증만)
- 비밀번호 강도 표시기
- 전역 상태 관리 라이브러리 (React Context + 로컬 state로 충분)

---

**문서 버전**: 1.1
**최종 업데이트**: 2026-03-05
