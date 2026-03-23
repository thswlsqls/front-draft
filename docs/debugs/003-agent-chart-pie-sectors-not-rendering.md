# Agent 통계 도표(Pie Chart) 렌더링 실패

## 상태: Resolved

## 날짜: 2026-03-23

## 대상 모듈

- **Backend**: `tech-n-ai-backend/api/agent` — `ChartData.DataPoint` 직렬화
- **Frontend**: `tech-n-ai-frontend/admin/src/components/agent/agent-chart.tsx` — Recharts PieChart 렌더링

## 재현 경로

1. Admin (`http://localhost:3001/agent`) 접속
2. 새 세션 생성
3. Goal 입력: "Provider별 수집 현황을 통계로 보여주세요"
4. Agent 응답 수신 후 차트 영역 확인

## 증상

- Assistant 메시지의 마크다운 테이블(텍스트)은 정상 출력
- 차트 컨테이너(타이틀, Legend, Period/Total 텍스트)는 렌더링됨
- **Pie 섹터(원형 조각)가 표시되지 않음** — 큰 빈 흰색 영역만 보임
- SVG 요소 검사 시 `<g class="recharts-pie">` 내부에 `<path>` 요소 없음
- `/test-chart` 페이지에서는 동일한 `AgentChart` 컴포넌트가 정상 동작

## 근본 원인

### Jackson 3 (Spring Boot 4)의 `long` → JSON 문자열 직렬화

Backend `ChartData.DataPoint` Java record:

```java
public record DataPoint(
    String label,
    long value    // Java long 타입
) {}
```

Jackson 3 (`tools.jackson 3.0.4`)가 `long` 값을 JSON **문자열**로 직렬화:

```json
// 기대값 (숫자)
{"label": "OPENAI", "value": 130}

// 실제 응답 (문자열)
{"label": "OPENAI", "value": "130"}
```

### Recharts 3.x의 문자열 값 처리

Recharts `Pie` 컴포넌트는 `dataKey="value"`로 데이터를 읽을 때 **숫자 타입만** 유효한 섹터로 처리함. 문자열 `"130"`은 무시되어 `<path>` 요소가 생성되지 않음. Legend는 데이터 이름(`nameKey`)만 사용하므로 정상 표시됨.

### 테스트 페이지와의 차이

| 항목 | `/test-chart` 페이지 | `/agent` 페이지 |
|------|---------------------|-----------------|
| 데이터 소스 | TypeScript 하드코딩 (`value: 130`) | Backend API 응답 (`"value": "130"`) |
| value 타입 | `number` | `string` (Jackson 직렬화) |
| Pie 섹터 렌더링 | 정상 | 실패 |

## 디버깅 과정

### 1단계: 초기 가설 — 애니메이션 타이밍 (오진)

- 프론트엔드 console.log에서 컴포넌트가 `width: 284, dataPoints: Array(4)`로 정상 렌더링 시도 확인
- Agent 페이지에서 부모 re-render가 10회 이상 발생하여 Recharts 애니메이션이 반복 리셋될 것으로 추정
- `useMemo`로 `coloredData` 메모이제이션 → 미해결

### 2단계: 가설 — auto-scroll 타이밍 (오진)

- `useEffect` → `useLayoutEffect` 변경으로 차트 높이 확보 타이밍 개선 시도
- 차트 높이가 auto-scroll 전에 확정되지 않아 뷰포트 밖으로 밀린다고 추정
- `useState(0)` → `useState(DEFAULT_WIDTH)` + 조건부 렌더링 제거 → 미해결

### 3단계: 가설 — 애니메이션 자체 문제 (오진)

- `isAnimationActive={false}` 적용 → 미해결
- 이 시점에서 애니메이션이 원인이 아님을 확인

### 4단계: SVG DOM 검사로 전환점

- 브라우저 DevTools Elements 탭에서 SVG 구조 직접 확인
- `<g class="recharts-pie">` 내부가 **완전히 비어있음** (path 요소 없음)
- Recharts가 데이터를 받았지만 섹터를 생성하지 않는 것 = **데이터 타입 문제** 가능성 부상

### 5단계: 데이터 형식 검증 — 근본 원인 발견

- `console.log(JSON.stringify(coloredData))` 추가
- 출력: `[{"label":"OPENAI","value":"130","fill":"#3B82F6"}, ...]`
- `value`가 **문자열** `"130"`임을 확인 → Recharts가 숫자가 아닌 값을 무시하여 섹터 미생성

## 수정 내용

### Frontend 수정 (`agent-chart.tsx`)

`coloredData` 생성 시 `value`를 명시적으로 `Number()`로 변환:

```typescript
const coloredData = useMemo(
  () =>
    data.dataPoints.map((dp, i) => ({
      ...dp,
      value: Number(dp.value),
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })),
  [data.dataPoints],
);
```

### 추가 변경 사항

| 변경 | 이유 |
|------|------|
| `useEffect` → `useLayoutEffect` | 차트 width를 paint 전에 설정하여 레이아웃 깜빡임 방지 |
| `useMemo` for `coloredData` | 부모 re-render 시 불필요한 배열 재생성 방지 |
| `useState(DEFAULT_WIDTH)` | 초기 렌더부터 차트 높이 확보하여 auto-scroll 정확도 개선 |
| `Number(data.meta.totalCount)` | `totalCount`도 동일한 문자열 직렬화 가능성 대비 |
| `console.log` 전체 제거 | 프로덕션 콘솔 노이즈 제거 |

## 수정 파일

- `tech-n-ai-frontend/admin/src/components/agent/agent-chart.tsx`

## 미해결 사항 (Backend)

Jackson 3 (`tools.jackson 3.0.4`)가 Java `long`을 JSON 문자열로 직렬화하는 근본 원인 조사 필요:

- `ChartData.DataPoint.value` (`long`) → `"130"` (문자열)
- `ChartData.ChartMeta.totalCount` (`long`) → 문자열 가능성
- `StatisticsDto.GroupCount.count` (`long`) → 문자열 가능성

가능한 원인:
1. Jackson 3의 기본 동작 변경 (`long` → string safety)
2. Spring Boot 4의 `ObjectMapper` 설정에서 `WRITE_NUMBERS_AS_STRINGS` 활성화
3. `@JsonInclude` 또는 기타 Jackson 어노테이션 영향

권장 조치: Backend에서 `long` 필드가 JSON 숫자로 직렬화되도록 Jackson 설정 확인 및 수정. 이 경우 Frontend의 `Number()` 변환은 방어적 코드로 유지 권장.

## 교훈

1. **API 응답의 실제 데이터 타입을 항상 검증해야 함** — TypeScript 인터페이스가 `number`로 선언되어도 런타임에 `string`이 올 수 있음
2. **차트 라이브러리는 타입에 엄격함** — Recharts는 `dataKey`로 추출한 값이 숫자가 아니면 에러 없이 무시함
3. **동일 컴포넌트가 한 곳에서 되고 다른 곳에서 안 될 때** — 컴포넌트 자체가 아닌 데이터 소스의 차이를 의심해야 함
4. **Jackson 메이저 버전 업그레이드 시 직렬화 동작 변경에 주의** — Jackson 2 → 3에서 `long` 직렬화 정책이 변경됨
