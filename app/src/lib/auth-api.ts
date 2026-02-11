import type {
  TokenResponse,
  AuthResponse,
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
} from "@/lib/auth-fetch";

const AUTH_BASE = "/api/v1/auth";

export async function signup(req: SignupRequest): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parseResponse<AuthResponse>(res);
}

export async function login(req: LoginRequest): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parseResponse<TokenResponse>(res);
}

export async function logout(refreshToken: string): Promise<void> {
  const res = await authFetch(`${AUTH_BASE}/logout`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  return parseVoidResponse(res);
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

export async function oauthCallback(
  provider: string,
  code: string,
  state?: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({ code });
  if (state) params.set("state", state);

  const res = await fetch(
    `${AUTH_BASE}/oauth2/${provider}/callback?${params.toString()}`
  );
  return parseResponse<TokenResponse>(res);
}
