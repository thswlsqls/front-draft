import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/cookie-config";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString()
    );

    return NextResponse.json({
      data: {
        username: payload.username || payload.sub || "",
        email: payload.email || payload.sub || "",
      },
    });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
