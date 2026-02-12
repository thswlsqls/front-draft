"use client";

import { Loader2, Plus, X } from "lucide-react";
import type { SessionResponse } from "@/types/chatbot";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  sessions: SessionResponse[];
  activeSessionId: string | null;
  isLoading: boolean;
  hasMore: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onLoadMore: () => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  isLoading,
  hasMore,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLoadMore,
}: Props) {
  return (
    <aside
      className="w-72 border-r-2 border-black bg-white flex flex-col h-full"
      role="navigation"
      aria-label="Conversation list"
    >
      {/* New Chat button */}
      <div className="p-3 border-b-2 border-black">
        <button
          onClick={onNewChat}
          aria-label="Start new conversation"
          className="brutal-border brutal-shadow-sm brutal-hover bg-primary text-primary-foreground px-4 py-2 text-sm font-bold w-full flex items-center justify-center gap-2"
        >
          <Plus className="size-4" />
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && !isLoading ? (
          <p className="text-center py-8 text-sm text-muted-foreground">
            No conversations yet.
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.sessionId}
              role="button"
              tabIndex={0}
              aria-label={`${session.title || "Untitled"}, ${session.lastMessageAt ? formatRelativeTime(session.lastMessageAt) : ""}`}
              onClick={() => onSelectSession(session.sessionId)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelectSession(session.sessionId);
              }}
              className={`border-b-2 border-black px-4 py-3 cursor-pointer transition-colors group ${
                activeSessionId === session.sessionId
                  ? "bg-accent"
                  : "hover:bg-accent"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {session.title || "Untitled"}
                  </p>
                  {session.lastMessageAt && (
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(session.lastMessageAt)}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.sessionId);
                  }}
                  aria-label="Delete conversation"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}

        {hasMore && !isLoading && (
          <button
            onClick={onLoadMore}
            className="w-full py-3 text-sm font-bold text-primary hover:bg-accent transition-colors"
          >
            Load more
          </button>
        )}
      </div>
    </aside>
  );
}
