export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
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

export interface SpringDataPage<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort?: {
      sorted: boolean;
      direction: string;
      property: string;
    };
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface SessionListParams {
  page?: number;
  size?: number;
}

export interface MessageListParams {
  page?: number;
  size?: number;
}
