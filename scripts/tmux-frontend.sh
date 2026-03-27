#!/bin/bash
# =============================================================================
# tech-n-ai-frontend tmux 개발 환경 스크립트
# 세션: frontend-session
# 윈도우: app, admin
# 각 윈도우: claude-pane (좌 50%) | dev-pane (우상 25%) | tool-pane (우하 25%)
# =============================================================================

SESSION="frontend-session"
BASE_DIR="/Users/m1/workspace/tech-n-ai/tech-n-ai-frontend"

# 기존 세션이 있으면 attach
if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "세션 '$SESSION'이(가) 이미 존재합니다. attach 합니다."
    tmux attach-session -t "$SESSION"
    exit 0
fi

# 3-pane 윈도우 생성 함수
# 레이아웃: claude-pane (좌 50%) | dev-pane (우상) / tool-pane (우하)
create_3pane_window() {
    local target="$1"
    local dir="$2"

    # 수평 분할: 좌(0) | 우(1)
    tmux split-window -h -t "$target" -c "$dir"
    # 우측(1)을 수직 분할: 우상(1) | 우하(2)
    tmux split-window -v -t "$target.1" -c "$dir"

    tmux select-pane -t "$target.0" -T "claude-pane"
    tmux select-pane -t "$target.1" -T "dev-pane"
    tmux select-pane -t "$target.2" -T "tool-pane"
    tmux select-pane -t "$target.0"
}

# --- app 윈도우 생성 ---
tmux new-session -d -s "$SESSION" -n "app" -c "$BASE_DIR/app"
create_3pane_window "$SESSION:app" "$BASE_DIR/app"

# --- admin 윈도우 생성 ---
tmux new-window -t "$SESSION" -n "admin" -c "$BASE_DIR/admin"
create_3pane_window "$SESSION:admin" "$BASE_DIR/admin"

# 첫 번째 윈도우로 이동
tmux select-window -t "$SESSION:app"

# attach
tmux attach-session -t "$SESSION"
