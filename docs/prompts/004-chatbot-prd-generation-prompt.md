# Chatbot 기능 PRD 작성 프롬프트

---

## 사용법

아래 프롬프트를 LLM에 입력하여 PRD를 생성한다. `<api-spec>` 영역에 Chatbot API 설계서 전문을 삽입한다.

---

## 프롬프트

```
당신은 시니어 프론트엔드 프로덕트 매니저입니다. 아래 제공하는 Chatbot API 설계서와 요구사항을 기반으로 RAG 기반 AI 챗봇 프론트엔드 PRD(Product Requirements Document)를 작성하세요.

# 역할
- 프론트엔드 PRD 작성 전문가
- API 스펙을 읽고 프론트엔드 관점의 요구사항으로 변환
- RAG 챗봇 UI/UX 베스트 프랙티스에 정통

# 입력 자료

<api-spec>
{여기에 docs/API-specifications/api-chatbot-specification.md 전문 삽입}
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
| 인증 | JWT 기반 (Bearer 토큰). 모든 Chatbot API는 인증 필요 |
| UI 언어 | 영문 (화면에 표시되는 모든 텍스트는 영문 사용) |
| 챗봇 데이터 소스 | 벡터 DB 기반 RAG — Emerging Tech 도큐먼트 컬렉션 |

# 기존 코드베이스 컨텍스트

## 구현 완료된 기능
1. **랜딩 페이지 (`/`)**: Emerging Tech 목록 조회, 필터, 검색, 상세 모달, 북마크 토글
2. **인증 기능**: 회원가입(`/signup`), 로그인(`/signin`), OAuth(Google/Kakao/Naver), 이메일 인증, 비밀번호 재설정, 토큰 관리, 로그아웃, 회원탈퇴
3. **북마크 기능 (`/bookmarks`)**: 북마크 CRUD, 검색, 휴지통, 변경 이력

## 디자인 시스템: Neo-Brutalism
- `.brutal-shadow`: box-shadow 4px 4px 0px 0px #000000
- `.brutal-shadow-sm`: box-shadow 2px 2px 0px 0px #000000
- `.brutal-shadow-lg`: box-shadow 6px 6px 0px 0px #000000
- `.brutal-border`: border 2px solid #000000
- `.brutal-border-3`: border 3px solid #000000
- `.brutal-hover`: hover 시 translate(2px, 2px) + shadow 축소, active 시 translate(4px, 4px) + shadow 제거
- border-radius: 0 (모든 요소 직각, --radius: 0rem)
- 색상 변수: --primary (#3B82F6), --accent (#DBEAFE), --secondary (#F5F5F5), --destructive (#EF4444), --foreground (#000000), --background (#FFFFFF)

## 인증 인프라 (재사용 대상)
- `lib/auth-fetch.ts`: `authFetch()` — JWT Authorization 헤더 자동 첨부, 401 시 토큰 자동 갱신, 갱신 실패 시 로그인 페이지 리다이렉트. `parseResponse<T>()`, `parseVoidResponse()` — ApiResponse<T> 파싱 및 에러 처리. `AuthError` 클래스, `getErrorMessage()` 에러 코드 매핑
- `contexts/auth-context.tsx`: `useAuth()` — user, isLoading, login, logout 제공
- `contexts/toast-context.tsx`: `useToast()` — 토스트 알림 제공

## 프로젝트 디렉토리 구조
```
src/
├── app/
│   ├── layout.tsx              (루트 레이아웃, AuthProvider + ToastProvider 감싸기)
│   ├── page.tsx                (랜딩 페이지)
│   ├── globals.css             (글로벌 스타일 + Neo-Brutalism 유틸리티)
│   ├── signup/page.tsx
│   ├── signin/page.tsx
│   ├── bookmarks/page.tsx
│   └── bookmarks/deleted/page.tsx
├── components/
│   ├── ui/                     (공통 UI: button, input, dialog, badge, popover, calendar)
│   ├── emerging-tech/          (카드, 그리드, 필터바, 검색바, 페이지네이션, 상세 모달)
│   ├── auth/                   (인증 폼, OAuth 버튼, 헤더 인증 영역, 탈퇴 다이얼로그)
│   └── bookmark/               (북마크 카드, 검색바, 편집 모달, 삭제/복구 다이얼로그, 이력 모달, 토스트, 토글)
├── contexts/
│   ├── auth-context.tsx        (인증 상태 Context)
│   └── toast-context.tsx       (토스트 알림 Context)
├── lib/
│   ├── api.ts                  (Emerging Tech API 클라이언트)
│   ├── auth-api.ts             (Auth API 클라이언트)
│   ├── auth-fetch.ts           (인증 fetch 래퍼)
│   ├── bookmark-api.ts         (Bookmark API 클라이언트)
│   ├── constants.ts            (Provider/UpdateType/SourceType 레이블, 색상)
│   └── utils.ts                (cn 헬퍼)
└── types/
    ├── emerging-tech.ts        (EmergingTechItem, ApiResponse<T>, ListParams 등)
    ├── auth.ts                 (TokenResponse, AuthUser 등)
    └── bookmark.ts             (BookmarkDetailResponse, PageData<T> 등)
