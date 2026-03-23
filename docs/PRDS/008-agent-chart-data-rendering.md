# Agent 차트 데이터 렌더링 PRD

**작성일**: 2026-03-21
**버전**: 1.0
**기반 프롬프트**: prompts/008-agent-chart-data-prd-generation-prompt.md
**API 스펙 문서**: tech-n-ai-backend/docs/reference/api-specifications/001-api-agent.md (v5)
**설계 문서**: tech-n-ai-backend/docs/reference/design/011-agent-statistics-chart-response.md

---

## 1. 개요

### 목적

Agent API의 `AgentExecutionResult.chartData` 필드가 제공하는 구조화된 통계 데이터를, ASSISTANT 메시지 버블 내에서 원형(pie) 차트 및 막대(bar) 차트로 렌더링한다. 기존 `summary` Markdown 렌더링은 그대로 유지하고, 차트 섹션을 Markdown 아래에 추가한다.

### 기술 스택

| 항목 | 내용 |
|------|------|
| 앱 | Admin App (`/admin`) |
| 프레임워크 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 차트 라이브러리 | **Recharts** (신규 설치) |
| 기존 Markdown | react-markdown + remark-gfm (변경 없음) |
| 디자인 | Neo-Brutalism (brutal-border, brutal-shadow, 직각) |
| UI 언어 | 영문 |

### chartData 구조 요약

백엔드의 분석 Tool(`get_emerging_tech_statistics`, `analyze_text_frequency`) 실행 시, `AgentExecutionResult.chartData` 배열에 구조화된 차트 데이터가 포함된다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `chartType` | `"pie"` \| `"bar"` | 차트 유형 |
| `title` | `string` | 차트 제목 |
| `meta.groupBy` | `string` | 집계 기준 (`"provider"`, `"source_type"`, `"update_type"`, `"keyword"`) |
| `meta.startDate` | `string \| null` | 조회 시작일 (YYYY-MM-DD) |
| `meta.endDate` | `string \| null` | 조회 종료일 (YYYY-MM-DD) |
| `meta.totalCount` | `number` | 전체 합계 |
| `dataPoints[]` | `{ label: string, value: number }[]` | 차트 데이터 포인트 |

분석 Tool이 호출되지 않으면 `chartData`는 빈 배열이다. 대화 이력에서 로드된 메시지에는 `chartData`가 없다 (서버에서 `summary`만 저장).

---

## 2. API 연동

### AgentExecutionResult 변경

기존 7개 필드에 `chartData` 필드가 추가되었다 (백엔드 v5).

```typescript
// types/agent.ts — 추가 필드
export interface AgentExecutionResult {
  success: boolean;
  summary: string;
  sessionId: string;
  toolCallCount: number;
  analyticsCallCount: number;
  executionTimeMs: number;
  errors: string[];
  chartData: ChartData[];     // 신규 필드
}
```

### 추가 타입 정의

```typescript
// types/agent.ts — 신규 타입
export interface ChartData {
  chartType: "pie" | "bar";
  title: string;
  meta: ChartMeta;
  dataPoints: DataPoint[];
}

export interface ChartMeta {
  groupBy: string;
  startDate: string | null;
  endDate: string | null;
  totalCount: number;
}

export interface DataPoint {
  label: string;
  value: number;
}
```

### DisplayMessage 변경

```typescript
export interface DisplayMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  executionMeta?: ExecutionMeta;
  failed?: boolean;
  chartData?: ChartData[];    // 신규 필드
}
```

### ExecutionMeta — 변경 없음

`ExecutionMeta`는 `AgentExecutionResult`의 `Pick` 타입이며, `chartData`를 포함하지 않는다. 메타데이터와 차트 데이터는 별도 경로로 전달된다.

### API 클라이언트 — 변경 없음

`lib/agent-api.ts`의 `runAgent()` 함수는 `parseResponse<AgentExecutionResult>(res)`를 반환하므로, 타입 정의만 업데이트하면 `chartData`가 자동으로 포함된다.

---

## 3. 아키텍처

### 컴포넌트 계층도

```
app/agent/page.tsx
  └── AgentMessageArea
        └── AgentMessageBubble (ASSISTANT)
              ├── ReactMarkdown (summary)
              ├── ChartSection (chartData)     ← 신규
              │     └── AgentChart (per item)   ← 신규
              │           └── Recharts (PieChart / BarChart)
              └── AgentExecutionMeta
```

### 데이터 흐름

