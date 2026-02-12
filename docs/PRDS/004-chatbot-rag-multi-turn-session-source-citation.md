# PRD: Chatbot - RAG Multi-turn Chat, Session Management, Source Citation

**작성일**: 2026-02-12
**버전**: v1
**기반 프롬프트**: `docs/prompts/004-chatbot-prd-generation-prompt.md`
**API 스펙 문서**: `docs/API-specifications/api-chatbot-specification.md`

---

## 1. 개요

로그인한 사용자가 Emerging Tech 도큐먼트를 벡터 DB 기반 RAG 소스로 활용하는 AI 챗봇과 멀티턴 대화를 수행하는 기능을 프론트엔드에 구현한다. 채팅 메시지 전송/응답, RAG 소스 인용 표시, 대화 세션 목록 관리(사이드바), 대화 내역 로드, 새 대화 시작, 세션 삭제를 포함한다.

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
| 인증 방식 | Bearer Token (JWT) — 모든 Chatbot API는 인증 필요 |
| UI 언어 | English (모든 화면 텍스트 영문) |
| 데이터 소스 | 벡터 DB 기반 RAG — Emerging Tech 도큐먼트 컬렉션 |

---

## 2. API 연동

모든 요청은 Gateway(8081)로 전송한다. Next.js rewrites가 `/api/*` → `http://localhost:8081/api/*`로 프록시한다. 모든 Chatbot API는 `Authorization: Bearer {accessToken}` 헤더가 필요하므로 기존 `authFetch`를 사용한다.

### 2.1 공통 응답 형식

```typescript
// 기존 types/emerging-tech.ts에 정의된 ApiResponse<T> 재사용
interface ApiResponse<T> {
  code: string;           // "2000" (성공), "4000", "4010" 등
  messageCode: {
    code: string;         // "SUCCESS" 등
    text: string;
  };
  message?: string;
  data?: T;
}
```

**Spring Data Page\<T\>** — Chatbot API 전용 페이징 구조:

```typescript
interface SpringDataPage<T> {
  content: T[];               // 데이터 목록
  pageable: {
    pageNumber: number;       // 현재 페이지 번호 (0부터 시작)
    pageSize: number;         // 페이지 크기
    sort?: {
      sorted: boolean;
      direction: string;
      property: string;
    };
  };
  totalElements: number;      // 전체 데이터 수
  totalPages: number;         // 전체 페이지 수
  size: number;               // 페이지 크기
  number: number;             // 현재 페이지 번호 (0부터 시작)
  first: boolean;             // 첫 페이지 여부
  last: boolean;              // 마지막 페이지 여부
  empty: boolean;             // 빈 페이지 여부
}
```

> **주의**: Chatbot API의 페이징은 Spring Data Page 형식(`content`, `totalElements`, `totalPages`, `number`, `size`)을 사용한다. 기존 Bookmark의 PageData\<T\> 필드(`list`, `totalSize`, `totalPageNumber`, `pageNumber`, `pageSize`)와 다르다. 혼용하지 않는다. 특히 `number` 필드는 0부터 시작하지만 API 요청의 `page` 파라미터는 1부터 시작한다.

### 2.2 엔드포인트 목록

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | `/api/v1/chatbot` | 채팅 메시지 전송 |
| 2 | GET | `/api/v1/chatbot/sessions` | 세션 목록 조회 |
| 3 | GET | `/api/v1/chatbot/sessions/{sessionId}` | 세션 상세 조회 |
| 4 | GET | `/api/v1/chatbot/sessions/{sessionId}/messages` | 세션 메시지 목록 조회 |
| 5 | DELETE | `/api/v1/chatbot/sessions/{sessionId}` | 세션 삭제 |

### 2.3 요청/응답 상세

#### Send Chat Message (POST `/api/v1/chatbot`)

**Request Body (ChatRequest)**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| message | String | O | NotBlank, Max(500) | 사용자 메시지 (최대 500자) |
| conversationId | String | X | — | 대화 세션 ID (없으면 새 세션 생성) |

**Response**: `ApiResponse<ChatResponse>`

```json
{
  "code": "2000",
  "messageCode": { "code": "SUCCESS", "text": "성공" },
  "message": "success",
  "data": {
    "response": "최신 AI 기술 트렌드를 알려드리겠습니다...",
    "conversationId": "sess_abc123def456",
    "sources": [
      {
        "documentId": "doc_789xyz",
        "collectionType": "EMERGING_TECH",
        "score": 0.95,
        "title": "2025 AI 트렌드 리포트",
        "url": "https://example.com/ai-trends-2025"
      }
    ]
  }
}
```

**ChatResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| response | String | O | AI 응답 메시지 |
| conversationId | String | O | 대화 세션 ID |
| sources | SourceResponse[] | X | 참조한 소스 목록 (RAG) |

**SourceResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documentId | String | X | 문서 ID |
| collectionType | String | X | 컬렉션 타입 (EMERGING_TECH, NEWS 등) |
| score | Double | X | 관련도 점수 (0~1) |
| title | String | X | 소스 제목 |
| url | String | X | 소스 URL |

**Errors**: `400` (빈 메시지, 길이 초과, 토큰 한도 초과), `401` (인증 실패)

#### List Sessions (GET `/api/v1/chatbot/sessions`)

**Query Parameters**

| Param | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| page | Integer | X | 1 | Min(1) | 페이지 번호 (1부터 시작) |
| size | Integer | X | 20 | Min(1), Max(100) | 페이지 크기 |

**Response**: `ApiResponse<SpringDataPage<SessionResponse>>`

**SessionResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | String | O | 세션 ID |
| title | String | X | 세션 제목 (첫 메시지 기반 자동 생성) |
| createdAt | String (ISO 8601) | O | 세션 생성일시 |
| lastMessageAt | String (ISO 8601) | X | 마지막 메시지 일시 |
| isActive | Boolean | O | 세션 활성화 여부 |

정렬: `lastMessageAt` 기준 내림차순 (최신 대화 우선)

**Errors**: `401` (인증 실패)

#### Get Session Detail (GET `/api/v1/chatbot/sessions/{sessionId}`)

**Path Parameters**: `sessionId` — 세션 ID

**Response**: `ApiResponse<SessionResponse>`

**Errors**: `401` (인증 실패), `403` (권한 없음), `404` (세션 없음)

#### List Session Messages (GET `/api/v1/chatbot/sessions/{sessionId}/messages`)

**Path Parameters**: `sessionId` — 세션 ID

**Query Parameters**

| Param | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| page | Integer | X | 1 | Min(1) | 페이지 번호 (1부터 시작) |
| size | Integer | X | 50 | Min(1), Max(100) | 페이지 크기 |

**Response**: `ApiResponse<SpringDataPage<MessageResponse>>`

**MessageResponse**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messageId | String | O | 메시지 ID |
| sessionId | String | O | 세션 ID |
| role | String | O | 메시지 역할 (`USER`, `ASSISTANT`) |
| content | String | O | 메시지 내용 |
| tokenCount | Integer | X | 토큰 수 |
| sequenceNumber | Integer | O | 메시지 순서 번호 |
| createdAt | String (ISO 8601) | O | 메시지 생성일시 |

정렬: `sequenceNumber` 기준 오름차순

**Errors**: `401` (인증 실패), `403` (권한 없음), `404` (세션 없음)

#### Delete Session (DELETE `/api/v1/chatbot/sessions/{sessionId}`)

**Path Parameters**: `sessionId` — 세션 ID

**Response**: `ApiResponse<Void>`

**Errors**: `401` (인증 실패), `403` (권한 없음), `404` (세션 없음)

### 2.4 에러 코드 매핑

API `messageCode.code` → 프론트엔드 영문 메시지:

| messageCode.code | English Message |
|------------------|-----------------|
| MESSAGE_EMPTY | Message is required. |
| MESSAGE_TOO_LONG | Message cannot exceed 500 characters. |
| SESSION_NOT_FOUND | Session not found. |
| TOKEN_LIMIT_EXCEEDED | Token limit exceeded. Please start a new conversation. |
| SESSION_FORBIDDEN | You don't have permission to access this session. |

기존 `lib/auth-fetch.ts`의 HTTP fallback 메시지를 그대로 사용한다:

| HTTP Status | English Message |
|-------------|-----------------|
| 400 | Invalid request. Please check your input. |
| 401 | Authentication failed. Please sign in again. |
| 403 | You don't have permission to perform this action. |
| 404 | Resource not found. |
| 500 | Something went wrong. Please try again later. |

---

## 3. 페이지 구조

### 3.1 페이지 목록

| Route | Type | Description |
|-------|------|-------------|
| `/chat` | New | 챗봇 메인 페이지 (사이드바 + 대화 영역) |
| `/` | Modified | Header에 "Chat" 네비게이션 링크 추가 (로그인 사용자만) |

