import type { AdminUser } from "@/types/auth";
import {
  authFetch,
  parseVoidResponse,
  AuthError,
  getErrorMessage,
} from "@/lib/auth-fetch";

const BFF_BASE = "/api/bff/auth";

/**
 * Admin login via BFF — tokens are stored in HttpOnly cookies server-side.
 * Returns user info only (no tokens exposed to client).
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ user: AdminUser }> {
  const res = await fetch(`${BFF_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new AuthError(
      getErrorMessage(json.messageCode?.code, res.status),
      res.status,
      json.messageCode?.code,
      json.message || json.messageCode?.text
    );
  }

  return json.data;
}

export async function logout(): Promise<void> {
  const res = await authFetch(`${BFF_BASE}/logout`, { method: "POST" });
  return parseVoidResponse(res);
}