```
1. POST /api/v1/agent/run → AgentExecutionResult { summary, chartData, ... }
2. page.tsx: result.chartData → DisplayMessage.chartData
3. AgentMessageBubble: props.chartData → ChartSection
4. ChartSection: chartData.map() → AgentChart
5. AgentChart: chartType 분기 → Recharts PieChart / BarChart
```

### 대화 이력 로드 시

```
GET /sessions/{id}/messages → MessageResponse[] (chartData 없음)
→ DisplayMessage.chartData = undefined
→ ChartSection 미렌더링 (기존 동작 유지)
```

---

## 4. 컴포넌트 상세

### 4.1 AgentChart

**파일**: `components/agent/agent-chart.tsx`

**지시어**: `"use client"` (Recharts는 브라우저 DOM API 필요)

**Props**:

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `data` | `ChartData` | O | 단일 차트 데이터 |

**렌더링 로직**:

```
data.chartType === "pie"
  → ResponsiveContainer (width="100%", height={300})
    → PieChart
      → Pie (data={data.dataPoints}, dataKey="value", nameKey="label")
        → Cell[] (fill={CHART_COLORS[index % CHART_COLORS.length]})
      → Tooltip
      → Legend

data.chartType === "bar"
  → ResponsiveContainer (width="100%", height={300})
    → BarChart (data={data.dataPoints})
      → XAxis (dataKey="label", tick={{ fontSize: 12 }})
      → YAxis
      → Tooltip
      → Bar (dataKey="value")
        → Cell[] (fill={CHART_COLORS[index % CHART_COLORS.length]})
```

**차트 색상 팔레트**:

```typescript
const CHART_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];
```

**메타데이터 표시**:

차트 아래에 메타데이터를 텍스트로 표시:

```
Period: 2026-01-01 ~ 2026-03-21 | Total: 243
```

- `startDate`와 `endDate` 모두 null이면: `Period: All period`
- `startDate`만 있으면: `Period: 2026-01-01 ~`
- `endDate`만 있으면: `Period: ~ 2026-03-21`
- 둘 다 있으면: `Period: 2026-01-01 ~ 2026-03-21`

**컨테이너 스타일**:

```tsx
<div className="brutal-border bg-white p-4">
  <h4 className="mb-3 text-sm font-bold">{data.title}</h4>
  {/* Recharts */}
  <p className="mt-2 text-xs text-muted-foreground">
    Period: {formatPeriod(data.meta)} | Total: {data.meta.totalCount.toLocaleString()}
  </p>
</div>
```

**타입 가드**:

렌더링 전 `data.dataPoints`가 배열이고 길이가 0보다 큰지 검증한다. 검증 실패 시 `null`을 반환한다.

```typescript
if (!data.dataPoints || !Array.isArray(data.dataPoints) || data.dataPoints.length === 0) {
  return null;
}
```

### 4.2 ChartSection

**파일**: `components/agent/chart-section.tsx`

**Props**:

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `chartData` | `ChartData[]` | O | 차트 데이터 배열 |

**동작**:
- `chartData`가 빈 배열이면 `null` 반환 (아무것도 렌더링하지 않음)
- 배열의 각 항목에 대해 `AgentChart`를 렌더링

**레이아웃**:

```tsx
if (chartData.length === 0) return null;

return (
  <div className="mt-3 space-y-3">
    {chartData.map((chart, index) => (
      <AgentChart key={index} data={chart} />
    ))}
  </div>
);
```

### 4.3 agent-message-bubble.tsx 수정

**수정 위치**: ASSISTANT 메시지 분기의 ReactMarkdown과 AgentExecutionMeta 사이

**현재 Props 인터페이스** (개별 props 방식):

```typescript
interface Props {
  role: MessageRole;
  content: string;
  createdAt: string;
  executionMeta?: ExecutionMeta;
  failed?: boolean;
  onRetry?: () => void;
  // chartData?: ChartData[];  ← 추가 필요
}
```

**수정 전** (failed 블록과 타임스탬프 사이):
```tsx
{!isUser && executionMeta && (
  <AgentExecutionMeta meta={executionMeta} />
)}

<p className={`mt-1 font-mono text-xs ${isUser ? "text-white/70" : "text-muted-foreground"}`}>
  {formatTimestamp(createdAt)}
</p>
```

**수정 후**:
```tsx
{!isUser && chartData && chartData.length > 0 && (
  <ChartSection chartData={chartData} />
)}

{!isUser && executionMeta && (
  <AgentExecutionMeta meta={executionMeta} />
)}

<p className={`mt-1 font-mono text-xs ${isUser ? "text-white/70" : "text-muted-foreground"}`}>
  {formatTimestamp(createdAt)}
</p>
```