### 3.2 Chat Page — New (`/chat`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Header (with Chat active)                                       │
├────────────────┬─────────────────────────────────────────────────┤
│  Sidebar       │  Chat Area                                      │
│                │                                                  │
│  [+ New Chat]  │  ┌──────────────────────────────────────────┐   │
│  ────────────  │  │                                          │   │
│                │  │  (Empty State or Messages)               │   │
│  ┌───────────┐ │  │                                          │   │
│  │ AI Trends │ │  │         Welcome to Tech Chat!            │   │
│  │ 2 min ago │ │  │                                          │   │
│  │       [x] │ │  │  Ask me anything about emerging          │   │
│  ├───────────┤ │  │  technologies. I'll reference the        │   │
│  │ GPT-5 ... │ │  │  latest documents to help you.           │   │
│  │ 1 hr ago  │ │  │                                          │   │
│  │       [x] │ │  │  Try asking:                             │   │
│  ├───────────┤ │  │  • "What are the latest AI trends?"      │   │
│  │ Claude 4  │ │  │  • "Tell me about new model releases"    │   │
│  │ Yesterday │ │  │  • "Compare GPT and Claude updates"      │   │
│  │       [x] │ │  │                                          │   │
│  └───────────┘ │  └──────────────────────────────────────────┘   │
│                │                                                  │
│  [Load more]   │  ┌──────────────────────────────────────────┐   │
│                │  │  Message input area                       │   │
│                │  │  ┌────────────────────────────┐  [Send]  │   │
│                │  │  │ Ask about emerging tech... │           │   │
│                │  │  └────────────────────────────┘  23/500   │   │
│                │  └──────────────────────────────────────────┘   │
├────────────────┴─────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────────────┘
```

**대화 진행 중 상태**:

```
│  Chat Area                                                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                     What are the latest AI trends?  [U]  │    │
│  │                                      14:25              │    │
│  │                                                          │    │
│  │  [A]  Here are the latest AI trends based on            │    │
│  │       recent documents...                                │    │
│  │       14:25                                              │    │
│  │       ┌─ Sources ──────────────────────────────┐        │    │
│  │       │ [1] 2025 AI 트렌드 리포트    95%       │        │    │
│  │       │ [2] GPT-5 Release Notes      89%       │        │    │
│  │       └────────────────────────────────────────┘        │    │
│  │                                                          │    │
│  │                Tell me more about GPT-5  [U]            │    │
│  │                                      14:26              │    │
│  │                                                          │    │
│  │  [A]  ●●● AI is thinking...                             │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  ┌────────────────────────────────────────────┐  [Send]  │    │
│  │  │ Ask about emerging tech...                 │  (disabled) │
│  │  │                                            │  42/500  │    │
│  │  └────────────────────────────────────────────┘          │    │
│  └──────────────────────────────────────────────────────────┘    │
```

### 3.3 Landing Page — Modified (`/`)

Header에 "Chat" 네비게이션 링크만 추가. 기존 랜딩 페이지 구조는 변경 없음.

```
┌──────────────────────────────────────────────────────────────┐
│  Tech N AI    [Search...]    [Bookmarks] [Chat]  {user} [Logout] │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 컴포넌트 상세

### 4.1 Chat Sidebar

세션 목록을 표시하는 좌측 사이드바.

**구성 요소**:
- "New Chat" 버튼 (상단)
- 세션 목록 (시간순 내림차순)
- 각 세션 항목: title + lastMessageAt (상대 시간) + 삭제 버튼
- "Load more" 버튼 (하단, 다음 페이지 존재 시)

**세션 항목 표시**:

| Field | Display |
|-------|---------|
| title | 세션 제목 (line clamp 1줄). 없으면 "Untitled" 표시 |
| lastMessageAt | 상대 시간 (예: "2 min ago", "1 hr ago", "Yesterday"). `font-mono text-xs text-muted-foreground` |
| 삭제 버튼 | `X` 아이콘 (Lucide), hover 시에만 표시 |

**동작 규칙**:
- 세션 클릭 → 해당 세션의 메시지 목록 로드 (F4)
- 현재 활성 세션은 `bg-accent` 배경으로 하이라이트
- "New Chat" 클릭 → 현재 대화 초기화, conversationId를 null로 설정 (F5)
- 삭제 버튼 클릭 → 삭제 확인 다이얼로그 표시 (F6)
- "Load more" 클릭 → `GET /api/v1/chatbot/sessions?page={nextPage}` 호출, 기존 목록에 추가

**페이지네이션**:
- 초기 로드: `page=1, size=20`
- "Load more" 버튼은 `last === false`일 때만 표시
- 새 페이지 로드 시 기존 세션 목록에 append

**세션 목록 갱신 시점**:
- 페이지 최초 로드 시
- 새 대화에서 첫 메시지 전송 후 (새 세션 생성됨) → 세션 목록 최상단에 추가
- 세션 삭제 후 → 해당 세션 제거

### 4.2 Message Area

대화 메시지를 표시하는 메인 영역.

**메시지 버블**:

| Role | Alignment | Style |
|------|-----------|-------|
| USER | 우측 정렬 | `bg-primary text-primary-foreground brutal-border p-3 max-w-[80%] ml-auto` |
| ASSISTANT | 좌측 정렬 | `bg-secondary text-secondary-foreground brutal-border p-3 max-w-[80%]` |

