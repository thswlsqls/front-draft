import type { TokenResponse } from "@/types/auth";

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_FAILED: "Authentication failed.",
  INVALID_TOKEN: "Invalid token.",
  TOKEN_EXPIRED: "Token has expired.",
  EMAIL_NOT_VERIFIED:
    "Email verification required. Please check your inbox.",
  EMAIL_ALREADY_EXISTS: "This email is already registered.",
  USERNAME_ALREADY_EXISTS: "This username is already taken.",
  PASSWORD_POLICY_VIOLATION:
    "Password must be at least 8 characters with 2+ types (uppercase, lowercase, digit, special character).",
  INVALID_CREDENTIALS: "Incorrect email or password.",
};

const HTTP_FALLBACK: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Authentication failed. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "Resource not found.",
  409: "Conflict. This resource already exists.",
  500: "Something went wrong. Please try again later.",
};

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
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

interface ApiResponse<T> {
  code: string;
  messageCode: { code: string; text: string };
  message?: string;
  data?: T;
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();

  if (!res.ok) {
    throw new AuthError(
      getErrorMessage(json.messageCode?.code, res.status),
      res.status,
      json.messageCode?.code
    );
  }

  return json.data as T;
}

export async function parseVoidResponse(res: Response): Promise<void> {
  const json: ApiResponse<void> = await res.json();

  if (!res.ok) {
    throw new AuthError(
      getErrorMessage(json.messageCode?.code, res.status),
      res.status,
      json.messageCode?.code
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

    const res = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const json: ApiResponse<TokenResponse> = await res.json();

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
