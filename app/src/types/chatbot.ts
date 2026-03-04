import type { PageData } from "@/types/common";

export type { PageData };

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  title?: string;
  sources?: SourceResponse[];
}

export interface SourceResponse {
  documentId?: string;
  collectionType?: string;
  score?: number;
  title?: string;
  url?: string;
}

export interface SessionResponse {
  sessionId: string;
  title?: string;
  createdAt: string;
  lastMessageAt?: string;
  isActive: boolean;
}

export interface MessageResponse {
  messageId: string;
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  tokenCount?: number;
  sequenceNumber: number;
  createdAt: string;
}

export interface SessionListResponse {
  data: PageData<SessionResponse>;
}

export interface MessageListResponse {
  data: PageData<MessageResponse>;
}

export interface SessionListParams {
  page?: number;
  size?: number;
}

export interface MessageListParams {
  page?: number;
  size?: number;
}
