import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createLocalAuthToken,
  isLocalAuthEnabled,
  verifyLocalAuthToken,
  verifyLocalPassword,
} from "@/lib/local-auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  return NextResponse.json({
    authenticated: verifyLocalAuthToken(token),
    enabled: isLocalAuthEnabled(),
  });
}

export async function POST(request: NextRequest) {
  if (!isLocalAuthEnabled()) {
    return NextResponse.json({ authenticated: true, enabled: false });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !verifyLocalPassword(body.password)) {
    return NextResponse.json(
      {
        authenticated: false,
        error: "Parola hatali.",
        enabled: true,
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true, enabled: true });
  response.cookies.set(AUTH_COOKIE_NAME, createLocalAuthToken(), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false, enabled: isLocalAuthEnabled() });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