**타이핑 인디케이터**:
- AI 응답 대기 중 ASSISTANT 위치에 표시
- 애니메이팅 세 점(●●●) + "AI is thinking..." 텍스트
- `bg-secondary brutal-border p-3` 스타일 (ASSISTANT 버블과 동일)

**메시지 타임스탬프**:
- 각 메시지 버블 하단에 `text-xs text-muted-foreground font-mono` 스타일
- 당일: 시간만 표시 (예: "14:25")
- 이전 날짜: 날짜+시간 (예: "Jan 20, 14:25")

**자동 스크롤 규칙**:
1. 사용자가 메시지를 전송하면 → 즉시 최하단 스크롤
2. AI 응답 수신 시 → 사용자가 최하단 근처(100px 이내)에 있으면 자동 스크롤
3. 사용자가 이전 메시지를 읽고 있으면 (최하단에서 100px 이상 스크롤 업) → 자동 스크롤하지 않음
4. "Scroll to bottom" 버튼 표시: 사용자가 위로 스크롤했을 때 화면 우하단에 표시

**이전 메시지 로드 (Infinite Scroll Up)**:
- 스크롤이 최상단에 도달하면 이전 페이지 메시지 로드
- `GET /api/v1/chatbot/sessions/{sessionId}/messages?page={prevPage}`
- 로딩 중 상단에 스피너 표시
- 새로 로드된 메시지는 기존 목록 상단에 prepend
- 스크롤 위치 유지: 로드 전 사용자가 보고 있던 메시지 위치를 유지
- `first === true`이면 더 이상 로드하지 않음

**메시지 전송 실패 시**:
- 실패한 USER 메시지에 빨간 경고 아이콘 + "Failed to send" 텍스트 표시
- "Retry" 버튼 클릭 시 동일 메시지 재전송

### 4.3 Source Citation Section

ASSISTANT 메시지에 `sources` 배열이 포함된 경우, 메시지 버블 하단에 참조 소스 섹션을 표시한다.

```
┌─ Sources ────────────────────────────────────┐
│ [1] 2025 AI 트렌드 리포트           95%      │
│ [2] GPT-5 Release Notes             89%      │
│ [3] Claude Model Updates            82%      │
└──────────────────────────────────────────────┘
```

**표시 규칙**:
- `sources`가 null이거나 빈 배열이면 소스 섹션 미표시
- 각 소스 항목: 번호 + title (클릭 가능한 링크) + score (퍼센트)
- title 클릭 → `url`을 새 탭에서 열기 (`target="_blank" rel="noopener noreferrer"`)
- score 표시: `Math.round(score * 100)%` 형태
- collectionType 뱃지: `EMERGING_TECH` = 파란 뱃지, `NEWS` = 초록 뱃지, 기타 = 회색 뱃지

**URL 검증**:
- `url`이 `https://` 또는 `http://`로 시작하는 경우에만 클릭 가능한 링크로 렌더링
- 그 외 (`javascript:` 등) → 링크 없이 텍스트로만 표시

**스타일**:
- 소스 섹션 컨테이너: `mt-2 border-t-2 border-black pt-2`
- "Sources" 라벨: `text-xs font-bold text-muted-foreground mb-1`
- 소스 항목: `text-sm` 내 링크 `text-primary hover:underline font-medium`
- score: `text-xs text-muted-foreground font-mono`

### 4.4 Message Input Area

화면 하단에 고정되는 메시지 입력 영역.

**구성 요소**:
- 텍스트 입력 필드 (`<textarea>`, auto-resize)
- 글자 수 카운터: `{length}/500`
- 전송 버튼: `Send` (Lucide `SendHorizontal` 아이콘)

**키보드 단축키**:
- `Enter` → 메시지 전송
- `Shift+Enter` → 줄바꿈
- 입력이 비어있거나 공백만 있으면 전송하지 않음

**입력 검증 피드백**:
- 500자 초과: 카운터가 빨간색 (`text-destructive`)으로 변경, 전송 버튼 비활성화
- 빈 메시지: 전송 버튼 비활성화
- 전송 중: 입력 필드 비활성화(`disabled`), 전송 버튼 비활성화 + 로딩 스피너 표시

**스타일**:
- 컨테이너: `border-t-2 border-black bg-white p-4`
- textarea: `brutal-border w-full resize-none px-4 py-3 text-base focus:border-primary focus:outline-none min-h-[48px] max-h-[120px]`
- 전송 버튼: `brutal-border brutal-shadow-sm brutal-hover bg-primary text-primary-foreground p-3 disabled:opacity-50 disabled:cursor-not-allowed`
- 글자 수 카운터: `text-xs text-muted-foreground font-mono` (초과 시 `text-destructive`)

### 4.5 Session Delete Confirmation Dialog

Radix AlertDialog 사용. 기존 `delete-account-dialog.tsx` 패턴을 따른다.

