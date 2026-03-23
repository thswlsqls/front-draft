"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { AgentMessageBubble } from "./agent-message-bubble";
import { AgentLoadingIndicator } from "./agent-loading-indicator";
import { AgentEmptyState } from "./agent-empty-state";
import type { DisplayMessage } from "@/types/agent";

interface Props {
  messages: DisplayMessage[];
  isSending: boolean;
  isLoadingMessages: boolean;
  isLoadingOlder: boolean;
  hasOlderMessages: boolean;
  showEmptyState: boolean;
  onGoalClick: (goal: string) => void;
  onRetry: (messageId: string) => void;
  onLoadOlder: () => void;
}

export function AgentMessageArea({
  messages,
  isSending,
  isLoadingMessages,
  isLoadingOlder,
  hasOlderMessages,
  showEmptyState,
  onGoalClick,
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

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    const isNear =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isNearBottomRef.current = isNear;
    setShowScrollBtn((prev) => {
      const next = !isNear;
      return prev === next ? prev : next;
    });
  }, []);

  // Auto-scroll when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (isNearBottomRef.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Auto-scroll when sending starts
  useEffect(() => {
    if (isSending) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isSending]);

  // Preserve scroll position when older messages are prepended.
  // useLayoutEffect runs after DOM mutations but before the browser paints.
  useLayoutEffect(() => {
    if (!isLoadingOlder && prevScrollHeightRef.current > 0) {
      const el = scrollRef.current;
      if (el) {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        prevScrollHeightRef.current = 0;
      }
    }
  }, [isLoadingOlder]);

  // Infinite scroll up: detect when scrolled to top
  const handleScroll = useCallback(() => {
    checkNearBottom();
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop === 0 && hasOlderMessages && !isLoadingOlder) {
      if (prevScrollHeightRef.current === 0) {
        prevScrollHeightRef.current = el.scrollHeight;
      }
      onLoadOlder();
    }
  }, [checkNearBottom, hasOlderMessages, isLoadingOlder, onLoadOlder]);

  if (isLoadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="size-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (showEmptyState && messages.length === 0) {
    return (
      <div className="flex-1 bg-[#F5F5F5]">
        <AgentEmptyState onGoalClick={onGoalClick} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 bg-[#F5F5F5]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Agent conversation"
        aria-live="polite"
        className="absolute inset-0 space-y-4 overflow-y-auto p-6"
        style={{ overflowAnchor: "none" }}
      >
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-5 animate-spin text-[#3B82F6]" />
          </div>
        )}

        {messages.map((msg) => (
          <AgentMessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            createdAt={msg.createdAt}
            executionMeta={msg.executionMeta}
            chartData={msg.chartData}
            failed={msg.failed}
            onRetry={msg.failed ? () => onRetry(msg.id) : undefined}
          />
        ))}

        {isSending && <AgentLoadingIndicator />}

        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className="brutal-border brutal-shadow-sm absolute bottom-4 right-4 bg-white p-2 transition-colors hover:bg-[#DBEAFE]"
        >
          <ArrowDown className="size-5" />
        </button>
      )}
    </div>
  );
}
