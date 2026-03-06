import type { TokenResponse } from "@/types/auth";
import { authFetch, parseResponse, parseVoidResponse } from "@/lib/auth-fetch";

const BASE = "/api/v1/auth";

export async function adminLogin(
  email: string,
  password: string
): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<TokenResponse>(res);
}

export async function logout(refreshToken: string): Promise<void> {
  const res = await authFetch(`${BASE}/admin/logout`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  return parseVoidResponse(res);
}