```

## API 클라이언트 패턴 (인증 API)

```typescript
// lib/bookmark-api.ts 패턴 — 챗봇 API도 동일하게 따라야 함
import { authFetch, parseResponse, parseVoidResponse } from "@/lib/auth-fetch";

const BASE = "/api/v1/bookmark";

export async function createBookmark(req: BookmarkCreateRequest): Promise<BookmarkDetailResponse> {
  const res = await authFetch(BASE, {
    method: "POST",
    body: JSON.stringify(req),
  });
  return parseResponse<BookmarkDetailResponse>(res);
}

export async function fetchBookmarks(params: BookmarkListParams = {}): Promise<BookmarkListResponse> {
  const res = await authFetch(`${BASE}${toQuery(params)}`);
  return parseResponse<BookmarkListResponse>(res);
}
```

## 공통 타입

```typescript
// types/emerging-tech.ts
export interface ApiResponse<T> {
  code: string;
  messageCode: { code: string; text: string };
  message: string;
  data: T;
}
```

# 기능 요구사항

## 목적
Emerging Tech 도큐먼트들을 벡터 DB로부터 RAG 소스로 활용하는 멀티턴 AI 챗봇 UI를 구현한다. 사용자는 최신 기술 트렌드에 대해 질문하고, 챗봇이 관련 문서를 참조하여 응답하며, 참조 소스를 함께 표시한다.

## 전제 조건
- 로그인한 사용자만 챗봇 사용 가능 (모든 API에 JWT 인증 필요)
- 비로그인 사용자는 챗봇 페이지 접근 시 로그인 페이지로 리다이렉트

## F1. 채팅 메시지 전송 및 응답 표시
- 사용 API: `POST /api/v1/chatbot`
- 사용자 메시지 입력 후 전송, AI 응답을 대화 형태로 표시
- Request: `{ message: string (NotBlank, Max 500자), conversationId?: string }`
- Response: `{ response: string, conversationId: string, sources?: SourceResponse[] }`
- conversationId가 없으면 새 세션 자동 생성
- 메시지 전송 중 로딩 상태 표시 (타이핑 인디케이터)
- 입력 검증: 빈 메시지 방지, 500자 제한, 전송 중 중복 전송 방지

## F2. RAG 소스 인용 표시
- AI 응답에 포함된 sources 배열을 인용 정보로 표시
- SourceResponse 필드: documentId, collectionType (EMERGING_TECH, NEWS 등), score (0~1), title, url
- 응답 하단에 참조 소스 섹션으로 표시
- 소스 제목 클릭 시 원본 URL로 이동 (새 탭)
- 관련도 점수(score) 표시

## F3. 대화 세션 목록 (사이드바)
- 사용 API: `GET /api/v1/chatbot/sessions`
- 사용자의 대화 세션 목록을 사이드바에 표시
- 페이지네이션: Spring Data Page 응답 (page 1부터, size 기본 20)
- 정렬: lastMessageAt 기준 내림차순 (최신 대화 순)
- 표시 필드: title (세션 제목), lastMessageAt (상대 시간 표시)
- 세션 클릭 시 해당 세션의 대화 내역 로드

## F4. 대화 내역 로드
- 사용 API: `GET /api/v1/chatbot/sessions/{sessionId}/messages`
- 선택한 세션의 메시지 목록을 시간순(sequenceNumber 오름차순)으로 표시
- 페이지네이션: page 1부터, size 기본 50
- MessageResponse 필드: messageId, role (USER/ASSISTANT), content, sequenceNumber, createdAt
- 이전 메시지 로드: 스크롤 상단 도달 시 이전 페이지 로드 (infinite scroll up)

## F5. 새 대화 시작
- "New Chat" 버튼으로 새 대화 세션 시작
- 현재 대화 초기화, conversationId를 null로 설정
- 첫 메시지 전송 시 서버에서 새 conversationId 반환

## F6. 세션 삭제
- 사용 API: `DELETE /api/v1/chatbot/sessions/{sessionId}`
- 세션 목록에서 삭제 액션 제공
- 삭제 전 확인 다이얼로그 표시
- 삭제 성공 시 세션 목록에서 제거

## F7. 헤더 네비게이션 확장
- 로그인 상태의 Header에 "Chat" 네비게이션 링크 추가
- `/chat` 페이지로 이동

# RAG 챗봇 UI/UX 베스트 프랙티스 가이드

PRD 작성 시 아래 업계 표준 베스트 프랙티스를 반영하세요:

## 메시지 UI
1. **메시지 버블 구분**: USER와 ASSISTANT 메시지를 시각적으로 구분 (정렬, 색상, 아바타). USER 메시지는 우측 정렬 + Primary Blue 배경, ASSISTANT 메시지는 좌측 정렬 + Secondary 배경.
2. **타이핑 인디케이터**: AI 응답 대기 중 "AI is thinking..." 인디케이터 표시. 사용자에게 응답이 생성 중임을 알림.
3. **메시지 타임스탬프**: 각 메시지에 생성 시간 표시 (상대 시간 또는 절대 시간).
4. **자동 스크롤**: 새 메시지 수신 시 자동으로 최하단 스크롤. 단, 사용자가 이전 메시지를 읽고 있을 때는 자동 스크롤하지 않음.

## 소스 인용 (RAG 특화)
5. **소스 표시**: AI 응답 하단에 참조 소스 섹션을 표시하여 투명성과 신뢰성 확보.
6. **소스 접근성**: 소스 제목을 클릭 가능한 링크로 제공. 새 탭에서 원본 문서 열기.
7. **관련도 시각화**: score 값을 시각적으로 표시 (예: 퍼센트, 바 등).

## 대화 관리
8. **세션 목록 사이드바**: 이전 대화 목록을 사이드바에 표시하여 대화 간 빠른 전환 지원.
9. **Empty State**: 첫 사용 시 또는 대화 없을 때 안내 메시지와 예시 질문 제공.
10. **입력 영역**: 하단 고정 입력 영역, Enter로 전송, Shift+Enter로 줄바꿈.

## 에러 및 상태 처리
11. **Loading States**: 세션 목록 로딩, 메시지 로딩, 메시지 전송 중 각각 적절한 로딩 UI 표시.
12. **Error States**: API 에러 발생 시 사용자 친화적 에러 메시지 표시 (토스트 또는 인라인).
13. **입력 검증 피드백**: 500자 초과, 빈 메시지 등 클라이언트 사이드 검증 피드백 즉시 표시.
14. **재전송**: 메시지 전송 실패 시 재시도 옵션 제공.

## 디자인 일관성
15. **메인 테마 일관성**: 챗봇 UI는 기존 Neo-Brutalism 디자인 시스템과 완전히 일관되어야 한다. brutal-shadow, brutal-border, brutal-hover 유틸리티 클래스를 동일하게 활용. 직각 border-radius, 동일 색상 팔레트, 동일 폰트를 적용.
16. **컴포넌트 재사용**: 기존 공통 UI 컴포넌트(Button, Input, Dialog)를 최대한 재사용.

# 보안 요구사항

PRD에 아래 보안 사항을 반드시 명시하세요:

1. **XSS 방지**: AI 응답 및 사용자 메시지 렌더링 시 React의 기본 이스케이핑에 의존. 직접 HTML 삽입(innerHTML 직접 조작) 사용 금지. Markdown 렌더링이 필요한 경우 안전한 라이브러리 사용 및 HTML 태그 비허용.
2. **입력 검증**: 클라이언트 사이드에서 메시지 길이(500자), 빈 메시지 검증. 서버 사이드 검증에도 의존 (이중 검증).
3. **JWT 토큰 관리**: 기존 `authFetch` 인프라 재사용. 토큰 자동 갱신, 만료 시 로그인 리다이렉트 처리.
4. **세션 접근 제어**: 다른 사용자의 세션 접근 시 403 에러 처리. API 레벨에서 보장되지만 프론트엔드에서도 에러 핸들링 필수.
5. **URL 검증**: 소스 URL 렌더링 시 `javascript:` 프로토콜 차단. `https://` 또는 `http://`로 시작하는 URL만 링크로 렌더링.
6. **전송 중복 방지**: 메시지 전송 중 전송 버튼 비활성화 및 입력 잠금으로 중복 요청 방지.

