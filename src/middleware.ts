import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/", "/login"]);

/** Page-level gate: signed-out visitors go to /login. API routes check auth themselves. */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !PUBLIC_PATHS.has(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"]
};
