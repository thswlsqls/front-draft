# Bookmark 기능 PRD 작성 프롬프트

---

## 사용법

아래 프롬프트를 LLM에 입력하여 PRD를 생성한다. `<api-spec>` 영역에 Bookmark API 설계서 전문을 삽입한다.

---

## 프롬프트

```
당신은 시니어 프론트엔드 프로덕트 매니저입니다. 아래 제공하는 Bookmark API 설계서와 요구사항을 기반으로 프론트엔드 북마크 기능 PRD(Product Requirements Document)를 작성하세요.

# 역할
- 프론트엔드 PRD 작성 전문가
- API 스펙을 읽고 프론트엔드 관점의 요구사항으로 변환

# 입력 자료

<api-spec>
{여기에 docs/API-specifications/api-bookmark-specification.md 전문 삽입}
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
| 색상 테마 | Primary Blue (#3B82F6), Accent Light Blue (#DBEAFE), Black (#000000), White (#FFFFFF), Gray (#F5F5F5), Destructive Red (#EF4444) |
| API Gateway | http://localhost:8081 (Next.js rewrites로 /api/* → Gateway 프록시) |
| 인증 | JWT 기반 (Bearer 토큰). 모든 Bookmark API는 인증 필요 |
| UI 언어 | 영문 (화면에 표시되는 모든 텍스트는 영문 사용) |

# 기존 코드베이스 컨텍스트

## 구현 완료된 기능
1. **랜딩 페이지 (`/`)**: Emerging Tech 목록 조회, 필터, 검색, 상세 모달
2. **인증 기능**: 회원가입(`/signup`), 로그인(`/signin`), OAuth(Google/Kakao/Naver), 이메일 인증, 비밀번호 재설정, 토큰 관리, 로그아웃, 회원탈퇴

## 디자인 시스템: Neo-Brutalism
- `.brutal-shadow`: box-shadow 4px 4px 0px 0px #000000
- `.brutal-shadow-sm`: box-shadow 2px 2px 0px 0px #000000
- `.brutal-shadow-lg`: box-shadow 6px 6px 0px 0px #000000
- `.brutal-border`: border 2px solid #000000
- `.brutal-border-3`: border 3px solid #000000
- `.brutal-hover`: hover 시 translate(2px, 2px) + shadow 축소, active 시 translate(4px, 4px) + shadow 제거
- border-radius: 0 (모든 요소 직각)

## 인증 인프라 (재사용 대상)
- `lib/auth-fetch.ts`: `authFetch()` — JWT Authorization 헤더 자동 첨부, 401 시 토큰 자동 갱신, 갱신 실패 시 로그인 페이지 리다이렉트. `parseResponse<T>()`, `parseVoidResponse()` — ApiResponse<T> 파싱 및 에러 처리. `AuthError` 클래스, `getErrorMessage()` 에러 코드 매핑.
- `contexts/auth-context.tsx`: `useAuth()` — user, isLoading, login, logout 제공
- `lib/auth-api.ts`: 인증 API 호출 패턴 참고

## 프로젝트 디렉토리 구조
```
src/
├── app/
│   ├── layout.tsx              (루트 레이아웃, AuthProvider 감싸기)
│   ├── page.tsx                (랜딩 페이지)
│   ├── globals.css             (글로벌 스타일 + Neo-Brutalism 유틸리티)
│   ├── signup/page.tsx
│   ├── signin/page.tsx
│   ├── verify-email/page.tsx
│   ├── reset-password/page.tsx
│   ├── reset-password/confirm/page.tsx
│   └── oauth/callback/page.tsx
├── components/
│   ├── ui/                     (공통 UI: button, input, dialog, badge, popover, calendar)
│   ├── emerging-tech/          (카드, 그리드, 필터바, 검색바, 페이지네이션, 상세 모달)
│   └── auth/                   (인증 폼, OAuth 버튼, 헤더 인증 영역, 탈퇴 다이얼로그)
├── contexts/
│   └── auth-context.tsx        (인증 상태 Context)
├── lib/
│   ├── api.ts                  (Emerging Tech API 클라이언트 — fetchList, fetchDetail, fetchSearch)
│   ├── auth-api.ts             (Auth API 클라이언트)
│   ├── auth-fetch.ts           (인증 fetch 래퍼 — authFetch, parseResponse, clearTokens)
│   ├── constants.ts            (Provider/UpdateType/SourceType 레이블, 색상)
│   └── utils.ts                (cn 헬퍼)
└── types/
    ├── emerging-tech.ts        (EmergingTechItem, ApiResponse<T>, ListParams 등)
    └── auth.ts                 (TokenResponse, AuthUser, SignupRequest 등)
