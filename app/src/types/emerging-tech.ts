export const TECH_PROVIDERS = [
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE",
  "META",
  "XAI",
] as const;
export type TechProvider = (typeof TECH_PROVIDERS)[number];

export const UPDATE_TYPES = [
  "MODEL_RELEASE",
  "API_UPDATE",
  "SDK_RELEASE",
  "PRODUCT_LAUNCH",
  "PLATFORM_UPDATE",
  "BLOG_POST",
] as const;
export type EmergingTechType = (typeof UPDATE_TYPES)[number];

export const SOURCE_TYPES = [
  "GITHUB_RELEASE",
  "RSS",
  "WEB_SCRAPING",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const POST_STATUSES = [
  "DRAFT",
  "PENDING",
  "PUBLISHED",
  "REJECTED",
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export interface EmergingTechMetadata {
  version: string | null;
  tags: string[] | null;
  author: string | null;
  githubRepo: string | null;
  additionalInfo: Record<string, unknown> | null;
}

export interface EmergingTechItem {
  id: string;
  provider: TechProvider;
  updateType: EmergingTechType;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: string | null;
  sourceType: SourceType;
  status: PostStatus;
  externalId: string | null;
  metadata: EmergingTechMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmergingTechPageResponse {
  pageSize: number;
  pageNumber: number;
  totalCount: number;
  items: EmergingTechItem[];
}

export interface ApiResponse<T> {
  code: string;
  messageCode: { code: string; text: string };
  message: string;
  data: T;
}

export interface ListParams {
  page?: number;
  size?: number;
  provider?: TechProvider;
  updateType?: EmergingTechType;
  sourceType?: SourceType;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

export interface SearchParams {
  q: string;
  page?: number;
  size?: number;
}
