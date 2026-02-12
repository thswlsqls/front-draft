# PRD: Bookmark - List, Detail, Edit, Delete, Trash, Search, History, Restore

**작성일**: 2026-02-12
**버전**: v1
**기반 프롬프트**: `docs/prompts/003-bookmark-prd-generation-prompt.md`
**API 스펙 문서**: `docs/API-specifications/api-bookmark-specification.md`

---

## 1. 개요

로그인한 사용자가 Emerging Tech 콘텐츠를 북마크하고 관리하는 기능을 프론트엔드에 구현한다. 북마크 저장/해제 토글, 목록 조회, 상세 조회, 수정(tags/memo), 삭제(소프트), 휴지통 조회/복구, 검색, 변경 이력 조회, 특정 시점 조회, 특정 버전 복구를 포함한다.

| 항목 | 내용 |
|------|------|
| 기술 스택 | Next.js 16 (App Router) + React 19 + TypeScript |
| UI 라이브러리 | Radix UI + CVA (class-variance-authority) |
| 스타일링 | Tailwind CSS v4 + Neo-Brutalism 유틸리티 |
| 아이콘 | Lucide React |
| 폰트 | Space Grotesk (sans), DM Mono (mono) |
| 디자인 테마 | Neo-Brutalism |
| 색상 테마 | Primary Blue (#3B82F6), Accent (#DBEAFE), Black (#000000), White (#FFFFFF), Gray (#F5F5F5), Destructive Red (#EF4444) |
| API Gateway | `http://localhost:8081` (Next.js rewrites `/api/*` → Gateway) |
| 인증 방식 | Bearer Token (JWT) — 모든 Bookmark API는 인증 필요 |
| UI 언어 | English (모든 화면 텍스트 영문) |

---

## 2. API 연동

모든 요청은 Gateway(8081)로 전송한다. Next.js rewrites가 `/api/*` → `http://localhost:8081/api/*`로 프록시한다. 모든 Bookmark API는 `Authorization: Bearer {accessToken}` 헤더가 필요하므로 기존 `authFetch`를 사용한다.

### 2.1 공통 응답 형식

```typescript
// 기존 types/emerging-tech.ts에 정의된 ApiResponse<T> 재사용
interface ApiResponse<T> {
  code: string;           // "2000" (성공), "4000", "4010" 등
  messageCode: {
    code: string;         // "SUCCESS", "BOOKMARK_NOT_FOUND" 등
    text: string;
  };
  message?: string;
  data?: T;
}
```

**PageData\<T\>** — Bookmark API 전용 페이징 구조:

```typescript
interface PageData<T> {
  pageSize: number;         // 페이지 크기
  pageNumber: number;       // 현재 페이지 번호 (1부터 시작)
  totalPageNumber: number;  // 전체 페이지 수
  totalSize: number;        // 전체 데이터 수
  list: T[];                // 데이터 리스트
}
```

> **주의**: 기존 EmergingTech의 페이징 필드(`totalCount`, `items`)와 Bookmark의 페이징 필드(`totalSize`, `list`, `totalPageNumber`)는 다르다. 혼용하지 않는다.

### 2.2 엔드포인트 목록

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | `/api/v1/bookmark` | 북마크 저장 |
| 2 | GET | `/api/v1/bookmark` | 북마크 목록 조회 |
| 3 | GET | `/api/v1/bookmark/{id}` | 북마크 상세 조회 |
| 4 | PUT | `/api/v1/bookmark/{id}` | 북마크 수정 |
| 5 | DELETE | `/api/v1/bookmark/{id}` | 북마크 삭제 (소프트) |
| 6 | GET | `/api/v1/bookmark/deleted` | 삭제된 북마크 목록 |
| 7 | POST | `/api/v1/bookmark/{id}/restore` | 북마크 복구 |
| 8 | GET | `/api/v1/bookmark/search` | 북마크 검색 |
| 9 | GET | `/api/v1/bookmark/history/{entityId}` | 변경 이력 조회 |
| 10 | GET | `/api/v1/bookmark/history/{entityId}/at` | 특정 시점 데이터 조회 |
| 11 | POST | `/api/v1/bookmark/history/{entityId}/restore` | 특정 버전 복구 |

### 2.3 요청/응답 상세

#### Create Bookmark (POST `/api/v1/bookmark`)

**Request Body (BookmarkCreateRequest)**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| emergingTechId | String | O | NotBlank | EmergingTech 콘텐츠 ID |
| tags | String[] | X | — | 사용자 지정 태그 목록 |
| memo | String | X | — | 사용자 메모 |

**Response**: `ApiResponse<BookmarkDetailResponse>`

**Errors**: `400` (validation), `401` (auth), `404` (content not found), `409` (already bookmarked)

#### List Bookmarks (GET `/api/v1/bookmark`)

**Query Parameters**

| Param | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| page | Integer | X | 1 | Min(1) | Page number |
| size | Integer | X | 10 | Min(1), Max(100) | Page size |
| sort | String | X | "createdAt,desc" | — | Sort field and direction |
| provider | String | X | — | — | Content provider filter |

**Response**: `ApiResponse<{ data: PageData<BookmarkDetailResponse> }>`

**Errors**: `401` (auth)

#### Get Bookmark Detail (GET `/api/v1/bookmark/{id}`)

**Path Parameters**: `id` — Bookmark TSID

**Response**: `ApiResponse<BookmarkDetailResponse>`

**Errors**: `401` (auth), `403` (forbidden), `404` (not found)

#### Update Bookmark (PUT `/api/v1/bookmark/{id}`)

**Path Parameters**: `id` — Bookmark TSID

**Request Body (BookmarkUpdateRequest)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tags | String[] | X | Updated tag list |
| memo | String | X | Updated memo |

**Response**: `ApiResponse<BookmarkDetailResponse>`

**Errors**: `401` (auth), `403` (forbidden), `404` (not found)

#### Delete Bookmark (DELETE `/api/v1/bookmark/{id}`)

**Path Parameters**: `id` — Bookmark TSID

**Response**: `ApiResponse<Void>`

**Errors**: `401` (auth), `403` (forbidden), `404` (not found)

#### List Deleted Bookmarks (GET `/api/v1/bookmark/deleted`)

**Query Parameters**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | Integer | X | 1 | Page number |
| size | Integer | X | 10 | Page size |
| days | Integer | X | 30 | Lookup period in days |

**Response**: `ApiResponse<{ data: PageData<BookmarkDetailResponse> }>`

**Errors**: `401` (auth)

#### Restore Bookmark (POST `/api/v1/bookmark/{id}/restore`)

**Path Parameters**: `id` — Bookmark TSID

**Response**: `ApiResponse<BookmarkDetailResponse>`

**Errors**: `401` (auth), `403` (forbidden), `404` (not found)

#### Search Bookmarks (GET `/api/v1/bookmark/search`)

**Query Parameters**

| Param | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| q | String | O | — | NotBlank | Search query |
| page | Integer | X | 1 | Min(1) | Page number |
| size | Integer | X | 10 | Min(1), Max(100) | Page size |
| searchField | String | X | "all" | — | Search field: all, title, memo, tags |

**Response**: `ApiResponse<{ data: PageData<BookmarkDetailResponse> }>`

**Errors**: `400` (missing query), `401` (auth)

#### Get History (GET `/api/v1/bookmark/history/{entityId}`)

**Path Parameters**: `entityId` — Bookmark TSID

**Query Parameters**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | Integer | X | 1 | Page number |
| size | Integer | X | 10 | Page size |
| operationType | String | X | — | Filter: CREATE, UPDATE, DELETE |
| startDate | String | X | — | ISO 8601 start date |
| endDate | String | X | — | ISO 8601 end date |

**Response**: `ApiResponse<{ data: PageData<BookmarkHistoryDetailResponse> }>`

**BookmarkHistoryDetailResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| historyId | String | O | History ID |
| entityId | String | O | Bookmark ID |
| operationType | String | O | CREATE / UPDATE / DELETE |
| beforeData | Object | X | Data before change (JSON) |
| afterData | Object | X | Data after change (JSON) |
| changedBy | String | O | Changed by user ID |
| changedAt | String (ISO 8601) | O | Changed at timestamp |
| changeReason | String | X | Change reason |

**Errors**: `401` (auth), `403` (forbidden), `404` (not found)

#### Get Data at Timestamp (GET `/api/v1/bookmark/history/{entityId}/at`)

**Path Parameters**: `entityId` — Bookmark TSID

**Query Parameters**: `timestamp` (String, required, ISO 8601)

**Response**: `ApiResponse<BookmarkHistoryDetailResponse>`

**Errors**: `401` (auth), `403` (forbidden), `404` (not found)

#### Restore to Version (POST `/api/v1/bookmark/history/{entityId}/restore`)

**Path Parameters**: `entityId` — Bookmark TSID

**Query Parameters**: `historyId` (String, required)

**Response**: `ApiResponse<BookmarkDetailResponse>`

**Errors**: `401` (auth), `403` (forbidden), `404` (not found)

### 2.4 공통 응답 모델

**BookmarkDetailResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bookmarkTsid | String | O | Bookmark unique ID (TSID) |
| userId | String | O | User ID |
| emergingTechId | String | O | EmergingTech content ID |
| title | String | X | Content title |
| url | String | X | Content URL |
| provider | String | X | Content provider |
| summary | String | X | Content summary |
| publishedAt | String (ISO 8601) | X | Content published date |
| tags | String[] | X | User tags |
| memo | String | X | User memo |
| createdAt | String (ISO 8601) | O | Bookmark created date |
| createdBy | String | X | Created by user ID |
| updatedAt | String (ISO 8601) | X | Bookmark updated date |
| updatedBy | String | X | Updated by user ID |

### 2.5 에러 코드 매핑

API `messageCode.code` → 프론트엔드 영문 메시지:

| messageCode.code | English Message |
|------------------|-----------------|
| BOOKMARK_NOT_FOUND | Bookmark not found. |
| BOOKMARK_ALREADY_EXISTS | This content is already bookmarked. |
| INVALID_BOOKMARK_ID | Invalid bookmark ID format. |
| CONTENT_NOT_FOUND | Content not found. |
| HISTORY_NOT_FOUND | History not found. |

기존 `auth-fetch.ts`의 HTTP fallback 메시지를 그대로 사용한다:

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

### 3.1 페이지 목록

| Route | Type | Description |
|-------|------|-------------|
| `/` | Modified | 카드/모달에 북마크 아이콘 추가, Header에 Bookmarks 링크 추가 |
| `/bookmarks` | New | 북마크 목록 + 검색 + 필터 |
| `/bookmarks/deleted` | New | 삭제된 북마크 (휴지통) |

### 3.2 Landing Page — Modified (`/`)

Header에 Bookmarks 네비게이션 링크 추가. 카드와 상세 모달에 북마크 토글 아이콘 추가.

```
┌──────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  ┌────────────┐  ┌──────────────────┐  [Bookmarks] [Auth]   │
│  │ Tech N AI  │  │ Search...        │                        │
│  └────────────┘  └──────────────────┘                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Provider | Badge │  │ Provider | Badge │  │ Provider    │ │
│  │ Title           │  │ Title           │  │ Title       │ │
│  │ Summary...      │  │ Summary...      │  │ Summary...  │ │
│  │ ──────────────  │  │ ──────────────  │  │ ──────────  │ │
│  │ Source  Date [B]│  │ Source  Date [B]│  │ Source [B]  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                              │
│  [B] outline = unbookmarked                                  │
│  [B] filled blue = bookmarked                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**상세 모달 — 북마크 아이콘 추가**:

```
┌──────────────────────────────────────┐
│  [Provider] [UpdateType] [Source]     │
│  Title                          [B]  │
│  Date                                │
├──────────────────────────────────────┤
│  Summary text...                     │
│                                      │
│  Tags: [tag1] [tag2]                 │
│  Version: x.x  Author: name         │
│  ──────────────────────────────────  │
│  [View Original]  [GitHub]           │
└──────────────────────────────────────┘
```

### 3.3 Bookmarks Page — New (`/bookmarks`)

```
┌──────────────────────────────────────────────────────────────┐
│  Header (with Bookmarks active)                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  My Bookmarks                                   [Trash] ││
│  │  ────────────────────────────────────────────────────    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Search... [Field: All v]                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Sort: [Created v]  Provider: [All | OPENAI | ...]          │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Provider]  Title                          bookmarkedAt │ │
│  │ Summary...                                              │ │
│  │ Tags: [tag1] [tag2]                                     │ │
│  │ Memo: user memo text...                                 │ │
│  │ ────────────────────────────────────────────────────     │ │
│  │                        [History] [Edit] [Delete]        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ (same card structure)                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [< ] [1] [2] [3] ... [10] [ >]                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Search active 상태**:

```
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ "AI" x [Field: title v]                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│  Results for "AI" -- 15 items                                │
│  (Provider filter / Sort disabled)                           │
```

**Empty state**:

```
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │              No bookmarks yet.                          │ │
│  │         Start bookmarking articles                      │ │
│  │          from the main page!                            │ │
│  │                                                         │ │
│  │              [Browse Articles]                          │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
```

### 3.4 Deleted Bookmarks Page — New (`/bookmarks/deleted`)

```
┌──────────────────────────────────────────────────────────────┐
│  Header                                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Trash                                [Back to Bookmarks]││
│  │  ────────────────────────────────────────────────────    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  Showing items deleted within [30 v] days                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Provider]  Title                          deletedAt    │ │
│  │ Summary...                                              │ │
│  │ ────────────────────────────────────────────────────     │ │
│  │                                          [Restore]      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [< ] [1] [2] [ >]                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Empty state**:

```
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │              Trash is empty.                            │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
```

---

## 4. 컴포넌트 상세

### 4.1 Bookmark Toggle Button

랜딩 페이지의 Emerging Tech 카드와 상세 모달에 북마크 아이콘을 추가한다.

**배치 위치**:
- **카드**: footer 영역 우측 (Source 뱃지와 날짜 사이 또는 우측 끝)
- **상세 모달**: DialogHeader 내 제목 우측

**아이콘**:
- Unbookmarked: `Bookmark` (Lucide, outline) — `text-gray-400`
- Bookmarked: `Bookmark` (Lucide, filled) — `text-[#3B82F6] fill-[#3B82F6]`

**로그인 상태별 동작**:

| State | Click Behavior |
|-------|----------------|
| Signed Out | 버튼 미표시 (렌더링하지 않음) |
| Signed In + Unbookmarked | `POST /api/v1/bookmark` → 아이콘 filled로 전환 |
| Signed In + Bookmarked | `DELETE /api/v1/bookmark/{bookmarkTsid}` → 아이콘 outline으로 전환 |

**Optimistic UI 규칙**:
1. 클릭 즉시 아이콘 상태 전환 (API 응답 대기 안함)
2. API 호출 진행
3. 성공 시: 상태 유지
4. 실패 시: 아이콘 상태 롤백 + 에러 토스트 표시
5. 409 (이미 북마크됨): 아이콘을 filled 상태로 유지

**북마크 상태 확인**: 랜딩 페이지 로드 시 로그인 사용자의 북마크 목록을 조회하여 각 카드의 북마크 여부를 판별한다. 전체 목록을 한 번 조회(`GET /api/v1/bookmark?size=100`)하여 emergingTechId Set을 구성하고, 카드 렌더링 시 해당 Set에 포함 여부로 아이콘 상태를 결정한다.

**이벤트 전파 방지**: 카드 내 북마크 아이콘 클릭 시 카드 클릭 이벤트(상세 모달 열기)가 발생하지 않도록 `e.stopPropagation()`을 적용한다.

### 4.2 Bookmark List Card

`/bookmarks` 페이지에서 사용하는 북마크 카드 컴포넌트.

**표시 필드**:

| Field | Display |
|-------|---------|
| provider | Badge (기존 PROVIDER_COLORS 활용) |
| title | Bold text, 클릭 시 원본 URL로 이동 (새 탭) |
| summary | Line clamp 2줄, text-gray-600 |
| tags | Badge list (bg-[#F5F5F5] brutal-border) |
| memo | Italic, text-gray-500, line clamp 1줄 |
| createdAt | 우측 상단, formatted date |

**액션 버튼** (카드 하단 우측):
- **History**: `History` 아이콘 (Lucide) — 변경 이력 모달 열기
- **Edit**: `Pencil` 아이콘 (Lucide) — 수정 모달 열기
- **Delete**: `Trash2` 아이콘 (Lucide), `text-[#EF4444]` — 삭제 확인 다이얼로그

### 4.3 Bookmark Edit Modal

북마크의 tags와 memo를 수정하는 모달.

```
┌──────────────────────────────────────┐
│  Edit Bookmark                       │
│  ────────────────────────────────    │
│                                      │
│  Title (readonly)                    │
│  "GPT-5 Release Preview"            │
│                                      │
│  Tags                                │
│  ┌──────────────────────────────┐    │
│  │ [AI x] [ML x]  + Add tag    │    │
│  └──────────────────────────────┘    │
│                                      │
│  Memo                                │
│  ┌──────────────────────────────┐    │
│  │ My notes about this          │    │
│  │ article...                   │    │
│  └──────────────────────────────┘    │
│                                      │
│  [Cancel]           [Save Changes]   │
└──────────────────────────────────────┘
```

**Tags 입력**:
- 기존 태그를 Badge로 표시, 각 Badge에 x 제거 버튼
- 텍스트 입력 필드 + Enter 또는 `,`로 새 태그 추가
- 빈 문자열, 중복 태그 방지

**Memo 입력**:
- `<textarea>` — 여러 줄 입력 가능
- 자유 텍스트, 특별한 유효성 검증 없음

**동작**:
1. 수정 모달 열기 -> `GET /api/v1/bookmark/{id}`로 현재 데이터 로드
2. 사용자 수정 후 "Save Changes" 클릭
3. `PUT /api/v1/bookmark/{id}` 호출
4. 성공 시: 모달 닫기 + 목록 갱신 + 성공 토스트
5. 실패 시: 에러 토스트

### 4.4 Bookmark Search Bar

`/bookmarks` 페이지 상단에 배치하는 검색 UI.

**구성 요소**:
- 검색어 입력 필드: `placeholder="Search bookmarks..."`
- 검색 필드 선택 드롭다운: `All` (기본), `Title`, `Memo`, `Tags`
- 검색 클리어 버튼: x 아이콘

**디바운스 규칙**:
- 사용자 입력 후 300ms 대기 후 API 호출
- 300ms 내 추가 입력 시 타이머 리셋
- 검색어가 빈 문자열이면 검색 모드 해제 -> 기본 목록으로 복원

**검색 활성화 시**:
- Provider 필터와 Sort가 비활성화(disabled) 됨
- 검색 결과 인디케이터 표시: `Results for "{query}" -- {totalSize} items`
- 검색 결과도 페이지네이션 적용

### 4.5 Delete Confirmation Dialog

Radix AlertDialog 사용. 기존 `delete-account-dialog.tsx` 패턴을 따른다.

```
┌──────────────────────────────────────┐
│  Delete Bookmark                     │
│  ────────────────────────────────    │
│                                      │
│  Are you sure you want to delete     │
│  this bookmark?                      │
│                                      │
│  You can restore it from Trash       │
│  within 30 days.                     │
│                                      │
│  [Cancel]         [Delete]           │
│                   (destructive)      │
└──────────────────────────────────────┘
```

- "Delete" 버튼: `bg-[#EF4444] text-white brutal-border`
- 성공 시: 목록에서 해당 카드 제거 + 성공 토스트 ("Bookmark deleted. You can restore it from Trash.")
- 실패 시: 에러 토스트

### 4.6 History View Modal

북마크의 변경 이력을 표시하는 모달.

```
┌──────────────────────────────────────────────┐
│  Change History                              │
│  ──────────────────────────────────────────  │
│                                              │
│  Filter: [All v] [Start Date] [End Date]     │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ UPDATE  2025-01-20 15:00                 ││
│  │ Before: tags: [AI]                       ││
│  │ After:  tags: [AI, Machine Learning]     ││
│  │                        [Restore Version] ││
│  ├──────────────────────────────────────────┤│
│  │ CREATE  2025-01-20 14:30                 ││
│  │ After:  tags: [AI], memo: "memo text"    ││
│  └──────────────────────────────────────────┘│
│                                              │
│  [< ] [1] [ >]                               │
│                                              │
│  ---- View at Specific Time ----             │
│  Timestamp: [____-__-__T__:__:__]  [View]    │
│                                              │
│  [Close]                                     │
└──────────────────────────────────────────────┘
```

**이력 목록**:
- 각 항목: operationType 뱃지 (CREATE=green, UPDATE=blue, DELETE=red) + changedAt + beforeData/afterData diff 표시
- beforeData/afterData는 JSON의 tags와 memo 필드를 시각적으로 비교 표시
- "Restore Version" 버튼: 해당 히스토리 버전으로 복구

**필터**:
- operationType 드롭다운: All, CREATE, UPDATE, DELETE
- 날짜 범위: startDate, endDate (캘린더 Popover 활용)

**특정 시점 조회**:
- ISO 8601 형식 timestamp 입력 필드
- "View" 클릭 -> `GET /api/v1/bookmark/history/{entityId}/at?timestamp={ts}`
- 결과를 모달 내 별도 패널에 표시

**버전 복구 확인 다이얼로그**:

```
┌──────────────────────────────────────┐
│  Restore Version                     │
│  ────────────────────────────────    │
│                                      │
│  Restore this bookmark to the        │
│  version from 2025-01-20 15:00?      │
│                                      │
│  Current data will be overwritten.   │
│                                      │
│  [Cancel]       [Restore]            │
└──────────────────────────────────────┘
```

- 복구 성공 시: 히스토리 모달 닫기 + 북마크 상세 데이터 갱신 + 성공 토스트
- 복구 실패 시: 에러 토스트

### 4.7 Pagination

기존 `components/emerging-tech/pagination.tsx` 패턴을 재사용한다.

**차이점**: Bookmark API의 페이징 필드 사용

| Prop | Source |
|------|--------|
| pageNumber | `PageData.pageNumber` |
| pageSize | `PageData.pageSize` |
| totalCount | `PageData.totalSize` |

동작 규칙은 기존과 동일: 최대 7개 페이지 버튼 + 생략 부호, 이전/다음 버튼.

### 4.8 Empty States

| Context | Message | Action |
|---------|---------|--------|
| No bookmarks | "No bookmarks yet. Start bookmarking articles from the main page!" | [Browse Articles] -> `/` |
| Search no results | "No bookmarks found for \"{query}\"." | — |
| Trash empty | "Trash is empty." | — |
| History empty | "No change history." | — |

### 4.9 Header Navigation Extension

기존 `AuthHeader` 또는 Header에 "Bookmarks" 링크를 추가한다.

**Signed Out**: "Bookmarks" 링크 미표시
**Signed In**: "Bookmarks" 링크 표시 -> `/bookmarks` 이동

배치: 검색바와 Auth 버튼 영역 사이

```
┌──────────────────────────────────────────────────────────────┐
│  Tech N AI    [Search...]    [Bookmarks]    {user} [Logout]  │
└──────────────────────────────────────────────────────────────┘
```

스타일: `text-sm font-bold hover:text-[#3B82F6] transition-colors`
활성 상태 (현재 `/bookmarks` 경로): `text-[#3B82F6]`

### 4.10 Toast Notifications

사용자 액션 피드백을 위한 토스트 메시지. 화면 우하단에 표시, 3초 후 자동 사라짐.

| Action | Success Message | Error Message |
|--------|----------------|---------------|
| Bookmark saved | "Bookmarked!" | "Failed to bookmark. Please try again." |
| Bookmark removed | "Bookmark removed." | "Failed to remove bookmark." |
| Bookmark updated | "Bookmark updated." | "Failed to update bookmark." |
| Bookmark deleted | "Bookmark deleted. You can restore it from Trash." | "Failed to delete bookmark." |
| Bookmark restored | "Bookmark restored." | "Failed to restore bookmark." |
| Version restored | "Restored to selected version." | "Failed to restore version." |

**토스트 구현**: 간단한 상태 기반 토스트 컴포넌트 구현. 별도 라이브러리 추가 없이 구현한다.

스타일:
- Success: `bg-[#DBEAFE] brutal-border text-black`
- Error: `bg-red-50 border-2 border-[#EF4444] text-[#EF4444]`

---

## 5. 디자인 가이드

### 5.1 일관성 원칙

모든 북마크 관련 UI는 기존 랜딩 페이지 및 인증 페이지의 Neo-Brutalism 디자인 시스템을 그대로 따른다.

### 5.2 북마크 페이지 레이아웃

- **배경**: `bg-[#F5F5F5]` (랜딩 페이지와 동일)
- **컨텐츠 영역**: `max-w-7xl mx-auto px-6 py-6`
- **페이지 타이틀**: `text-xl md:text-2xl font-bold tracking-tight` + 우측 구분선 (랜딩 페이지 "Emerging Tech" 섹션 헤딩과 동일 패턴)

### 5.3 컴포넌트별 스타일

| Component | Style |
|-----------|-------|
| Bookmark Card | `bg-white brutal-border brutal-shadow p-5` (기존 EmergingTech 카드와 동일) |
| Bookmark Icon (active) | `text-[#3B82F6] fill-[#3B82F6]` — Lucide `Bookmark` filled |
| Bookmark Icon (inactive) | `text-gray-400 hover:text-[#3B82F6]` — Lucide `Bookmark` outline |
| Tag Badge | `brutal-border bg-[#F5F5F5] px-2 py-0.5 text-xs font-semibold` |
| Memo Text | `text-sm text-gray-500 italic` |
| Action Button (icon) | `p-1.5 hover:bg-[#F5F5F5] transition-colors` |
| Action Button (delete) | `p-1.5 text-[#EF4444] hover:bg-red-50` |
| Edit Modal | `brutal-border-3 brutal-shadow-lg max-w-lg bg-white p-0` (기존 DetailModal과 동일 패턴) |
| History Modal | `brutal-border-3 brutal-shadow-lg max-w-2xl bg-white p-0` |
| Search Input | `brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none` |
| Field Dropdown | `brutal-border bg-white px-3 py-3 text-sm font-bold` |
| Sort/Filter Tabs | 기존 FilterBar 탭 스타일 재사용 |
| Delete Dialog | `brutal-border-3 brutal-shadow-lg bg-white p-6` |
| Restore Dialog | `brutal-border-3 brutal-shadow-lg bg-white p-6` |
| History Item | `border-b-2 border-black py-4` |
| Operation Badge (CREATE) | `bg-green-100 text-green-800 brutal-border px-2 py-0.5 text-xs font-bold` |
| Operation Badge (UPDATE) | `bg-[#DBEAFE] text-blue-800 brutal-border px-2 py-0.5 text-xs font-bold` |
| Operation Badge (DELETE) | `bg-red-100 text-red-800 brutal-border px-2 py-0.5 text-xs font-bold` |
| Empty State | `text-center py-16 text-gray-500` |
| Toast (success) | `bg-[#DBEAFE] brutal-border brutal-shadow-sm px-4 py-3 text-sm font-bold` |
| Toast (error) | `bg-red-50 border-2 border-[#EF4444] px-4 py-3 text-sm font-bold text-[#EF4444]` |
| Trash Button | `brutal-border brutal-shadow-sm brutal-hover bg-white px-4 py-2 text-sm font-bold` |
| Restore Button | `brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] px-4 py-2 text-sm font-bold text-white` |

### 5.4 색상 팔레트

기존 랜딩/인증 페이지와 동일:

| Usage | Color | Code |
|-------|-------|------|
| Primary / Bookmark Active | Blue | #3B82F6 |
| Accent / Success BG / Toast BG | Light Blue | #DBEAFE |
| Text / Border | Black | #000000 |
| Background | White | #FFFFFF |
| Page Background | Gray | #F5F5F5 |
| Muted Text | Gray | #525252 |
| Destructive | Red | #EF4444 |

### 5.5 폰트

- 본문/UI: Space Grotesk (`font-sans`)
- 코드/타임스탬프: DM Mono (`font-mono`)

---

## 6. 기술 구현 사항

### 6.1 추가 디렉토리/파일 구조

```
src/
├── app/
│   ├── page.tsx                        # (수정) 북마크 상태 로드 + 카드에 토글 전달
│   ├── bookmarks/
│   │   ├── page.tsx                    # 북마크 목록 페이지
│   │   └── deleted/
│   │       └── page.tsx                # 삭제된 북마크 (휴지통) 페이지
├── components/
│   ├── ui/                             # (기존) 공통 UI
│   ├── emerging-tech/
│   │   ├── card.tsx                    # (수정) 북마크 아이콘 추가
│   │   └── detail-modal.tsx            # (수정) 북마크 아이콘 추가
│   ├── auth/
│   │   └── auth-header.tsx             # (수정) Bookmarks 링크 추가
│   └── bookmark/
│       ├── bookmark-toggle.tsx         # 북마크 토글 아이콘 버튼
│       ├── bookmark-card.tsx           # 북마크 목록 카드
│       ├── bookmark-search-bar.tsx     # 검색바 + 필드 선택
│       ├── bookmark-edit-modal.tsx     # 태그/메모 수정 모달
│       ├── bookmark-delete-dialog.tsx  # 삭제 확인 다이얼로그
│       ├── bookmark-history-modal.tsx  # 변경 이력 모달
│       ├── bookmark-restore-dialog.tsx # 버전 복구 확인 다이얼로그
│       └── toast.tsx                   # 토스트 알림 컴포넌트
├── contexts/
│   ├── auth-context.tsx                # (기존)
│   └── toast-context.tsx               # 토스트 상태 Context
├── lib/
│   ├── api.ts                          # (기존)
│   ├── auth-api.ts                     # (기존)
│   ├── auth-fetch.ts                   # (기존) -- 재사용
│   ├── bookmark-api.ts                 # Bookmark API 클라이언트
│   ├── constants.ts                    # (기존)
│   └── utils.ts                        # (기존)
└── types/
    ├── emerging-tech.ts                # (기존)
    ├── auth.ts                         # (기존)
    └── bookmark.ts                     # Bookmark 타입 정의
```

### 6.2 TypeScript 타입 정의

```typescript
// types/bookmark.ts

export interface BookmarkDetailResponse {
  bookmarkTsid: string;
  userId: string;
  emergingTechId: string;
  title: string | null;
  url: string | null;
  provider: string | null;
  summary: string | null;
  publishedAt: string | null;
  tags: string[] | null;
  memo: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface BookmarkCreateRequest {
  emergingTechId: string;
  tags?: string[];
  memo?: string;
}

export interface BookmarkUpdateRequest {
  tags?: string[];
  memo?: string;
}

export interface PageData<T> {
  pageSize: number;
  pageNumber: number;
  totalPageNumber: number;
  totalSize: number;
  list: T[];
}

export interface BookmarkListResponse {
  data: PageData<BookmarkDetailResponse>;
}

export interface BookmarkHistoryDetailResponse {
  historyId: string;
  entityId: string;
  operationType: "CREATE" | "UPDATE" | "DELETE";
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  changedBy: string;
  changedAt: string;
  changeReason: string | null;
}

export interface BookmarkHistoryListResponse {
  data: PageData<BookmarkHistoryDetailResponse>;
}

export interface BookmarkListParams {
  page?: number;
  size?: number;
  sort?: string;
  provider?: string;
}

export interface BookmarkSearchParams {
  q: string;
  page?: number;
  size?: number;
  searchField?: "all" | "title" | "memo" | "tags";
}

export interface BookmarkHistoryParams {
  page?: number;
  size?: number;
  operationType?: "CREATE" | "UPDATE" | "DELETE";
  startDate?: string;
  endDate?: string;
}

export interface BookmarkDeletedParams {
  page?: number;
  size?: number;
  days?: number;
}
```

### 6.3 Bookmark API 클라이언트

`authFetch` + `parseResponse`/`parseVoidResponse` 패턴을 재사용한다. 기존 `lib/auth-api.ts`와 동일한 구조.

```typescript
// lib/bookmark-api.ts

import { authFetch, parseResponse, parseVoidResponse } from "@/lib/auth-fetch";
import type {
  BookmarkDetailResponse,
  BookmarkListResponse,
  BookmarkCreateRequest,
  BookmarkUpdateRequest,
  BookmarkListParams,
  BookmarkSearchParams,
  BookmarkHistoryListResponse,
  BookmarkHistoryDetailResponse,
  BookmarkHistoryParams,
  BookmarkDeletedParams,
} from "@/types/bookmark";

const BASE = "/api/v1/bookmark";

// 쿼리 파라미터 헬퍼 (기존 lib/api.ts의 toQuery 패턴)
function toQuery(params: object): string { ... }

export async function createBookmark(req: BookmarkCreateRequest): Promise<BookmarkDetailResponse>
export async function fetchBookmarks(params?: BookmarkListParams): Promise<BookmarkListResponse>
export async function fetchBookmarkDetail(id: string): Promise<BookmarkDetailResponse>
export async function updateBookmark(id: string, req: BookmarkUpdateRequest): Promise<BookmarkDetailResponse>
export async function deleteBookmark(id: string): Promise<void>
export async function fetchDeletedBookmarks(params?: BookmarkDeletedParams): Promise<BookmarkListResponse>
export async function restoreBookmark(id: string): Promise<BookmarkDetailResponse>
export async function searchBookmarks(params: BookmarkSearchParams): Promise<BookmarkListResponse>
export async function fetchBookmarkHistory(entityId: string, params?: BookmarkHistoryParams): Promise<BookmarkHistoryListResponse>
export async function fetchBookmarkAtTime(entityId: string, timestamp: string): Promise<BookmarkHistoryDetailResponse>
export async function restoreBookmarkVersion(entityId: string, historyId: string): Promise<BookmarkDetailResponse>
```

### 6.4 에러 메시지 확장

기존 `lib/auth-fetch.ts`의 `ERROR_MESSAGES` 맵에 Bookmark 관련 에러 코드를 추가한다:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  // 기존 Auth 에러 코드...
  BOOKMARK_NOT_FOUND: "Bookmark not found.",
  BOOKMARK_ALREADY_EXISTS: "This content is already bookmarked.",
  INVALID_BOOKMARK_ID: "Invalid bookmark ID format.",
  CONTENT_NOT_FOUND: "Content not found.",
  HISTORY_NOT_FOUND: "History not found.",
};
```

### 6.5 인증 가드

`/bookmarks`, `/bookmarks/deleted` 페이지는 인증된 사용자만 접근 가능하다.

**구현 방식**: 각 페이지 컴포넌트에서 `useAuth()`로 인증 상태 확인.

```typescript
// 패턴: app/bookmarks/page.tsx
"use client";

const { user, isLoading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!isLoading && !user) {
    router.replace("/signin");
  }
}, [user, isLoading, router]);