> **참고**: 버블 레벨의 `chartData.length > 0` 체크는 컴포넌트 인스턴스화를 방지하는 최적화이다. `ChartSection` 내부에도 빈 배열 가드가 있으나 이는 방어적 중복이다.

### 4.4 types/agent.ts 수정

추가할 타입:
- `ChartData` 인터페이스
- `ChartMeta` 인터페이스
- `DataPoint` 인터페이스
- `AgentExecutionResult`에 `chartData: ChartData[]` 필드
- `DisplayMessage`에 `chartData?: ChartData[]` 필드

### 4.5 app/agent/page.tsx 수정

Agent 실행 결과를 `DisplayMessage`로 변환하는 부분에서 `chartData`를 매핑:

```typescript
// Agent 실행 결과 → ASSISTANT DisplayMessage 생성 시
const assistantMessage: DisplayMessage = {
  id: `assistant-${Date.now()}`,
  role: "ASSISTANT",
  content: result.summary,
  createdAt: new Date().toISOString(),
  executionMeta: {
    success: result.success,
    toolCallCount: result.toolCallCount,
    analyticsCallCount: result.analyticsCallCount,
    executionTimeMs: result.executionTimeMs,
    errors: result.errors,
  },
  chartData: result.chartData,  // 추가
};
```

대화 이력 로드 시에는 `chartData`를 설정하지 않는다 (서버에서 `chartData`를 저장하지 않으므로 undefined).

---

## 5. 디자인 가이드

### 차트 컨테이너

