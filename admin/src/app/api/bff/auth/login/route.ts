import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  COOKIE_OPTIONS,
  BACKEND_URL,
} from "@/lib/cookie-config";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/api/v1/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(json, { status: res.status });
  }

  const { accessToken, refreshToken, expiresIn, refreshTokenExpiresIn } =
    json.data;

  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: expiresIn,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: refreshTokenExpiresIn,
  });

  let user = { id: 0, username: "", email: "", role: "ADMIN" };
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString()
    );
    user = {
      id: payload.adminId || payload.id || 0,
      username: payload.username || payload.sub || "",
      email: payload.email || payload.sub || "",
      role: payload.role || "ADMIN",
    };
  } catch {
    // fallback
  }

  return NextResponse.json({
    code: json.code,
    messageCode: json.messageCode,
    data: { user },
  });
}
