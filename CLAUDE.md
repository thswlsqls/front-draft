# CLAUDE.md — Project Root

## Global Prompt Rules

All prompts, implementations, and design decisions MUST follow these principles:

### 1. No Overengineering
- Implement only what is explicitly required. Do not add features, abstractions, or configurations beyond the current scope.
- Three similar lines of code is better than a premature abstraction.
- Do not add error handling, fallbacks, or validation for scenarios that cannot happen.
- Do not design for hypothetical future requirements.

### 2. Trusted Sources Only
- Reference **only** official documentation and verified technical papers from reputable sources.
- Official technical documentation: framework/library docs (e.g., Next.js, React, Tailwind, Mermaid.js).
- Verified technical papers: peer-reviewed or from recognized institutions/organizations.
- Do NOT rely on blog posts, Stack Overflow answers, tutorials, or AI-generated content as authoritative sources.

### 3. Industry-Standard Best Practices
- Verify all designs and implementations against industry-standard best practices before proceeding.
- Security: OWASP Top 10, CSP, XSS prevention, input sanitization at system boundaries.
- Performance: code splitting, lazy loading, minimal bundle size.
- Accessibility: semantic HTML, ARIA attributes, keyboard navigation.
- Follow framework-specific best practices (Next.js App Router conventions, React hooks rules, etc.).

### 4. Clean Code Principles
- All implementations must adhere to clean code principles to the maximum extent.
- Meaningful naming: variables, functions, components should be self-documenting.
- Single Responsibility: each function/component does one thing well.
- DRY: eliminate duplication, but not at the cost of readability.
- Small functions: prefer focused, composable units over large monoliths.
- Consistent formatting: follow the existing codebase style.

## Project Structure

```
tech-n-ai-frontend/
├── admin/          # Admin App (Next.js 16 — internal management)
├── app/            # User App (Next.js 16 — public-facing)
├── docs/           # Documentation (PRDs, API specs, prompts, etc.)
└── CLAUDE.md       # This file (project-wide rules)
```

## tmux Development Environment

`./scripts/tmux-frontend.sh`로 사전 구성된 tmux 세션을 실행한다. 이미 세션이 존재하면 자동 attach.

### 세션 구조 (frontend-session)

```
frontend-session
├── app    [0]  ← app/    (port 3000, 사용자 앱)
└── admin  [1]  ← admin/  (port 3001, 관리자 앱)
```

각 윈도우는 동일한 3-pane 레이아웃:
```
┌──────────────────┬──────────────────┐
│                  │  dev-pane (25%)  │
│  claude-pane     │  npm run dev     │
│  (50%)           ├──────────────────┤
│  Claude Code     │  tool-pane (25%) │
│  코드 작업       │  lint, git 등    │
└──────────────────┴──────────────────┘
```

### 주요 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl-b 0/1` | app / admin 윈도우 이동 |
| `Ctrl-b o` | 다음 pane 전환 |
| `Ctrl-b 방향키` | 방향으로 pane 이동 |
| `Ctrl-b z` | 현재 pane 전체화면 토글 |
| `Ctrl-b d` | 세션 분리 (백그라운드 유지) |

### Backend 세션과 함께 사용

```bash
# 세션 간 전환
Ctrl-b s    # 세션 목록에서 선택
Ctrl-b (    # 이전 세션
Ctrl-b )    # 다음 세션
```

### 세션 관리

```bash
tmux attach -t frontend-session      # 재연결
tmux kill-session -t frontend-session # 종료
tmux ls                               # 세션 목록
```

### 참고 문서

- `scripts/tmux-dev-guide.md` — 활용 가이드 및 예시
- `scripts/tmux-recommended-layouts.md` — 대안 레이아웃 구조
- `scripts/tmux-overview.md` — tmux 기본 개념

## Conventions

- **Language**: Korean for documentation, English for code and UI text.
- **Package manager**: npm
- **Git commit style**: `type : [branch] description` (e.g., `feat : [main] JWT token security`)