| 속성 | 값 |
|------|------|
| Border | `brutal-border` (2px solid #000000) |
| Background | `bg-white` (#FFFFFF) |
| Padding | `p-4` (16px) |
| Border radius | 0 (Neo-Brutalism 직각) |
| Margin top | `mt-3` (12px, Markdown과의 간격) |
| 차트 간 간격 | `space-y-3` (12px) |

### 차트 크기

| 항목 | 값 |
|------|------|
| Width | 100% (ResponsiveContainer) |
| Height | 300px (고정) |
| 최소 너비 | 없음 (메시지 버블 max-w-[85%] 내에서 자연스럽게 축소) |

### 차트 제목

```
font-size: text-sm (14px)
font-weight: font-bold
margin-bottom: mb-3
color: 기본 (--foreground, #000000)
```

### 차트 메타데이터

```
font-size: text-xs (12px)
color: text-muted-foreground
margin-top: mt-2
```

### 차트 색상 팔레트

8색 팔레트로 데이터 포인트를 순환 적용:

| Index | Color | Hex |
|-------|-------|-----|
| 0 | Blue (Primary) | `#3B82F6` |
| 1 | Red | `#EF4444` |
| 2 | Green | `#10B981` |
| 3 | Yellow | `#F59E0B` |
| 4 | Purple | `#8B5CF6` |
| 5 | Pink | `#EC4899` |
| 6 | Cyan | `#06B6D4` |
| 7 | Orange | `#F97316` |

### Recharts 스타일 설정

- Tooltip: Recharts 기본 스타일 사용 (커스텀 불필요)
- Legend: Recharts 기본 Legend 사용
- XAxis/YAxis: 기본 스타일, `tick={{ fontSize: 12 }}`
- Pie: `outerRadius={100}`, `label` prop으로 값 표시

---

## 6. 보안 사항

### 데이터 신뢰성

`chartData`는 백엔드의 `AnalyticsToolAdapter`가 MongoDB 집계 결과로부터 생성한 구조화 데이터이다. LLM이 직접 생성한 텍스트(Mermaid 등)와 달리, 서버에서 타입이 보장된 데이터이므로 상대적으로 안전하다.

그러나 `label` 필드는 MongoDB 도큐먼트의 필드값(예: provider 이름)이므로, 이론적으로 예상 외 문자열이 포함될 수 있다.

### Recharts 보안 모델

Recharts는 모든 차트 요소를 React 컴포넌트(SVG)로 렌더링한다. `dangerouslySetInnerHTML`을 사용하지 않으므로 XSS 위험이 기본적으로 차단된다. `label` 문자열은 React의 기본 escape 메커니즘을 거쳐 SVG 텍스트 노드로 렌더링된다.

### 런타임 타입 가드

`AgentChart` 컴포넌트에서 렌더링 전 방어적 검증을 수행:

```typescript
// chartType 검증
if (data.chartType !== "pie" && data.chartType !== "bar") return null;

// dataPoints 검증
if (!Array.isArray(data.dataPoints) || data.dataPoints.length === 0) return null;
```

이 가드는 네트워크 응답이 예상 스키마와 다를 때 (API 버전 불일치 등) 런타임 에러를 방지한다.

---

## 7. 기술 구현 사항

### 설치할 패키지

```bash
cd admin
npm install recharts
```

Recharts는 React 18/19 호환이며 D3 기반이다. 추가 피어 의존성 없음.

### 파일 구조

```
admin/src/
├── components/
│   └── agent/
│       ├── agent-chart.tsx         ← 신규 (차트 렌더링)
│       ├── chart-section.tsx       ← 신규 (차트 섹션 레이아웃)
│       ├── agent-message-bubble.tsx ← 수정 (ChartSection 통합)
│       └── ... (기존 파일 변경 없음)
├── types/
│   └── agent.ts                    ← 수정 (ChartData 타입 추가)
└── app/
    └── agent/page.tsx              ← 수정 (chartData → DisplayMessage 매핑)
```

### Recharts SSR 제약 및 처리

Recharts는 브라우저 DOM API(`window`, `document`)에 의존하므로 서버 사이드 렌더링에서 실행할 수 없다.

**처리 방법**: `agent-chart.tsx`에 `"use client"` 지시어를 선언한다. Next.js App Router에서 `"use client"` 컴포넌트는 서버에서 HTML로 프리렌더링되지만, Recharts의 SVG 생성은 클라이언트 hydration 시 실행된다.

만약 SSR 프리렌더링 단계에서 에러가 발생하면, `next/dynamic`의 `ssr: false` 옵션으로 동적 import를 사용한다:

```typescript
// 대안: SSR 에러 발생 시
import dynamic from "next/dynamic";
const AgentChart = dynamic(() => import("./agent-chart"), { ssr: false });
```

기본적으로 `"use client"`만으로 충분하며, 문제 발생 시에만 `dynamic` import를 적용한다.

---

## 8. 접근성

### 차트 대체 텍스트

각 `AgentChart` 컨테이너에 `role="img"`와 `aria-label`을 설정하여 스크린 리더가 차트 내용을 전달할 수 있게 한다:

```tsx
<div
  className="brutal-border bg-white p-4"
  role="img"
  aria-label={`${data.title}. Total: ${data.meta.totalCount}`}
>
```

### 데이터 접근성

차트의 원본 데이터는 `summary`의 Markdown 표에도 포함되어 있다 (LLM이 Markdown 표와 Mermaid를 함께 생성). 스크린 리더 사용자는 Markdown 표를 통해 데이터에 접근할 수 있다.

### 색상 대비

차트 색상 팔레트의 8색은 모두 흰색 배경(`#FFFFFF`) 위에서 WCAG 2.1 AA 기준의 대비를 충족한다. Recharts `Legend`와 `Tooltip`에서 색상과 함께 레이블 텍스트가 표시되므로 색맹 사용자도 데이터를 구분할 수 있다.

---

## 9. 범위 제한

### 포함

| 항목 | 설명 |
|------|------|
| `ChartData` 타입 정의 | `types/agent.ts`에 ChartData, ChartMeta, DataPoint 추가 |
| `AgentExecutionResult` 업데이트 | `chartData: ChartData[]` 필드 추가 |
| `DisplayMessage` 업데이트 | `chartData?: ChartData[]` 필드 추가 |
| `AgentChart` 컴포넌트 | Recharts 기반 pie/bar 차트 렌더링 |
| `ChartSection` 컴포넌트 | chartData 배열 → AgentChart 나열 |
| 메시지 버블 통합 | ASSISTANT 버블에 ChartSection 추가 |
| `page.tsx` 매핑 | result.chartData → DisplayMessage.chartData |
| Recharts 패키지 설치 | `npm install recharts` |

### 미포함

| 항목 | 사유 |
|------|------|
| Mermaid 렌더링 | 별도 PRD 007에서 처리 |
| 차트 내보내기 (PNG/PDF) | 현재 요구사항 없음, 오버엔지니어링 |
| 차트 유형 전환 UI | 서버에서 chartType을 결정하므로 불필요 |
| 데이터 테이블 토글 | summary의 Markdown 표로 대체 |
| 차트 애니메이션 커스터마이징 | Recharts 기본 애니메이션 사용 |
| 차트 줌/팬 | 오버엔지니어링 |
| 차트 데이터 영속화 | 서버에서 chartData를 저장하지 않는 설계 (summary만 저장) |
| 스트리밍/SSE | Agent 응답은 동기 방식, 미지원 |

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-03-21
