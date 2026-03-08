import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  COOKIE_OPTIONS,
  BACKEND_URL,
} from "@/lib/cookie-config";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const provider = searchParams.get("provider") || "google";

  if (!code) {
    return NextResponse.json(
      { code: "ERROR", messageCode: { code: "BAD_REQUEST", text: "Missing code" } },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({ code });
  if (state) params.set("state", state);

  const res = await fetch(
    `${BACKEND_URL}/api/v1/auth/oauth2/${provider}/callback?${params.toString()}`
  );

  const json = await res.json();

  if (!res.ok || !json.data) {
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

  let user = { username: "", email: "" };
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString()
    );
    user = {
      username: payload.username || payload.sub || "",
      email: payload.email || payload.sub || "",
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
