import { authFetch, parseResponse, parseVoidResponse } from "@/lib/auth-fetch";
import type {
  ChatRequest,
  ChatResponse,
  SessionResponse,
  MessageResponse,
  SpringDataPage,
  SessionListParams,
  MessageListParams,
} from "@/types/chatbot";

const BASE = "/api/v1/chatbot";

function toQuery(params: object): string {
  const entries = Object.entries(params as Record<string, unknown>);
  const sp = new URLSearchParams();
  for (const [k, v] of entries) {
    if (v !== undefined && v !== null && v !== "") {
      sp.set(k, String(v));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}

export async function sendMessage(
  req: ChatRequest
): Promise<ChatResponse> {
  const res = await authFetch(BASE, {
    method: "POST",
    body: JSON.stringify(req),
  });
  return parseResponse<ChatResponse>(res);
}

export async function fetchSessions(
  params: SessionListParams = {}
): Promise<SpringDataPage<SessionResponse>> {
  const res = await authFetch(`${BASE}/sessions${toQuery(params)}`);
  return parseResponse<SpringDataPage<SessionResponse>>(res);
}

export async function fetchSessionDetail(
  sessionId: string
): Promise<SessionResponse> {
  const res = await authFetch(
    `${BASE}/sessions/${encodeURIComponent(sessionId)}`
  );
  return parseResponse<SessionResponse>(res);
}

export async function fetchSessionMessages(
  sessionId: string,
  params: MessageListParams = {}
): Promise<SpringDataPage<MessageResponse>> {
  const res = await authFetch(
    `${BASE}/sessions/${encodeURIComponent(sessionId)}/messages${toQuery(params)}`
  );
  return parseResponse<SpringDataPage<MessageResponse>>(res);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await authFetch(
    `${BASE}/sessions/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" }
  );
  return parseVoidResponse(res);
}
