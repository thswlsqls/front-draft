import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  COOKIE_OPTIONS,
  BACKEND_URL,
} from "@/lib/cookie-config";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { code: "ERROR", messageCode: { code: "AUTH_REQUIRED", text: "No refresh token" } },
      { status: 401 }
    );
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await res.json();

  if (!res.ok || !json.data) {
    // Clear stale cookies on refresh failure
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    return NextResponse.json(json, { status: res.status });
  }

  cookieStore.set(ACCESS_TOKEN_COOKIE, json.data.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: json.data.expiresIn,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, json.data.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: json.data.refreshTokenExpiresIn,
  });

  return NextResponse.json({ code: "SUCCESS" });
}
