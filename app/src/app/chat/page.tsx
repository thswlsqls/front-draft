"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { AuthHeader } from "@/components/auth/auth-header";
import { ChatSidebar } from "@/components/chatbot/chat-sidebar";
import { ChatMessageArea } from "@/components/chatbot/chat-message-area";
import type { DisplayMessage } from "@/components/chatbot/chat-message-area";
import { ChatInput } from "@/components/chatbot/chat-input";
import { ChatDeleteDialog } from "@/components/chatbot/chat-delete-dialog";
import {
  sendMessage,
  fetchSessions,
  fetchSessionMessages,
} from "@/lib/chatbot-api";
import { AuthError } from "@/lib/auth-fetch";
import type {
  SessionResponse,
  SpringDataPage,
} from "@/types/chatbot";

let tempIdCounter = 0;

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Session state
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [sessionsPageMeta, setSessionsPageMeta] =
    useState<SpringDataPage<SessionResponse> | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Message state
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [messagesCurrentPage, setMessagesCurrentPage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);

  // Retry state
  const failedMessageRef = useRef<Map<string, string>>(new Map());

  // Race condition guard
  const loadingSessionRef = useRef<string | null>(null);

  // Synchronous ref guard to prevent duplicate "load older" fetches.
  // useState is insufficient because scroll events can fire multiple times
  // before React re-renders with the updated state (stale closure problem).
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
        const data = await fetchSessions({ page, size: 20 });
        setSessions((prev) =>
          append ? [...prev, ...data.content] : data.content
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

  // Load messages for a session
  // For initial load (prepend=false): loads the last page to show newest messages.
  // For older messages (prepend=true): loads the specified page and prepends.
  const loadSessionMessages = useCallback(
    async (sessionId: string, page?: number, prepend = false) => {
      if (prepend) {
        setIsLoadingOlder(true);
      } else {
        setIsLoadingMessages(true);
        loadingSessionRef.current = sessionId;
      }

      try {
        // For initial load, first discover totalPages then load the last page
        let targetPage = page;
        if (!prepend && !page) {
          const meta = await fetchSessionMessages(sessionId, {
            page: 1,
            size: 50,
          });
          // Guard against stale response
          if (!prepend && loadingSessionRef.current !== sessionId) return;

          if (meta.totalPages <= 1) {
            // Single page — use data directly
            const displayMessages: DisplayMessage[] = meta.content.map(
              (msg) => ({
                id: msg.messageId,
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
              })
            );
            setMessages(displayMessages);
            setMessagesCurrentPage(1);
            setHasOlderMessages(false);
            setConversationId(sessionId);
            return;
          }
          targetPage = meta.totalPages;
        }

        const data = await fetchSessionMessages(sessionId, {
          page: targetPage,
          size: 50,
        });

        // Guard against stale response (race condition)
        if (!prepend && loadingSessionRef.current !== sessionId) return;

        const displayMessages: DisplayMessage[] = data.content.map((msg) => ({
          id: msg.messageId,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }));

        if (prepend) {
          setMessages((prev) => [...displayMessages, ...prev]);
        } else {
          setMessages(displayMessages);
        }

        // Track current page in API 1-based terms
        setMessagesCurrentPage(data.number + 1);
        setHasOlderMessages(!data.first);
        setConversationId(sessionId);
      } catch (err) {
        if (!prepend && loadingSessionRef.current !== sessionId) return;
        if (err instanceof AuthError) {
          showToast(err.message, "error");
        }
        if (!prepend) {
          setMessages([]);
        }
      } finally {
        setIsLoadingMessages(false);
        setIsLoadingOlder(false);
        if (prepend) {
          isLoadingOlderRef.current = false;
        }
      }
    },
    [showToast]
  );

  // Select a session
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) return;
      setActiveSessionId(sessionId);
      setMessages([]);
      setMessagesCurrentPage(1);
      setHasOlderMessages(false);
      isLoadingOlderRef.current = false;
      failedMessageRef.current.clear();
      loadSessionMessages(sessionId);
    },
    [activeSessionId, loadSessionMessages]
  );

  // New chat
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setConversationId(null);
    setMessages([]);
    setMessagesCurrentPage(1);
    setHasOlderMessages(false);
    isLoadingOlderRef.current = false;
    failedMessageRef.current.clear();
  }, []);

  // Send message
  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const tempId = `temp_${++tempIdCounter}`;
      const userMessage: DisplayMessage = {
        id: tempId,
        role: "USER",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);

      try {
        const res = await sendMessage({
          message: trimmed,
          conversationId: conversationId ?? undefined,
        });

        // Update conversationId (for new sessions)
        const isNewSession = !conversationId;
        setConversationId(res.conversationId);

        if (isNewSession) {
          setActiveSessionId(res.conversationId);
          // Reload sessions to get the new session in the list
          loadSessions();
        }

        // Add assistant response
        const assistantMessage: DisplayMessage = {
          id: `assistant_${++tempIdCounter}`,
          role: "ASSISTANT",
          content: res.response,
          createdAt: new Date().toISOString(),
          sources: res.sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        // Mark user message as failed
        failedMessageRef.current.set(tempId, trimmed);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, failed: true } : m))
        );

        if (err instanceof AuthError) {
          showToast(err.message, "error");
        } else {
          showToast("Failed to send message. Please try again.", "error");
        }
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending, loadSessions, showToast]
  );

  // Retry failed message
  const handleRetry = useCallback(
    (messageId: string) => {
      const text = failedMessageRef.current.get(messageId);
      if (!text) return;

      // Remove the failed message
      failedMessageRef.current.delete(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      // Resend
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  // Load older messages (infinite scroll up)
  // Uses isLoadingOlderRef (not isLoadingOlder state) as the primary guard.
  // The ref updates synchronously, preventing duplicate fetches from rapid
  // scroll events that fire before React re-renders with updated state.
  const handleLoadOlder = useCallback(() => {
    if (!activeSessionId || isLoadingOlderRef.current || !hasOlderMessages) return;
    const olderPage = messagesCurrentPage - 1;
    if (olderPage < 1) return;

    isLoadingOlderRef.current = true;
    loadSessionMessages(activeSessionId, olderPage, true);
  }, [
    activeSessionId,
    hasOlderMessages,
    messagesCurrentPage,
    loadSessionMessages,
  ]);

  // Load more sessions
  const handleLoadMoreSessions = useCallback(() => {
    if (!sessionsPageMeta || sessionsPageMeta.last) return;
    const nextPage = sessionsPageMeta.number + 2; // number is 0-based, API page is 1-based
    loadSessions(nextPage, true);
  }, [sessionsPageMeta, loadSessions]);

  // Delete session
  const handleSessionDeleted = useCallback(
    (deletedId: string) => {
      setSessions((prev) =>
        prev.filter((s) => s.sessionId !== deletedId)
      );

      if (activeSessionId === deletedId) {
        handleNewChat();
      }

      setDeleteSessionId(null);
    },
    [activeSessionId, handleNewChat]
  );

  // Handle example question click from empty state
  const handleQuestionClick = useCallback(
    (question: string) => {
      handleSendMessage(question);
    },
    [handleSendMessage]
  );

  // Auth loading state
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="brutal-border h-8 w-8 animate-spin bg-[#3B82F6]" />
      </div>
    );
  }

  const showEmptyState = !activeSessionId && !conversationId;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b-3 border-black bg-white shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <Link
            href="/"
            className="shrink-0 text-2xl font-bold tracking-tight md:text-3xl"
          >
            Tech <span className="text-[#3B82F6]">N</span> AI
          </Link>
          <AuthHeader />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          hasMore={sessionsPageMeta ? !sessionsPageMeta.last : false}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={(id) => setDeleteSessionId(id)}
          onLoadMore={handleLoadMoreSessions}
        />

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatMessageArea
            messages={messages}
            isSending={isSending}
            isLoadingMessages={isLoadingMessages}
            isLoadingOlder={isLoadingOlder}
            hasOlderMessages={hasOlderMessages}
            showEmptyState={showEmptyState}
            onQuestionClick={handleQuestionClick}
            onRetry={handleRetry}
            onLoadOlder={handleLoadOlder}
          />

          <ChatInput
            onSend={handleSendMessage}
            disabled={false}
            isSending={isSending}
          />
        </div>
      </div>

      {/* Delete Dialog */}
      <ChatDeleteDialog
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
