# Agent 차트 데이터 렌더링 PRD 작성 프롬프트

---

## 사용법

아래 프롬프트를 LLM에 입력하여 PRD를 생성한다. `<api-spec>` 영역에 Agent API 설계서 전문을, `<design-doc>` 영역에 백엔드 설계서 전문을 삽입한다.

---

## 프롬프트

```
당신은 시니어 프론트엔드 엔지니어입니다. 아래 제공하는 Agent API 설계서, 백엔드 설계서, 기존 코드베이스 컨텍스트를 기반으로, Admin App의 Agent 채팅에서 구조화된 차트 데이터를 렌더링하는 기능에 대한 프론트엔드 PRD(Product Requirements Document)를 작성하세요.

# 역할
- 프론트엔드 데이터 시각화 전문가
- Recharts 공식 문서(https://recharts.org/en-US/api)에 정통
- react-markdown 공식 문서(https://github.com/remarkjs/react-markdown)에 정통
- 클린 코드 원칙과 업계 표준에 정통
- Neo-Brutalism 디자인 시스템 전문가

# 입력 자료

<api-spec>
{여기에 docs/reference/api-specifications/001-api-agent.md 전문 삽입}
</api-spec>

<design-doc>
{여기에 docs/reference/design/011-agent-statistics-chart-response.md 전문 삽입}
</design-doc>

# 배경

## 현재 상태

Agent API의 `POST /api/v1/agent/run` 응답인 `AgentExecutionResult`에 `chartData` 필드가 추가되었다. 이 필드는 분석 Tool(`get_emerging_tech_statistics`, `analyze_text_frequency`) 실행 시 구조화된 차트 데이터를 배열로 제공한다.

현재 Admin App의 Agent 채팅 페이지에서는:
- `summary`(Markdown 텍스트)만 react-markdown으로 렌더링하고 있다.
- `chartData`는 무시되고 있다 (프론트엔드 타입 정의에 아직 미반영).
- Mermaid 코드 블록은 원본 텍스트로 표시된다 (별도 PRD 007에서 다룸).
- 차트 라이브러리가 설치되어 있지 않다.

## 이 PRD의 범위

`chartData` 배열의 구조화된 데이터를 ASSISTANT 메시지 버블 내에서 인터랙티브 차트(원형/막대)로 렌더링하는 기능이다. 기존 `summary` Markdown 렌더링 아래에 차트 섹션을 추가하는 방식이다.

## 범위 밖
- Mermaid 렌더링: 별도 PRD 007에서 처리
- 차트 내보내기(PNG/PDF), 차트 에디터, 커스텀 차트 유형 추가
- 스트리밍/SSE 구현

# 프로젝트 기본 정보

| 항목 | 내용 |
|------|------|
| 앱 이름 | Admin App |
| 앱 위치 | `/admin` (독립된 별도 Next.js 프로젝트) |
| 기술 스택 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| UI 라이브러리 | Radix UI + CVA (class-variance-authority) |
| 스타일링 | Tailwind CSS v4 + 커스텀 Neo-Brutalism 유틸리티 |
| 아이콘 | Lucide React |
| Markdown 렌더링 | react-markdown + remark-gfm (설치 완료) |
| 차트 라이브러리 | Recharts (npm 패키지, 아직 미설치) |
| API Gateway | http://localhost:8081 (Next.js rewrites로 /api/* → Gateway 프록시) |
| 인증 | JWT 기반 (Bearer 토큰, ADMIN 권한) |
| UI 언어 | 영문 (화면에 표시되는 모든 텍스트는 영문 사용) |

# 기존 코드베이스 컨텍스트

## 현재 AgentExecutionResult 타입 (업데이트 필요)

```typescript
// types/agent.ts — 현재 상태 (chartData 미반영)
export interface AgentExecutionResult {
  success: boolean;
  summary: string;
  sessionId: string;
  toolCallCount: number;
  analyticsCallCount: number;
  executionTimeMs: number;
  errors: string[];
  // chartData: ChartData[];  ← 추가 필요
}
```

## chartData 응답 구조 (백엔드 API 정의서 기준)

```typescript
// 추가 필요한 타입 정의
// 백엔드 API 정의서의 Java long → TypeScript number 매핑
export interface ChartData {
  chartType: "pie" | "bar";
  title: string;
  meta: ChartMeta;
  dataPoints: DataPoint[];
}

