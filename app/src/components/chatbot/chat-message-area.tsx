"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatTypingIndicator } from "./chat-typing-indicator";
import { ChatEmptyState } from "./chat-empty-state";
import type { SourceResponse } from "@/types/chatbot";

export interface DisplayMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  sources?: SourceResponse[];
  failed?: boolean;
}

interface Props {
  messages: DisplayMessage[];
  isSending: boolean;
  isLoadingMessages: boolean;
  isLoadingOlder: boolean;
  hasOlderMessages: boolean;
  showEmptyState: boolean;
  onQuestionClick: (question: string) => void;
  onRetry: (messageId: string) => void;
  onLoadOlder: () => void;
}

export function ChatMessageArea({
  messages,
  isSending,
  isLoadingMessages,
  isLoadingOlder,
  hasOlderMessages,
  showEmptyState,
  onQuestionClick,
  onRetry,
  onLoadOlder,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const prevScrollHeightRef = useRef<number>(0);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Check if user is near bottom
  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    const isNear =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isNearBottomRef.current = isNear;
    setShowScrollBtn(!isNear);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isNearBottomRef.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Auto-scroll when sending
  useEffect(() => {
    if (isSending) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isSending]);

  // Preserve scroll position when older messages are prepended.
  // useLayoutEffect runs after DOM mutations but before the browser paints,
  // so the user never sees the intermediate jumped state.
  useLayoutEffect(() => {
    if (!isLoadingOlder && prevScrollHeightRef.current > 0) {
      const el = scrollRef.current;
      if (el) {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        prevScrollHeightRef.current = 0;
      }
    }
  }, [isLoadingOlder, messages]);

  // Infinite scroll up: detect top reached
  const handleScroll = useCallback(() => {
    checkNearBottom();
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop === 0 && hasOlderMessages && !isLoadingOlder) {
      // Only save scroll height once per load cycle.
      // prevScrollHeightRef is reset to 0 after restoration completes.
      // This prevents overwriting the saved value on redundant scroll events.
      if (prevScrollHeightRef.current === 0) {
        prevScrollHeightRef.current = el.scrollHeight;
      }
      onLoadOlder();
    }
  }, [checkNearBottom, hasOlderMessages, isLoadingOlder, onLoadOlder]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showEmptyState && messages.length === 0) {
    return (
      <div className="flex-1 bg-secondary">
        <ChatEmptyState onQuestionClick={onQuestionClick} />
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-secondary">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="absolute inset-0 overflow-y-auto p-6 space-y-4"
        style={{ overflowAnchor: "none" }}
      >
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            createdAt={msg.createdAt}
            sources={msg.sources}
            failed={msg.failed}
            onRetry={msg.failed ? () => onRetry(msg.id) : undefined}
          />
        ))}

        {isSending && <ChatTypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className="absolute bottom-4 right-4 brutal-border brutal-shadow-sm bg-white p-2 hover:bg-accent transition-colors"
        >
          <ArrowDown className="size-5" />
        </button>
      )}
    </div>
  );
}
