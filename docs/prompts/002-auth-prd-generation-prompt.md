# Auth 기능 PRD 작성 프롬프트

---

## 사용법

아래 프롬프트를 LLM에 입력하여 PRD를 생성한다. `<api-spec>` 영역에 Auth API 설계서 전문을 삽입한다.

---

## 프롬프트

```
당신은 시니어 프론트엔드 프로덕트 매니저입니다. 아래 제공하는 Auth API 설계서와 요구사항을 기반으로 프론트엔드 인증 기능 PRD(Product Requirements Document)를 작성하세요.

# 역할
- 프론트엔드 PRD 작성 전문가
- API 스펙을 읽고 프론트엔드 관점의 요구사항으로 변환

# 입력 자료

<api-spec>
{여기에 docs/API-specifications/api-auth-specification.md 전문 삽입}
</api-spec>

# 프로젝트 기본 정보

| 항목 | 내용 |
|------|------|
| 기술 스택 | Next.js 16 (App Router) + React 19 + TypeScript |
| UI 라이브러리 | Radix UI + CVA (class-variance-authority) |
| 스타일링 | Tailwind CSS v4 + 커스텀 Neo-Brutalism 유틸리티 |
| 아이콘 | Lucide React |
| 폰트 | Space Grotesk (sans), DM Mono (mono) |
| 디자인 테마 | Neo-Brutalism |
| 색상 테마 | Primary Blue (#3B82F6), Accent Light Blue (#DBEAFE), Black (#000000), White (#FFFFFF), Gray (#F5F5F5) |
| API Gateway | http://localhost:8081 (Next.js rewrites로 /api/* → Gateway 프록시) |
| UI 언어 | 영문 (화면에 표시되는 모든 텍스트는 영문 사용) |

# 기존 코드베이스 컨텍스트

현재 랜딩 페이지(`/`)가 구현되어 있으며 다음 구조를 따른다:
- Header: 좌측 "Tech N AI" 로고, 우측 검색바
- Main: 필터바 → 카드 그리드 → 페이지네이션
- 디자인: Neo-Brutalism (2px 검정 테두리, 4px 오프셋 검정 그림자, 0 border-radius)

Neo-Brutalism 커스텀 CSS 유틸리티:
- `.brutal-shadow`: box-shadow 4px 4px 0px 0px #000000
- `.brutal-shadow-sm`: box-shadow 2px 2px 0px 0px #000000
- `.brutal-border`: border 2px solid #000000
- `.brutal-hover`: hover 시 translate(2px, 2px) + shadow 축소, active 시 translate(4px, 4px) + shadow 제거

프로젝트 디렉토리 구조:
```
src/
├── app/
│   ├── layout.tsx       (루트 레이아웃)
│   ├── page.tsx         (랜딩 페이지)
│   └── globals.css      (글로벌 스타일 + Neo-Brutalism 유틸리티)
├── components/
│   ├── ui/              (공통 UI 컴포넌트: button, input, dialog, badge 등)
│   └── emerging-tech/   (도메인 컴포넌트)
├── lib/
│   ├── api.ts           (API 클라이언트)
│   ├── constants.ts     (상수)
│   └── utils.ts         (cn 헬퍼)
└── types/
    └── emerging-tech.ts (타입 정의)