```
┌──────────────────────────────────────┐
│  Delete Conversation                 │
│  ────────────────────────────────    │
│                                      │
│  Are you sure you want to delete     │
│  this conversation?                  │
│                                      │
│  This action cannot be undone.       │
│                                      │
│  [Cancel]             [Delete]       │
│                       (destructive)  │
└──────────────────────────────────────┘
```

- "Delete" 버튼: `bg-destructive text-white brutal-border`
- 성공 시: 세션 목록에서 해당 세션 제거. 삭제한 세션이 현재 활성 세션이면 대화 영역 초기화 (Empty State). 성공 토스트.
- 실패 시: 에러 토스트

### 4.6 Empty State

**새 대화 (conversationId가 null)**:

```
┌──────────────────────────────────────────┐
│                                          │
│        Welcome to Tech Chat!             │
│                                          │
│  Ask me anything about emerging          │
│  technologies. I'll reference the        │
│  latest documents to help you.           │
│                                          │
│  Try asking:                             │
│  ┌──────────────────────────────────┐    │
│  │ What are the latest AI trends?   │    │
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │ Tell me about new model releases │    │
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │ Compare GPT and Claude updates   │    │
│  └──────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

- 예시 질문 카드 클릭 → 해당 텍스트를 입력 필드에 채워서 자동 전송
- 예시 질문 카드: `brutal-border brutal-shadow-sm brutal-hover bg-white p-3 text-sm cursor-pointer`

**세션 목록 비어있을 때** (사이드바):
- "No conversations yet." 텍스트 표시
- `text-center py-8 text-sm text-muted-foreground`

### 4.7 Header Navigation Extension

기존 `AuthHeader`에 "Chat" 링크를 추가한다.

**Signed Out**: "Chat" 링크 미표시
**Signed In**: "Chat" 링크 표시 → `/chat` 이동

배치: "Bookmarks" 링크 옆 (Auth 버튼 영역 앞)

```
┌──────────────────────────────────────────────────────────────┐
│  Tech N AI    [Search...]   [Bookmarks] [Chat]  {user} [Logout] │
└──────────────────────────────────────────────────────────────┘
```

스타일: `text-sm font-bold hover:text-[#3B82F6] transition-colors`
활성 상태 (현재 `/chat` 경로): `text-[#3B82F6]`

### 4.8 Toast Notifications

사용자 액션 피드백을 위한 토스트 메시지. 기존 `toast-context.tsx`의 `useToast()` 재사용.

| Action | Success Message | Error Message |
|--------|----------------|---------------|
| Message sent | — (UI에 메시지 표시로 대체) | "Failed to send message. Please try again." |
| Session deleted | "Conversation deleted." | "Failed to delete conversation." |
| Token limit exceeded | — | "Token limit exceeded. Please start a new conversation." |

---

## 5. 디자인 가이드

### 5.1 일관성 원칙

모든 챗봇 관련 UI는 기존 랜딩 페이지, 인증 페이지, 북마크 페이지의 Neo-Brutalism 디자인 시스템을 그대로 따른다. 직각 border-radius, 두꺼운 border, solid shadow, 동일 색상 팔레트, 동일 폰트를 사용한다.

### 5.2 Chat Page 레이아웃

- **전체 높이**: `h-screen` (뷰포트 전체 높이 — 헤더 높이 제외)
- **사이드바**: `w-72 border-r-2 border-black bg-white flex flex-col`
- **대화 영역**: `flex-1 flex flex-col bg-secondary`
- **메시지 스크롤 영역**: `flex-1 overflow-y-auto p-6`
- **입력 영역**: `border-t-2 border-black bg-white p-4` (하단 고정)

### 5.3 컴포넌트별 스타일

| Component | Style |
|-----------|-------|
| Sidebar Container | `w-72 border-r-2 border-black bg-white flex flex-col h-full` |
| New Chat Button | `brutal-border brutal-shadow-sm brutal-hover bg-primary text-primary-foreground px-4 py-2 text-sm font-bold w-full` |
| Session Item | `border-b-2 border-black px-4 py-3 cursor-pointer hover:bg-accent transition-colors group` |
| Session Item (active) | `bg-accent` |
| Session Delete Button | `opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all` |
| User Message Bubble | `bg-primary text-primary-foreground brutal-border p-3 max-w-[80%] ml-auto` |
| Assistant Message Bubble | `bg-secondary text-secondary-foreground brutal-border p-3 max-w-[80%]` |
| Typing Indicator | `bg-secondary brutal-border p-3 max-w-[80%] animate-pulse` |
| Source Section | `mt-2 border-t-2 border-black pt-2` |
| Source Link | `text-sm text-primary hover:underline font-medium` |
| Source Score | `text-xs text-muted-foreground font-mono` |
| Collection Badge (EMERGING_TECH) | `bg-accent text-accent-foreground brutal-border px-2 py-0.5 text-xs font-bold` |
| Collection Badge (NEWS) | `bg-green-100 text-green-800 brutal-border px-2 py-0.5 text-xs font-bold` |
| Message Input (textarea) | `brutal-border w-full resize-none px-4 py-3 text-base focus:border-primary focus:outline-none` |
| Send Button | `brutal-border brutal-shadow-sm brutal-hover bg-primary text-primary-foreground p-3` |
| Send Button (disabled) | `opacity-50 cursor-not-allowed` |
| Char Counter | `text-xs text-muted-foreground font-mono` |
| Char Counter (exceeded) | `text-destructive` |
| Empty State Container | `flex flex-col items-center justify-center h-full text-center px-8` |
| Example Question Card | `brutal-border brutal-shadow-sm brutal-hover bg-white p-3 text-sm cursor-pointer w-full max-w-md` |
| Delete Dialog | `brutal-border-3 brutal-shadow-lg bg-white p-6` |
| Retry Button | `text-xs text-destructive hover:underline` |
| Scroll to Bottom Button | `brutal-border brutal-shadow-sm bg-white p-2 fixed bottom-24 right-8` |
| Loading Spinner (messages) | `border-2 border-primary border-t-transparent rounded-full w-5 h-5 animate-spin` |

### 5.4 색상 팔레트

기존 랜딩/인증/북마크 페이지와 동일:

| Usage | Color | Code |
|-------|-------|------|
| Primary / User Bubble / Send Button | Blue | #3B82F6 |
| Accent / Active Session BG | Light Blue | #DBEAFE |
| Text / Border | Black | #000000 |
| Background / Card | White | #FFFFFF |
| Chat Area Background / Assistant Bubble | Gray | #F5F5F5 |
| Muted Text / Timestamp | Gray | #525252 |
| Destructive / Error | Red | #EF4444 |

### 5.5 폰트

- 본문/UI: Space Grotesk (`font-sans`)
- 타임스탬프/카운터/score: DM Mono (`font-mono`)

---

## 6. 보안 사항

### 6.1 XSS 방지

- AI 응답 및 사용자 메시지 렌더링 시 React의 기본 JSX 이스케이핑에 의존한다.
- 직접 HTML을 삽입하는 방식(innerHTML 직접 조작)을 사용하지 않는다.
- 메시지 내용은 plain text로 렌더링한다. Markdown 렌더링을 적용하지 않는다 (범위 외).

### 6.2 입력 검증 (이중 검증)

**클라이언트 사이드**:
- 빈 메시지 (공백만 있는 경우 포함): 전송 버튼 비활성화
- 메시지 길이 500자 초과: 전송 버튼 비활성화 + 카운터 빨간색
- `message.trim()` 후 검증

**서버 사이드**:
- 서버에서 400 에러 응답 시 `messageCode.code`에 따라 적절한 에러 메시지 표시
- 토큰 한도 초과(TOKEN_LIMIT_EXCEEDED) → 토스트로 새 대화 시작 안내

### 6.3 JWT 토큰 관리

- 기존 `authFetch` 인프라 재사용. 별도 토큰 관리 코드를 작성하지 않음.
- 401 응답 → 자동 토큰 갱신 시도 → 실패 시 `/signin`으로 리다이렉트
- 토큰을 URL query parameter에 노출하지 않음

### 6.4 세션 접근 제어

- 다른 사용자의 세션 접근 시 API에서 403 응답 → `AuthError` throw → 에러 토스트 표시
- 클라이언트에서 세션 목록에 자신의 세션만 표시됨 (서버에서 필터링)

### 6.5 URL 검증

- 소스 `url` 렌더링 시 `javascript:`, `data:`, `vbscript:` 프로토콜 차단
- `https://` 또는 `http://`로 시작하는 URL만 `<a href>` 링크로 렌더링
- 검증 실패 URL → 링크 없이 텍스트로만 표시

```typescript
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
```

### 6.6 전송 중복 방지

- 메시지 전송 중(`isSending` 상태) 전송 버튼 비활성화 (`disabled`)
- 입력 필드도 비활성화하여 전송 중 내용 수정 방지
- Enter 키 이벤트도 `isSending` 상태에서는 무시

---

## 7. 기술 구현 사항

### 7.1 추가 디렉토리/파일 구조

```
src/
├── app/
│   ├── chat/
│   │   └── page.tsx                  # 챗봇 메인 페이지
├── components/
│   ├── auth/
│   │   └── auth-header.tsx           # (수정) "Chat" 링크 추가
│   └── chatbot/
│       ├── chat-sidebar.tsx          # 세션 목록 사이드바
│       ├── chat-message-area.tsx     # 메시지 표시 영역
│       ├── chat-message-bubble.tsx   # 개별 메시지 버블 (USER/ASSISTANT)
│       ├── chat-source-citation.tsx  # 소스 인용 섹션
│       ├── chat-input.tsx            # 메시지 입력 영역
│       ├── chat-typing-indicator.tsx # 타이핑 인디케이터
│       ├── chat-empty-state.tsx      # 빈 대화 상태
│       └── chat-delete-dialog.tsx    # 세션 삭제 확인 다이얼로그
├── lib/
│   ├── auth-fetch.ts                 # (수정) Chatbot 에러 코드 추가
│   └── chatbot-api.ts               # Chatbot API 클라이언트
└── types/
    └── chatbot.ts                    # Chatbot 타입 정의
```

### 7.2 TypeScript 타입 정의

```typescript
// types/chatbot.ts

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  sources?: SourceResponse[];
}

export interface SourceResponse {
  documentId?: string;
  collectionType?: string;
  score?: number;
  title?: string;
  url?: string;
}

export interface SessionResponse {
  sessionId: string;
  title?: string;
  createdAt: string;
  lastMessageAt?: string;
  isActive: boolean;
}

export interface MessageResponse {
  messageId: string;
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  tokenCount?: number;
  sequenceNumber: number;
  createdAt: string;
}

// Spring Data Page 형식
export interface SpringDataPage<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort?: {
      sorted: boolean;
      direction: string;
      property: string;
    };
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface SessionListParams {
  page?: number;
  size?: number;
}

export interface MessageListParams {
  page?: number;
  size?: number;
}
```

### 7.3 Chatbot API 클라이언트

`authFetch` + `parseResponse`/`parseVoidResponse` 패턴을 재사용한다. 기존 `lib/bookmark-api.ts`와 동일한 구조.

```typescript
// lib/chatbot-api.ts

import { authFetch, parseResponse, parseVoidResponse } from "@/lib/auth-fetch";
import type {
  ChatRequest,
  ChatResponse,
  SessionResponse,
  MessageResponse,
  SpringDataPage,
  SessionListParams,
  MessageListParams,
} from "@/types/chatbot";

const BASE = "/api/v1/chatbot";

function toQuery(params: object): string {
  const entries = Object.entries(params as Record<string, unknown>);
  const sp = new URLSearchParams();
  for (const [k, v] of entries) {
    if (v !== undefined && v !== null && v !== "") {
      sp.set(k, String(v));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}

export async function sendMessage(req: ChatRequest): Promise<ChatResponse>
export async function fetchSessions(params?: SessionListParams): Promise<SpringDataPage<SessionResponse>>
export async function fetchSessionDetail(sessionId: string): Promise<SessionResponse>
export async function fetchSessionMessages(sessionId: string, params?: MessageListParams): Promise<SpringDataPage<MessageResponse>>
export async function deleteSession(sessionId: string): Promise<void>
```

### 7.4 에러 메시지 확장

기존 `lib/auth-fetch.ts`의 `ERROR_MESSAGES` 맵에 Chatbot 관련 에러 코드를 추가한다:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  // 기존 Auth, Bookmark 에러 코드...
  MESSAGE_EMPTY: "Message is required.",
  MESSAGE_TOO_LONG: "Message cannot exceed 500 characters.",
  SESSION_NOT_FOUND: "Session not found.",
  TOKEN_LIMIT_EXCEEDED: "Token limit exceeded. Please start a new conversation.",
  SESSION_FORBIDDEN: "You don't have permission to access this session.",
};
```

> **참고**: 실제 서버의 `messageCode.code` 값이 위 키와 다를 수 있다. 서버 에러 응답의 `messageCode.code`를 확인 후 매핑을 조정한다. 매핑되지 않는 코드는 HTTP fallback 메시지가 표시된다.

### 7.5 인증 가드

`/chat` 페이지는 인증된 사용자만 접근 가능하다.

**구현 방식**: 기존 Bookmark 페이지와 동일한 패턴.

```typescript
// app/chat/page.tsx
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