```

## API 클라이언트 패턴

비인증 API (lib/api.ts):
```typescript
const BASE = "/api/v1/emerging-tech";
export async function fetchList(params: ListParams = {}): Promise<EmergingTechPageResponse> {
  const res = await fetch(`${BASE}${toQuery(params)}`);
  if (!res.ok) throw new Error(`목록 조회 실패: ${res.status}`);
  const json: ApiResponse<EmergingTechPageResponse> = await res.json();
  return json.data;
}
```

인증 API (lib/auth-api.ts + lib/auth-fetch.ts):
```typescript
export async function logout(refreshToken: string): Promise<void> {
  const res = await authFetch(`${AUTH_BASE}/logout`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  return parseVoidResponse(res);
}
```

Bookmark API는 **인증 API 패턴(`authFetch` + `parseResponse`/`parseVoidResponse`)**을 따라야 한다.

## 공통 타입 (types/emerging-tech.ts)
```typescript
export interface ApiResponse<T> {
  code: string;
  messageCode: { code: string; text: string };
  message: string;
  data: T;
}
```

# 기능 요구사항

## 전제 조건
- 회원가입 및 로그인한 사용자만 북마크 기능 사용 가능
- 비로그인 사용자에게는 북마크 UI를 표시하지 않거나, 북마크 버튼 클릭 시 로그인 페이지로 안내
- 조회 가능한 모든 Emerging Tech 콘텐츠에 대해 북마크 저장 가능

## F1. 북마크 토글 (랜딩 페이지 통합)
- Emerging Tech 카드 및 상세 모달에 북마크 아이콘 버튼 추가
- 사용 API: `POST /api/v1/bookmark` (저장), `DELETE /api/v1/bookmark/{id}` (삭제)
- 로그인 사용자: 아이콘 클릭으로 북마크 저장/해제 토글
- Optimistic UI: 클릭 즉시 아이콘 상태 전환, API 실패 시 롤백
- 이미 북마크한 콘텐츠(409) 처리

## F2. 북마크 목록 페이지 (`/bookmarks`)
- 사용 API: `GET /api/v1/bookmark`
- 사용자의 북마크 목록을 카드 형태로 표시
- 페이지네이션: API 응답의 pageSize, pageNumber, totalPageNumber, totalSize 기반
- 정렬: createdAt 기준 (기본 desc), 정렬 변경 UI
- Provider 필터 지원
- 각 북마크 카드에서 원본 Emerging Tech 콘텐츠로 이동 가능

## F3. 북마크 상세 조회
- 사용 API: `GET /api/v1/bookmark/{id}`
- 북마크 카드 클릭 시 상세 정보 표시 (모달 또는 인라인 확장)
- 표시 필드: title, url, provider, summary, publishedAt, tags, memo, createdAt, updatedAt

## F4. 북마크 수정
- 사용 API: `PUT /api/v1/bookmark/{id}`
- 수정 가능 필드: tags, memo
- 인라인 편집 또는 편집 모달 방식
- 수정 성공 시 목록 갱신

## F5. 북마크 삭제
- 사용 API: `DELETE /api/v1/bookmark/{id}`
- 삭제 전 확인 다이얼로그 표시
- 소프트 삭제: 삭제 후 휴지통에서 복구 가능함을 안내
- 삭제 성공 시 목록에서 제거

## F6. 삭제된 북마크 목록 (휴지통) (`/bookmarks/deleted`)
- 사용 API: `GET /api/v1/bookmark/deleted`
- 삭제된 북마크 목록 표시
- 페이지네이션, 조회 기간(days) 파라미터 지원
- 각 항목에 복구 버튼 표시

## F7. 북마크 복구
- 사용 API: `POST /api/v1/bookmark/{id}/restore`
- 삭제된 북마크 복구
- 복구 성공 시 휴지통 목록에서 제거, 안내 메시지 표시

## F8. 북마크 검색 (`/bookmarks` 내 검색)
- 사용 API: `GET /api/v1/bookmark/search`
- 검색어(q) 입력 + 검색 필드 선택 (all, title, memo, tags)
- 검색 결과 페이지네이션
- 검색 활성화 시 기본 목록 필터와 분리

## F9. 변경 이력 조회
- 사용 API: `GET /api/v1/bookmark/history/{entityId}`
- 북마크 상세 화면에서 변경 이력 확인 기능
- 이력 항목: operationType (CREATE/UPDATE/DELETE), beforeData, afterData, changedAt
- 페이지네이션, operationType 필터, 날짜 범위 필터 지원

## F10. 특정 시점 데이터 조회
- 사용 API: `GET /api/v1/bookmark/history/{entityId}/at`
- 타임스탬프 입력으로 해당 시점의 북마크 상태 조회
- 변경 이력 화면에서 접근

## F11. 특정 버전 복구
- 사용 API: `POST /api/v1/bookmark/history/{entityId}/restore`
- 변경 이력에서 특정 버전 선택 후 복구
- 복구 전 확인 다이얼로그
- 복구 성공 시 현재 북마크 데이터 갱신

## F12. 헤더 네비게이션 확장
- 로그인 상태의 Header에 "Bookmarks" 네비게이션 링크 추가
- `/bookmarks` 페이지로 이동

# 프론트엔드 구현 베스트 프랙티스 가이드

PRD 작성 시 아래 프론트엔드 북마크 구현 베스트 프랙티스를 반영하세요:

1. **Optimistic UI**: 북마크 토글 시 API 응답을 기다리지 않고 즉시 UI 반영. 실패 시 롤백 + 에러 토스트.
2. **Debounced Search**: 검색어 입력 시 디바운스(300ms) 적용하여 불필요한 API 호출 방지.
3. **Loading & Error States**: 모든 비동기 작업에 로딩 인디케이터와 에러 상태 표시.
4. **Confirmation Dialogs**: 삭제, 버전 복구 등 파괴적 액션에 확인 다이얼로그 필수.
5. **Toast Notifications**: 저장/수정/삭제/복구 성공/실패 시 토스트 메시지로 피드백.
6. **Cache Invalidation**: 북마크 생성/수정/삭제 후 관련 목록 데이터 갱신.
7. **Empty States**: 북마크 없음, 검색 결과 없음, 삭제된 항목 없음 상태별 안내 UI.
8. **Authentication Guard**: 비인증 사용자의 북마크 페이지 접근 시 로그인 페이지로 리다이렉트.

# 출력 형식

아래 구조를 따라 PRD를 작성하세요. 각 섹션은 반드시 포함되어야 합니다.

## PRD 구조

1. **개요**: 프로젝트 기본 정보 테이블 (기술 스택, 디자인 테마, 색상, Gateway, 인증 방식, UI 언어)
2. **API 연동**: Bookmark API 엔드포인트 전체 목록 (11개). 각 API의 요청 파라미터, 응답 필드, 에러 코드 정리. 공통 응답 형식(ApiResponse<T>, PageData<T>) 명시
3. **페이지 구조**: 신규/수정 페이지 목록과 각 페이지의 ASCII 와이어프레임
   - `/` (수정) — 카드/모달에 북마크 아이콘 추가
   - `/bookmarks` (신규) — 북마크 목록
   - `/bookmarks/deleted` (신규) — 삭제된 북마크 (휴지통)
4. **컴포넌트 상세**:
   - 북마크 토글 버튼: 카드/모달 내 배치, 로그인 상태별 동작, Optimistic UI 규칙
   - 북마크 목록 카드: 표시 필드, 레이아웃, 액션 버튼 (수정/삭제/이력)
   - 북마크 수정 폼: tags/memo 편집 UI, 유효성 규칙
   - 북마크 검색바: 검색어 입력, 검색 필드 선택, 디바운스 규칙
   - 삭제 확인 다이얼로그: 구조, 동작
   - 변경 이력 뷰: 이력 목록, 필터, 시점 조회, 버전 복구 UI
   - 페이지네이션: 동작 규칙
   - Empty State: 상태별 메시지
   - Header: 네비게이션 확장
5. **디자인 가이드**: 랜딩 페이지 및 인증 페이지와 일관된 Neo-Brutalism 스타일 적용 규칙. 기존 CSS 유틸리티(brutal-shadow, brutal-border, brutal-hover) 활용 방법. 북마크 아이콘 상태별 스타일 (활성: 채워진 아이콘 + Primary Blue, 비활성: 빈 아이콘). 색상 팔레트, 폰트, 간격 규칙
6. **기술 구현 사항**: 추가 디렉토리/파일 구조 (`types/bookmark.ts`, `lib/bookmark-api.ts`, `components/bookmark/`, `app/bookmarks/` 등). API 클라이언트 구현 방식 (`authFetch` + `parseResponse` 패턴 재사용). 인증 가드 구현 방식. 상태 관리 방향
7. **범위 제한**: 포함/미포함 항목 명시

# 제약 조건

- API 스펙에 정의된 필드명, 파라미터명, Enum 값을 그대로 사용한다. 임의로 변경하지 않는다.
- API Gateway(8081)로 일괄 요청한다. 개별 서비스 포트(8085)로 직접 요청하지 않는다. Next.js rewrites `/api/*` → `http://localhost:8081/api/*` 프록시를 활용한다.
- 기존 랜딩 페이지 및 인증 페이지의 디자인 시스템(Neo-Brutalism, 색상, 폰트, 유틸리티 클래스)을 그대로 따른다.
- 기존 컴포넌트 라이브러리(Radix UI, CVA, Lucide 아이콘)를 활용한다. 새로운 UI 라이브러리를 추가하지 않는다.
- 기존 인증 인프라(`authFetch`, `parseResponse`, `parseVoidResponse`, `useAuth`)를 재사용한다. 중복 구현하지 않는다.
- 화면에 표시되는 모든 텍스트(버튼, 라벨, 메시지, 플레이스홀더 등)는 영문을 사용한다.
- 오버엔지니어링하지 않는다. 요구사항에 명시되지 않은 기능(다크 모드, 다국어 시스템, 실시간 동기화, 드래그 앤 드롭 정렬 등)을 추가하지 않는다.
- PageData<T>의 필드명(pageSize, pageNumber, totalPageNumber, totalSize, list)을 API 스펙 그대로 사용한다. 기존 EmergingTech의 페이징 필드명(totalCount, items)과 다름에 유의한다.
```

---

## 프롬프트 엔지니어링 기법 설명

| 기법 | 적용 위치 | 설명 |
|------|----------|------|
| Role Prompting | `# 역할` | LLM에 시니어 PM 역할을 부여하여 전문적 관점 유도 |
| Structured Input | `<api-spec>` 태그 | API 설계서를 명확한 경계로 구분하여 제공 |
| Grounding | `# 기존 코드베이스 컨텍스트` | 실제 구현된 코드 구조, 인증 인프라, API 패턴을 코드 스니펫과 함께 명시하여 기존 패턴과의 일관성 확보 |
| Explicit Output Format | `# 출력 형식` > `## PRD 구조` | 7개 섹션 구조를 번호로 지정하여 누락 방지 |
| Few-shot Context | `# 기능 요구사항` F1~F12 | 12개 기능을 코드 번호로 나열, 각 기능에 사용 API를 명시하여 모호성 제거 |
| Constraint Specification | `# 제약 조건` | 오버엔지니어링 방지, 기존 디자인 시스템/인증 인프라 준수, API 스펙 준수를 명시적으로 선언 |
| Context Anchoring | `# 프로젝트 기본 정보` | 기술 스택, 색상 코드, Gateway 등 사실 기반 정보를 고정값으로 제공 |
| Chain-of-Reference | `## API 클라이언트 패턴`, `## 인증 인프라` | 기존 코드의 실제 패턴을 보여주어 LLM이 동일 패턴으로 확장하도록 유도 |
| Domain-Specific Best Practices | `# 프론트엔드 구현 베스트 프랙티스 가이드` | Optimistic UI, Debounced Search 등 북마크 구현에 필요한 프론트엔드 패턴을 명시하여 PRD에 반영 유도 |
