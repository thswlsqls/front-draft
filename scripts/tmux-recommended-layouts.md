
# 추천 tmux 레이아웃 구조 (Frontend)

> 현재 구조(app/admin 윈도우 × 3-pane) 외에 고려할 수 있는 대안 구조들

## 1. 2-pane 레이아웃 (Simple)

pane을 2개로 단순화하는 방식.

```
frontend-session
├── app-window
│   ├── claude-pane (좌, 50%)
│   └── build-pane (우, 50%)     # dev 서버 또는 빌드
└── admin-window
    ├── claude-pane (좌, 50%)
    └── build-pane (우, 50%)
```

**장점**: pane이 넓어 가독성이 좋다. 구조가 단순하다.
**단점**: dev 서버 실행 중 빌드/린트를 동시에 확인하려면 서버를 중단해야 한다.
**적합**: 작은 화면(노트북 내장 디스플레이)에서 작업하는 경우.

## 2. 공통 작업 윈도우 추가 (Hybrid)

현재 구조를 유지하면서 공용 윈도우를 추가하는 방식.

```
frontend-session
├── shared-window        # 공통 컴포넌트, 유틸리티, 타입 작업
│   ├── claude-pane
│   └── build-pane
├── app-window
│   ├── claude-pane
│   ├── dev-pane         # npm run dev (port 3000)
│   └── tool-pane
└── admin-window
    ├── claude-pane
    ├── dev-pane         # npm run dev (port 3001)
    └── tool-pane
```

**장점**: 공통 컴포넌트나 타입 정의 작업 시 별도 공간이 있어 app/admin 윈도우의 dev 서버를 방해하지 않는다.
**단점**: 윈도우 1개 추가.

## 3. 역할 기반 구조 (Role-Based)

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

## 4. 멀티 세션 + Backend 연동

Backend 세션(project/module/test 구조)과 함께 운영하는 전체 개발 환경 구조.

```
# 세션 1: frontend-session (현재 스크립트)
# 세션 2: backend-session (project/module/test 윈도우)
```

**장점**: `Ctrl-b (` / `Ctrl-b )`로 세션 간 전환. Backend의 project 윈도우에서 인프라 상태를 확인하고, frontend 세션으로 돌아와 개발.
**단점**: 세션 간 전환이 윈도우 전환보다 한 단계 더 복잡하다.
**적합**: 풀스택 개발 시 backend와 frontend를 동시에 작업하는 경우.

## 구조 선택 가이드

| 작업 패턴 | 추천 구조 |
|-----------|-----------|
| 일반 개발 (코드 + dev 서버 + 도구) | 현재 구조 (3-pane) |
| 작은 화면, 단순 작업 | 2-pane |
| 공통 컴포넌트 작업 병행 | Hybrid (shared 윈도우 추가) |
| app/admin 공유 코드 동시 수정 | 역할 기반 |
| 풀스택 동시 개발 | 멀티 세션 |