### 7.6 상태 관리

- **인증 상태**: 기존 `AuthContext` 재사용
- **토스트**: 기존 `ToastContext`의 `useToast()` 재사용
- **채팅 상태**: `app/chat/page.tsx` 컴포넌트의 로컬 state

| State | Type | Description |
|-------|------|-------------|
| sessions | `SessionResponse[]` | 세션 목록 (누적, append 방식) |
| sessionsPage | `SpringDataPage<SessionResponse> \| null` | 세션 목록 페이지 메타 |
| activeSessionId | `string \| null` | 현재 활성 세션 ID |
| messages | `MessageResponse[]` | 현재 세션의 메시지 목록 |
| messagesPage | `SpringDataPage<MessageResponse> \| null` | 메시지 목록 페이지 메타 |
| conversationId | `string \| null` | 현재 대화의 conversationId |
| isSending | `boolean` | 메시지 전송 중 여부 |
| isLoadingSessions | `boolean` | 세션 목록 로딩 중 |
| isLoadingMessages | `boolean` | 메시지 로딩 중 |

### 7.7 Cache Invalidation 규칙

| Action | Invalidation |
|--------|-------------|
| 메시지 전송 성공 | 로컬 messages 배열에 USER 메시지 + ASSISTANT 응답 추가. 새 세션이면 세션 목록 재조회 |
| 세션 삭제 | 세션 목록에서 해당 세션 제거. 활성 세션이면 대화 영역 초기화 |
| 세션 선택 | 해당 세션의 메시지 목록 새로 로드 |
| 이전 메시지 로드 | 기존 messages 배열 상단에 prepend |

