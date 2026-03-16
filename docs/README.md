# Tech N AI — Documentation

프로젝트 기획, API 설계, 프롬프트, 운영 기록 등 모든 문서를 관리하는 디렉토리입니다.

## 디렉토리 구조

```
docs/
├── API-specifications/     # 백엔드 API 명세서
├── PRDS/                   # 제품 요구사항 정의서 (PRD)
├── prompts/                # PRD 생성용 LLM 프롬프트
├── remind/                 # 보류 중인 작업·개선 사항
├── bugs/                   # 버그 기록 및 원인 분석
├── sql/                    # 데이터베이스 초기화 스크립트
└── CLAUDE.md               # 문서 작성 규칙 및 네이밍 컨벤션
```

## API 명세서 (`API-specifications/`)

백엔드 서비스별 REST API 설계 문서입니다.

| 파일 | 도메인 |
|---|---|
| `API-SPECIFICATION.md` | 전체 API 명세 (게이트웨이, JWT, CORS, 공통 응답 구조) |
| `api-auth-specification.md` | 인증 (회원가입, 로그인, OAuth, 비밀번호 재설정) |
| `api-emerging-tech-specification.md` | 신기술 동향 (목록 조회, 검색, 필터링) |
| `api-bookmark-specification.md` | 북마크 (CRUD, 이력, 소프트 삭제) |
| `api-chatbot-specification.md` | 챗봇 (세션 관리, 메시지, RAG) |
| `api-agent-specification.md` | AI Agent (실행, 세션, 메시지) |

### 챗봇 설계 문서 (`API-specifications/api-chatbot/`)

| 파일 | 내용 |
|---|---|
| `1-emerging-tech-rag-redesign.md` | RAG 시스템 재설계 |
| `2-hybrid-search-score-fusion-design.md` | 하이브리드 검색 및 점수 융합 알고리즘 |
| `3-session-title-generation-design.md` | 세션 타이틀 자동 생성 로직 |

## PRD (`PRDS/`)

기능별 제품 요구사항 정의서입니다.

| 번호 | 기능 |
|---|---|
| 001 | 신기술 동향 랜딩 페이지 (카드 그리드, 필터, 검색, 상세 모달) |
| 002 | 인증 (회원가입, 로그인, OAuth, 토큰, 비밀번호 재설정) |
| 003 | 북마크 (목록, 상세, 수정, 삭제, 휴지통, 검색, 이력, 복원) |
| 004 | 챗봇 RAG 멀티턴 세션 및 소스 인용 |
| 004-1 | 세션 타이틀 표시 및 인라인 수정 |
| 005 | 관리자 앱 계정 관리 |
| 006 | Agent 실행 페이지 및 네비게이션 |
| 007 | Mermaid 차트 렌더링 |

## 프롬프트 (`prompts/`)

API 명세서를 입력으로 받아 PRD를 자동 생성하기 위한 LLM 프롬프트 템플릿입니다. 각 PRD에 대응하는 프롬프트가 1:1로 존재합니다.

## 보류 항목 (`remind/`)

백엔드 API 변경 등의 이유로 보류 중인 작업입니다.

| 번호 | 내용 |
|---|---|
| 002 | Agent 실행 진행 표시 — SSE 기반 실시간 단계/도구/진행률 |
| 003 | Agent 실행 메타 정보 표시 범위 (신규 실행만 해당, 히스토리 미지원) |

## 버그 기록 (`bugs/`)

| 파일 | 내용 |
|---|---|
| `001-auth-email-unique-constraint-on-re-registration.md` | 계정 삭제 후 동일 이메일 재가입 불가 (unique constraint) |
| `002-password-reset-link-method-not-allowed.md` | 비밀번호 재설정 엔드포인트 Method Not Allowed |
| `google-oauth-disabled-client.md` | Google OAuth 클라이언트 설정 이슈 |

## SQL 스크립트 (`sql/`)

| 파일 | 내용 |
|---|---|
| `001-insert-oauth-providers.sql` | OAuth 제공사 초기 데이터 삽입 (Google 활성, Kakao/Naver 비활성) |

## 문서 작성 규칙

자세한 네이밍 컨벤션 및 문서 형식은 [`CLAUDE.md`](./CLAUDE.md)를 참조하세요.

- **언어**: 한국어 (기술 용어는 영어 유지)
- **파일 번호**: 3자리 순번 (`001`, `002`, ...), 하위 기능은 하이픈-소수점 (`004-1`)
- **PRD 구조**: 메타데이터 → 개요 → 아키텍처 → 컴포넌트 → 보안 → 성능 → 스타일링 → 구현 → 범위
