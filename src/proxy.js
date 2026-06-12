import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/change-password"]);

export function proxy(req) {
  const { pathname } = req.nextUrl;

  // Always allow auth APIs (need to login before having a cookie).
  // Also allow /api/seed for first-time DB bootstrap.
  if (pathname.startsWith("/api/auth/") || pathname === "/api/seed") {
    return NextResponse.next();
  }

  const hasSession = !!req.cookies.get("bbb_session");

  // Unauthenticated visitors trying to hit a protected page → redirect to login.
  if (!hasSession && !PUBLIC_PATHS.has(pathname) && !pathname.startsWith("/api/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged-in users on /login → push to home (they can still log out from inside).
  if (hasSession && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