### 7.8 라우팅 정리

| Route | Auth Required | Description |
|-------|--------------|-------------|
| `/` | X | Landing page (Header에 Chat 링크: logged-in only) |
| `/chat` | O | 챗봇 페이지 — redirect to `/signin` if not authenticated |

---

## 8. 접근성

### 8.1 채팅 영역

- 메시지 영역 컨테이너: `role="log"` + `aria-label="Chat messages"` + `aria-live="polite"`
- `role="log"`는 암묵적으로 `aria-live="polite"` 제공, 새 메시지가 추가되면 스크린 리더에 자동 알림

### 8.2 메시지 버블

- 각 메시지: `aria-label="{role} message: {content 앞 50자}"`
- USER 메시지: `aria-label="You: {message}"`
- ASSISTANT 메시지: `aria-label="AI: {message 앞 50자}"`

### 8.3 입력 영역

- textarea: `aria-label="Message input"` + `aria-describedby="char-count"`
- 전송 버튼: `aria-label="Send message"`
- 글자 수 카운터: `id="char-count"` + `aria-live="polite"`

### 8.4 사이드바

- 사이드바 컨테이너: `role="navigation"` + `aria-label="Conversation list"`
- 세션 항목: `role="button"` + `aria-label="{title}, {lastMessageAt}"`
- 삭제 버튼: `aria-label="Delete conversation"`
- "New Chat" 버튼: `aria-label="Start new conversation"`