export interface ChartMeta {
  groupBy: string;      // "provider" | "source_type" | "update_type" | "keyword"
  startDate: string | null;
  endDate: string | null;
  totalCount: number;   // Java long → TS number
}

export interface DataPoint {
  label: string;
  value: number;        // Java long → TS number
}
```

## chartData 응답 예시

통계 분석 요청 시:
```json
{
  "chartData": [
    {
      "chartType": "pie",
      "title": "Provider별 통계",
      "meta": {
        "groupBy": "provider",
        "startDate": "2026-01-01",
        "endDate": "2026-03-21",
        "totalCount": 243
      },
      "dataPoints": [
        { "label": "OPENAI", "value": 145 },
        { "label": "ANTHROPIC", "value": 98 }
      ]
    }
  ]
}
```

키워드 빈도 분석 요청 시:
```json
{
  "chartData": [
    {
      "chartType": "bar",
      "title": "키워드 빈도 TOP 20",
      "meta": {
        "groupBy": "keyword",
        "startDate": "2026-01-01",
        "endDate": "2026-03-21",
        "totalCount": 150
      },
      "dataPoints": [
        { "label": "model", "value": 312 },
        { "label": "release", "value": 218 },
        { "label": "api", "value": 187 }
      ]
    }
  ]
}
```

분석 Tool 미호출 시:
```json
{
  "chartData": []
}
```

## ASSISTANT 메시지 버블 구조 (현재)

```
┌─────────────────────────────────────────────┐
│ [ASSISTANT 메시지 버블]                       │
│                                              │
│  ┌── ReactMarkdown (prose-brutal) ────────┐  │
│  │  summary 내용 (Markdown 렌더링)         │  │
│  │  - 표, 코드 블록, Mermaid 원본 텍스트   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌── AgentExecutionMeta ──────────────────┐  │
│  │  [Success] | Tools: 5 | 12.5s          │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## ASSISTANT 메시지 버블 구조 (개선 후)

```
┌─────────────────────────────────────────────┐
│ [ASSISTANT 메시지 버블]                       │
│                                              │
│  ┌── ReactMarkdown (prose-brutal) ────────┐  │
│  │  summary 내용 (Markdown 렌더링)         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌── ChartSection (chartData가 있을 때) ──┐  │
│  │  ┌── AgentChart (pie) ──────────────┐  │  │
│  │  │  "Provider별 통계"                │  │  │
│  │  │  [원형 차트]                      │  │  │
│  │  │  기간: 2026-01-01 ~ 2026-03-21   │  │  │
│  │  │  총합: 243건                      │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │  ┌── AgentChart (bar) ──────────────┐  │  │
│  │  │  "키워드 빈도 TOP 20"             │  │  │
│  │  │  [막대 차트]                      │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌── AgentExecutionMeta ──────────────────┐  │
│  │  [Success] | Tools: 5 | 12.5s          │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 디자인 시스템: Neo-Brutalism
- `.brutal-border`: border 2px solid #000000
- `.brutal-shadow-sm`: box-shadow 2px 2px 0px 0px #000000
- `.brutal-shadow`: box-shadow 4px 4px 0px 0px #000000
- border-radius: 0 (직각)
- 색상: --primary (#3B82F6), --secondary (#F5F5F5), --foreground (#000000), --background (#FFFFFF), --accent (#DBEAFE)
- 차트 색상은 다음 팔레트 사용: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]

## ASSISTANT 메시지 버블 렌더링 코드 (현재)

```tsx
// components/agent/agent-message-bubble.tsx 내부
{isUser ? (
  <p className="whitespace-pre-wrap break-words">{content}</p>
) : (
  <div className="prose-brutal">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  </div>
)}

