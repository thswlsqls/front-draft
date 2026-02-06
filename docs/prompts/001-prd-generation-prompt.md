# Emerging Tech 랜딩 페이지 PRD 작성 프롬프트

---

## 사용법

아래 프롬프트를 LLM에 입력하여 PRD를 생성한다. `<api-spec>` 영역에 API 설계서 전문을 삽입한다.

---

## 프롬프트

```
당신은 시니어 프론트엔드 프로덕트 매니저입니다. 아래 제공하는 API 설계서와 요구사항을 기반으로 프론트엔드 PRD(Product Requirements Document)를 작성하세요.

# 역할
- 프론트엔드 PRD 작성 전문가
- API 스펙을 읽고 프론트엔드 관점의 요구사항으로 변환

# 입력 자료

<api-spec>
{여기에 docs/API-specifications/api-emerging-tech-specification.md 전문 삽입}
</api-spec>

# 프로젝트 기본 정보

| 항목 | 내용 |
|------|------|
| 기술 스택 | Next.js (App Router) + shadcn/ui |
| 디자인 테마 | Neo-Brutalism |
| 색상 테마 | Blue (#3B82F6 계열), Black (#000000) |
| API Gateway | http://localhost:8081 (모든 API 요청은 이 포트로 전송) |
| 인증 | 불필요 (공개 API만 사용) |
| 대상 페이지 | 단일 랜딩 페이지 (`/`) |

# 기능 요구사항

## F1. 목록 조회
- emerging-tech 데이터를 카드 형태로 그리드 배치하여 조회
- 사용 API: `GET /api/v1/emerging-tech`
- 페이지네이션 포함 (API 응답의 pageNumber, pageSize, totalCount 기반)

## F2. 상세 조회
- 카드 클릭 시 모달 형태로 상세 정보 표시
- 사용 API: `GET /api/v1/emerging-tech/{id}`
- 모달에 표시할 필드: title, provider, updateType, sourceType, publishedAt, summary, url(원본 링크), metadata(tags, version, author, githubRepo)

## F3. 필터 조회
- 사용 API: `GET /api/v1/emerging-tech` 의 Query Parameters 활용
- 필터 항목:
  - provider: 탭 UI로 선택 (전체/OPENAI/ANTHROPIC/GOOGLE/META/XAI)
  - updateType: 탭 UI로 선택 (전체/MODEL_RELEASE/API_UPDATE/SDK_RELEASE/PRODUCT_LAUNCH/PLATFORM_UPDATE/BLOG_POST)
  - sourceType: 탭 UI로 선택 (전체/GITHUB_RELEASE/RSS/WEB_SCRAPING)
  - 날짜 기간: startDate ~ endDate (publishedAt 기준, YYYY-MM-DD 형식)
- 필터 간 AND 조건으로 동시 적용
- 필터 변경 시 page=1로 초기화

## F4. 텍스트 검색
- 사용 API: `GET /api/v1/emerging-tech/search?q={검색어}`
- Header 영역에 검색 입력창 배치
- 검색 활성화 시 필터 바 비활성화 (별도 API 엔드포인트이므로)

# 출력 형식

아래 구조를 따라 PRD를 작성하세요. 각 섹션은 반드시 포함되어야 합니다.

## PRD 구조

1. **개요**: 프로젝트 기본 정보 테이블 (기술 스택, 디자인 테마, 색상, Gateway, 인증 여부)
2. **API 연동**: 사용하는 공개 API 엔드포인트 목록, 각 API의 요청 파라미터와 응답 필드 정리
3. **페이지 구조**: 전체 레이아웃을 ASCII 와이어프레임으로 시각화. Header, 필터 바, 카드 그리드, 페이지네이션 영역 구분
4. **컴포넌트 상세**:
   - Header/검색 바: 동작 규칙
   - 필터 바: 각 필터(provider 탭, updateType 탭, sourceType 탭, 날짜 기간) 동작 규칙
   - 카드: 표시 필드, 레이아웃
   - 상세 모달: 표시 필드, 트리거 조건
   - 페이지네이션: 동작 규칙
5. **디자인 가이드**: Neo-Brutalism 스타일 규칙 (테두리, 그림자, 색상 팔레트, 컴포넌트별 스타일)
6. **기술 구현 사항**: 프로젝트 디렉토리 구조, API 호출 방식, 상태 관리 방향, Enum 상수 정의
7. **범위 제한**: 포함/미포함 항목 명시

# 제약 조건

- 공개 API(GET 3개)만 사용한다. 내부 API(POST, 인증 필요)는 범위에서 제외한다.
- 오버엔지니어링하지 않는다. 요구사항에 명시되지 않은 기능(다크 모드, 다국어, 인증 등)을 추가하지 않는다.
- API 스펙에 정의된 필드명, 파라미터명, Enum 값을 그대로 사용한다. 임의로 변경하지 않는다.
- 디자인 테마(Neo-Brutalism)의 핵심 특징을 구체적 CSS 값으로 명시한다 (border 두께, shadow 값, 색상 코드 등).
- 프로젝트 구조는 Next.js App Router 컨벤션을 따른다.
```

---

## 프롬프트 엔지니어링 기법 설명

| 기법 | 적용 위치 | 설명 |
|------|----------|------|
| Role Prompting | `# 역할` | LLM에 시니어 PM 역할을 부여하여 전문적 관점 유도 |
| Structured Input | `<api-spec>` 태그 | API 설계서를 명확한 경계로 구분하여 제공 |
| Explicit Output Format | `# 출력 형식` > `## PRD 구조` | 7개 섹션 구조를 번호로 지정하여 누락 방지 |
| Constraint Specification | `# 제약 조건` | 오버엔지니어링 방지, 범위 제한을 명시적으로 선언 |
| Few-shot Context | `# 기능 요구사항` F1~F4 | 구체적 기능을 코드 번호로 나열하여 모호성 제거 |
| Grounding | `# 프로젝트 기본 정보` 테이블 | 기술 스택, 색상 코드 등 사실 기반 정보를 고정값으로 제공 |