```

# 기능 요구사항

## F1. 헤더 인증 UI
- 기존 Header 우측에 인증 버튼 영역 추가
- 비로그인 상태: "Sign Up", "Sign In" 버튼 표시
- 로그인 상태: 사용자명 표시 + "Logout" 버튼 표시
- Sign Up 클릭 → `/signup` 페이지 이동
- Sign In 클릭 → `/signin` 페이지 이동
- Logout 클릭 → 로그아웃 API 호출 후 토큰 제거, 비로그인 상태로 전환

## F2. 회원가입 (`/signup`)
- 사용 API: `POST /api/v1/auth/signup`
- 입력 필드: Email, Username, Password, Confirm Password
- 클라이언트 유효성 검증:
  - Email: 이메일 형식
  - Username: 3~50자
  - Password: 최소 8자, 대소문자/숫자/특수문자 중 2가지 이상
  - Confirm Password: Password와 일치
- 성공 시: 이메일 인증 안내 메시지 표시 (회원가입 성공 + 이메일 확인 요청)
- 에러 처리: 409 이메일/사용자명 중복, 400 유효성 실패
- 하단에 "Already have an account? Sign In" 링크

## F3. 로그인 (`/signin`)
- 사용 API: `POST /api/v1/auth/login`
- 입력 필드: Email, Password
- 성공 시: TokenResponse의 accessToken, refreshToken 저장 → 랜딩 페이지(`/`)로 리다이렉트
- 에러 처리: 401 인증 실패 (이메일/비밀번호 불일치, 이메일 미인증)
- 하단 링크:
  - "Don't have an account? Sign Up"
  - "Forgot password?"

## F4. OAuth 로그인
- OAuth 제공자: Google, Kakao, Naver
- 로그인 페이지에 OAuth 버튼 배치 (구분선 "Or continue with" 포함)
- 사용 API: `GET /api/v1/auth/oauth2/{provider}` (브라우저에서 직접 이동 → 302 리다이렉트)
- 콜백 처리:
  - OAuth 콜백 페이지 (`/oauth/callback`) 구현
  - `GET /api/v1/auth/oauth2/{provider}/callback?code={code}&state={state}`
  - 성공 시: TokenResponse 저장 → 랜딩 페이지로 리다이렉트
  - 실패 시: 에러 메시지 표시 후 로그인 페이지로 이동

## F5. 이메일 인증
- 사용 API: `GET /api/v1/auth/verify-email?token={token}`
- 이메일 인증 결과 페이지 (`/verify-email`) 구현
- 쿼리 파라미터에서 token 추출 → API 호출
- 성공 시: 인증 완료 메시지 + "Go to Sign In" 링크
- 실패 시: 토큰 만료/무효/중복 인증 에러 메시지

## F6. 비밀번호 재설정
- 비밀번호 재설정 요청 페이지 (`/reset-password`)
  - 사용 API: `POST /api/v1/auth/reset-password`
  - 입력 필드: Email
  - 성공 시: 이메일 발송 안내 메시지 (보안상 존재하지 않는 이메일도 동일 응답)
- 비밀번호 재설정 확인 페이지 (`/reset-password/confirm`)
  - 사용 API: `POST /api/v1/auth/reset-password/confirm`
  - 쿼리 파라미터에서 token 추출
  - 입력 필드: New Password, Confirm New Password
  - 클라이언트 유효성 검증: 비밀번호 정책 동일 적용
  - 성공 시: 재설정 완료 메시지 + "Go to Sign In" 링크
  - 에러 처리: 400 토큰 만료/무효, 비밀번호 정책 위반, 이전 비밀번호 동일

## F7. 토큰 관리
- 사용 API: `POST /api/v1/auth/refresh`
- accessToken, refreshToken 저장소: localStorage (또는 적절한 클라이언트 스토리지)
- API 요청 시 Authorization 헤더에 Bearer 토큰 자동 첨부
- accessToken 만료(401 응답) 시 refreshToken으로 자동 갱신 시도
- refreshToken 만료 시 로그아웃 처리 (토큰 제거 + 로그인 페이지 이동)

## F8. 로그아웃
- 사용 API: `POST /api/v1/auth/logout`
- Header의 Logout 버튼 클릭 시 호출
- Request: Authorization 헤더 + refreshToken body 전송
- 성공/실패 무관하게 클라이언트 토큰 제거 + 비로그인 상태 전환

## F9. 회원탈퇴
- 사용 API: `DELETE /api/v1/auth/me`
- 접근 경로: 로그인 상태에서 접근 가능한 설정 영역 또는 프로필 드롭다운
- 입력 필드: Password (확인용, 선택), Reason (선택)
- 확인 다이얼로그 표시 후 실행
- 성공 시: 토큰 제거 + 랜딩 페이지 이동 + 안내 메시지
- 에러 처리: 401 인증 실패, 404 사용자 없음, 409 이미 탈퇴

## F10. 관리자 기능
- 관리자 로그인: `POST /api/v1/auth/admin/login` (일반 로그인과 동일 UI, 별도 경로 `/admin/signin`)
- 관리자 계정 CRUD: 관리자 전용 페이지 (`/admin/accounts`)
  - 목록 조회: `GET /api/v1/auth/admin/accounts`
  - 상세 조회: `GET /api/v1/auth/admin/accounts/{adminId}`
  - 계정 생성: `POST /api/v1/auth/admin/accounts` (SUPER_ADMIN만)
  - 정보 수정: `PUT /api/v1/auth/admin/accounts/{adminId}` (SUPER_ADMIN만)
  - 계정 삭제: `DELETE /api/v1/auth/admin/accounts/{adminId}` (SUPER_ADMIN만, 자기 자신 삭제 불가)
- 권한별 UI 분기: ADMIN은 조회만, SUPER_ADMIN은 생성/수정/삭제 가능

# 출력 형식

아래 구조를 따라 PRD를 작성하세요. 각 섹션은 반드시 포함되어야 합니다.

## PRD 구조

1. **개요**: 프로젝트 기본 정보 테이블 (기술 스택, 디자인 테마, 색상, Gateway, 인증 방식, UI 언어)
2. **API 연동**: Auth API 엔드포인트 전체 목록. 각 API의 요청 파라미터, 응답 필드, 에러 코드 정리. 공통 응답 형식(ApiResponse<T>) 명시
3. **페이지 구조**: 신규 페이지 목록과 각 페이지의 ASCII 와이어프레임
   - `/signup` - 회원가입
   - `/signin` - 로그인 (OAuth 포함)
   - `/verify-email` - 이메일 인증 결과
   - `/reset-password` - 비밀번호 재설정 요청
   - `/reset-password/confirm` - 비밀번호 재설정 확인
   - `/oauth/callback` - OAuth 콜백 처리
   - `/admin/signin` - 관리자 로그인
   - `/admin/accounts` - 관리자 계정 관리
4. **컴포넌트 상세**:
   - Header 인증 영역: 로그인 전/후 상태별 버튼 렌더링 규칙
   - 인증 폼: Email/Password 입력, 유효성 검증 규칙, 에러 메시지 표시 방식
   - OAuth 버튼 그룹: 제공자별 버튼 디자인, 클릭 동작
   - 토큰 관리: 저장/갱신/삭제 흐름
   - 회원탈퇴 확인 다이얼로그: 구조, 동작
   - 관리자 계정 테이블: 목록/생성/수정/삭제 UI
5. **인증 상태 관리**: 인증 Context 또는 상태 관리 방식, 토큰 저장소, 자동 갱신 로직, 인증 필요 페이지 가드
6. **디자인 가이드**: 랜딩 페이지와 일관된 Neo-Brutalism 스타일 적용 규칙. 인증 페이지 레이아웃 (중앙 정렬 폼 카드). 기존 CSS 유틸리티(brutal-shadow, brutal-border, brutal-hover) 활용 방법. 색상 팔레트, 폰트, 간격 규칙
7. **기술 구현 사항**: 추가 디렉토리/파일 구조, API 클라이언트 확장 방식, 라우팅 구조, 에러 코드별 메시지 매핑
8. **범위 제한**: 포함/미포함 항목 명시

# 제약 조건

- API 스펙에 정의된 필드명, 파라미터명, Enum 값을 그대로 사용한다. 임의로 변경하지 않는다.
- API Gateway(8081)로 일괄 요청한다. 개별 서비스 포트로 직접 요청하지 않는다. 현재 Next.js rewrites가 `/api/*` → `http://localhost:8081/api/*`로 프록시 설정되어 있으므로 이를 활용한다.
- 기존 랜딩 페이지의 디자인 시스템(Neo-Brutalism, 색상, 폰트, 유틸리티 클래스)을 그대로 따른다.
- 기존 컴포넌트 라이브러리(Radix UI, CVA, Lucide 아이콘)를 활용한다. 새로운 UI 라이브러리를 추가하지 않는다.
- 화면에 표시되는 모든 텍스트(버튼, 라벨, 메시지, 플레이스홀더 등)는 영문을 사용한다.
- 오버엔지니어링하지 않는다. 요구사항에 명시되지 않은 기능(다크 모드, 다국어 시스템, 소셜 프로필 연동 등)을 추가하지 않는다.
- 비밀번호 정책(최소 8자, 대소문자/숫자/특수문자 중 2가지 이상)을 API 스펙 그대로 적용한다.
- OAuth 콜백은 서버 리다이렉트 방식을 따른다. API 서버가 OAuth 제공자 인증 페이지로 302 리다이렉트하고, 콜백 URL로 돌아오면 프론트엔드가 토큰을 수신한다.
```

---

## 프롬프트 엔지니어링 기법 설명

| 기법 | 적용 위치 | 설명 |
|------|----------|------|
| Role Prompting | `# 역할` | LLM에 시니어 PM 역할을 부여하여 전문적 관점 유도 |
| Structured Input | `<api-spec>` 태그 | API 설계서를 명확한 경계로 구분하여 제공 |
| Grounding | `# 기존 코드베이스 컨텍스트` | 실제 구현된 코드 구조, 스타일, 패턴을 명시하여 일관성 확보 |
| Explicit Output Format | `# 출력 형식` > `## PRD 구조` | 8개 섹션 구조를 번호로 지정하여 누락 방지 |
| Few-shot Context | `# 기능 요구사항` F1~F10 | 구체적 기능을 코드 번호로 나열하여 모호성 제거 |
| Constraint Specification | `# 제약 조건` | 오버엔지니어링 방지, 기존 디자인 시스템 준수, API 스펙 준수를 명시 |
| Context Anchoring | `# 프로젝트 기본 정보` | 기술 스택, 색상 코드, Gateway 등 사실 기반 정보를 고정값으로 제공 |
