# 추천 tmux 레이아웃 구조 (Frontend)

> 현재 구조(app/admin 윈도우 × claude/build pane) 외에 고려할 수 있는 대안 구조들

## 1. 공통 작업 윈도우 추가 (Hybrid) — 가장 추천

현재 구조를 유지하면서 공용 윈도우를 추가하는 방식.

```
frontend-session
├── shared-window        # 공통 컴포넌트, 유틸리티, 타입 작업
│   ├── claude-pane
│   └── build-pane
├── app-window
│   ├── claude-pane
│   └── dev-pane         # npm run dev (port 3000)
└── admin-window
    ├── claude-pane
    └── dev-pane         # npm run dev (port 3001)
```

**장점**: 공통 컴포넌트나 타입 정의 작업 시 별도 공간이 있어 app/admin 윈도우의 dev 서버를 방해하지 않는다.
**단점**: 윈도우 1개 추가.

## 2. 역할 기반 구조 (Role-Based)

```
frontend-session
├── code-window          # Claude Code 전용
│   └── 단일 pane (app/admin 이동하며 작업)
├── dev-window           # dev 서버 실행 전용
│   ├── app-pane         # npm run dev (port 3000)
│   └── admin-pane       # npm run dev (port 3001)
└── quality-window       # 품질 도구 전용
    ├── lint-pane        # npm run lint
    └── type-check-pane  # npx tsc --noEmit
```

**장점**: dev 서버를 한 윈도우에서 동시에 볼 수 있다. 윈도우 수가 적다.
**단점**: 코딩 시 모듈 컨텍스트가 혼재된다.
**적합**: app과 admin 간 공유 코드를 동시에 수정하는 경우.

## 3. 3-pane 레이아웃

pane을 2개가 아닌 3개로 분할하는 방식.

```
frontend-session
├── app-window
│   ├── claude-pane (좌, 50%)
│   ├── dev-pane (우상, 25%)    # npm run dev
│   └── tool-pane (우하, 25%)   # lint, type-check, git
└── admin-window
    ├── claude-pane (좌, 50%)
    ├── dev-pane (우상, 25%)
    └── tool-pane (우하, 25%)
```

**장점**: dev 서버를 항상 띄워둔 상태에서 빌드/린트도 별도 pane에서 실행 가능.
**단점**: pane이 좁아져 가독성이 떨어질 수 있다. 넓은 화면 필요.
**적합**: 외부 모니터(27인치 이상)를 사용하는 환경.

## 4. 멀티 세션 + Backend 연동

Backend 세션과 함께 운영하는 전체 개발 환경 구조.

```
# 세션 1: frontend-session (현재 스크립트)
# 세션 2: backend-session (backend 스크립트)
# 세션 3: infra-session
infra-session
├── docker-window        # docker compose up
├── db-window            # DB 클라이언트
└── api-test-window      # curl / httpie 로 API 테스트
```

**장점**: `Ctrl-b (` / `Ctrl-b )`로 세션 간 전환. 목적별 완전 분리.
**단점**: 세션이 3개로 관리 복잡도 증가.
**적합**: 풀스택 개발 시 모든 계층을 동시에 띄워야 하는 경우.

## 구조 선택 가이드

| 작업 패턴 | 추천 구조 |
|-----------|-----------|
| app 또는 admin 단일 집중 | 현재 구조 |
| 공통 컴포넌트 작업 병행 | Hybrid (shared 윈도우 추가) |
| 넓은 모니터, dev 서버 상시 확인 | 3-pane |
| 풀스택 동시 개발 | 멀티 세션 |
