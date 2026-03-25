# tmux-frontend.sh 활용 가이드

## 개요

`tmux-frontend.sh`는 tech-n-ai-frontend의 2개 앱(app, admin)에 대해 동일한 레이아웃의 tmux 환경을 자동 구성하는 스크립트이다.

## 세션 구조

```
frontend-session
├── app    [0]  ← app/    (port 3000, 사용자 앱)
└── admin  [1]  ← admin/  (port 3001, 관리자 앱)
```

각 윈도우는 수직 분할(50:50)되어 좌측 claude-pane, 우측 build-pane으로 구성된다.

```
┌─────────────────┬─────────────────┐
│  claude-pane    │  build-pane     │
│                 │                 │
│  Claude Code    │  npm run dev    │
│  코드 작업      │  빌드/린트      │
│                 │                 │
└─────────────────┴─────────────────┘
```

## 실행 방법

```bash
# 스크립트 실행 (세션 생성 + attach)
./scripts/tmux-frontend.sh

# 이미 세션이 존재하면 자동으로 attach
./scripts/tmux-frontend.sh
```

## 윈도우 간 이동

| 단축키 | 대상 윈도우 |
|--------|-------------|
| `Ctrl-b 0` | app |
| `Ctrl-b 1` | admin |
| `Ctrl-b n` | 다음 윈도우 |
| `Ctrl-b p` | 이전 윈도우 |

## pane 간 이동

| 단축키 | 동작 |
|--------|------|
| `Ctrl-b o` | claude-pane ↔ build-pane 전환 |
| `Ctrl-b z` | 현재 pane 전체화면 토글 (에러 스택트레이스 확인 시 유용) |

## 활용 예시

### 1. app 개발 (Claude Code + dev 서버)

```
# app 윈도우 (Ctrl-b 0)
[claude-pane] Claude Code로 app 코드 수정
[build-pane]  npm run dev          # localhost:3000
```

### 2. admin 개발 (Claude Code + dev 서버)

```
# admin 윈도우 (Ctrl-b 1)
[claude-pane] Claude Code로 admin 코드 수정
[build-pane]  npm run dev          # localhost:3001
```

### 3. 빌드/린트 확인

```
# app 윈도우 (Ctrl-b 0)
[build-pane]  npm run build        # 프로덕션 빌드
[build-pane]  npm run lint         # ESLint 검사
```

### 4. app + admin 동시 dev 서버 실행

```
# app 윈도우 (Ctrl-b 0) → build-pane에서 npm run dev
# admin 윈도우 (Ctrl-b 1) → build-pane에서 npm run dev
# 두 서버가 동시에 실행되며 윈도우 전환으로 각각의 로그를 확인
```

## 세션 관리

```bash
# 세션에서 분리 (세션은 백그라운드에서 유지)
Ctrl-b d

# 세션 다시 연결
tmux attach -t frontend-session

# 세션 종료
tmux kill-session -t frontend-session

# 모든 세션 목록 확인
tmux ls
```

## Backend 세션과 함께 사용

```bash
# 터미널 1: backend 세션
./tech-n-ai-backend/scripts/tmux-backend.sh

# 터미널 2: frontend 세션
./tech-n-ai-frontend/scripts/tmux-frontend.sh

# 또는 하나의 터미널에서 세션 간 전환
Ctrl-b s    # 세션 목록에서 backend-session / frontend-session 선택
Ctrl-b (    # 이전 세션
Ctrl-b )    # 다음 세션
```