# 출력 형식

아래 구조를 따라 PRD를 작성하세요. 각 섹션은 반드시 포함되어야 합니다.

## PRD 구조

1. **개요**: 프로젝트 기본 정보 테이블 (기술 스택, 디자인 테마, 색상, Gateway, 인증 방식, UI 언어, 데이터 소스)
2. **API 연동**: Chatbot API 엔드포인트 전체 목록 (5개). 각 API의 요청 파라미터, 응답 필드, 에러 코드 정리. 공통 응답 형식(ApiResponse<T>, Spring Data Page<T>) 명시. 페이지네이션 필드명이 기존 Bookmark의 PageData<T>와 다름(Spring Data Page 형식)에 유의
3. **페이지 구조**: 신규/수정 페이지 목록과 각 페이지의 ASCII 와이어프레임
   - `/chat` (신규) — 챗봇 메인 페이지 (사이드바 + 대화 영역)
   - `/` (수정 없음, Header만 네비게이션 링크 추가)
4. **컴포넌트 상세**:
   - 채팅 사이드바: 세션 목록, 새 대화 버튼, 세션 삭제 액션, 페이지네이션/무한 스크롤
   - 메시지 영역: USER/ASSISTANT 메시지 버블, 타이핑 인디케이터, 자동 스크롤, 이전 메시지 로드
   - 소스 인용 섹션: 참조 소스 목록, 관련도 점수, 외부 링크
   - 메시지 입력 영역: 텍스트 입력, 글자 수 카운터, 전송 버튼, 키보드 단축키(Enter/Shift+Enter)
   - 세션 삭제 확인 다이얼로그
   - Empty State: 새 대화 시작 안내, 예시 질문
   - Header: 네비게이션 확장 ("Chat" 링크)
