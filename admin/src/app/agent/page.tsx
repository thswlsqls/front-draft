"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { Header } from "@/components/auth/header";
import { AgentSidebar } from "@/components/agent/agent-sidebar";
import { AgentMessageArea } from "@/components/agent/agent-message-area";
import type { DisplayMessage } from "@/types/agent";
import { AgentInput } from "@/components/agent/agent-input";
import { AgentDeleteDialog } from "@/components/agent/agent-delete-dialog";
import {
  runAgent,
  fetchAgentSessions,
  fetchAgentSessionMessages,
  updateAgentSessionTitle,
} from "@/lib/agent-api";
import { AuthError } from "@/lib/auth-fetch";
import type {
  SessionResponse,
  SessionListResponse,
} from "@/types/agent";

let tempIdCounter = 0;

export default function AgentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Session state
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [sessionsPageMeta, setSessionsPageMeta] =
    useState<SessionListResponse | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Message state
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [messagesCurrentPage, setMessagesCurrentPage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);

  // Retry state
  const failedGoalRef = useRef<Map<string, string>>(new Map());

  // Race condition guard: discard stale session responses
  const loadingSessionRef = useRef<string | null>(null);

  // Synchronous ref guard to prevent duplicate agent executions.
  // useState is insufficient because rapid clicks can fire before React
  // re-renders with the updated isSending state (stale closure problem).
  const isSendingRef = useRef(false);

  // Synchronous ref guard to prevent duplicate "load older" fetches.
  const isLoadingOlderRef = useRef(false);

  // Delete dialog
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  // Load sessions on mount
  const loadSessions = useCallback(
    async (page = 1, append = false) => {
      setIsLoadingSessions(true);
      try {
        const data = await fetchAgentSessions({ page, size: 20 });
        setSessions((prev) =>
          append ? [...prev, ...data.data.list] : data.data.list
        );
        setSessionsPageMeta(data);
      } catch {
        if (!append) setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user) loadSessions();
  }, [user, loadSessions]);

  // Load messages for a session.
  // Initial load (prepend=false): two-request strategy to show newest messages first.
  // Older messages (prepend=true): loads specified page and prepends.
  const loadSessionMessages = useCallback(
    async (sid: string, page?: number, prepend = false) => {
      if (prepend) {
        setIsLoadingOlder(true);
      } else {
        setIsLoadingMessages(true);
        loadingSessionRef.current = sid;
      }

      try {
        let targetPage = page;
        if (!prepend && !page) {
          const PAGE_SIZE = 50;
          const meta = await fetchAgentSessionMessages(sid, {
            page: 1,
            size: 1,
          });
          if (!prepend && loadingSessionRef.current !== sid) return;

          // totalPageNumber은 size=1 기준이므로, 실제 PAGE_SIZE 기준으로 마지막 페이지 재계산
          targetPage = Math.max(1, Math.ceil(meta.data.totalSize / PAGE_SIZE));
        }

        const data = await fetchAgentSessionMessages(sid, {
          page: targetPage,
          size: 50,
        });

        if (!prepend && loadingSessionRef.current !== sid) return;

        const seen = new Set<string>();
        const displayMessages: DisplayMessage[] = data.data.list
          .filter((msg) => {
            if (seen.has(msg.messageId)) return false;
            seen.add(msg.messageId);
            return true;
          })
          .map((msg) => ({
            id: msg.messageId,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          }));

        if (prepend) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnly = displayMessages.filter(
              (m) => !existingIds.has(m.id)
            );
            return [...newOnly, ...prev];
          });
        } else {
          setMessages(displayMessages);
        }

        setMessagesCurrentPage(data.data.pageNumber);
        setHasOlderMessages(data.data.pageNumber > 1);
      } catch (err) {
        if (!prepend && loadingSessionRef.current !== sid) return;
        if (err instanceof AuthError) {
          showToast(err.message, "error");
        }
        if (!prepend) {
          setMessages([]);
        }
      } finally {
        setIsLoadingMessages(false);
        if (prepend) {
          setIsLoadingOlder(false);
          isLoadingOlderRef.current = false;
        }
      }
    },
    [showToast]
  );

  // Select a session
  const handleSelectSession = useCallback(
    (sid: string) => {
      if (sid === activeSessionId) return;
      setActiveSessionId(sid);
      setMessages([]);
      setMessagesCurrentPage(1);
      setHasOlderMessages(false);
      isLoadingOlderRef.current = false;
      failedGoalRef.current.clear();
      loadSessionMessages(sid);
    },
    [activeSessionId, loadSessionMessages]
  );

  // New session
  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setMessagesCurrentPage(1);
    setHasOlderMessages(false);
    isLoadingOlderRef.current = false;
    failedGoalRef.current.clear();
  }, []);

  // Send goal
  const handleSendGoal = useCallback(
    async (goal: string) => {
      const trimmed = goal.trim();
      if (!trimmed || isSendingRef.current) return;
      isSendingRef.current = true;

      const tempId = `temp_${++tempIdCounter}`;
      const now = new Date().toISOString();
      const userMessage: DisplayMessage = {
        id: tempId,
        role: "USER",
        content: trimmed,
        createdAt: now,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);

      try {
        const result = await runAgent({
          goal: trimmed,
          sessionId: activeSessionId ?? undefined,
        });

        const isNewSession = !activeSessionId;

        if (isNewSession) {
          setActiveSessionId(result.sessionId);
          const newSession: SessionResponse = {
            sessionId: result.sessionId,
            title: null,
            createdAt: now,
            lastMessageAt: now,
            isActive: true,
          };
          setSessions((prev) => [newSession, ...prev]);
          // 비동기 타이틀 생성 반영을 위해 지연 후 세션 목록 재조회
          setTimeout(() => loadSessions(), 4000);
        }

        const assistantMessage: DisplayMessage = {
          id: `assistant_${++tempIdCounter}`,
          role: "ASSISTANT",
          content: result.summary,
          createdAt: new Date().toISOString(),
          executionMeta: {
            success: result.success,
            toolCallCount: result.toolCallCount,
            analyticsCallCount: result.analyticsCallCount,
            executionTimeMs: result.executionTimeMs,
            errors: result.errors,
          },
          chartData: result.chartData,
        };

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          if (existingIds.has(assistantMessage.id)) return prev;
          return [...prev, assistantMessage];
        });
      } catch (err) {
        failedGoalRef.current.set(tempId, trimmed);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, failed: true } : m))
        );

        if (err instanceof AuthError) {
          showToast(err.message, "error");
        } else {
          showToast("Failed to execute agent. Please try again.", "error");
        }
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
      }
    },
    [activeSessionId, loadSessions, showToast]
  );

  // Retry failed goal
  const handleRetry = useCallback(
    (messageId: string) => {
      const goal = failedGoalRef.current.get(messageId);
      if (!goal) return;

      failedGoalRef.current.delete(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      handleSendGoal(goal);
    },
    [handleSendGoal]
  );

  // Load older messages (infinite scroll up)
  const handleLoadOlder = useCallback(() => {
    if (!activeSessionId || isLoadingOlderRef.current || !hasOlderMessages)
      return;
    const olderPage = messagesCurrentPage - 1;
    if (olderPage < 1) return;

    isLoadingOlderRef.current = true;
    loadSessionMessages(activeSessionId, olderPage, true);
  }, [activeSessionId, hasOlderMessages, messagesCurrentPage, loadSessionMessages]);

  // Load more sessions
  const handleLoadMoreSessions = useCallback(() => {
    if (
      !sessionsPageMeta ||
      sessionsPageMeta.data.pageNumber >= sessionsPageMeta.data.totalPageNumber
    )
      return;
    const nextPage = sessionsPageMeta.data.pageNumber + 1;
    loadSessions(nextPage, true);
  }, [sessionsPageMeta, loadSessions]);

  // Delete session
  const handleSessionDeleted = useCallback(
    (deletedId: string) => {
      setSessions((prev) =>
        prev.filter((s) => s.sessionId !== deletedId)
      );

      if (activeSessionId === deletedId) {
        handleNewSession();
      }

      setDeleteSessionId(null);
    },
    [activeSessionId, handleNewSession]
  );

  // Edit session title (optimistic UI)
  const handleEditTitle = useCallback(
    async (sessionId: string, newTitle: string) => {
      const prevTitle = sessions.find(
        (s) => s.sessionId === sessionId
      )?.title ?? null;

      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, title: newTitle } : s
        )
      );

      try {
        await updateAgentSessionTitle(sessionId, newTitle);
      } catch (err) {
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === sessionId ? { ...s, title: prevTitle } : s
          )
        );
        if (err instanceof AuthError) {
          showToast(err.message, "error");
        } else {
          showToast("Failed to update title. Please try again.", "error");
        }
      }
    },
    [sessions, showToast]
  );

  // Auth loading state
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="brutal-border size-8 animate-spin bg-[#3B82F6]" />
      </div>
    );
  }

  const showEmptyState = !activeSessionId;

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <AgentSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          hasMore={
            sessionsPageMeta
              ? sessionsPageMeta.data.pageNumber <
                sessionsPageMeta.data.totalPageNumber
              : false
          }
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={(id) => setDeleteSessionId(id)}
          onLoadMore={handleLoadMoreSessions}
          onEditTitle={handleEditTitle}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AgentMessageArea
            messages={messages}
            isSending={isSending}
            isLoadingMessages={isLoadingMessages}
            isLoadingOlder={isLoadingOlder}
            hasOlderMessages={hasOlderMessages}
            showEmptyState={showEmptyState}
            onGoalClick={handleSendGoal}
            onRetry={handleRetry}
            onLoadOlder={handleLoadOlder}
          />

          <AgentInput
            onSend={handleSendGoal}
            isSending={isSending}
          />
        </div>
      </div>

      <AgentDeleteDialog
        open={!!deleteSessionId}
        onOpenChange={(open) => {
          if (!open) setDeleteSessionId(null);
        }}
        sessionId={deleteSessionId}
        onDeleted={handleSessionDeleted}
      />
    </div>
  );
}
