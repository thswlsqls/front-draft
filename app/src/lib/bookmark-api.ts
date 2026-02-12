import { authFetch, parseResponse, parseVoidResponse } from "@/lib/auth-fetch";
import type {
  BookmarkDetailResponse,
  BookmarkListResponse,
  BookmarkCreateRequest,
  BookmarkUpdateRequest,
  BookmarkListParams,
  BookmarkSearchParams,
  BookmarkHistoryListResponse,
  BookmarkHistoryDetailResponse,
  BookmarkHistoryParams,
  BookmarkDeletedParams,
} from "@/types/bookmark";

const BASE = "/api/v1/bookmark";

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

export async function createBookmark(
  req: BookmarkCreateRequest
): Promise<BookmarkDetailResponse> {
  const res = await authFetch(BASE, {
    method: "POST",
    body: JSON.stringify(req),
  });
  return parseResponse<BookmarkDetailResponse>(res);
}

export async function fetchBookmarks(
  params: BookmarkListParams = {}
): Promise<BookmarkListResponse> {
  const res = await authFetch(`${BASE}${toQuery(params)}`);
  return parseResponse<BookmarkListResponse>(res);
}

export async function fetchBookmarkDetail(
  id: string
): Promise<BookmarkDetailResponse> {
  const res = await authFetch(`${BASE}/${encodeURIComponent(id)}`);
  return parseResponse<BookmarkDetailResponse>(res);
}

export async function updateBookmark(
  id: string,
  req: BookmarkUpdateRequest
): Promise<BookmarkDetailResponse> {
  const res = await authFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
  return parseResponse<BookmarkDetailResponse>(res);
}

export async function deleteBookmark(id: string): Promise<void> {
  const res = await authFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return parseVoidResponse(res);
}

export async function fetchDeletedBookmarks(
  params: BookmarkDeletedParams = {}
): Promise<BookmarkListResponse> {
  const res = await authFetch(`${BASE}/deleted${toQuery(params)}`);
  return parseResponse<BookmarkListResponse>(res);
}

export async function restoreBookmark(
  id: string
): Promise<BookmarkDetailResponse> {
  const res = await authFetch(
    `${BASE}/${encodeURIComponent(id)}/restore`,
    { method: "POST" }
  );
  return parseResponse<BookmarkDetailResponse>(res);
}

export async function searchBookmarks(
  params: BookmarkSearchParams
): Promise<BookmarkListResponse> {
  const res = await authFetch(`${BASE}/search${toQuery(params)}`);
  return parseResponse<BookmarkListResponse>(res);
}

export async function fetchBookmarkHistory(
  entityId: string,
  params: BookmarkHistoryParams = {}
): Promise<BookmarkHistoryListResponse> {
  const res = await authFetch(
    `${BASE}/history/${encodeURIComponent(entityId)}${toQuery(params)}`
  );
  return parseResponse<BookmarkHistoryListResponse>(res);
}

export async function fetchBookmarkAtTime(
  entityId: string,
  timestamp: string
): Promise<BookmarkHistoryDetailResponse> {
  const res = await authFetch(
    `${BASE}/history/${encodeURIComponent(entityId)}/at${toQuery({ timestamp })}`
  );
  return parseResponse<BookmarkHistoryDetailResponse>(res);
}

export async function restoreBookmarkVersion(
  entityId: string,
  historyId: string
): Promise<BookmarkDetailResponse> {
  const res = await authFetch(
    `${BASE}/history/${encodeURIComponent(entityId)}/restore${toQuery({ historyId })}`,
    { method: "POST" }
  );
  return parseResponse<BookmarkDetailResponse>(res);
}