{isUser && failed && (
  <div className="mt-2 flex items-center gap-2">
    <AlertCircle className="size-3.5 text-red-200" />
    <span className="text-xs text-red-200">Failed to send</span>
    {onRetry && (
      <button onClick={onRetry} className="flex items-center gap-1 text-xs text-red-200 hover:underline">
        <RotateCcw className="size-3" /> Retry
      </button>
    )}
  </div>
)}

{!isUser && executionMeta && (
  <AgentExecutionMeta meta={executionMeta} />
)}
```

> **주의**: `ChartSection`은 ASSISTANT 메시지에서만 표시해야 한다. `!isUser` 가드를 반드시 유지할 것. Markdown과 ExecutionMeta 사이(failed 블록 아래)에 `ChartSection`을 배치한다.

## ExecutionMeta 타입 (변경 없음)

```typescript
// types/agent.ts — AgentExecutionResult의 Pick 타입
// chartData는 ExecutionMeta에 포함하지 않는다 (메타데이터가 아닌 별도 데이터)
export type ExecutionMeta = Pick<
  AgentExecutionResult,
  "success" | "toolCallCount" | "analyticsCallCount" | "executionTimeMs" | "errors"
>;
```

## DisplayMessage 타입 (업데이트 필요)

```typescript
// types/agent.ts — 현재 상태 (chartData 미반영)
export interface DisplayMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  executionMeta?: ExecutionMeta;
  failed?: boolean;
  // chartData?: ChartData[];  ← 추가 필요
}
```

## 현재 프로젝트 디렉토리 구조 (관련 부분)

```
admin/src/
├── app/
│   └── agent/page.tsx           (Agent 채팅 페이지)
├── components/
│   ├── ui/                      (button, badge, etc.)
│   └── agent/
│       ├── agent-message-bubble.tsx   (메시지 버블 — 수정 대상)
│       ├── agent-message-area.tsx     (메시지 영역)
│       ├── agent-execution-meta.tsx   (실행 메타데이터)
│       ├── agent-loading-indicator.tsx
│       ├── agent-sidebar.tsx
│       ├── agent-input.tsx
│       ├── agent-empty-state.tsx
│       └── agent-delete-dialog.tsx
├── lib/
│   └── agent-api.ts             (API 클라이언트)
└── types/
    └── agent.ts                 (타입 정의 — 수정 대상)
