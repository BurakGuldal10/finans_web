import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isLocalAuthEnabled, verifyLocalAuthToken } from "@/lib/local-auth";

const publicPaths = ["/login", "/api/auth"];

export function proxy(request: NextRequest) {
  if (!isLocalAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (pathname === "/login" && verifyLocalAuthToken(token)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (verifyLocalAuthToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Lokal erisim kilidi aktif. Once giris yapin.",
      },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