### 8.5 키보드 네비게이션

- `Tab`으로 사이드바 세션 목록, 입력 영역, 전송 버튼 순서로 포커스 이동
- `Escape`로 삭제 확인 다이얼로그 닫기
- 세션 항목에서 `Enter`로 세션 선택
- 전송 버튼에서 `Enter`로 메시지 전송

---

## 9. 범위 제한

### 포함

- `/chat` 챗봇 메인 페이지 (사이드바 + 대화 영역)
- Header에 "Chat" 네비게이션 링크 추가 (로그인 사용자만)
- 채팅 메시지 전송 및 AI 응답 표시
- RAG 소스 인용 표시 (sources 배열 → 소스 섹션)
- 대화 세션 목록 사이드바 (페이지네이션)
- 대화 내역 로드 (무한 스크롤 상향)
- 새 대화 시작 (conversationId 초기화)
- 세션 삭제 + 확인 다이얼로그
- 타이핑 인디케이터 ("AI is thinking...")
- 자동 스크롤 (하단 근처일 때만)
- 메시지 전송 실패 시 재시도 옵션
- 입력 검증 (500자 제한, 빈 메시지 방지, 중복 전송 방지)
- Empty State (환영 메시지 + 예시 질문)
- 토스트 알림 (에러)
- 인증 가드 (비로그인 시 `/signin` 리다이렉트)
- Chatbot API 5개 엔드포인트 연동
- 에러 코드별 영문 메시지 매핑
- Neo-Brutalism 디자인 일관성
- 접근성 (ARIA role="log", aria-label, keyboard navigation)
- XSS 방지, URL 검증, 전송 중복 방지

### 미포함

- 스트리밍 응답 (SSE, WebSocket) — API가 동기식(비스트리밍) 방식
- Markdown 렌더링 — 메시지는 plain text로 표시
- 음성 입력 / 음성 출력 (TTS/STT)
- 파일 업로드 / 이미지 전송
- 메시지 수정 / 삭제 (API 미제공)
- 대화 내보내기 / 공유 (API 미제공)
- 세션 이름 수정 (API 미제공)
- 챗봇 설정 커스터마이징 (API 미제공)
- 다크 모드
- 다국어 시스템 (i18n)
- 모바일 반응형 사이드바 토글 (기본 데스크톱 레이아웃만)
- Rate limiting / 요청 빈도 제한 (서버에서 처리)
- 메시지 복사 기능
- 전역 상태 관리 라이브러리 (로컬 state로 충분)

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-02-12