```

# 기능 요구사항

## F1. chartData 타입 정의 추가
- `types/agent.ts`에 `ChartData`, `ChartMeta`, `DataPoint` 인터페이스 추가
- `AgentExecutionResult`에 `chartData: ChartData[]` 필드 추가
- `DisplayMessage`에 `chartData?: ChartData[]` 필드 추가

## F2. Agent 실행 결과에서 chartData 전달
- `app/agent/page.tsx`에서 `AgentExecutionResult.chartData`를 `DisplayMessage.chartData`로 매핑
- 대화 이력에서 로드된 메시지는 `chartData`가 없으므로 undefined (서버는 대화 이력에 chartData를 저장하지 않음 — summary만 저장됨)

## F3. AgentChart 컴포넌트
- 단일 `ChartData` 객체를 받아 차트를 렌더링하는 컴포넌트
- `chartType === "pie"`: Recharts의 `PieChart` + `Pie` + `Cell` + `Legend` + `Tooltip`
- `chartType === "bar"`: Recharts의 `BarChart` + `Bar` + `XAxis` + `YAxis` + `Tooltip`
- 차트 제목 (`title`) 표시
- 메타데이터 표시: 기간(startDate ~ endDate 또는 "All period"), 총합(totalCount)
- Neo-Brutalism 스타일 적용: brutal-border 컨테이너, 직각, 색상 팔레트
- Recharts는 클라이언트 사이드 렌더링 필요 → `"use client"` 지시어

## F4. ChartSection 컴포넌트
- `chartData` 배열을 받아 여러 `AgentChart`를 나열
- `chartData`가 빈 배열이면 아무것도 렌더링하지 않음
- summary(Markdown)와 AgentExecutionMeta 사이에 배치

## F5. 메시지 버블에 차트 섹션 통합
- `agent-message-bubble.tsx`에서 ASSISTANT 메시지에 `ChartSection` 추가
- 렌더링 순서: ReactMarkdown(summary) → ChartSection(chartData) → AgentExecutionMeta

## F6. 반응형 차트 렌더링
- Recharts `ResponsiveContainer`를 사용하여 컨테이너 너비에 맞게 차트 크기 조정
- 차트 높이: pie 300px, bar 300px (고정)
- 메시지 버블 내부에서 overflow 방지

# 보안 요구사항

PRD에 아래 보안 사항을 반드시 명시하세요:

1. **데이터 신뢰성**: `chartData`는 서버(백엔드)에서 생성한 구조화 데이터이므로, LLM이 직접 생성한 Mermaid 텍스트보다 안전하다. 그러나 `label` 필드의 문자열은 XSS 방지를 위해 Recharts의 기본 escape에 의존한다.
2. **Recharts 기본 보안**: Recharts는 SVG를 React 컴포넌트로 렌더링하므로 `dangerouslySetInnerHTML`을 사용하지 않는다. 별도의 sanitization이 필요하지 않다.
3. **타입 가드**: `chartData`가 예상과 다른 형식일 때를 대비하여 런타임 타입 검증을 수행한다.

# 출력 형식

아래 구조를 따라 PRD를 작성하세요:

## PRD 구조

1. **개요**: 기능 목적, 기술 스택, 의존 라이브러리, chartData 구조 요약
2. **API 연동**: AgentExecutionResult 변경 사항 (chartData 필드 추가), 타입 정의 변경, DisplayMessage 변경
3. **아키텍처**: 컴포넌트 계층도, 데이터 흐름 (AgentExecutionResult → DisplayMessage → AgentMessageBubble → ChartSection → AgentChart → Recharts)
4. **컴포넌트 상세**:
   - AgentChart: Props, chartType별 렌더링 로직, Recharts 구성, 메타데이터 표시
   - ChartSection: Props, 빈 배열 처리, 레이아웃
   - agent-message-bubble.tsx 수정: ChartSection 통합 위치
   - types/agent.ts 수정: ChartData, ChartMeta, DataPoint 추가
5. **디자인 가이드**: 차트 컨테이너 스타일, 색상 팔레트, Neo-Brutalism 일관성, 반응형 처리
6. **보안 사항**: Recharts 보안 모델, 타입 가드, 데이터 신뢰성
7. **기술 구현 사항**: 설치할 패키지(recharts), 파일 구조, Recharts SSR 제약 및 처리 방법
8. **접근성**: 차트 대체 텍스트(aria-label), 키보드 네비게이션, 색상 대비
9. **범위 제한**: 포함/미포함 항목 명시

# 제약 조건

- Recharts 공식 문서(https://recharts.org/en-US/api)에 명시된 API만 사용한다.
- chartData 타입 정의는 백엔드 API 정의서(001-api-agent.md)의 ChartData/ChartMeta/DataPoint 스펙을 그대로 따른다. 필드명을 변경하지 않는다.
- Recharts는 클라이언트 사이드 렌더링이 필요하다. `AgentChart` 컴포넌트에 `"use client"` 지시어를 사용하거나, `next/dynamic`의 `ssr: false`로 동적 import한다.
- 기존 Neo-Brutalism 디자인 시스템과 시각적 일관성을 유지한다.
- 화면에 표시되는 모든 텍스트는 영문을 사용한다.
- 기존 `summary` Markdown 렌더링은 변경하지 않는다. `chartData` 차트는 Markdown 아래에 추가한다.
- `chartData`가 빈 배열인 경우 차트 섹션을 렌더링하지 않는다 (기존 동작 유지).
- 대화 이력에서 로드된 메시지에는 `chartData`가 없다 (서버에서 summary만 저장). 이 경우 기존처럼 summary Markdown만 렌더링한다.
- 오버엔지니어링하지 않는다. 차트 내보내기(PNG/PDF), 차트 유형 전환 UI, 데이터 테이블 토글, 차트 애니메이션 커스터마이징, 차트 줌/팬 등을 추가하지 않는다.
- 외부 자료는 반드시 공식 문서만 참고한다:
  - Recharts: https://recharts.org/en-US/api
  - react-markdown: https://github.com/remarkjs/react-markdown
  - Next.js: https://nextjs.org/docs
```

