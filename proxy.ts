import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/uploads") ||
    pathname === "/icon.svg" ||
    pathname === "/favicon.ico"
  );
}

function hasSessionCookie(req: NextRequest) {
  return Boolean(
    req.cookies.get("authjs.session-token") ||
      req.cookies.get("__Secure-authjs.session-token") ||
      req.cookies.get("next-auth.session-token") ||
      req.cookies.get("__Secure-next-auth.session-token"),
  );
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!hasSessionCookie(req) && !isPublicPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?from=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (hasSessionCookie(req) && pathname === "/login") {
    const from = req.nextUrl.searchParams.get("from") || "/";
    const dest =
      from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login")
        ? from
        : "/";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)",
  ],
};
