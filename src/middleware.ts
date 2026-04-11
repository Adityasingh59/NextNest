import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PENDING_LOGIN_COOKIE, SESSION_COOKIE, readPendingLogin, readSessionToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/verify"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const pendingLogin = await readPendingLogin(request.cookies.get(PENDING_LOGIN_COOKIE)?.value);

  if (!session && pathname === "/verify" && !pendingLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!session && !PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"]
};
