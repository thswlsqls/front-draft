export interface BookmarkDetailResponse {
  bookmarkTsid: string;
  userId: string;
  emergingTechId: string;
  title: string | null;
  url: string | null;
  provider: string | null;
  summary: string | null;
  publishedAt: string | null;
  tags: string[] | null;
  memo: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface BookmarkCreateRequest {
  emergingTechId: string;
  tags?: string[];
  memo?: string;
}

export interface BookmarkUpdateRequest {
  tags?: string[];
  memo?: string;
}

export interface PageData<T> {
  pageSize: number;
  pageNumber: number;
  totalPageNumber: number;
  totalSize: number;
  list: T[];
}

export interface BookmarkListResponse {
  data: PageData<BookmarkDetailResponse>;
}

export interface BookmarkHistoryDetailResponse {
  historyId: string;
  entityId: string;
  operationType: "CREATE" | "UPDATE" | "DELETE";
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  changedBy: string;
  changedAt: string;
  changeReason: string | null;
}

export interface BookmarkHistoryListResponse {
  data: PageData<BookmarkHistoryDetailResponse>;
}

export interface BookmarkListParams {
  page?: number;
  size?: number;
  sort?: string;
  provider?: string;
}

export interface BookmarkSearchParams {
  q: string;
  page?: number;
  size?: number;
  searchField?: "all" | "title" | "memo" | "tags";
}

export interface BookmarkHistoryParams {
  page?: number;
  size?: number;
  operationType?: "CREATE" | "UPDATE" | "DELETE";
  startDate?: string;
  endDate?: string;
}

export interface BookmarkDeletedParams {
  page?: number;
  size?: number;
  days?: number;
}