---

## 프롬프트 엔지니어링 기법 설명

| 기법 | 적용 위치 | 설명 |
|------|----------|------|
| Role Prompting | `# 역할` | 데이터 시각화 전문가 + Recharts/react-markdown 공식 문서 전문가 + Neo-Brutalism 디자인 전문가 역할 부여 |
| Authoritative Source Anchoring | `# 역할`, `# 제약 조건` | Recharts, react-markdown, Next.js 공식 문서 URL을 명시하여 비공식 정보 참조 차단 |
| Dual Document Input | `<api-spec>`, `<design-doc>` 태그 | API 정의서와 백엔드 설계서를 별도 영역으로 구분 제공하여 정보 혼동 방지 |
| Concrete Data Examples | `## chartData 응답 예시` | pie/bar/빈 배열 3가지 실제 JSON 예시를 제공하여 컴포넌트 설계 대상 구체화 |
| Before/After Wireframe | `## ASSISTANT 메시지 버블 구조` | 현재와 개선 후의 ASCII 와이어프레임을 병렬 제공하여 변경 범위를 시각적으로 명시 |
| Code Snippet Grounding | `## ASSISTANT 메시지 버블 렌더링 코드`, `## DisplayMessage 타입` | 수정 대상 코드의 현재 상태를 전문 제공하여 정확한 수정 지점 유도 |
| Enumerated Features | `# 기능 요구사항` F1~F6 | 6개 기능을 코드 번호로 분리하여 각 기능의 범위와 책임 명확화 |
| Explicit Output Format | `## PRD 구조` | 9개 섹션 구조를 번호로 지정하여 누락 방지 |
| Scope Boundary | `## 범위 밖`, `# 제약 조건` | Mermaid(별도 PRD), 차트 내보내기, 스트리밍 등 범위 밖 항목을 명시적으로 배제 |
| SSR Constraint | `# 제약 조건` | Recharts의 클라이언트 사이드 렌더링 필수 요건을 명시하여 SSR 관련 오류 사전 방지 |
| Negative Constraint | `# 제약 조건` | 차트 내보내기, 유형 전환 UI, 줌/팬 등 오버엔지니어링 항목을 명시적으로 배제 |
| Data Trust Model | `# 보안 요구사항` | chartData의 출처(서버 생성 vs LLM 생성)에 따른 신뢰 수준 차이를 명시하여 보안 설계 근거 제공 |
| Design System Consistency | `## 디자인 시스템`, 차트 색상 팔레트 | Neo-Brutalism 유틸리티 클래스와 8색 차트 팔레트를 명시하여 시각적 일관성 확보 |
| Directory Structure Anchoring | `## 현재 프로젝트 디렉토리 구조` | 현재 파일 구조를 정확히 제시하여 새 파일 위치를 올바르게 설계하도록 유도 |
