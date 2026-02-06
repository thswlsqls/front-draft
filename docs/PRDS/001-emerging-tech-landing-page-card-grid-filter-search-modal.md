# PRD: Emerging Tech 랜딩 페이지

**작성일**: 2026-02-06
**버전**: v1
**기반 프롬프트**: `docs/prompts/001-prd-generation-prompt.md`
**API 스펙 문서**: `docs/API-specifications/api-emerging-tech-specification.md`

---

## 1. 개요

AI 기술 업데이트 정보(Emerging Tech)를 카드 기반 UI로 제공하는 단일 랜딩 페이지.

| 항목 | 내용 |
|------|------|
| 기술 스택 | Next.js (App Router) + shadcn/ui |
| 디자인 테마 | Neo-Brutalism |
| 색상 테마 | Blue (#3B82F6 계열), Black (#000000) |
| API Gateway | `http://localhost:8081` |
| 인증 | 불필요 (공개 API만 사용) |
| 대상 페이지 | 단일 랜딩 페이지 (`/`) |

---

## 2. API 연동

모든 요청은 Gateway(8081 포트)로 전송한다. 프론트엔드에서 백엔드 포트(8082)로 직접 요청하지 않는다.

### 2.1 사용 API 엔드포인트

| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/v1/emerging-tech` | 목록 조회 (필터 포함) |
| GET | `/api/v1/emerging-tech/{id}` | 상세 조회 |
| GET | `/api/v1/emerging-tech/search` | 텍스트 검색 |

### 2.2 목록 조회 API

**GET** `/api/v1/emerging-tech`

**요청 파라미터**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | Integer | X | 1 | 페이지 번호 (min: 1) |
| size | Integer | X | 20 | 페이지 크기 (min: 1, max: 100) |
| provider | String | X | - | TechProvider enum 필터 |
| updateType | String | X | - | EmergingTechType enum 필터 |
| sourceType | String | X | - | SourceType enum 필터 |
| startDate | String | X | - | 조회 시작일 (YYYY-MM-DD) |
| endDate | String | X | - | 조회 종료일 (YYYY-MM-DD) |
| sort | String | X | - | 정렬 (예: "publishedAt,desc") |

**응답 (200 OK)**: `ApiResponse<EmergingTechPageResponse>`

```json
{
  "code": "2000",
  "messageCode": { "code": "SUCCESS", "text": "성공" },
  "message": "success",
  "data": {
    "pageSize": 20,
    "pageNumber": 1,
    "totalCount": 100,
    "items": [EmergingTechDetailResponse]
  }
}
```

### 2.3 상세 조회 API

**GET** `/api/v1/emerging-tech/{id}`

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| id | String (Path) | O | MongoDB ObjectId (24자 hex) |

**응답 (200 OK)**: `ApiResponse<EmergingTechDetailResponse>`

**에러**: `404` - 리소스 없음

### 2.4 검색 API

**GET** `/api/v1/emerging-tech/search`

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| q | String | O | - | 검색어 (NotBlank) |
| page | Integer | X | 1 | 페이지 번호 |
| size | Integer | X | 20 | 페이지 크기 |

**응답**: 목록 조회와 동일한 `EmergingTechPageResponse` 형식

**에러**: `400` - 검색어 누락

### 2.5 EmergingTechDetailResponse 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | String | O | MongoDB ObjectId |
| provider | String | O | OPENAI / ANTHROPIC / GOOGLE / META / XAI |
| updateType | String | O | MODEL_RELEASE / API_UPDATE / SDK_RELEASE / PRODUCT_LAUNCH / PLATFORM_UPDATE / BLOG_POST |
| title | String | O | 제목 |
| summary | String | X | 요약 |
| url | String | O | 원본 URL |
| publishedAt | String (ISO 8601) | X | 발행일시 |
| sourceType | String | O | GITHUB_RELEASE / RSS / WEB_SCRAPING |
| status | String | O | DRAFT / PENDING / PUBLISHED / REJECTED |
| metadata.version | String | X | 버전 정보 |
| metadata.tags | String[] | X | 태그 목록 |
| metadata.author | String | X | 작성자 |
| metadata.githubRepo | String | X | GitHub 저장소 URL |
| metadata.additionalInfo | Object | X | 추가 정보 (key-value) |
| createdAt | String (ISO 8601) | O | 생성일시 |
| updatedAt | String (ISO 8601) | O | 수정일시 |

### 2.6 공통 응답 래퍼

```json
{
  "code": "2000",
  "messageCode": { "code": "SUCCESS", "text": "성공" },
  "message": "success",
  "data": { ... }
}
```

실제 데이터는 `data` 필드에서 추출한다.

---

## 3. 페이지 구조

단일 랜딩 페이지(`/`)로 구성한다.

```
┌──────────────────────────────────────────────────┐
│  Header                                          │
│  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Emerging Tech    │  │ 🔍 검색어 입력...     │  │
│  └──────────────────┘  └──────────────────────┘  │
├──────────────────────────────────────────────────┤
│  필터 바                                          │
│                                                  │
│  Provider:                                       │
│  [전체] [OPENAI] [ANTHROPIC] [GOOGLE] [META] [XAI]│
│                                                  │
│  Update Type:                                    │
│  [전체] [MODEL_RELEASE] [API_UPDATE] [SDK_RELEASE]│
│  [PRODUCT_LAUNCH] [PLATFORM_UPDATE] [BLOG_POST]  │
│                                                  │
│  Source Type:                                    │
│  [전체] [GITHUB_RELEASE] [RSS] [WEB_SCRAPING]    │
│                                                  │
│  기간: [시작일 📅] ~ [종료일 📅]                   │
├──────────────────────────────────────────────────┤
│  카드 그리드 (반응형 3열/2열/1열)                   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ OPENAI   │  │ GOOGLE   │  │ META     │       │
│  │ Badge    │  │ Badge    │  │ Badge    │       │
│  │──────────│  │──────────│  │──────────│       │
│  │ Title    │  │ Title    │  │ Title    │       │
│  │ Summary..│  │ Summary..│  │ Summary..│       │
│  │──────────│  │──────────│  │──────────│       │
│  │ Type│Date│  │ Type│Date│  │ Type│Date│       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  ...     │  │  ...     │  │  ...     │       │
│  └──────────┘  └──────────┘  └──────────┘       │
├──────────────────────────────────────────────────┤
│  페이지네이션                                     │
│        [< 1 2 3 ... 10 >]                        │
└──────────────────────────────────────────────────┘
```

---

## 4. 컴포넌트 상세

### 4.1 Header / 검색 바

| 항목 | 설명 |
|------|------|
| 타이틀 | "Emerging Tech" (좌측) |
| 검색 입력창 | 우측 배치, placeholder: "검색어 입력..." |
| 검색 트리거 | Enter 키 또는 검색 버튼 클릭 |
| 사용 API | `GET /api/v1/emerging-tech/search?q={검색어}` |

**동작 규칙**:
- 검색어 입력 후 Enter 시 검색 API 호출
- 검색 활성화 시 필터 바 비활성화 (검색 API는 별도 엔드포인트이므로 필터 파라미터 미지원)
- 검색어 삭제(빈 문자열) 시 필터 바 재활성화, 목록 조회 API로 복귀
- 검색 결과도 페이지네이션 적용 (page, size 파라미터)

### 4.2 필터 바

**공통 규칙**:
- 필터는 `GET /api/v1/emerging-tech`의 Query Parameters로 전달
- 여러 필터 동시 적용 가능 (AND 조건)
- 필터 변경 시 page=1로 초기화
- 텍스트 검색 활성화 시 필터 바 전체 비활성화

#### Provider 탭

| 탭 값 | Query Parameter |
|--------|----------------|
| 전체 | provider 파라미터 생략 |
| OPENAI | `provider=OPENAI` |
| ANTHROPIC | `provider=ANTHROPIC` |
| GOOGLE | `provider=GOOGLE` |
| META | `provider=META` |
| XAI | `provider=XAI` |

#### UpdateType 탭

| 탭 값 | Query Parameter |
|--------|----------------|
| 전체 | updateType 파라미터 생략 |
| MODEL_RELEASE | `updateType=MODEL_RELEASE` |
| API_UPDATE | `updateType=API_UPDATE` |
| SDK_RELEASE | `updateType=SDK_RELEASE` |
| PRODUCT_LAUNCH | `updateType=PRODUCT_LAUNCH` |
| PLATFORM_UPDATE | `updateType=PLATFORM_UPDATE` |
| BLOG_POST | `updateType=BLOG_POST` |

#### SourceType 탭

| 탭 값 | Query Parameter |
|--------|----------------|
| 전체 | sourceType 파라미터 생략 |
| GITHUB_RELEASE | `sourceType=GITHUB_RELEASE` |
| RSS | `sourceType=RSS` |
| WEB_SCRAPING | `sourceType=WEB_SCRAPING` |

#### 날짜 기간 필터

| 항목 | 설명 |
|------|------|
| 시작일 | Date Picker, `startDate` 파라미터 (YYYY-MM-DD) |
| 종료일 | Date Picker, `endDate` 파라미터 (YYYY-MM-DD) |
| 기준 필드 | publishedAt |
| 동작 | 시작일만 선택 시 startDate만 전송, 종료일만 선택 시 endDate만 전송, 둘 다 선택 시 범위 조회 |

### 4.3 카드 컴포넌트

카드에 표시할 필드:

| 영역 | 필드 | 표시 방식 |
|------|------|----------|
| 상단 | provider | 뱃지 (provider별 고유 배경색) |
| 상단 | updateType | 뱃지 |
| 중앙 | title | 카드 제목 (굵은 폰트) |
| 중앙 | summary | 요약 텍스트 (2-3줄 말줄임, `line-clamp-3`) |
| 하단 | sourceType | 뱃지 또는 아이콘 |
| 하단 | publishedAt | 날짜 표시 (예: "2025.01.15") |

**카드 클릭 시**: 해당 항목의 상세 모달 표시

### 4.4 상세 조회 모달

카드 클릭 시 `GET /api/v1/emerging-tech/{id}`를 호출하여 모달에 상세 정보를 표시한다.

**모달 표시 필드**:

| 필드 | 표시 방식 |
|------|----------|
| title | 모달 제목 (굵은 폰트) |
| provider | 뱃지 |
| updateType | 뱃지 |
| sourceType | 뱃지 |
| publishedAt | 날짜 형식 (예: "2025년 1월 15일") |
| summary | 전문 표시 (말줄임 없음) |
| url | "원본 보기" 외부 링크 버튼 (새 탭) |
| metadata.tags | 태그 뱃지 목록 |
| metadata.version | 버전 텍스트 (값이 있을 경우만 표시) |
| metadata.author | 작성자 텍스트 (값이 있을 경우만 표시) |
| metadata.githubRepo | GitHub 링크 버튼 (값이 있을 경우만 표시, 새 탭) |

**동작 규칙**:
- 모달 외부 클릭 또는 X 버튼으로 닫기
- API 호출 중 로딩 상태 표시
- 404 에러 시 "항목을 찾을 수 없습니다" 메시지

### 4.5 페이지네이션

| 항목 | 설명 |
|------|------|
| 데이터 소스 | API 응답의 pageNumber, pageSize, totalCount |
| 총 페이지 수 | `Math.ceil(totalCount / pageSize)` |
| 동작 | 페이지 번호 클릭 시 해당 page로 API 재호출 |
| 표시 | 현재 페이지 강조, 이전/다음 버튼 |

---

## 5. 디자인 가이드 (Neo-Brutalism)

### 5.1 핵심 특징

- **굵은 테두리**: 모든 UI 요소에 2-4px solid black border
- **하드 쉐도우**: blur 없는 오프셋 그림자 (`box-shadow: 4px 4px 0px 0px #000`)
- **플랫 컬러**: 그라데이션 없이 단색 배경
- **볼드 타이포그래피**: 제목에 굵은(font-weight: 700+) 폰트

### 5.2 색상 팔레트

| 용도 | 색상 | 코드 |
|------|------|------|
| Primary | Blue | #3B82F6 |
| Text / Border | Black | #000000 |
| Background | White | #FFFFFF |
| Surface (필터 바 등) | Light Gray | #F5F5F5 |
| Active Tab / Accent | Blue | #3B82F6 |
| Card Background | White | #FFFFFF |
| Hover 강조 | Light Blue | #DBEAFE |

#### Provider 뱃지 색상

| Provider | 배경색 | 텍스트 |
|----------|--------|--------|
| OPENAI | #10A37F (OpenAI Green) | #FFFFFF |
| ANTHROPIC | #D97706 (Amber) | #FFFFFF |
| GOOGLE | #4285F4 (Google Blue) | #FFFFFF |
| META | #0668E1 (Meta Blue) | #FFFFFF |
| XAI | #000000 (Black) | #FFFFFF |

### 5.3 컴포넌트별 스타일

| 컴포넌트 | 스타일 |
|----------|--------|
| 카드 | `bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000]` |
| 카드 hover | `shadow-[2px_2px_0px_0px_#000] translate-x-[2px] translate-y-[2px]` (눌리는 효과) |
| 버튼 | `border-2 border-black shadow-[4px_4px_0px_0px_#000]` + hover 시 이동 효과 |
| 탭 (선택) | `bg-[#3B82F6] text-white border-2 border-black` |
| 탭 (미선택) | `bg-white text-black border-2 border-black` |
| 입력창 | `border-2 border-black focus:border-[#3B82F6]` |
| 뱃지 | 각 고유 배경색 + `border-2 border-black text-sm px-2 py-0.5` |
| 모달 | `bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000]` + 반투명 오버레이 |
| 페이지네이션 버튼 | `border-2 border-black` + 현재 페이지: `bg-[#3B82F6] text-white` |

---

## 6. 기술 구현 사항

### 6.1 프로젝트 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 랜딩 페이지 (/)
│   └── globals.css             # 글로벌 스타일
├── components/
│   ├── emerging-tech/
│   │   ├── search-bar.tsx      # 검색 입력창
│   │   ├── filter-bar.tsx      # 필터 바 (탭 + 날짜)
│   │   ├── card.tsx            # 카드 컴포넌트
│   │   ├── card-grid.tsx       # 카드 그리드
│   │   ├── detail-modal.tsx    # 상세 모달
│   │   └── pagination.tsx      # 페이지네이션
│   └── ui/                     # shadcn/ui 컴포넌트
├── lib/
│   └── api.ts                  # API 호출 함수
└── types/
    └── emerging-tech.ts        # TypeScript 타입/인터페이스 정의
```

### 6.2 API 호출 방식

- `next.config.js`에서 rewrites로 `/api/**` 요청을 `http://localhost:8081`로 프록시
- 또는 환경변수 `NEXT_PUBLIC_API_URL=http://localhost:8081` 설정 후 직접 호출
- `fetch` API 사용 (별도 HTTP 라이브러리 불필요)

```javascript
// next.config.js rewrites 예시
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8081/api/:path*',
    },
  ];
}
```

### 6.3 상태 관리

- URL search params 기반 필터 상태 관리 (`useSearchParams`)
- 검색 모드 / 필터 모드 구분을 위한 로컬 상태
- 모달 열림/닫힘, 선택된 항목 ID는 컴포넌트 로컬 상태 (`useState`)

### 6.4 Enum 상수 정의

```typescript
// types/emerging-tech.ts

export const TECH_PROVIDERS = ["OPENAI", "ANTHROPIC", "GOOGLE", "META", "XAI"] as const;
export type TechProvider = typeof TECH_PROVIDERS[number];

export const UPDATE_TYPES = ["MODEL_RELEASE", "API_UPDATE", "SDK_RELEASE", "PRODUCT_LAUNCH", "PLATFORM_UPDATE", "BLOG_POST"] as const;
export type EmergingTechType = typeof UPDATE_TYPES[number];

export const SOURCE_TYPES = ["GITHUB_RELEASE", "RSS", "WEB_SCRAPING"] as const;
export type SourceType = typeof SOURCE_TYPES[number];

export const POST_STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED"] as const;
export type PostStatus = typeof POST_STATUSES[number];
```

---

## 7. 범위 제한

### 포함

- 단일 랜딩 페이지 (`/`)
- 카드 그리드 목록 조회
- 필터 조회 (provider, updateType, sourceType 탭 + 날짜 기간)
- 텍스트 검색
- 상세 조회 모달
- 페이지네이션
- 공개 API 3개 연동

### 미포함

- 인증 / 로그인
- 내부 API 연동 (POST, 승인, 거부)
- 관리자 페이지
- 다크 모드
- 다국어 지원
- SSR / ISR (클라이언트 사이드 fetch 사용)
- 전역 상태 관리 라이브러리 (Redux 등)
