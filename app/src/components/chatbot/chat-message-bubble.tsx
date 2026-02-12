"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { ChatSourceCitation } from "./chat-source-citation";
import type { SourceResponse } from "@/types/chatbot";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isToday) return time;

  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${monthDay}, ${time}`;
}

interface Props {
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  sources?: SourceResponse[];
  failed?: boolean;
  onRetry?: () => void;
}

export function ChatMessageBubble({
  role,
  content,
  createdAt,
  sources,
  failed,
  onRetry,
}: Props) {
  const isUser = role === "USER";

  const ariaLabel = isUser
    ? `You: ${content}`
    : `AI: ${content.slice(0, 50)}`;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      aria-label={ariaLabel}
    >
      <div
        className={`brutal-border p-3 max-w-[80%] ${
          isUser
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>

        {isUser && failed && (
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle className="size-3.5 text-destructive" />
            <span className="text-xs text-destructive">Failed to send</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <RotateCcw className="size-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {!isUser && sources && <ChatSourceCitation sources={sources} />}

        <p className={`mt-1 text-xs font-mono ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {formatTimestamp(createdAt)}
        </p>
      </div>
    </div>
  );
}
