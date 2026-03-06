import type { TokenResponse } from "@/types/auth";

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_FAILED: "Invalid email or password.",
  AUTH_REQUIRED: "Authentication required. Please sign in.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "Admin account not found.",
  CONFLICT: "A conflict occurred. Please try again.",
  VALIDATION_ERROR: "Validation failed. Please check your input.",
  BAD_REQUEST: "Invalid request. Please check your input.",
  INVALID_TOKEN: "Invalid token.",
  TOKEN_EXPIRED: "Token has expired.",
};

const HTTP_FALLBACK: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Authentication failed. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "Resource not found.",
  409: "Conflict. This resource already exists.",
  429: "Too many requests. Please try again later.",
  500: "Something went wrong. Please try again later.",
};

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public serverMessage?: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function getErrorMessage(
  messageCode?: string,
  httpStatus?: number
): string {
  if (messageCode && ERROR_MESSAGES[messageCode]) {
    return ERROR_MESSAGES[messageCode];
  }
  if (httpStatus && HTTP_FALLBACK[httpStatus]) {
    return HTTP_FALLBACK[httpStatus];
  }
  return "Something went wrong. Please try again later.";
}

interface ApiResponseShape<T> {
  code: string;
  messageCode: { code: string; text: string };
  message?: string;
  data?: T;
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const json: ApiResponseShape<T> = await res.json();

  if (!res.ok) {
    throw new AuthError(
      getErrorMessage(json.messageCode?.code, res.status),
      res.status,
      json.messageCode?.code,
      json.message || json.messageCode?.text
    );
  }

  return json.data as T;
}

export async function parseVoidResponse(res: Response): Promise<void> {
  const json: ApiResponseShape<void> = await res.json();

  if (!res.ok) {
    throw new AuthError(
      getErrorMessage(json.messageCode?.code, res.status),
      res.status,
      json.messageCode?.code,
      json.message || json.messageCode?.text
    );
  }
}

// Token refresh singleton to prevent concurrent refresh calls
let refreshPromise: Promise<TokenResponse> | null = null;

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem("accessToken");

  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && accessToken) {
    try {
      const tokens = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      res = await fetch(url, { ...options, headers });
    } catch {
      clearTokens();
      window.location.href = "/signin";
      throw new AuthError("Session expired. Please sign in again.", 401);
    }
  }

  return res;
}

async function refreshAccessToken(): Promise<TokenResponse> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token");

    const res = await fetch("/api/v1/auth/admin/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const json: ApiResponseShape<TokenResponse> = await res.json();

    if (!res.ok || !json.data) {
      throw new Error("Token refresh failed");
    }

    localStorage.setItem("accessToken", json.data.accessToken);
    localStorage.setItem("refreshToken", json.data.refreshToken);
    return json.data;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}