5. **디자인 가이드**: 기존 Neo-Brutalism 디자인 시스템과의 일관성 규칙. 기존 CSS 유틸리티(brutal-shadow, brutal-border, brutal-hover) 활용 방법. 메시지 버블 스타일(USER: Primary Blue 배경, ASSISTANT: Secondary 배경, 직각 border-radius). 사이드바 스타일. 입력 영역 스타일. 색상 팔레트, 폰트, 간격 규칙
6. **보안 사항**: XSS 방지 규칙, 입력 검증 규칙, JWT 토큰 관리, 세션 접근 제어, URL 검증, 중복 전송 방지
7. **기술 구현 사항**: 추가 디렉토리/파일 구조 (`types/chatbot.ts`, `lib/chatbot-api.ts`, `components/chatbot/`, `app/chat/` 등). API 클라이언트 구현 방식 (`authFetch` + `parseResponse` 패턴 재사용). 인증 가드 구현 방식. 상태 관리 방향
8. **접근성**: 채팅 영역 `role="log"` 적용, 메시지 `aria-label`, 전송 버튼 접근 가능한 이름, 키보드 네비게이션
9. **범위 제한**: 포함/미포함 항목 명시

# 제약 조건

- API 스펙에 정의된 필드명, 파라미터명을 그대로 사용한다. 임의로 변경하지 않는다. 특히: conversationId(sessionId와 별도), role (USER/ASSISTANT), sequenceNumber, collectionType, score.
- API Gateway(8081)로 일괄 요청한다. 개별 서비스 포트(8084)로 직접 요청하지 않는다. Next.js rewrites `/api/*` → `http://localhost:8081/api/*` 프록시를 활용한다.
- 기존 랜딩 페이지, 인증 페이지, 북마크 페이지의 디자인 시스템(Neo-Brutalism, 색상, 폰트, 유틸리티 클래스)을 그대로 따른다. 챗봇 UI가 기존 앱과 시각적으로 이질감 없이 일관되어야 한다.
- 기존 컴포넌트 라이브러리(Radix UI, CVA, Lucide 아이콘)를 활용한다. 새로운 UI 라이브러리를 추가하지 않는다.
- 기존 인증 인프라(`authFetch`, `parseResponse`, `parseVoidResponse`, `useAuth`, `useToast`)를 재사용한다. 중복 구현하지 않는다.
- 화면에 표시되는 모든 텍스트(버튼, 라벨, 메시지, 플레이스홀더 등)는 영문을 사용한다.
- 오버엔지니어링하지 않는다. 요구사항에 명시되지 않은 기능(스트리밍 응답, 음성 입력, 파일 업로드, Markdown 렌더링, 다크 모드, 다국어 시스템, 실시간 동기화, 챗봇 설정 커스터마이징 등)을 추가하지 않는다.
- Spring Data Page<T>의 필드명(content, totalElements, totalPages, number, size, first, last, empty)을 API 스펙 그대로 사용한다. 기존 Bookmark의 PageData<T> 필드명(list, totalSize, totalPageNumber, pageNumber, pageSize)과 다름에 유의한다.
- 채팅 API의 응답은 비스트리밍(동기식) 방식이다. SSE, WebSocket 등 스트리밍 구현을 추가하지 않는다.
```

---

## 프롬프트 엔지니어링 기법 설명

| 기법 | 적용 위치 | 설명 |
|------|----------|------|
| Role Prompting | `# 역할` | LLM에 시니어 PM + RAG 챗봇 전문가 역할을 부여하여 도메인 전문성 유도 |
| Structured Input | `<api-spec>` 태그 | API 설계서를 명확한 경계로 구분하여 제공 |
| Grounding | `# 기존 코드베이스 컨텍스트` | 실제 구현된 코드 구조, 인증 인프라, API 패턴을 코드 스니펫과 함께 명시하여 기존 패턴과의 일관성 확보 |
| Explicit Output Format | `# 출력 형식` > `## PRD 구조` | 9개 섹션 구조를 번호로 지정하여 누락 방지 |
| Few-shot Context | `# 기능 요구사항` F1~F7 | 7개 기능을 코드 번호로 나열, 각 기능에 사용 API와 필드를 명시하여 모호성 제거 |
| Constraint Specification | `# 제약 조건` | 오버엔지니어링 방지, 비스트리밍 명시, 디자인 일관성, API 스펙 준수를 선언 |
| Context Anchoring | `# 프로젝트 기본 정보` | 기술 스택, 색상 코드, Gateway, 데이터 소스 등 사실 기반 정보를 고정값으로 제공 |
| Chain-of-Reference | `## API 클라이언트 패턴`, `## 인증 인프라` | 기존 코드의 실제 패턴을 보여주어 LLM이 동일 패턴으로 확장하도록 유도 |
| Domain-Specific Best Practices | `# RAG 챗봇 UI/UX 베스트 프랙티스 가이드` | 메시지 버블, 타이핑 인디케이터, 소스 인용, 자동 스크롤 등 RAG 챗봇 특화 UI/UX 패턴을 16개 항목으로 구분하여 PRD에 반영 유도 |
| Security Specification | `# 보안 요구사항` | XSS 방지, JWT 관리, URL 검증 등 보안 사항을 별도 섹션으로 분리하여 PRD에 반드시 포함되도록 강제 |
| Negative Constraint | `# 제약 조건` 마지막 2항목 | 스트리밍 미지원, 페이지네이션 필드명 차이 등 '하지 말아야 할 것'을 명시하여 잘못된 가정 방지 |
| Design Consistency Anchoring | `# 베스트 프랙티스` 15~16항, `# 제약 조건` 3~4항 | 기존 Neo-Brutalism 디자인 시스템과의 일관성을 다중 위치에서 반복 강조하여 디자인 이탈 방지 |