if (isLoading || !user) {
  return <loading spinner />;
}
```

### 6.6 상태 관리

- **인증 상태**: 기존 `AuthContext` 재사용
- **북마크 목록/검색/페이지네이션**: 각 페이지 컴포넌트의 로컬 state (기존 랜딩 페이지 `page.tsx` 패턴과 동일)
- **북마크 여부 (랜딩 페이지)**: 랜딩 페이지 컴포넌트의 로컬 state -- `Set<string>` (emergingTechId 기반)
- **토스트**: `ToastContext` (전역 상태)

### 6.7 Cache Invalidation 규칙

| Action | Invalidation |
|--------|-------------|
| 북마크 저장 | 랜딩 페이지 북마크 Set에 emergingTechId 추가 |
| 북마크 삭제 (랜딩 페이지 토글) | 랜딩 페이지 북마크 Set에서 emergingTechId 제거 |
| 북마크 수정 | `/bookmarks` 목록 재조회 |
| 북마크 삭제 (`/bookmarks`) | `/bookmarks` 목록 재조회 |
| 북마크 복구 | `/bookmarks/deleted` 목록 재조회 |
| 버전 복구 | 해당 북마크 상세 재조회 |

### 6.8 보안 고려사항

- **XSS 방지**: 사용자 입력(tags, memo, 검색어)은 React의 기본 이스케이핑에 의해 보호됨. 직접 HTML을 삽입하는 방식을 사용하지 않는다.
- **CSRF**: 모든 API 요청은 JWT Bearer 토큰으로 인증하므로 Cookie 기반 CSRF 공격에 해당하지 않음.
- **인증 토큰 보호**: `authFetch`에서 토큰을 자동 관리. 토큰을 URL query parameter에 노출하지 않음.
- **권한 검증**: 서버에서 403 응답 시 적절한 에러 메시지 표시. 클라이언트에서 다른 사용자의 북마크에 접근할 수 없음.
- **외부 URL**: 북마크 카드의 원본 URL 링크에 `rel="noopener noreferrer"` 적용 (기존 DetailModal 패턴과 동일).
- **입력 길이 제한**: 태그 문자열, 메모 등 사용자 입력의 최대 길이는 서버 검증에 의존. 클라이언트에서 과도한 입력 방지를 위해 textarea에 `maxLength` 지정 가능.

### 6.9 라우팅 정리

| Route | Auth Required | Description |
|-------|--------------|-------------|
| `/` | X | Landing page (bookmark toggle: logged-in only) |
| `/bookmarks` | O | Bookmark list -- redirect to `/signin` if not authenticated |
| `/bookmarks/deleted` | O | Deleted bookmarks (trash) -- redirect to `/signin` if not authenticated |

---

## 7. 범위 제한

### 포함

- Header에 "Bookmarks" 네비게이션 링크 추가 (로그인 사용자만)
- Emerging Tech 카드/모달에 북마크 토글 아이콘 추가
- Optimistic UI 북마크 토글
- 북마크 목록 페이지 (`/bookmarks`) -- 카드 목록, 페이지네이션, 정렬, Provider 필터
- 북마크 검색 -- 검색어 + 검색 필드 선택, 디바운스
- 북마크 상세 조회 (목록 카드에서 인라인 표시)
- 북마크 수정 모달 (tags, memo)
- 북마크 삭제 + 확인 다이얼로그
- 삭제된 북마크 (휴지통) 페이지 (`/bookmarks/deleted`)
- 북마크 복구
- 변경 이력 조회 모달 -- 이력 목록, operationType 필터, 날짜 범위 필터
- 특정 시점 데이터 조회
- 특정 버전 복구 + 확인 다이얼로그
- 토스트 알림 (성공/에러)
- Empty State UI
- 인증 가드 (비로그인 시 `/signin` 리다이렉트)
- Bookmark API 11개 엔드포인트 연동
- 에러 코드별 영문 메시지 매핑
- Neo-Brutalism 디자인 일관성

### 미포함

- 북마크 폴더/카테고리 분류 (API 미제공)
- 북마크 내보내기/가져오기 (API 미제공)
- 북마크 공유 (API 미제공)
- 실시간 동기화 (WebSocket 미사용)
- 드래그 앤 드롭 정렬
- 다크 모드
- 다국어 시스템 (i18n)
- 전역 상태 관리 라이브러리 (React Context + 로컬 state로 충분)
- 서버 사이드 렌더링 (클라이언트 사이드 인증만)
- 태그 자동완성/추천 (API 미제공)
- 북마크 일괄 삭제/복구 (API 미제공)
- Rate limiting / 요청 빈도 제한 (서버에서 처리)

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-02-12
