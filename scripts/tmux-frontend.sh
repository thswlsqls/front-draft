#!/bin/bash
# =============================================================================
# tech-n-ai-frontend tmux 개발 환경 스크립트
# 세션: frontend-session
# 윈도우: app, admin
# 각 윈도우: claude-pane (좌) | build-pane (우) — 수직 분할
# =============================================================================

SESSION="frontend-session"
BASE_DIR="/Users/m1/workspace/tech-n-ai/tech-n-ai-frontend"

# 기존 세션이 있으면 attach
if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "세션 '$SESSION'이(가) 이미 존재합니다. attach 합니다."
    tmux attach-session -t "$SESSION"
    exit 0
fi

# 모듈 목록 (윈도우 이름 : 디렉토리)
declare -a MODULES=(
    "app:app"
    "admin:admin"
)

# --- 첫 번째 윈도우 생성 ---
FIRST_MODULE="${MODULES[0]}"
FIRST_NAME="${FIRST_MODULE%%:*}"
FIRST_DIR="${FIRST_MODULE##*:}"

tmux new-session -d -s "$SESSION" -n "$FIRST_NAME" -c "$BASE_DIR/$FIRST_DIR"
tmux split-window -h -t "$SESSION:$FIRST_NAME" -c "$BASE_DIR/$FIRST_DIR"
tmux select-pane -t "$SESSION:$FIRST_NAME.0" -T "claude-pane"
tmux select-pane -t "$SESSION:$FIRST_NAME.1" -T "build-pane"
tmux select-pane -t "$SESSION:$FIRST_NAME.0"

# --- admin 윈도우 생성 ---
tmux new-window -t "$SESSION" -n "admin" -c "$BASE_DIR/admin"
tmux split-window -h -t "$SESSION:admin" -c "$BASE_DIR/admin"
tmux select-pane -t "$SESSION:admin.0" -T "claude-pane"
tmux select-pane -t "$SESSION:admin.1" -T "build-pane"
tmux select-pane -t "$SESSION:admin.0"

# 첫 번째 윈도우로 이동
tmux select-window -t "$SESSION:app"

# attach
tmux attach-session -t "$SESSION"
