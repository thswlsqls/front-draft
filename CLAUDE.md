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

Run `./scripts/tmux-frontend.sh` to launch a pre-configured tmux session with per-app windows (app, admin), each split into claude-pane and build-pane. See `scripts/tmux-dev-guide.md` for usage details and `scripts/tmux-overview.md` for tmux fundamentals.

## Conventions

- **Language**: Korean for documentation, English for code and UI text.
- **Package manager**: npm
- **Git commit style**: `type : [branch] description` (e.g., `feat : [main] JWT token security`)
