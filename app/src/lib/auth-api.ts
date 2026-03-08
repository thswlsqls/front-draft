import type {
  AuthResponse,
  AuthUser,
  SignupRequest,
  LoginRequest,
  WithdrawRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
} from "@/types/auth";
import {
  authFetch,
  parseResponse,
  parseVoidResponse,
  AuthError,
  getErrorMessage,
} from "@/lib/auth-fetch";

const AUTH_BASE = "/api/v1/auth";
const BFF_BASE = "/api/bff/auth";

export async function signup(req: SignupRequest): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parseResponse<AuthResponse>(res);
}

/**
 * Login via BFF — tokens are stored in HttpOnly cookies server-side.
 * Returns user info only (no tokens exposed to client).
 */
export async function login(req: LoginRequest): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BFF_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new AuthError(
      getErrorMessage(json.messageCode?.code, res.status),
      res.status,
      json.messageCode?.code
    );
  }

  return json.data;
}

export async function withdraw(req?: WithdrawRequest): Promise<void> {
  const res = await authFetch(`${AUTH_BASE}/me`, {
    method: "DELETE",
    body: req ? JSON.stringify(req) : undefined,
  });
  return parseVoidResponse(res);
}

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(
    `${AUTH_BASE}/verify-email?token=${encodeURIComponent(token)}`
  );
  return parseVoidResponse(res);
}

export async function resetPassword(
  req: ResetPasswordRequest
): Promise<void> {
  const res = await fetch(`${AUTH_BASE}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parseVoidResponse(res);
}

export async function resetPasswordConfirm(
  req: ResetPasswordConfirmRequest
): Promise<void> {
  const res = await fetch(`${AUTH_BASE}/reset-password/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parseVoidResponse(res);
}

/**
 * OAuth callback via BFF — tokens are stored in HttpOnly cookies server-side.
 * Returns user info only.
 */
export async function oauthCallback(
  provider: string,
  code: string,
  state?: string
): Promise<{ user: AuthUser }> {
  const params = new URLSearchParams({ code, provider });
  if (state) params.set("state", state);

  const res = await fetch(`${BFF_BASE}/oauth/callback?${params.toString()}`);

  const json = await res.json();

  if (!res.ok) {
    throw new AuthError(
      getErrorMessage(json.messageCode?.code, res.status),
      res.status,
      json.messageCode?.code
    );
  }

  return json.data;
}
